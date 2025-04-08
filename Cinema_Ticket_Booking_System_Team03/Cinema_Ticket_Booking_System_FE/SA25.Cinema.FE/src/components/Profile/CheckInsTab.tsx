import React, { useState, useEffect, useRef } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { 
  Loader2, QrCode, Check, X, Calendar, Clock, 
  MapPin, User, CreditCard, Search, AlertCircle, RefreshCw,
  Filter, ChevronDown, ChevronUp, Ticket, Film,
  ChevronLeft, ChevronRight, XCircle
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CheckInsTabProps {
  showAlert: (type: 'success' | 'error' | 'info', message: string) => void;
  apiBaseUrl: string;
  navigate: NavigateFunction;
}

interface MovieInfo {
  movie_id: number;
  movie_name: string;
  poster_url?: string;
}

interface ShowtimeInfo {
  showtime_id: number;
  show_date: string;
  start_time: string;
  room_name: string;
}

interface TicketInfo {
  ticket_id: number;
  ticket_code: string;
  booking_id: number;
  status: string | null;
  is_checked_in: boolean;
  final_price: number;
  booking_date: string;
  movie_info?: MovieInfo;
  showtime_info?: ShowtimeInfo;
  seat_info?: string;
  checkInTime?: string | null;
}

interface TicketResponse {
  success: boolean;
  total: number;
  tickets: {
    $values: TicketInfo[];
  };
}

const CheckInsTab: React.FC<CheckInsTabProps> = ({ showAlert, apiBaseUrl, navigate }) => {
  const [ticketCode, setTicketCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  const [allTickets, setAllTickets] = useState<TicketInfo[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketInfo[]>([]);
  const [isCheckinLoading, setIsCheckinLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [paginatedTickets, setPaginatedTickets] = useState<TicketInfo[]>([]);
  
  // Modal ref for handling clicks outside
  const modalRef = useRef<HTMLDivElement>(null);

  // Format date for better display
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  // Format time for better display
  const formatTime = (timeString: string): string => {
    return timeString?.substring(0, 5) || ''; // Get only HH:MM part
  };

  // Load all tickets on component mount
  useEffect(() => {
    fetchAllTickets();
    
    // Add click outside listener for modal
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowTicketModal(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Apply filters when filter settings change
  useEffect(() => {
    if (allTickets.length > 0) {
      applyFilters();
    }
  }, [allTickets, filterStatus, sortBy]);

  // Update paginated tickets when filtered tickets or pagination settings change
  useEffect(() => {
    updatePaginatedTickets();
  }, [filteredTickets, currentPage, itemsPerPage]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllTickets();
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
  }, [autoRefresh]);

  // Update paginated tickets
  const updatePaginatedTickets = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTickets.length);
    setPaginatedTickets(filteredTickets.slice(startIndex, endIndex));
  };

  // Apply filters and sorting
  const applyFilters = () => {
    let result = [...allTickets];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        result = result.filter(ticket => ticket.status !== 'Cancelled' && !ticket.is_checked_in);
      } else if (filterStatus === 'checked-in') {
        result = result.filter(ticket => ticket.is_checked_in);
      } else if (filterStatus === 'cancelled') {
        result = result.filter(ticket => ticket.status === 'Cancelled');
      }
    }
    
    // Apply sorting
    if (sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
    } else if (sortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.final_price - a.final_price);
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => a.final_price - b.final_price);
    }
    
    setFilteredTickets(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle changing page
  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle changing items per page
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Fetch all tickets
  const fetchAllTickets = async (): Promise<void> => {
    if (!isLoaded) {
      setIsLoading(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Vui lòng đăng nhập để tiếp tục');
        navigate('/login');
        return;
      }

      const response = await axios.get<TicketResponse>(
        `${apiBaseUrl}/Ticket/my-tickets`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.tickets.$values) {
        setAllTickets(response.data.tickets.$values);
        setIsLoaded(true);
      } else {
        showAlert('error', 'Không thể tải danh sách vé');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showAlert('error', 'Đã xảy ra lỗi khi tải danh sách vé');
    } finally {
      setIsLoading(false);
    }
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
        setShowTicketModal(true);
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
        setShowTicketModal(true);
      } else {
        showAlert('error', 'Không tìm thấy thông tin vé');
        setTicketInfo(null);
        setShowTicketModal(false);
      }
    } catch (error) {
      console.error('Error fetching ticket information:', error);
      showAlert('error', 'Không thể tải thông tin vé. Vui lòng thử lại sau.');
      setTicketInfo(null);
      setShowTicketModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-in process
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

      // In a real app, this would be a POST request to check in the ticket
      // For now, we'll simulate it
      setTimeout(() => {
        const updatedTicket = {
          ...ticketInfo,
          is_checked_in: true,
          checkInTime: new Date().toISOString()
        };
        
        setTicketInfo(updatedTicket);
        
        // Also update in the allTickets array
        const updatedAllTickets = allTickets.map(ticket => 
          ticket.ticket_code === ticketInfo.ticket_code 
            ? { ...ticket, is_checked_in: true } 
            : ticket
        );
        
        setAllTickets(updatedAllTickets);
        showAlert('success', 'Check-in thành công!');
        setIsCheckinLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error checking in:', error);
      showAlert('error', 'Đã xảy ra lỗi khi check-in. Vui lòng thử lại sau.');
      setIsCheckinLoading(false);
    }
  };

  // View ticket details
  const viewTicketDetails = (ticket: TicketInfo): void => {
    setTicketInfo(ticket);
    setTicketCode(ticket.ticket_code);
    setShowTicketModal(true);
  };

  // Close modal
  const closeModal = (): void => {
    setShowTicketModal(false);
  };

  // Get color classes based on ticket status
  const getStatusClasses = (ticket: TicketInfo): { 
    bg: string, 
    text: string, 
    statusText: string,
    icon: React.ReactNode
  } => {
    if (ticket.status === 'Cancelled') {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-rose-600',
        text: 'text-red-700',
        statusText: 'ĐÃ HỦY',
        icon: <X className="h-4 w-4 mr-1" />
      };
    }
    
    if (ticket.is_checked_in) {
      return {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-green-700',
        statusText: 'ĐÃ CHECK-IN',
        icon: <Check className="h-4 w-4 mr-1" />
      };
    }
    
    return {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
      text: 'text-amber-700',
      statusText: 'CHƯA CHECK-IN',
      icon: <Clock className="h-4 w-4 mr-1" />
    };
  };

  // Generate pagination
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    // Determine which page numbers to show
    let pageNumbers = [];
    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Show current page, 2 before and 2 after if possible
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + 4);
      
      pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );
      
      // Add first and last page with ellipsis if needed
      if (startPage > 1) {
        if (startPage > 2) {
          pageNumbers = [1, '...', ...pageNumbers];
        } else {
          pageNumbers = [1, ...pageNumbers];
        }
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers = [...pageNumbers, '...', totalPages];
        } else {
          pageNumbers = [...pageNumbers, totalPages];
        }
      }
    }

  return (
      <div className="flex flex-col sm:flex-row justify-between items-center border-t pt-4 mt-6">
        <div className="text-sm text-gray-600 mb-3 sm:mb-0">
          Hiển thị {filteredTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
          {Math.min(currentPage * itemsPerPage, filteredTickets.length)} 
          trong tổng số {filteredTickets.length} vé
        </div>
        
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Trang đầu"
          >
            <span className="text-xs">Đầu</span>
          </button>
          
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center">
            {pageNumbers.map((page, index) => 
              typeof page === 'number' ? (
                <button
                  key={index}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 mx-1 rounded-md ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="mx-1 text-gray-500">
                  {page}
                </span>
              )
            )}
          </div>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Trang sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
            aria-label="Trang cuối"
          >
            <span className="text-xs">Cuối</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <Ticket className="h-6 w-6 mr-2" />
            Vé xem phim của tôi
          </h1>
          <p className="opacity-90">
            Quản lý và theo dõi trạng thái vé xem phim của bạn
          </p>
        </div>
      </div>
      

      {/* Ticket History Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Film className="h-5 w-5 mr-2 text-indigo-600" />
              Danh sách vé của tôi
              {isLoaded && <span className="ml-2 text-sm text-gray-500">({filteredTickets.length} vé)</span>}
            </h2>
            
            <div className="flex items-center">
              <button 
                onClick={fetchAllTickets}
                className="mr-4 text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
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
          
          {/* Filters */}
          <div className="mb-4">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center text-gray-700 hover:text-indigo-600 text-sm font-medium mb-2"
            >
              <Filter className="h-4 w-4 mr-1" />
              Bộ lọc & Sắp xếp
              {filterOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </button>
            
            {filterOpen && (
              <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái vé</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Chưa check-in</option>
                    <option value="checked-in">Đã check-in</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp theo</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="date-desc">Ngày đặt (mới nhất)</option>
                    <option value="date-asc">Ngày đặt (cũ nhất)</option>
                    <option value="price-desc">Giá (cao đến thấp)</option>
                    <option value="price-asc">Giá (thấp đến cao)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vé mỗi trang</label>
                  <select 
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={5}>5 vé</option>
                    <option value={10}>10 vé</option>
                    <option value={20}>20 vé</option>
                    <option value={50}>50 vé</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {isLoading && !isLoaded ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : (
            <div id="ticketList">
            <div className="grid grid-cols-1 gap-4">
              {filteredTickets.length > 0 ? (
                  paginatedTickets.map((ticket, index) => {
                  const status = getStatusClasses(ticket);
                  
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                          ticketInfo?.ticket_code === ticket.ticket_code && showTicketModal ? 'ring-2 ring-indigo-500' : ''
                      }`}
                    >
                      <div className={`${status.bg} p-3 flex justify-between items-center`}>
                        <div>
                          <h3 className="font-semibold text-white">{ticket.movie_info?.movie_name || 'Phim không xác định'}</h3>
                          <p className="text-white text-opacity-90 text-sm">
                            {ticket.showtime_info ? (
                              <>
                                {formatDate(ticket.showtime_info.show_date)} | {formatTime(ticket.showtime_info.start_time)}
                              </>
                            ) : (
                              formatDate(ticket.booking_date)
                            )}
                          </p>
                        </div>
                        <div className={`bg-white px-3 py-1 rounded-full text-sm font-bold ${status.text} flex items-center`}>
                          {status.icon}
                          {status.statusText}
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-sm text-gray-500">Mã vé</p>
                          <p className="font-mono font-medium">{ticket.ticket_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ghế</p>
                          <p className="font-medium">{ticket.seat_info || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Giá vé</p>
                          <p className="font-medium">{ticket.final_price.toLocaleString('vi-VN')} đ</p>
                        </div>
                        <div className="col-span-3 mt-2 flex justify-end">
                          <button 
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                            onClick={() => viewTicketDetails(ticket)}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 text-lg font-medium mb-2">Không tìm thấy vé nào</p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Bạn chưa có vé nào hoặc không có vé nào phù hợp với bộ lọc hiện tại
                  </p>
                </div>
              )}
              </div>
              
              {/* Pagination */}
              {filteredTickets.length > 0 && renderPagination()}
            </div>
          )}
        </div>
      </div>

{/* Ticket Statistics */}
{isLoaded && allTickets.length > 0 && (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê vé</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-4 text-white shadow-md">
          <p className="text-white text-opacity-80 mb-1">Chưa check-in</p>
          <p className="text-3xl font-bold">
            {allTickets.filter(t => !t.is_checked_in && t.status !== 'Cancelled').length}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white shadow-md">
          <p className="text-white text-opacity-80 mb-1">Đã check-in</p>
          <p className="text-3xl font-bold">
            {allTickets.filter(t => t.is_checked_in).length}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-lg p-4 text-white shadow-md">
          <p className="text-white text-opacity-80 mb-1">Đã hủy</p>
          <p className="text-3xl font-bold">
            {allTickets.filter(t => t.status === 'Cancelled').length}
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{/* Upcoming Movies */}
{isLoaded && (
  <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-lg shadow-md overflow-hidden text-white">
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Film className="h-5 w-5 mr-2" />
        Hướng dẫn check-in
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
          <div className="bg-white text-indigo-700 h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl mb-3">1</div>
          <h3 className="font-semibold text-lg mb-2">Tìm mã vé</h3>
          <p className="text-white text-opacity-90">
            Kiểm tra email xác nhận hoặc trang danh sách vé để lấy mã vé của bạn
          </p>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
          <div className="bg-white text-indigo-700 h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl mb-3">2</div>
          <h3 className="font-semibold text-lg mb-2">Quét mã QR</h3>
          <p className="text-white text-opacity-90">
            Đưa mã QR trên vé của bạn cho nhân viên tại rạp để quét
          </p>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
          <div className="bg-white text-indigo-700 h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl mb-3">3</div>
          <h3 className="font-semibold text-lg mb-2">Tận hưởng phim</h3>
          <p className="text-white text-opacity-90">
            Sau khi check-in thành công, bạn có thể vào phòng chiếu để xem phim
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{/* Ticket Details Modal */}
{showTicketModal && ticketInfo && (
  <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50">
    <div 
      ref={modalRef}
      className="bg-white rounded-lg shadow-2xl overflow-hidden w-full max-w-4xl mx-4 my-8 animate-slideIn"
      style={{ maxHeight: 'calc(100vh - 64px)' }}
    >
      <div className={`p-4 flex justify-between items-center ${
            ticketInfo.is_checked_in 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : ticketInfo.status === 'Cancelled'
                ? 'bg-gradient-to-r from-red-500 to-rose-600'
            : 'bg-gradient-to-r from-amber-500 to-orange-600'
          }`}>
            <div>
              <h3 className="font-bold text-xl text-white">
                {ticketInfo.movie_info?.movie_name || 'Phim không xác định'}
              </h3>
              <p className="text-white text-opacity-90 text-sm">
                {ticketInfo.showtime_info ? (
                  <>
                    {formatDate(ticketInfo.showtime_info.show_date)} | {formatTime(ticketInfo.showtime_info.start_time)}
                  </>
                ) : (
                  formatDate(ticketInfo.booking_date)
                )}
              </p>
            </div>
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center ${
              ticketInfo.is_checked_in 
                ? 'bg-white text-green-700' 
                : ticketInfo.status === 'Cancelled'
                  ? 'bg-white text-red-700'
                : 'bg-white text-amber-700'
            }`}>
              {ticketInfo.is_checked_in ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  ĐÃ CHECK-IN
                </>
              ) : ticketInfo.status === 'Cancelled' ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  ĐÃ HỦY
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  CHƯA CHECK-IN
                </>
              )}
          </div>
          <button 
            onClick={closeModal} 
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <XCircle className="h-6 w-6" />
          </button>
            </div>
          </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {/* Left Column - Ticket Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <QrCode className="h-4 w-4 mr-1" /> Mã vé
                  </h4>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-mono text-lg font-semibold tracking-wider">{ticketInfo.ticket_code}</p>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" /> Phòng & Ghế
                  </h4>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-semibold text-lg">{ticketInfo.showtime_info?.room_name || 'Không xác định'}</p>
                    <div className="flex items-center mt-1">
                      <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">
                        Ghế: {ticketInfo.seat_info || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" /> Lịch chiếu
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">
                      {ticketInfo.showtime_info ? formatDate(ticketInfo.showtime_info.show_date) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {ticketInfo.showtime_info ? formatTime(ticketInfo.showtime_info.start_time) : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Phòng: {ticketInfo.showtime_info?.room_name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" /> Thông tin thanh toán
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Thành tiền:</span>
                      <span className="text-indigo-600">{ticketInfo.final_price.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ngày đặt: {formatDate(ticketInfo.booking_date)}
                    </p>
                  </div>
                </div>
              </div>

              {ticketInfo.is_checked_in && ticketInfo.checkInTime && (
                <div className="flex-1">
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
              
              {ticketInfo.status === 'Cancelled' && (
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> Trạng thái vé
                  </h4>
                  <div className="bg-red-50 border border-red-100 p-3 rounded-md">
                    <div className="flex items-center">
                      <X className="h-5 w-5 text-red-600 mr-2" />
                      <p className="font-medium text-red-700">
                        Vé đã bị hủy
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

                        {/* Right Column - QR Code and Check-in Button */}
        <div className="flex flex-col items-center justify-start space-y-4 md:border-l md:pl-6">
          <div className={`bg-white p-4 rounded-lg shadow-md border-2 ${
                ticketInfo.is_checked_in 
                  ? 'border-green-400' 
                  : ticketInfo.status === 'Cancelled'
                    ? 'border-red-400'
                : 'border-amber-400'
              }`}>
                <QRCodeSVG 
                  value={`TICKET:${ticketInfo.ticket_code}`} 
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Quét mã QR này tại quầy vé để check-in
              </p>
              
              {/* {!ticketInfo.is_checked_in && ticketInfo.status !== 'Cancelled' ? (
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
              ) : ticketInfo.is_checked_in ? (
                <div className="mt-4 bg-green-100 text-green-800 px-6 py-3 rounded-lg flex items-center justify-center w-full">
                  <Check className="h-5 w-5 mr-2" />
                  Đã check-in thành công
                </div>
              ) : (
                <div className="mt-4 bg-red-100 text-red-800 px-6 py-3 rounded-lg flex items-center justify-center w-full">
                  <X className="h-5 w-5 mr-2" />
                  Vé đã bị hủy
                </div>
              )} */}
              
              {ticketInfo.movie_info?.poster_url && (
                <div className="mt-4 w-full">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 text-center">Poster phim</h4>
                  <div className="rounded-lg overflow-hidden shadow-md">
                    <img 
                      src={ticketInfo.movie_info.poster_url} 
                      alt={ticketInfo.movie_info.movie_name}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              )}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t flex justify-end">
        <button
          onClick={closeModal}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-lg transition-colors"
        >
          Đóng
        </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - No ticket found */}
{!ticketInfo && !isLoading && ticketCode && !showTicketModal && (
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

      {/* Initial Empty State */}
{!ticketInfo && !isLoading && !ticketCode && !isLoaded && !showTicketModal && (
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