import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Dropdown, Menu as AntdMenu } from "antd";
import { useAuth } from "../../context/AuthContext"; // Ensure the path to AuthContext is correct
import avatar from "../../Images/avata.jpg"; // Ensure the avatar path is correct
import {
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  ScheduleOutlined,
  SolutionOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

const NavbarLoginStaff: React.FC = () => {
  const { user, isAuthenticated } = useAuth(); // Only get what's needed from context
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullname");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/";
  };

  // Staff dropdown menu
  const staffMenu = (
    <AntdMenu>
      <AntdMenu.Item key="1" icon={<HomeOutlined />}>
        <Link to="/">Home</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="2" icon={<UserOutlined />}>
        <Link to="/profile">Personal Information</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="3" icon={<ScheduleOutlined />}>
        <Link to="/showtimes">Booking / Showtimes</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="4" icon={<SolutionOutlined />}>
        <Link to="/staff">Manage Bookings</Link>
      </AntdMenu.Item>
      <AntdMenu.Item key="6" icon={<VideoCameraOutlined />}>
        <Link to="/qrcode">QR Code</Link>
      </AntdMenu.Item>
      <AntdMenu.Item
        key="5"
        icon={<LogoutOutlined />}
        danger
        onClick={handleLogout}
      >
        Logout
      </AntdMenu.Item>
    </AntdMenu>
  );

  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="font-bold text-xl">CinemaPlus Staff</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/showtimes"
              className="flex items-center px-3 py-2 rounded-md hover:bg-teal-600"
            >
              <ScheduleOutlined className="mr-2" />
              Showtimes / Booking
            </Link>
            <Link
              to="/staff"
              className="flex items-center px-3 py-2 rounded-md hover:bg-teal-600"
            >
              <SolutionOutlined className="mr-2" />
              Manage Bookings
            </Link>
            <Link
              to="/movies"
              className="flex items-center px-3 py-2 rounded-md hover:bg-teal-600"
            >
              <VideoCameraOutlined className="mr-2" />
              Movie List
            </Link>
            <Link
              to="/qrcode"
              className="flex items-center px-3 py-2 rounded-md hover:bg-teal-600"
            >
              <VideoCameraOutlined className="mr-2" />
              QR Code
            </Link>

            {/* Dropdown Avatar and User Name */}
            {isAuthenticated && user && (
              <Dropdown
                overlay={staffMenu}
                trigger={["click"]}
                placement="bottomRight"
              >
                <div className="flex items-center cursor-pointer">
                  <img
                    src={avatar}
                    alt="User Avatar"
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="ml-2">{user?.full_Name}</span>
                </div>
              </Dropdown>
            )}
          </div>

          {/* Mobile Menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-teal-600 focus:outline-none"
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

      {/* Mobile Menu (appears when button is clicked) */}
      {isMenuOpen && (
        <div className="md:hidden bg-teal-600">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/showtimes"
              className="flex items-center block px-3 py-2 rounded-md hover:bg-teal-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <ScheduleOutlined className="mr-2" />
              Showtimes / Booking
            </Link>
            <Link
              to="/manage-bookings"
              className="flex items-center block px-3 py-2 rounded-md hover:bg-teal-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <SolutionOutlined className="mr-2" />
              Manage Bookings
            </Link>
            <Link
              to="/movies"
              className="flex items-center block px-3 py-2 rounded-md hover:bg-teal-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <VideoCameraOutlined className="mr-2" />
              Movie List
            </Link>

            {/* User information and dropdown/logout for mobile */}
            {isAuthenticated && user && (
              <div className="pt-4 pb-3 border-t border-teal-700">
                <Dropdown
                  overlay={staffMenu}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <div className="flex items-center px-3 cursor-pointer">
                    <img
                      src={avatar}
                      alt="User Avatar"
                      className="h-10 w-10 rounded-full"
                    />
                    <span className="ml-3 text-base font-medium">
                      {user?.full_Name}
                    </span>
                  </div>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarLoginStaff;
