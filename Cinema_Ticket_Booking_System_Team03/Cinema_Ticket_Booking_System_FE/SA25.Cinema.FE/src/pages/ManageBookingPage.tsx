import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { Tab } from '@headlessui/react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiDownload,
  FiClock,
  FiCalendar,
  FiUser,
  FiChevronDown,
  FiEye,
  FiXCircle,
  FiEdit,
  FiCheckCircle,
  FiAlertCircle,
  FiPrinter
} from 'react-icons/fi';

// Types
interface Booking {
  booking_ID: string;
  user_ID: string;
  showtime_ID: string;
  booking_Date: string;
  total_Amount: number;
  status: string;
  payment_Method: string;
  payment_Date: string;
  cancellation_Date?: string;
  cancellation_Reason?: string;
  seats?: string;
  showtime: {
    showtime_ID: string;
    movie: {
      movie_ID: string;
      movie_Name: string;
      duration: number;
      poster_URL: string;
    };
    room: {
      room_ID: string;
      room_Name: string;
      room_Type: string;
    };
    show_Date: string;
    start_Time: string;
  };
}

interface BookingListItem {
  booking_ID: string;
  user_ID: string;
  customerName: string;
  customerPhone: string;
  movieName: string;
  showDate: string;
  startTime: string;
  roomName: string;
  status: string;
  amount: number;
  paymentMethod: string;
  seats?: string;
}

interface BookingFilters {
  customerName: string;
  customerContact: string;
  movieName: string;
  startDate: string;
  endDate: string;
  status: string;
  paymentMethod: string;
}

// API Service
const BookingService = {
  getAllBookings: async (): Promise<Booking[]> => {
    try {
      const response = await axios.get('/api/Booking');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },
  
  getBookingById: async (id: string): Promise<Booking> => {
    try {
      const response = await axios.get(`/api/Booking/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching booking ${id}:`, error);
      throw error;
    }
  },
  
  searchBookings: async (query: string): Promise<Booking[]> => {
    try {
      const response = await axios.get(`/api/Booking/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching bookings:', error);
      throw error;
    }
  },
  
  cancelBooking: async (id: string, reason: string): Promise<any> => {
    try {
      const response = await axios.put(`/api/Booking/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling booking ${id}:`, error);
      throw error;
    }
  },
  
  updatePayment: async (id: string, paymentData: any): Promise<any> => {
    try {
      const response = await axios.put(`/api/Booking/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating payment for booking ${id}:`, error);
      throw error;
    }
  },
  
  exportBookings: async (format: string): Promise<Blob> => {
    try {
      const response = await axios.get(`/api/Booking/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting bookings:', error);
      throw error;
    }
  }
};

// Helper Components
const BookingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant = 'default';
  let label = 'Không xác định';
  
  switch (status) {
    case 'Confirmed':
      variant = 'success';
      label = 'Đã xác nhận';
      break;
    case 'Cancelled':
      variant = 'error';
      label = 'Đã hủy';
      break;
    case 'Completed':
      variant = 'info';
      label = 'Đã hoàn thành';
      break;
    case 'Refunded':
      variant = 'warning';
      label = 'Đã hoàn tiền';
      break;
    case 'Pending':
      variant = 'secondary';
      label = 'Đang chờ';
      break;
  }
  
  return <Badge variant={variant as any}>{label}</Badge>;
};

const PaymentMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  let variant = 'default';
  let label = method;
  
  switch (method) {
    case 'Cash':
      variant = 'success';
      label = 'Tiền mặt';
      break;
    case 'Card':
      variant = 'info';
      label = 'Thẻ';
      break;
    case 'Online':
      variant = 'purple';
      label = 'Thanh toán online';
      break;
    case 'Payos':
      variant = 'secondary';
      label = 'PayOS';
      break;
  }
  
  return <Badge variant={variant as any}>{label}</Badge>;
};

// Utility functions
const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
  } catch (error) {
    return 'Không xác định';
  }
};

const formatTime = (timeString: string): string => {
  try {
    // Handle both full datetime strings and time-only strings
    if (timeString.includes('T')) {
      return format(new Date(timeString), 'HH:mm', { locale: vi });
    } else {
      // Assuming time format like "14:30:00"
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    }
  } catch (error) {
    return 'Không xác định';
  }
};

const downloadCSV = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
  const excelBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
};

const downloadExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

