import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Film,
  User,
  LogOut,
  Menu,
  X,
  CalendarDays,
  Ticket,
  QrCode,
  ChevronDown,
  Briefcase,
  Settings
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NavbarLoginStaff: React.FC = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50"
          : "bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-lg blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-2 rounded-lg">
                  <Film className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="font-black text-xl text-white tracking-tight">
                Cinema<span className="text-red-500">Plus</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Briefcase className="h-3 w-3" /> STAFF
            </span>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/showtimes"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/showtimes")
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <CalendarDays className="h-4 w-4 text-amber-400" />
              <span>Lịch chiếu</span>
            </Link>

            <Link
              to="/staff"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/staff")
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Ticket className="h-4 w-4 text-red-400" />
              <span>Bán vé</span>
            </Link>

            <Link
              to="/movies"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/movies")
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Film className="h-4 w-4 text-blue-400" />
              <span>Danh sách phim</span>
            </Link>

            <Link
              to="/qrcode"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive("/qrcode")
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span>Quét mã QR</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all ml-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-sm">
                  S
                </div>
                <span className="text-sm font-medium text-gray-200">{user?.full_Name || "Nhân viên"}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#161D2F] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white">{user?.full_Name || "Nhân viên"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">staff@cinema.com</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <User className="h-4 w-4 text-blue-400" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    to="/profile/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Cài đặt
                  </Link>
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0B0F19]/98 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-1">
          <Link
            to="/showtimes"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            <CalendarDays className="h-4 w-4 text-amber-400" />
            <span>Lịch chiếu</span>
          </Link>
          <Link
            to="/staff"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            <Ticket className="h-4 w-4 text-red-400" />
            <span>Bán vé</span>
          </Link>
          <Link
            to="/movies"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            <Film className="h-4 w-4 text-blue-400" />
            <span>Danh sách phim</span>
          </Link>
          <Link
            to="/qrcode"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => setIsMenuOpen(false)}
          >
            <QrCode className="h-4 w-4 text-emerald-400" />
            <span>Quét mã QR</span>
          </Link>

          <div className="border-t border-white/10 mt-3 pt-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarLoginStaff;
