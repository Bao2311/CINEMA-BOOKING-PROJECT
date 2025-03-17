// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { User, Settings, Ticket, LogOut } from 'lucide-react';
// import Layout from '../components/Layout/Layout';
// import axios from 'axios'; 
// import { HomeOutlined } from '@ant-design/icons';

// interface UserProfile {
//   full_Name: string;
//   email: string;
//   phone_Number: string;
//   address: string;
//   date_Of_Birth: string;
//   sex: string;
// }

// const ProfilePage: React.FC = () => {
//   const navigate = useNavigate();

//   const [activeTab, setActiveTab] = useState('profile');
//   const [isLoading, setIsLoading] = useState(true);
//   const [profile, setProfile] = useState<UserProfile | null>(null);

//   // Form state
//   const [full_Name, setFull_Name] = useState('');
//   const [email, setEmail] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [address, setAddress] = useState('');
//   const [dateOfBirth, setDateOfBirth] = useState('');
//   const [sex, setSex] = useState('');

//   const [formError, setFormError] = useState('');
//   const [formSuccess, setFormSuccess] = useState('');

//   // Password change state
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');

//   // Notification preferences state
//   const [emailNotifications, setEmailNotifications] = useState(true);
//   const [smsNotifications, setSmsNotifications] = useState(false);
//   const [marketingCommunications, setMarketingCommunications] = useState(true);

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const response = await axios.get(`https://localhost:7168/api/User/profile`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('token')}`,
//           },
//         });
//         const profileData = response.data;
//         setProfile(profileData);
//         setFull_Name(profileData.full_Name || '');
//         setEmail(profileData.email || '');
//         setPhoneNumber(profileData.phone_Number || '');
//         setAddress(profileData.address || '');
//         setDateOfBirth(profileData.date_Of_Birth || '');
//         setSex(profileData.sex || '');
//       } catch (error) {
//         console.error("Error fetching profile:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchProfile();
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     window.location.href = "/";
//   };

//   const handleHomePageClick = () => {
//     navigate('/');
//   };

//   const handleUpdateProfile = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validation checks
//     const phoneRegex = /^0[0-9]{9}$/;
//     if (!phoneRegex.test(phoneNumber)) {
//       setFormError('Phone number must start with 0 and have 10 digits.');
//       return;
//     }

//     const dob = new Date(dateOfBirth);
//     if (dob >= new Date()) {
//       setFormError('Date of birth must be a past date.');
//       return;
//     }

//     // Format date of birth to YYYY-MM-DD
//     const formattedDateOfBirth = dob.toISOString().split('T')[0];

//     if (window.confirm('Are you sure you want to update your profile?')) {
//       try {
//         await axios.put(`https://localhost:7168/api/User/profile`, {
//           full_Name,
//           phone_Number: phoneNumber,
//           address,
//           date_Of_Birth: formattedDateOfBirth,
//           sex
//         }, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('token')}`,
//           },
//         });
//         setFormSuccess('Profile updated successfully!');
//         setFormError('');
//       } catch (error) {
//         setFormError('Failed to update profile.');
//         console.error("Error updating profile:", error);
//       }
//     }
//   };

//   const handleChangePassword = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validation
//     if (!currentPassword || !newPassword || !confirmNewPassword) {
//       setFormError('All password fields are required.');
//       return;
//     }

//     if (newPassword !== confirmNewPassword) {
//       setFormError('New password and confirm password do not match.');
//       return;
//     }

//     // Password strength validation
//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     if (!passwordRegex.test(newPassword)) {
//       setFormError(
//         'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
//       );
//       return;
//     }

//     if (window.confirm('Are you sure you want to change your password?')) {
//       try {
//         const token = localStorage.getItem('token');
//         if (!token) {
//           setFormError('Authentication token not found. Please log in again.');
//           return;
//         }

//         const response = await axios.put(
//           'https://localhost:7168/api/Auth/password',
//           {
//             OldPassword: currentPassword,
//             NewPassword: newPassword,
//             ConfirmNewPassword: confirmNewPassword
//           },
//           {
//             headers: {
//               'Authorization': `Bearer ${token}`,
//               'Content-Type': 'application/json'
//             }
//           }
//         );

//         if (response.status === 200) {
//           setFormSuccess('Password changed successfully!');
//           setFormError('');
//           // Clear password fields
//           setCurrentPassword('');
//           setNewPassword('');
//           setConfirmNewPassword('');
//         }
//       } catch (error: any) {
//         if (error.response) {
//           // Log the full error response for debugging
//           console.log('Error response:', error.response);
          
//           // Extract errors from response and display to user
//           const errorMessages = error.response.data.errors; // Assuming this is the structure from your error response
          
//           // Check if there are errors for specific fields and display
//           let errorMessage = '';
//           if (errorMessages) {
//             if (errorMessages.OldPassword) {
//               errorMessage += `${errorMessages.OldPassword.join(' ')}\n`;
//             }
//             if (errorMessages.NewPassword) {
//               errorMessage += `${errorMessages.NewPassword.join(' ')}\n`;
//             }
//             if (errorMessages.ConfirmNewPassword) {
//               errorMessage += `${errorMessages.ConfirmNewPassword.join(' ')}\n`;
//             }
//           } else {
//             errorMessage = error.response.data.message || 'An error occurred while changing the password.';
//           }
          
