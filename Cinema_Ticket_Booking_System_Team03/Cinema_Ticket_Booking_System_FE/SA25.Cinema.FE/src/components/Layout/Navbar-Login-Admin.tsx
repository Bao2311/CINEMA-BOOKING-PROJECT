import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Dropdown, Menu as AntdMenu } from "antd";
import avatar from "../../Images/avata.jpg";
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  EditOutlined,
  SettingOutlined,
  ScheduleOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const NavbarLoginAdmin: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // Dropdown menu for Manager
  const managerMenu = (
    <AntdMenu>
      <AntdMenu.Item key="1" icon={<EditOutlined />}>
        <Link to="/manage-movies">Manage Movies</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="2" icon={<ScheduleOutlined />}>
        <Link to="/manage-showtimes">Manage Showtimes</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="3" icon={<SettingOutlined />}>
        <Link to="/manage-accounts">Manage Accounts</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="4" icon={<FileSearchOutlined />}>
        <Link to="/manage-booking">Manage Booking</Link>
      </AntdMenu.Item>
    </AntdMenu>
  );

  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="font-bold text-xl">CinemaPlus Admin</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/movies"
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-indigo-800 transition-all duration-200 ease-in-out"
            >
              <VideoCameraOutlined />
              <span>Movies</span>
            </Link>
            <Link
              to="/showtimes"
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-indigo-800 transition-all duration-200 ease-in-out"
            >
              <CalendarOutlined />
              <span>Showtimes</span>
            </Link>
            <Link
              to="/statistics"
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-indigo-800 transition-all duration-200 ease-in-out"
            >
              <BarChartOutlined />
              <span>Statistics</span>
            </Link>
            <Dropdown overlay={managerMenu} trigger={["click"]}>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-indigo-800 cursor-pointer transition-all duration-200 ease-in-out">
                <SettingOutlined />
                <span>Manager</span>
              </div>
            </Dropdown>

            <Link
              to="/profile"
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-indigo-800 transition-all duration-200 ease-in-out"
            >
              <UserOutlined />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-red-700 transition-all duration-200 ease-in-out"
            >
              <LogoutOutlined />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu toggle */}
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

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-indigo-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/movies"
              className="flex items-center space-x-2 block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <VideoCameraOutlined />
              <span>Movies</span>
            </Link>
            <Link
              to="/showtimes"
              className="flex items-center space-x-2 block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <CalendarOutlined />
              <span>Showtimes</span>
            </Link>
            <Dropdown overlay={managerMenu} trigger={["click"]}>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-indigo-700 cursor-pointer">
                <SettingOutlined />
                <span>Manager</span>
              </div>
            </Dropdown>
            <Link
              to="/statistics"
              className="flex items-center space-x-2 block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <BarChartOutlined />
              <span>Statistics</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center space-x-2 block px-3 py-2 rounded-md hover:bg-indigo-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <UserOutlined />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 block px-3 py-2 rounded-md hover:bg-red-700"
            >
              <LogoutOutlined />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarLoginAdmin;
