import React, { useEffect } from "react";
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
  BarChart,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";

const Navbar: React.FC = () => {
  const [isAuthenticated, setIsLoggedIn] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [fullName, setFullname] = React.useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/User/${userId}`);
      const userData = await response.json();
      setFullname(userData.fullName);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode<{
          id: string;
          role: string;
          exp: number;
        }>(token);

        if (decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setUserRole(null);
          setFullname("");
        } else {
          setUserRole(decodedToken.role);
          setIsLoggedIn(true);
          fetchUserProfile(decodedToken.id);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setIsLoggedIn(false);
        setUserRole(null);
        setFullname("");
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setFullname("");
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserRole(null);
    setFullname("");
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const user = isAuthenticated
    ? {
        fullName: fullName,
        role: userRole,
      }
    : null;

  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Film className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">CinemaPlus</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/movies"
              className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
            >
              <Ticket className="h-5 w-5 mr-1" />
              <span>Movies</span>
            </Link>
            <Link
              to="/showtimes"
              className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
            >
              <CalendarDays className="h-5 w-5 mr-1" />
              <span>Showtimes</span>
            </Link>
            <Link
              to="/promotion"
              className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
            >
              <BarChart className="h-5 w-5 mr-1" />
              <span>Promotions</span>
            </Link>

            {isAuthenticated && userRole === "admin" && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
                >
                  <BarChart className="h-5 w-5 mr-1" />
                  <span>Admin Dashboard</span>
                </Link>
                <Link
                  to="/admin/employees"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
                >
                  <User className="h-5 w-5 mr-1" />
                  <span>Employees</span>
                </Link>
              </>
            )}

            {isAuthenticated &&
              (userRole === "admin" || userRole === "Manager") && (
                <Link
                  to="/manage/movies"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
                >
                  <Film className="h-5 w-5 mr-1" />
                  <span>Manage Movies</span>
                </Link>
              )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
                >
                  <User className="h-5 w-5 mr-1" />
                  <span>{fullName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
                >
                  <LogIn className="h-5 w-5 mr-1" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
                >
                  <UserPlus className="h-5 w-5 mr-1" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-800 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-indigo-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/movies"
              className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <Ticket className="h-5 w-5 mr-1" />
              <span>Movies</span>
            </Link>
            <Link
              to="/showtimes"
              className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <CalendarDays className="h-5 w-5 mr-1" />
              <span>Showtimes</span>
            </Link>
            <Link
              to="/promotions"
              className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <BarChart className="h-5 w-5 mr-1" />
              <span>Promotions</span>
            </Link>

            {isAuthenticated && userRole === "admin" && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BarChart className="h-5 w-5 mr-1" />
                  <span>Admin Dashboard</span>
                </Link>
                <Link
                  to="/admin/employees"
                  className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-1" />
                  <span>Employees</span>
                </Link>
              </>
            )}

            {isAuthenticated &&
              (userRole === "admin" || userRole === "Manager") && (
                <Link
                  to="/manage/movies"
                  className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Film className="h-5 w-5 mr-1" />
                  <span>Manage Movies</span>
                </Link>
              )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-1" />
                  <span>{fullName}</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5 mr-1" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserPlus className="h-5 w-5 mr-1" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