//           setFormError(errorMessage.trim());
//         } else {
//           setFormError('An error occurred while changing the password.');
//         }
//         console.error("Error changing password:", error);
//       }
//     }
//   };

//   const handleToggleEmailNotifications = () => {
//     setEmailNotifications(!emailNotifications);
//   };

//   const handleToggleSmsNotifications = () => {
//     setSmsNotifications(!smsNotifications);
//   };

//   const handleToggleMarketingCommunications = () => {
//     setMarketingCommunications(!marketingCommunications);
//   };

//   if (isLoading) {
//     return (
//       <Layout>
//         <div className="flex justify-center items-center h-96">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <div>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//           {/* Sidebar */}
//           <div className="md:col-span-1">
//             <div className="bg-white rounded-lg shadow-md overflow-hidden">
//               <div className="p-6 bg-indigo-600 text-white">
//                 <div className="flex items-center">
//                   <div className="bg-white rounded-full p-2 mr-3">
//                     <User className="h-6 w-6 text-indigo-600" />
//                   </div>
//                   <div>
//                     <h2 className="text-xl font-bold">{profile?.full_Name}</h2>
//                     <p className="text-indigo-200">{profile?.email}</p>
//                   </div>
//                 </div>
//               </div>

//               <nav className="p-4">
//                 <ul className="space-y-2">
//                   <li>
//                     <button
//                       onClick={() => setActiveTab('profile')}
//                       className={`w-full flex items-center px-4 py-2 rounded-md ${
//                         activeTab === 'profile'
//                           ? 'bg-indigo-50 text-indigo-600 font-medium'
//                           : 'text-gray-700 hover:bg-gray-100'
//                       }`}
//                     >
//                       <User className="h-5 w-5 mr-3" />
//                       Profile
//                     </button>
//                   </li>
//                   <li>
//                     <button
//                       onClick={handleHomePageClick}
//                       className={`w-full flex items-center px-4 py-2 rounded-md ${
//                         activeTab === 'home'
//                           ? 'bg-indigo-50 text-indigo-600 font-medium'
//                           : 'text-gray-700 hover:bg-gray-100'
//                       }`}
//                     >
//                       <HomeOutlined className="h-5 w-5 mr-3" />
//                       Home Page
//                     </button>
//                   </li>
//                   <li>
//                     <button
//                       onClick={() => setActiveTab('settings')}
//                       className={`w-full flex items-center px-4 py-2 rounded-md ${
//                         activeTab === 'settings'
//                           ? 'bg-indigo-50 text-indigo-600 font-medium'
//                           : 'text-gray-700 hover:bg-gray-100'
//                       }`}
//                     >
//                       <Settings className="h-5 w-5 mr-3" />
//                       Settings
//                     </button>
//                   </li>
//                   <li>
//                     <button
//                       onClick={() => setActiveTab('bookings')}
//                       className={`w-full flex items-center px-4 py-2 rounded-md ${
//                         activeTab === 'bookings'
//                           ? 'bg-indigo-50 text-indigo-600 font-medium'
//                           : 'text-gray-700 hover:bg-gray-100'
//                       }`}
//                     >
//                       <Ticket className="h-5 w-5 mr-3" />
//                       My Bookings
//                     </button>
//                   </li>
//                   <li className="border-t border-gray-200 pt-2 mt-4">
//                     <button
//                       onClick={handleLogout}
//                       className="w-full flex items-center px-4 py-2 rounded-md text-red-600 hover:bg-red-50"
//                     >
//                       <LogOut className="h-5 w-5 mr-3" />
//                       Logout
//                     </button>
//                   </li>
//                 </ul>
//               </nav>
//             </div>
//           </div>

//           {/* Main Content */}
//           <div className="md:col-span-3">
//             <div className="bg-white rounded-lg shadow-md p-6">
//               {/* Profile Tab */}
//               {activeTab === 'profile' && (
//                 <div>
//                   <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

//                   {formSuccess && (
//                     <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
//                       {formSuccess}
//                     </div>
//                   )}

//                   {formError && (
//                     <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
//                       {formError}
//                     </div>
//                   )}

//                   <form className="space-y-6" onSubmit={handleUpdateProfile}>
//                     <div>
//                       <label htmlFor="full_Name" className="block text-sm font-medium text-gray-700 mb-1">
//                         Full Name
//                       </label>
//                       <input
//                         type="text"
//                         id="full_Name"
//                         value={full_Name}
//                         onChange={(e) => setFull_Name(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                         readOnly
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                         Email
//                       </label>
//                       <input
//                         type="email"
//                         id="email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         readOnly
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
//                         Phone Number
//                       </label>
//                       <input
//                         type="text"
//                         id="phoneNumber"
//                         value={phoneNumber}
//                         onChange={(e) => setPhoneNumber(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
//                         Address
//                       </label>
//                       <input
//                         type="text"
//                         id="address"
//                         value={address}
//                         onChange={(e) => setAddress(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
//                         Date of Birth
//                       </label>
//                       <input
//                         type="text"
//                         id="dob"
//                         value={dateOfBirth}
//                         onChange={(e) => setDateOfBirth(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
//                         Sex
//                       </label>
//                       <select
//                         id="sex"
//                         value={sex}
//                         onChange={(e) => setSex(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       >
//                         <option value="">Select Gender</option>
//                         <option value="Male">Male</option>
//                         <option value="Female">Female</option>
//                       </select>
//                     </div>

