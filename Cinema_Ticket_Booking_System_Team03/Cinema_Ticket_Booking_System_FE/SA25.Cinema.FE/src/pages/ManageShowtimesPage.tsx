import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaCalendarAlt, FaClock, FaMoneyBillWave, FaFilm, FaDoorOpen, FaTrash, FaEdit, FaSave, FaTimes, FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface Showtime {
  showtime_ID: number;
  movie_ID: number;
  cinema_Room_ID: number;
  room_Name?: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
  capacity_Available?: number;
}

const ManageShowtimesPage = () => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [newShowtime, setNewShowtime] = useState<Showtime>({
    showtime_ID: 0,
    movie_ID: 0,
    cinema_Room_ID: 0,
    show_Date: '',
    start_Time: '',
    end_Time: '',
    price_Tier: 'Regular',
    base_Price: 0,
    status: 'active',
  });
  
  // State for editing
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // State cho các bộ lọc
  const [filters, setFilters] = useState({
    roomId: '',
    showDate: '',
    showTime: '',
    price: '',
    priceTier: ''
  });

  // THÊM STATE PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Hàm lọc dữ liệu
  const filteredShowtimes = showtimes.filter(showtime => {
    const matchRoomId = !filters.roomId || showtime.cinema_Room_ID.toString().includes(filters.roomId);
    const matchShowDate = !filters.showDate || showtime.show_Date.includes(filters.showDate);
    const matchShowTime = !filters.showTime ||
      showtime.start_Time.includes(filters.showTime) ||
      showtime.end_Time.includes(filters.showTime);
    const matchPrice = !filters.price || showtime.base_Price.toString().includes(filters.price);
    const matchPriceTier = !filters.priceTier ||
      showtime.price_Tier.toLowerCase().includes(filters.priceTier.toLowerCase());

    return matchRoomId && matchShowDate && matchShowTime && matchPrice && matchPriceTier;
  });

  // Tính toán cho phân trang
  const totalPages = Math.ceil(filteredShowtimes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShowtimes = filteredShowtimes.slice(indexOfFirstItem, indexOfLastItem);

  // Hàm fetch dữ liệu từ API
  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      const response = await fetch('https://localhost:7168/api/Showtimes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Lỗi server: ${response.status}`);
      }

      const data = await response.json();
      setShowtimes(data['$values'] || []);
      setError('');
    } catch (err) {
      setError('Lỗi khi tải dữ liệu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    if (!token) {
      setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      setLoading(false);
      return;
    }

    fetchShowtimes();
  }, [token]);

  const handleCreateShowtime = async () => {
    if (!token) {
      setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      return;
    }

    if (!newShowtime.movie_ID || !newShowtime.cinema_Room_ID ||
        !newShowtime.show_Date || !newShowtime.start_Time || !newShowtime.end_Time ||
        !newShowtime.price_Tier || !newShowtime.base_Price) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const showtimeToSend = {
        ...newShowtime,
        capacity_Available: 100,
        show_Date: new Date(newShowtime.show_Date).toISOString()
      };

      const response = await fetch('https://localhost:7168/api/Showtimes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(showtimeToSend),
      });

      if (response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      const responseText = await response.text();

      if (!response.ok) {
        if (response.status === 400) {
          try {
            const errorData = JSON.parse(responseText);
            if (errorData.errors) {
              const errorMessages = [];
              for (const field in errorData.errors) {
                errorMessages.push(`${field}: ${errorData.errors[field].join(', ')}`);
              }
              throw new Error(`Lỗi validation: ${errorMessages.join('; ')}`);
            }
          } catch (e) {
            throw new Error(`Lỗi validation: ${responseText}`);
          }
        }
        throw new Error(`Lỗi khi tạo showtime: ${response.status} - ${responseText}`);
      }

      // Reset form
      setNewShowtime({
        showtime_ID: 0,
        movie_ID: 0,
        cinema_Room_ID: 0,
        show_Date: '',
        start_Time: '',
        end_Time: '',
        price_Tier: 'Regular',
        base_Price: 0,
        status: 'active',
      });
      
      // Hiển thị thông báo thành công
      alert('Tạo lịch chiếu thành công!');
      
      // Refresh dữ liệu
      await fetchShowtimes();
    } catch (err) {
      setError('Lỗi khi tạo lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShowtime = (showtime: Showtime) => {
    // Format the date for datetime-local input
    const formattedShowtime = {
      ...showtime,
      show_Date: showtime.show_Date ? new Date(showtime.show_Date).toISOString().slice(0, 16) : ''
    };
    
    setEditingShowtime(formattedShowtime);
    setIsEditing(true);
    
    // Scroll to the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingShowtime(null);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!token || !editingShowtime) {
      setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare data for API
      const showtimeToUpdate = {
        ...editingShowtime,
        capacity_Available: editingShowtime.capacity_Available || 100,
        show_Date: new Date(editingShowtime.show_Date).toISOString()
      };

      const response = await fetch(`https://localhost:7168/api/Showtimes/${editingShowtime.showtime_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(showtimeToUpdate),
      });

      if (response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Lỗi khi cập nhật lịch chiếu: ${response.status}`);
      }

      // Reset editing state
      setIsEditing(false);
      setEditingShowtime(null);

      // Show success message
      alert('Cập nhật lịch chiếu thành công!');
      
      // Refresh dữ liệu
      await fetchShowtimes();
    } catch (err) {
      setError('Lỗi khi cập nhật lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHideShowtime = async (showtimeId) => {
    if (!token) {
      setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn ẩn lịch chiếu này không?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`https://localhost:7168/api/Showtimes/${showtimeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        },
      });

      if (response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Lỗi khi ẩn lịch chiếu: ${response.status}`);
      }

      // Show success message
      alert('Lịch chiếu đã được ẩn thành công!');
      
      // Refresh dữ liệu
      await fetchShowtimes();
    } catch (err) {
      setError('Lỗi khi ẩn lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm refresh dữ liệu thủ công
  const handleRefresh = () => {
    fetchShowtimes();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 10);
  };

  const getPriceTierColor = (tier) => {
    switch(tier) {
      case 'VIP': return 'text-yellow-600 bg-yellow-100';
      case 'Regular': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý lịch chiếu</h1>
            <p className="text-gray-600">Tạo và quản lý lịch chiếu phim cho rạp của bạn</p>
          </div>
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center"
            disabled={refreshing}
          >
            <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
        >
          <p className="font-medium">Lỗi</p>
          <p>{error}</p>
          {(error.includes('đăng nhập') || error.includes('phiên')) && (
            <button 
              onClick={handleLogin} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Đến trang đăng nhập
            </button>
          )}
        </motion.div>
      )}

      {!token ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded"
        >
          <p className="font-medium">Bạn chưa đăng nhập</p>
          <p>Vui lòng đăng nhập để quản lý lịch chiếu.</p>
          <button 
            onClick={handleLogin} 
            className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Đăng nhập
          </button>
        </motion.div>
      ) : (
        <>
          {/* Form chỉnh sửa lịch chiếu */}
          {isEditing && editingShowtime && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-blue-200"
            >
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FaEdit className="text-blue-600 text-xl" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">Chỉnh sửa lịch chiếu #{editingShowtime.showtime_ID}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaFilm className="mr-2 text-blue-500" />
                      ID Phim
                    </div>
                  </label>
                  <input 
                    type="number" 
                    placeholder="Nhập ID phim" 
                    value={editingShowtime.movie_ID || ''} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, movie_ID: parseInt(e.target.value) || 0 })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaDoorOpen className="mr-2 text-blue-500" />
                      ID Phòng chiếu
                    </div>
                  </label>
                  <input 
                    type="number" 
                    placeholder="Nhập ID phòng chiếu" 
                    value={editingShowtime.cinema_Room_ID || ''} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, cinema_Room_ID: parseInt(e.target.value) || 0 })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      Ngày chiếu
                    </div>
                  </label>
                  <input 
                    type="datetime-local" 
                    value={editingShowtime.show_Date} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, show_Date: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaClock className="mr-2 text-blue-500" />
                      Giờ bắt đầu
                    </div>
                  </label>
                  <input 
                    type="time" 
                    value={editingShowtime.start_Time} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, start_Time: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaClock className="mr-2 text-blue-500" />
                      Giờ kết thúc
                    </div>
                  </label>
                  <input 
                    type="time" 
                    value={editingShowtime.end_Time} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, end_Time: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaMoneyBillWave className="mr-2 text-blue-500" />
                      Loại giá
                    </div>
                  </label>
                  <select 
                    value={editingShowtime.price_Tier} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, price_Tier: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaMoneyBillWave className="mr-2 text-blue-500" />
                      Giá cơ bản (VND)
                    </div>
                  </label>
                  <input 
                    type="number" 
                    placeholder="Nhập giá cơ bản" 
                    value={editingShowtime.base_Price || ''} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, base_Price: parseInt(e.target.value) || 0 })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <FaClock className="mr-2 text-blue-500" />
                      Trạng thái
                    </div>
                  </label>
                  <select 
                    value={editingShowtime.status} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, status: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  >
                    {editingShowtime.status !== "Scheduled" && (
                      <option value={editingShowtime.status}>{editingShowtime.status}</option>
                    )}
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  onClick={handleCancelEdit} 
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors shadow-md flex items-center"
                >
                  <FaTimes className="mr-2" />
                  Hủy
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-md flex items-center"
                >
                  {loading ? 'Đang lưu...' : (
                    <>
                      <FaSave className="mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Form tạo lịch chiếu mới */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200"
          >
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaPlus className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800">Tạo lịch chiếu mới</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaFilm className="mr-2 text-blue-500" />
                    ID Phim
                  </div>
                </label>
                <input 
                  type="number" 
                  placeholder="Nhập ID phim" 
                  value={newShowtime.movie_ID || ''} 
                  onChange={(e) => setNewShowtime({ ...newShowtime, movie_ID: parseInt(e.target.value) || 0 })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaDoorOpen className="mr-2 text-blue-500" />
                    ID Phòng chiếu
                  </div>
                </label>
                <input 
                  type="number" 
                  placeholder="Nhập ID phòng chiếu" 
                  value={newShowtime.cinema_Room_ID || ''} 
                  onChange={(e) => setNewShowtime({ ...newShowtime, cinema_Room_ID: parseInt(e.target.value) || 0 })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-500" />
                    Ngày chiếu
                  </div>
                </label>
                <input 
                  type="datetime-local" 
                  value={newShowtime.show_Date} 
                  onChange={(e) => setNewShowtime({ ...newShowtime, show_Date: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-blue-500" />
                    Giờ bắt đầu
                  </div>
                </label>
                <input 
                  type="time" 
                  value={newShowtime.start_Time} 
                  onChange={(e) => setNewShowtime({ ...newShowtime, start_Time: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-blue-500" />
                    Giờ kết thúc
                  </div>
                </label>
                <input 
                  type="time" 
                  value={newShowtime.end_Time} 
                  onChange={(e) => setNewShowtime({ ...newShowtime, end_Time: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaMoneyBillWave className="mr-2 text-blue-500" />
                    Loại giá
                  </div>
                </label>
                <select 
                  value={newShowtime.price_Tier} 
                  onChange={(e) => setNewShowtime({ ...newShowtime, price_Tier: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  >
                  <option value="">Chọn loại giá</option>
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    <FaMoneyBillWave className="mr-2 text-blue-500" />
                    Giá cơ bản (VND)
                  </div>
                </label>
                <input 
                  type="number" 
                  placeholder="Nhập giá cơ bản" 
                  value={newShowtime.base_Price || ''} 
                  onChange={(e) => setNewShowtime({ ...newShowtime, base_Price: parseInt(e.target.value) || 0 })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleCreateShowtime} 
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md flex items-center"
              >
                {loading ? 'Đang tạo...' : (
                  <>
                    <FaPlus className="mr-2" />
                    Tạo lịch chiếu
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Bộ lọc */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Bộ lọc</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Phòng</label>
                <input 
                  type="text" 
                  placeholder="Lọc theo ID phòng" 
                  value={filters.roomId} 
                  onChange={(e) => setFilters({ ...filters, roomId: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày chiếu</label>
                <input 
                  type="text" 
                  placeholder="Lọc theo ngày" 
                  value={filters.showDate} 
                  onChange={(e) => setFilters({ ...filters, showDate: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ chiếu</label>
                <input 
                  type="text" 
                  placeholder="Lọc theo giờ" 
                  value={filters.showTime} 
                  onChange={(e) => setFilters({ ...filters, showTime: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
                <input 
                  type="text" 
                  placeholder="Lọc theo giá" 
                  value={filters.price} 
                  onChange={(e) => setFilters({ ...filters, price: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại giá</label>
                <input 
                  type="text" 
                  placeholder="Regular, VIP..." 
                  value={filters.priceTier} 
                  onChange={(e) => setFilters({ ...filters, priceTier: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                />
              </div>
            </div>
          </motion.div>

          {/* Danh sách lịch chiếu */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-lg border border-gray-200"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Danh sách lịch chiếu ({filteredShowtimes.length})</h3>
            
            {loading && !refreshing ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : currentShowtimes.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Không có lịch chiếu nào được tìm thấy.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Phim</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Phòng</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Ngày chiếu</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Giờ</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Loại giá</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Giá (VND)</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Trạng thái</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentShowtimes.map((showtime) => (
                      <tr key={showtime.showtime_ID} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{showtime.showtime_ID}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{showtime.movie_ID}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {showtime.room_Name || showtime.cinema_Room_ID}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{formatDate(showtime.show_Date)}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {formatTime(showtime.start_Time)} - {formatTime(showtime.end_Time)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceTierColor(showtime.price_Tier)}`}>
                            {showtime.price_Tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{showtime.base_Price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{showtime.status}</td>
                        <td className="py-3 px-4 text-sm text-gray-500 space-x-2">
                          <button 
                            onClick={() => handleEditShowtime(showtime)} 
                            className="text-blue-600 hover:text-blue-800" 
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleHideShowtime(showtime.showtime_ID)} 
                            className="text-red-600 hover:text-red-800" 
                            title="Ẩn lịch chiếu"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-4 space-x-4">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ManageShowtimesPage;