// Main Component
const ManageTicketPage: React.FC = () => {
  // State
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BookingListItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [newTicketStatus, setNewTicketStatus] = useState<string>('');
  const [filters, setFilters] = useState<BookingFilters>({
    customerName: '',
    customerContact: '',
    movieName: '',
    startDate: '',
    endDate: '',
    status: '',
    paymentMethod: ''
  });
  
  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);
  
  // Fetch booking details when a booking is selected
  useEffect(() => {
    if (selectedBookingId) {
      fetchBookingDetails(selectedBookingId);
    }
  }, [selectedBookingId]);
  
  // Fetch all bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await BookingService.getAllBookings();
      
      // Transform data for display
      const transformedData: BookingListItem[] = data.map(booking => ({
        booking_ID: booking.booking_ID,
        user_ID: booking.user_ID,
        customerName: booking.user_ID, // In a real app, you'd fetch user details
        customerPhone: 'N/A', // In a real app, you'd fetch user details
        movieName: booking.showtime.movie.movie_Name,
        showDate: booking.showtime.show_Date,
        startTime: booking.showtime.start_Time,
        roomName: booking.showtime.room.room_Name,
        status: booking.status,
        amount: booking.total_Amount,
        paymentMethod: booking.payment_Method,
        seats: booking.seats
      }));
      
      setBookings(transformedData);
    } catch (err) {
      setError('Không thể tải dữ liệu đặt vé. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch booking details by ID
  const fetchBookingDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await BookingService.getBookingById(id);
      setSelectedBookingDetails(data);
      setIsDetailModalOpen(true);
    } catch (err) {
      setError('Không thể tải chi tiết đặt vé. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await BookingService.searchBookings(searchQuery);
      
      // Transform data for display
      const transformedData: BookingListItem[] = data.map(booking => ({
        booking_ID: booking.booking_ID,
        user_ID: booking.user_ID,
        customerName: booking.user_ID, // In a real app, you'd fetch user details
        customerPhone: 'N/A', // In a real app, you'd fetch user details
        movieName: booking.showtime.movie.movie_Name,
        showDate: booking.showtime.show_Date,
        startTime: booking.showtime.start_Time,
        roomName: booking.showtime.room.room_Name,
        status: booking.status,
        amount: booking.total_Amount,
        paymentMethod: booking.payment_Method,
        seats: booking.seats
      }));
      
      setSearchResults(transformedData);
    } catch (err) {
      setError('Không thể tìm kiếm đặt vé. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle booking selection
  const handleSelectBooking = (id: string) => {
    setSelectedBookingId(id);
  };
  
  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedBookingId || !cancellationReason.trim()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await BookingService.cancelBooking(selectedBookingId, cancellationReason);
      
      // Refresh bookings
      await fetchBookings();
      
      // Close modals
      setIsCancelModalOpen(false);
      setIsDetailModalOpen(false);
      setCancellationReason('');
      
      // Show success message (in a real app, you'd use a toast/notification system)
      alert('Đặt vé đã được hủy thành công.');
    } catch (err) {
      setError('Không thể hủy đặt vé. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle ticket status update
  const handleUpdateTicketStatus = async () => {
    if (!selectedBookingId || !newTicketStatus) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Using the payment endpoint to update status since there's no dedicated status update endpoint
      await BookingService.updatePayment(selectedBookingId, { status: newTicketStatus });
      
      // Refresh bookings
      await fetchBookings();
      
      // Close modals
      setIsStatusUpdateModalOpen(false);
      setIsDetailModalOpen(false);
      setNewTicketStatus('');
      
      // Show success message (in a real app, you'd use a toast/notification system)
      alert('Trạng thái đặt vé đã được cập nhật thành công.');
    } catch (err) {
      setError('Không thể cập nhật trạng thái đặt vé. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (field: keyof BookingFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      customerName: '',
      customerContact: '',
      movieName: '',
      startDate: '',
      endDate: '',
      status: '',
      paymentMethod: ''
    });
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'excel') => {
    setLoading(true);
    
    try {
      const data = searchResults.length > 0 ? searchResults : bookings;
      
      if (format === 'csv') {
        downloadCSV(data, `bookings-export-${new Date().toISOString().split('T')[0]}`);
      } else {
        downloadExcel(data, `bookings-export-${new Date().toISOString().split('T')[0]}`);
      }
    } catch (err) {
      setError('Không thể xuất dữ liệu. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter bookings based on filters
  const filteredBookings = useMemo(() => {
    let result = searchResults.length > 0 ? searchResults : bookings;
    
    if (filters.customerName) {
      result = result.filter(booking => 
        booking.customerName.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }
    
    if (filters.customerContact) {
      result = result.filter(booking => 
        booking.customerPhone.toLowerCase().includes(filters.customerContact.toLowerCase())
      );
    }
    
    if (filters.movieName) {
      result = result.filter(booking => 
        booking.movieName.toLowerCase().includes(filters.movieName.toLowerCase())
      );
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(booking => {
        const bookingDate = new Date(booking.showDate);
        return bookingDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      result = result.filter(booking => {
        const bookingDate = new Date(booking.showDate);
        return bookingDate <= endDate;
      });
    }
    
    if (filters.status) {
      result = result.filter(booking => booking.status === filters.status);
    }
    
    if (filters.paymentMethod) {
      result = result.filter(booking => booking.paymentMethod === filters.paymentMethod);
    }
    
    return result;
  }, [bookings, searchResults, filters]);
  
  // Paginate results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đặt vé</h1>
          <p className="text-gray-500 mt-1">Quản lý tất cả các đặt vé trong hệ thống</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button
            variant="outline"
            icon={<FiDownload />}
            onClick={() => handleExport('csv')}
          >
            Xuất CSV
          </Button>
          <Button
            variant="outline"
            icon={<FiDownload />}
            onClick={() => handleExport('excel')}
          >
            Xuất Excel
          </Button>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng, email, số điện thoại, mã đặt vé..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSearch}
            >
              Tìm kiếm
            </Button>
            
            <Button
              variant={isAdvancedFilterOpen ? 'secondary' : 'outline'}
              icon={<FiFilter />}
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
            >
              Bộ lọc
            </Button>
            
            <div className="hidden md:flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                onClick={() => setViewMode('list')}
              >
                <FiList />
              </button>
              <button
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                onClick={() => setViewMode('grid')}
              >
                <FiGrid />
              </button>
            </div>
          </div>
        </div>
        
        {/* Advanced filter panel */}
        <AnimatePresence>
          {isAdvancedFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Customer name filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên khách hàng
                    </label>
                    <Input
                      type="text"
                      placeholder="Nhập tên khách hàng"
                      value={filters.customerName}
                      onChange={(e) => handleFilterChange('customerName', e.target.value)}
                    />
                  </div>
                  
                  {/* Customer contact filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại/Email
                    </label>
                    <Input
                      type="text"
                      placeholder="Nhập số điện thoại hoặc email"
                      value={filters.customerContact}
                      onChange={(e) => handleFilterChange('customerContact', e.target.value)}
                    />
                  </div>
                  
                  {/* Movie name filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên phim
                    </label>
                    <Input
                      type="text"
                      placeholder="Nhập tên phim"
                      value={filters.movieName}
                      onChange={(e) => handleFilterChange('movieName', e.target.value)}
                    />
                  </div>
                  
                  {/* Date range filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Từ ngày
                    </label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đến ngày
                    </label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                  
                  {/* Status filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="Confirmed">Đã xác nhận</option>
                      <option value="Cancelled">Đã hủy</option>
                      <option value="Completed">Đã hoàn thành</option>
                      <option value="Refunded">Đã hoàn tiền</option>
                    </Select>
                  </div>
                  
                  {/* Payment method filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phương thức thanh toán
                    </label>
                    <Select
                      value={filters.paymentMethod}
                      onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                      className="w-full"
                    >
                      <option value="">Tất cả phương thức</option>
                      <option value="Cash">Tiền mặt</option>
                      <option value="Card">Thẻ</option>
                      <option value="Online">Thanh toán online</option>
                      <option value="Payos">PayOS</option>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                  >
                    Đặt lại
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsAdvancedFilterOpen(false)}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Results count and pagination controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="text-sm text-gray-600 mb-2 md:mb-0">
          Hiển thị {filteredBookings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredBookings.length)} trên {filteredBookings.length} kết quả
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Hiển thị:</span>
          <Select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-20"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* No results */}
      {!loading && !error && paginatedResults.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Không tìm thấy kết quả</h3>
          <p className="mt-1 text-gray-500">
            Không có đơn đặt vé nào phù hợp với tiêu chí tìm kiếm.
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      )}
      
      {/* Results - List view */}
      {!loading && !error && paginatedResults.length > 0 && viewMode === 'list' && (
        <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đặt vé
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phim
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày chiếu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giờ chiếu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phòng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedResults.map((booking) => (
                <tr key={booking.booking_ID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.booking_ID}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.movieName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(booking.showDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(booking.startTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.roomName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectBooking(booking.booking_ID)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Xem chi tiết"
                      >
                        <FiEye size={18} />
                      </button>
                      
                      {booking.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            setSelectedBookingId(booking.booking_ID);
                            setIsCancelModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Hủy đặt vé"
                        >
                          <FiXCircle size={18} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedBookingId(booking.booking_ID);
                          setIsStatusUpdateModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Cập nhật trạng thái"
                      >
                        <FiEdit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Results - Grid view */}
      {!loading && !error && paginatedResults.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedResults.map((booking) => (
            <Card
              key={booking.booking_ID}
              className="cursor-pointer"
              onClick={() => handleSelectBooking(booking.booking_ID)}
            >
              <div className="flex justify-between">
                <h3 className="text-gray-900 font-medium">#{booking.booking_ID}</h3>
                <BookingStatusBadge status={booking.status} />
              </div>
              
              <div className="mt-2">
                <h4 className="text-gray-900 font-bold">{booking.movieName}</h4>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <FiCalendar className="mr-1" />
                  <span>{formatDate(booking.showDate)}</span>
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <FiClock className="mr-1" />
                  <span>{formatTime(booking.startTime)} - {booking.roomName}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiUser className="mr-1" />
                    <span>{booking.customerName}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.amount)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && !error && filteredBookings.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredBookings.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      
      {/* Booking Detail Modal */}
      {isDetailModalOpen && selectedBookingDetails && (
        <Dialog
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl z-10">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <Dialog.Title className="text-lg font-medium">
                  Chi tiết đặt vé #{selectedBookingDetails.booking_ID}
                </Dialog.Title>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiXCircle size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Movie poster and info */}
                  <div className="w-full md:w-1/3">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-200">
                      {selectedBookingDetails.showtime.movie.poster_URL ? (
                        <img
                          src={selectedBookingDetails.showtime.movie.poster_URL}
                          alt={selectedBookingDetails.showtime.movie.movie_Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No poster
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedBookingDetails.showtime.movie.movie_Name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Thời lượng: {selectedBookingDetails.showtime.movie.duration} phút
                      </p>
                    </div>
                  </div>
                  
                  {/* Booking details */}
                  <div className="w-full md:w-2/3">
                    <Tab.Group>
                      <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                        <Tab
                          className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                            ${
                              selected
                                ? 'bg-white text-indigo-600 shadow'
                                : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
                            }`
                          }
                        >
                          Thông tin đặt vé
                        </Tab>
                        <Tab
                          className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                            ${
                              selected
                                ? 'bg-white text-indigo-600 shadow'
                                : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-700'
                            }`
                          }
                        >
                          Thông tin khách hàng
                        </Tab>
                      </Tab.List>
                      <Tab.Panels className="mt-4">
                        <Tab.Panel className="rounded-xl p-3">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Trạng thái:</span>
                              <BookingStatusBadge status={selectedBookingDetails.status} />
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Ngày đặt vé:</span>
                              <span>{formatDate(selectedBookingDetails.booking_Date)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Ngày chiếu:</span>
                              <span>{formatDate(selectedBookingDetails.showtime.show_Date)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Giờ chiếu:</span>
                              <span>{formatTime(selectedBookingDetails.showtime.start_Time)}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Phòng:</span>
                              <span>{selectedBookingDetails.showtime.room.room_Name} ({selectedBookingDetails.showtime.room.room_Type})</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Ghế:</span>
                              <span>{selectedBookingDetails.seats || 'N/A'}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Phương thức thanh toán:</span>
                              <PaymentMethodBadge method={selectedBookingDetails.payment_Method} />
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Ngày thanh toán:</span>
                              <span>{selectedBookingDetails.payment_Date ? formatDate(selectedBookingDetails.payment_Date) : 'N/A'}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Tổng tiền:</span>
                              <span className="font-medium text-gray-900">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBookingDetails.total_Amount)}
                              </span>
                            </div>
                            
                            {selectedBookingDetails.status === 'Cancelled' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Ngày hủy:</span>
                                  <span>{selectedBookingDetails.cancellation_Date ? formatDate(selectedBookingDetails.cancellation_Date) : 'N/A'}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Lý do hủy:</span>
                                  <span>{selectedBookingDetails.cancellation_Reason || 'N/A'}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </Tab.Panel>
                        
                        <Tab.Panel className="rounded-xl p-3">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-500">ID khách hàng:</span>
                              <span>{selectedBookingDetails.user_ID}</span>
                            </div>
                            
                            {/* In a real app, you would display more user details here */}
                            <div className="flex justify-between">
                              <span className="text-gray-500">Tên khách hàng:</span>
                              <span>{selectedBookingDetails.user_ID}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Email:</span>
                              <span>N/A</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-500">Số điện thoại:</span>
                              <span>N/A</span>
                            </div>
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsDetailModalOpen(false)}
                        >
                          Đóng
                        </Button>
                        
                        <Button
                          variant="outline"
                          icon={<FiPrinter />}
                          onClick={() => window.print()}
                        >
                          In vé
                        </Button>
                        
                        {selectedBookingDetails.status !== 'Cancelled' && (
                          <>
                            <Button
                              variant="danger"
                              icon={<FiXCircle />}
                              onClick={() => {
                                setIsDetailModalOpen(false);
                                setIsCancelModalOpen(true);
                              }}
                            >
                              Hủy đặt vé
                            </Button>
                            
                            <Button
                              variant="primary"
                              icon={<FiEdit />}
                              onClick={() => {
                                setIsDetailModalOpen(false);
                                setIsStatusUpdateModalOpen(true);
                              }}
                            >
                              Cập nhật trạng thái
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      
      {/* Cancel Booking Modal */}
      {isCancelModalOpen && (
        <Dialog
          open={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <Dialog.Title className="text-lg font-medium">
                  Hủy đặt vé
                </Dialog.Title>
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiXCircle size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-center mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <FiAlertCircle className="text-yellow-500 mr-2" size={20} />
                  <p className="text-yellow-700 text-sm">
                    Việc hủy đặt vé sẽ không thể hoàn tác. Vui lòng xác nhận hành động này.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do hủy đặt vé
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Nhập lý do hủy đặt vé..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCancelModalOpen(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="danger"
                    icon={<FiXCircle />}
                    onClick={handleCancelBooking}
                    disabled={!cancellationReason.trim()}
                  >
                    Xác nhận hủy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      
      {/* Update Status Modal */}
      {isStatusUpdateModalOpen && selectedBookingDetails && (
        <Dialog
          open={isStatusUpdateModalOpen}
          onClose={() => setIsStatusUpdateModalOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <Dialog.Title className="text-lg font-medium">
                  Cập nhật trạng thái đặt vé
                </Dialog.Title>
                <button
                  onClick={() => setIsStatusUpdateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiXCircle size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-gray-900 font-medium mb-2">
                    Thay đổi trạng thái đặt vé #{selectedBookingDetails.booking_ID}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Trạng thái hiện tại: <span className="font-medium">{selectedBookingDetails.status}</span>
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái mới
                  </label>
                  <Select
                    value={newTicketStatus}
                    onChange={(e) => setNewTicketStatus(e.target.value)}
                    className="w-full"
                  >
                    <option value="">Chọn trạng thái</option>
                    <option value="Confirmed">Đã xác nhận</option>
                    <option value="Completed">Đã hoàn thành</option>
                    <option value="Refunded">Đã hoàn tiền</option>
                  </Select>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsStatusUpdateModalOpen(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="primary"
                    icon={<FiCheckCircle />}
                    onClick={handleUpdateTicketStatus}
                    disabled={!newTicketStatus}
                  >
                    Cập nhật
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

// UI Components (simplified for brevity)
const Button: React.FC<{
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ variant = 'primary', icon, className = '', onClick, disabled = false, children }) => {
  const baseClasses = "inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "border-transparent text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
    outline: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    success: "border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500"
  };
  
  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

const Input: React.FC<{
  type: string;
  placeholder?: string;
  className?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ type, placeholder, className = '', value, onChange }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
      value={value}
      onChange={onChange}
    />
  );
};

const Select: React.FC<{
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  children: React.ReactNode;
}> = ({ value, onChange, className = '', children }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
    >
      {children}
    </select>
  );
};

const Badge: React.FC<{
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'purple';
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ variant = 'default', icon, children }) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    purple: "bg-purple-100 text-purple-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
      {children}
    </span>
  );
};

const Card: React.FC<{
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ className = '', onClick, children }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
      onClick={onClick}
    >
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

const Spinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
}> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 ${sizeClasses[size]}`}></div>
  );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  
  // Always show first and last page, and 1 page before and after current page
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      pages.push('...');
    }
  }
  
  return (
    <div className="flex justify-center">
      <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="sr-only">Previous</span>
          <FiChevronDown className="h-5 w-5 rotate-90" />
        </button>
        
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="sr-only">Next</span>
        <FiChevronDown className="h-5 w-5 -rotate-90" />
      </button>
    </nav>
  </div>
);
};

export default ManageTicketPage;
