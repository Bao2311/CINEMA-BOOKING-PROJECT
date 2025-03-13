import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Dropdown, Menu as AntdMenu } from 'antd';
import { useAuth } from '../../context/AuthContext';
import avatar from '../../Images/avata.jpg';
import { UserOutlined, LogoutOutlined, HomeOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';

const NavbarLoginAdmin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const adminMenu = (
    <AntdMenu>
      <AntdMenu.Item key="1" icon={<HomeOutlined />}>
        <Link to="/">Home Page</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="2" icon={<UserOutlined />}>
        <Link to="/profile">Profile</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="3" icon={<EditOutlined />}>
        <Link to="/edit-movie">Edit Movie</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="4" icon={<SettingOutlined />}>
        <Link to="/manage-account">Manage Account</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="5" icon={<LogoutOutlined />} danger onClick={handleLogout}>
        Log out
      </AntdMenu.Item>
    </AntdMenu>
  );

  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="font-bold text-xl">CinemaPlus Admin</span>
            </Link>
          </div>

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

            {isAuthenticated && (
              <Dropdown overlay={adminMenu} trigger={['click']} placement="bottomRight">
                <div className="flex items-center cursor-pointer">
                  <img src={avatar} alt="User Avatar" className="h-10 w-10 rounded-full" />
                  <span className="ml-2">{user?.full_Name}</span>
                </div>
              </Dropdown>
            )}
          </div>

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

            {isAuthenticated && (
              <Dropdown overlay={adminMenu} trigger={['click']} placement="bottomRight">
                <div className="flex items-center cursor-pointer">
                  <img src={avatar} alt="User Avatar" className="h-10 w-10 rounded-full" />
                  <span className="ml-2">{user?.full_Name}</span>
                </div>
              </Dropdown>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarLoginAdmin;
