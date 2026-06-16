'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, MapPin, Phone, AlertCircle, CheckCircle2, Crosshair } from 'lucide-react';
import { geocodeAddress } from '@/lib/geocode';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('21.0285');
  const [lng, setLng] = useState('105.8542');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleAutoGeocode = async () => {
    if (!address.trim()) return;
    setGeoLoading(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setLat(result.lat.toString());
        setLng(result.lng.toString());
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          address,
          lat: parseFloat(lat) || 0,
          lng: parseFloat(lng) || 0,
          phone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra trong quá trình đăng ký.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2500);
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-light/30 to-white">
      <div className="w-full max-w-lg space-y-8 bg-white p-8 rounded-2xl border border-border shadow-lg">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
            Đăng ký tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/auth/signin" className="font-semibold text-primary hover:text-sky-700 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-x-2 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-x-2 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 animate-pulse">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p>Đăng ký thành công! Hệ thống đang chuyển hướng tới trang Đăng nhập...</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Họ và Tên
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-foreground placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-foreground placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-foreground placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                  placeholder="0912345678"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-foreground placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                  placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Địa chỉ cư trú
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-12 text-foreground placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                  placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố"
                />
                <button
                  type="button"
                  onClick={handleAutoGeocode}
                  disabled={geoLoading || !address.trim()}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary hover:text-sky-700 disabled:text-slate-300 transition-colors cursor-pointer"
                  title="Tự động lấy tọa độ từ địa chỉ"
                >
                  <Crosshair className={`h-5 w-5 ${geoLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Nhấn biểu tượng GPS để tự động lấy tọa độ vĩ độ, kinh độ</p>
            </div>

            <div>
              <label htmlFor="lat" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Vĩ độ (Latitude)
              </label>
              <input
                id="lat"
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-3 text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                placeholder="21.0285"
              />
            </div>

            <div>
              <label htmlFor="lng" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Kinh độ (Longitude)
              </label>
              <input
                id="lng"
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-3 text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                placeholder="105.8542"
              />
            </div>
            
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? 'Đang xử lý đăng ký...' : 'Đăng ký tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
