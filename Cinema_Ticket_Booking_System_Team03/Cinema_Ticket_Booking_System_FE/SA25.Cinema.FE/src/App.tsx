import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRCodeScanner from "./pages/QRCodeScan";

// Pages
import ManageEmployeesPage from "./pages/ManageEmployeesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import BookingPage from "./pages/BookingPage";
import ManageMoviesPage from "./pages/ManageMoviesPage";
import ShowtimesPage from "./pages/ShowtimesPage";
import ManageShowtimesPage from "./pages/ManageShowtimesPage";
import ForgotPassword from "./pages/ForgotPassword";
import CinemaRoomPage from "./pages/CinemaRoomPage";
import ManageCinemaRoomPage from "./pages/ManageCinemaRoomPage";
import ManagePromotionPage from "./pages/ManagePromotionPage";
import UserPromotionsPage from "./pages/PromotionPage";
import TicketSellingByStaff from "./pages/StaffPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import ManageBookingPage from "./pages/ManageBookingPage";
import PasswordChangeRequiredGuard from "./components/PasswordChangeRequiredGuard";
import Statistics from "./pages/StatisticsPage";
import MockPaymentPage from "./pages/MockPaymentPage";
import ManageTicketPage from "./pages/ManageTicketPage";

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#E50914",
          colorBgBase: "#0B0F19",
          colorBgContainer: "#161D2F",
          colorBgElevated: "#1E2738",
          colorBorder: "rgba(255, 255, 255, 0.1)",
          colorText: "#FFFFFF",
          colorTextSecondary: "#9CA3AF",
          borderRadius: 12,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        },
      }}
    >
      <AuthProvider>
        <Router>
          <PasswordChangeRequiredGuard>
            <AppContent />
          </PasswordChangeRequiredGuard>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

function AppContent() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
      <Layout showNavbar={true}>
        <Routes>
          {/* Route công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Trang thanh toán giả lập — cần auth nhưng không cần navbar layout đặc biệt */}
          <Route
            path="/mock-payment"
            element={
              <ProtectedRoute mode="hard">
                <MockPaymentPage />
              </ProtectedRoute>
            }
          />

          {/* Profile routes — cần đăng nhập (hard) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute mode="hard" promptMessage="Bạn cần đăng nhập để xem hồ sơ.">
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/bookings"
            element={
              <ProtectedRoute mode="hard" promptMessage="Bạn cần đăng nhập để xem lịch sử đặt vé.">
                <ProfilePage defaultTab="bookings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/notifications"
            element={
              <ProtectedRoute mode="hard">
                <ProfilePage defaultTab="notifications" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/checkins"
            element={
              <ProtectedRoute mode="hard">
                <ProfilePage defaultTab="checkins" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/settings"
            element={
              <ProtectedRoute mode="hard" requirePasswordChange={false}>
                <ProfilePage defaultTab="settings" />
              </ProtectedRoute>
            }
          />

          {/* =============================================
           *  TRANG XEM CÔNG KHAI (soft mode)
           *  → Cho phép xem, hiện modal nhắc khi cần action
           * ============================================= */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/movies"
            element={<MoviesPage />}
          />
          <Route
            path="/movie/:id"
            element={<MovieDetailPage />}
          />
          <Route
            path="/showtimes"
            element={<ShowtimesPage />}
          />
          <Route
            path="/showtimes/:movieId"
            element={<ShowtimesPage />}
          />
          <Route
            path="/promotion"
            element={<UserPromotionsPage />}
          />

          {/* =============================================
           *  TRANG CẦN ĐĂNG NHẬP (hard mode)
           *  → Redirect thẳng đến /login nếu chưa xác thực
           * ============================================= */}
          <Route
            path="/booking/:id"
            element={
              <ProtectedRoute
                mode="hard"
                promptMessage="Bạn cần đăng nhập để đặt vé."
              >
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cinema-room/:showtimeId"
            element={
              <ProtectedRoute
                mode="hard"
                promptMessage="Bạn cần đăng nhập để chọn ghế."
              >
                <CinemaRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-success"
            element={
              <ProtectedRoute mode="hard">
                <BookingSuccessPage />
              </ProtectedRoute>
            }
          />

          {/* Staff routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <TicketSellingByStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qrcode"
            element={
              <ProtectedRoute>
                <QRCodeScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-ticket"
            element={
              <ProtectedRoute>
                <ManageTicketPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/manage-accounts"
            element={
              <ProtectedRoute>
                <ManageEmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-movies"
            element={
              <ProtectedRoute>
                <ManageMoviesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-showtimes"
            element={
              <ProtectedRoute>
                <ManageShowtimesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-cinemaroom"
            element={
              <ProtectedRoute>
                <ManageCinemaRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-promotion"
            element={
              <ProtectedRoute>
                <ManagePromotionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-booking"
            element={
              <ProtectedRoute>
                <ManageBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </>
  );
}

// 404 Page Component
const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4">
      <div className="text-center bg-[#161D2F] border border-white/10 p-10 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-7xl font-black text-red-500">404</h1>
        <h2 className="text-2xl font-bold text-white mt-4">Trang không tìm thấy</h2>
        <p className="mt-2 text-gray-400 text-sm">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="mt-8">
          <button
            onClick={() => navigate("/")}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/30"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
