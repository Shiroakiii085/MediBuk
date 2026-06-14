import Link from 'next/link';
import { MapPin, Clock, Phone, Mail, Shield, Calendar, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Top bar */}
      <div className="bg-emerald-700 text-white text-sm">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> 1900 1234</span>
            <span className="hidden sm:flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> hotro@medibuk.vn</span>
          </div>
          <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Hỗ trợ 24/7</div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-emerald-50 to-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 rounded-full px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6 shadow-sm">
                <Shield className="h-4 w-4" />
                Hệ thống đặt lịch khám bệnh uy tín
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                Đặt lịch khám bệnh<br />
                <span className="text-emerald-600">nhanh chóng & tiện lợi</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Kết nối bạn với hơn 25 bệnh viện hàng đầu trên toàn quốc. Tìm bác sĩ phù hợp theo triệu chứng, định vị bệnh viện gần nhất và đặt lịch chỉ trong vài phút.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors shadow-sm"
                >
                  Đặt lịch khám ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3.5 rounded-lg transition-colors"
                >
                  Quản lý lịch hẹn
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-8 justify-center lg:justify-start text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span><strong className="text-slate-900">25+</strong> Bệnh viện</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span><strong className="text-slate-900">60+</strong> Bác sĩ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span><strong className="text-slate-900">5</strong> Thành phố</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              {/* Medical Cross Logo */}
              <div className="relative">
                <div className="w-72 h-72 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                  <div className="relative">
                    {/* Medical Cross */}
                    <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
                      {/* Horizontal bar */}
                      <rect x="20" y="45" width="100" height="50" rx="8" fill="#059669"/>
                      {/* Vertical bar */}
                      <rect x="45" y="20" width="50" height="100" rx="8" fill="#059669"/>
                      {/* Inner cross highlight */}
                      <rect x="55" y="55" width="30" height="30" rx="4" fill="#34d399"/>
                    </svg>
                  </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-100 rounded-full -z-10"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-emerald-50 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">Tại sao chọn MediBuk?</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              Giải pháp đặt lịch khám bệnh toàn diện, tiết kiệm thời gian cho bệnh nhân và bác sĩ
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tìm bác sĩ theo triệu chứng</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Nhập triệu chứng bệnh lý, hệ thống tự động gợi ý bác sĩ chuyên khoa phù hợp nhất tại bệnh viện bạn chọn.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-5">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Định vị bệnh viện gần nhất</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Tính khoảng cách từ vị trí của bạn tới các bệnh viện, sắp xếp theo thứ tự ưu tiên để bạn chọn nơi thuận tiện nhất.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận & nhắc lịch qua email</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Nhận email xác nhận ngay lập tức và hệ thống tự động nhắc lịch trước ngày khám để bạn không bỏ lỡ hẹn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900">Khu vực hoạt động</h2>
            <p className="mt-3 text-slate-500">Phủ sóng 5 thành phố lớn trên toàn quốc</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'].map((city) => (
              <div key={city} className="bg-white p-5 rounded-lg border border-slate-200 text-center shadow-sm">
                <MapPin className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800 text-sm">{city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-emerald-700 rounded-2xl p-10 sm:p-14 text-center text-white">
            <h2 className="text-3xl font-bold">Bắt đầu đặt lịch khám ngay</h2>
            <p className="mt-4 text-emerald-100 max-w-xl mx-auto">
              Đăng ký tài khoản miễn phí để trải nghiệm quy trình đặt lịch khám bệnh hiện đại và chuyên nghiệp.
            </p>
            <div className="mt-8">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
              >
                Đăng ký tài khoản
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
