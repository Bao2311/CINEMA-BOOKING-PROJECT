import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { Dropdown, Menu as AntdMenu } from 'antd'; // Import Dropdown and Menu from Ant Design
import { useAuth } from '../../context/AuthContext'; // Import context để sử dụng user và isAuthenticated
import avatar from '../../Images/avata.jpg'; // Import avatar ảnh đại diện người dùng
import { UserOutlined, FileOutlined, TransactionOutlined, WalletOutlined, DollarOutlined, LogoutOutlined,HomeOutlined,ShoppingOutlined   } from '@ant-design/icons';

const NavbarLogin: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth(); // Sử dụng useAuth để lấy trạng thái đăng nhập và thông tin người dùng
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // Bạn có thể thay thế window.location.href nếu sử dụng React Router như navigate('/login')
  };
  // Định nghĩa menu cho dropdown
  const userMenu = (
    <AntdMenu>
    <AntdMenu.Item key="1" icon={<HomeOutlined />}>
        <Link to="/">Home Page</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="2" icon={<UserOutlined />}>
        <Link to="/profile">Profile</Link>
      </AntdMenu.Item>
      {/* <AntdMenu.Item key="3" icon={<FileOutlined />}>
        <Link to="/">History</Link>
      </AntdMenu.Item> */}
      <AntdMenu.Item key="4" icon={<ShoppingOutlined />}>
        <Link to="/My-Ticket">My Ticket</Link>
      </AntdMenu.Item>
      {/* <AntdMenu.Item key="4" icon={<WalletOutlined />}>
        <Link to="/member-profile/wallet">Wallet</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="5" icon={<DollarOutlined />}>
        <Link to="/member-profile/withdraw">Withdraw</Link>
      </AntdMenu.Item> */}
      <AntdMenu.Item
        key="6"
        icon={<LogoutOutlined />}
        danger
        onClick={handleLogout}
      >
        Log out
      </AntdMenu.Item>
    </AntdMenu>
  );

  

  // Xử lý điều hướng và menu theo role
  const renderRoleSpecificLinks = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <>
            <Link to="/admin-dashboard" className="px-3 py-2 rounded-md hover:bg-indigo-800">
              Admin Dashboard
            </Link>
            <Link to="/manage-employees" className="px-3 py-2 rounded-md hover:bg-indigo-800">
              Employees
            </Link>
          </>
        );
      case 'manager':
        return (
          <Link to="/manage/teams" className="px-3 py-2 rounded-md hover:bg-indigo-800">
            Manage Teams
          </Link>
        );
      case 'staff':
        return (
          <Link to="/manage/assignments" className="px-3 py-2 rounded-md hover:bg-indigo-800">
            Manage Assignments
          </Link>
        );
      case 'customer':
        return (
          <Link to="/profile" className="px-3 py-2 rounded-md hover:bg-indigo-800">
            My Profile
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
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

            {/* Render menu items based on user role */}
            {isAuthenticated && renderRoleSpecificLinks()}

            {/* Avatar & Profile Menu */}
            {isAuthenticated ? (
              <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                <div className="flex items-center cursor-pointer">
                  <img src={avatar} alt="User Avatar" className="h-10 w-10 rounded-full" />
                  <span className="ml-2">{user?.fullName}</span>
                </div>
              </Dropdown>
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

            {/* Render menu items based on user role */}
            {isAuthenticated && renderRoleSpecificLinks()}

            {/* Avatar & Profile Menu */}
            {isAuthenticated ? (
              <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                <div className="flex items-center cursor-pointer">
                  <img src={avatar} alt="User Avatar" className="h-10 w-10 rounded-full" />
                  <span className="ml-2">{user?.fullName}</span>
                </div>
              </Dropdown>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="block px-3 py-2 rounded-md hover:bg-indigo-700" onClick={() => setIsMenuOpen(false)}>
                  <LogIn className="h-5 w-5 mr-1" />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="block px-3 py-2 rounded-md hover:bg-indigo-700" onClick={() => setIsMenuOpen(false)}>
                  <UserPlus className="h-5 w-5 mr-1" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarLogin;
