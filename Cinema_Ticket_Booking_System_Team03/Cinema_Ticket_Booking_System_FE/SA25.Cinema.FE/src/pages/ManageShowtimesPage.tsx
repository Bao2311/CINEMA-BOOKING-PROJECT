import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FaPlus, FaCalendarAlt, FaClock, FaMoneyBillWave, FaFilm, FaDoorOpen, FaTrash, FaEdit, 
  FaSave, FaTimes, FaSync, FaCheck, FaArrowRight, FaArrowLeft, FaChevronRight, FaChevronLeft, 
  FaFilter, FaSearch, FaInfoCircle, FaExclamationTriangle, FaRegCalendarCheck, FaList, FaCalendarDay, FaCalendarPlus,
  FaRegCalendarAlt, FaRegCalendar, FaRegClock, FaRegMoneyBillWave, FaRegFileAlt, FaRegFile, FaCalendarWeek,
  FaEye, FaTicketAlt, FaPercentage, FaGlobe, FaStar, FaCalendarTimes, FaSliders
} from 'react-icons/fa';

import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';


// CSS cho tooltip
const tooltipStyles = `
  .room-tooltip {
    position: absolute;
    z-index: 50;
    background-color: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    width: 280px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    border: 1px solid #e5e7eb;
  }
  
  .room-card:hover .room-tooltip {
    opacity: 1;
    visibility: visible;
  }
`;


interface Movie {
  movie_ID: number;
  title: string;
  poster_URL: string;
  duration: number;
}

interface CinemaRoom {
  cinema_Room_ID: number;
  room_Name: string;
  room_Type: string;
  status: string;
  isBusy: boolean;
  canModify: boolean;
  upcomingShowtimes?: {
    $values: {
      showtime_ID: number;
      show_Date: string;
      start_Time: string;
      end_Time: string;
      movie_Name: string;
    }[]
  };
}

interface Showtime {
  showtime_ID: number;
  movie_ID: number;
  movie_Title?: string;
  movie_Poster?: string;
  cinema_Room_ID: number;
  room_Name?: string;
  room_Type?: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
  capacity_Available?: number;
}

// Định nghĩa các khung giờ cố định
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

// Định nghĩa các loại phòng chiếu
const ROOM_TYPES = ["2D", "3D", "IMAX"];

// Định nghĩa các ngày lễ
const HOLIDAYS = [
  "2025-01-01", // Tết Dương Lịch
  "2025-02-01", // Tết Nguyên Đán (ước tính)
  "2025-02-02", // Tết Nguyên Đán (ước tính)
  "2025-02-03", // Tết Nguyên Đán (ước tính)
  "2025-04-30", // Giải phóng miền Nam
  "2025-05-01", // Quốc tế Lao động
  "2025-09-02", // Quốc khánh
];

const ManageShowtimesPage = () => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [viewingShowtime, setViewingShowtime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showtimeToDelete, setShowtimeToDelete] = useState<number | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemaRooms, setCinemaRooms] = useState<CinemaRoom[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<CinemaRoom | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newShowtime, setNewShowtime] = useState<Showtime>({
    showtime_ID: 0,
    movie_ID: 0,
    cinema_Room_ID: 0,
    show_Date: '',
    start_Time: '',
    end_Time: '',
    price_Tier: 'Regular',
    base_Price: 90000, // Giá mặc định
    status: 'active',
  });

  // State for editing
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // State cho các bộ lọc
  const [filters, setFilters] = useState({
    movieTitle: '',
    roomName: '',
    showDate: '',
    roomType: '',
    status: ''
  });
  
  // State cho hiển thị bộ lọc
  const [showFilters, setShowFilters] = useState(false);

  // State cho bước tạo lịch chiếu
  const [currentStep, setCurrentStep] = useState(1);

  // State cho calendar view
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // THÊM STATE PHÂN TRANG - Sửa số lượng hiển thị thành 7 phim/trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  
  // State for active filter tab
  const [activeFilterTab, setActiveFilterTab] = useState('all');

  const navigate = useNavigate();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
// Lấy role từ localStorage
const getRole = () => {
  return localStorage.getItem("role") || sessionStorage.getItem("role");
};

