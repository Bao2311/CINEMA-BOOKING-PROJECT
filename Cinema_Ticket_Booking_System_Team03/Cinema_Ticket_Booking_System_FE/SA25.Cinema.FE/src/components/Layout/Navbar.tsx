// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Film, User, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';

// const Navbar: React.FC = () => {
//   const { user, isAuthenticated, logout } = useAuth();
//   const navigate = useNavigate();
//   const [isMenuOpen, setIsMenuOpen] = React.useState(false);

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   return (
//     <nav className="bg-indigo-900 text-white shadow-lg">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16">
//           <div className="flex items-center">
//             <Link to="/" className="flex items-center">
//               <Film className="h-8 w-8 mr-2" />
//               <span className="font-bold text-xl">CinemaPlus</span>
//             </Link>
//           </div>

//           {/* Desktop menu */}
//           <div className="hidden md:flex items-center space-x-4">
//             <Link to="/movies" className="px-3 py-2 rounded-md hover:bg-indigo-800">
//               Movies
//             </Link>
//             <Link to="/showtimes" className="px-3 py-2 rounded-md hover:bg-indigo-800">
//               Showtimes
//             </Link>
//             <Link to="/promotions" className="px-3 py-2 rounded-md hover:bg-indigo-800">
//               Promotions
//             </Link>
            
//             {isAuthenticated && user?.role === 'admin' && (
//               <>
//                 <Link to="/admin/dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-800">
//                   Admin Dashboard
//                 </Link>
//                 <Link to="/admin/employees" className="px-3 py-2 rounded-md hover:bg-indigo-800">
//                   Employees
//                 </Link>
//               </>
//             )}
            
//             {isAuthenticated && (user?.role === 'admin' || user?.role === 'Manager') && (
//               <Link to="/manage/movies" className="px-3 py-2 rounded-md hover:bg-indigo-800">
//                 Manage Movies
//               </Link>
//             )}
            
//             {isAuthenticated ? (
//               <div className="flex items-center space-x-4">
//                 <Link to="/profile" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800">
//                   <User className="h-5 w-5 mr-1" />
//                   <span>{user?.fullName}</span>
//                 </Link>
//                 <button
//                   onClick={handleLogout}
//                   className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800"
//                 >
//                   <LogOut className="h-5 w-5 mr-1" />
//                   <span>Logout</span>
//                 </button>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-4">
//                 <Link to="/login" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800">
//                   <LogIn className="h-5 w-5 mr-1" />
//                   <span>Login</span>
//                 </Link>
//                 <Link to="/register" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800">
//                   <UserPlus className="h-5 w-5 mr-1" />
//                   <span>Register</span>
//                 </Link>
//               </div>
//             )}
//           </div>

//           {/* Mobile menu button */}
//           <div className="md:hidden flex items-center">
//             <button
//               onClick={toggleMenu}
//               className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-800 focus:outline-none"
//             >
//               {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile menu */}
//       {isMenuOpen && (
//         <div className="md:hidden bg-indigo-800">
//           <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
//             <Link
//               to="/movies"
//               className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//               onClick={() => setIsMenuOpen(false)}
//             >
//               Movies
//             </Link>
//             <Link
//               to="/showtimes"
//               className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//               onClick={() => setIsMenuOpen(false)}
//             >
//               Showtimes
//             </Link>
//             <Link
//               to="/promotions"
//               className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//               onClick={() => setIsMenuOpen(false)}
//             >
//               Promotions
//             </Link>
            
//             {isAuthenticated && user?.role === 'admin' && (
//               <>
//                 <Link
//                   to="/admin/dashboard"
//                   className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   Admin Dashboard
//                 </Link>
//                 <Link
//                   to="/admin/employees"
//                   className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   Employees
//                 </Link>
//               </>
//             )}
            
//             {isAuthenticated && (user?.role === 'admin' || user?.role === 'employee') && (
//               <Link
//                 to="/manage/movies"
//                 className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//                 onClick={() => setIsMenuOpen(false)}
//               >
//                 Manage Movies
//               </Link>
//             )}
            
//             {isAuthenticated ? (
//               <>
//                 <Link
//                   to="/profile"
//                   className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   <div className="flex items-center">
//                     <User className="h-5 w-5 mr-1" />
//                     <span>{user?.fullName}</span>
//                   </div>
//                 </Link>
//                 <button
//                   onClick={() => {
//                     handleLogout();
//                     setIsMenuOpen(false);
//                   }}
//                   className="w-full text-left block px-3 py-2 rounded-md hover:bg-indigo-700"
//                 >
//                   <div className="flex items-center">
//                     <LogOut className="h-5 w-5 mr-1" />
//                     <span>Logout</span>
//                   </div>
//                 </button>
//               </>
//             ) : (
//               <>
//                 <Link
//                   to="/login"
//                   className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   <div className="flex items-center">
//                     <LogIn className="h-5 w-5 mr-1" />
//                     <span>Login</span>
//                   </div>
//                 </Link>
//                 <Link
//                   to="/register"
//                   className="block px-3 py-2 rounded-md hover:bg-indigo-700"
//                   onClick={() => setIsMenuOpen(false)}
//                 >
//                   <div className="flex items-center">
//                     <UserPlus className="h-5 w-5 mr-1" />
//                     <span>Register</span>
//                   </div>
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navbar;


import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, User, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

// Thay thế useAuth bằng cách triển khai trực tiếp xác thực JWT
// import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  // Thay thế bằng state cho JWT auth
  // const { user, isAuthenticated, logout } = useAuth();
  const [isAuthenticated, setIsLoggedIn] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [fullName, setFullname] = React.useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Hàm để lấy thông tin người dùng từ API
  const fetchUserProfile = async (userId: string) => {
    try {
      // Thay thế bằng API endpoint thực của bạn
      const response = await fetch(`/api/User/${userId}`);
      const userData = await response.json();
      setFullname(userData.fullName);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Xác thực token khi component được tải hoặc khi route thay đổi
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode<{
          id: string;
          role: string;
          exp: number;
        }>(token);
        
        // Kiểm tra xem token có hết hạn không
        if (decodedToken.exp * 1000 < Date.now()) {
          // Token đã hết hạn
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUserRole(null);
          setFullname('');
        } else {
          // Token hợp lệ
          setUserRole(decodedToken.role);
          setIsLoggedIn(true);
          fetchUserProfile(decodedToken.id);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsLoggedIn(false);
        setUserRole(null);
        setFullname('');
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setFullname('');
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
    setFullname('');
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Tạo object user tương thích với code hiện tại
  const user = isAuthenticated ? {
    fullName: fullName,
    role: userRole
  } : null;

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

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/movies" className="px-3 py-2 rounded-md hover:bg-indigo-800">
              Movies
            </Link>
            <Link to="/showtimes" className="px-3 py-2 rounded-md hover:bg-indigo-800">
              Showtimes
            </Link>
            <Link to="/promotions" className="px-3 py-2 rounded-md hover:bg-indigo-800">
              Promotions
            </Link>
            
            {isAuthenticated && userRole === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-800">
                  Admin Dashboard
                </Link>
                <Link to="/admin/employees" className="px-3 py-2 rounded-md hover:bg-indigo-800">
                  Employees
                </Link>
              </>
            )}
            
            {isAuthenticated && (userRole === 'admin' || userRole === 'Manager') && (
              <Link to="/manage/movies" className="px-3 py-2 rounded-md hover:bg-indigo-800">
                Manage Movies
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800">
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
                <Link to="/login" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800">
                  <LogIn className="h-5 w-5 mr-1" />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="flex items-center px-3 py-2 rounded-md hover:bg-indigo-800">
                  <UserPlus className="h-5 w-5 mr-1" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-800 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-indigo-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/movies"
              className="block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Movies
            </Link>
            <Link
              to="/showtimes"
              className="block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Showtimes
            </Link>
            <Link
              to="/promotions"
              className="block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Promotions
            </Link>
            
            {isAuthenticated && userRole === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
                <Link
                  to="/admin/employees"
                  className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Employees
                </Link>
              </>
            )}
            
            {isAuthenticated && (userRole === 'admin' || userRole === 'Manager') && (
              <Link
                to="/manage/movies"
                className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Manage Movies
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-1" />
                    <span>{fullName}</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md hover:bg-indigo-700"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 mr-1" />
                    <span>Logout</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <LogIn className="h-5 w-5 mr-1" />
                    <span>Login</span>
                  </div>
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-1" />
                    <span>Register</span>
                  </div>
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