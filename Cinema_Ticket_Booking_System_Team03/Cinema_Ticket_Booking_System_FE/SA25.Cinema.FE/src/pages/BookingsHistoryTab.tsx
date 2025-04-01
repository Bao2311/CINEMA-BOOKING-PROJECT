import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { parseISO, isFuture } from 'date-fns';
import BookingsHistoryTab from '../components/profile/BookingsHistoryTab';
import { Booking, TicketDetail } from '../interfaces/ProfileInterfaces';
import { AlertCircle, CheckCircle } from 'lucide-react';
import BookingStatusBadge from '../components/profile/BookingStatusBadge';
import TicketDetailModal from '../components/profile/TicketDetailModal';

interface ApiBooking {
  booking_ID: number;
  booking_Date: string;
  total_Amount: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  payment_Method: string;
  cancellation_Date: string | null;
  showtime: {
    show_Date: string;
    start_Time: string;
    end_Time: string;
    movie: {
      movie_Name: string;
      rating: string;
    };
    room: {
      room_Name: string;
      room_Type: string;
      cinema: {
        cinema_Name: string;
      }
    }
  };
}

interface AlertState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const apiBaseUrl = 'https://localhost:7168/api';
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaymentLoading, setIsPaymentLoading] = useState<{ [key: string]: boolean }>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<TicketDetail[]>([]);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: '',
    type: 'success'
  });
  const [selectedTickets, setSelectedTickets] = useState<TicketDetail[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Hiển thị thông báo
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({
      show: true,
      message,
      type
    });
    
    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Lấy danh sách đặt vé
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để xem lịch sử đặt vé');
        navigate('/login');
        return;
      }
  
      const response = await axios.get(
        `${apiBaseUrl}/Booking/my-bookings`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response type:', response.headers['content-type']);
      
      // Kiểm tra xem response.data có phải là JSON không
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.error('API trả về HTML thay vì JSON:', response.data.substring(0, 100));
        throw new Error('API trả về dữ liệu không phải JSON');
      }
      
      // Log cấu trúc dữ liệu để kiểm tra
      console.log('API Response Structure:', {
        isArray: Array.isArray(response.data),
        hasValues: response.data.$values !== undefined,
        type: typeof response.data,
        keys: Object.keys(response.data)
      });
  
      // Nếu là mảng trực tiếp
      const apiBookings = Array.isArray(response.data) 
        ? response.data 
        : (response.data.$values || []);
      
      if (apiBookings.length > 0) {
        const mappedBookings = apiBookings.map((apiBooking: ApiBooking) => {
          // Sử dụng optional chaining để tránh lỗi khi truy cập thuộc tính của undefined
          const showDatePart = apiBooking.showtime?.show_Date?.split('T')[0] || '';
          const showDateTimeString = `${showDatePart}T${apiBooking.showtime?.start_Time || ''}`;
          
          const cinemaName = apiBooking.showtime?.room?.cinema?.cinema_Name || 'Không xác định';
          const roomName = apiBooking.showtime?.room?.room_Name || 'Không xác định';
          const movieName = apiBooking.showtime?.movie?.movie_Name || 'Không có tên phim';
          
          return {
            id: String(apiBooking.booking_ID),
            movieTitle: movieName,
            showtime: showDateTimeString,
            cinema: `${cinemaName} - ${roomName}`,
            totalAmount: apiBooking.total_Amount,
            bookingDate: apiBooking.booking_Date,
            status: apiBooking.status,
            paymentMethod: apiBooking.payment_Method,
            cancellationDate: apiBooking.cancellation_Date,
            // Thêm thông tin chi tiết cho modal
            movieInfo: {
              movie_Name: movieName,
              rating: apiBooking.showtime?.movie?.rating || 'P'
            },
            showtimeInfo: {
              showDate: showDatePart,
              startTime: apiBooking.showtime?.start_Time || '',
              endTime: apiBooking.showtime?.end_Time || ''
            },
            cinemaRoomInfo: {
              room_Name: roomName,
              room_Type: apiBooking.showtime?.room?.room_Type || 'Standard',
              cinema_Name: cinemaName
            }
          };
        });
        
        setBookings(mappedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // Xử lý các loại lỗi cụ thể
      if (error.code === 'ECONNABORTED') {
        showAlert('error', 'Kết nối đến máy chủ quá thời gian. Vui lòng thử lại sau.');
      } else if (error.response?.status === 404) {
        showAlert('error', 'Không tìm thấy API endpoint. Vui lòng kiểm tra URL.');
      } else if (error.response?.status === 403) {
        showAlert('error', 'Bạn không có quyền truy cập dữ liệu này.');
      } else {
        showAlert('error', 'Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.');
      }
      
      // Xử lý lỗi token hết hạn
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Xử lý thanh toán
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

  // Xử lý hủy đặt vé
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

  // Xem chi tiết đặt vé
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

  // Tải danh sách đặt vé khi component được mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Render booking card để sử dụng trong BookingsHistoryTab
  const renderBookingCard = (booking: Booking) => {
    const isShowtimeFuture = isFuture(parseISO(booking.showtime));
    const canCancel = booking.status === 'Confirmed' && isShowtimeFuture;
    const needsPayment = booking.status === 'Pending';
    
    return (
      <div key={booking.id} className="bg-white rounded-lg shadow-md p-5 mb-4 border border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{booking.movieTitle}</h3>
          <BookingStatusBadge status={booking.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-sm text-gray-500">Rạp chiếu</p>
            <p className="font-medium text-gray-800">{booking.cinema}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ngày giờ chiếu</p>
            <p className="font-medium text-gray-800">
              {new Date(booking.showtime).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng tiền</p>
            <p className="font-medium text-indigo-600">
              {booking.totalAmount.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ngày đặt</p>
            <p className="font-medium text-gray-800">
              {new Date(booking.bookingDate).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => handleViewDetails(booking.id)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            Xem chi tiết
          </button>
          
          {needsPayment && (
            <button
              onClick={() => handlePayment(booking.id)}
              disabled={isPaymentLoading[booking.id]}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {isPaymentLoading[booking.id] ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          )}
          
          {canCancel && (
            <button
              onClick={() => handleCancelBooking(booking.id)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
            >
              Hủy đặt vé
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Lịch Sử Đặt Vé</h1>
      
      {/* Hiển thị thông báo */}
      {alert.show && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          alert.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {alert.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium">{alert.message}</p>
          </div>
        </div>
      )}
      
      {/* Hiển thị danh sách đặt vé */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map(booking => renderBookingCard(booking))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử đặt vé</h3>
          <p className="text-gray-500 mb-6">Bạn chưa đặt vé xem phim nào.</p>
          <button 
            onClick={() => navigate('/movies')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Đặt vé ngay
          </button>
        </div>
      )}
      
      {/* Modal chi tiết vé */}
      <TicketDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tickets={selectedTickets} 
      />
    </div>
  );
};

export default BookingHistoryPage;
