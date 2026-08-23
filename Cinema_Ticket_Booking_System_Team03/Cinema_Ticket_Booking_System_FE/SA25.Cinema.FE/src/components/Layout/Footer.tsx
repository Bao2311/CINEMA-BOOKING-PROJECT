import React from 'react';
import {
  Film, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube,
  ArrowRight, Clapperboard, CalendarDays, Tag, Ticket
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B0F19] border-t border-white/10">
      {/* Top CTA Strip */}
      <div className="bg-gradient-to-r from-red-600/20 via-red-500/10 to-transparent border-b border-red-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Trải nghiệm điện ảnh đẳng cấp</h3>
            <p className="text-gray-400 text-sm mt-1">Đặt vé ngay hôm nay và nhận ưu đãi đặc biệt cho thành viên mới</p>
          </div>
          <Link
            to="/movies"
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/30 whitespace-nowrap"
          >
            Xem phim ngay <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-lg blur-md opacity-60" />
                <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-2 rounded-lg">
                  <Film className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="font-black text-xl text-white">Cinema<span className="text-red-500">Plus</span></span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Điểm đến hàng đầu cho trải nghiệm điện ảnh tuyệt vời. Thưởng thức những bộ phim bom tấn mới nhất tại các rạp chiếu phim đẳng cấp của chúng tôi.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Facebook, href: '#' },
                { Icon: Twitter, href: '#' },
                { Icon: Instagram, href: '#' },
                { Icon: Youtube, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
              Điều hướng
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/movies", label: "Phim đang chiếu", Icon: Clapperboard },
                { to: "/showtimes", label: "Lịch chiếu phim", Icon: CalendarDays },
                { to: "/promotion", label: "Ưu đãi & Khuyến mãi", Icon: Tag },
                { to: "/profile/bookings", label: "Vé đã đặt", Icon: Ticket },
              ].map(({ to, label, Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group"
                  >
                    <Icon className="h-3.5 w-3.5 text-red-400/70 group-hover:text-red-400 transition-colors" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
              Liên hệ
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-gray-400 text-sm leading-relaxed">123 Đường Lý Thường Kiệt, Q.10, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-gray-400 text-sm">+84 (0) 900 123 456</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-gray-400 text-sm">contact@cinemaplus.vn</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-white font-semibold mb-5 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
              Giờ mở cửa
            </h4>
            <ul className="space-y-3">
              {[
                { day: "Thứ 2 - Thứ 6", time: "10:00 - 23:00" },
                { day: "Thứ 7 - Chủ nhật", time: "09:00 - 24:00" },
                { day: "Lễ & Tết", time: "09:00 - 24:00" },
              ].map(({ day, time }) => (
                <li key={day} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">{day}</span>
                  <span className="text-white font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">{time}</span>
                </li>
              ))}
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-3">Nhận thông tin phim mới nhất:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50 transition-all"
                />
                <button className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all flex-shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CinemaPlus. Đã đăng ký bản quyền.
          </p>
          <div className="flex items-center gap-5">
            {["Điều khoản dịch vụ", "Chính sách bảo mật", "FAQ"].map((item) => (
              <a key={item} href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
