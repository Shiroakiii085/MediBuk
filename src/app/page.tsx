import Link from 'next/link';
import { CalendarHeart, MapPin, Search, Bell, Heart, ShieldAlert, Award, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-white">
      {/* Background graphic */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-200 to-teal-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 text-sm font-semibold text-emerald-700 mb-6">
            <Heart className="h-4 w-4 text-emerald-500 fill-current animate-pulse" />
            <span>Chăm sóc sức khỏe thời đại số</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Đặt Lịch Khám Sức Khỏe <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Online Tiện Lợi & Nhanh Chóng
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            Hệ thống kết nối bệnh nhân với 25 bệnh viện hàng đầu Việt Nam. Tự động tìm kiếm bác sĩ theo triệu chứng bệnh lý và tối ưu hóa khoảng cách di chuyển từ vị trí của bạn.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/booking"
              className="group flex items-center gap-x-1 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all active:scale-95"
            >
              <span>Đặt lịch khám ngay</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Xem lịch hẹn của tôi
            </Link>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="mx-auto mt-20 max-w-5xl sm:mt-24 lg:mt-28">
          <dl className="grid grid-cols-1 gap-y-12 gap-x-8 text-center sm:grid-cols-3 bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100">
            <div className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-sm leading-7 text-slate-500 uppercase tracking-wider font-semibold">Thành phố lớn</dt>
              <dd className="order-first text-4xl font-bold tracking-tight text-slate-900">05</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-sm leading-7 text-slate-500 uppercase tracking-wider font-semibold">Bệnh viện liên kết</dt>
              <dd className="order-first text-4xl font-bold tracking-tight text-slate-900">25+</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-2">
              <dt className="text-sm leading-7 text-slate-500 uppercase tracking-wider font-semibold">Bác sĩ chuyên khoa</dt>
              <dd className="order-first text-4xl font-bold tracking-tight text-slate-900">60+</dd>
            </div>
          </dl>
        </div>

        {/* Features Section */}
        <div className="mx-auto mt-32 max-w-5xl sm:mt-40">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-emerald-600 uppercase tracking-wider">Tính năng nổi bật</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Giải pháp tối ưu cho việc đặt lịch khám
            </p>
            <p className="mt-4 text-lg text-slate-600">
              MediBuk ứng dụng công nghệ hiện đại giúp rút ngắn thời gian xếp hàng chờ đợi của bạn.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <dt className="flex items-center gap-x-3 text-lg font-bold leading-7 text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Search className="h-5 w-5" />
                  </div>
                  Gợi ý bác sĩ theo triệu chứng
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">
                    Chỉ cần nhập triệu chứng bệnh lý tự do (ví dụ: đau đầu, nhức mỏi), hệ thống sẽ tự động quét và đưa ra gợi ý bác sĩ chuyên khoa phù hợp nhất.
                  </p>
                </dd>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <dt className="flex items-center gap-x-3 text-lg font-bold leading-7 text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  Định vị & tính khoảng cách
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">
                    Tính toán khoảng cách Haversine từ vị trí của bạn tới các bệnh viện, sắp xếp thứ tự ưu tiên giúp bạn chọn nơi khám thuận tiện nhất trên bản đồ số.
                  </p>
                </dd>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <dt className="flex items-center gap-x-3 text-lg font-bold leading-7 text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Bell className="h-5 w-5" />
                  </div>
                  Email xác nhận & Nhắc lịch
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                  <p className="flex-auto">
                    Nhận ngay email xác nhận đầy đủ chi tiết lịch khám và hệ thống tự động gửi thư điện tử nhắc lịch trước ngày khám 1 ngày thông qua SMTP Gmail.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Quality Banner */}
        <div className="mx-auto mt-32 max-w-5xl rounded-3xl bg-slate-900 p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Sức khỏe của bạn là ưu tiên hàng đầu của chúng tôi</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Hãy đăng ký tài khoản MediBuk ngay hôm nay để trải nghiệm quy trình chăm sóc sức khỏe hiện đại, chuyên nghiệp bậc nhất.
            </p>
            <div className="mt-10 flex">
              <Link
                href="/auth/signup"
                className="rounded-xl bg-white px-5 py-3 text-base font-semibold text-slate-900 hover:bg-slate-100 transition-colors shadow-md"
              >
                Đăng ký tài khoản miễn phí
              </Link>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <CalendarHeart className="h-96 w-96 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
