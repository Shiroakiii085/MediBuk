'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { User, Phone, MapPin, Mail, Lock, Shield, KeyRound, AlertCircle, CheckCircle2, Save, Crosshair } from 'lucide-react';
import { geocodeAddress } from '@/lib/geocode';

// Load map dynamically to prevent SSR errors
const LeafletMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full bg-slate-100 flex items-center justify-center text-sm text-slate-500 rounded-2xl animate-pulse">
      Đang tải bản đồ định vị...
    </div>
  )
});

export default function AccountPage() {
  const { data: session, update: updateSession } = useSession();
  
  // Profile form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(21.0285);
  const [lng, setLng] = useState(105.8542);
  
  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status state
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  // Fetch current user details
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Không thể tải thông tin profile.');
        const data = await res.json();
        
        if (data.profile) {
          setEmail(data.profile.email);
          setFullName(data.profile.full_name);
          setPhone(data.profile.phone);
          setAddress(data.profile.address);
          setLat(data.profile.lat || 21.0285);
          setLng(data.profile.lng || 105.8542);
        }
      } catch (err: any) {
        setProfileError(err.message || 'Lỗi tải dữ liệu.');
      } finally {
        setProfileLoading(false);
      }
    }

    if (session) {
      fetchProfile();
    }
  }, [session]);

  const handleAutoGeocode = async () => {
    if (!address.trim()) return;
    setGeoLoading(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setLat(result.lat);
        setLng(result.lng);
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfile',
          full_name: fullName,
          address,
          lat,
          lng,
          phone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileError(data.error || 'Lỗi cập nhật thông tin.');
      } else {
        setProfileSuccess('Cập nhật thông tin tài khoản thành công!');
        // Update Session name
        await updateSession({ name: fullName });
      }
    } catch (err) {
      setProfileError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePassword',
          oldPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Lỗi thay đổi mật khẩu.');
      } else {
        setPasswordSuccess('Thay đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleMapSelect = (selectedLat: number, selectedLng: number) => {
    setLat(parseFloat(selectedLat.toFixed(6)));
    setLng(parseFloat(selectedLng.toFixed(6)));
  };

  if (profileLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center py-20">
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin mb-4" width="48" height="48" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="22" width="48" height="20" rx="4" fill="#dc2626" />
              <rect x="22" y="8" width="20" height="48" rx="4" fill="#dc2626" />
            </svg>
            <p className="text-sm font-medium text-slate-600 animate-pulse">Đang tải thông tin tài khoản...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tài khoản của tôi</h1>
        <p className="mt-2 text-sm text-slate-500">Quản lý thông tin hồ sơ bệnh nhân, định vị địa lý và mật khẩu cá nhân.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Profile Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-x-2 mb-6">
              <User className="h-5 w-5 text-primary" />
              Thông tin cá nhân
            </h2>

            {profileError && (
              <div className="flex items-center gap-x-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700 mb-6">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p>{profileError}</p>
              </div>
            )}

            {profileSuccess && (
              <div className="flex items-center gap-x-2 rounded-xl bg-primary-light border border-sky-100 p-4 text-sm text-primary mb-6 animate-fadeIn">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <p>{profileSuccess}</p>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Email (Readonly) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Địa chỉ Email (Không thể sửa)</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-slate-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* SĐT */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                      placeholder="0912345678"
                    />
                  </div>
                </div>

                {/* Họ tên */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và Tên</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                {/* Địa chỉ */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ hiện tại</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-12 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                      placeholder="Số nhà, Tên đường, Quận, Tỉnh"
                    />
                    <button
                      type="button"
                      onClick={handleAutoGeocode}
                      disabled={geoLoading || !address.trim()}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-600 hover:text-primary disabled:text-slate-300 transition-colors"
                      title="Tự động lấy tọa độ từ địa chỉ"
                    >
                      <Crosshair className={`h-5 w-5 ${geoLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Nhấn biểu tượng GPS để tự động cập nhật tọa độ</p>
                </div>

                {/* Tọa độ Lat */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-xl border border-slate-300 py-3 px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  />
                </div>

                {/* Tọa độ Lng */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-xl border border-slate-300 py-3 px-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  />
                </div>

              </div>

              {/* Dynamic Map Selector */}
              <div className="mt-4">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Chọn vị trí nhanh trên bản đồ (Click vào bản đồ để lấy tọa độ)</span>
                <div className="h-[350px]">
                  <LeafletMap 
                    center={[lat, lng]} 
                    markers={[{ lat, lng, title: fullName || "Vị trí của bạn", color: 'blue' }]} 
                    onLocationSelect={handleMapSelect} 
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="flex items-center gap-x-2 px-6 py-3 bg-primary hover:bg-sky-700 text-white font-semibold rounded-xl shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  <span>{profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Change Password Form */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-x-2 mb-6">
              <KeyRound className="h-5 w-5 text-primary" />
              Đổi mật khẩu
            </h2>

            {passwordError && (
              <div className="flex items-center gap-x-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700 mb-6">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p>{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-x-2 rounded-xl bg-primary-light border border-sky-100 p-4 text-sm text-primary mb-6">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <p>{passwordSuccess}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu cũ</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Shield className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full flex items-center justify-center gap-x-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors active:scale-95 disabled:opacity-50"
                >
                  <span>{passwordSaving ? 'Đang đổi...' : 'Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
