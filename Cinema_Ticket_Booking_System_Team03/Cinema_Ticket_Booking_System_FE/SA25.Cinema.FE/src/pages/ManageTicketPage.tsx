import React, { useState, useEffect } from 'react';
import { 
  Loader2, QrCode, Check, X, Calendar, Clock, 
  Search, AlertCircle, RefreshCw, Filter, ChevronDown, 
  ChevronUp, Ticket, Film, User, CreditCard, MapPin,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { API_URL } from '../config/apiUrl';

interface TicketInfo {
  ticket_id: number;
  ticket_code: string;
  booking_id: number;
  is_checked_in: boolean;
  status: string | null;
  final_price?: number;
  booking_date?: string;
  movie_info?: {
    movie_id: number;
    movie_name: string;
    poster_url?: string;
  };
  showtime_info?: {
    showtime_id: number;
    show_date: string;
    start_time: string;
    room_name: string;
  };
  seat_info?: string;
  checkInTime?: string | null;
}

interface TicketResponse {
  success: boolean;
  total_records: number;
  tickets: {
    $values: TicketInfo[];
  };
}

const ManageTicketPage: React.FC = () => {
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<TicketInfo | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isCheckinLoading, setIsCheckinLoading] = useState<boolean>(false);
  const [selectedActionTicket, setSelectedActionTicket] = useState<TicketInfo | null>(null);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('id-desc');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [paginatedTickets, setPaginatedTickets] = useState<TicketInfo[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    checkedIn: 0,
    pending: 0,
    cancelled: 0
  });

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Apply filters when filter settings change
  useEffect(() => {
    if (tickets.length > 0) {
      applyFilters();
    }
  }, [tickets, filterStatus, sortBy, searchTerm]);

  // Update paginated tickets when filtered tickets or pagination settings change
  useEffect(() => {
    updatePaginatedTickets();
  }, [filteredTickets, currentPage, itemsPerPage]);

  // Fetch tickets from API
  const fetchTickets = async (): Promise<void> => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setAuthError('Authentication token not found. Please log in.');
        setIsLoading(false);
        return;
      }
      
      const response = await axios.get<TicketResponse>(`${API_URL}/Ticket/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.tickets.$values) {
        const ticketsData = response.data.tickets.$values;
        setTickets(ticketsData);
        
        // Calculate statistics
        setStats({
          total: ticketsData.length,
          active: ticketsData.filter(ticket => ticket.status === 'Active').length,
          checkedIn: ticketsData.filter(ticket => ticket.is_checked_in).length,
          pending: ticketsData.filter(ticket => ticket.status === null).length,
          cancelled: ticketsData.filter(ticket => ticket.status === 'Cancelled').length
        });
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAuthError('Authentication failed. Please log in again.');
      } else {
        setAuthError('Failed to load tickets. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  const applyFilters = () => {
    let result = [...tickets];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(ticket => 
        ticket.ticket_id.toString().includes(searchTerm) ||
        ticket.ticket_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.booking_id.toString().includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        result = result.filter(ticket => ticket.status === 'Active' && !ticket.is_checked_in);
      } else if (filterStatus === 'checked-in') {
        result = result.filter(ticket => ticket.is_checked_in);
      } else if (filterStatus === 'pending') {
        result = result.filter(ticket => ticket.status === null);
      } else if (filterStatus === 'cancelled') {
        result = result.filter(ticket => ticket.status === 'Cancelled');
      }
    }
    
    // Apply sorting
    if (sortBy === 'id-desc') {
      result.sort((a, b) => b.ticket_id - a.ticket_id);
    } else if (sortBy === 'id-asc') {
      result.sort((a, b) => a.ticket_id - b.ticket_id);
    } else if (sortBy === 'code-asc') {
      result.sort((a, b) => a.ticket_code.localeCompare(b.ticket_code));
    } else if (sortBy === 'code-desc') {
      result.sort((a, b) => b.ticket_code.localeCompare(a.ticket_code));
    }
    
    setFilteredTickets(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Update paginated tickets
  const updatePaginatedTickets = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTickets.length);
    setPaginatedTickets(filteredTickets.slice(startIndex, endIndex));
  };

  // Handle check-in process using the updated API endpoint
  const handleCheckin = async (ticket: TicketInfo): Promise<void> => {
    setIsCheckinLoading(true);
    setSelectedActionTicket(ticket);
    
    try {
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }
      
      // Send POST request to check in the ticket using the ticket_code
      const response = await axios.post(
        `${API_URL}/Ticket/check-in/${ticket.ticket_code}`,
        {}, // Empty body as we're just using path parameter
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        // Update the ticket in local state
        const updatedTicket = {
          ...ticket,
          is_checked_in: true,
          status: 'Checked In',
          checkInTime: new Date().toISOString()
        };
        
        // Update the tickets array with the new ticket data
        const updatedTickets = tickets.map(t => 
          t.ticket_id === ticket.ticket_id ? updatedTicket : t
        );
        
        setTickets(updatedTickets);
        
        // If we're in the modal view, update the selected ticket
        if (selectedTicket && selectedTicket.ticket_id === ticket.ticket_id) {
          setSelectedTicket(updatedTicket);
        }
        
        // Update stats
        setStats(prev => ({
          ...prev,
          checkedIn: prev.checkedIn + 1,
          active: prev.active - (ticket.status === 'Active' ? 1 : 0),
          pending: prev.pending - (ticket.status === null || ticket.status === 'Pending' ? 1 : 0)
        }));
        
        // Show success message
        alert('Check-in successful!');
      } else {
        throw new Error('Check-in failed');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setAuthError('Authentication failed. Please log in again.');
        } else if (error.response?.status === 404) {
          alert('Ticket not found.');
        } else {
          alert('Error checking in ticket. Please try again.');
        }
      } else {
        alert('Error checking in ticket. Please try again.');
      }
    } finally {
      setIsCheckinLoading(false);
      setSelectedActionTicket(null);
    }
  };

  // View ticket details
  const viewTicketDetails = (ticket: TicketInfo): void => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  // Get status classes for styling
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
        statusText: 'CANCELLED',
        icon: <X className="h-4 w-4 mr-1" />
      };
    }
    
    if (ticket.is_checked_in) {
      return {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
        text: 'text-green-700',
        statusText: 'CHECKED IN',
        icon: <Check className="h-4 w-4 mr-1" />
      };
    }
    
    if (ticket.status === null) {
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        text: 'text-blue-700',
        statusText: 'PENDING',
        icon: <Clock className="h-4 w-4 mr-1" />
      };
    }
    
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
        text: 'text-amber-700',
      statusText: 'ACTIVE',
      icon: <Ticket className="h-4 w-4 mr-1" />
      };
  };

  // Generate pagination controls
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredTickets.length)}
              </span>{" "}
              of <span className="font-medium">{filteredTickets.length}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
                onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1 ? 'cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNumber = i + 1;
                return (
            <button
                    key={i}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNumber
                        ? 'bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNumber}
            </button>
                );
              })}
          
          <button
                onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages ? 'cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden mb-6 p-6">
        <div className="text-white">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-red-500" />
            Quản lý kiểm soát vé
          </h1>
          <p className="text-gray-400 text-sm">
            Theo dõi và xác thực vé xem phim tại rạp
          </p>
        </div>
      </div>

      {/* Authentication Error Alert */}
      {authError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{authError}</p>
          </div>
          <button
            onClick={fetchTickets}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-medium">Tổng số vé</p>
              <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
            </div>
            <Ticket className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-medium">Đã check-in</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{stats.checkedIn}</p>
            </div>
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
        </div>

        <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-medium">Chưa check-in</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{stats.active}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
        </div>

        <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-medium">Đã hủy</p>
              <p className="text-2xl font-black text-red-400 mt-1">{stats.cancelled}</p>
            </div>
            <X className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

        {/* Filter and Search Bar */}
      <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã vé, tên phim hoặc mã đặt vé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>

          <button
            onClick={fetchTickets}
            className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl flex items-center justify-center text-sm font-semibold transition-all shadow-md shadow-red-500/20"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Làm mới
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            <Filter className="h-4 w-4 mr-1.5 text-red-400" />
            Bộ lọc & Sắp xếp
            {filterOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </button>

          {filterOpen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Trạng thái</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-[#161D2F] border border-white/10 text-white rounded-xl p-2 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Chưa check-in</option>
                  <option value="checked-in">Đã check-in</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Sắp xếp</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-[#161D2F] border border-white/10 text-white rounded-xl p-2 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="id-desc">Mã vé (Mới nhất)</option>
                  <option value="id-asc">Mã vé (Cũ nhất)</option>
                  <option value="code-desc">Mã Code (Z-A)</option>
                  <option value="code-asc">Mã Code (A-Z)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Số lượng hiển thị</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#161D2F] border border-white/10 text-white rounded-xl p-2 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value={5}>5 vé / trang</option>
                  <option value={10}>10 vé / trang</option>
                  <option value={20}>20 vé / trang</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
          
      {/* Tickets Table */}
      <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-white/5">
              <tr>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Mã vé ID
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Mã QR / Code
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Mã đơn đặt
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#161D2F]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                      <span>Đang tải danh sách vé...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Không tìm thấy vé nào
                  </td>
                </tr>
              ) : (
                paginatedTickets.map(ticket => {
                  const statusClasses = getStatusClasses(ticket);

                  return (
                    <tr key={ticket.ticket_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                        #{ticket.ticket_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-red-400" />
                          <span className="text-sm font-mono text-amber-400 font-bold">
                            {ticket.ticket_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        #{ticket.booking_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          ticket.is_checked_in
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ticket.status === 'Cancelled'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {ticket.is_checked_in ? 'ĐÃ CHECK-IN' : ticket.status === 'Cancelled' ? 'ĐÃ HỦY' : 'CHƯA CHECK-IN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowModal(true);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            Xem chi tiết
                          </button>
                          {!ticket.is_checked_in && ticket.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCheckin(ticket.ticket_id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                            >
                              {isCheckinLoading && selectedActionTicket?.ticket_id === ticket.ticket_id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Check In
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Ticket Detail Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-red-500" />
                  Chi tiết vé #{selectedTicket.ticket_id}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Thông tin vé</h3>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mã vé:</span>
                        <span className="font-bold text-white">#{selectedTicket.ticket_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mã code:</span>
                        <span className="font-mono font-bold text-amber-400">{selectedTicket.ticket_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mã đơn đặt:</span>
                        <span className="font-semibold text-white">#{selectedTicket.booking_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trạng thái:</span>
                        <span className="font-bold text-emerald-400">
                          {selectedTicket.is_checked_in ? 'Đã check-in' : selectedTicket.status === 'Cancelled' ? 'Đã hủy' : 'Chưa check-in'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedTicket.movie_info && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Thông tin phim</h3>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Film className="h-4 w-4 text-red-400" />
                          <span className="font-bold text-white text-base">{selectedTicket.movie_info.movie_name}</span>
                        </div>
                        {selectedTicket.movie_info.poster_url && (
                          <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden border border-white/10">
                            <img 
                              src={selectedTicket.movie_info.poster_url} 
                              alt={selectedTicket.movie_info.movie_name}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {selectedTicket.showtime_info && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Suất chiếu & Phòng</h3>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2.5 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span>{selectedTicket.showtime_info.show_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="h-4 w-4 text-red-400" />
                          <span>{selectedTicket.showtime_info.start_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="h-4 w-4 text-amber-400" />
                          <span>{selectedTicket.showtime_info.room_name}</span>
                        </div>
                        {selectedTicket.seat_info && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <User className="h-4 w-4 text-emerald-400" />
                            <span>Ghế: <strong className="text-amber-400 font-bold">{selectedTicket.seat_info}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Mã QR Check-in</h3>
                    <div className="bg-white rounded-xl p-4 flex flex-col items-center">
                      <QRCodeSVG 
                        value={selectedTicket.ticket_code} 
                        size={150}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                      <p className="mt-2 text-xs text-gray-600 font-mono font-semibold">{selectedTicket.ticket_code}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Đóng
                </button>
                {!selectedTicket.is_checked_in && selectedTicket.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      handleCheckin(selectedTicket);
                    }}
                    disabled={isCheckinLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" />
                    Xác nhận Check-in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTicketPage;

