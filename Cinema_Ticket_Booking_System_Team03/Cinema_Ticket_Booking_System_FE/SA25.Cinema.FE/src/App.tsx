import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { AuthProvider } from './context/AuthContext';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import Navbar
import NavbarLoginAdmin from './components/Layout/Navbar';  // Import Navbar 

// Pages
import ManageEmployeesPage from './pages/ManageEmployeesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import ManageMoviesPage from './pages/ManageMoviesPage';
import ShowtimesPage from './pages/ShowtimesPage';
import ManageShowtimesPage from './pages/ManageShowtimesPage';
import Homepage_Admin from './pages/Homepage-Admin';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="min-h-screen bg-gray-100">
          {/* Đặt Navbar ở đây, để nó hiển thị trên tất cả các trang */}
          <NavbarLoginAdmin />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/booking/:id" element={<BookingPage />} />
            <Route path="/homepage-admin" element={<Homepage_Admin />} />

            {/* Route chính AdminDashboardPage với các route con */}
            <Route path="/admin" element={<AdminDashboardPage />}>
              <Route path="manage-employees" element={<ManageEmployeesPage />} />
              <Route path="manage-movies" element={<ManageMoviesPage />} />
              <Route path="manage-showtimes" element={<ManageShowtimesPage />} />
            </Route>

            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/showtimes" element={<ShowtimesPage />} />

            {/* Catch-all route */}
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
