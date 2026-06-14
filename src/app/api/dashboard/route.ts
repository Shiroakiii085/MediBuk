import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { readCSV, writeCSV, Appointment, Clinic, Doctor } from '@/lib/githubDb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Load datasets
    const appointments = await readCSV<Appointment>('appointments.csv');
    const clinics = await readCSV<Clinic>('clinics.csv');
    const doctors = await readCSV<Doctor>('doctors.csv');

    // Enrich appointments with clinic name and doctor name
    const enrichedAppointments = appointments.map(app => {
      const clinic = clinics.find(c => c.clinic_id.toString() === app.clinic_id.toString());
      const doctor = doctors.find(d => d.doctor_id.toString() === app.doctor_id.toString());
      return {
        ...app,
        clinic_name: clinic ? clinic.name : 'Bệnh viện không xác định',
        clinic_address: clinic ? clinic.address : '',
        doctor_name: doctor ? doctor.name : 'Bác sĩ không xác định',
        doctor_specialty: doctor ? doctor.specialty : ''
      };
    });

    if (role === 'admin') {
      return NextResponse.json({
        role,
        appointments: enrichedAppointments,
        clinics,
        doctors
      });
    } else {
      // Patient: filter by their user_id
      const patientAppointments = enrichedAppointments.filter(
        app => app.user_id.toString() === userId.toString()
      );
      return NextResponse.json({
        role,
        appointments: patientAppointments
      });
    }
  } catch (error: any) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi tải dữ liệu Dashboard.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const body = await request.json();
    const { action } = body;

    // Handle Patient action: cancel booking
    if (action === 'cancelAppointment') {
      const { appointment_id } = body;
      const appointments = await readCSV<Appointment>('appointments.csv');
      const appIndex = appointments.findIndex(app => app.appointment_id === appointment_id);

      if (appIndex === -1) {
        return NextResponse.json({ error: 'Không tìm thấy lịch hẹn cần hủy.' }, { status: 404 });
      }

      // Check authorization (patient can only cancel their own booking)
      if (role !== 'admin' && appointments[appIndex].user_id.toString() !== (session.user as any).id.toString()) {
        return NextResponse.json({ error: 'Không có quyền thực hiện thao tác này.' }, { status: 403 });
      }

      appointments[appIndex].status = 'cancelled';
      await writeCSV<Appointment>('appointments.csv', appointments);

      return NextResponse.json({ message: 'Hủy lịch hẹn thành công!' });
    }

    // Protect administrative actions
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Từ chối truy cập. Chỉ dành cho quản trị viên.' }, { status: 403 });
    }

    // -------------------------------------------------------------
    // CLINIC MANAGEMENT ACTIONS (ADMIN ONLY)
    // -------------------------------------------------------------
    if (action === 'addClinic') {
      const { name, address, lat, lng, specialties } = body;
      if (!name || !address || !specialties) {
        return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ thông tin phòng khám.' }, { status: 400 });
      }

      const clinics = await readCSV<Clinic>('clinics.csv');
      
      // Auto-generate numeric ID
      const nextId = clinics.length > 0 
        ? (Math.max(...clinics.map(c => parseInt(c.clinic_id, 10) || 0)) + 1).toString()
        : '1';

      const newClinic: Clinic = {
        clinic_id: nextId,
        name,
        address,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        specialties
      };

      clinics.push(newClinic);
      await writeCSV<Clinic>('clinics.csv', clinics);
      return NextResponse.json({ message: 'Thêm phòng khám mới thành công!', clinic: newClinic });
    }

    if (action === 'editClinic') {
      const { clinic_id, name, address, lat, lng, specialties } = body;
      if (!clinic_id || !name || !address || !specialties) {
        return NextResponse.json({ error: 'Thiếu thông tin chỉnh sửa.' }, { status: 400 });
      }

      const clinics = await readCSV<Clinic>('clinics.csv');
      const index = clinics.findIndex(c => c.clinic_id.toString() === clinic_id.toString());
      if (index === -1) {
        return NextResponse.json({ error: 'Không tìm thấy phòng khám.' }, { status: 404 });
      }

      clinics[index] = {
        clinic_id: clinic_id.toString(),
        name,
        address,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        specialties
      };

      await writeCSV<Clinic>('clinics.csv', clinics);
      return NextResponse.json({ message: 'Cập nhật phòng khám thành công!' });
    }

    if (action === 'deleteClinic') {
      const { clinic_id } = body;
      let clinics = await readCSV<Clinic>('clinics.csv');
      const exists = clinics.some(c => c.clinic_id.toString() === clinic_id.toString());
      
      if (!exists) {
        return NextResponse.json({ error: 'Không tìm thấy phòng khám cần xóa.' }, { status: 404 });
      }

      clinics = clinics.filter(c => c.clinic_id.toString() !== clinic_id.toString());
      await writeCSV<Clinic>('clinics.csv', clinics);
      return NextResponse.json({ message: 'Xóa phòng khám thành công!' });
    }

    // -------------------------------------------------------------
    // DOCTOR MANAGEMENT ACTIONS (ADMIN ONLY)
    // -------------------------------------------------------------
    if (action === 'addDoctor') {
      const { name, clinic_id, specialty, symptoms_handled, work_hours } = body;
      if (!name || !clinic_id || !specialty || !symptoms_handled || !work_hours) {
        return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ thông tin bác sĩ.' }, { status: 400 });
      }

      const doctors = await readCSV<Doctor>('doctors.csv');
      
      // Auto-generate doc_ID
      const maxNum = doctors.reduce((max, d) => {
        const num = parseInt(d.doctor_id.replace('doc_', ''), 10) || 0;
        return num > max ? num : max;
      }, 0);
      const nextId = `doc_${maxNum + 1}`;

      const newDoctor: Doctor = {
        doctor_id: nextId,
        name,
        clinic_id: clinic_id.toString(),
        specialty,
        symptoms_handled,
        work_hours
      };

      doctors.push(newDoctor);
      await writeCSV<Doctor>('doctors.csv', doctors);
      return NextResponse.json({ message: 'Thêm bác sĩ thành công!', doctor: newDoctor });
    }

    if (action === 'editDoctor') {
      const { doctor_id, name, clinic_id, specialty, symptoms_handled, work_hours } = body;
      if (!doctor_id || !name || !clinic_id || !specialty || !symptoms_handled || !work_hours) {
        return NextResponse.json({ error: 'Thiếu thông tin chỉnh sửa.' }, { status: 400 });
      }

      const doctors = await readCSV<Doctor>('doctors.csv');
      const index = doctors.findIndex(d => d.doctor_id === doctor_id);
      if (index === -1) {
        return NextResponse.json({ error: 'Không tìm thấy bác sĩ.' }, { status: 404 });
      }

      doctors[index] = {
        doctor_id,
        name,
        clinic_id: clinic_id.toString(),
        specialty,
        symptoms_handled,
        work_hours
      };

      await writeCSV<Doctor>('doctors.csv', doctors);
      return NextResponse.json({ message: 'Cập nhật thông tin bác sĩ thành công!' });
    }

    if (action === 'deleteDoctor') {
      const { doctor_id } = body;
      let doctors = await readCSV<Doctor>('doctors.csv');
      const exists = doctors.some(d => d.doctor_id === doctor_id);
      
      if (!exists) {
        return NextResponse.json({ error: 'Không tìm thấy bác sĩ cần xóa.' }, { status: 404 });
      }

      doctors = doctors.filter(d => d.doctor_id !== doctor_id);
      await writeCSV<Doctor>('doctors.csv', doctors);
      return NextResponse.json({ message: 'Xóa bác sĩ thành công!' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    console.error('Dashboard POST error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi thực thi yêu cầu.' }, { status: 500 });
  }
}
