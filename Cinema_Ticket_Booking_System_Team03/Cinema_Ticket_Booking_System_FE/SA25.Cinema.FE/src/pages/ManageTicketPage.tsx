import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Search, RefreshCw, ChevronLeft, ChevronRight, Filter, Ticket } from 'lucide-react';

const TicketManagementPage = ({ apiBaseUrl, showAlert }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, pageSize, filterStatus]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      let url = `${apiBaseUrl}/api/Ticket/all`;
      
      const response = await axios.get(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setTickets(response.data.tickets.$values);
        setTotalPages(response.data.total_pages);
      } else {
        showAlert('error', 'Không thể tải dữ liệu vé.');
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      showAlert('error', 'Đã xảy ra lỗi khi tải dữ liệu vé.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleCheckIn = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      await axios.put(`${apiBaseUrl}/api/Ticket/checkin/${ticketId}`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state to reflect the change
      setTickets(tickets.map(ticket => 
        ticket.ticket_id === ticketId ? { ...ticket, is_checked_in: true } : ticket
      ));

      showAlert('success', 'Vé đã được check-in thành công!');
    } catch (error) {
      console.error("Error checking in ticket:", error);
      showAlert('error', 'Đã xảy ra lỗi khi check-in vé.');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTickets();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const filteredTickets = searchTerm 
    ? tickets.filter(ticket => 
        ticket.ticket_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.booking_id.toString().includes(searchTerm)
      )
    : tickets;

  const getStatusColor = (status) => {
    if (status === 'Active') return 'text-green-600';
    if (status === 'Cancelled') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-700 to-purple-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản Lý Check-in Vé</h1>
            <p className="text-indigo-100 mt-1">Quản lý và kiểm soát trạng thái check-in của vé</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
              Tổng số: {tickets.length} / {totalPages * pageSize}
            </span>
            <button 
              onClick={handleRefresh} 
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo mã vé hoặc mã đặt chỗ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <button 
                type="submit"
                className="absolute right-2 top-1.5 bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="checked-in">Đã check-in</option>
                <option value="not-checked-in">Chưa check-in</option>
                <option value="active">Đang hoạt động</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã vé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đặt chỗ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.ticket_id} 
                    className={`${
                      ticket.is_checked_in 
                        ? 'bg-green-50' 
                        : ticket.status === 'Cancelled' 
                          ? 'bg-red-50' 
                          : ''
                    } hover:bg-gray-50 transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Ticket className="h-5 w-5 text-indigo-500 mr-2" />
                        <span className="font-medium">{ticket.ticket_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                        #{ticket.booking_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} bg-opacity-10`}>
                        {ticket.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.is_checked_in ? (
                        <span className="inline-flex items-center text-green-600">
                          <Check className="h-5 w-5 mr-1" />
                          Đã check-in
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-600">
                          <X className="h-5 w-5 mr-1" />
                          Chưa check-in
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleCheckIn(ticket.ticket_id)}
                        disabled={ticket.is_checked_in || ticket.status === 'Cancelled'}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          ticket.is_checked_in || ticket.status === 'Cancelled'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } transition-colors`}
                      >
                        {ticket.is_checked_in ? 'Đã xác nhận' : 'Check-in'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <img 
                src="/empty-state.svg" 
                alt="No tickets found" 
                className="w-40 h-40 mb-4 opacity-50"
              />
              <h3 className="text-lg font-medium text-gray-900">Không tìm thấy vé nào</h3>
              <p className="text-gray-500 mt-1">Hãy thử tìm kiếm với từ khóa khác</p>
            </div>
          )}

          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{filteredTickets.length}</span> trong số{' '}
              <span className="font-medium">{totalPages * pageSize}</span> vé
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = currentPage <= 3
                    ? i + 1
                    : currentPage >= totalPages - 2
                      ? totalPages - 4 + i
                      : currentPage - 2 + i;
                  
                  if (pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 mx-1 rounded-md ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper component for the dropdown icon
const ChevronDown = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default TicketManagementPage;
