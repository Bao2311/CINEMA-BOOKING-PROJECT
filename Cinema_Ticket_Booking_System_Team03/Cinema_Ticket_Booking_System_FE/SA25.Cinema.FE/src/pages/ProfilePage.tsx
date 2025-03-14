import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Ticket, LogOut } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import axios from 'axios'; 
import { HomeOutlined } from '@ant-design/icons';

interface UserProfile {
  full_Name: string;
  email: string;
  phone_Number: string;
  address: string;
  date_Of_Birth: string;
  sex: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form state
  const [full_Name, setFull_Name] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingCommunications, setMarketingCommunications] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`https://localhost:7168/api/User/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const profileData = response.data;
        setProfile(profileData);
        setFull_Name(profileData.full_Name || '');
        setEmail(profileData.email || '');
        setPhoneNumber(profileData.phone_Number || '');
        setAddress(profileData.address || '');
        setDateOfBirth(profileData.date_Of_Birth || '');
        setSex(profileData.sex || '');
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleHomePageClick = () => {
    navigate('/');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setFormError('Phone number must start with 0 and have 10 digits.');
      return;
    }

    const dob = new Date(dateOfBirth);
    if (dob >= new Date()) {
      setFormError('Date of birth must be a past date.');
      return;
    }

    // Format date of birth to YYYY-MM-DD
    const formattedDateOfBirth = dob.toISOString().split('T')[0];

    if (window.confirm('Are you sure you want to update your profile?')) {
      try {
        await axios.put(`https://localhost:7168/api/User/profile`, {
          full_Name,
          phone_Number: phoneNumber,
          address,
          date_Of_Birth: formattedDateOfBirth,
          sex
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setFormSuccess('Profile updated successfully!');
        setFormError('');
      } catch (error) {
        setFormError('Failed to update profile.');
        console.error("Error updating profile:", error);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setFormError('New password and confirm new password do not match.');
      return;
    }

    if (window.confirm('Are you sure you want to change your password?')) {
      try {
        await axios.put(`https://localhost:7168/api/User/change-password`, {
          currentPassword,
          newPassword
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setFormSuccess('Password changed successfully!');
        setFormError('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } catch (error) {
        setFormError('Failed to change password.');
        console.error("Error changing password:", error);
      }
    }
  };

  const handleToggleEmailNotifications = () => {
    setEmailNotifications(!emailNotifications);
  };

  const handleToggleSmsNotifications = () => {
    setSmsNotifications(!smsNotifications);
  };

  const handleToggleMarketingCommunications = () => {
    setMarketingCommunications(!marketingCommunications);
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
    <div>
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
                    <h2 className="text-xl font-bold">{profile?.full_Name}</h2>
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
                      onClick={handleHomePageClick}
                      className={`w-full flex items-center px-4 py-2 rounded-md ${
                        activeTab === 'home'
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

                  <form className="space-y-6" onSubmit={handleUpdateProfile}>
                    <div>
                      <label htmlFor="full_Name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="full_Name"
                        value={full_Name}
                        onChange={(e) => setFull_Name(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        readOnly
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
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="text"
                        id="dob"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                        Sex
                      </label>
                      <select
                        id="sex"
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

                  <form className="space-y-6" onSubmit={handleChangePassword}>
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Change Password
                      </button>
                    </div>
                  </form>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-6">Notification Preferences</h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span>Email Notifications</span>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={handleToggleEmailNotifications}
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span>SMS Notifications</span>
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={handleToggleSmsNotifications}
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Marketing Communications</span>
                      <input
                        type="checkbox"
                        checked={marketingCommunications}
                        onChange={handleToggleMarketingCommunications}
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;