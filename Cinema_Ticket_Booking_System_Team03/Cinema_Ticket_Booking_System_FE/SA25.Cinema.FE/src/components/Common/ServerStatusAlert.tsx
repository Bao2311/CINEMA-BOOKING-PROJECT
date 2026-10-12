import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server,
  Cloud,
  Database,
  Cpu,
  Zap,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  LogIn,
  RefreshCw,
  X,
  ChevronRight,
  Info,
  Sparkles,
  Shield,
  UserCheck
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL, API_BASE_URL } from '../../config/apiUrl';
import { useAuth } from '../../context/AuthContext';

export type ServerStatusType = 'checking' | 'waking' | 'online' | 'sleeping';

export const ServerStatusAlert: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ServerStatusType>('checking');
  const [isPinging, setIsPinging] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(45);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Test accounts data (Customer Demo public; Admin & Staff protected for interviews)
  const DEMO_ACCOUNTS = [
    {
      role: 'Khách hàng (Customer Demo)',
      email: 'customer@cinema.com',
      password: 'User@123',
      description: 'Trải nghiệm toàn diện: Đặt vé, chọn ghế rạp, xem vé QR điện tử & lịch sử giao dịch',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: UserCheck
    }
  ];

  // Auto-ping server to check if it is awake
  const checkServerStatus = async (isManualTrigger = false) => {
    if (isPinging && !isManualTrigger) return;
    setIsPinging(true);

    try {
      // Send a lightweight GET request with 25s timeout
      const res = await axios.get(`${API_URL}/Movie`, { timeout: 25000 });
      if (res.status === 200) {
        setStatus('online');
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        
        // Dispatch custom event to notify HomePage or other pages to re-fetch movies
        window.dispatchEvent(new CustomEvent('cinema-server-awake'));

        if (isManualTrigger) {
          toast.success('🟢 Máy chủ đã sẵn sàng! Dữ liệu 17 phim đã được tải.');
        }
      } else {
        setStatus('waking');
      }
    } catch (err: any) {
      console.log('Server ping check result:', err?.message || err);
      // If server took too long or timed out, it is waking up from cold start
      setStatus('waking');
    } finally {
      setIsPinging(false);
      setHasCheckedOnce(true);
    }
  };

  // Initial check on mount
  useEffect(() => {
    // Open modal on first visit in the session
    const hasSeenNotice = sessionStorage.getItem('cinema_server_notice_seen');
    if (!hasSeenNotice) {
      // Delay opening slightly for a smoother entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Server health monitoring
  useEffect(() => {
    checkServerStatus();

    // Start countdown timer for cold start
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 1;
        return prev - 1;
      });
    }, 1000);

    // Polling every 6 seconds until server becomes online
    pollTimerRef.current = setInterval(() => {
      if (status !== 'online') {
        checkServerStatus();
      }
    }, 6000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Listen for global custom event if any other request woke up the server
  useEffect(() => {
    const handleServerAwake = () => {
      setStatus('online');
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('cinema-server-awake', handleServerAwake);
    window.addEventListener('open-server-status-modal', handleOpenModal);
    return () => {
      window.removeEventListener('cinema-server-awake', handleServerAwake);
      window.removeEventListener('open-server-status-modal', handleOpenModal);
    };
  }, []);

  // Handle Close Modal
  const handleClose = () => {
    sessionStorage.setItem('cinema_server_notice_seen', 'true');
    setIsOpen(false);
  };

  // Copy helper
  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(identifier);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => {
      setCopiedAccount(null);
    }, 2000);
  };

  // 1-Click Login Customer Demo account to wake up server
  const handleQuickCustomerLogin = async () => {
    setIsLoggingIn(true);
    toast.info('⚡ Đang gửi request đăng nhập Customer Demo để đánh thức máy chủ...');
    try {
      await login('customer@cinema.com', 'User@123');
      setStatus('online');
      window.dispatchEvent(new CustomEvent('cinema-server-awake'));
      toast.success('🎉 Đăng nhập Customer Demo thành công! Máy chủ đã hoạt động.');
      handleClose();
      navigate('/');
    } catch (err: any) {
      console.error('Lỗi khi đăng nhập demo:', err);
      // Even if login failed or is still waking up, it woke up the server
      checkServerStatus(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      {/* ──────────────────────────────────────────────────────────
          1. FLOATING STATUS BADGE (Góc dưới bên trái, ghim cố định)
          ────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-6 z-40 select-none">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#161D2F]/90 hover:bg-[#1E2738] text-white border border-white/10 hover:border-red-500/50 shadow-xl hover:shadow-red-500/20 backdrop-blur-md transition-all duration-300 transform hover:scale-105 active:scale-95"
          title="Nhấn để xem thông tin môi trường Free Tier & tài khoản Demo"
          aria-label="Xem trạng thái máy chủ"
        >
          {/* Status Indicator Dot */}
          <div className="relative flex items-center justify-center">
            {status === 'online' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="animate-ping absolute w-3.5 h-3.5 rounded-full bg-emerald-400 opacity-60"></span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="animate-ping absolute w-3.5 h-3.5 rounded-full bg-amber-400 opacity-75"></span>
              </>
            )}
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              Backend Server <span className="text-[9px] px-1 py-0.2 bg-white/10 rounded">Render Free</span>
            </span>
            <span className="text-xs font-bold text-gray-100 flex items-center gap-1">
              {status === 'online' ? (
                <span className="text-emerald-400">🟢 Đang hoạt động</span>
              ) : status === 'waking' ? (
                <span className="text-amber-400">🟡 Đang thức dậy (~{countdown}s)</span>
              ) : (
                <span className="text-amber-300">💤 Kiểm tra trạng thái...</span>
              )}
            </span>
          </div>

          <div className="ml-1 pl-2 border-l border-white/10 text-gray-400 group-hover:text-red-400 transition">
            <Info className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. DETAILED MODAL (Thông báo giải thích chi tiết)
          ────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Dark Backdrop */}
          <div
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#161D2F] to-[#0D121F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-left transition-all max-h-[92vh] flex flex-col">
            {/* Top Glowing Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 text-amber-400 shadow-inner">
                  <Server className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ⚡ Dành cho Nhà Tuyển Dụng & Đánh Giá Viên
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Cloud Free-Tier Policy
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Thông Báo Môi Trường & Cơ Chế Cold Start
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    Giải thích trạng thái khởi động của máy chủ backend khi vừa truy cập
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-sm text-gray-300">
              {/* STATUS BANNER CARD */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  status === 'online'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-amber-950/30 border-amber-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        status === 'online'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {status === 'online' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <RefreshCw className={`w-6 h-6 ${isPinging ? 'animate-spin' : ''}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          {status === 'online'
                            ? 'Máy chủ Backend đang HOẠT ĐỘNG (Online)'
                            : 'Máy chủ Backend đang THỨC DẬY (Cold Start)'}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === 'online' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {status === 'online'
                          ? '✅ API đã phản hồi 200 OK. Danh sách 17 phim & các suất chiếu đã sẵn sàng!'
                          : `⏳ Đang đánh thức container Docker trên Render... Dự kiến mất ~${countdown} giây.`}
                      </p>
                    </div>
                  </div>

                  {/* Manual Ping Button */}
                  <button
                    onClick={() => checkServerStatus(true)}
                    disabled={isPinging}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      status === 'online'
                        ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40'
                        : 'bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white shadow-lg shadow-amber-600/20'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    {isPinging ? 'Đang gửi ping...' : status === 'online' ? 'Ping lại máy chủ' : '⚡ Đánh thức ngay'}
                  </button>
                </div>

                {/* Progress bar during wake up */}
                {status !== 'online' && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20">
                    <div className="flex items-center justify-between text-[11px] text-amber-300/80 mb-1">
                      <span>Tiến trình khởi động container (.NET 9 + Neon PostgreSQL)</span>
                      <span>Ước tính: {countdown}s</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-1000 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(15, ((45 - countdown) / 45) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* EXPLANATION BOX */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span>Tại sao máy chủ lại ở trạng thái "Ngủ" (Cold Start)?</span>
                </div>
                <div className="text-xs leading-relaxed text-gray-300 space-y-2">
                  <p>
                    • <strong>Kiến trúc triển khai:</strong> Toàn bộ Backend (.NET 9 Web API) được đóng gói trong Docker Container và triển khai trên dịch vụ đám mây miễn phí <strong>Render Free Web Service</strong>, kết nối cơ sở dữ liệu serverless <strong>Neon PostgreSQL</strong>.
                  </p>
                  <p>
                    • <strong>Chính sách Free-Tier:</strong> Nhằm tối ưu chi phí và tài nguyên máy chủ, nền tảng Render sẽ tự động đưa máy chủ vào trạng thái <strong>"Tạm ngủ" (Spin-down)</strong> nếu sau <strong>15 phút</strong> không phát sinh request nào từ người dùng.
                  </p>
                  <p>
                    • <strong>Hiện tượng khi vừa truy cập:</strong> Khi nhà tuyển dụng vừa mở liên kết, máy chủ cần từ <strong>30 - 50 giây</strong> để nạp lại Docker container và kết nối Database. Trong lúc này, trang web có thể hiển thị <span className="text-amber-400 font-medium">"0 bộ phim"</span> hoặc đang tải dữ liệu. <span className="text-emerald-400 font-medium">Đây là đặc tính của môi trường deploy miễn phí, hoàn toàn không phải lỗi (bug) code của dự án.</span>
                  </p>
                </div>
              </div>

              {/* QUICK ACTIONS & DEMO ACCOUNTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold text-sm">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Hướng dẫn đánh thức máy chủ & Tài khoản trải nghiệm</span>
                  </div>
                  <span className="text-[11px] text-gray-400">1-Click đăng nhập hoặc sao chép</span>
                </div>

                {/* 1-CLICK DEMO LOGIN BUTTON */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600/20 via-red-500/10 to-amber-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Đăng nhập nhanh 1-Click tài khoản Customer Demo
                    </h4>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Gửi request đăng nhập trực tiếp để kích hoạt máy chủ thức dậy và trải nghiệm giao diện khách hàng
                    </p>
                  </div>
                  <button
                    onClick={handleQuickCustomerLogin}
                    disabled={isLoggingIn}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý request...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Đăng nhập Customer Demo</span>
                      </>
                    )}
                  </button>
                </div>

                {/* DEMO ACCOUNTS GRID */}
                <div className="grid grid-cols-1 gap-2.5">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const Icon = acc.icon;
                    const isCopied = copiedAccount === acc.email;

                    return (
                      <div
                        key={acc.email}
                        className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-white/5 text-gray-300 shrink-0 mt-0.5 sm:mt-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{acc.role}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${acc.badgeColor}`}>
                                {acc.email.split('@')[0]}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">{acc.description}</p>
                            <div className="text-[11px] font-mono text-gray-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>
                                Email: <strong className="text-white">{acc.email}</strong>
                              </span>
                              <span>
                                Mật khẩu: <strong className="text-amber-300">{acc.password}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Copy button */}
                        <button
                          onClick={() => handleCopy(`${acc.email} / ${acc.password}`, acc.email)}
                          className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          title="Sao chép tài khoản và mật khẩu"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold text-[11px]">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* SECURITY & DATA INTEGRITY NOTICE */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-xs text-gray-300 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-white">Bảo vệ tính toàn vẹn dữ liệu (Data Integrity):</strong> Phân quyền <strong>Quản trị viên (Admin)</strong> và <strong>Nhân viên (Staff)</strong> được bảo mật để tránh trường hợp dữ liệu phim, phòng chiếu và suất chiếu trên database Cloud bị sửa đổi/xóa ngoài ý muốn. Ứng viên sẽ trực tiếp trình bày chi tiết Dashboard Admin và nghiệp vụ Staff trong buổi phỏng vấn kỹ thuật.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400 text-center sm:text-left">
                💡 Nút trạng thái luôn nằm ở góc dưới bên trái để mở lại bảng này bất kỳ lúc nào.
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    handleClose();
                    navigate('/login');
                  }}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition cursor-pointer text-center"
                >
                  Tới trang Đăng nhập
                </button>
                <button
                  onClick={handleClose}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition cursor-pointer text-center"
                >
                  Tôi đã hiểu & Trải nghiệm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServerStatusAlert;
