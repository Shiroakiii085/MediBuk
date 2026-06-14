import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { readCSV, writeCSV, Clinic, Doctor, Appointment } from '@/lib/githubDb';
import nodemailer from 'nodemailer';

// Helper to convert time "HH:MM" to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Check if two time intervals overlap
function isOverlapping(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && s2 < e1;
}

export async function GET() {
  try {
    const clinics = await readCSV<Clinic>('clinics.csv');
    const doctors = await readCSV<Doctor>('doctors.csv');
    return NextResponse.json({ clinics, doctors });
  } catch (error: any) {
    return NextResponse.json({ error: 'Không thể tải danh sách phòng khám hoặc bác sĩ.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Chưa đăng nhập. Vui lòng đăng nhập để thực hiện đặt lịch.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { 
      patient_name, 
      patient_email, 
      doctor_id, 
      clinic_id, 
      date, 
      time, 
      duration_minutes, 
      symptom 
    } = body;

    // Validate request inputs
    if (!patient_name || !patient_email || !doctor_id || !clinic_id || !date || !time || !symptom) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ các thông tin lịch hẹn.' }, { status: 400 });
    }

    const duration = parseInt(duration_minutes, 10) || 30;

    // Read doctors, clinics, appointments
    const clinics = await readCSV<Clinic>('clinics.csv');
    const doctors = await readCSV<Doctor>('doctors.csv');
    const appointments = await readCSV<Appointment>('appointments.csv');

    const selectedClinic = clinics.find(c => c.clinic_id.toString() === clinic_id.toString());
    const selectedDoctor = doctors.find(d => d.doctor_id.toString() === doctor_id.toString());

    if (!selectedClinic || !selectedDoctor) {
      return NextResponse.json({ error: 'Thông tin phòng khám hoặc bác sĩ không tồn tại.' }, { status: 400 });
    }

    // 1. Conflict Check: Filter active appointments of the same doctor on the same date
    const doctorDayAppointments = appointments.filter(
      app => app.doctor_id.toString() === doctor_id.toString() && 
             app.date === date && 
             app.status === 'confirmed'
    );

    const reqStart = timeToMinutes(time);
    const reqEnd = reqStart + duration;

    // Validate work hours boundary if doctor has work hours defined
    // Work hours is usually "08:00-17:00" or "07:30-11:30,13:30-17:00"
    // For simplicity, we check if the requested time is overlapping with any booked slots
    const collision = doctorDayAppointments.find(app => {
      const appStart = timeToMinutes(app.time);
      const appEnd = appStart + (parseInt(app.duration_minutes as any, 10) || 30);
      return isOverlapping(reqStart, reqEnd, appStart, appEnd);
    });

    if (collision) {
      // Find all occupied slots on this day to return to the user
      const occupiedSlots = doctorDayAppointments.map(app => ({
        time: app.time,
        duration: app.duration_minutes,
        display: `${app.time} - ${minutesToTimeStr(timeToMinutes(app.time) + (parseInt(app.duration_minutes as any, 10) || 30))}`
      }));

      return NextResponse.json({
        error: 'Khung giờ này đã có người đặt, vui lòng chọn giờ khác hoặc ngày khác.',
        occupiedSlots
      }, { status: 409 });
    }

    // 2. Write appointment details to CSV
    const newAppointment: Appointment = {
      appointment_id: `apt_${Date.now()}`,
      user_id: userId,
      patient_name,
      patient_email,
      doctor_id,
      clinic_id,
      date,
      time,
      duration_minutes: duration,
      status: 'confirmed',
      symptom
    };

    appointments.push(newAppointment);
    await writeCSV<Appointment>('appointments.csv', appointments);

    // 3. Send email confirmation via Nodemailer
    const GMAIL_USER = process.env.GMAIL_USER;
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

    if (GMAIL_USER && GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD
          }
        });

        const mailOptions = {
          from: `"MediBuk Y Tế" <${GMAIL_USER}>`,
          to: patient_email,
          subject: `[MediBuk] Xác nhận đặt lịch khám thành công - Mã số ${newAppointment.appointment_id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #059669; border-bottom: 2px solid #34d399; padding-bottom: 10px; margin-top: 0;">Đặt Lịch Khám Thành Công</h2>
              <p>Xin chào <strong>${patient_name}</strong>,</p>
              <p>Lịch hẹn khám bệnh của bạn đã được xác nhận thành công trên hệ thống <strong>MediBuk</strong>. Thông tin chi tiết như sau:</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <p style="margin: 5px 0;"><strong>Bác sĩ khám:</strong> ${selectedDoctor.name}</p>
                <p style="margin: 5px 0;"><strong>Chuyên khoa:</strong> ${selectedDoctor.specialty}</p>
                <p style="margin: 5px 0;"><strong>Bệnh viện:</strong> ${selectedClinic.name}</p>
                <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${selectedClinic.address}</p>
                <p style="margin: 5px 0;"><strong>Thời gian:</strong> ${time} ngày ${formatDate(date)}</p>
                <p style="margin: 5px 0;"><strong>Thời lượng dự kiến:</strong> ${duration} phút</p>
                <p style="margin: 5px 0;"><strong>Triệu chứng:</strong> ${symptom}</p>
              </div>

              <p>Vui lòng đến trước giờ khám khoảng 10-15 phút và mang theo giấy tờ tùy thân cần thiết.</p>
              <p>Nếu bạn muốn hủy hoặc thay đổi lịch hẹn, vui lòng truy cập vào Dashboard tài khoản cá nhân của bạn.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">Đây là email tự động từ hệ thống đặt lịch khám MediBuk. Vui lòng không phản hồi thư này.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Confirmation email sent successfully to ${patient_email}`);
      } catch (emailErr) {
        console.error('Failed to send nodemailer confirmation email:', emailErr);
        // Do not fail the whole request because email sending failed; booking is already recorded!
      }
    } else {
      console.log('Nodemailer configuration missing. Emailed:');
      console.log(`To: ${patient_email}\nSubject: Confirmation\nDoctor: ${selectedDoctor.name}, Clinic: ${selectedClinic.name}, Date: ${date}, Time: ${time}`);
    }

    return NextResponse.json({ 
      message: 'Đặt lịch khám sức khỏe thành công!', 
      appointment: newAppointment 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Booking post error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý đặt lịch khám.' }, { status: 500 });
  }
}

// Convert minutes from midnight back to time string "HH:MM"
function minutesToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Format date to Vietnamese format DD/MM/YYYY
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
