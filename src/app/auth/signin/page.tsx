'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const urlError = searchParams.get('error');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

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
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <LogIn className="h-6 w-6" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Đăng nhập tài khoản
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Hoặc{' '}
          <Link href="/auth/signup" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
            đăng ký tài khoản bệnh nhân mới
          </Link>
        </p>
      </div>

      {(error || urlError) && (
        <div className="flex items-center gap-x-2 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
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
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
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
                className="block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-emerald-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 hover:shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </div>
      </form>
      
      {/* Helper credentials display to ease testing */}
      <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400 text-center">
        <p className="font-semibold text-slate-500 mb-1">Tài khoản demo test nhanh:</p>
        <p>Admin: <span className="font-mono text-slate-600">admin@medibuk.vn</span> / <span className="font-mono text-slate-600">123456</span></p>
        <p>Bệnh nhân: <span className="font-mono text-slate-600">patient1@gmail.com</span> / <span className="font-mono text-slate-600">123456</span></p>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/20 to-white">
      <Suspense fallback={<div className="text-center text-slate-400 animate-pulse">Đang tải...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
