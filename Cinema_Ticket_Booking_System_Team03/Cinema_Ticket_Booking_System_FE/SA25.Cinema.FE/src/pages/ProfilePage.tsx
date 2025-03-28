import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Ticket, LogOut, Home, Bell, Key,
  Calendar, MapPin, Phone, Mail, Edit, Check, X,
  ChevronRight, Shield, CreditCard, Clock, Gift, Loader2 // Added Loader2 for loading state
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isPast, isFuture, parse } from 'date-fns';
import { vi } from 'date-fns/locale';

// Định nghĩa kiểu dữ liệu UserProfile (giữ nguyên)
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

// Định nghĩa kiểu dữ liệu Booking (dùng cho UI)
interface Booking {
  id: string; // Sử dụng booking_ID từ API
  movieTitle: string;
  showtime: string; // Kết hợp show_Date và start_Time từ API
  cinema: string; // Lấy từ room_Name
  // seats: string[]; // API không cung cấp, tạm thời bỏ đi hoặc xử lý khác
  totalAmount: number;
  bookingDate: string; // Lấy từ booking_Date API
  status: 'upcoming' | 'completed' | 'cancelled'; // Map từ status API và show_Date
  // qrCode?: string; // API không cung cấp
  paymentMethod?: string | null; // Thêm từ API
  cancellationDate?: string | null; // Thêm từ API
}

// Định nghĩa kiểu dữ liệu cho API response
interface ApiBooking {
  $id: string;
  booking_ID: number;
  booking_Date: string;
  total_Amount: number;
  status: "Confirmed" | "Cancelled"; // Trạng thái từ API
  payment_Method: string | null;
  payment_Date: string | null;
  cancellation_Date: string | null;
  showtime: {
    $id: string;
    showtime_ID: number;
    show_Date: string; // "YYYY-MM-DDTHH:mm:ss"
    start_Time: string; // "HH:mm:ss"
    room: {
      $id: string;
      cinema_Room_ID: number;
      room_Name: string;
      room_Type: string;
    };
    movie: {
      $id: string;
      movie_ID: number;
      movie_Name: string;
      duration: number;
      rating: string;
      poster_URL: string;
    };
  };
  user_ID: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'promo' | 'system' | 'booking';
}

// Component cho hiển thị thông báo (giữ nguyên)
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