//                     <div className="flex justify-end">
//                       <button
//                         type="submit"
//                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
//                       >
//                         Update Profile
//                       </button>
//                     </div>
//                   </form>
//                 </div>
//               )}

//               {/* Settings Tab */}
//               {activeTab === 'settings' && (
//                 <div>
//                   <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

//                   {formSuccess && (
//                     <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
//                       {formSuccess}
//                     </div>
//                   )}

//                   {formError && (
//                     <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
//                       {formError}
//                     </div>
//                   )}

//                   <form className="space-y-6" onSubmit={handleChangePassword}>
//                     <div>
//                       <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                         Current Password
//                       </label>
//                       <input
//                         type="password"
//                         id="currentPassword"
//                         value={currentPassword}
//                         onChange={(e) => setCurrentPassword(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                         New Password
//                       </label>
//                       <input
//                         type="password"
//                         id="newPassword"
//                         value={newPassword}
//                         onChange={(e) => setNewPassword(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     </div>

//                     <div>
//                       <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                         Confirm New Password
//                       </label>
//                       <input
//                         type="password"
//                         id="confirmNewPassword"
//                         value={confirmNewPassword}
//                         onChange={(e) => setConfirmNewPassword(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                       />
//                     </div>

//                     <div className="flex justify-end">
//                       <button
//                         type="submit"
//                         className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
//                       >
//                         Change Password
//                       </button>
//                     </div>
//                   </form>

//                   <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-6">Notification Preferences</h2>

//                   <div className="space-y-6">
//                     <div className="flex items-center justify-between">
//                       <span>Email Notifications</span>
//                       <input
//                         type="checkbox"
//                         checked={emailNotifications}
//                         onChange={handleToggleEmailNotifications}
//                         className="form-checkbox h-5 w-5 text-indigo-600"
//                       />
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <span>SMS Notifications</span>
//                       <input
//                         type="checkbox"
//                         checked={smsNotifications}
//                         onChange={handleToggleSmsNotifications}
//                         className="form-checkbox h-5 w-5 text-indigo-600"
//                       />
//                     </div>

//                     <div className="flex items-center justify-between">
//                       <span>Marketing Communications</span>
//                       <input
//                         type="checkbox"
//                         checked={marketingCommunications}
//                         onChange={handleToggleMarketingCommunications}
//                         className="form-checkbox h-5 w-5 text-indigo-600"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings, Ticket, LogOut, Home, Bell, Key, 
  Calendar, MapPin, Phone, Mail, Edit, Check, X, 
  ChevronRight, Shield, CreditCard, Clock, Gift
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// Định nghĩa kiểu dữ liệu
interface UserProfile {
  full_Name: string;
  email: string;
  phone_Number: string;
  address: string;
  date_Of_Birth: string;
  sex: string;
  memberSince?: string;
  membershipLevel?: string;
  loyaltyPoints?: number;
  profilePicture?: string;
}

interface Booking {
  id: string;
  movieTitle: string;
  showtime: string;
  cinema: string;
  seats: string[];
  totalAmount: number;
  bookingDate: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  qrCode?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'promo' | 'system' | 'booking';
}

