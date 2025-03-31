import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout'; // Import Layout

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
import CinemaRoomPage from './pages/CinemaRoomPage'; // Sửa lỗi import
import { useLocation } from 'react-router-dom';
import ManageCinemaRoomPage from './pages/ManageCinemaRoomPage';
import ManagePromotionPage from './pages/ManagePromotionPage';
import UserPromotionsPage from './pages/PromotionPage';
import TicketSellingByStaff from './pages/StaffPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import ManageBookingPage from './pages/ManageBookingPage';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout showNavbar={true}> {/* Chỉ sử dụng Layout ở đây */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/booking/:id" element={<BookingPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/promotion" element={<UserPromotionsPage />} />
            {/* Route chính AdminDashboardPage với các route con */}
            <Route path="/manage-accounts" element={<ManageEmployeesPage />} />
            <Route path="/manage-movies" element={<ManageMoviesPage />} />
            <Route path="/manage-showtimes" element={<ManageShowtimesPage />} />
            <Route path="/staff" element={<TicketSellingByStaff />} />
            <Route path="/booking-success" element={<BookingSuccessPage />} />
            <Route path="/manage-booking" element={<ManageBookingPage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/showtimes" element={<ShowtimesPage />} />
            <Route path="/showtimes/:movieId" element={<ShowtimesPage />} />
            <Route path="/cinema-room" element={<CinemaRoomPage />} />
            <Route path="/cinema-room/:showtimeId" element={<CinemaRoomPage />} />
            <Route path="/manage-promotion" element={<ManagePromotionPage />} />
            <Route path="/manage-cinemaroom" element={<ManageCinemaRoomPage />} />
            {/* Catch-all route */}
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
