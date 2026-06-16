'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Phone, Mail, Shield, Calendar, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="bg-white">
      {/* Top bar */}
      <div className="bg-primary text-white text-sm">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> 1900 1234</span>
            <span className="hidden sm:flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> hotro@medibuk.vn</span>
          </div>
          <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Hỗ trợ 24/7</div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary-light to-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-border rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-6 shadow-sm">
                <Shield className="h-4 w-4" />
                Hệ thống đặt lịch khám bệnh uy tín
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
                Đặt lịch khám bệnh<br />
                <span className="text-primary">nhanh chóng & tiện lợi</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Kết nối bạn với hơn 78 bệnh viện hàng đầu trên toàn quốc. Tìm bác sĩ phù hợp theo triệu chứng, định vị bệnh viện gần nhất và đặt lịch chỉ trong vài phút.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-sky-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  Đặt lịch khám ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3.5 rounded-lg transition-colors cursor-pointer"
                >
                  Quản lý lịch hẹn
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-8 justify-center lg:justify-start text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span><strong className="text-foreground">78+</strong> Bệnh viện</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span><strong className="text-foreground">280+</strong> Bác sĩ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span><strong className="text-foreground">13</strong> Thành phố</span>
                </div>
              </div>
            </div>

            {/* Doctor Image with Text Overlay */}
            <div className="flex-shrink-0 relative w-full max-w-lg lg:w-[520px]">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50">
                <div className="relative h-[420px] w-full bg-slate-100">
                  <Image
                    src="/doctor-hero.png"
                    alt="Bác sĩ MediBuk"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-900/90 via-sky-900/40 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1 text-xs font-medium text-white mb-3">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="4.5" width="10" height="5" rx="1.5" fill="white"/>
                      <rect x="4.5" y="2" width="5" height="10" rx="1.5" fill="white"/>
                    </svg>
                    Đội ngũ y bác sĩ chuyên nghiệp
                  </div>
                  <h3 className="text-2xl font-bold text-white leading-snug">
                    Hơn 280 bác sĩ chuyên khoa<br />
                    <span className="text-sky-300">sẵn sàng hỗ trợ bạn</span>
                  </h3>
                  <p className="mt-3 text-sm text-white/80 leading-relaxed">
                    Được đào tạo bài bản, giàu kinh nghiệm tại các bệnh viện hàng đầu
                  </p>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-border px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Đạt chuẩn</p>
                  <p className="text-sm font-bold text-foreground">Bộ Y Tế</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">Tại sao chọn MediBuk?</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              Giải pháp đặt lịch khám bệnh toàn diện, tiết kiệm thời gian cho bệnh nhân và bác sĩ
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Tìm bác sĩ theo triệu chứng</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Nhập triệu chứng bệnh lý, hệ thống tự động gợi ý bác sĩ chuyên khoa phù hợp nhất tại bệnh viện bạn chọn.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-5">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Định vị bệnh viện gần nhất</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Tính khoảng cách từ vị trí của bạn tới các bệnh viện, sắp xếp theo thứ tự ưu tiên để bạn chọn nơi thuận tiện nhất.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-border shadow-sm">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Xác nhận & nhắc lịch qua email</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Nhận email xác nhận ngay lập tức và hệ thống tự động nhắc lịch trước ngày khám để bạn không bỏ lỡ hẹn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="bg-muted py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">Khu vực hoạt động</h2>
            <p className="mt-3 text-slate-500">Phủ sóng 13 thành phố lớn trên toàn quốc</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang', 'Huế', 'Quy Nhơn', 'Vinh', 'Đà Lạt'].map((city) => (
              <div key={city} className="bg-white p-5 rounded-lg border border-border text-center shadow-sm">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="font-semibold text-slate-800 text-sm">{city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Only show when not logged in */}
      {!session && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-primary rounded-2xl p-10 sm:p-14 text-center text-white">
              <h2 className="text-3xl font-bold">Bắt đầu đặt lịch khám ngay</h2>
              <p className="mt-4 text-sky-100 max-w-xl mx-auto">
                Đăng ký tài khoản miễn phí để trải nghiệm quy trình đặt lịch khám bệnh hiện đại và chuyên nghiệp.
              </p>
              <div className="mt-8">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-lg hover:bg-sky-50 transition-colors shadow-sm cursor-pointer"
                >
                  Đăng ký tài khoản
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Show different CTA when logged in */}
      {session && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-primary rounded-2xl p-10 sm:p-14 text-center text-white">
              <h2 className="text-3xl font-bold">Chào mừng bạn quay trở lại!</h2>
              <p className="mt-4 text-sky-100 max-w-xl mx-auto">
                Bạn đã sẵn sàng đặt lịch khám bệnh chưa? Hãy bắt đầu ngay bây giờ.
              </p>
              <div className="mt-8">
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-lg hover:bg-sky-50 transition-colors shadow-sm cursor-pointer"
                >
                  Đặt lịch khám ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
