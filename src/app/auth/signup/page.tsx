'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, MapPin, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('21.0285'); // default to Hanoi
  const [lng, setLng] = useState('105.8542'); // default to Hanoi
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/20 to-white">
      <div className="w-full max-w-lg space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Đăng ký tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/auth/signin" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-x-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
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
            
            {/* Họ tên */}
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
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            {/* Email */}
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
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Số điện thoại */}
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
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                  placeholder="0912345678"
                />
              </div>
            </div>

            {/* Mật khẩu */}
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
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                  placeholder="Tối thiểu 6 ký tự"
                  minLength={6}
                />
              </div>
            </div>

            {/* Địa chỉ */}
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
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                  placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố"
                />
              </div>
            </div>

            {/* Vĩ độ (Lat) */}
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
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-3 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="21.0285"
              />
            </div>

            {/* Kinh độ (Lng) */}
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
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-3 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="105.8542"
              />
            </div>
            
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center rounded-xl bg-emerald-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 hover:shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Đang xử lý đăng ký...' : 'Đăng ký tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