// Component cho hiển thị thông báo
const AlertMessage: React.FC<{
  type: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}> = ({ type, message, onClose }) => {
  const bgColor = 
    type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
    type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
    'bg-blue-50 border-blue-200 text-blue-800';
  
  const icon = 
    type === 'success' ? <Check className="h-5 w-5" /> :
    type === 'error' ? <X className="h-5 w-5" /> :
    <Bell className="h-5 w-5" />;
  
  return (
    <div className={`${bgColor} border px-4 py-3 rounded-md mb-4 flex items-start justify-between`}>
      <div className="flex items-center">
        <span className="mr-2">{icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Component cho thẻ trạng thái đặt vé
const BookingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };
  
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusStyles()}`}>
      {getStatusText()}
    </span>
  );
};

// Component chính
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const apiBaseUrl = 'https://localhost:7168/api';

  // State cho tab điều hướng
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // State cho form
  const [formData, setFormData] = useState({
    full_Name: '',
    email: '',
    phone_Number: '',
    address: '',
    date_Of_Birth: '',
    sex: '',
  });

  // State cho thông báo
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: '',
  });

  // State cho form đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // State cho cài đặt thông báo
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingCommunications: true,
    bookingReminders: true,
    specialOffers: true,
  });

  // State cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // Hàm lấy thông tin người dùng
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${apiBaseUrl}/User/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profileData = response.data;
      setProfile(profileData);
      setFormData({
        full_Name: profileData.full_Name || '',
        email: profileData.email || '',
        phone_Number: profileData.phone_Number || '',
        address: profileData.address || '',
        date_Of_Birth: profileData.date_Of_Birth || '',
        sex: profileData.sex || '',
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      showAlert('error', 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, apiBaseUrl]);

  // Hàm lấy lịch sử đặt vé (dữ liệu mẫu)
  const fetchBookings = useCallback(() => {
    // Dữ liệu mẫu cho lịch sử đặt vé
    const mockBookings: Booking[] = [
      {
        id: 'BK12345',
        movieTitle: 'Avengers: Endgame',
        showtime: '2025-03-15T19:30:00Z',
        cinema: 'CGV Vincom Center Bà Triệu',
        seats: ['G7', 'G8'],
        totalAmount: 240000,
        bookingDate: '2025-03-10T14:25:00Z',
        status: 'upcoming',
        qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BK12345'
      },
      {
        id: 'BK12344',
        movieTitle: 'Dune: Part Two',
        showtime: '2025-03-05T20:15:00Z',
        cinema: 'CGV Aeon Mall Hà Đông',
        seats: ['E5', 'E6', 'E7'],
        totalAmount: 360000,
        bookingDate: '2025-03-01T09:45:00Z',
        status: 'completed'
      },
      {
        id: 'BK12343',
        movieTitle: 'The Batman',
        showtime: '2025-02-20T18:00:00Z',
        cinema: 'CGV Mipec Tower',
        seats: ['H10', 'H11'],
        totalAmount: 220000,
        bookingDate: '2025-02-18T16:30:00Z',
        status: 'completed'
      },
      {
        id: 'BK12342',
        movieTitle: 'Deadpool & Wolverine',
        showtime: '2025-02-14T21:30:00Z',
        cinema: 'CGV Vincom Royal City',
        seats: ['J8'],
        totalAmount: 120000,
        bookingDate: '2025-02-10T11:15:00Z',
        status: 'cancelled'
      }
    ];
    
    setBookings(mockBookings);
  }, []);

  // Hàm lấy thông báo (dữ liệu mẫu)
  const fetchNotifications = useCallback(() => {
    // Dữ liệu mẫu cho thông báo
    const mockNotifications: Notification[] = [
      {
        id: 'N001',
        title: 'Đặt vé thành công',
        message: 'Bạn đã đặt vé xem phim Avengers: Endgame thành công. Vui lòng đến rạp trước giờ chiếu 15 phút.',
        date: '2025-03-10T14:25:00Z',
        isRead: true,
        type: 'booking'
      },
      {
        id: 'N002',
        title: 'Khuyến mãi đặc biệt cuối tuần',
        message: 'Giảm 30% cho tất cả các suất chiếu vào thứ 7 và chủ nhật. Áp dụng từ ngày 20/03 đến 22/03.',
        date: '2025-03-08T09:00:00Z',
        isRead: false,
        type: 'promo'
      },
      {
        id: 'N003',
        title: 'Cập nhật hệ thống',
        message: 'Hệ thống sẽ bảo trì từ 00:00 đến 02:00 ngày 15/03. Xin lỗi vì sự bất tiện này.',
        date: '2025-03-05T10:30:00Z',
        isRead: false,
        type: 'system'
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  // Effect hook để tải dữ liệu
  useEffect(() => {
    fetchUserProfile();
    fetchBookings();
    fetchNotifications();
  }, [fetchUserProfile, fetchBookings, fetchNotifications]);

  // Hàm hiển thị thông báo
  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({
      show: true,
      type,
      message,
    });
    
    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem("token");
      navigate('/');
    }
  };

  // Hàm xử lý chuyển hướng về trang chủ
  const handleHomePageClick = () => {
    navigate('/');
  };

  // Hàm xử lý thay đổi trường form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  // Hàm xử lý thay đổi mật khẩu
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  // Hàm xử lý cập nhật thông tin cá nhân
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone_Number)) {
      showAlert('error', 'Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số.');
      return;
    }

    try {
      const dob = new Date(formData.date_Of_Birth);
      if (dob >= new Date()) {
        showAlert('error', 'Ngày sinh phải là ngày trong quá khứ.');
        return;
      }

      // Format ngày sinh
      const formattedDateOfBirth = dob.toISOString().split('T')[0];

      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      await axios.put(`${apiBaseUrl}/User/profile`, {
        full_Name: formData.full_Name,
        phone_Number: formData.phone_Number,
        address: formData.address,
        date_Of_Birth: formattedDateOfBirth,
        sex: formData.sex
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showAlert('success', 'Cập nhật thông tin thành công!');
      setIsEditing(false);
      
      // Cập nhật thông tin profile
      if (profile) {
        setProfile({
          ...profile,
          full_Name: formData.full_Name,
          phone_Number: formData.phone_Number,
          address: formData.address,
          date_Of_Birth: formattedDateOfBirth,
          sex: formData.sex
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert('error', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    }
  };

  // Hàm xử lý đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showAlert('error', 'Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showAlert('error', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    // Kiểm tra độ mạnh của mật khẩu
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      showAlert('error', 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }

      await axios.put(
        `${apiBaseUrl}/Auth/password`,
        {
          OldPassword: passwordForm.currentPassword,
          NewPassword: passwordForm.newPassword,
          ConfirmNewPassword: passwordForm.confirmNewPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      showAlert('success', 'Đổi mật khẩu thành công!');
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error: any) {
      if (error.response) {
        const errorMessages = error.response.data.errors;
        let errorMessage = '';
        
        if (errorMessages) {
          if (errorMessages.OldPassword) {
            errorMessage += `${errorMessages.OldPassword.join(' ')}\n`;
          }
          if (errorMessages.NewPassword) {
            errorMessage += `${errorMessages.NewPassword.join(' ')}\n`;
          }
          if (errorMessages.ConfirmNewPassword) {
            errorMessage += `${errorMessages.ConfirmNewPassword.join(' ')}\n`;
          }
        } else {
          errorMessage = error.response.data.message || 'Đã xảy ra lỗi khi đổi mật khẩu.';
        }
        
        showAlert('error', errorMessage.trim());
      } else {
        showAlert('error', 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.');
      }
      console.error("Error changing password:", error);
    }
  };

  // Hàm xử lý cập nhật cài đặt thông báo
  const handleNotificationSettingsChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    // Giả lập API call để lưu cài đặt
    setTimeout(() => {
      showAlert('success', 'Đã cập nhật cài đặt thông báo.');
    }, 500);
  };

  // Hàm xử lý đánh dấu thông báo đã đọc
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  // Hàm định dạng ngày tháng
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  // Hàm định dạng ngày giờ
  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  // Hiển thị trạng thái loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Thông báo */}
        {alert.show && (
          <AlertMessage 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert(prev => ({ ...prev, show: false }))} 
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Thông tin người dùng */}
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden">
                      {profile?.profilePicture ? (
                        <img 
                          src={profile.profilePicture} 
                          alt={profile.full_Name} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-white" />
                      )}
                    </div>
                    <div className="absolute bottom-2 right-0 bg-indigo-500 rounded-full p-1 border-2 border-white">
                      <Edit className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold">{profile?.full_Name}</h2>
                  <p className="text-indigo-200">{profile?.email}</p>
                  
                  {profile?.membershipLevel && (
                    <div className="mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                      {profile.membershipLevel}
                    </div>
                  )}
                </div>
                
                {profile?.loyaltyPoints !== undefined && (
                  <div className="mt-4 bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Điểm tích lũy</span>
                      <span className="font-bold">{profile.loyaltyPoints} điểm</span>
                    </div>
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400" 
                        style={{ width: `${Math.min((profile.loyaltyPoints / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-right">
                      {profile.loyaltyPoints}/1000 để lên hạng
                    </div>
                  </div>
                )}
              </div>

              {/* Menu điều hướng */}
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
                      Thông tin cá nhân
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
                      Lịch sử đặt vé
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-md ${
                        activeTab === 'notifications'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-3" />
                        Thông báo
                      </div>
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notifications.filter(n => !n.isRead).length}
                        </span>
                      )}
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
                      Cài đặt tài khoản
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleHomePageClick}
                      className="w-full flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      <Home className="h-5 w-5 mr-3" />
                      Trang chủ
                    </button>
                  </li>
                  <li className="border-t border-gray-200 pt-2 mt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 rounded-md text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
            
            {/* Thông tin hỗ trợ */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Hỗ trợ khách hàng</h3>
              <p className="text-sm text-gray-600 mb-3">
                Bạn cần hỗ trợ? Liên hệ với chúng tôi qua các kênh sau:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-indigo-600" />
                  <span>Hotline: 1900 6017</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-indigo-600" />
                  <span>Email: support@cinema.vn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nội dung chính */}
          <div className="md:col-span-3">
            {/* Tab Thông tin cá nhân */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setActiveSubTab('personal')}
                      className={`px-6 py-4 text-sm font-medium ${
                        activeSubTab === 'personal'
                          ? 'text-indigo-600 border-b-2 border-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Thông tin cá nhân
                    </button>
                    <button
                      onClick={() => setActiveSubTab('membership')}
                      className={`px-6 py-4 text-sm font-medium ${
                        activeSubTab === 'membership'
                          ? 'text-indigo-600 border-b-2 border-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      
                        }`}
                        >
                          Thành viên & Ưu đãi
                        </button>
                      </div>
                    </div>
    
                    <div className="p-6">
                      {/* Thông tin cá nhân */}
                      {activeSubTab === 'personal' && (
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                            {!isEditing ? (
                              <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center text-indigo-600 hover:text-indigo-800"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                <span>Chỉnh sửa</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  // Reset form data to original profile data
                                  if (profile) {
                                    setFormData({
                                      full_Name: profile.full_Name || '',
                                      email: profile.email || '',
                                      phone_Number: profile.phone_Number || '',
                                      address: profile.address || '',
                                      date_Of_Birth: profile.date_Of_Birth || '',
                                      sex: profile.sex || '',
                                    });
                                  }
                                }}
                                className="flex items-center text-gray-600 hover:text-gray-800"
                              >
                                <X className="h-4 w-4 mr-1" />
                                <span>Hủy</span>
                              </button>
                            )}
                          </div>
    
                          <form className="space-y-6" onSubmit={handleUpdateProfile}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="full_Name" className="block text-sm font-medium text-gray-700 mb-1">
                                  Họ và tên
                                </label>
                                <input
                                  type="text"
                                  id="full_Name"
                                  value={formData.full_Name}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={!isEditing}
                                />
                              </div>
    
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  id="email"
                                  value={formData.email}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                                  disabled
                                />
                                <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
                              </div>
    
                              <div>
                                <label htmlFor="phone_Number" className="block text-sm font-medium text-gray-700 mb-1">
                                  Số điện thoại
                                </label>
                                <input
                                  type="text"
                                  id="phone_Number"
                                  value={formData.phone_Number}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={!isEditing}
                                />
                              </div>
    
                              <div>
                                <label htmlFor="date_Of_Birth" className="block text-sm font-medium text-gray-700 mb-1">
                                  Ngày sinh
                                </label>
                                <input
                                  type="date"
                                  id="date_Of_Birth"
                                  value={formData.date_Of_Birth ? formData.date_Of_Birth.split('T')[0] : ''}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={!isEditing}
                                />
                              </div>
    
                              <div>
                                <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                                  Giới tính
                                </label>
                                <select
                                  id="sex"
                                  value={formData.sex}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={!isEditing}
                                >
                                  <option value="">Chọn giới tính</option>
                                  <option value="Male">Nam</option>
                                  <option value="Female">Nữ</option>
                                  <option value="Other">Khác</option>
                                </select>
                              </div>
    
                              <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                  Địa chỉ
                                </label>
                                <input
                                  type="text"
                                  id="address"
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>
    
                            {isEditing && (
                              <div className="flex justify-end">
                                <button
                                  type="submit"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                                >
                                  Cập nhật thông tin
                                </button>
                              </div>
                            )}
                          </form>
                        </div>
                      )}
    
                      {/* Thông tin thành viên & ưu đãi */}
                      {activeSubTab === 'membership' && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-6">Thành viên & Ưu đãi</h2>
                          
                          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg overflow-hidden shadow-lg mb-6">
                            <div className="p-6 text-white">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold">Thẻ thành viên</h3>
                                  <p className="text-indigo-200 text-sm">Hạng: {profile?.membershipLevel || 'Standard'}</p>
                                </div>
                                <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                  {profile?.loyaltyPoints || 0} điểm
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <p className="text-xl font-bold">{profile?.full_Name}</p>
                                <p className="text-sm text-indigo-200">Thành viên từ: {profile?.memberSince || formatDate(new Date().toISOString())}</p>
                              </div>
                              
                              <div className="mt-6 flex justify-between items-center">
                                <div className="text-sm">
                                  <p>ID: MEMBER-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</p>
                                </div>
                                <div className="bg-white/10 p-2 rounded-md">
                                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 17V7M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Quyền lợi thành viên</h3>
                              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                                    <Ticket className="h-5 w-5 text-indigo-600" />
                                  </div>
                                  <div className="ml-3">
                                    <h4 className="text-sm font-medium text-gray-900">Giảm 10% giá vé</h4>
                                    <p className="text-xs text-gray-500">Áp dụng cho tất cả các suất chiếu vào thứ 2 - thứ 5</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                                    <Gift className="h-5 w-5 text-indigo-600" />
                                  </div>
                                  <div className="ml-3">
                                    <h4 className="text-sm font-medium text-gray-900">Quà sinh nhật</h4>
                                    <p className="text-xs text-gray-500">01 vé xem phim miễn phí trong tháng sinh nhật</p>
                                  </div>
                                </div>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                                    <CreditCard className="h-5 w-5 text-indigo-600" />
                                  </div>
                                  <div className="ml-3">
                                    <h4 className="text-sm font-medium text-gray-900">Tích điểm đổi quà</h4>
                                    <p className="text-xs text-gray-500">Mỗi 20.000đ = 1 điểm, đổi điểm lấy vé xem phim và đồ ăn</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Khuyến mãi hiện có</h3>
                              <div className="space-y-4">
                                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between">
                                    <h4 className="font-medium text-gray-900">Giảm 30% cho vé xem phim ngày thứ 2</h4>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Đang diễn ra</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">Áp dụng cho tất cả các suất chiếu vào thứ 2 hàng tuần.</p>
                                  <div className="mt-2 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Hết hạn: 30/04/2025</span>
                                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Xem chi tiết</button>
                                  </div>
                                </div>
                                
                                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between">
                                    <h4 className="font-medium text-gray-900">Combo bắp nước chỉ 79.000đ</h4>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Đang diễn ra</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">01 bắp lớn + 02 nước lớn chỉ với 79.000đ.</p>
                                  <div className="mt-2 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Hết hạn: 15/03/2025</span>
                                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Xem chi tiết</button>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 text-center">
                                <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                  Xem tất cả khuyến mãi
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
    
                {/* Tab Lịch sử đặt vé */}
                {activeTab === 'bookings' && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch sử đặt vé</h2>
                      
                      {bookings.length === 0 ? (
                        <div className="text-center py-8">
                          <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Bạn chưa có lịch sử đặt vé nào.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Vé sắp diễn ra */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Sắp diễn ra</h3>
                            {bookings.filter(booking => booking.status === 'upcoming').length === 0 ? (
                              <p className="text-sm text-gray-500 italic">Không có vé sắp diễn ra</p>
                            ) : (
                              <div className="space-y-4">
                                {bookings
                                  .filter(booking => booking.status === 'upcoming')
                                  .map(booking => (
                                    <div key={booking.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                      <div className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h4 className="font-medium text-gray-900">{booking.movieTitle}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{booking.cinema}</p>
                                          </div>
                                          <BookingStatusBadge status={booking.status} />
                                        </div>
                                        
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-xs text-gray-500">Suất chiếu</p>
                                            <p className="text-sm font-medium">{formatDateTime(booking.showtime)}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Ghế</p>
                                            <p className="text-sm font-medium">{booking.seats.join(', ')}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Mã đặt vé</p>
                                            <p className="text-sm font-medium">{booking.id}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Tổng tiền</p>
                                            <p className="text-sm font-medium">{booking.totalAmount.toLocaleString('vi-VN')}đ</p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                          <span className="text-xs text-gray-500">
                                            Đặt vé lúc: {formatDateTime(booking.bookingDate)}
                                          </span>
                                        </div>
                                        <div className="flex space-x-2">
                                          {booking.qrCode && (
                                            <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                              Xem mã QR
                                            </button>
                                          )}
                                          <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                            Chi tiết
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Lịch sử đặt vé */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Lịch sử đặt vé</h3>
                            <div className="space-y-4">
                              {bookings
                                .filter(booking => booking.status !== 'upcoming')
                                .map(booking => (
                                  <div key={booking.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="p-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium text-gray-900">{booking.movieTitle}</h4>
                                          <p className="text-sm text-gray-600 mt-1">{booking.cinema}</p>
                                        </div>
                                        <BookingStatusBadge status={booking.status} />
                                      </div>
                                      
                                      <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs text-gray-500">Suất chiếu</p>
                                          <p className="text-sm font-medium">{formatDateTime(booking.showtime)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Ghế</p>
                                          <p className="text-sm font-medium">{booking.seats.join(', ')}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Mã đặt vé</p>
                                          <p className="text-sm font-medium">{booking.id}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">Tổng tiền</p>
                                          <p className="text-sm font-medium">{booking.totalAmount.toLocaleString('vi-VN')}đ</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                        <span className="text-xs text-gray-500">
                                          Đặt vé lúc: {formatDateTime(booking.bookingDate)}
                                        </span>
                                      </div>
                                      <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                        Chi tiết
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
    
                {/* Tab Thông báo */}
                {activeTab === 'notifications' && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Thông báo</h2>
                      
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Bạn không có thông báo nào.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`border rounded-lg p-4 ${notification.isRead ? 'border-gray-200' : 'border-indigo-200 bg-indigo-50'}`}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start">
                                <div className={`flex-shrink-0 rounded-full p-1 ${
                                  notification.type === 'promo' ? 'bg-green-100' : 
                                  notification.type === 'system' ? 'bg-blue-100' : 'bg-yellow-100'
                                }`}>
                                  {notification.type === 'promo' ? (
                                    <Gift className={`h-5 w-5 ${
                                      notification.type === 'promo' ? 'text-green-600' : 
                                      notification.type === 'system' ? 'text-blue-600' : 'text-yellow-600'
                                    }`} />
                                  ) : notification.type === 'system' ? (
                                    <Settings className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <Ticket className="h-5 w-5 text-yellow-600" />
                                  )}
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className={`font-medium ${notification.isRead ? 'text-gray-900' : 'text-indigo-900'}`}>
                                      {notification.title}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                      {formatDateTime(notification.date)}
                                    </span>
                                  </div>
                                  <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-600' : 'text-indigo-800'}`}>
                                    {notification.message}
                                  </p>
                                </div>
                              </div>
                              {!notification.isRead && (
                                <div className="mt-2 flex justify-end">
                                  <button 
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markNotificationAsRead(notification.id);
                                    }}
                                  >
                                    Đánh dấu đã đọc
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
    
                {/* Tab Cài đặt */}
                {activeTab === 'settings' && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="border-b border-gray-200">
                      <div className="flex">
                        <button
                          onClick={() => setActiveSubTab('password')}
                          className={`px-6 py-4 text-sm font-medium ${
                            activeSubTab === 'password'
                              ? 'text-indigo-600 border-b-2 border-indigo-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Đổi mật khẩu
                        </button>
                        <button
                          onClick={() => setActiveSubTab('notifications')}
                          className={`px-6 py-4 text-sm font-medium ${
                            activeSubTab === 'notifications'
                              ? 'text-indigo-600 border-b-2 border-indigo-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Cài đặt thông báo
                        </button>
                        <button
                          onClick={() => setActiveSubTab('privacy')}
                          className={`px-6 py-4 text-sm font-medium ${
                            activeSubTab === 'privacy'
                              ? 'text-indigo-600 border-b-2 border-indigo-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Bảo mật
                        </button>
                      </div>
                    </div>
    
                    <div className="p-6">
                      {/* Đổi mật khẩu */}
                      {activeSubTab === 'password' && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>
                          
                          <form className="space-y-6" onSubmit={handleChangePassword}>
                            <div>
                              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu hiện tại
                              </label>
                              <input
                                type="password"
                                id="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
    
                            <div>
                              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu mới
                              </label>
                              <input
                                type="password"
                                id="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                              </p>
                            </div>
    
                            <div>
                              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu mới
                              </label>
                              <input
                                type="password"
                                id="confirmNewPassword"
                                value={passwordForm.confirmNewPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
    
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
                              >
                                Đổi mật khẩu
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
    
                      {/* Cài đặt thông báo */}
                      {activeSubTab === 'notifications' && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-6">Cài đặt thông báo</h2>
                          
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Thông báo qua email</h3>
                                <p className="text-xs text-gray-500 mt-1">Nhận thông báo về đặt vé, khuyến mãi và cập nhật qua email</p>
                              </div>
                              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                <input 
                                  type="checkbox" 
                                  id="emailNotifications" 
                                  checke
                                  checked={notificationSettings.emailNotifications}
                                  onChange={() => handleNotificationSettingsChange('emailNotifications')}
                                  className="sr-only"
                                />
                                <label 
                                  htmlFor="emailNotifications" 
                                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                    notificationSettings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <span 
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-0'
                                    }`} 
                                  />
                                </label>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Thông báo qua SMS</h3>
                                <p className="text-xs text-gray-500 mt-1">Nhận thông báo về đặt vé và cập nhật quan trọng qua SMS</p>
                              </div>
                              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                <input 
                                  type="checkbox" 
                                  id="smsNotifications" 
                                  checked={notificationSettings.smsNotifications}
                                  onChange={() => handleNotificationSettingsChange('smsNotifications')}
                                  className="sr-only"
                                />
                                <label 
                                  htmlFor="smsNotifications" 
                                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                    notificationSettings.smsNotifications ? 'bg-indigo-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <span 
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                      notificationSettings.smsNotifications ? 'translate-x-6' : 'translate-x-0'
                                    }`} 
                                  />
                                </label>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Thông tin khuyến mãi</h3>
                                <p className="text-xs text-gray-500 mt-1">Nhận thông tin về các chương trình khuyến mãi, ưu đãi mới</p>
                              </div>
                              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                <input 
                                  type="checkbox" 
                                  id="marketingCommunications" 
                                  checked={notificationSettings.marketingCommunications}
                                  onChange={() => handleNotificationSettingsChange('marketingCommunications')}
                                  className="sr-only"
                                />
                                <label 
                                  htmlFor="marketingCommunications" 
                                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                    notificationSettings.marketingCommunications ? 'bg-indigo-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <span 
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                      notificationSettings.marketingCommunications ? 'translate-x-6' : 'translate-x-0'
                                    }`} 
                                  />
                                </label>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Nhắc nhở lịch chiếu</h3>
                                <p className="text-xs text-gray-500 mt-1">Nhận thông báo nhắc nhở trước khi suất chiếu bắt đầu</p>
                              </div>
                              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                <input 
                                  type="checkbox" 
                                  id="bookingReminders" 
                                  checked={notificationSettings.bookingReminders}
                                  onChange={() => handleNotificationSettingsChange('bookingReminders')}
                                  className="sr-only"
                                />
                                <label 
                                  htmlFor="bookingReminders" 
                                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                    notificationSettings.bookingReminders ? 'bg-indigo-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <span 
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                      notificationSettings.bookingReminders ? 'translate-x-6' : 'translate-x-0'
                                    }`} 
                                  />
                                </label>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">Ưu đãi đặc biệt</h3>
                                <p className="text-xs text-gray-500 mt-1">Nhận thông báo về các ưu đãi đặc biệt dành riêng cho bạn</p>
                              </div>
                              <div className="relative inline-block w-12 mr-2 align-middle select-none">
                                <input 
                                  type="checkbox" 
                                  id="specialOffers" 
                                  checked={notificationSettings.specialOffers}
                                  onChange={() => handleNotificationSettingsChange('specialOffers')}
                                  className="sr-only"
                                />
                                <label 
                                  htmlFor="specialOffers" 
                                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                                    notificationSettings.specialOffers ? 'bg-indigo-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <span 
                                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                      notificationSettings.specialOffers ? 'translate-x-6' : 'translate-x-0'
                                    }`} 
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
    
                      {/* Bảo mật */}
                      {activeSubTab === 'privacy' && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-6">Bảo mật tài khoản</h2>
                          
                          <div className="space-y-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <Shield className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-yellow-800">Bảo mật tài khoản</h3>
                                  <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                      Để bảo vệ tài khoản của bạn, chúng tôi khuyên bạn nên:
                                    </p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                      <li>Sử dụng mật khẩu mạnh và không dùng lại ở các trang web khác</li>
                                      <li>Thay đổi mật khẩu định kỳ (3-6 tháng một lần)</li>
                                      <li>Không chia sẻ thông tin đăng nhập với người khác</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Phiên đăng nhập</h3>
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="p-4">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                                      <Check className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="ml-3">
                                      <h4 className="text-sm font-medium text-gray-900">Phiên hiện tại</h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Thiết bị: {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} - 
                                        IP: 192.168.1.xxx - 
                                        Thời gian: {new Date().toLocaleString('vi-VN')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 text-right">
                                <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                  Đăng xuất khỏi tất cả các thiết bị
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Quyền riêng tư</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">Dữ liệu cá nhân</h4>
                                    <p className="text-xs text-gray-500 mt-1">Quản lý dữ liệu cá nhân của bạn</p>
                                  </div>
                                  <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    Xem chi tiết
                                  </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">Xóa tài khoản</h4>
                                    <p className="text-xs text-gray-500 mt-1">Xóa vĩnh viễn tài khoản và dữ liệu của bạn</p>
                                  </div>
                                  <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                    Yêu cầu xóa
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    export default ProfilePage;
        