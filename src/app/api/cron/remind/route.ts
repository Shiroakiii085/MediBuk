import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { readCSV, Appointment, Clinic, Doctor } from '@/lib/githubDb';
import nodemailer from 'nodemailer';

// Get date string adjusted to Vietnam timezone (GMT+7) with day offset
function getVietnamDateStr(dayOffset = 0): string {
  const utcTime = new Date().getTime();
  const vnTime = new Date(utcTime + (7 * 60 * 60 * 1000) + (dayOffset * 24 * 60 * 60 * 1000));
  return vnTime.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[CRON-REMIND ${timestamp}] ${message}`);
}

// Shared logic: find appointments and send reminder emails
async function sendReminders(targetDate: string) {
  log(`Bắt đầu gửi nhắc lịch cho ngày: ${targetDate} (${formatDate(targetDate)})`);

  // Step 1: Read CSV data
  log('Đang đọc dữ liệu CSV...');
  const appointments = await readCSV<Appointment>('appointments.csv');
  const clinics = await readCSV<Clinic>('clinics.csv');
  const doctors = await readCSV<Doctor>('doctors.csv');
  log(`Đã đọc: ${appointments.length} appointments, ${clinics.length} clinics, ${doctors.length} doctors`);

  // Step 2: Filter appointments for target date
  const targetAppointments = appointments.filter(
    app => app.date === targetDate && app.status === 'confirmed'
  );
  log(`Tìm thấy ${targetAppointments.length} lịch hẹn confirmed cho ngày ${formatDate(targetDate)}`);

  if (targetAppointments.length === 0) {
    log('Không có lịch hẹn nào cần gửi nhắc.');
    return {
      success: true,
      message: `Không có lịch hẹn khám nào vào ngày ${formatDate(targetDate)}.`,
      totalFound: 0,
      sentSuccessfully: 0,
      failed: 0,
      checkedAt: new Date().toISOString()
    };
  }

  // Log details of each appointment
  targetAppointments.forEach((app, idx) => {
    const doctor = doctors.find(d => d.doctor_id.toString() === app.doctor_id.toString());
    const clinic = clinics.find(c => c.clinic_id.toString() === app.clinic_id.toString());
    log(`  [${idx + 1}] ${app.patient_name} (${app.patient_email}) - BS: ${doctor?.name || 'N/A'} - BV: ${clinic?.name || 'N/A'} - ${app.time}`);
  });

  // Step 3: Check Gmail config
  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_USER.includes('your_gmail')) {
    log('LỖI: Chưa cấu hình Gmail SMTP!');
    return {
      success: false,
      message: `Tìm thấy ${targetAppointments.length} lịch hẹn nhưng chưa cấu hình Gmail SMTP.`,
      totalFound: targetAppointments.length,
      sentSuccessfully: 0,
      failed: targetAppointments.length,
      error: 'Gmail not configured',
      checkedAt: new Date().toISOString()
    };
  }

  log(`Gmail configured: ${GMAIL_USER}`);

  // Step 4: Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
  });

  // Step 5: Send emails
  let sentCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (const app of targetAppointments) {
    const selectedDoctor = doctors.find(d => d.doctor_id.toString() === app.doctor_id.toString());
    const selectedClinic = clinics.find(c => c.clinic_id.toString() === app.clinic_id.toString());

    try {
      log(`Đ gửi mail cho ${app.patient_email}...`);
      await transporter.sendMail({
        from: `"MediBuk Y Tế" <${GMAIL_USER}>`,
        to: app.patient_email,
        subject: `[Nhắc Lịch Hẹn] Lịch khám bệnh ngày ${formatDate(targetDate)} - Mã ${app.appointment_id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #0284c7; border-bottom: 2px solid #38bdf8; padding-bottom: 10px; margin-top: 0;">Nhắc Nhở Lịch Khám Bệnh</h2>
            <p>Xin chào <strong>${app.patient_name}</strong>,</p>
            <p>Đây là thư nhắc nhở lịch khám bệnh của bạn được đặt qua hệ thống <strong>MediBuk</strong>:</p>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
              <p style="margin: 5px 0;"><strong>Thời gian:</strong> <span style="color: #0369a1; font-weight: bold;">${app.time} ngày ${formatDate(app.date)}</span></p>
              <p style="margin: 5px 0;"><strong>Bác sĩ khám:</strong> ${selectedDoctor?.name || 'Bác sĩ chuyên khoa'}</p>
              <p style="margin: 5px 0;"><strong>Bệnh viện:</strong> ${selectedClinic?.name || 'Bệnh viện liên kết'}</p>
              <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${selectedClinic?.address || ''}</p>
              <p style="margin: 5px 0;"><strong>Thời lượng dự kiến:</strong> ${app.duration_minutes} phút</p>
              <p style="margin: 5px 0;"><strong>Triệu chứng đã ghi nhận:</strong> ${app.symptom}</p>
            </div>

            <p>Vui lòng đến đúng giờ để có trải nghiệm khám chữa bệnh tốt nhất.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">Cảm ơn bạn đã lựa chọn dịch vụ đặt lịch khám trực tuyến MediBuk.</p>
          </div>
        `
      });
      sentCount++;
      log(`  ✓ Gửi thành công cho ${app.patient_email}`);
    } catch (err: any) {
      failCount++;
      const errMsg = err.message || 'Unknown error';
      errors.push(`${app.patient_email}: ${errMsg}`);
      log(`  ✗ Gửi thất bại cho ${app.patient_email}: ${errMsg}`);
    }
  }

  log(`Kết quả: ${sentCount} thành công, ${failCount} thất bại`);

  return {
    success: failCount === 0,
    message: failCount === 0
      ? `Đã gửi nhắc lịch cho ${sentCount} bệnh nhân vào ngày ${formatDate(targetDate)}.`
      : `Đã gửi ${sentCount}/${targetAppointments.length} email. ${failCount} email gửi thất bại.`,
    totalFound: targetAppointments.length,
    sentSuccessfully: sentCount,
    failed: failCount,
    errors: errors.length > 0 ? errors : undefined,
    checkedAt: new Date().toISOString()
  };
}

// GET: Called by Vercel cron OR external cron (cron-job.org)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');
  const cronSecret = process.env.CRONSECRET;
  const cronApiKey = process.env.CRON_API_KEY;

  log(`GET request received - Auth: ${authHeader ? 'Bearer' : 'none'}, API-Key: ${apiKeyHeader ? 'present' : 'none'}`);

  // Auth check: support both Vercel cron (Bearer) and external cron (x-api-key)
  const isValidBearer = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isValidApiKey = cronApiKey && apiKeyHeader === cronApiKey;

  // If either secret is configured, require valid auth
  if ((cronSecret || cronApiKey) && !isValidBearer && !isValidApiKey) {
    log('AUTH FAILED: Invalid or missing credentials');
    return NextResponse.json({
      error: 'Token xác thực không hợp lệ.',
      hint: 'Sử dụng header "Authorization: Bearer <CRONSECRET>" hoặc "x-api-key: <CRON_API_KEY>"'
    }, { status: 401 });
  }

  try {
    const tomorrowStr = getVietnamDateStr(1);
    log(`Target date (tomorrow): ${tomorrowStr}`);
    const result = await sendReminders(tomorrowStr);
    return NextResponse.json(result);
  } catch (error: any) {
    log(`LỖI HỆ THỐNG: ${error.message}`);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống.' }, { status: 500 });
  }
}

// POST: Called manually from Dashboard (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      log('POST forbidden: Non-admin user');
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có quyền thực hiện.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetDate = body.date || getVietnamDateStr(1);
    log(`POST request from admin: ${session.user?.email} - target date: ${targetDate}`);

    const result = await sendReminders(targetDate);
    return NextResponse.json(result);
  } catch (error: any) {
    log(`POST LỖI: ${error.message}`);
    return NextResponse.json({ error: error.message || 'Lỗi gửi mail nhắc lịch.' }, { status: 500 });
  }
}
