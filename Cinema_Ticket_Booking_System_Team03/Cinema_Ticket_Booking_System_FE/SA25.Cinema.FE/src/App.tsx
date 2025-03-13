import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import ShowtimesPage from './pages/ShowtimesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageMoviesPage from './pages/ManageMoviesPage';
import { AuthProvider } from './context/AuthContext';

// Pages
import ManageEmployeesPage from './pages/ManageEmployeesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import PromotionsPage from './pages/PromotionsPage';

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/booking/:id" element={<BookingPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/manage-movies" element={<ManageMoviesPage />} />
            <Route path="/manage-employees" element={<ManageEmployeesPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/showtimes" element={<ShowtimesPage />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
