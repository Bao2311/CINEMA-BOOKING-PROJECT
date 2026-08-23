import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5204/api';

interface BookingInfo {
  bookingId: number;
  status: string;
  totalAmount: number;
  paymentDeadline: string;
  movieName: string;
  posterUrl: string;
  showDate: string;
  startTime: string;
  endTime: string;
  roomName: string;
  roomType: string;
  ticketCount: number;
  seats: { row: string; col: number; seatType: string; finalPrice: number }[];
}

const COUNTDOWN_SECONDS = 120;

const MockPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');
  const token = searchParams.get('token');

  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'banking' | 'momo'>('banking');
  const [step, setStep] = useState<'info' | 'processing' | 'success' | 'failed'>('info');
  const [error, setError] = useState<string | null>(null);

  // Fetch booking info
  useEffect(() => {
    if (!bookingId) {
      setError('Thiếu thông tin đặt vé');
      setIsLoading(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        const token_auth = localStorage.getItem('token');
        if (!token_auth) {
          navigate('/login', { state: { from: { pathname: '/mock-payment' } } });
          return;
        }

        const res = await axios.get(`${API_BASE}/mock-payment/booking-info/${bookingId}`, {
          headers: { Authorization: `Bearer ${token_auth}` }
        });

        if (res.data.success) {
          setBookingInfo(res.data);
        } else {
          setError(res.data.message || 'Không thể tải thông tin đặt vé');
        }
      } catch (e: any) {
        if (e.response?.status === 401) {
          navigate('/login');
          return;
        }
        setError('Không thể kết nối với server. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfo();
  }, [bookingId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (step !== 'info') return;
    if (countdown <= 0) {
      toast.warning('Hết thời gian thanh toán. Đơn đặt vé sẽ bị hủy.');
      navigate('/profile/bookings');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, step, navigate]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleConfirm = useCallback(async () => {
    if (!bookingId || !token) {
      toast.error('Thông tin thanh toán không hợp lệ');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    // Giả lập quá trình xử lý 2.5 giây
    await new Promise(r => setTimeout(r, 2500));

    try {
      const authToken = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE}/mock-payment/confirm`,
        { bookingId: parseInt(bookingId), token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (res.data.success) {
        setStep('success');
        setTimeout(() => {
          navigate(`/profile/bookings?status=success&bookingId=${bookingId}`);
        }, 3000);
      } else {
        setStep('failed');
        toast.error(res.data.message);
      }
    } catch (e: any) {
      setStep('failed');
      toast.error(e.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  }, [bookingId, token, navigate]);

  const handleCancel = useCallback(async () => {
    if (!window.confirm('Bạn có chắc muốn hủy thanh toán? Đơn đặt vé sẽ bị hủy.')) return;

    try {
      const authToken = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/mock-payment/cancel`,
        { bookingId: parseInt(bookingId!), token: token ?? '' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      toast.info('Đã hủy đặt vé');
    } catch {
      // ignore, still redirect
    }
    navigate('/profile/bookings?status=cancelled');
  }, [bookingId, token, navigate]);

  const urgentCountdown = countdown <= 30;

  // ─── Render States ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={styles.fullCenter}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={styles.spinner}
        />
        <p style={{ color: '#9CA3AF', marginTop: 16 }}>Đang tải thông tin đặt vé...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.fullCenter}>
        <div style={styles.errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#fff', marginBottom: 8 }}>Có lỗi xảy ra</h2>
          <p style={{ color: '#9CA3AF', marginBottom: 24 }}>{error}</p>
          <button onClick={() => navigate('/profile/bookings')} style={styles.btnPrimary}>
            Quay lại lịch sử đặt vé
          </button>
        </div>
      </div>
    );
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div style={styles.fullCenter}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={styles.processingBox}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ ...styles.spinner, width: 60, height: 60, borderWidth: 4 }}
          />
          <h2 style={{ color: '#fff', margin: '24px 0 8px' }}>Đang xử lý thanh toán...</h2>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>
            Vui lòng không tắt hoặc tải lại trang
          </p>
          <div style={styles.methodBadge}>
            {selectedMethod === 'banking' && '🏦 Chuyển khoản ngân hàng'}
            {selectedMethod === 'card' && '💳 Thẻ tín dụng / ghi nợ'}
            {selectedMethod === 'momo' && '💜 Ví MoMo'}
          </div>
        </motion.div>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    return (
      <div style={styles.fullCenter}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={styles.successBox}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            style={styles.successIcon}
          >
            ✓
          </motion.div>
          <h2 style={{ color: '#fff', margin: '24px 0 8px', fontSize: 24 }}>Thanh toán thành công!</h2>
          <p style={{ color: '#10B981', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
            {formatCurrency(bookingInfo?.totalAmount ?? 0)}
          </p>
          <p style={{ color: '#9CA3AF', fontSize: 14 }}>Đang chuyển về lịch sử đặt vé...</p>
        </motion.div>
      </div>
    );
  }

  // Failed screen
  if (step === 'failed') {
    return (
      <div style={styles.fullCenter}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={styles.errorBox}
        >
          <div style={styles.failedIcon}>✕</div>
          <h2 style={{ color: '#fff', margin: '20px 0 8px' }}>Thanh toán thất bại</h2>
          <p style={{ color: '#9CA3AF', marginBottom: 24, fontSize: 14 }}>
            Đã có lỗi xảy ra. Bạn có thể thử lại hoặc hủy đặt vé.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep('info')} style={styles.btnPrimary}>Thử lại</button>
            <button onClick={() => navigate('/profile/bookings')} style={styles.btnSecondary}>
              Quay lại
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main Payment UI ──────────────────────────────────────────────────────────
  return (
    <div style={styles.pageWrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <span style={{ color: '#E50914', fontWeight: 800, fontSize: 20 }}>Cinema</span>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>Plus</span>
          </div>
          <div style={styles.headerRight}>
            <span style={{ color: '#9CA3AF', fontSize: 13 }}>🔒 Kết nối bảo mật</span>
            <div style={{
              ...styles.countdownBadge,
              background: urgentCountdown ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)',
              borderColor: urgentCountdown ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)',
              color: urgentCountdown ? '#EF4444' : '#10B981',
              animation: urgentCountdown ? 'pulse 1s infinite' : 'none',
            }}>
              ⏱ {formatCountdown(countdown)}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.container}>
        {/* Left: Booking Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={styles.summaryCard}
        >
          <h3 style={styles.sectionTitle}>📋 Chi tiết đặt vé</h3>

          {/* Movie info */}
          <div style={styles.movieInfo}>
            {bookingInfo?.posterUrl && (
              <img
                src={bookingInfo.posterUrl}
                alt={bookingInfo.movieName}
                style={styles.poster}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>
                {bookingInfo?.movieName}
              </h4>
              <p style={styles.infoRow}>📅 {bookingInfo?.showDate}</p>
              <p style={styles.infoRow}>🕐 {bookingInfo?.startTime} – {bookingInfo?.endTime}</p>
              <p style={styles.infoRow}>🎬 {bookingInfo?.roomName} ({bookingInfo?.roomType})</p>
            </div>
          </div>

          {/* Seats */}
          {bookingInfo?.seats && bookingInfo.seats.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: '#6B7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
                Ghế đã chọn ({bookingInfo.ticketCount} ghế)
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bookingInfo.seats.map((s, i) => (
                  <span key={i} style={styles.seatBadge}>
                    {s.row}{s.col}
                    <span style={{ opacity: 0.7, fontSize: 10, marginLeft: 3 }}>
                      {s.seatType === 'VIP' ? '⭐' : s.seatType === 'Premium' ? '✨' : ''}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div style={styles.totalRow}>
            <span style={{ color: '#9CA3AF' }}>Tổng tiền</span>
            <span style={{ color: '#E50914', fontSize: 22, fontWeight: 800 }}>
              {formatCurrency(bookingInfo?.totalAmount ?? Number(amount) ?? 0)}
            </span>
          </div>

          {/* Mock notice */}
          <div style={styles.mockNotice}>
            <span style={{ fontSize: 14 }}>🧪</span>
            <span>Đây là thanh toán giả lập. Không có tiền thật bị trừ.</span>
          </div>
        </motion.div>

        {/* Right: Payment Method */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={styles.paymentCard}
        >
          <h3 style={styles.sectionTitle}>💳 Phương thức thanh toán</h3>

          {/* Method selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {([
              { id: 'banking', icon: '🏦', label: 'Chuyển khoản ngân hàng', sub: 'VCB, MB, ACB, Techcombank...' },
              { id: 'card', icon: '💳', label: 'Thẻ tín dụng / Ghi nợ', sub: 'Visa, Mastercard, JCB' },
              { id: 'momo', icon: '💜', label: 'Ví MoMo', sub: 'Quét QR hoặc nhập số điện thoại' },
            ] as const).map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                style={{
                  ...styles.methodBtn,
                  borderColor: selectedMethod === method.id ? '#E50914' : 'rgba(255,255,255,0.1)',
                  background: selectedMethod === method.id
                    ? 'linear-gradient(135deg, rgba(229,9,20,0.12), rgba(229,9,20,0.05))'
                    : 'rgba(255,255,255,0.03)',
                }}
              >
                <span style={{ fontSize: 24 }}>{method.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{method.label}</div>
                  <div style={{ color: '#6B7280', fontSize: 12 }}>{method.sub}</div>
                </div>
                {selectedMethod === method.id && (
                  <span style={styles.checkMark}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Simulated payment input */}
          <AnimatePresence mode="wait">
            {selectedMethod === 'banking' && (
              <motion.div
                key="banking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={styles.bankingBox}
              >
                <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Thông tin chuyển khoản giả lập
                </p>
                <div style={styles.bankRow}>
                  <span>Ngân hàng:</span><strong>VCB – Vietcombank (Demo)</strong>
                </div>
                <div style={styles.bankRow}>
                  <span>Số tài khoản:</span><strong>1234567890</strong>
                </div>
                <div style={styles.bankRow}>
                  <span>Số tiền:</span>
                  <strong style={{ color: '#E50914' }}>
                    {formatCurrency(bookingInfo?.totalAmount ?? Number(amount) ?? 0)}
                  </strong>
                </div>
                <div style={styles.bankRow}>
                  <span>Nội dung:</span><strong>CINEMA {bookingId}</strong>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'momo' && (
              <motion.div
                key="momo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={styles.bankingBox}
              >
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 60, marginBottom: 8 }}>💜</div>
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>Quét mã QR bằng app MoMo</p>
                  <div style={styles.fakeQR}>
                    <span style={{ fontSize: 40 }}>📱</span>
                    <p style={{ color: '#6B7280', fontSize: 11, margin: '8px 0 0' }}>QR Code giả lập</p>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'card' && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={styles.bankingBox}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    readOnly
                    value="4111 1111 1111 1111"
                    placeholder="Số thẻ"
                    style={styles.fakeInput}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input readOnly value="12/28" placeholder="MM/YY" style={{ ...styles.fakeInput, flex: 1 }} />
                    <input readOnly value="123" placeholder="CVV" style={{ ...styles.fakeInput, flex: 1 }} />
                  </div>
                  <input readOnly value="NGUYEN VAN A" placeholder="Tên chủ thẻ" style={styles.fakeInput} />
                  <p style={{ color: '#6B7280', fontSize: 11, margin: 0 }}>
                    💡 Thẻ test — không cần nhập thông tin thật
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={isProcessing}
              style={{
                ...styles.btnConfirm,
                opacity: isProcessing ? 0.7 : 1,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
            >
              ✅ Xác nhận thanh toán {formatCurrency(bookingInfo?.totalAmount ?? Number(amount) ?? 0)}
            </motion.button>

            <button
              onClick={handleCancel}
              disabled={isProcessing}
              style={styles.btnCancelPayment}
            >
              ✕ Hủy thanh toán
            </button>
          </div>

          <p style={{ color: '#374151', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
            🔒 Giao dịch được mã hóa SSL 256-bit (giả lập)
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0B0F19 0%, #111827 100%)',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '14px 0',
    backdropFilter: 'blur(12px)',
  },
  headerContent: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { display: 'flex', gap: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  countdownBadge: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid',
    fontSize: 14,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  container: {
    maxWidth: 1100,
    margin: '40px auto',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  summaryCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 28,
  },
  paymentCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 28,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 20px',
    paddingBottom: 14,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  movieInfo: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  poster: {
    width: 70,
    height: 100,
    objectFit: 'cover',
    borderRadius: 8,
    flexShrink: 0,
  },
  infoRow: {
    color: '#9CA3AF',
    fontSize: 13,
    margin: '0 0 4px',
  },
  seatBadge: {
    background: 'rgba(229,9,20,0.12)',
    border: '1px solid rgba(229,9,20,0.25)',
    color: '#FCA5A5',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  mockNotice: {
    marginTop: 16,
    padding: '10px 14px',
    background: 'rgba(234,179,8,0.08)',
    border: '1px solid rgba(234,179,8,0.2)',
    borderRadius: 10,
    color: '#FDE68A',
    fontSize: 12,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  methodBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 18px',
    borderRadius: 12,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    width: '100%',
  },
  checkMark: {
    position: 'absolute',
    right: 14,
    color: '#E50914',
    fontWeight: 700,
    fontSize: 16,
  },
  bankingBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  bankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    color: '#9CA3AF',
    fontSize: 13,
  },
  fakeQR: {
    margin: '12px auto 0',
    width: 100,
    height: 100,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fakeInput: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#9CA3AF',
    fontSize: 13,
    boxSizing: 'border-box',
    fontFamily: 'monospace',
  },
  btnConfirm: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #16a34a, #15803d)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
    fontFamily: "'Inter', sans-serif",
  },
  btnCancelPayment: {
    width: '100%',
    padding: '12px 24px',
    background: 'transparent',
    color: '#6B7280',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s ease',
  },
  btnPrimary: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #E50914, #b00710)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  btnSecondary: {
    padding: '12px 28px',
    background: 'rgba(255,255,255,0.05)',
    color: '#9CA3AF',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  fullCenter: {
    minHeight: '100vh',
    background: '#0B0F19',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(229,9,20,0.2)',
    borderTop: '3px solid #E50914',
    borderRadius: '50%',
  },
  processingBox: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: 400,
  },
  methodBadge: {
    marginTop: 20,
    padding: '8px 20px',
    background: 'rgba(229,9,20,0.1)',
    border: '1px solid rgba(229,9,20,0.25)',
    borderRadius: 20,
    color: '#FCA5A5',
    fontSize: 13,
  },
  successBox: {
    background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: 24,
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: 400,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10B981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    color: '#fff',
    margin: '0 auto',
    boxShadow: '0 8px 30px rgba(16,185,129,0.4)',
  },
  errorBox: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: 400,
  },
  failedIcon: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    color: '#fff',
    margin: '0 auto',
    boxShadow: '0 8px 30px rgba(220,38,38,0.35)',
  },
};

export default MockPaymentPage;
