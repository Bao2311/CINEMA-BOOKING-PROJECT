import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context
import { AuthProvider } from "./context/AuthContext";

// Components
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PasswordChangeRequiredGuard from "./components/PasswordChangeRequiredGuard";

// Pages
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPassword from "./pages/ForgotPassword";
import ProfilePage from "./pages/ProfilePage";
import BookingPage from "./pages/BookingPage";
import ManageEmployeesPage from "./pages/ManageEmployeesPage";
import ManageMoviesPage from "./pages/ManageMoviesPage";
import ShowtimesPage from "./pages/ShowtimesPage";
import ManageShowtimesPage from "./pages/ManageShowtimesPage";
import CinemaRoomPage from "./pages/CinemaRoomPage";
import ManageCinemaRoomPage from "./pages/ManageCinemaRoomPage";
import ManagePromotionPage from "./pages/ManagePromotionPage";
import UserPromotionsPage from "./pages/PromotionPage";
import TicketSellingByStaff from "./pages/StaffPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import ManageBookingPage from "./pages/ManageBookingPage";
import QRCodeScanner from "./pages/QRCodeScan";
import StatisticsPage from "./pages/StatisticsPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <PasswordChangeRequiredGuard>
          <AppContent />
        </PasswordChangeRequiredGuard>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Layout wrapper */}
      <Layout showNavbar={true}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Profile Routes */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/bookings" element={<ProfilePage defaultTab="bookings" />} />
          <Route path="/profile/notifications" element={<ProfilePage defaultTab="notifications" />} />
          <Route
            path="/profile/settings"
            element={
              <ProtectedRoute requirePasswordChange={false}>
                <ProfilePage defaultTab="settings" />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
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
            path="/booking/:id"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion"
            element={
              <ProtectedRoute>
                <UserPromotionsPage />
              </ProtectedRoute>
            }
          />
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
            path="/staff"
            element={
              <ProtectedRoute>
                <TicketSellingByStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-success"
            element={
              <ProtectedRoute>
                <BookingSuccessPage />
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
            path="/movies"
            element={
              <ProtectedRoute>
                <MoviesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/movie/:id"
            element={
              <ProtectedRoute>
                <MovieDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/showtimes"
            element={
              <ProtectedRoute>
                <ShowtimesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/showtimes/:movieId"
            element={
              <ProtectedRoute>
                <ShowtimesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cinema-room"
            element={
              <ProtectedRoute>
                <CinemaRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cinema-room/:showtimeId"
            element={
              <ProtectedRoute>
                <CinemaRoomPage />
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
            path="/manage-cinemaroom"
            element={
              <ProtectedRoute>
                <ManageCinemaRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Route */}
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