// Component cho thẻ trạng thái đặt vé (giữ nguyên)
const BookingStatusBadge: React.FC<{ status: 'upcoming' | 'completed' | 'cancelled' }> = ({ status }) => {
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

  // Loading states
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false); // Specific loading for bookings
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false); // Specific loading for notifications

  // Data states
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

  // Hàm hiển thị thông báo (giữ nguyên)
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

  // Hàm lấy thông tin người dùng (giữ nguyên, chỉ đổi tên isLoading)
  const fetchUserProfile = useCallback(async () => {
    setIsProfileLoading(true); // Use specific loading state
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
      setIsProfileLoading(false); // Use specific loading state
    }
  }, [navigate, apiBaseUrl]);

  // --- START: Cập nhật hàm lấy lịch sử đặt vé ---
  const fetchBookings = useCallback(async () => {
    setIsBookingsLoading(true); // Bắt đầu loading cho bookings
    setBookings([]); // Xóa bookings cũ trước khi fetch
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để xem lịch sử đặt vé.');
        navigate('/login');
        return;
      }

      const response = await axios.get<{ $id: string; $values: ApiBooking[] }>(
        `${apiBaseUrl}/Booking/my-bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.$values) {
         const apiBookings: ApiBooking[] = response.data.$values;

         // Ánh xạ dữ liệu API sang cấu trúc UI (Booking)
         const mappedBookings: Booking[] = apiBookings.map((apiBooking) => {
            // Kết hợp ngày và giờ chiếu
            // Giả sử show_Date có dạng "YYYY-MM-DDTHH:mm:ss" và start_Time là "HH:mm:ss"
            // Chúng ta cần tạo một chuỗi ISO hợp lệ từ show_Date (chỉ lấy phần ngày) và start_Time
            const showDatePart = apiBooking.showtime.show_Date.split('T')[0]; // Lấy YYYY-MM-DD
            const showDateTimeString = `${showDatePart}T${apiBooking.showtime.start_Time}`;
            let showDateTime = new Date(); // Default fallback
            try {
                showDateTime = parseISO(showDateTimeString); // Thử parse trực tiếp nếu format ISO
            } catch (e) {
                try {
                     // Thử parse với format cụ thể nếu parseISO thất bại
                     showDateTime = parse(showDateTimeString, "yyyy-MM-dd'T'HH:mm:ss", new Date());
                } catch (e2) {
                    console.error("Could not parse showDateTime:", showDateTimeString);
                    // Giữ giá trị showDateTime mặc định hoặc xử lý lỗi khác
                }
            }


            // Xác định trạng thái: upcoming, completed, cancelled
            let status: 'upcoming' | 'completed' | 'cancelled' = 'completed'; // Mặc định là completed
            if (apiBooking.status === 'Cancelled') {
              status = 'cancelled';
            } else if (apiBooking.status === 'Confirmed') {
               // Kiểm tra ngày giờ chiếu so với hiện tại
               if (isFuture(showDateTime)) {
                   status = 'upcoming';
               } else if (isPast(showDateTime)) { // Hoặc đã diễn ra
                   status = 'completed';
               }
               // Nếu ngày giờ chiếu trùng với hiện tại, có thể coi là upcoming hoặc đang diễn ra
            }

            return {
              id: String(apiBooking.booking_ID),
              movieTitle: apiBooking.showtime.movie.movie_Name || 'Không có tên phim',
              showtime: showDateTimeString, // Lưu trữ chuỗi ISO để format sau
              cinema: apiBooking.showtime.room.room_Name || 'Không có tên phòng',
              totalAmount: apiBooking.total_Amount,
              bookingDate: apiBooking.booking_Date,
              status: status,
              paymentMethod: apiBooking.payment_Method,
              cancellationDate: apiBooking.cancellation_Date,
              // seats: [], // API không cung cấp
              // qrCode: undefined // API không cung cấp
            };
         });

         // Sắp xếp: vé sắp diễn ra lên đầu, sau đó đến vé đã hoàn thành/huỷ, sắp xếp theo ngày đặt vé mới nhất
         mappedBookings.sort((a, b) => {
            // Ưu tiên upcoming
            if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
            if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
            // Nếu cùng status, sắp xếp theo ngày đặt vé giảm dần (mới nhất trước)
            return parseISO(b.bookingDate).getTime() - parseISO(a.bookingDate).getTime();
        });

         setBookings(mappedBookings);
      } else {
         setBookings([]); // Đặt là mảng rỗng nếu không có $values
      }

    } catch (error) {
      console.error("Error fetching bookings:", error);
      showAlert('error', 'Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.');
      setBookings([]); // Đặt là mảng rỗng khi có lỗi
    } finally {
      setIsBookingsLoading(false); // Kết thúc loading cho bookings
    }
  }, [navigate, apiBaseUrl]);
  // --- END: Cập nhật hàm lấy lịch sử đặt vé ---

  // Hàm lấy thông báo (dữ liệu mẫu - giữ nguyên hoặc thay bằng API thật nếu có)
  const fetchNotifications = useCallback(() => {
    setIsNotificationsLoading(true);
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
      // ... (các thông báo mẫu khác)
    ];
    setNotifications(mockNotifications);
    setIsNotificationsLoading(false); // Kết thúc loading
  }, []);

  // Effect hook để tải dữ liệu
  useEffect(() => {
    fetchUserProfile();
    // Không gọi fetchBookings và fetchNotifications ở đây ngay
    // Gọi chúng khi người dùng chuyển sang tab tương ứng để tối ưu
  }, [fetchUserProfile]); // Chỉ fetch profile khi component mount

  // Effect hook để tải dữ liệu khi chuyển tab
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, fetchBookings, fetchNotifications]); // Chạy lại khi activeTab thay đổi

  // Hàm xử lý đăng xuất (giữ nguyên)
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem("token");
      navigate('/');
    }
  };

  // Hàm xử lý chuyển hướng về trang chủ (giữ nguyên)
  const handleHomePageClick = () => {
    navigate('/');
  };

  // Hàm xử lý thay đổi trường form (giữ nguyên)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  // Hàm xử lý thay đổi mật khẩu (input) (giữ nguyên)
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  // Hàm xử lý cập nhật thông tin cá nhân (submit) (giữ nguyên)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone_Number)) {
      showAlert('error', 'Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số.');
      return;
    }

    try {
      let formattedDateOfBirth = formData.date_Of_Birth;
      if (formData.date_Of_Birth) {
          const dob = new Date(formData.date_Of_Birth);
          if (isNaN(dob.getTime())) {
              showAlert('error', 'Ngày sinh không hợp lệ.');
              return;
          }
          if (dob >= new Date()) {
            showAlert('error', 'Ngày sinh phải là ngày trong quá khứ.');
            return;
          }
          // API có thể mong đợi "YYYY-MM-DD"
          formattedDateOfBirth = dob.toISOString().split('T')[0];
      }


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
        date_Of_Birth: formattedDateOfBirth, // Gửi format YYYY-MM-DD
        sex: formData.sex
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showAlert('success', 'Cập nhật thông tin thành công!');
      setIsEditing(false);

      // Cập nhật thông tin profile state
      if (profile) {
        setProfile({
          ...profile,
          full_Name: formData.full_Name,
          phone_Number: formData.phone_Number,
          address: formData.address,
          date_Of_Birth: formattedDateOfBirth, // Cập nhật state với format đã gửi
          sex: formData.sex
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      // Cố gắng hiển thị lỗi cụ thể từ API nếu có
      if (axios.isAxiosError(error) && error.response?.data?.message) {
          showAlert('error', `Lỗi cập nhật: ${error.response.data.message}`);
      } else {
          showAlert('error', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
      }
    }
  };

  // Hàm xử lý đổi mật khẩu (submit) (giữ nguyên)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showAlert('error', 'Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showAlert('error', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

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

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error: any) {
      let errorMessage = 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.';
      if (axios.isAxiosError(error) && error.response) {
          // Xử lý lỗi chi tiết hơn từ response.data
          const responseData = error.response.data;
          if (responseData.errors) {
              // Nếu API trả về cấu trúc lỗi chuẩn của ASP.NET Core Identity
              const errorMessages = Object.values(responseData.errors).flat().join('\n');
              errorMessage = errorMessages || errorMessage;
          } else if (responseData.message) {
              errorMessage = responseData.message;
          } else if (typeof responseData === 'string') {
              errorMessage = responseData;
          }
      }
      showAlert('error', errorMessage);
      console.error("Error changing password:", error);
    }
  };

  // Hàm xử lý cập nhật cài đặt thông báo (giữ nguyên)
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

  // Hàm xử lý đánh dấu thông báo đã đọc (giữ nguyên)
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
     // Optional: Call API to mark as read on backend
  };

  // Hàm định dạng ngày tháng (giữ nguyên)
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      // Thử parse date string, nếu lỗi thì trả về string gốc
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
       // Nếu parseISO lỗi, thử format trực tiếp nếu dateString có dạng YYYY-MM-DD
       if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
           try {
               const date = parse(dateString.substring(0, 10), 'yyyy-MM-dd', new Date());
               return format(date, 'dd/MM/yyyy', { locale: vi });
           } catch (innerError) {
               console.error("Error formatting date (fallback):", dateString, innerError);
               return dateString.split('T')[0]; // Trả về phần ngày nếu không format được
           }
       }
       console.error("Error formatting date:", dateString, error);
       return dateString.split('T')[0]; // Trả về phần ngày nếu không format được
    }
  };

  // Hàm định dạng ngày giờ (giữ nguyên, nhưng có thể cần check đầu vào)
  const formatDateTime = (dateString: string | null | undefined) => {
     if (!dateString) return 'N/A';
     try {
       // API trả về nhiều định dạng, nên thử parseISO trước
       const date = parseISO(dateString);
       return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
     } catch (error) {
         // Nếu parseISO lỗi, có thể API trả về định dạng khác, thử parse khác nếu cần
         console.error("Error formatting datetime:", dateString, error);
         // Trả về giá trị gốc hoặc một định dạng mặc định
         return dateString;
     }
   };

  // --- UI Rendering ---

  // Hiển thị trạng thái loading chính (cho profile)
  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
          <p className="mt-4 text-gray-600">Đang tải thông tin người dùng...</p>
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
          {/* Sidebar (giữ nguyên) */}
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
                    {/* Nút sửa ảnh đại diện (tạm thời chưa có chức năng) */}
                    {/* <button className="absolute bottom-2 right-0 bg-indigo-500 rounded-full p-1 border-2 border-white hover:bg-indigo-400 transition-colors">
                       <Edit className="h-4 w-4 text-white" />
                    </button> */}
                  </div>
                  <h2 className="text-xl font-bold text-center">{profile?.full_Name || 'Người dùng'}</h2>
                  <p className="text-indigo-200 text-sm truncate w-full text-center">{profile?.email}</p>

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
                    {/* Thanh tiến trình điểm (ví dụ) */}
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${Math.min((profile.loyaltyPoints / 1000) * 100, 100)}%` }} // Giả sử 1000 điểm để lên hạng
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-right text-indigo-200">
                       {profile.loyaltyPoints}/1000 điểm
                    </div>
                  </div>
                )}
              </div>

              {/* Menu điều hướng (giữ nguyên) */}
              <nav className="p-4">
                <ul className="space-y-2">
                   <li>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center px-4 py-2 rounded-md text-left ${
                        activeTab === 'profile'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <User className="h-5 w-5 mr-3 flex-shrink-0" />
                      Thông tin cá nhân
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`w-full flex items-center px-4 py-2 rounded-md text-left ${
                        activeTab === 'bookings'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Ticket className="h-5 w-5 mr-3 flex-shrink-0" />
                      Lịch sử đặt vé
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-md text-left ${
                        activeTab === 'notifications'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-3 flex-shrink-0" />
                        Thông báo
                      </div>
                      {/* Badge số lượng thông báo chưa đọc */}
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                          {notifications.filter(n => !n.isRead).length}
                        </span>
                      )}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`w-full flex items-center px-4 py-2 rounded-md text-left ${
                        activeTab === 'settings'
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                      Cài đặt tài khoản
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleHomePageClick}
                      className="w-full flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 text-left"
                    >
                      <Home className="h-5 w-5 mr-3 flex-shrink-0" />
                      Trang chủ
                    </button>
                  </li>
                  <li className="border-t border-gray-200 pt-2 mt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 rounded-md text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Thông tin hỗ trợ (giữ nguyên) */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Hỗ trợ khách hàng</h3>
              <p className="text-sm text-gray-600 mb-3">
                Bạn cần hỗ trợ? Liên hệ với chúng tôi qua các kênh sau:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-indigo-600 flex-shrink-0" />
                  <span>Hotline: 1900 6017</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-indigo-600 flex-shrink-0" />
                  <span>Email: support@cinema.vn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nội dung chính */}
          <div className="md:col-span-3">
            {/* Tab Thông tin cá nhân (giữ nguyên cấu trúc) */}
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
                      {/* Thông tin cá nhân (Form) */}
                      {activeSubTab === 'personal' && (
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                            {!isEditing ? (
                              <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
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
                                       // API trả về YYYY-MM-DDTHH:mm:ss, input date cần YYYY-MM-DD
                                       date_Of_Birth: profile.date_Of_Birth ? profile.date_Of_Birth.split('T')[0] : '',
                                      sex: profile.sex || '',
                                    });
                                  }
                                }}
                                className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
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
                                  Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  id="full_Name"
                                  value={formData.full_Name}
                                  onChange={handleInputChange}
                                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`}
                                  disabled={!isEditing}
                                  required
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
                                  className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                  disabled // Email không thể thay đổi
                                />
                                <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi.</p>
                              </div>

                              <div>
                                <label htmlFor="phone_Number" className="block text-sm font-medium text-gray-700 mb-1">
                                  Số điện thoại <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="tel" // Use tel type for phone numbers
                                  id="phone_Number"
                                  value={formData.phone_Number}
                                  onChange={handleInputChange}
                                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`}
                                  disabled={!isEditing}
                                  required
                                  pattern="0[0-9]{9}"
                                  title="Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số."
                                />
                              </div>

                              <div>
                                <label htmlFor="date_Of_Birth" className="block text-sm font-medium text-gray-700 mb-1">
                                  Ngày sinh
                                </label>
                                <input
                                  type="date"
                                  id="date_Of_Birth"
                                  // Input date cần format YYYY-MM-DD
                                  value={formData.date_Of_Birth ? formData.date_Of_Birth.split('T')[0] : ''}
                                  onChange={handleInputChange}
                                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`}
                                  disabled={!isEditing}
                                  max={new Date().toISOString().split('T')[0]} // Không cho chọn ngày tương lai
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
                                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`}
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
                                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`}
                                  disabled={!isEditing}
                                />
                              </div>
                            </div>

                            {isEditing && (
                              <div className="flex justify-end pt-4">
                                <button
                                  type="submit"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition-colors text-sm font-medium"
                                >
                                  Lưu thay đổi
                                </button>
                              </div>
                            )}
                          </form>
                        </div>
                      )}

                      {/* Thông tin thành viên & ưu đãi (giữ nguyên) */}
                      {activeSubTab === 'membership' && (
                         <div>
                           <h2 className="text-xl font-bold text-gray-900 mb-6">Thành viên & Ưu đãi</h2>

                           {/* Thẻ thành viên (ví dụ) */}
                           <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg overflow-hidden shadow-lg mb-8 p-6 text-white">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold">Thẻ thành viên Cinema</h3>
                                  <p className="text-indigo-200 text-sm">Hạng: {profile?.membershipLevel || 'Standard'}</p>
                                </div>
                                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                                  {profile?.loyaltyPoints || 0} điểm
                                </div>
                              </div>

                              <div className="mb-6">
                                <p className="text-2xl font-mono tracking-wider">**** **** **** {Math.floor(Math.random() * 9000) + 1000}</p> {/* Số thẻ giả */}
                                <p className="text-sm text-indigo-200 mt-1">Thành viên từ: {formatDate(profile?.memberSince || new Date().toISOString())}</p>
                              </div>

                              <div className="flex justify-between items-end">
                                <p className="text-lg font-medium uppercase">{profile?.full_Name}</p>
                                <img src="/logo-placeholder-white.png" alt="Cinema Logo" className="h-8 opacity-80"/> {/* Placeholder logo */}
                              </div>
                           </div>

                           {/* Phần còn lại của Ưu đãi giữ nguyên */}
                           <div className="space-y-8">
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900 mb-3">Quyền lợi hạng {profile?.membershipLevel || 'Standard'}</h3>
                                  <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                                    {/* Quyền lợi ví dụ */}
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
                                        <Ticket className="h-5 w-5 text-indigo-600" />
                                      </div>
                                      <div className="ml-3">
                                        <h4 className="text-sm font-medium text-gray-900">Giảm giá vé</h4>
                                        <p className="text-xs text-gray-500">Giảm 10% giá vé các ngày trong tuần (T2-T5).</p>
                                      </div>
                                    </div>
                                     <div className="flex items-start">
                                      <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
                                        <Gift className="h-5 w-5 text-indigo-600" />
                                      </div>
                                      <div className="ml-3">
                                        <h4 className="text-sm font-medium text-gray-900">Quà sinh nhật</h4>
                                        <p className="text-xs text-gray-500">01 vé xem phim 2D miễn phí trong tháng sinh nhật.</p>
                                      </div>
                                    </div>
                                     <div className="flex items-start">
                                      <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
                                        <CreditCard className="h-5 w-5 text-indigo-600" />
                                      </div>
                                      <div className="ml-3">
                                        <h4 className="text-sm font-medium text-gray-900">Tích điểm đổi quà</h4>
                                        <p className="text-xs text-gray-500">Mỗi 20.000đ = 1 điểm. Đổi điểm lấy vé, combo bắp nước.</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-lg font-medium text-gray-900 mb-3">Ưu đãi dành cho bạn</h3>
                                   {/* Ưu đãi ví dụ */}
                                  <div className="space-y-4">
                                    <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:shadow-sm transition-shadow flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Thứ 2 vui vẻ - Giảm 30% vé 2D</h4>
                                            <p className="text-sm text-gray-600 mt-1">Áp dụng cho mọi suất chiếu ngày thứ 2.</p>
                                            <span className="text-xs text-gray-500 block mt-2">Hết hạn: 30/04/2025</span>
                                        </div>
                                        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 border border-indigo-600 rounded-md">
                                            Chi tiết
                                        </button>
                                    </div>
                                     <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:shadow-sm transition-shadow flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Combo bắp nước chỉ 79.000đ</h4>
                                            <p className="text-sm text-gray-600 mt-1">Áp dụng khi mua vé online hoặc tại quầy.</p>
                                            <span className="text-xs text-gray-500 block mt-2">Hết hạn: 15/03/2025</span>
                                        </div>
                                         <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 border border-indigo-600 rounded-md">
                                            Chi tiết
                                        </button>
                                    </div>
                                  </div>

                                  <div className="mt-5 text-center">
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                      Xem tất cả ưu đãi
                                    </button>
                                  </div>
                                </div>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* --- START: Tab Lịch sử đặt vé (Cập nhật) --- */}
                {activeTab === 'bookings' && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch sử đặt vé</h2>

                      {/* Trạng thái loading */}
                      {isBookingsLoading && (
                        <div className="text-center py-12">
                          <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
                          <p className="text-gray-500">Đang tải lịch sử đặt vé...</p>
                        </div>
                      )}

                      {/* Không có vé */}
                      {!isBookingsLoading && bookings.length === 0 && (
                        <div className="text-center py-12">
                          <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Bạn chưa có lịch sử đặt vé nào.</p>
                          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                              Đặt vé ngay
                          </button>
                        </div>
                      )}

                      {/* Hiển thị danh sách vé */}
                      {!isBookingsLoading && bookings.length > 0 && (
                        <div className="space-y-6">
                          {/* Lọc và hiển thị vé Sắp diễn ra */}
                          {bookings.filter(b => b.status === 'upcoming').length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                                    Vé sắp diễn ra
                                </h3>
                                <div className="space-y-4">
                                  {bookings
                                    .filter(booking => booking.status === 'upcoming')
                                    .map(booking => (
                                      <div key={booking.id} className="border border-blue-200 bg-blue-50 rounded-lg overflow-hidden transition-shadow hover:shadow-md">
                                        {/* Nội dung thẻ vé */}
                                        <div className="p-4">
                                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                            <div>
                                              <h4 className="font-semibold text-gray-900">{booking.movieTitle}</h4>
                                              <p className="text-sm text-gray-600 mt-1">{booking.cinema}</p>
                                            </div>
                                            <BookingStatusBadge status={booking.status} />
                                          </div>

                                          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                            <div>
                                              <p className="text-xs text-gray-500 uppercase font-medium">Suất chiếu</p>
                                              <p className="font-medium text-gray-800">{formatDateTime(booking.showtime)}</p>
                                            </div>
                                            {/* API không có ghế, bỏ trường này */}
                                            {/* <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Ghế</p>
                                                <p className="font-medium text-gray-800">N/A</p>
                                            </div> */}
                                             <div>
                                                <p className="text-xs text-gray-500 uppercase font-medium">Mã đặt vé</p>
                                                <p className="font-medium text-gray-800">{booking.id}</p>
                                            </div>
                                             <div>
                                              <p className="text-xs text-gray-500 uppercase font-medium">Tổng tiền</p>
                                              <p className="font-medium text-gray-800">{booking.totalAmount.toLocaleString('vi-VN')} đ</p>
                                            </div>
                                             <div>
                                              <p className="text-xs text-gray-500 uppercase font-medium">Thanh toán</p>
                                              <p className="font-medium text-gray-800">{booking.paymentMethod || 'N/A'}</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Footer thẻ vé */}
                                        <div className="bg-blue-100 border-t border-blue-200 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
                                          <div className="flex items-center text-xs text-gray-600">
                                            <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                            <span>Đặt lúc: {formatDateTime(booking.bookingDate)}</span>
                                          </div>
                                          <div className="flex space-x-3">
                                             {/* Nút Chi tiết (có thể thêm sau) */}
                                            <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                              Xem chi tiết
                                            </button>
                                            {/* API không có QR Code */}
                                            {/* <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                              Mã QR
                                            </button> */}
                                             {/* Nút Hủy vé (Nếu API cho phép và còn hạn) */}
                                            <button className="text-xs text-red-600 hover:text-red-800 font-medium">
                                              Hủy vé
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                            </div>
                          )}

                           {/* Lọc và hiển thị vé Đã hoàn thành / Đã hủy */}
                           {bookings.filter(b => b.status !== 'upcoming').length > 0 && (
                              <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                                    Lịch sử cũ
                                </h3>
                                <div className="space-y-4">
                                  {bookings
                                    .filter(booking => booking.status !== 'upcoming')
                                    .map(booking => (
                                      <div key={booking.id} className={`border rounded-lg overflow-hidden transition-shadow hover:shadow-md ${booking.status === 'completed' ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50 opacity-80'}`}>
                                         {/* Nội dung thẻ vé */}
                                         <div className="p-4">
                                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                            <div>
                                              <h4 className={`font-semibold ${booking.status === 'cancelled' ? 'text-red-900' : 'text-gray-900'}`}>{booking.movieTitle}</h4>
                                              <p className={`text-sm mt-1 ${booking.status === 'cancelled' ? 'text-red-700' : 'text-gray-600'}`}>{booking.cinema}</p>
                                            </div>
                                            <BookingStatusBadge status={booking.status} />
                                          </div>

                                          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                            <div>
                                              <p className={`text-xs uppercase font-medium ${booking.status === 'cancelled' ? 'text-red-600' : 'text-gray-500'}`}>Suất chiếu</p>
                                              <p className={`font-medium ${booking.status === 'cancelled' ? 'text-red-800' : 'text-gray-800'}`}>{formatDateTime(booking.showtime)}</p>
                                            </div>
                                            {/* API không có ghế, bỏ trường này */}
                                             <div>
                                                <p className={`text-xs uppercase font-medium ${booking.status === 'cancelled' ? 'text-red-600' : 'text-gray-500'}`}>Mã đặt vé</p>
                                                <p className={`font-medium ${booking.status === 'cancelled' ? 'text-red-800' : 'text-gray-800'}`}>{booking.id}</p>
                                            </div>
                                             <div>
                                              <p className={`text-xs uppercase font-medium ${booking.status === 'cancelled' ? 'text-red-600' : 'text-gray-500'}`}>Tổng tiền</p>
                                              <p className={`font-medium ${booking.status === 'cancelled' ? 'text-red-800' : 'text-gray-800'}`}>{booking.totalAmount.toLocaleString('vi-VN')} đ</p>
                                            </div>
                                             <div>
                                              <p className={`text-xs uppercase font-medium ${booking.status === 'cancelled' ? 'text-red-600' : 'text-gray-500'}`}>Thanh toán</p>
                                              <p className={`font-medium ${booking.status === 'cancelled' ? 'text-red-800' : 'text-gray-800'}`}>{booking.paymentMethod || 'N/A'}</p>
                                            </div>
                                            {booking.status === 'cancelled' && booking.cancellationDate && (
                                                <div>
                                                    <p className="text-xs text-red-600 uppercase font-medium">Ngày hủy</p>
                                                    <p className="font-medium text-red-800">{formatDate(booking.cancellationDate)}</p>
                                                </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Footer thẻ vé */}
                                        <div className={`${booking.status === 'completed' ? 'bg-gray-50 border-t border-gray-200' : 'bg-red-100 border-t border-red-200'} px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2`}>
                                          <div className={`flex items-center text-xs ${booking.status === 'cancelled' ? 'text-red-700' : 'text-gray-600'}`}>
                                            <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                            <span>Đặt lúc: {formatDateTime(booking.bookingDate)}</span>
                                          </div>
                                          <div className="flex space-x-3">
                                            <button className={`text-xs font-medium ${booking.status === 'cancelled' ? 'text-red-700 hover:text-red-900' : 'text-indigo-600 hover:text-indigo-800'}`}>
                                              {booking.status === 'completed' ? 'Đặt lại vé' : 'Xem chi tiết hủy'}
                                            </button>
                                           {/* Nút đánh giá nếu đã hoàn thành */}
                                            {booking.status === 'completed' && (
                                                <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                                    Đánh giá phim
                                                </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* --- END: Tab Lịch sử đặt vé --- */}


                {/* Tab Thông báo (giữ nguyên cấu trúc, thêm loading) */}
                 {activeTab === 'notifications' && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
                                {/* Nút đánh dấu tất cả đã đọc (tùy chọn) */}
                                {notifications.some(n => !n.isRead) && (
                                    <button
                                        onClick={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))}
                                        className="text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        Đánh dấu tất cả đã đọc
                                    </button>
                                )}
                            </div>

                            {/* Loading state */}
                            {isNotificationsLoading && (
                                <div className="text-center py-12">
                                <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
                                <p className="text-gray-500">Đang tải thông báo...</p>
                                </div>
                            )}

                            {/* No notifications */}
                            {!isNotificationsLoading && notifications.length === 0 && (
                                <div className="text-center py-12">
                                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Bạn không có thông báo nào.</p>
                                </div>
                            )}

                            {/* List notifications */}
                            {!isNotificationsLoading && notifications.length > 0 && (
                                <div className="space-y-4">
                                {notifications.map(notification => (
                                    <div
                                    key={notification.id}
                                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                        notification.isRead
                                        ? 'border-gray-200 bg-white hover:bg-gray-50'
                                        : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                                    }`}
                                    onClick={() => markNotificationAsRead(notification.id)}
                                    >
                                    <div className="flex items-start">
                                        {/* Icon based on type */}
                                        <div className={`flex-shrink-0 rounded-full p-1.5 mr-3 ${
                                        notification.type === 'promo' ? 'bg-green-100 text-green-600' :
                                        notification.type === 'system' ? 'bg-blue-100 text-blue-600' :
                                        'bg-yellow-100 text-yellow-600' // booking
                                        }`}>
                                        {notification.type === 'promo' ? <Gift className="h-5 w-5" /> :
                                        notification.type === 'system' ? <Settings className="h-5 w-5" /> :
                                        <Ticket className="h-5 w-5" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className={`font-medium text-sm ${notification.isRead ? 'text-gray-800' : 'text-indigo-900'}`}>
                                                {notification.title}
                                                </h4>
                                                <span className={`text-xs flex-shrink-0 ${notification.isRead ? 'text-gray-500' : 'text-indigo-700'}`}>
                                                {formatDateTime(notification.date)}
                                                </span>
                                            </div>
                                            <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-600' : 'text-indigo-800'}`}>
                                                {notification.message}
                                            </p>
                                        </div>

                                        {/* Dot for unread */}
                                        {!notification.isRead && (
                                            <div className="ml-2 flex-shrink-0 mt-1">
                                                <span className="h-2 w-2 bg-indigo-500 rounded-full inline-block"></span>
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                    </div>
                    )}


                {/* Tab Cài đặt (giữ nguyên cấu trúc) */}
                {activeTab === 'settings' && (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="border-b border-gray-200">
                      <div className="flex">
                        <button
                          onClick={() => {setActiveSubTab('password'); setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: ''});}} // Reset form khi chuyển tab
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
                          Bảo mật & Quyền riêng tư
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Đổi mật khẩu */}
                      {activeSubTab === 'password' && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>

                          <form className="space-y-6 max-w-md" onSubmit={handleChangePassword}>
                            <div>
                              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu hiện tại <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                id="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                autoComplete="current-password"
                              />
                            </div>

                            <div>
                              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu mới <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                id="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                autoComplete="new-password"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).
                              </p>
                            </div>

                            <div>
                              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                id="confirmNewPassword"
                                value={passwordForm.confirmNewPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                autoComplete="new-password"
                              />
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition-colors text-sm font-medium"
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
                                <p className="text-sm text-gray-600 mb-6">Chọn cách bạn muốn nhận thông báo từ chúng tôi.</p>

                                <div className="space-y-6">
                                    {/* Toggle Switch Component (Inline for simplicity) */}
                                    {(Object.keys(notificationSettings) as Array<keyof typeof notificationSettings>).map(key => {
                                        let label = '';
                                        let description = '';
                                        switch (key) {
                                            case 'emailNotifications': label = 'Thông báo qua Email'; description = 'Nhận thông tin đặt vé, khuyến mãi, cập nhật hệ thống qua email.'; break;
                                            case 'smsNotifications': label = 'Thông báo qua SMS'; description = 'Nhận thông tin đặt vé, mã OTP, cảnh báo quan trọng qua SMS.'; break;
                                            case 'marketingCommunications': label = 'Khuyến mãi & Ưu đãi'; description = 'Nhận thông tin về các chương trình khuyến mãi, phim mới.'; break;
                                            case 'bookingReminders': label = 'Nhắc nhở lịch chiếu'; description = 'Nhận thông báo nhắc nhở trước giờ chiếu phim.'; break;
                                            case 'specialOffers': label = 'Ưu đãi đặc biệt'; description = 'Nhận thông báo về các ưu đãi dành riêng cho thành viên.'; break;
                                        }
                                        return (
                                            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                                                <div className="mr-4">
                                                    <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                                                </div>
                                                <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                                                    <input
                                                    type="checkbox"
                                                    id={key}
                                                    checked={notificationSettings[key]}
                                                    onChange={() => handleNotificationSettingsChange(key)}
                                                    className="sr-only peer"
                                                    />
                                                    <label
                                                    htmlFor={key}
                                                    className="block overflow-hidden h-6 rounded-full bg-gray-300 peer-checked:bg-indigo-600 cursor-pointer"
                                                    >
                                                        <span className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1 ${notificationSettings[key] ? 'translate-x-4' : 'translate-x-0'}`}></span>
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                      {/* Bảo mật & Quyền riêng tư */}
                      {activeSubTab === 'privacy' && (
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-6">Bảo mật & Quyền riêng tư</h2>

                          <div className="space-y-8">
                            {/* Cảnh báo bảo mật */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <Shield className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-yellow-800">Giữ tài khoản của bạn an toàn</h3>
                                  <div className="mt-2 text-sm text-yellow-700 space-y-1">
                                    <p>• Sử dụng mật khẩu mạnh, duy nhất cho trang này.</p>
                                    <p>• Cập nhật mật khẩu định kỳ.</p>
                                    <p>• Không bao giờ chia sẻ thông tin đăng nhập.</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Phiên đăng nhập */}
                             <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Phiên đăng nhập</h3>
                              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                                {/* Phiên hiện tại */}
                                <div className="p-4 flex items-center justify-between">
                                  <div className="flex items-center">
                                     <div className="flex-shrink-0 bg-green-100 rounded-full p-1 mr-3">
                                       <Check className="h-4 w-4 text-green-600" />
                                     </div>
                                     <div>
                                       <p className="text-sm font-medium text-gray-900">Phiên hiện tại</p>
                                       <p className="text-xs text-gray-500 mt-0.5">
                                           {navigator.userAgent.includes('Mobile') ? 'Thiết bị di động' : 'Máy tính để bàn'} • IP: 192.168.1.xxx {/* IP giả */}
                                       </p>
                                     </div>
                                  </div>
                                   {/* <span className="text-xs text-green-600 font-medium">Đang hoạt động</span> */}
                                </div>
                                {/* Các phiên khác (nếu có API) */}
                                {/* <div className="p-4 flex items-center justify-between"> ... </div> */}
                              </div>
                              <div className="mt-3 text-right">
                                <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                  Đăng xuất khỏi tất cả thiết bị khác
                                </button>
                              </div>
                            </div>

                            {/* Quản lý dữ liệu */}
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-3">Quản lý dữ liệu của bạn</h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">Chính sách quyền riêng tư</h4>
                                    <p className="text-xs text-gray-500 mt-1">Xem cách chúng tôi thu thập và sử dụng dữ liệu của bạn.</p>
                                  </div>
                                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                                    Xem chính sách <ChevronRight className="h-4 w-4 ml-0.5" />
                                  </a>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">Tải xuống dữ liệu</h4>
                                    <p className="text-xs text-gray-500 mt-1">Yêu cầu bản sao dữ liệu cá nhân của bạn.</p>
                                  </div>
                                  <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    Yêu cầu tải xuống
                                  </button>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                  <div>
                                    <h4 className="text-sm font-medium text-red-600">Xóa tài khoản</h4>
                                    <p className="text-xs text-gray-500 mt-1">Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan.</p>
                                  </div>
                                  <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                    Yêu cầu xóa tài khoản
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