// Kiểm tra quyền truy cập
useEffect(() => {
  const role = getRole();
  if (role !== "Admin") {
    toast.error("Bạn không có quyền truy cập trang này.");
    navigate("/"); // Điều hướng sang trang unauthorized
  }
}, [navigate]);
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  // Hàm xử lý chọn tab filter
  const handleFilterTab = (tab) => {
    setActiveFilterTab(tab);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi filter
  };

  // Sửa lại phần filteredShowtimes trong useMemo
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(showtime => {
      // Lọc theo searchQuery
      const matchSearch = !searchQuery || 
        (showtime.movie_Title && showtime.movie_Title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (showtime.room_Name && showtime.room_Name.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchMovieTitle = !filters.movieTitle || 
        (showtime.movie_Title && showtime.movie_Title.toLowerCase().includes(filters.movieTitle.toLowerCase()));
      const matchRoomName = !filters.roomName || 
        (showtime.room_Name && showtime.room_Name.toLowerCase().includes(filters.roomName.toLowerCase()));
      const matchShowDate = !filters.showDate || 
        (showtime.show_Date && showtime.show_Date.includes(filters.showDate));
      const matchRoomType = !filters.roomType || 
        (showtime.room_Type && showtime.room_Type.toLowerCase() === filters.roomType.toLowerCase());
      const matchStatus = !filters.status || 
        (showtime.status && showtime.status.toLowerCase() === filters.status.toLowerCase());

      // Additional filter for active filter tab
      if (activeFilterTab === 'today') {
        const today = new Date().toISOString().split('T')[0];
        if (showtime.show_Date !== today) return false;
      } else if (activeFilterTab === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        if (showtime.show_Date !== tomorrowStr) return false;
      } else if (activeFilterTab === 'thisWeek') {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        const todayStr = today.toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        if (showtime.show_Date < todayStr || showtime.show_Date > nextWeekStr) return false;
      } else if (activeFilterTab === 'active') {
        if (showtime.status.toLowerCase() !== 'active') return false;
      } else if (activeFilterTab === 'scheduled') {
        if (showtime.status.toLowerCase() !== 'scheduled') return false;
      }

      return matchSearch && matchMovieTitle && matchRoomName && matchShowDate && matchRoomType && matchStatus;
    });
  }, [showtimes, searchQuery, filters, activeFilterTab]);
  
  // Tính toán cho phân trang
  const totalPages = Math.ceil(filteredShowtimes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShowtimes = filteredShowtimes.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredShowtimes, totalPages, currentPage]);

  // Tạo lịch cho tháng hiện tại
  useEffect(() => {
    const daysInMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    ).getDay();
    
    const days: Date[] = [];
    
    // Thêm ngày từ tháng trước để điền đầy tuần đầu tiên
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonthDay = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        -i
      );
      days.unshift(prevMonthDay);
    }
    
    // Thêm ngày trong tháng hiện tại
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), i)
      );
    }
    
    // Thêm ngày từ tháng sau để điền đầy tuần cuối cùng
    const lastDay = days[days.length - 1].getDay();
    for (let i = 1; i < 7 - lastDay; i++) {
      days.push(
        new Date(
          calendarMonth.getFullYear(),
          calendarMonth.getMonth() + 1,
          i
        )
      );
    }
    
    setCalendarDays(days);
  }, [calendarMonth]);

  // Hàm cập nhật trạng thái suất chiếu
  const updateShowtimeStatus = async (showtimeId: number, newStatus: string) => {
    try {
      const response = await fetch(`https://localhost:7168/api/Showtimes/${showtimeId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
  
      if (!response.ok) {
        throw new Error(`Lỗi khi cập nhật trạng thái: ${response.status}`);
      }
  
      console.log(`Cập nhật trạng thái thành công cho showtime ID: ${showtimeId}`);
      return true;
    } catch (err) {
      console.error(`Lỗi khi cập nhật trạng thái cho showtime ID: ${showtimeId}`, err);
      return false;
    }
  };

  // Hàm fetch dữ liệu từ API với tự động cập nhật trạng thái
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
      
      const now = new Date(); // Lấy thời gian hiện tại
      
      // Kiểm tra và cập nhật trạng thái của các suất chiếu
      const updatedShowtimes = await Promise.all((data['$values'] || []).map(async (showtime) => {
        // Tìm thông tin phim trong danh sách movies đã fetch
        const movie = movies.find(m => m.movie_ID === showtime.movie_ID);
        // Tìm thông tin phòng trong danh sách cinemaRooms đã fetch
        const room = cinemaRooms.find(r => r.cinema_Room_ID === showtime.cinema_Room_ID);
        
        const showDateTime = new Date(`${showtime.show_Date}T${showtime.end_Time}`);
        
        // Nếu suất chiếu đã kết thúc và trạng thái không phải là Hidden
        if (showDateTime < now && showtime.status !== 'Hidden') {
          // Gửi yêu cầu cập nhật trạng thái đến API
          await updateShowtimeStatus(showtime.showtime_ID, 'Hidden');
          
          return {
            ...showtime,
            status: 'Hidden',
            movie_Title: movie?.title || `Phim ID: ${showtime.movie_ID}`,
            movie_Poster: movie?.poster_URL || '',
            room_Name: room?.room_Name || `Phòng ${showtime.cinema_Room_ID}`,
            room_Type: room?.room_Type || '2D'
          };
        }
        
        return {
          ...showtime,
          movie_Title: movie?.title || `Phim ID: ${showtime.movie_ID}`,
          movie_Poster: movie?.poster_URL || '',
          room_Name: room?.room_Name || `Phòng ${showtime.cinema_Room_ID}`,
          room_Type: room?.room_Type || '2D'
        };
      }));
      
      setShowtimes(updatedShowtimes);
      setError('');
      toast.success('Dữ liệu lịch chiếu đã được cập nhật');
    } catch (err) {
      setError('Lỗi khi tải dữ liệu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
      toast.error('Không thể tải dữ liệu lịch chiếu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set up interval để kiểm tra và cập nhật trạng thái showtime định kỳ
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShowtimes(); // Gọi lại hàm fetch để kiểm tra và cập nhật trạng thái
    }, 60 * 60 * 1000); // Kiểm tra mỗi giờ
  
    return () => clearInterval(interval); // Dọn dẹp interval khi component bị unmount
  }, []);

  // Fetch movies đang chiếu
  const fetchNowShowingMovies = async () => {
    try {
      const response = await fetch('https://localhost:7168/api/Movie', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi khi tải danh sách phim: ${response.status}`);
      }

      const data = await response.json();
      setMovies(data['$values'] || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phim:', err);
      setError('Không thể tải danh sách phim. ' + err.message);
      toast.error('Không thể tải danh sách phim');
    }
  };

  // Fetch cinema rooms
  const fetchCinemaRooms = async () => {
    try {
      const response = await fetch('https://localhost:7168/api/CinemaRoom', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi khi tải danh sách phòng chiếu: ${response.status}`);
      }

      const data = await response.json();
      setCinemaRooms(data['$values'] || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phòng chiếu:', err);
      setError('Không thể tải danh sách phòng chiếu. ' + err.message);
      toast.error('Không thể tải danh sách phòng chiếu');
    }
  };

  // Kiểm tra trạng thái phòng chiếu
  const checkRoomStatus = async (roomId) => {
    try {
      const response = await fetch(`https://localhost:7168/api/CinemaRoom/check-status/${roomId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi khi kiểm tra trạng thái phòng: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Lỗi khi kiểm tra trạng thái phòng:', err);
      return null;
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    if (!token) {
      setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      await fetchNowShowingMovies();
      await fetchCinemaRooms();
      await fetchShowtimes();
    };

    fetchAllData();
  }, [token]);

  // Hàm tính thời gian kết thúc dựa trên thời gian bắt đầu và thời lượng phim
  const calculateEndTime = useCallback((startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0);
    
    const endDate = new Date(startDate);
    // Thêm thời lượng phim + 20 phút cho việc chuẩn bị phòng
    endDate.setMinutes(endDate.getMinutes() + durationMinutes + 20);
    
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  }, []);

  // Hàm kiểm tra xung đột lịch chiếu
  const checkRoomAvailability = useCallback((roomId, showDate, startTime, endTime) => {
    // Lọc ra các lịch chiếu trong cùng ngày và cùng phòng
    const existingShowtimes = showtimes.filter(showtime => 
      showtime.cinema_Room_ID === roomId && 
      showtime.show_Date === showDate
    );
    
    // Chuyển đổi thời gian thành số phút để dễ so sánh
    const convertToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = convertToMinutes(startTime);
    const endMinutes = convertToMinutes(endTime);
    
    // Kiểm tra xung đột với từng lịch chiếu hiện có
    for (const showtime of existingShowtimes) {
      const existingStartMinutes = convertToMinutes(showtime.start_Time);
      const existingEndMinutes = convertToMinutes(showtime.end_Time);
      
      // Kiểm tra xem có xung đột không
      // Xung đột xảy ra khi:
      // - Thời gian bắt đầu mới nằm trong khoảng thời gian của lịch chiếu hiện có
      // - Thời gian kết thúc mới nằm trong khoảng thời gian của lịch chiếu hiện có
      // - Lịch chiếu mới bao trùm lịch chiếu hiện có
      if ((startMinutes >= existingStartMinutes && startMinutes < existingEndMinutes) ||
          (endMinutes > existingStartMinutes && endMinutes <= existingEndMinutes) ||
          (startMinutes <= existingStartMinutes && endMinutes >= existingEndMinutes)) {
        return { available: false, conflictingShowtime: showtime };
      }
    }
    
    return { available: true, conflictingShowtime: null };
  }, [showtimes]);

  // Cập nhật newShowtime khi chọn phòng
  useEffect(() => {
    if (selectedRoom) {
      setNewShowtime(prev => ({
        ...prev,
        cinema_Room_ID: selectedRoom.cinema_Room_ID,
        room_Type: selectedRoom.room_Type
      }));
    }
  }, [selectedRoom]);

  // Cập nhật newShowtime khi chọn ngày
  useEffect(() => {
    if (selectedDate) {
      setNewShowtime(prev => ({
        ...prev,
        show_Date: selectedDate
      }));
    }
  }, [selectedDate]);

  // Cập nhật newShowtime khi chọn giờ và tính toán giờ kết thúc
  useEffect(() => {
    if (selectedTimeSlot) {
      setNewShowtime(prev => ({
        ...prev,
        start_Time: selectedTimeSlot
      }));
      
      // Tính toán thời gian kết thúc nếu đã chọn phim
      if (selectedMovie && selectedMovie.duration) {
        const endTime = calculateEndTime(selectedTimeSlot, selectedMovie.duration);
        
        setNewShowtime(prev => ({
          ...prev,
          end_Time: endTime
        }));
        
        // Kiểm tra xung đột lịch nếu đã chọn phòng và ngày
        if (selectedRoom && selectedDate) {
          const { available, conflictingShowtime } = checkRoomAvailability(
            selectedRoom.cinema_Room_ID,
            selectedDate,
            selectedTimeSlot,
            endTime
          );
          
          if (!available && conflictingShowtime) {
            setError(`Không thể assign 2 phim vào cùng 1 phòng trong cùng một khoảng thời gian. Phòng ${selectedRoom.room_Name} đã có lịch chiếu phim "${conflictingShowtime.movie_Title}" từ ${conflictingShowtime.start_Time} đến ${conflictingShowtime.end_Time}.`);
            toast.error('Phát hiện xung đột lịch chiếu');
          } else {
            setError('');
          }
        }
      }
    }
  }, [selectedTimeSlot, selectedMovie, selectedRoom, selectedDate, calculateEndTime, checkRoomAvailability]);

  // Cập nhật newShowtime khi chọn phim
  useEffect(() => {
    if (selectedMovie) {
      setNewShowtime(prev => ({
        ...prev,
        movie_ID: selectedMovie.movie_ID
      }));
      
      // Nếu đã chọn giờ bắt đầu, tính lại giờ kết thúc
      if (selectedTimeSlot) {
        const endTime = calculateEndTime(selectedTimeSlot, selectedMovie.duration);
        setNewShowtime(prev => ({
          ...prev,
          end_Time: endTime
        }));
      }
    }
  }, [selectedMovie, selectedTimeSlot, calculateEndTime]);

  // Hàm xử lý tạo lịch chiếu mới - Sửa lỗi không đặt được lịch chiếu
  const handleCreateShowtime = async () => {
    if (!token) {
      setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      return;
    }
  
    if (!selectedMovie || !selectedRoom || !selectedDate || !selectedTimeSlot) {
      setError('Vui lòng điền đầy đủ thông tin.');
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
  
    // Kiểm tra xung đột lịch trước khi tạo
    const { available, conflictingShowtime } = checkRoomAvailability(
      selectedRoom.cinema_Room_ID,
      selectedDate,
      selectedTimeSlot,
      newShowtime.end_Time
    );
    
    if (!available) {
      setError(`Không thể assign 2 phim vào cùng 1 phòng trong cùng một khoảng thời gian. Phòng này đã có lịch chiếu phim "${conflictingShowtime.movie_Title}" từ ${conflictingShowtime.start_Time} đến ${conflictingShowtime.end_Time}.`);
      toast.error('Phát hiện xung đột lịch chiếu');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
  
      const showtimeToSend = {
        movie_ID: selectedMovie.movie_ID,
        cinema_Room_ID: selectedRoom.cinema_Room_ID,
        show_Date: new Date(selectedDate).toISOString(),
        start_Time: selectedTimeSlot,
        end_Time: newShowtime.end_Time,
        price_Tier: newShowtime.price_Tier,
        base_Price: newShowtime.base_Price,
        status: 'active',
        capacity_Available: 100
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
        toast.error('Phiên đăng nhập đã hết hạn');
        return;
      }
  
      if (!response.ok) {
        const responseText = await response.text();
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
        base_Price: 90000,
        status: 'active',
      });
      
      setSelectedMovie(null);
      setSelectedRoom(null);
      setSelectedDate('');
      setSelectedTimeSlot('');
      setCurrentStep(1);
      setShowCreateForm(false);
      
      // Hiển thị thông báo thành công
      toast.success('Tạo lịch chiếu thành công!');
      
      // Refresh dữ liệu
      await fetchShowtimes();
    } catch (err) {
      setError('Lỗi khi tạo lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
      toast.error('Lỗi khi tạo lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi chọn ngày từ lịch - Sửa lỗi chọn ngày
  const handleSelectDate = (date) => {
    // Kiểm tra xem ngày có trong quá khứ không
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    if (date < currentDate) {
      toast.warning('Không thể chọn ngày trong quá khứ');
      return; // Không cho phép chọn ngày trong quá khứ
    }
    
    // Fix: Tạo một bản sao của ngày để tránh vấn đề tham chiếu
    const selectedDateObj = new Date(date);
    const formattedDate = selectedDateObj.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  };

  // Hàm xử lý chỉnh sửa lịch chiếu
  const handleEditShowtime = (showtime: Showtime) => {
    const formattedShowtime = {
      ...showtime,
      show_Date: showtime.show_Date ? showtime.show_Date.split('T')[0] : '', // Tách phần ngày
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
  
      // Chuyển đổi ngày sang định dạng ISO (UTC)
      const utcDate = new Date(`${editingShowtime.show_Date}T00:00:00Z`).toISOString();
  
      // Chuẩn bị dữ liệu để gửi đến API
      const showtimeToUpdate = {
        ...editingShowtime,
        show_Date: utcDate, // Lưu ngày dưới dạng UTC
      };
  
      console.log('Payload gửi đến API:', showtimeToUpdate);
  
      const response = await fetch(`https://localhost:7168/api/Showtimes/${editingShowtime.showtime_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*',
        },
        body: JSON.stringify(showtimeToUpdate),
      });
  
      if (!response.ok) {
        throw new Error(`Lỗi khi cập nhật lịch chiếu: ${response.status}`);
      }
  
      // Reset trạng thái chỉnh sửa
      setIsEditing(false);
      setEditingShowtime(null);
  
      // Hiển thị thông báo thành công
      toast.success('Cập nhật lịch chiếu thành công!');
  
      // Refresh dữ liệu
      await fetchShowtimes();
    } catch (err) {
      setError('Lỗi khi cập nhật lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
      toast.error('Lỗi khi cập nhật lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý xóa showtime
  const handleDeleteShowtime = (showtimeId) => {
    setShowtimeToDelete(showtimeId);
    setShowDeleteModal(true);
  };

  // Hàm xác nhận xóa
  const confirmDelete = async () => {
    if (!token || !showtimeToDelete) {
      setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`https://localhost:7168/api/Showtimes/${showtimeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        },
      });

      if (response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        toast.error('Phiên đăng nhập đã hết hạn');
        return;
      }

      if (!response.ok) {
        throw new Error(`Lỗi khi xóa lịch chiếu: ${response.status}`);
      }

      // Show success message
      toast.success('Lịch chiếu đã được xóa thành công!');
      
      // Đóng modal xóa
      setShowDeleteModal(false);
      setShowtimeToDelete(null);
      
      // Refresh dữ liệu
      await fetchShowtimes();
    } catch (err) {
      setError('Lỗi khi xóa lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
      console.error(err);
      toast.error('Lỗi khi xóa lịch chiếu: ' + (err.message || 'Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  // Hàm xem chi tiết showtime
  const handleViewShowtime = (showtime: Showtime) => {
    setViewingShowtime(showtime);
  };

  // Hàm refresh dữ liệu thủ công
  const handleRefresh = () => {
    fetchShowtimes();
  };

  // Hàm định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Hàm định dạng giờ
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  // Hàm định dạng ngày giờ
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Kiểm tra xem ngày có phải là ngày mai không
  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return date.getDate() === tomorrow.getDate() &&
          date.getMonth() === tomorrow.getMonth() &&
          date.getFullYear() === tomorrow.getFullYear();
  };

  // Hàm tính thời gian chiếu phim
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    
    // Xử lý trường hợp kết thúc vào ngày hôm sau
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours} giờ ${minutes} phút`;
  };

  // Màu sắc cho các loại giá
  const getPriceTierColor = (tier) => {
    switch(tier) {
      case 'VIP': return 'text-yellow-600 bg-yellow-100';
      case 'Regular': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Màu sắc cho các trạng thái
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'active': return 'bg-green-500 text-white';
      case 'inactive': return 'bg-red-500 text-white';
      case 'scheduled': return 'bg-yellow-500 text-white';
      case 'hidden': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Màu sắc cho các loại phòng
  const getRoomTypeColor = (type) => {
    switch(type) {
      case '3D': return 'bg-purple-100 text-purple-700';
      case 'IMAX': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Kiểm tra xem ngày có phải là ngày lễ không
  const isHoliday = (dateString) => {
    return HOLIDAYS.includes(dateString);
  };

  // Kiểm tra xem ngày có phải là cuối tuần không
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 là Chủ Nhật, 6 là Thứ Bảy
  };

  // Chuyển đến bước tiếp theo trong quy trình tạo lịch chiếu
  const goToNextStep = () => {
    if (currentStep === 1 && !selectedMovie) {
      setError('Vui lòng chọn phim trước khi tiếp tục.');
      toast.warning('Vui lòng chọn phim trước khi tiếp tục');
      return;
    }
    
    if (currentStep === 3 && !selectedDate) {
      setError('Vui lòng chọn ngày chiếu trước khi tiếp tục.');
      toast.warning('Vui lòng chọn ngày chiếu trước khi tiếp tục');
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
    setError('');
  };

  // Quay lại bước trước trong quy trình tạo lịch chiếu
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  // Tạo ngày hiện tại để giới hạn lịch
  const today = new Date().toISOString().split('T')[0];

  // Hàm chuyển tháng trong lịch
  const changeMonth = (increment) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + increment, 1));
  };

  // Kiểm tra xem ngày có phải là ngày hiện tại không
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Kiểm tra xem ngày có phải là ngày được chọn không
  const isSelectedDay = (date) => {
    if (!selectedDate) return false;
    
    const selected = new Date(selectedDate);
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  };

  // Kiểm tra xem ngày có thuộc tháng hiện tại không
  const isCurrentMonth = (date) => {
    return date.getMonth() === calendarMonth.getMonth();
  };

  // Toggle form tạo mới
  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    if (!showCreateForm) {
      // Reset form khi mở
      setSelectedMovie(null);
      setSelectedRoom(null);
      setSelectedDate('');
      setSelectedTimeSlot('');
      setCurrentStep(1);
    }
  };

  // Toggle hiển thị bộ lọc - Sửa lỗi khi ấn ẩn hiện bộ lọc
  const toggleFilters = () => {
    try {
      setShowFilters(prevState => !prevState);
    } catch (error) {
      console.error("Error toggling filters:", error);
      toast.error("Có lỗi xảy ra khi hiển thị bộ lọc");
    }
  };

  // Reset bộ lọc
  const resetFilters = () => {
    setFilters({
      movieTitle: '',
      roomName: '',
      showDate: '',
      roomType: '',
      status: '',
    });
    setActiveFilterTab('all');
    toast.info('Đã xóa tất cả bộ lọc');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <FaRegCalendarCheck className="mr-3 text-blue-600" />
              Quản lý lịch chiếu
            </h1>
            <p className="text-gray-600">Tạo và quản lý lịch chiếu phim cho rạp của bạn</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={toggleCreateForm} 
              className={`px-4 py-2.5 rounded-full flex items-center font-medium transition-all shadow-sm ${
                showCreateForm 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showCreateForm ? (
                <>
                  <FaTimes className="mr-2" />
                  Đóng form
                </>
              ) : (
                <>
                  <FaPlus className="mr-2" />
                  Tạo lịch chiếu mới
                </>
              )}
            </button>
            
            <button 
              onClick={toggleFilters} 
              className={`px-4 py-2.5 rounded-full flex items-center font-medium transition-all shadow-sm ${
                showFilters 
                  ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaFilter className="mr-2" />
              {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            </button>
            
            <button 
              onClick={handleRefresh} 
              className="px-4 py-2.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-all flex items-center font-medium shadow-sm"
              disabled={refreshing}
            >
              <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm"
        >
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-3 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Đã xảy ra lỗi</p>
              <p className="mt-1">{error}</p>
              {(error.includes('đăng nhập') || error.includes('phiên')) && (
                <button 
                  onClick={handleLogin} 
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Đăng nhập lại
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {!token ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl shadow-lg text-center"
        >
          <div className="bg-blue-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6">
            <FaInfoCircle className="text-blue-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Yêu cầu đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để quản lý lịch chiếu phim.</p>
          <button 
            onClick={handleLogin} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
          >
            Đăng nhập ngay
          </button>
        </motion.div>
      ) : (
        <>
          {/* Form chỉnh sửa lịch chiếu - Cải thiện giao diện form update */}
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
                  <div>
                    <input
                      type="date"
                      value={editingShowtime.show_Date ? editingShowtime.show_Date.split('T')[0] : ''}
                      onChange={(e) => setEditingShowtime({ ...editingShowtime, show_Date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    />
                    <p className="text-sm text-gray-500 mt-1">Nhập theo định dạng: Năm-Tháng-Ngày (VD: 2025-03-30)</p>
                  </div>
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
                      <FaClock className="mr-2 text-blue-500" />
                      Trạng thái
                    </div>
                  </label>
                  <select 
                    value={editingShowtime.status} 
                    onChange={(e) => setEditingShowtime({ ...editingShowtime, status: e.target.value })} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  >
                    <option value="Hidden">Hidden</option>
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

          {/* Form tạo lịch chiếu mới - theo quy trình từng bước */}
          {showCreateForm && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-white p-6 rounded-xl shadow-lg mb-8 border-l-4 border-blue-500"
            >
              <div className="flex items-center mb-8">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FaPlus className="text-blue-600 text-xl" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">Tạo lịch chiếu mới</h3>
              </div>

              {/* Stepper - Improved UI */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4 relative">
                  {/* Progress bar underneath */}
                  <div className="absolute h-1 bg-gray-200 left-0 right-0 top-6 -z-10">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${(currentStep - 1) * 33.33}%` }}
                    ></div>
                  </div>
                  
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className="flex flex-col items-center relative z-10">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                          currentStep === step 
                            ? 'bg-blue-600 text-white shadow-md scale-110' 
                            : currentStep > step 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {currentStep > step ? <FaCheck className="text-lg" /> : step}
                      </div>
                      <div className="text-sm font-medium text-center max-w-[100px]">
                        {step === 1 && "Chọn phim"}
                        {step === 2 && "Chọn phòng"}
                        {step === 3 && "Chọn ngày"}
                        {step === 4 && "Chọn giờ"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bước 1: Chọn phim */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl"
                  >
                    <h4 className="text-lg font-medium text-gray-800 mb-6 flex items-center">
                      <FaFilm className="mr-2 text-blue-500" />
                      Bước 1: Chọn phim đang chiếu
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {loading ? (
                      <div className="col-span-full text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-600">Đang tải danh sách phim...</p>
                      </div>
                    ) : movies.length === 0 ? (
                      <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">Không có phim đang chiếu nào.</p>
                      </div>
                    ) : (
                      movies.map(movie => (
                        <div 
                          key={movie.movie_ID}
                          onClick={() => setSelectedMovie(movie)}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all transform hover:scale-105 hover:shadow-md ${
                            selectedMovie?.movie_ID === movie.movie_ID 
                              ? 'border-blue-500 shadow-lg ring-4 ring-blue-100' 
                              : 'border-transparent shadow-sm'
                          }`}
                        >
                          <div className="relative pb-[150%]">
                            <img 
                              src={movie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                              alt={movie.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            {selectedMovie?.movie_ID === movie.movie_ID && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                <div className="bg-blue-500 text-white p-2 rounded-full">
                                  <FaCheck />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-white">
                            <h5 className="font-medium text-gray-800 truncate">{movie.title}</h5>
                            <p className="text-xs text-gray-500">{movie.duration} phút</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {selectedMovie && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-blue-700 flex items-center">
                        <FaCheck className="mr-2 text-green-500" />
                        Đã chọn: <span className="font-semibold ml-1">{selectedMovie.title}</span> 
                        <span className="ml-2 text-sm bg-blue-100 px-2 py-0.5 rounded-full">
                          {selectedMovie.duration} phút
                        </span>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Bước 2: Chọn phòng chiếu */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <FaDoorOpen className="mr-2 text-blue-500" />
                      Bước 2: Chọn phòng chiếu
                    </h4>
                    
                    {selectedMovie && (
                      <div className="flex items-center bg-blue-50 px-4 py-2 rounded-lg">
                        <img 
                          src={selectedMovie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                          alt={selectedMovie.title}
                          className="w-8 h-8 rounded-full object-cover mr-2 border border-blue-200"
                        />
                        <span className="text-sm font-medium text-blue-700 truncate max-w-[150px]">
                          {selectedMovie.title}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {loading ? (
                      <div className="col-span-full text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-600">Đang tải danh sách phòng...</p>
                      </div>
                    ) : cinemaRooms.length === 0 ? (
                      <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">Không có phòng chiếu nào.</p>
                      </div>
                    ) : (
                      cinemaRooms.map(room => {
                        const isSelected = selectedRoom?.cinema_Room_ID === room.cinema_Room_ID;
                        const isBusy = room.isBusy;
                        
                        return (
                          <div 
                            key={room.cinema_Room_ID}
                            onClick={() => !isBusy && setSelectedRoom(room)}
                            className={`cursor-pointer p-4 rounded-lg border transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' 
                                : isBusy 
                                  ? 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed' 
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium text-gray-800 text-lg">{room.room_Name}</h5>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                  room.room_Type === '3D' 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {room.room_Type}
                                </span>
                              </div>
                              
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                room.status === 'active' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {room.status}
                              </span>
                            </div>
                            
                            {isBusy && (
                              <div className="mt-3 text-sm text-red-600 flex items-center">
                                <FaExclamationTriangle className="mr-1" />
                                Phòng đang bận
                              </div>
                            )}
                            
                            {/* Hiển thị thông tin phim đã được assign cho phòng */}
                            {room.upcomingShowtimes && room.upcomingShowtimes.$values && room.upcomingShowtimes.$values.length > 0 && (
                              <div className="mt-3 group relative">
                                <p className="text-xs text-gray-500 mb-1 flex items-center">
                                  <FaInfoCircle className="mr-1" /> 
                                  Lịch chiếu sắp tới: <span className="ml-1 text-blue-500 underline cursor-pointer">
                                    {room.upcomingShowtimes.$values.length} lịch
                                  </span>
                                </p>
                                
                                {/* Tooltip hiển thị chi tiết khi hover */}
                                <div className="absolute left-0 bottom-full mb-2 w-64 bg-white shadow-lg rounded-lg p-3 border border-gray-200 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                  <h6 className="font-medium text-gray-800 mb-2 border-b pb-1">Chi tiết lịch chiếu</h6>
                                  <div className="max-h-48 overflow-y-auto space-y-2">
                                    {room.upcomingShowtimes.$values.map((showtime, idx) => (
                                      <div key={idx} className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                                        <div className="flex justify-between">
                                          <span className="font-medium">{formatDate(showtime.show_Date)}</span>
                                          <span>{showtime.start_Time} - {showtime.end_Time}</span>
                                        </div>
                                        <div className="truncate text-gray-600 mt-0.5 flex items-center">
                                          <FaFilm className="mr-1 text-blue-500" size={10} />
                                          {showtime.movie_Name}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Preview của 2 lịch chiếu đầu tiên */}
                                <div className="space-y-1">
                                  {room.upcomingShowtimes.$values.slice(0, 2).map((showtime, idx) => (
                                    <div key={idx} className="text-xs bg-gray-100 p-1.5 rounded">
                                      <div className="flex justify-between">
                                        <span className="font-medium">{formatDate(showtime.show_Date)}</span>
                                        <span>{showtime.start_Time} - {showtime.end_Time}</span>
                                      </div>
                                      <div className="truncate text-gray-600 mt-0.5">
                                        {showtime.movie_Name}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {room.upcomingShowtimes.$values.length > 2 && (
                                    <p className="text-xs text-gray-500 italic">
                                      + {room.upcomingShowtimes.$values.length - 2} lịch chiếu khác
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {selectedRoom && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-blue-700 flex items-center">
                        <FaCheck className="mr-2 text-green-500" />
                        Đã chọn: <span className="font-semibold ml-1">{selectedRoom.room_Name}</span> 
                        <span className={`ml-2 text-sm px-2 py-0.5 rounded-full ${
                          selectedRoom.room_Type === '3D' 
                            ? 'bg-purple-100 text-purple-700' 
                            : selectedRoom.room_Type === 'IMAX' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedRoom.room_Type}
                        </span>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Bước 3: Chọn ngày chiếu */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      Bước 3: Chọn ngày chiếu
                    </h4>
                    
                    {selectedMovie && selectedRoom && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-lg">
                          <img 
                            src={selectedMovie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                            alt={selectedMovie.title}
                            className="w-6 h-6 rounded-full object-cover mr-2 border border-blue-200"
                          />
                          <span className="text-xs font-medium text-blue-700 truncate max-w-[100px]">
                            {selectedMovie.title}
                          </span>
                        </div>
                        
                        <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-lg">
                          <FaDoorOpen className="text-green-600 mr-1" size={12} />
                          <span className="text-xs font-medium text-green-700">
                            {selectedRoom.room_Name}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      {/* Calendar header */}
                      <div className="flex items-center justify-between p-4 border-b">
                        <button 
                          onClick={() => changeMonth(-1)} 
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <FaChevronLeft />
                        </button>
                        
                        <h4 className="font-medium text-gray-800">
                          {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                        </h4>
                        
                        <button 
                          onClick={() => changeMonth(1)} 
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <FaChevronRight />
                        </button>
                      </div>
                      
                      {/* Calendar weekday headers */}
                      <div className="grid grid-cols-7 text-center py-2 border-b bg-gray-50">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, index) => (
                          <div 
                            key={index} 
                            className={`text-sm font-medium ${index === 0 || index === 6 ? 'text-red-500' : 'text-gray-600'}`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar days */}
                      <div className="grid grid-cols-7 gap-1 p-4">
                        {calendarDays.map((date, index) => {
                          const isCurrentMonthDay = isCurrentMonth(date);
                          const isSelectedDayValue = isSelectedDay(date);
                          const isTodayValue = isToday(date);
                          const isWeekendValue = isWeekend(date);
                          const isHolidayValue = isHoliday(date.toISOString().split('T')[0]);
                          const isPastDay = date < new Date(new Date().setHours(0, 0, 0, 0));
                          
                          return (
                            <div 
                              key={index}
                              onClick={() => !isPastDay && handleSelectDate(date)}
                              className={`
                                aspect-square flex items-center justify-center rounded-lg text-sm relative
                                ${isCurrentMonthDay ? '' : 'opacity-30'}
                                ${isPastDay ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'}
                                ${isSelectedDayValue ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                                ${isTodayValue && !isSelectedDayValue ? 'border-2 border-blue-400' : ''}
                                ${isWeekendValue && !isSelectedDayValue ? 'text-red-500' : ''}
                                ${isHolidayValue && !isSelectedDayValue ? 'text-purple-500 font-bold' : ''}
                              `}
                            >
                              {date.getDate()}
                              
                              {isHolidayValue && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Calendar legend */}
                      <div className="border-t p-3 flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                          <span>Ngày đã chọn</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 border-2 border-blue-400 rounded-full mr-1"></div>
                          <span>Hôm nay</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
                          <span>Cuối tuần</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-100 rounded-full mr-1"></div>
                          <span>Ngày lễ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Loại bỏ ô nhập trực tiếp ngày theo yêu cầu */}
                  
                  {selectedDate && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-blue-700 flex items-center">
                        <FaCheck className="mr-2 text-green-500" />
                        Ngày chiếu: <span className="font-semibold ml-1">{formatDate(selectedDate)}</span>
                        {isHoliday(selectedDate) && (
                          <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Ngày lễ
                          </span>
                        )}
                        {isWeekend(new Date(selectedDate)) && (
                          <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Cuối tuần
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Bước 4: Chọn giờ chiếu và hoàn tất */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center">
                      <FaClock className="mr-2 text-blue-500" />
                      Bước 4: Chọn giờ chiếu
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-lg">
                        <img 
                          src={selectedMovie?.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                          alt={selectedMovie?.title}
                          className="w-6 h-6 rounded-full object-cover mr-2 border border-blue-200"
                        />
                        <span className="text-xs font-medium text-blue-700 truncate max-w-[100px]">
                          {selectedMovie?.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center bg-green-50 px-3 py-1.5 rounded-lg">
                        <FaDoorOpen className="text-green-600 mr-1" size={12} />
                        <span className="text-xs font-medium text-green-700">
                          {selectedRoom?.room_Name}
                        </span>
                      </div>
                      
                      <div className="flex items-center bg-purple-50 px-3 py-1.5 rounded-lg">
                        <FaCalendarAlt className="text-purple-600 mr-1" size={12} />
                        <span className="text-xs font-medium text-purple-700">
                          {formatDate(selectedDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Chọn giờ bắt đầu:</h5>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {TIME_SLOTS.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTimeSlot(time)}
                          className={`py-2 rounded-lg text-center transition-all ${
                            selectedTimeSlot === time 
                              ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedTimeSlot && selectedMovie && (
                    <div className="mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Thông tin giờ chiếu:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <FaClock className="text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Giờ bắt đầu</p>
                              <p className="font-medium text-gray-800">{selectedTimeSlot}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <FaClock className="text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Giờ kết thúc (dự kiến)</p>
                              <p className="font-medium text-gray-800">{newShowtime.end_Time}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                              <FaFilm className="text-yellow-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Thời lượng phim</p>
                              <p className="font-medium text-gray-800">{selectedMovie.duration} phút</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                              <FaMoneyBillWave className="text-purple-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Tóm tắt thông tin lịch chiếu */}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h5 className="font-medium text-gray-800 mb-4 flex items-center">
                      <FaInfoCircle className="mr-2 text-blue-500" />
                      Tóm tắt thông tin lịch chiếu
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex">
                        <div className="mr-3 text-blue-500"><FaFilm /></div>
                        <div>
                          <p className="text-sm text-gray-500">Phim</p>
                          <p className="font-medium text-gray-800">{selectedMovie?.title || 'Chưa chọn'}</p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="mr-3 text-blue-500"><FaDoorOpen /></div>
                        <div>
                          <p className="text-sm text-gray-500">Phòng chiếu</p>
                          <p className="font-medium text-gray-800">
                            {selectedRoom?.room_Name || 'Chưa chọn'}
                            {selectedRoom?.room_Type && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                selectedRoom.room_Type === '3D' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : selectedRoom.room_Type === 'IMAX' 
                                    ? 'bg-yellow-100 text-yellow-700' 
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                {selectedRoom.room_Type}
                              </span>
                            )}
                                                    </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="mr-3 text-blue-500"><FaCalendarAlt /></div>
                        <div>
                          <p className="text-sm text-gray-500">Ngày chiếu</p>
                          <p className="font-medium text-gray-800">{formatDate(selectedDate) || 'Chưa chọn'}</p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="mr-3 text-blue-500"><FaClock /></div>
                        <div>
                          <p className="text-sm text-gray-500">Giờ chiếu</p>
                          <p className="font-medium text-gray-800">
                            {selectedTimeSlot ? `${selectedTimeSlot} - ${newShowtime.end_Time}` : 'Chưa chọn'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="mr-3 text-blue-500"><FaMoneyBillWave /></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <button 
                  onClick={goToPreviousStep} 
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-sm flex items-center"
                >
                  <FaArrowLeft className="mr-2" />
                  Quay lại
                </button>
              ) : (
                <div></div>
              )}
              
              {currentStep < 4 ? (
                <button 
                  onClick={goToNextStep} 
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                >
                  Tiếp tục
                  <FaArrowRight className="ml-2" />
                </button>
              ) : (
                <button 
                  onClick={handleCreateShowtime} 
                  disabled={loading || !selectedMovie || !selectedRoom || !selectedDate || !selectedTimeSlot}
                  className={`px-6 py-2.5 rounded-lg transition-colors shadow-sm flex items-center ${
                    loading || !selectedMovie || !selectedRoom || !selectedDate || !selectedTimeSlot
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Đang tạo...' : (
                    <>
                      <FaCheck className="mr-2" />
                      Tạo lịch chiếu
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Filter section - Sửa lỗi khi ấn ẩn hiện bộ lọc tìm kiếm */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-lg mb-8 overflow-hidden"
            >
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <FaFilter className="text-indigo-600 text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Bộ lọc nâng cao</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên phim</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên phim..." 
                    value={filters.movieTitle} 
                    onChange={(e) => setFilters({...filters, movieTitle: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên phòng</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên phòng..." 
                    value={filters.roomName} 
                    onChange={(e) => setFilters({...filters, roomName: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày chiếu</label>
                  <input 
                    type="date" 
                    value={filters.showDate} 
                    onChange={(e) => setFilters({...filters, showDate: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại phòng</label>
                  <select 
                    value={filters.roomType} 
                    onChange={(e) => setFilters({...filters, roomType: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  >
                    <option value="">Tất cả</option>
                    {ROOM_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters({...filters, status: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  >
                    <option value="">Tất cả</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="hidden">Đã ẩn</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button 
                  onClick={resetFilters} 
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-sm flex items-center mr-3"
                >
                  <FaTimes className="mr-2" />
                  Xóa bộ lọc
                </button>
                <button 
                  onClick={() => setShowFilters(false)} 
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center"
                >
                  <FaCheck className="mr-2" />
                  Áp dụng
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs for filtering - Sửa lỗi filter ngày hoạt động */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            <button 
              onClick={() => handleFilterTab('all')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeFilterTab === 'all' 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <FaList className="mr-2" />
                Tất cả
              </div>
            </button>
            
            <button 
              onClick={() => handleFilterTab('today')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeFilterTab === 'today' 
                  ? 'bg-green-100 text-green-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <FaCalendarDay className="mr-2" />
                Hôm nay
              </div>
            </button>
            
            <button 
              onClick={() => handleFilterTab('tomorrow')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeFilterTab === 'tomorrow' 
                  ? 'bg-yellow-100 text-yellow-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <FaCalendarPlus className="mr-2" />
                Ngày mai
              </div>
            </button>
            
            <button 
              onClick={() => handleFilterTab('thisWeek')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeFilterTab === 'thisWeek' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <FaCalendarWeek className="mr-2" />
                Tuần này
              </div>
            </button>
            
            <button 
              onClick={() => handleFilterTab('active')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeFilterTab === 'active' 
                  ? 'bg-teal-100 text-teal-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <FaCheck className="mr-2" />
                Đang hoạt động
              </div>
            </button>
            
            <button 
              onClick={() => handleFilterTab('scheduled')}
              className={`px-4 py-2 rounded-full transition-all ${
                activeFilterTab === 'scheduled' 
                  ? 'bg-indigo-100 text-indigo-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center">
                <FaClock className="mr-2" />
                Đã lên lịch
              </div>
            </button>
          </div>
        </div>

        {/* Main content - Showtimes List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 md:mb-0">
                Danh sách lịch chiếu
                {activeFilterTab !== 'all' && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {activeFilterTab === 'today' && 'Hôm nay'}
                    {activeFilterTab === 'tomorrow' && 'Ngày mai'}
                    {activeFilterTab === 'thisWeek' && 'Tuần này'}
                    {activeFilterTab === 'active' && 'Đang hoạt động'}
                    {activeFilterTab === 'scheduled' && 'Đã lên lịch'}
                  </span>
                )}
              </h3>
              
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm lịch chiếu..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors w-full md:w-64"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-10 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách lịch chiếu...</p>
            </div>
          ) : filteredShowtimes.length === 0 ? (
            <div className="p-10 text-center bg-gray-50">
              <div className="inline-block bg-gray-100 p-5 rounded-full mb-4">
                <FaCalendarTimes className="text-gray-400 text-4xl" />
              </div>
              <p className="text-gray-600 mb-4">Không tìm thấy lịch chiếu nào.</p>
              <button 
                onClick={toggleCreateForm} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center"
              >
                <FaPlus className="mr-2" />
                Tạo lịch chiếu mới
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày chiếu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giờ chiếu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentShowtimes.map((showtime) => (
                    <tr key={showtime.showtime_ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {showtime.movie_Poster ? (
                            <img 
                              src={showtime.movie_Poster} 
                              alt={showtime.movie_Title} 
                              className="w-10 h-14 object-cover rounded mr-3"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center mr-3">
                              <FaFilm className="text-gray-400" />
                            </div>
                          )}
                          <div className="max-w-[180px]">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {showtime.movie_Title || `Phim ID: ${showtime.movie_ID}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{showtime.room_Name || `Phòng ${showtime.cinema_Room_ID}`}</div>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getRoomTypeColor(showtime.room_Type)}`}>
                          {showtime.room_Type || '2D'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(showtime.show_Date)}</div>
                        <div className="text-xs text-gray-500">
                          {isToday(new Date(showtime.show_Date)) && (
                            <span className="text-green-600 font-medium">Hôm nay</span>
                          )}
                          {isTomorrow(new Date(showtime.show_Date)) && (
                            <span className="text-blue-600 font-medium">Ngày mai</span>
                          )}
                          {isWeekend(new Date(showtime.show_Date)) && (
                            <span className="text-red-600 font-medium ml-1">(Cuối tuần)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {showtime.start_Time} - {showtime.end_Time}
                        </div>
                        <div className="text-xs text-gray-500">
                          {calculateDuration(showtime.start_Time, showtime.end_Time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(showtime.status)}`}>
                          {showtime.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleEditShowtime(showtime)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleViewShowtime(showtime)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => handleDeleteShowtime(showtime.showtime_ID)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination - Sửa lỗi phân trang */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị {filteredShowtimes.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredShowtimes.length)} trên {filteredShowtimes.length} lịch chiếu
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaChevronLeft size={14} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages || totalPages === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* View Showtime Modal */}
    {viewingShowtime && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-xl font-semibold text-gray-800">Chi tiết lịch chiếu</h3>
            <button 
              onClick={() => setViewingShowtime(null)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Movie poster and info */}
              <div className="md:w-1/3">
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                  {viewingShowtime.movie_Poster ? (
                    <img 
                      src={viewingShowtime.movie_Poster} 
                      alt={viewingShowtime.movie_Title} 
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <FaFilm className="text-gray-400 text-4xl" />
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-lg text-gray-800 mb-2">{viewingShowtime.movie_Title}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <FaClock className="text-gray-500 mr-2" />
                      <span>{viewingShowtime.movie_Duration} phút</span>
                    </div>
                    <div className="flex items-center">
                      <FaGlobe className="text-gray-500 mr-2" />
                      <span>{viewingShowtime.movie_Language || 'Không có thông tin'}</span>
                    </div>
                    <div className="flex items-center">
                      <FaStar className="text-yellow-500 mr-2" />
                      <span>{viewingShowtime.movie_Rating || 'Chưa có đánh giá'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Showtime details */}
              <div className="md:w-2/3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">ID lịch chiếu</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-800 font-mono">{viewingShowtime.showtime_ID}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(viewingShowtime.status)}`}>
                        {viewingShowtime.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">Phòng chiếu</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                      <span className="text-gray-800 font-medium">
                        {viewingShowtime.room_Name || `Phòng ${viewingShowtime.cinema_Room_ID}`}
                      </span>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getRoomTypeColor(viewingShowtime.room_Type)}`}>
                        {viewingShowtime.room_Type || '2D'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">Ngày chiếu</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="text-gray-800">{formatDate(viewingShowtime.show_Date)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {isWeekend(new Date(viewingShowtime.show_Date)) && (
                          <span className="text-red-600 font-medium">Cuối tuần</span>
                        )}
                        {isHoliday(viewingShowtime.show_Date) && (
                          <span className="text-purple-600 font-medium ml-1">(Ngày lễ)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">Giờ bắt đầu</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-800">{viewingShowtime.start_Time}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">Giờ kết thúc</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-800">{viewingShowtime.end_Time}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">Thời lượng</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-gray-800">
                        {calculateDuration(viewingShowtime.start_Time, viewingShowtime.end_Time)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Số ghế còn trống</label>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-medium">
                          {viewingShowtime.capacity_Available || 'Không có thông tin'} ghế
                        </span>
                        <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${((viewingShowtime.capacity_Available || 0) / 100) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-800 mb-4">Thao tác</h4>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => {
                        handleEditShowtime(viewingShowtime);
                        setViewingShowtime(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                    >
                      <FaEdit className="mr-2" />
                      Chỉnh sửa
                    </button>
                    
                    <button 
                      onClick={() => {
                        handleDeleteShowtime(viewingShowtime.showtime_ID);
                        setViewingShowtime(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center"
                    >
                      <FaTrash className="mr-2" />
                      Xóa
                    </button>
                    
                    <button 
                      onClick={() => setViewingShowtime(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-sm flex items-center"
                    >
                      <FaTimes className="mr-2" />
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="bg-white rounded-xl shadow-xl max-w-md w-full"
        >
          <div className="p-6 border-b border-gray-200 flex items-center">
            <div className="bg-red-100 p-3 rounded-full mr-4">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Xác nhận xóa</h3>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa lịch chiếu này? Hành động này không thể hoàn tác.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center"
              >
                {loading ? 'Đang xóa...' : (
                  <>
                    <FaTrash className="mr-2" />
                    Xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}

    {/* Inject tooltip styles */}
    <style dangerouslySetInnerHTML={{ __html: tooltipStyles }} />
  </div>
);
};

export default ManageShowtimesPage;








  

 
                                        

    
