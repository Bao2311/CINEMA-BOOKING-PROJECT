import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal } from 'antd';
import axios from 'axios';

interface Movie {
  movie_ID: number;
  movie_Name: string;
  director: string;
  genre: string;
  cast: string;
  poster_URL: string;
}

interface Showtime {
  showtime_ID: number;
  movie_ID: number;
  cinema_Room_ID: number;
  room_Name: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
  movie?: Movie;
}

const ShowtimesPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [filteredShowtimes, setFilteredShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [groupedShowtimes, setGroupedShowtimes] = useState<Record<number, Showtime[]>>({});
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
  const [selectedShowtimeInfo, setSelectedShowtimeInfo] = useState<{showtimeId: number, movieId: number} | null>(null);

  useEffect(() => {
    const fetchShowtimesAndMovies = async () => {
      try {
        const showtimesResponse = await fetch('https://localhost:7168/api/Showtimes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!showtimesResponse.ok) {
          throw new Error('Failed to fetch showtimes');
        }

        const showtimesData = await showtimesResponse.json();
        let showtimes = showtimesData['$values'];
        
        // Kiểm tra dữ liệu trước khi lọc
        console.log('Tất cả suất chiếu trước khi lọc:', showtimes);
        
        // Lọc ra các suất chiếu không bị ẩn và chưa kết thúc
        showtimes = showtimes.filter((showtime: Showtime) => {
          console.log(`Suất chiếu ${showtime.showtime_ID}, status: '${showtime.status}'`);
          
          // Check if showtime is hidden
          if (showtime.status === 'Hidden' || showtime.status.trim() === 'Hidden') {
            return false;
          }

          // Check if showtime has passed
          const now = new Date();
          const showDate = new Date(showtime.show_Date);
          const [hours, minutes] = showtime.start_Time.split(':').map(Number);
          showDate.setHours(hours, minutes, 0, 0);

          return showDate > now;
        });
        
        // Kiểm tra dữ liệu sau khi lọc
        console.log('Suất chiếu sau khi lọc:', showtimes);

        const moviesResponse = await fetch('https://localhost:7168/api/Movie', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!moviesResponse.ok) {
          throw new Error('Failed to fetch movies');
        }

        const moviesData = await moviesResponse.json();
        const movies = moviesData['$values'];

        // Merge showtimes with movie details
        const mergedShowtimes = showtimes.map((showtime: Showtime) => {
          const movie = movies.find((movie: Movie) => movie.movie_ID === showtime.movie_ID);
          return { ...showtime, movie };
        });

        // Kiểm tra lại sau khi merge
        console.log('Merged showtimes:', mergedShowtimes);
        
        setShowtimes(mergedShowtimes);
        setMovies(movies);
      } catch (err) {
        setError('Error fetching data, please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimesAndMovies();
  }, []);

  // Filter showtimes based on selected date
  useEffect(() => {
    if (showtimes.length > 0) {
      console.log('Current showtimes in state:', showtimes);
      
      const filtered = showtimes.filter((showtime) => {
        // Double-check status again
        if (showtime.status === 'Hidden') {
          console.log(`Bỏ qua suất chiếu ${showtime.showtime_ID} vì status = Hidden`);
          return false;
        }
        
        const showtimeDate = new Date(showtime.show_Date);
        return (
          showtimeDate.getDate() === selectedDate.getDate() &&
          showtimeDate.getMonth() === selectedDate.getMonth() &&
          showtimeDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      
      console.log('Filtered showtimes for date:', filtered);
      setFilteredShowtimes(filtered);
      
      // Group showtimes by movie_ID
      const grouped: Record<number, Showtime[]> = {};
      filtered.forEach(showtime => {
        if (!grouped[showtime.movie_ID]) {
          grouped[showtime.movie_ID] = [];
        }
        grouped[showtime.movie_ID].push(showtime);
      });
      
      console.log('Grouped showtimes:', grouped);
      setGroupedShowtimes(grouped);
    }
  }, [selectedDate, showtimes]);

  const getFormattedDate = (date: string) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handlePrevDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const checkAgeRestriction = (rating: string, age: number): boolean => {
    switch (rating) {
      case 'P18':
        return age >= 18;
      case 'P16':
        return age >= 16;
      case 'P13':
        return age >= 13;
      case 'P':
        return true;
      default:
        return true;
    }
  };

  const handleShowtimeClick = async (showtimeId: number, movieId: number) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Get user profile to check age
      const profileResponse = await axios.get('https://localhost:7168/api/Auth/profile', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const userProfile = profileResponse.data;
      const userAge = calculateAge(userProfile.date_Of_Birth);

      // Get movie details to check rating
      const movieResponse = await axios.get(`https://localhost:7168/api/Movie/${movieId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const movieDetails = movieResponse.data;
      const movieRating = movieDetails.rating;

      // Check if user meets age requirement
      if (!checkAgeRestriction(movieRating, userAge)) {
        toast.error(`Bạn chưa đủ tuổi để xem phim này. Phim yêu cầu độ tuổi: ${movieRating}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      // Continue with existing booking check logic
      const response = await axios.get('https://localhost:7168/api/Booking/check-pending', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.data;
      
      if (data.canCreateNewBooking) {
        navigate(`/cinema-room/${showtimeId}?movieId=${movieId}`);
      } else {
        setPendingBookingId(data.pendingBooking.booking_ID);
        setSelectedShowtimeInfo({ showtimeId, movieId });
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error('Error checking booking eligibility:', error);
      toast.error("Có lỗi xảy ra khi kiểm tra thông tin. Vui lòng thử lại sau.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleCancelBooking = async () => {
    try {
      if (!pendingBookingId) return;
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.put(
        `https://localhost:7168/api/Booking/${pendingBookingId}/cancel`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        toast.success("Đã hủy đơn đặt vé thành công!");
        setIsModalVisible(false);
        // Navigate to new booking if there was a selected showtime
        if (selectedShowtimeInfo) {
          navigate(`/cinema-room/${selectedShowtimeInfo.showtimeId}?movieId=${selectedShowtimeInfo.movieId}`);
        }
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      toast.error("Có lỗi xảy ra khi hủy đơn đặt vé. Vui lòng thử lại sau.");
    }
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  // Generate calendar days for the current month view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Total days in month
    const daysInMonth = lastDay.getDate();
    
    // Array to hold all calendar days
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Check if a date has showtimes
  const hasShowtimes = (date: Date) => {
    return showtimes.some((showtime) => {
      const showtimeDate = new Date(showtime.show_Date);
      return (
        showtime.status !== 'Hidden' &&
        showtimeDate.getDate() === date.getDate() &&
        showtimeDate.getMonth() === date.getMonth() &&
        showtimeDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Sort showtimes by start_Time
  const sortShowtimesByTime = (showtimes: Showtime[]) => {
    return [...showtimes].sort((a, b) => {
      return a.start_Time.localeCompare(b.start_Time);
    });
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <ToastContainer />
      <Modal
        title="Đơn đặt vé chưa thanh toán"
        open={isModalVisible}
        onOk={handleCancelBooking}
        onCancel={() => setIsModalVisible(false)}
        okText="Hủy đơn đặt vé"
        cancelText="Đóng"
        okButtonProps={{ type: 'primary', danger: true }}
      >
        <p>Bạn đang có đơn đặt vé chưa thanh toán. Bạn có muốn hủy đơn đặt vé này để tiếp tục đặt vé mới không?</p>
      </Modal>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Showtimes</h2>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </button>
          </div>

          {/* Monthly Calendar */}
          {showCalendar && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl shadow-lg p-4 mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-medium">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {/* Weekday headers */}
                {weekdays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day && (
                      <button
                        onClick={() => setSelectedDate(day)}
                        className={`w-full h-full flex items-center justify-center rounded-lg transition-all ${
                          selectedDate.toDateString() === day.toDateString()
                            ? 'bg-blue-600 text-white'
                            : hasShowtimes(day)
                            ? 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                            : 'hover:bg-gray-100'
                        } ${
                          new Date().toDateString() === day.toDateString() && selectedDate.toDateString() !== day.toDateString()
                            ? 'border-2 border-blue-400'
                            : ''
                        }`}
                      >
                        {day.getDate()}
                        {hasShowtimes(day) && selectedDate.toDateString() !== day.toDateString() && (
                          <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full"></span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Date Selector */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <button onClick={handlePrevDate} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronLeft className="h-5 w-5" />
            </button>
            {[...Array(7)].map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() + index);
              return (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={index}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                    selectedDate.toDateString() === date.toDateString()
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : hasShowtimes(date)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </motion.button>
              );
            })}
            <button onClick={handleNextDate} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Showtimes */}
        {loading ? (
          <div className="text-center text-gray-600">Loading showtimes...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : Object.keys(groupedShowtimes).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 rounded-xl"
          >
            <p className="text-lg text-gray-600">No showtimes available for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedShowtimes).map(([movieId, movieShowtimes], idx) => {
              // Get the movie details from the first showtime
              const movie = movieShowtimes[0]?.movie;
              
              if (!movie) return null;
              
              // Sort showtimes by start time
              const sortedShowtimes = sortShowtimesByTime(movieShowtimes);
              
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                  key={movieId}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">{movie.movie_Name}</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">{movie.genre}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 mb-6">
                    <img src={movie.poster_URL} alt={movie.movie_Name} className="h-40 w-28 object-cover rounded-lg" />
                    <div className="text-gray-800 flex-1">
                      <p><strong>Directed by:</strong> {movie.director}</p>
                      <p><strong>Cast:</strong> {movie.cast}</p>
                      <p className="mt-4"><strong>Available showtimes:</strong></p>
                      
                      {/* Time slots similar to the image */}
                      <div className="flex flex-wrap gap-2 mt-2 w-full">
                        {sortedShowtimes.map((showtime) => (
                          <button
                            key={showtime.showtime_ID}
                            onClick={() => handleShowtimeClick(showtime.showtime_ID, parseInt(movieId))}
                            className="px-4 py-2 rounded-md text-center min-w-16 bg-purple-700 text-white hover:bg-purple-800 transition-all duration-200"
                          >
                            {showtime.start_Time}
                          </button>
                        ))}
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        <p>Room: {sortedShowtimes[0].room_Name}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ShowtimesPage;