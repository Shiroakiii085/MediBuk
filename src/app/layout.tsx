import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: 'MediBuk - Hệ thống đặt lịch khám bệnh trực tuyến',
  description: 'Đặt lịch khám bệnh online nhanh chóng, tìm kiếm bác sĩ phù hợp theo triệu chứng và vị trí. Kết nối với 25+ bệnh viện hàng đầu Việt Nam.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50/50 text-slate-800 font-sans">
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="font-semibold text-slate-700">© 2026 MediBuk. Bảo lưu mọi quyền.</p>
              <p className="mt-1 text-slate-400">Ứng dụng chăm sóc sức khỏe trực tuyến 100% bằng tiếng Việt.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
