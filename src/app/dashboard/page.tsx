'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, Calendar, Compass, Stethoscope, Clock, CheckCircle2, 
  XCircle, Plus, Edit2, Trash2, Shield, CalendarDays, RefreshCw, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'patient' | 'admin'>('patient');

  // Lists
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Loading & statuses
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Admin Tab: 'appointments' | 'clinics' | 'doctors'
  const [adminTab, setAdminTab] = useState<'appointments' | 'clinics' | 'doctors'>('appointments');

  // Modals state for Admin CRUD
  const [clinicModal, setClinicModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [doctorModal, setDoctorModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });

  // Clinic Form inputs
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicLat, setClinicLat] = useState('21.0285');
  const [clinicLng, setClinicLng] = useState('105.8542');
  const [clinicSpecialties, setClinicSpecialties] = useState('');

  // Doctor Form inputs
  const [doctorName, setDoctorName] = useState('');
  const [doctorClinicId, setDoctorClinicId] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorSymptoms, setDoctorSymptoms] = useState('');
  const [doctorWorkHours, setDoctorWorkHours] = useState('08:00-17:00');

  // Handle URL queries
  useEffect(() => {
    if (searchParams.get('success') === 'booking') {
      setSuccessMsg('Đặt lịch khám bệnh thành công! Bác sĩ đã được ghi nhận.');
    }
  }, [searchParams]);

  // Load dashboard data
  async function loadDashboard() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Không thể lấy thông tin từ hệ thống.');
      const data = await res.json();
      
      setRole(data.role);
      setAppointments(data.appointments || []);
      if (data.role === 'admin') {
        setClinics(data.clinics || []);
        setDoctors(data.doctors || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      loadDashboard();
    }
  }, [session]);

  // -------------------------------------------------------------
  // Patient Actions
  // -------------------------------------------------------------
  const handleCancelAppointment = async (appId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn khám này?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancelAppointment', appointment_id: appId })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Hủy lịch thất bại.');
      } else {
        setSuccessMsg('Đã hủy lịch hẹn khám thành công.');
        loadDashboard();
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối.');
    }
  };

  // -------------------------------------------------------------
  // Clinic Admin Actions
  // -------------------------------------------------------------
  const openClinicModal = (mode: 'add' | 'edit', data?: any) => {
    setClinicModal({ open: true, mode, data });
    if (mode === 'edit' && data) {
      setClinicName(data.name);
      setClinicAddress(data.address);
      setClinicLat(data.lat.toString());
      setClinicLng(data.lng.toString());
      setClinicSpecialties(data.specialties);
    } else {
      setClinicName('');
      setClinicAddress('');
      setClinicLat('21.0285');
      setClinicLng('105.8542');
      setClinicSpecialties('');
    }
  };

  const handleClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    const payload: any = {
      action: clinicModal.mode === 'add' ? 'addClinic' : 'editClinic',
      name: clinicName,
      address: clinicAddress,
      lat: parseFloat(clinicLat) || 0,
      lng: parseFloat(clinicLng) || 0,
      specialties: clinicSpecialties
    };

    if (clinicModal.mode === 'edit') {
      payload.clinic_id = clinicModal.data.clinic_id;
    }

    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Thao tác thất bại.');
      } else {
        setSuccessMsg(data.message);
        setClinicModal({ open: false, mode: 'add' });
        loadDashboard();
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối.');
    }
  };

  const handleDeleteClinic = async (clinicId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng khám này? Tất cả các hiển thị định vị sẽ bị gỡ bỏ.')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteClinic', clinic_id: clinicId })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Xóa thất bại.');
      } else {
        setSuccessMsg(data.message);
        loadDashboard();
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối.');
    }
  };

  // -------------------------------------------------------------
  // Doctor Admin Actions
  // -------------------------------------------------------------
  const openDoctorModal = (mode: 'add' | 'edit', data?: any) => {
    setDoctorModal({ open: true, mode, data });
    if (mode === 'edit' && data) {
      setDoctorName(data.name);
      setDoctorClinicId(data.clinic_id.toString());
      setDoctorSpecialty(data.specialty);
      setDoctorSymptoms(data.symptoms_handled);
      setDoctorWorkHours(data.work_hours);
    } else {
      setDoctorName('');
      setDoctorClinicId(clinics[0]?.clinic_id.toString() || '');
      setDoctorSpecialty('');
      setDoctorSymptoms('');
      setDoctorWorkHours('07:30-11:30,13:30-17:00');
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const payload: any = {
      action: doctorModal.mode === 'add' ? 'addDoctor' : 'editDoctor',
      name: doctorName,
      clinic_id: doctorClinicId,
      specialty: doctorSpecialty,
      symptoms_handled: doctorSymptoms,
      work_hours: doctorWorkHours
    };

    if (doctorModal.mode === 'edit') {
      payload.doctor_id = doctorModal.data.doctor_id;
    }

    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Thao tác thất bại.');
      } else {
        setSuccessMsg(data.message);
        setDoctorModal({ open: false, mode: 'add' });
        loadDashboard();
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối.');
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bác sĩ này khỏi danh sách?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteDoctor', doctor_id: doctorId })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Xóa thất bại.');
      } else {
        setSuccessMsg(data.message);
        loadDashboard();
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối.');
    }
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500 animate-pulse">
        Đang đồng bộ dữ liệu Dashboard từ GitHub CSV...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-3xl p-8 mb-8 shadow-xl shadow-emerald-500/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Xin chào, {session?.user.name}!</h1>
            <p className="text-emerald-100 mt-1">
              Quyền hạn: <span className="font-bold uppercase tracking-wider">{role === 'admin' ? 'Quản trị viên' : 'Bệnh nhân'}</span>
            </p>
          </div>
          {role === 'patient' && (
            <Link
              href="/booking"
              className="px-6 py-3.5 bg-white text-emerald-700 font-bold rounded-xl shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
            >
              Đặt lịch khám mới
            </Link>
          )}
        </div>
      </div>

      {/* Message alerts */}
      {errorMsg && (
        <div className="flex items-center gap-x-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700 mb-6">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-x-2 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 mb-6 animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* -------------------------------------------------------------
          PATIENT WORKSPACE VIEW
          ------------------------------------------------------------- */}
      {role === 'patient' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-x-2">
            <CalendarDays className="h-5 w-5 text-emerald-500" />
            Lịch hẹn của tôi
          </h2>

          {appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Bạn chưa có bất kỳ lịch hẹn khám nào. <br />
              <Link href="/booking" className="text-emerald-600 font-semibold hover:underline mt-2 inline-block">
                Đặt lịch khám đầu tiên của bạn ngay!
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã lịch hẹn</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông tin bác sĩ & Phòng khám</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Triệu chứng</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-sm">
                  {appointments.map((app) => (
                    <tr key={app.appointment_id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">{app.appointment_id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{app.doctor_name}</div>
                        <div className="text-xs text-emerald-700 font-semibold">{app.doctor_specialty}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{app.clinic_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{app.time}</div>
                        <div className="text-xs text-slate-500">{formatDate(app.date)} ({app.duration_minutes} phút)</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={app.symptom}>{app.symptom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-x-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          app.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {app.status === 'confirmed' ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Xác nhận
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Đã hủy
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {app.status === 'confirmed' ? (
                          <button
                            onClick={() => handleCancelAppointment(app.appointment_id)}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors"
                          >
                            Hủy lịch
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Không khả dụng</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          ADMIN WORKSPACE VIEW
          ------------------------------------------------------------- */}
      {role === 'admin' && (
        <div className="space-y-8">
          
          {/* Admin Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số lịch hẹn</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{appointments.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bệnh viện liên kết</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{clinics.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Compass className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bác sĩ phụ trách</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{doctors.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Stethoscope className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Admin Control Tabs */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
              <div className="flex space-x-2">
                {[
                  { key: 'appointments' as const, label: 'Quản lý Lịch hẹn' },
                  { key: 'clinics' as const, label: 'Quản lý Phòng khám' },
                  { key: 'doctors' as const, label: 'Quản lý Bác sĩ' }
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setAdminTab(t.key)}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                      adminTab === t.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Add buttons depending on tab */}
              {adminTab === 'clinics' && (
                <button
                  onClick={() => openClinicModal('add')}
                  className="flex items-center gap-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm Bệnh viện</span>
                </button>
              )}

              {adminTab === 'doctors' && (
                <button
                  onClick={() => openDoctorModal('add')}
                  className="flex items-center gap-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm Bác sĩ</span>
                </button>
              )}
            </div>

            {/* TAB CONTENTS */}
            <div className="p-8">
              
              {/* Tab 1: Appointments List */}
              {adminTab === 'appointments' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Mã</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Bệnh nhân</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Bác sĩ & Phòng khám</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Thời gian</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-sm">
                      {appointments.map((app) => (
                        <tr key={app.appointment_id}>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">{app.appointment_id}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{app.patient_name}</div>
                            <div className="text-xs text-slate-500">{app.patient_email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{app.doctor_name}</div>
                            <div className="text-xs text-emerald-700 font-medium">{app.doctor_specialty}</div>
                            <div className="text-xs text-slate-400">{app.clinic_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{app.time}</div>
                            <div className="text-xs text-slate-500">{formatDate(app.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-x-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {app.status === 'confirmed' ? 'Xác nhận' : 'Đã hủy'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {app.status === 'confirmed' ? (
                              <button
                                onClick={() => handleCancelAppointment(app.appointment_id)}
                                className="text-rose-600 hover:text-rose-800 font-semibold text-xs border border-rose-100 rounded-lg px-2.5 py-1"
                              >
                                Hủy lịch
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Đã kết thúc</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Clinics list */}
              {adminTab === 'clinics' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Mã PK</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Tên phòng khám</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Địa chỉ & Định vị</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Chuyên khoa</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-sm">
                      {clinics.map((c) => (
                        <tr key={c.clinic_id}>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">{c.clinic_id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                          <td className="px-6 py-4">
                            <div>{c.address}</div>
                            <div className="text-xs text-slate-400 mt-0.5">Tọa độ: {c.lat}, {c.lng}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {c.specialties.split(';').map((spec: string, i: number) => (
                                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => openClinicModal('edit', c)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Sửa"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClinic(c.clinic_id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Doctors list */}
              {adminTab === 'doctors' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Mã BS</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Bác sĩ</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Thuộc phòng khám</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Chuyên khoa</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Triệu chứng xử lý</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-sm">
                      {doctors.map((d) => {
                        const clinic = clinics.find(c => c.clinic_id.toString() === d.clinic_id.toString());
                        return (
                          <tr key={d.doctor_id}>
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">{d.doctor_id}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{d.name}</div>
                              <div className="text-xs text-slate-400">Giờ khám: {d.work_hours}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{clinic ? clinic.name : `Mã PK: ${d.clinic_id}`}</td>
                            <td className="px-6 py-4 font-semibold text-emerald-700">{d.specialty}</td>
                            <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={d.symptoms_handled}>{d.symptoms_handled}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => openDoctorModal('edit', d)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Sửa"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDoctor(d.doctor_id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>

          {/* -------------------------------------------------------------
              CRUD MODALS - POPUPS
              ------------------------------------------------------------- */}

          {/* Clinic Modal */}
          {clinicModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                  <h3 className="font-bold">{clinicModal.mode === 'add' ? 'Thêm phòng khám mới' : 'Chỉnh sửa phòng khám'}</h3>
                  <button onClick={() => setClinicModal({ open: false, mode: 'add' })} className="text-slate-400 hover:text-white font-bold">✕</button>
                </div>
                <form onSubmit={handleClinicSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên phòng khám / Bệnh viện</label>
                    <input
                      type="text"
                      required
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Bệnh viện Bạch Mai"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ chi tiết</label>
                    <input
                      type="text"
                      required
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Số 78 Giải Phóng, Đống Đa, Hà Nội"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Vĩ độ (Lat)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={clinicLat}
                        onChange={(e) => setClinicLat(e.target.value)}
                        className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Kinh độ (Lng)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={clinicLng}
                        onChange={(e) => setClinicLng(e.target.value)}
                        className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Danh sách chuyên khoa (Phân cách bằng dấu chấm phẩy ';')</label>
                    <input
                      type="text"
                      required
                      value={clinicSpecialties}
                      onChange={(e) => setClinicSpecialties(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Nội tổng quát;Nhi;Da liễu;Tim mạch"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setClinicModal({ open: false, mode: 'add' })}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Doctor Modal */}
          {doctorModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                  <h3 className="font-bold">{doctorModal.mode === 'add' ? 'Thêm bác sĩ mới' : 'Chỉnh sửa thông tin bác sĩ'}</h3>
                  <button onClick={() => setDoctorModal({ open: false, mode: 'add' })} className="text-slate-400 hover:text-white font-bold">✕</button>
                </div>
                <form onSubmit={handleDoctorSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên bác sĩ</label>
                    <input
                      type="text"
                      required
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="BS. Nguyễn Văn An"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bệnh viện trực thuộc</label>
                    <select
                      value={doctorClinicId}
                      onChange={(e) => setDoctorClinicId(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    >
                      {clinics.map(c => (
                        <option key={c.clinic_id} value={c.clinic_id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chuyên khoa</label>
                    <input
                      type="text"
                      required
                      value={doctorSpecialty}
                      onChange={(e) => setDoctorSpecialty(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="Da liễu (Phải nằm trong danh sách chuyên khoa của bệnh viện chọn)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Triệu chứng xử lý (Phân cách bằng dấu chấm phẩy ';')</label>
                    <input
                      type="text"
                      required
                      value={doctorSymptoms}
                      onChange={(e) => setDoctorSymptoms(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="ngứa;mẩn đỏ;mụn;dị ứng da"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Khung giờ làm việc</label>
                    <input
                      type="text"
                      required
                      value={doctorWorkHours}
                      onChange={(e) => setDoctorWorkHours(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="07:30-11:30,13:30-17:00"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDoctorModal({ open: false, mode: 'add' })}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 animate-pulse">Đang tải Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
