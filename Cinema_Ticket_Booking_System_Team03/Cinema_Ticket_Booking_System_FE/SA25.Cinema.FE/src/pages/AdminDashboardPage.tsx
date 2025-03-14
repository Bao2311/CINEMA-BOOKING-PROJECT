// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { BarChart, PieChart, Users, Film, Ticket, DollarSign, Calendar, TrendingUp } from 'lucide-react';
// import Layout from '../components/Layout/Layout';
// import { useAuth } from '../context/AuthContext';

// const AdminDashboardPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { user, isAuthenticated } = useAuth();
  
//   // Mock data for dashboard
//   const [stats, setStats] = useState({
//     totalRevenue: 0,
//     ticketsSold: 0,
//     activeMovies: 0,
//     upcomingMovies: 0,
//     totalCustomers: 0,
//     totalEmployees: 0,
//   });
  
//   useEffect(() => {
//     // Check if user is authenticated and is an admin
//     // if (!isAuthenticated || (user && user.role !== 'admin')) {
//     //   navigate('/');
//     //   return;
//     // }
    
//     // In a real app, this would be an API call
//     // For now, we'll use mock data
//     setStats({
//       totalRevenue: 125680,
//       ticketsSold: 4256,
//       activeMovies: 12,
//       upcomingMovies: 8,
//       totalCustomers: 3500,
//       totalEmployees: 25,
//     });
//   }, [isAuthenticated, user, navigate]);

//   return (
//     <Layout>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//           <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
//             <div className="flex items-center">
//               <div className="bg-green-100 p-3 rounded-full mr-4">
//                 <DollarSign className="h-6 w-6 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Total Revenue</p>
//                 <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
//             <div className="flex items-center">
//               <div className="bg-blue-100 p-3 rounded-full mr-4">
//                 <Ticket className="h-6 w-6 text-blue-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Tickets Sold</p>
//                 <p className="text-2xl font-bold">{stats.ticketsSold.toLocaleString()}</p>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
//             <div className="flex items-center">
//               <div className="bg-purple-100 p-3 rounded-full mr-4">
//                 <Film className="h-6 w-6 text-purple-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Active Movies</p>
//                 <p className="text-2xl font-bold">{stats.activeMovies}</p>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
//             <div className="flex items-center">
//               <div className="bg-yellow-100 p-3 rounded-full mr-4">
//                 <Calendar className="h-6 w-6 text-yellow-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Upcoming Movies</p>
//                 <p className="text-2xl font-bold">{stats.upcomingMovies}</p>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
//             <div className="flex items-center">
//               <div className="bg-indigo-100 p-3 rounded-full mr-4">
//                 <Users className="h-6 w-6 text-indigo-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Total Customers</p>
//                 <p className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</p>
//               </div>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
//             <div className="flex items-center">
//               <div className="bg-red-100 p-3 rounded-full mr-4">
//                 <Users className="h-6 w-6 text-red-600" />
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Total Employees</p>
//                 <p className="text-2xl font-bold">{stats.totalEmployees}</p>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         {/* Charts */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-xl font-bold text-gray-900">Revenue by Month</h2>
//               <div className="flex items-center text-sm text-gray-500">
//                 <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
//                 <span>+12.5% from last year</span>
//               </div>
//             </div>
//             <div className="h-64 flex items-center justify-center">
//               <BarChart className="h-12 w-12 text-gray-300" />
//               <p className="ml-4 text-gray-500">Chart visualization would appear here</p>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-lg shadow-md p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-xl font-bold text-gray-900">Ticket Sales by Movie</h2>
//               <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
//                 <option>Last 7 days</option>
//                 <option>Last 30 days</option>
//                 <option>Last 90 days</option>
//               </select>
//             </div>
//             <div className="h-64 flex items-center justify-center">
//               <PieChart className="h-12 w-12 text-gray-300" />
//               <p className="ml-4 text-gray-500">Chart visualization would appear here</p>
//             </div>
//           </div>
//         </div>
        
//         {/* Recent Bookings */}
//         <div className="bg-white rounded-lg shadow-md overflow-hidden">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Booking ID
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Movie
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date & Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Seats
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Amount
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {/* Mock data for recent bookings */}
//                 {[1, 2, 3, 4, 5].map((_, index) => (
//                   <tr key={index} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                       BK{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       John Doe
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       Inception
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       May 15, 2025 - 7:30 PM
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       A12, A13
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       $24.00
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                         Confirmed
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default AdminDashboardPage;


// src/pages/AdminDashboardPage.tsx
// AdminDashboardPage.tsx


import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, Film, Ticket, Settings, LogOut } from 'lucide-react';  // Icons from lucide-react

const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated, setAuthToken } = useAuth();  // Giả sử bạn vẫn lấy thông tin người dùng và trạng thái xác thực từ context
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();  // Hook to navigate
  const [stats, setStats] = useState({
    totalRevenue: 125680,
    ticketsSold: 4256,
    activeMovies: 12,
    upcomingMovies: 8,
    totalCustomers: 3500,
    totalEmployees: 25,
  });



  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`w-64 bg-gray-800 text-white ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center p-4 bg-gray-900">
              <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
            </div>
            <nav className="flex-grow px-2 py-4 space-y-2">
              <Link to="/admin" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                <Home className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
              <Link to="/admin/manage-employees" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                <Users className="h-5 w-5 mr-2" />
                Manage Employees
              </Link>
              <Link to="/admin/manage-movies" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                <Film className="h-5 w-5 mr-2" />
                Manage Movies
              </Link>
              <Link to="/admin/manage-showtimes" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                <Ticket className="h-5 w-5 mr-2" />
                Manage Showtimes
              </Link>
              <Link to="/admin/settings" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Link>
              <Link to="/logout" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-8">Admin Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Add stat cards here */}
          </div>

          {/* Display child routes here */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


