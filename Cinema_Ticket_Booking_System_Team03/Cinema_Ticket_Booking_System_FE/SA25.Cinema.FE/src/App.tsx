import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SettingsTab from './components/Profile/SettingsTab';
import QRCodeScanner from './pages/QRCodeScan';
// Pages
import ManageEmployeesPage from './pages/ManageEmployeesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import ManageMoviesPage from './pages/ManageMoviesPage';
import ShowtimesPage from './pages/ShowtimesPage';
import ManageShowtimesPage from './pages/ManageShowtimesPage';
import ForgotPassword from './pages/ForgotPassword';
import CinemaRoomPage from './pages/CinemaRoomPage';
import ManageCinemaRoomPage from './pages/ManageCinemaRoomPage';
import ManagePromotionPage from './pages/ManagePromotionPage';
import UserPromotionsPage from './pages/PromotionPage';
import TicketSellingByStaff from './pages/StaffPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import ManageBookingPage from './pages/ManageBookingPage';
import QRCodePage from './pages/Qrcode';
import PasswordChangeRequiredGuard from './components/PasswordChangeRequiredGuard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={5000} />
        <Layout showNavbar={true}>
          <Routes>
            {/* Route công khai */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Route cần đăng nhập nhưng không cần kiểm tra đổi mật khẩu */}
            <Route path="/profile" element={
              <ProtectedRoute requirePasswordChange={false}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Các route khác cần đăng nhập và kiểm tra đổi mật khẩu */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/booking/:id" element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            } />
            <Route path="/promotion" element={
              <ProtectedRoute>
                <UserPromotionsPage />
              </ProtectedRoute>
            } />
            <Route path="/manage-accounts" element={
              <ProtectedRoute>
                <ManageEmployeesPage />
              </ProtectedRoute>
            } />
            <Route path="/manage-movies" element={
              <ProtectedRoute>
                <ManageMoviesPage />
              </ProtectedRoute>
            } />
            <Route path="/manage-showtimes" element={
              <ProtectedRoute>
                <ManageShowtimesPage />
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute>
                <TicketSellingByStaff />
              </ProtectedRoute>
            } />
            <Route path="/booking-success" element={
              <ProtectedRoute>
                <BookingSuccessPage />
              </ProtectedRoute>
            } />
            <Route path="/manage-booking" element={
              <ProtectedRoute>
                <ManageBookingPage />
              </ProtectedRoute>
            } />
            <Route path="/movies" element={
              <ProtectedRoute>
                <MoviesPage />
              </ProtectedRoute>
            } />
            <Route path="/movie/:id" element={
              <ProtectedRoute>
                <MovieDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/showtimes" element={
              <ProtectedRoute>
                <ShowtimesPage />
              </ProtectedRoute>
            } />
            <Route path="/showtimes/:movieId" element={
              <ProtectedRoute>
                <ShowtimesPage />
              </ProtectedRoute>
            } />
            <Route path="/cinema-room" element={
              <ProtectedRoute>
                <CinemaRoomPage />
              </ProtectedRoute>
            } />
            <Route path="/cinema-room/:showtimeId" element={
              <ProtectedRoute>
                <CinemaRoomPage />
              </ProtectedRoute>
            } />
            <Route path="/manage-promotion" element={
              <ProtectedRoute>
                <ManagePromotionPage />
              </ProtectedRoute>
            } />
            <Route path="/manage-cinemaroom" element={
              <ProtectedRoute>
                <ManageCinemaRoomPage />
              </ProtectedRoute>
            } />
            <Route path="/qrcode" element={
              <ProtectedRoute>
                <QRCodePage />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </Layout>
=======
      <PasswordChangeRequiredGuard>
        <AppContent />
        </PasswordChangeRequiredGuard>
      </Router>
    </AuthProvider>
  );
}
}

export default App;