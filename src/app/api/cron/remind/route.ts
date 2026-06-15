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
  const appointments = await readCSV<Appointment>('appointments.csv');
  const clinics = await readCSV<Clinic>('clinics.csv');
  const doctors = await readCSV<Doctor>('doctors.csv');

  const targetAppointments = appointments.filter(
    app => app.date === targetDate && app.status === 'confirmed'
  );

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
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_USER.includes('your_gmail')) {
    return {
      success: false,
      message: `Tìm thấy ${targetAppointments.length} lịch hẹn nhưng chưa cấu hình Gmail SMTP.`,
      totalFound: targetAppointments.length,
      sentSuccessfully: 0,
      failed: targetAppointments.length
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
  });

  let sentCount = 0;
  let failCount = 0;

  for (const app of targetAppointments) {
    const selectedDoctor = doctors.find(d => d.doctor_id.toString() === app.doctor_id.toString());
    const selectedClinic = clinics.find(c => c.clinic_id.toString() === app.clinic_id.toString());

    try {
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
    } catch (err) {
      console.error(`Gửi mail nhắc lịch thất bại cho ${app.patient_email}:`, err);
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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRONSECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Token xác thực cron không hợp lệ.' }, { status: 401 });
  }

  try {
    const tomorrowStr = getVietnamDateStr(1);
    const result = await sendReminders(tomorrowStr);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có quyền thực hiện.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetDate = body.date || getVietnamDateStr(1);

    const result = await sendReminders(targetDate);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi gửi mail nhắc lịch.' }, { status: 500 });
  }
}
