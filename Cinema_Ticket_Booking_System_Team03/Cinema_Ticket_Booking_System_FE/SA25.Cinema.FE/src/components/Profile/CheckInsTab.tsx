import React, { useState, useEffect } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { 
  Loader2, QrCode, Check, X, Calendar, Clock, 
  MapPin, User, CreditCard, Search, AlertCircle, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react'; // Fix: Import QRCodeSVG component instead of the whole library
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CheckInsTabProps {
  showAlert: (type: 'success' | 'error' | 'info', message: string) => void;
  apiBaseUrl: string;
  navigate: NavigateFunction;
}

interface CustomerInfo {
  user_ID: number;
  full_Name: string;
  email: string;
  phone_Number: string;
}

interface SeatInfo {
  seat_ID: number;
  row_Label: string;
  column_Number: number;
  seat_Type: string;
  seatLabel: string;
}

interface MovieInfo {
  movie_ID: number;
  movie_Name: string;
  duration: number;
  rating: string;
  poster_URL?: string;
}

interface ShowtimeInfo {
  showtime_ID: number;
  showDate: string;
  startTime: string;
  endTime: string;
}

interface CinemaRoomInfo {
  cinema_Room_ID: number;
  room_Name: string;
  room_Type: string;
}

interface PriceInfo {
  base_Price: number;
  discount_Amount: number;
  final_Price: number;
}

interface TicketInfo {
  ticket_ID: number;
  booking_ID: number;
  ticket_Code: string;
  customerInfo: CustomerInfo;
  seatInfo: SeatInfo;
  movieInfo: MovieInfo;
  showtimeInfo: ShowtimeInfo;
  cinemaRoomInfo: CinemaRoomInfo;
  priceInfo: PriceInfo;
  is_Checked_In: boolean;
  checkInTime: string | null;
}

// Sample ticket data for demonstration
const sampleTickets = [
  {
    movieName: "ONEPIECE",
    showDate: "14/04/2025",
    startTime: "01:00",
    ticketCode: "815",
    paymentMethod: "Online",
    isCheckedIn: true,
    isCancelled: false
  },
  {
    movieName: "Nhà Giả Tiên",
    showDate: "10/04/2025",
    startTime: "01:00",
    ticketCode: "811",
    paymentMethod: "Online",
    isCheckedIn: false,
    isCancelled: false
  },
  {
    movieName: "Người Nhện: Không Còn Nhà",
    showDate: "14/04/2025",
    startTime: "07:25",
    ticketCode: "817",
    paymentMethod: "PayOS",
    isCheckedIn: false,
    isCancelled: true
  }
];

const CheckInsTab: React.FC<CheckInsTabProps> = ({ showAlert, apiBaseUrl, navigate }) => {
  const [ticketCode, setTicketCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [isCheckinLoading, setIsCheckinLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Format date for better display
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Format time for better display
  const formatTime = (timeString: string): string => {
    return timeString.substring(0, 5); // Get only HH:MM part
  };

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && ticketInfo) {
      const interval = setInterval(() => {
        refreshTicketInfo(ticketInfo.ticket_Code);
      }, 30000); // Every 30 seconds
      
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, ticketInfo]);

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Refresh ticket information
  const refreshTicketInfo = async (code: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${apiBaseUrl}/Ticket/code/${code}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setTicketInfo(response.data);
      }
    } catch (error) {
      console.error('Error refreshing ticket info:', error);
    }
  };

  // Handle ticket search
  const handleSearch = async (): Promise<void> => {
    if (!ticketCode.trim()) {
      showAlert('error', 'Vui lòng nhập mã vé');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${apiBaseUrl}/Ticket/code/${ticketCode.trim()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setTicketInfo(response.data);
      } else {
        showAlert('error', 'Không tìm thấy thông tin vé');
        setTicketInfo(null);
      }
    } catch (error) {
      console.error('Error fetching ticket information:', error);
      showAlert('error', 'Không thể tải thông tin vé. Vui lòng thử lại sau.');
      setTicketInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-in process - using the same API endpoint with POST method
  const handleCheckin = async (): Promise<void> => {
    if (!ticketInfo) return;

    setIsCheckinLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      // Update the ticket's check-in status manually since we don't have a dedicated check-in API
      // This is a simulation - in a real app, you would need a proper endpoint for check-in
      
      // After "successful" check-in, refresh the ticket info
      const updatedTicket = await axios.get(
        `${apiBaseUrl}/api/Ticket/code/${ticketCode.trim()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (updatedTicket.data) {
        // Simulate successful check-in by modifying the response
        const modifiedTicket = {
          ...updatedTicket.data,
          is_Checked_In: true,
          checkInTime: new Date().toISOString()
        };
        
        setTicketInfo(modifiedTicket);
        showAlert('success', 'Check-in thành công! (Chế độ mô phỏng)');
      } else {
        showAlert('error', 'Không thể check-in. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      showAlert('error', 'Đã xảy ra lỗi khi check-in. Vui lòng thử lại sau.');
    } finally {
      setIsCheckinLoading(false);
    }
  };

  // View ticket details from history samples
  const viewTicketDetails = (code: string): void => {
    setTicketCode(code);
    handleSearch();
  };

  // Get color classes based on ticket status
  const getStatusClasses = (isCheckedIn: boolean, isCancelled: boolean): { 
    bg: string, 
    text: string, 
    statusText: string 
  } => {
    if (isCancelled) {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-rose-600',
        text: 'text-red-700',
        statusText: 'ĐÃ HỦY'
      };
    }
    
    if (isCheckedIn) {
      return {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-green-700',
        statusText: 'ĐÃ CHECK-IN'
      };
    }
    
    return {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
      text: 'text-amber-700',
      statusText: 'CHƯA CHECK-IN'
    };
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <QrCode className="h-5 w-5 mr-2 text-indigo-600" />
            Check-in vé xem phim
          </h2>
          
          <div className="mb-6">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Nhập mã vé (ví dụ: 48EA4CFA)"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  disabled={isLoading}
                />
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center min-w-[120px] font-medium"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Tìm kiếm'
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Nhập mã vé để kiểm tra thông tin và thực hiện check-in
            </p>
          </div>
        </div>
      </div>

      {/* Ticket History Section - Static Sample */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-indigo-600" />
              Lịch sử đặt vé
            </h2>
            
            <div className="flex items-center">
              <button 
                onClick={() => { /* Simulated refresh */ }}
                className="mr-4 text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Tải lại
              </button>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefreshToggle"
                  checked={autoRefresh}
                  onChange={toggleAutoRefresh}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="autoRefreshToggle" className="text-sm text-gray-600">
                  Tự động cập nhật (30s)
                </label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {sampleTickets.map((ticket, index) => {
              const status = getStatusClasses(ticket.isCheckedIn, ticket.isCancelled);
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg overflow-hidden ${ticketCode === ticket.ticketCode ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className={`${status.bg} p-3 flex justify-between items-center`}>
                    <div>
                      <h3 className="font-semibold text-white">{ticket.movieName}</h3>
                      <p className="text-white text-opacity-90 text-sm">
                        {ticket.showDate} | {ticket.startTime}
                      </p>
                    </div>
                    <div className={`bg-white px-3 py-1 rounded-full text-sm font-bold ${status.text}`}>
                      {status.statusText}
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Mã vé</p>
                      <p className="font-mono font-medium">{ticket.ticketCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Thanh toán</p>
                      <p className="font-medium">{ticket.paymentMethod}</p>
                    </div>
                    <button 
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      onClick={() => viewTicketDetails(ticket.ticketCode)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ticket Details Section */}
      {ticketInfo && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className={`p-4 flex justify-between items-center ${
            ticketInfo.is_Checked_In 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-amber-500 to-orange-600'
          }`}>
            <div>
              <h3 className="font-bold text-xl text-white">
                {ticketInfo.movieInfo.movie_Name}
              </h3>
              <p className="text-white text-opacity-90 text-sm">
                {formatDate(ticketInfo.showtimeInfo.showDate)} | {formatTime(ticketInfo.showtimeInfo.startTime)} - {formatTime(ticketInfo.showtimeInfo.endTime)}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${
              ticketInfo.is_Checked_In 
                ? 'bg-white text-green-700' 
                : 'bg-white text-amber-700'
            }`}>
              {ticketInfo.is_Checked_In ? 'ĐÃ CHECK-IN' : 'CHƯA CHECK-IN'}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Ticket Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <QrCode className="h-4 w-4 mr-1" /> Mã vé
                  </h4>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-mono text-lg font-semibold tracking-wider">{ticketInfo.ticket_Code}</p>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" /> Phòng & Ghế
                  </h4>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-semibold text-lg">{ticketInfo.cinemaRoomInfo.room_Name}</p>
                    <div className="flex items-center mt-1">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">
                        Ghế: {ticketInfo.seatInfo.seatLabel}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({ticketInfo.seatInfo.seat_Type})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-1" /> Thông tin khách hàng
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">{ticketInfo.customerInfo.full_Name}</p>
                    <p className="text-sm text-gray-600">{ticketInfo.customerInfo.email}</p>
                    <p className="text-sm text-gray-600">{ticketInfo.customerInfo.phone_Number}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> Lịch chiếu
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">{formatDate(ticketInfo.showtimeInfo.showDate)}</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(ticketInfo.showtimeInfo.startTime)} - {formatTime(ticketInfo.showtimeInfo.endTime)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Thời lượng: {ticketInfo.movieInfo.duration} phút
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" /> Thông tin giá vé
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá gốc:</span>
                      <span>{ticketInfo.priceInfo.base_Price.toLocaleString('vi-VN')} đ</span>
                    </div>
                    {ticketInfo.priceInfo.discount_Amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá:</span>
                        <span>-{ticketInfo.priceInfo.discount_Amount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                      <span>Thành tiền:</span>
                      <span className="text-indigo-600">{ticketInfo.priceInfo.final_Price.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>

                {ticketInfo.is_Checked_In && ticketInfo.checkInTime && (
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> Thời gian check-in
                    </h4>
                    <div className="bg-green-50 border border-green-100 p-3 rounded-md">
                      <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        <p className="font-medium text-green-700">
                          {new Date(ticketInfo.checkInTime).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - QR Code and Check-in Button */}
            <div className="flex flex-col items-center justify-start space-y-4 border-l pl-6">
              <div className={`bg-white p-4 rounded-lg shadow-md border-2 ${
                ticketInfo.is_Checked_In ? 'border-green-400' : 'border-amber-400'
              }`}>
                {/* Fix: Use QRCodeSVG component instead of QRCode */}
                <QRCodeSVG 
                  value={`TICKET:${ticketInfo.ticket_Code}`} 
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Quét mã QR này tại quầy vé để check-in
              </p>
              
              {!ticketInfo.is_Checked_In ? (
                <button
                  onClick={handleCheckin}
                  disabled={isCheckinLoading}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center w-full shadow-md"
                >
                  {isCheckinLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Check className="h-5 w-5 mr-2" />
                  )}
                  Check-in ngay
                </button>
              ) : (
                <div className="mt-4 bg-green-100 text-green-800 px-6 py-3 rounded-lg flex items-center justify-center w-full">
                  <Check className="h-5 w-5 mr-2" />
                  Đã check-in thành công
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!ticketInfo && !isLoading && ticketCode && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="text-center py-12">
            <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium mb-2">Không tìm thấy thông tin vé</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Vui lòng kiểm tra lại mã vé và thử lại, hoặc liên hệ với bộ phận hỗ trợ nếu bạn gặp vấn đề
            </p>
          </div>
        </div>
      )}

      {!ticketInfo && !isLoading && !ticketCode && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="text-center py-12">
            <QrCode className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium mb-2">Nhập mã vé để bắt đầu</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Mã vé có thể tìm thấy trong email xác nhận hoặc trang lịch sử đặt vé
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInsTab;
