import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Ticket, LogOut, Home, Bell, Key,
  Calendar, MapPin, Phone, Mail, Edit, Check, X,
  ChevronRight, Shield, CreditCard, Clock, Gift, Loader2
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isFuture } from 'date-fns';
import { vi } from 'date-fns/locale';

// Định nghĩa kiểu dữ liệu UserProfile
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

// Định nghĩa kiểu dữ liệu Booking
interface Booking {
  id: string;
  movieTitle: string;
  showtime: string;
  cinema: string;
  totalAmount: number;
  bookingDate: string;
  status: 'Pending' | 'Cancelled' | 'Confirmed';
  paymentMethod?: string | null;
  cancellationDate?: string | null;
}

// Định nghĩa kiểu dữ liệu cho API response
interface ApiBooking {
  $id: string;
  booking_ID: number;
  booking_Date: string;
  total_Amount: number;
  status: 'Pending' | 'Cancelled' | 'Confirmed';
  payment_Method: string | null;
  payment_Date: string | null;
  cancellation_Date: string | null;
  showtime: {
    $id: string;
    showtime_ID: number;
    show_Date: string;
    start_Time: string;
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

// Thêm các interface mới
interface TicketSeatInfo {
  seat_ID: number;
  row_Label: string;
  column_Number: number;
  seat_Type: string;
  seatLabel: string;
}

interface TicketMovieInfo {
  movie_ID: number;
  movie_Name: string;
  duration: number;
  rating: string;
}

interface TicketShowtimeInfo {
  showtime_ID: number;
  showDate: string;
  startTime: string;
  endTime: string;
}

interface TicketCinemaRoomInfo {
  cinema_Room_ID: number;
  room_Name: string;
  room_Type: string;
}

interface TicketPriceInfo {
  base_Price: number;
  discount_Amount: number;
  final_Price: number;
}

interface TicketDetail {
  ticket_ID: number;
  booking_ID: number;
  ticket_Code: string;
  seatInfo: TicketSeatInfo;
  movieInfo: TicketMovieInfo;
  showtimeInfo: TicketShowtimeInfo;
  cinemaRoomInfo: TicketCinemaRoomInfo;
  priceInfo: TicketPriceInfo;
  is_Checked_In: boolean;
  checkInTime: string | null;
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
const BookingStatusBadge: React.FC<{ status: 'Pending' | 'Cancelled' | 'Confirmed' }> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'Pending': return 'Đang chờ thanh toán';
      case 'Confirmed': return 'Đã xác nhận';
      case 'Cancelled': return 'Đã hủy';
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

  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formData, setFormData] = useState({
    full_Name: '',
    email: '',
    phone_Number: '',
    address: '',
    date_Of_Birth: '',
    sex: '',
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingCommunications: true,
    bookingReminders: true,
    specialOffers: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Thêm state cho trang hiện tại
  const bookingsPerPage = 5; // Số booking mỗi trang
  const [isPaymentLoading, setIsPaymentLoading] = useState<{ [key: string]: boolean }>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<TicketDetail[]>([]);

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 5000);
  };

  const fetchUserProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${apiBaseUrl}/Auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
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
      setIsProfileLoading(false);
    }
  }, [navigate, apiBaseUrl]);

  const fetchBookings = useCallback(async () => {
    setIsBookingsLoading(true);
    setBookings([]);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để xem lịch sử đặt vé.');
        navigate('/login');
        return;
      }
      const response = await axios.get<{ $id: string; $values: ApiBooking[] }>(
        `${apiBaseUrl}/Booking/my-bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.$values) {
        const apiBookings: ApiBooking[] = response.data.$values;
        const mappedBookings: Booking[] = apiBookings.map((apiBooking) => {
          const showDatePart = apiBooking.showtime.show_Date.split('T')[0];
          const showDateTimeString = `${showDatePart}T${apiBooking.showtime.start_Time}`;
          return {
            id: String(apiBooking.booking_ID),
            movieTitle: apiBooking.showtime.movie.movie_Name || 'Không có tên phim',
            showtime: showDateTimeString,
            cinema: apiBooking.showtime.room.room_Name || 'Không có tên phòng',
            totalAmount: apiBooking.total_Amount,
            bookingDate: apiBooking.booking_Date,
            status: apiBooking.status,
            paymentMethod: apiBooking.payment_Method,
            cancellationDate: apiBooking.cancellation_Date,
          };
        });
        mappedBookings.sort((a, b) => {
          const showDateTimeA = parseISO(a.showtime);
          const showDateTimeB = parseISO(b.showtime);
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (a.status !== 'Pending' && b.status === 'Pending') return 1;
          if (a.status === 'Confirmed' && isFuture(showDateTimeA) && (b.status !== 'Confirmed' || !isFuture(showDateTimeB))) return -1;
          if (b.status === 'Confirmed' && isFuture(showDateTimeB) && (a.status !== 'Confirmed' || !isFuture(showDateTimeA))) return 1;
          return parseISO(b.bookingDate).getTime() - parseISO(a.bookingDate).getTime();
        });
        setBookings(mappedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showAlert('error', 'Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.');
      setBookings([]);
    } finally {
      setIsBookingsLoading(false);
    }
  }, [navigate, apiBaseUrl]);

  const fetchNotifications = useCallback(() => {
    setIsNotificationsLoading(true);
    const mockNotifications: Notification[] = [
      {
        id: 'N001',
        title: 'Đặt vé thành công',
        message: 'Bạn đã đặt vé xem phim Avengers: Endgame thành công. Vui lòng đến rạp trước giờ chiếu 15 phút.',
        date: '2025-03-10T14:25:00Z',
        isRead: true,
        type: 'booking'
      },
    ];
    setNotifications(mockNotifications);
    setIsNotificationsLoading(false);
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    else if (activeTab === 'notifications') fetchNotifications();
  }, [activeTab, fetchBookings, fetchNotifications]);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem("token");
      navigate('/');
    }
  };

  const handleHomePageClick = () => navigate('/');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [id]: value }));
  };

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
        if (isNaN(dob.getTime()) || dob >= new Date()) {
          showAlert('error', 'Ngày sinh không hợp lệ hoặc phải trong quá khứ.');
          return;
        }
        formattedDateOfBirth = dob.toISOString().split('T')[0];
      }
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      await axios.put(`${apiBaseUrl}/Auth/profile`, {
        fullName: formData.full_Name,
        phoneNumber: formData.phone_Number,
        address: formData.address,
        dateOfBirth: formattedDateOfBirth,
        sex: formData.sex
      }, { headers: { Authorization: `Bearer ${token}` } });
      showAlert('success', 'Cập nhật thông tin thành công!');
      setIsEditing(false);
      if (profile) {
        setProfile({ ...profile, ...formData, date_Of_Birth: formattedDateOfBirth });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert('error', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showAlert('error', 'Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showAlert('error', 'Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      showAlert('error', 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      await axios.put(`${apiBaseUrl}/Auth/password`, {
        OldPassword: passwordForm.currentPassword,
        NewPassword: passwordForm.newPassword,
        ConfirmNewPassword: passwordForm.confirmNewPassword
      }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      showAlert('success', 'Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      console.error("Error changing password:", error);
      showAlert('error', 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.');
    }
  };

  const handleNotificationSettingsChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    setTimeout(() => showAlert('success', 'Đã cập nhật cài đặt thông báo.'), 500);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString.split('T')[0];
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return dateString;
    }
  };

  // Logic phân trang
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePayment = async (bookingId: string) => {
    try {
      setIsPaymentLoading(prev => ({ ...prev, [bookingId]: true }));
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để thanh toán.');
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${apiBaseUrl}/payos/payment-url/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        showAlert('error', 'Không thể tạo liên kết thanh toán. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      showAlert('error', 'Đã xảy ra lỗi khi tạo thanh toán. Vui lòng thử lại sau.');
    } finally {
      setIsPaymentLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    // Hiển thị dialog xác nhận trước khi hủy
    if (!window.confirm('Bạn có chắc chắn muốn hủy vé này không?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để thực hiện thao tác này.');
        navigate('/login');
        return;
      }

      const response = await axios.put(
        `${apiBaseUrl}/Booking/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        showAlert('success', 'Đã hủy vé thành công.');
        // Cập nhật lại danh sách đặt vé
        fetchBookings();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showAlert('error', 'Không thể hủy vé. Vui lòng thử lại sau.');
    }
  };

  const handleViewDetails = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để xem chi tiết.');
        navigate('/login');
        return;
      }

      const response = await axios.get<{ $values: TicketDetail[] }>(
        `${apiBaseUrl}/Ticket/booking/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.$values) {
        setTicketDetails(response.data.$values);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      showAlert('error', 'Không thể tải thông tin vé. Vui lòng thử lại sau.');
    }
  };

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
        {alert.show && (
          <AlertMessage
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(prev => ({ ...prev, show: false }))}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden">
                      {profile?.profilePicture ? (
                        <img src={profile.profilePicture} alt={profile.full_Name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-white" />
                      )}
                    </div>
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
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${Math.min((profile.loyaltyPoints / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-right text-indigo-200">
                      {profile.loyaltyPoints}/1000 điểm
                    </div>
                  </div>
                )}
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center px-4 py-2 rounded-md text-left ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <User className="h-5 w-5 mr-3 flex-shrink-0" />
                      Thông tin cá nhân
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`w-full flex items-center px-4 py-2 rounded-md text-left ${activeTab === 'bookings' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Ticket className="h-5 w-5 mr-3 flex-shrink-0" />
                      Lịch sử đặt vé
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-md text-left ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 mr-3 flex-shrink-0" />
                        Thông báo
                      </div>
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
                      className={`w-full flex items-center px-4 py-2 rounded-md text-left ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Hỗ trợ khách hàng</h3>
              <p className="text-sm text-gray-600 mb-3">Bạn cần hỗ trợ? Liên hệ với chúng tôi qua các kênh sau:</p>
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
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setActiveSubTab('personal')}
                      className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'personal' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Thông tin cá nhân
                    </button>
                    <button
                      onClick={() => setActiveSubTab('membership')}
                      className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'membership' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Thành viên & Ưu đãi
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {activeSubTab === 'personal' && (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                        {!isEditing ? (
                          <button onClick={() => setIsEditing(true)} className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm">
                            <Edit className="h-4 w-4 mr-1" />
                            <span>Chỉnh sửa</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              if (profile) {
                                setFormData({
                                  full_Name: profile.full_Name || '',
                                  email: profile.email || '',
                                  phone_Number: profile.phone_Number || '',
                                  address: profile.address || '',
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
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              id="email"
                              value={formData.email}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-500"
                              disabled
                            />
                            <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi.</p>
                          </div>
                          <div>
                            <label htmlFor="phone_Number" className="block text-sm font-medium text-gray-700 mb-1">
                              Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
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
                            <label htmlFor="date_Of_Birth" className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                            <input
                              type="date"
                              id="date_Of_Birth"
                              value={formData.date_Of_Birth ? formData.date_Of_Birth.split('T')[0] : ''}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`}
                              disabled={!isEditing}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
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
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
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
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition-colors text-sm font-medium">
                              Lưu thay đổi
                            </button>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                  {activeSubTab === 'membership' && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Thành viên & Ưu đãi</h2>
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
                          <p className="text-2xl font-mono tracking-wider">**** **** **** {Math.floor(Math.random() * 9000) + 1000}</p>
                          <p className="text-sm text-indigo-200 mt-1">Thành viên từ: {formatDate(profile?.memberSince || new Date().toISOString())}</p>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-lg font-medium uppercase">{profile?.full_Name}</p>
                          <img src="/logo-placeholder-white.png" alt="Cinema Logo" className="h-8 opacity-80" />
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Quyền lợi hạng {profile?.membershipLevel || 'Standard'}</h3>
                          <div className="bg-gray-50 rounded-lg p-5 space-y-4">
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
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch sử đặt vé</h2>
                  {isBookingsLoading && (
                    <div className="text-center py-12">
                      <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
                      <p className="text-gray-500">Đang tải lịch sử đặt vé...</p>
                    </div>
                  )}
                  {!isBookingsLoading && bookings.length === 0 && (
                    <div className="text-center py-12">
                      <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Bạn chưa có lịch sử đặt vé nào.</p>
                      <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                        Đặt vé ngay
                      </button>
                    </div>
                  )}
                  {!isBookingsLoading && bookings.length > 0 && (
                    <>
                      <div className="space-y-6">
                        {currentBookings.map(booking => (
                          <div
                            key={booking.id}
                            className={`border rounded-lg overflow-hidden transition-shadow hover:shadow-md ${
                              booking.status === 'Pending'
                                ? 'border-yellow-200 bg-yellow-50'
                                : booking.status === 'Confirmed'
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50 opacity-80'
                            }`}
                          >
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
                                {booking.status === 'Cancelled' && booking.cancellationDate && (
                                  <div>
                                    <p className="text-xs text-red-600 uppercase font-medium">Ngày hủy</p>
                                    <p className="font-medium text-red-800">{formatDate(booking.cancellationDate)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div
                              className={`${
                                booking.status === 'Pending'
                                  ? 'bg-yellow-100 border-t border-yellow-200'
                                  : booking.status === 'Confirmed'
                                  ? 'bg-green-100 border-t border-green-200'
                                  : 'bg-red-100 border-t border-red-200'
                              } px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2`}
                            >
                              <div className="flex items-center text-xs text-gray-600">
                                <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                <span>Đặt lúc: {formatDateTime(booking.bookingDate)}</span>
                              </div>
                              <div className="flex space-x-3">
                                <button 
                                  onClick={() => handleViewDetails(booking.id)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  Xem chi tiết
                                </button>
                                {booking.status === 'Pending' && (
                                  <button 
                                    onClick={() => handlePayment(booking.id)}
                                    disabled={isPaymentLoading[booking.id]}
                                    className="text-xs text-yellow-600 hover:text-yellow-800 font-medium flex items-center"
                                  >
                                    {isPaymentLoading[booking.id] ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Đang xử lý...
                                      </>
                                    ) : (
                                      'Thanh toán'
                                    )}
                                  </button>
                                )}
                                {booking.status === 'Pending' && (
                                  <button 
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Hủy vé
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Phân trang */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex justify-center items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                          >
                            Trước
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                          >
                            Sau
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
                    {notifications.some(n => !n.isRead) && (
                      <button
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  {isNotificationsLoading && (
                    <div className="text-center py-12">
                      <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
                      <p className="text-gray-500">Đang tải thông báo...</p>
                    </div>
                  )}
                  {!isNotificationsLoading && notifications.length === 0 && (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Bạn không có thông báo nào.</p>
                    </div>
                  )}
                  {!isNotificationsLoading && notifications.length > 0 && (
                    <div className="space-y-4">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${notification.isRead ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start">
                            <div
                              className={`flex-shrink-0 rounded-full p-1.5 mr-3 ${
                                notification.type === 'promo' ? 'bg-green-100 text-green-600' :
                                notification.type === 'system' ? 'bg-blue-100 text-blue-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}
                            >
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
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => { setActiveSubTab('password'); setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); }}
                      className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'password' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Đổi mật khẩu
                    </button>
                    <button
                      onClick={() => setActiveSubTab('notifications')}
                      className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'notifications' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Cài đặt thông báo
                    </button>
                    <button
                      onClick={() => setActiveSubTab('privacy')}
                      className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'privacy' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Bảo mật & Quyền riêng tư
                    </button>
                  </div>
                </div>
                <div className="p-6">
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
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition-colors text-sm font-medium">
                            Đổi mật khẩu
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  {activeSubTab === 'notifications' && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Cài đặt thông báo</h2>
                      <p className="text-sm text-gray-600 mb-6">Chọn cách bạn muốn nhận thông báo từ chúng tôi.</p>
                      <div className="space-y-6">
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
                  {activeSubTab === 'privacy' && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-6">Bảo mật & Quyền riêng tư</h2>
                      <div className="space-y-8">
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
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Phiên đăng nhập</h3>
                          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                            <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-100 rounded-full p-1 mr-3">
                                  <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Phiên hiện tại</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {navigator.userAgent.includes('Mobile') ? 'Thiết bị di động' : 'Máy tính để bàn'} • IP: 192.168.1.xxx
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-right">
                            <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                              Đăng xuất khỏi tất cả thiết bị khác
                            </button>
                          </div>
                        </div>
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
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        tickets={ticketDetails}
      />
    </div>
  );
};

// Component Modal chi tiết vé
const TicketDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tickets: TicketDetail[];
}> = ({ isOpen, onClose, tickets }) => {
  if (!isOpen || tickets.length === 0) return null;

  const firstTicket = tickets[0];
  const seatLabels = tickets.map(ticket => ticket.seatInfo.seatLabel).join(', ');
  const totalPrice = tickets.reduce((sum, ticket) => sum + ticket.priceInfo.final_Price, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-gray-900">Chi tiết đặt vé</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg text-indigo-900 mb-2">{firstTicket.movieInfo.movie_Name}</h4>
              <p className="text-indigo-700">Phân loại: {firstTicket.movieInfo.rating}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Mã vé</p>
                <p className="font-medium">{tickets.map(t => t.ticket_Code).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ghế</p>
                <p className="font-medium">{seatLabels}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày chiếu</p>
                <p className="font-medium">{firstTicket.showtimeInfo.showDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Giờ chiếu</p>
                <p className="font-medium">
                  {firstTicket.showtimeInfo.startTime} - {firstTicket.showtimeInfo.endTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phòng chiếu</p>
                <p className="font-medium">{firstTicket.cinemaRoomInfo.room_Name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Loại phòng</p>
                <p className="font-medium">{firstTicket.cinemaRoomInfo.room_Type}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Tổng tiền</p>
                <p className="text-lg font-bold text-indigo-600">
                  {totalPrice.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;