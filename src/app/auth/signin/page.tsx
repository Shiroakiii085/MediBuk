'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const urlError = searchParams.get('error');

  const getErrorMessage = (errType: string) => {
    if (errType === 'CredentialsSignin') return 'Email hoặc mật khẩu không đúng.';
    return 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError(result.error || 'Email hoặc mật khẩu không chính xác.');
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-border shadow-lg">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
          <LogIn className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          Đăng nhập tài khoản
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Hoặc{' '}
          <Link href="/auth/signup" className="font-semibold text-primary hover:text-sky-700 transition-colors">
            đăng ký tài khoản bệnh nhân mới
          </Link>
        </p>
      </div>

      {(error || urlError) && (
        <div className="flex items-center gap-x-2 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p>{error || getErrorMessage(urlError || '')}</p>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md">
          <div>
            <label htmlFor="email-address" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-foreground placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-foreground placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-primary py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xác thực...
              </span>
            ) : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-primary-light/30 to-white">
      <Suspense fallback={<div className="text-center text-slate-400 animate-pulse">Đang tải...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
