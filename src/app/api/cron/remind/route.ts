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

// Shared logic: find appointments and send reminder emails
async function sendReminders(targetDate: string) {
  console.log(`[REMIND] Reading CSV data for date: ${targetDate}`);
  const appointments = await readCSV<Appointment>('appointments.csv');
  const clinics = await readCSV<Clinic>('clinics.csv');
  const doctors = await readCSV<Doctor>('doctors.csv');
  console.log(`[REMIND] CSV loaded: ${appointments.length} appointments, ${clinics.length} clinics, ${doctors.length} doctors`);

  // Filter confirmed appointments for target date
  const targetAppointments = appointments.filter(
    app => app.date === targetDate && app.status === 'confirmed'
  );
  console.log(`[REMIND] Found ${targetAppointments.length} confirmed appointments for ${targetDate}`);

  if (targetAppointments.length === 0) {
    return {
      success: true,
      message: `Không có lịch hẹn khám nào vào ngày ${formatDate(targetDate)}.`,
      totalFound: 0,
      sentSuccessfully: 0,
      failed: 0
    };
  }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''); // Remove any spaces

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_USER.includes('your_gmail')) {
    return {
      success: false,
      message: `Tìm thấy ${targetAppointments.length} lịch hẹn nhưng chưa cấu hình Gmail SMTP. Vui lòng 设置 GMAIL_USER và GMAIL_APP_PASSWORD.`,
      totalFound: targetAppointments.length,
      sentSuccessfully: 0,
      failed: targetAppointments.length
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });

  let sentCount = 0;
  let failCount = 0;

  for (const app of targetAppointments) {
    const selectedDoctor = doctors.find(d => d.doctor_id.toString() === app.doctor_id.toString());
    const selectedClinic = clinics.find(c => c.clinic_id.toString() === app.clinic_id.toString());

    const docName = selectedDoctor ? selectedDoctor.name : 'Bác sĩ chuyên khoa';
    const clinicName = selectedClinic ? selectedClinic.name : 'Bệnh viện liên kết';
    const clinicAddr = selectedClinic ? selectedClinic.address : '';

    try {
      const mailOptions = {
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
              <p style="margin: 5px 0;"><strong>Bác sĩ khám:</strong> ${docName}</p>
              <p style="margin: 5px 0;"><strong>Bệnh viện:</strong> ${clinicName}</p>
              <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${clinicAddr}</p>
              <p style="margin: 5px 0;"><strong>Thời lượng dự kiến:</strong> ${app.duration_minutes} phút</p>
              <p style="margin: 5px 0;"><strong>Triệu chứng đã ghi nhận:</strong> ${app.symptom}</p>
            </div>

            <p>Vui lòng đến đúng giờ để có trải nghiệm khám chữa bệnh tốt nhất. Nếu bạn có thay đổi đột xuất, hãy truy cập vào Dashboard để quản lý lịch hẹn.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">Cảm ơn bạn đã lựa chọn dịch vụ đặt lịch khám trực tuyến MediBuk.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      sentCount++;
    } catch (err) {
      console.error(`Failed to send reminder to ${app.patient_email}:`, err);
      failCount++;
    }
  }

  return {
    success: true,
    message: `Đã gửi nhắc lịch cho ngày ${formatDate(targetDate)}.`,
    totalFound: targetAppointments.length,
    sentSuccessfully: sentCount,
    failed: failCount
  };
}

// GET: Vercel cron auto-trigger (daily)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRONSECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Token xác thực cron không hợp lệ.' }, { status: 401 });
  }

  try {
    const tomorrowStr = getVietnamDateStr(1);
    console.log(`[CRON] Scanning appointments for tomorrow: ${tomorrowStr}`);
    const result = await sendReminders(tomorrowStr);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Cron remind error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống.' }, { status: 500 });
  }
}

// POST: Admin manual trigger
export async function POST(request: Request) {
  try {
    console.log('[ADMIN] Reminder POST request received');
    
    const session = await getServerSession(authOptions);
    console.log('[ADMIN] Session:', session ? `user=${session.user?.name}, role=${(session.user as any)?.role}` : 'null');
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có quyền thực hiện. Vui lòng đăng nhập lại.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetDate = body.date || getVietnamDateStr(1);
    console.log(`[ADMIN] Manual reminder trigger for date: ${targetDate}`);

    const result = await sendReminders(targetDate);
    console.log('[ADMIN] Result:', JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ADMIN] Manual remind error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi gửi mail nhắc lịch.' }, { status: 500 });
  }
}
