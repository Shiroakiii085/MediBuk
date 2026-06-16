'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-xl tracking-tight">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="10" width="24" height="12" rx="3" fill="#0284C7"/>
                <rect x="10" y="4" width="12" height="24" rx="3" fill="#0284C7"/>
                <rect x="13" y="13" width="6" height="6" rx="1.5" fill="#BAE6FD"/>
              </svg>
              <span>MediBuk</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-6">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                Trang chủ
              </Link>
              {session && (
                <>
                  <Link
                    href="/booking"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/booking')
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    Đặt lịch khám
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/account"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/account')
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    Tài khoản
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {session.user.role === 'admin' ? 'Quản trị viên' : 'Bệnh nhân'}
                  </p>
                  <p className="text-sm font-medium text-slate-700">{session.user.name}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-sky-700 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                Đăng nhập
              </Link>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-lg px-2 pt-2 pb-4 space-y-1">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
              isActive('/') ? 'bg-primary-light text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Trang chủ
          </Link>
          {session ? (
            <>
              <Link
                href="/booking"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/booking') ? 'bg-primary-light text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Đặt lịch khám
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-primary-light text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/account') ? 'bg-primary-light text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Tài khoản
              </Link>
              <div className="border-t border-slate-100 my-2 pt-2 px-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">
                      {session.user.role === 'admin' ? 'Quản trị viên' : 'Bệnh nhân'}
                    </p>
                    <p className="text-sm font-medium text-slate-800">{session.user.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center justify-center space-x-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          ) : (
            <div className="px-3 pt-2">
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="w-full block text-center px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-sky-700 rounded-lg shadow-sm"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
