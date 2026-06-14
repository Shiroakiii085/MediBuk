import { NextResponse } from 'next/server';
import { readCSV, Appointment, Clinic, Doctor } from '@/lib/githubDb';
import nodemailer from 'nodemailer';

// Get date string adjusted to Vietnam timezone (GMT+7) with day offset
function getVietnamDateStr(dayOffset = 0): string {
  // Convert UTC time to Vietnam Time (GMT+7)
  const utcTime = new Date().getTime();
  const vnTime = new Date(utcTime + (7 * 60 * 60 * 1000) + (dayOffset * 24 * 60 * 60 * 1000));
  return vnTime.toISOString().split('T')[0];
}

export async function GET(request: Request) {
  // Optional security check: Verify Vercel Cron signature if CRON_SECRET is configured
  // Vercel sends "Authorization: Bearer CRON_SECRET"
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Từ chối truy cập. Token xác thực cron không hợp lệ.' }, { status: 401 });
  }

  try {
    const tomorrowStr = getVietnamDateStr(1); // tomorrow's date (YYYY-MM-DD)
    console.log(`Scanning appointments for tomorrow: ${tomorrowStr}`);

    // Load datasets
    const appointments = await readCSV<Appointment>('appointments.csv');
    const clinics = await readCSV<Clinic>('clinics.csv');
    const doctors = await readCSV<Doctor>('doctors.csv');

    // Filter confirmed appointments for tomorrow
    const tomorrowAppointments = appointments.filter(
      app => app.date === tomorrowStr && app.status === 'confirmed'
    );

    if (tomorrowAppointments.length === 0) {
      return NextResponse.json({ message: `Không có lịch hẹn khám nào vào ngày mai (${tomorrowStr}).` });
    }

    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.warn('Gmail credentials not configured. Skipping email reminders.');
      return NextResponse.json({
        message: `Đã tìm thấy ${tomorrowAppointments.length} lịch hẹn khám, nhưng không thể gửi email do cấu hình SMTP thiếu.`,
        appointments: tomorrowAppointments
      });
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

    for (const app of tomorrowAppointments) {
      const selectedDoctor = doctors.find(d => d.doctor_id.toString() === app.doctor_id.toString());
      const selectedClinic = clinics.find(c => c.clinic_id.toString() === app.clinic_id.toString());
      
      const docName = selectedDoctor ? selectedDoctor.name : 'Bác sĩ chuyên khoa';
      const clinicName = selectedClinic ? selectedClinic.name : 'Bệnh viện liên kết';
      const clinicAddr = selectedClinic ? selectedClinic.address : '';

      try {
        const mailOptions = {
          from: `"MediBuk Y Tế" <${GMAIL_USER}>`,
          to: app.patient_email,
          subject: `[Nhắc Lịch Hẹn] Lịch khám bệnh ngày mai tại MediBuk - Mã ${app.appointment_id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #0284c7; border-bottom: 2px solid #38bdf8; padding-bottom: 10px; margin-top: 0;">Nhắc Nhở Lịch Khám Ngày Mai</h2>
              <p>Xin chào <strong>${app.patient_name}</strong>,</p>
              <p>Đây là thư nhắc nhở lịch khám bệnh của bạn được đặt qua hệ thống <strong>MediBuk</strong> vào ngày mai:</p>
              
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
                <p style="margin: 5px 0;"><strong>Thời gian:</strong> <span style="color: #0369a1; font-weight: bold;">${app.time} ngày mai (${formatDate(app.date)})</span></p>
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
        console.error(`Failed to send reminder email to ${app.patient_email} for booking ${app.appointment_id}:`, err);
        failCount++;
      }
    }

    return NextResponse.json({
      message: `Đã quét và xử lý lịch nhắc hẹn ngày ${tomorrowStr}.`,
      totalFound: tomorrowAppointments.length,
      sentSuccessfully: sentCount,
      failed: failCount
    });

  } catch (error: any) {
    console.error('Cron remind error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống trong tiến trình nhắc lịch.' }, { status: 500 });
  }
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
