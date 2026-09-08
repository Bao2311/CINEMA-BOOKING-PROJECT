import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Film,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  CalendarDays,
  Ticket,
  Search,
  Bell,
  ChevronDown,
  Tag,
  Settings,
  BarChart3,
  Users,
  Home,
  Clapperboard,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

const Navbar: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<{ id: string; role: string; exp: number }>(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        } else {
          setUserRole(decoded.role);
          setIsAuthenticated(true);
          fetchUserProfile(decoded.id);
        }
      } catch {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setFullName("");
    }
  }, [location]);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) searchRef.current.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5204/api/User/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFullName(data.full_Name || data.fullName || "User");
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole(null);
    setFullName("");
    setIsProfileOpen(false);
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/movies", label: "Phim", icon: Clapperboard },
    { to: "/showtimes", label: "Lịch chiếu", icon: CalendarDays },
    { to: "/promotion", label: "Khuyến mãi", icon: Tag },
  ];

  const adminLinks = [
    { to: "/manage-movies", label: "Quản lý phim", icon: Film },
    { to: "/manage-showtimes", label: "Quản lý lịch chiếu", icon: CalendarDays },
    { to: "/manage-booking", label: "Quản lý đặt vé", icon: Ticket },
    { to: "/manage-cinemaroom", label: "Quản lý phòng chiếu", icon: BarChart3 },
    { to: "/manage-promotion", label: "Quản lý khuyến mãi", icon: Tag },
    { to: "/manage-accounts", label: "Quản lý nhân viên", icon: Users },
    { to: "/qrcode", label: "Quét QR vé", icon: Ticket },
    { to: "/statistics", label: "Thống kê", icon: BarChart3 },
  ];

  const staffLinks = [
    { to: "/staff", label: "Bán vé", icon: Ticket },
    { to: "/qrcode", label: "Quét QR", icon: Ticket },
    { to: "/manage-ticket", label: "Quản lý vé", icon: Ticket },
  ];

  const isActive = (path: string) => location.pathname === path;

  const avatarLetter = fullName ? fullName.charAt(0).toUpperCase() : "U";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
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

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
              </Link>
            ))}

            {isAuthenticated && userRole === "Admin" && (
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                  Quản lý <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#161D2F] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                  {adminLinks.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-red-400" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isAuthenticated && userRole === "Staff" && (
              <div className="relative group">
                <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all">
                  Nhân viên <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#161D2F] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                  {staffLinks.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-amber-400" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm phim..."
                    className="w-48 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  title="Tìm kiếm"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all hidden sm:block">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm">
                      {avatarLetter}
                    </div>
                    <span className="text-sm text-gray-200 hidden sm:block max-w-[100px] truncate">
                      {fullName}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform hidden sm:block ${isProfileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-[#161D2F] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white truncate">{fullName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{userRole}</p>
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
                        to="/profile/bookings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Ticket className="h-4 w-4 text-amber-400" />
                        Vé đã đặt
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
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all shadow-lg shadow-red-500/30"
                >
                  <UserPlus className="h-4 w-4" />
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#0B0F19]/98 backdrop-blur-xl border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(to)
                    ? "bg-red-500/20 text-red-400"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            {isAuthenticated && userRole === "Admin" && (
              <>
                <div className="pt-2 pb-1 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quản lý
                </div>
                {adminLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon className="h-4 w-4 text-red-400" />
                    {label}
                  </Link>
                ))}
              </>
            )}

            {isAuthenticated && userRole === "Staff" && (
              <>
                <div className="pt-2 pb-1 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </div>
                {staffLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon className="h-4 w-4 text-amber-400" />
                    {label}
                  </Link>
                ))}
              </>
            )}

            <div className="pt-3 border-t border-white/10">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-gray-300 hover:text-white border border-white/20 hover:border-white/40 transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
