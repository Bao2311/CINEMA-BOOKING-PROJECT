import React, { useState, useEffect } from 'react';
import { 
  Loader2, QrCode, Check, X, Calendar, Clock, 
  Search, AlertCircle, RefreshCw, Filter, ChevronDown, 
  ChevronUp, Ticket, Film, User, CreditCard, MapPin,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

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
      
      const response = await axios.get<TicketResponse>('https://localhost:7168/api/Ticket/all', {
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
        `https://localhost:7168/api/Ticket/check-in/${ticket.ticket_code}`,
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
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-lg shadow-xl overflow-hidden mb-6">
        <div className="p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <Ticket className="h-6 w-6 mr-2" />
            Ticket Check-in Management
          </h1>
          <p className="opacity-90">
            Track and manage movie ticket check-ins
          </p>
        </div>
      </div>

      {/* Authentication Error Alert */}
      {authError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>{authError}</p>
          </div>
          <div className="mt-2">
            <button 
              onClick={fetchTickets}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Tickets</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Ticket className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Checked In</p>
              <p className="text-2xl font-bold">{stats.checkedIn}</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-amber-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <Ticket className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </div>
            <X className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <input
                  type="text"
                placeholder="Search by ticket ID, code or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <button
              onClick={fetchTickets}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-5 w-5 mr-2" />
              )}
              Refresh
            </button>
          </div>
          
          <div className="mt-4">
                <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center text-gray-700 hover:text-indigo-600 text-sm font-medium"
                >
              <Filter className="h-4 w-4 mr-1" />
              Filters & Sorting
              {filterOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </button>
            
            {filterOpen && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="checked-in">Checked In</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="id-desc">Ticket ID (Desc)</option>
                    <option value="id-asc">Ticket ID (Asc)</option>
                    <option value="code-desc">Ticket Code (Desc)</option>
                    <option value="code-asc">Ticket Code (Asc)</option>
              </select>
                </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
              <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={5}>5 items</option>
                    <option value={10}>10 items</option>
                    <option value={20}>20 items</option>
                    <option value={50}>50 items</option>
              </select>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
          
      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2 text-indigo-500" />
                      <span>Loading tickets...</span>
            </div>
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              ) : (
                paginatedTickets.map(ticket => {
                  const statusClasses = getStatusClasses(ticket);
                    
                    return (
                    <tr key={ticket.ticket_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.ticket_id}
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <QrCode className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900 font-mono">
                            {ticket.ticket_code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ticket.booking_id}
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses.bg} text-white`}>
                          {statusClasses.icon}
                          {statusClasses.statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewTicketDetails(ticket)}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md transition-colors"
                          >
                            View Details
                          </button>
                          
                          {!ticket.is_checked_in && ticket.status !== 'Cancelled' && (
                            <button 
                              onClick={() => handleCheckin(ticket)}
                              disabled={isCheckinLoading && selectedActionTicket?.ticket_id === ticket.ticket_id}
                              className={`px-3 py-1 rounded-md transition-colors flex items-center ${
                                isCheckinLoading && selectedActionTicket?.ticket_id === ticket.ticket_id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 hover:bg-green-200 text-green-700'
                              }`}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Ticket Details
                </h2>
                              <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                              >
                  <X className="h-6 w-6" />
                              </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Ticket Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ticket ID:</span>
                        <span className="font-medium">{selectedTicket.ticket_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ticket Code:</span>
                        <span className="font-mono font-medium">{selectedTicket.ticket_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Booking ID:</span>
                        <span className="font-medium">{selectedTicket.booking_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${getStatusClasses(selectedTicket).text}`}>
                        {selectedTicket.is_checked_in ? 'Checked In' : 
                           selectedTicket.status === 'Cancelled' ? 'Cancelled' : 
                           selectedTicket.status === null ? 'Pending' : 'Active'}
                        </span>
                      </div>
                      {selectedTicket.final_price !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Price:</span>
                          <span className="font-medium">${selectedTicket.final_price.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedTicket.booking_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Booking Date:</span>
                          <span className="font-medium">
                            {new Date(selectedTicket.booking_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedTicket.is_checked_in && selectedTicket.checkInTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Check-in Time:</span>
                          <span className="font-medium">
                            {new Date(selectedTicket.checkInTime).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedTicket.movie_info && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Movie Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center space-x-3 mb-2">
                          <Film className="h-5 w-5 text-indigo-600" />
                          <span className="font-medium text-gray-900">{selectedTicket.movie_info.movie_name}</span>
                        </div>
                        {selectedTicket.movie_info.poster_url && (
                          <div className="mt-2">
                            <img 
                              src={selectedTicket.movie_info.poster_url} 
                              alt={selectedTicket.movie_info.movie_name}
                              className="h-40 object-cover rounded-md" 
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
                      <h3 className="text-lg font-semibold mb-2">Showtime Information</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            {new Date(selectedTicket.showtime_info.show_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{selectedTicket.showtime_info.start_time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{selectedTicket.showtime_info.room_name}</span>
                        </div>
                        {selectedTicket.seat_info && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">Seat: {selectedTicket.seat_info}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Ticket QR Code</h3>
                    <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                      <QRCodeSVG 
                        value={selectedTicket.ticket_code} 
                        size={180}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                      <p className="mt-2 text-sm text-gray-500">Scan to verify ticket</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                
                {!selectedTicket.is_checked_in && selectedTicket.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      handleCheckin(selectedTicket);
                      // We don't close the modal here to show the updated status after check-in
                    }}
                    disabled={isCheckinLoading}
                    className={`px-4 py-2 rounded-md text-white flex items-center ${
                      isCheckinLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isCheckinLoading && selectedActionTicket?.ticket_id === selectedTicket.ticket_id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Check In Ticket
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

