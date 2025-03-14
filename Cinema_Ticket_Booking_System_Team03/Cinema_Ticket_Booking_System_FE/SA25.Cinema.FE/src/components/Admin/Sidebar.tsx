import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Users, Ticket, Calendar, Settings, Menu } from 'lucide-react'; // Import icons

const Sidebar: React.FC = () => {
  const location = useLocation(); // To check the current page
  const [isCollapsed, setIsCollapsed] = useState(false); // State for sidebar collapse

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`bg-gray-800 text-white h-full ${isCollapsed ? 'w-20' : 'w-64'} transition-width duration-300`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-2xl font-bold">Admin</div>
        <button onClick={toggleSidebar} className="text-white focus:outline-none">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <nav>
        <ul className="space-y-4">
          <li>
            <Link
              to="/admin/dashboard"
              className={`flex items-center space-x-3 p-4 rounded-md hover:bg-gray-700 ${location.pathname === '/admin/dashboard' ? 'bg-gray-700' : ''}`}
            >
              <Ticket className="h-5 w-5" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/admin/manage-movies"
              className={`flex items-center space-x-3 p-4 rounded-md hover:bg-gray-700 ${location.pathname === '/admin/manage-movies' ? 'bg-gray-700' : ''}`}
            >
              <Film className="h-5 w-5" />
              {!isCollapsed && <span>Manage Movies</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/admin/manage-employees"
              className={`flex items-center space-x-3 p-4 rounded-md hover:bg-gray-700 ${location.pathname === '/admin/manage-employees' ? 'bg-gray-700' : ''}`}
            >
              <Users className="h-5 w-5" />
              {!isCollapsed && <span>Manage Employees</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/admin/manage-showtimes"
              className={`flex items-center space-x-3 p-4 rounded-md hover:bg-gray-700 ${location.pathname === '/admin/manage-showtimes' ? 'bg-gray-700' : ''}`}
            >
              <Calendar className="h-5 w-5" />
              {!isCollapsed && <span>Manage Showtimes</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/admin/manage-bookings"
              className={`flex items-center space-x-3 p-4 rounded-md hover:bg-gray-700 ${location.pathname === '/admin/manage-bookings' ? 'bg-gray-700' : ''}`}
            >
              <Ticket className="h-5 w-5" />
              {!isCollapsed && <span>Manage Bookings</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/admin/settings"
              className={`flex items-center space-x-3 p-4 rounded-md hover:bg-gray-700 ${location.pathname === '/admin/settings' ? 'bg-gray-700' : ''}`}
            >
              <Settings className="h-5 w-5" />
              {!isCollapsed && <span>Settings</span>}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;