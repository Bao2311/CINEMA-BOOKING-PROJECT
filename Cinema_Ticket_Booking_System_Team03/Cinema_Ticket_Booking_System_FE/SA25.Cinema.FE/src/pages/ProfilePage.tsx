import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Ticket, LogOut } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; 
import { HomeOutlined } from '@ant-design/icons';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null); // Lưu thông tin người dùng từ API

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Gọi API để lấy thông tin profile của người dùng
  useEffect(() => {
    if (user) {
      setUsername(user.fullName || '');
      setEmail(user.email || '');

      const fetchProfile = async () => {
        try {
          // Gọi API để lấy thông tin profile
          const response = await axios.get(`/api/Auth/profile`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          setProfile(response.data); // Cập nhật thông tin profile
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setIsLoading(false); // Đánh dấu là đã tải xong
        }
      };

      fetchProfile(); // Gọi hàm fetchProfile
    }
  }, [user]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate the form
    if (!username || !email) {
      setFormError('Please fill in all the fields');
      return;
    }

    if (user) {
      updateUser({
        ...user,
        fullName: username,
        email,
      });

      setFormSuccess('Profile updated successfully!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // Redirect to home
  };

  const handleHomePageClick = () => {
    navigate('/');  // Điều hướng về trang HomePage
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 bg-indigo-600 text-white">
                <div className="flex items-center">
                  <div className="bg-white rounded-full p-2 mr-3">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold">{profile?.fullName}</h2>
                    <p className="text-indigo-200">{profile?.email}</p>
                  </div>
                </div>
              </div>

              <nav className="p-4">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center px-4 py-2 rounded-md ${
                        activeTab === 'profile'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <User className="h-5 w-5 mr-3" />
                      Profile
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleHomePageClick} // Khi nhấn vào sẽ chuyển hướng về trang chủ
                      className={`w-full flex items-center px-4 py-2 rounded-md ${
                        activeTab === 'bookings'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <HomeOutlined className="h-5 w-5 mr-3" />
                      Home Page
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`w-full flex items-center px-4 py-2 rounded-md ${
                        activeTab === 'settings'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      Settings
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`w-full flex items-center px-4 py-2 rounded-md ${
                        activeTab === 'bookings'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Ticket className="h-5 w-5 mr-3" />
                      My Bookings
                    </button>
                  </li>
                  <li className="border-t border-gray-200 pt-2 mt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 rounded-md text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                  {formSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
                      {formSuccess}
                    </div>
                  )}

                  {formError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                      {formError}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Update Profile
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  {/* Similar to profile tab, include form to change password and settings */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
