import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import MovieDetail from '../components/Movies/MovieDetail';
import { Movie, Showtime } from '../types';
import axios from 'axios';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, MapPin, CreditCard, Users, Star, Film, ChevronLeft, ChevronRight, Info, AlertTriangle, Ticket, Heart, Share2, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GroupedShowtimes {
  [key: string]: Showtime[];
}

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filteredShowtimes, setFilteredShowtimes] = useState<Showtime[]>([]);
  const [groupedShowtimes, setGroupedShowtimes] = useState<GroupedShowtimes>({});
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<'showtimes' | 'details' | 'reviews'>('showtimes');

  // Generate dates for the next 14 days
  const nextTwoWeeks = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  }, []);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
     
      if (!token) {
        setError("Bạn cần đăng nhập để xem chi tiết phim.");
        setIsLoading(false);
        navigate('/login', { state: { from: `/movie/${id}` } });
        return;
      }

      try {
        // Fetch movie details
        const movieResponse = await axios.get(`https://localhost:7168/api/Movie/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMovie(movieResponse.data);

        // Check if movie is in favorites
        const favorites = JSON.parse(localStorage.getItem('favoriteMovies') || '[]');
        setIsFavorite(favorites.includes(Number(id)));

        // Fetch all showtimes
        const showtimesResponse = await axios.get('https://localhost:7168/api/Showtimes', {
          headers: { Authorization: `Bearer ${token}` },
        });
       
        const allShowtimes = showtimesResponse.data['$values'];
        const movieShowtimes = allShowtimes.filter((showtime: Showtime) =>
          showtime.movie_ID.toString() === id
        );
        
        // Sort showtimes by date and time
        const sortedShowtimes = movieShowtimes.sort((a: Showtime, b: Showtime) => {
          const dateA = new Date(`${a.show_Date}T${a.start_Time}`);
          const dateB = new Date(`${b.show_Date}T${b.start_Time}`);
          return dateA.getTime() - dateB.getTime();
        });
        
        setShowtimes(sortedShowtimes);
        
        // Fetch similar movies (based on genre)
        const allMoviesResponse = await axios.get('https://localhost:7168/api/Movie', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const allMovies = allMoviesResponse.data['$values'];
        const currentMovie = movieResponse.data;
        
        // Filter movies with the same genre, excluding the current movie
        const similar = allMovies
          .filter((m: Movie) => 
            m.movie_ID !== currentMovie.movie_ID && 
            m.genre.split(',').some((g: string) => 
              currentMovie.genre.split(',').includes(g.trim())
            )
          )
          .slice(0, 4); // Limit to 4 similar movies
        
        setSimilarMovies(similar);
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError('Không thể tải thông tin phim. Vui lòng thử lại sau.');
          console.error('Error fetching data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    } else {
      navigate('/movies');
    }
  }, [id, navigate]);

  useEffect(() => {
    if (showtimes.length > 0) {
      filterShowtimesByDate(selectedDate);
    }
  }, [selectedDate, showtimes]);

  const filterShowtimesByDate = (date: Date) => {
    const filtered = showtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.show_Date);
      return isSameDay(showtimeDate, date);
    });
    
    setFilteredShowtimes(filtered);
    
    // Group showtimes by room
    const grouped: GroupedShowtimes = {};
    filtered.forEach(showtime => {
      const roomKey = showtime.room_Name;
      if (!grouped[roomKey]) {
        grouped[roomKey] = [];
      }
      grouped[roomKey].push(showtime);
    });
    
    setGroupedShowtimes(grouped);
    
    // Reset selected room if it's not available for this date
    if (selectedRoom && !grouped[selectedRoom]) {
      setSelectedRoom(null);
    }
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteMovies') || '[]');
    const movieId = Number(id);
    
    if (isFavorite) {
      const updatedFavorites = favorites.filter((id: number) => id !== movieId);
      localStorage.setItem('favoriteMovies', JSON.stringify(updatedFavorites));
    } else {
      favorites.push(movieId);
      localStorage.setItem('favoriteMovies', JSON.stringify(favorites));
    }
    
    setIsFavorite(!isFavorite);
  };

  const shareMovie = () => {
    if (navigator.share) {
      navigator.share({
        title: movie?.movie_Name || 'Movie Details',
        text: `Check out ${movie?.movie_Name} at our cinema!`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((err) => console.error('Could not copy text: ', err));
    }
  };

  const hasShowtimes = (date: Date) => {
    return showtimes.some(showtime => {
      const showtimeDate = new Date(showtime.show_Date);
      return isSameDay(showtimeDate, date);
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin phim...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!movie) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <Film className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Không tìm thấy phim</h2>
            <p className="text-gray-500 mb-6">Phim bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <button 
              onClick={() => navigate('/movies')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Xem danh sách phim
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div>
      {/* Hero Section with Movie Backdrop */}
      <div className="relative w-full h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>
        <img 
          src={movie.backdrop_URL || movie.poster_URL} 
          alt={movie.movie_Name}
          className="w-full h-full object-cover object-top"
        />
        
        <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-end md:items-end gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-48 h-72 rounded-lg overflow-hidden shadow-2xl border-4 border-white flex-shrink-0 hidden md:block"
            >
              <img 
                src={movie.poster_URL} 
                alt={movie.movie_Name} 
                className="w-full h-full object-cover"
              />
            </motion.div>
            
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-yellow-500 text-black text-sm font-bold rounded-full flex items-center">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    {movie.rating}/10
                  </span>
                  <span className="text-white text-sm">{movie.genre}</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{movie.movie_Name}</h1>
                
                <div className="flex flex-wrap gap-4 text-gray-300 text-sm mb-6">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {movie.duration} phút
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(parseISO(movie.release_Date), 'dd/MM/yyyy')}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {movie.age_Restriction || 'Không giới hạn'}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsTrailerOpen(true)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center transition-colors"
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Xem Trailer
                  </button>
                  <button
                    onClick={() => setActiveTab('showtimes')}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
                  >
                    <Ticket className="h-5 w-5 mr-2" />
                    Đặt Vé
                  </button>
                  <button
                    onClick={toggleFavorite}
                    className={`p-3 rounded-lg flex items-center transition-colors ${
                      isFavorite 
                        ? 'bg-pink-600 text-white' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={shareMovie}
                    className="p-3 bg-white/20 text-white hover:bg-white/30 rounded-lg flex items-center transition-colors"
                    aria-label="Share movie"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('showtimes')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'showtimes' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lịch Chiếu
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'details' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Chi Tiết Phim
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reviews' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Đánh Giá
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'showtimes' && (
            <motion.div
              key="showtimes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Date Selection Carousel */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Chọn Ngày</h2>
                <div className="relative">
                  <button 
                    onClick={() => {
                      const container = document.getElementById('date-carousel');
                      if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100"
                    aria-label="Previous dates"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div 
                    id="date-carousel"
                    className="flex gap-3 overflow-x-auto py-2 px-8 hide-scrollbar snap-x"
                  >
                    {nextTwoWeeks.map((date, index) => {
                      const isSelected = isSameDay(date, selectedDate);
                      const hasShows = hasShowtimes(date);
                      const isToday = isSameDay(date, new Date());
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(date)}
                          className={`flex flex-col items-center min-w-[100px] p-4 rounded-xl transition-all snap-start ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                              : hasShows
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-400'
                          }`}
                          disabled={!hasShows}
                        >
                          <span className="text-sm font-medium">
                            {format(date, 'EEE', { locale: vi })}
                          </span>
                          <span className={`text-2xl font-bold ${isToday && !isSelected ? 'text-indigo-600' : ''}`}>
                            {format(date, 'd')}
                          </span>
                          <span className="text-sm">
                            {format(date, 'MMM', { locale: vi })}
                          </span>
                          {hasShows && !isSelected && (
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => {
                      const container = document.getElementById('date-carousel');
                      if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100"
                    aria-label="Next dates"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Room Selection */}
              {Object.keys(groupedShowtimes).length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Chọn Phòng</h2>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(groupedShowtimes).map((room) => (
                      <button
                        key={room}
                        onClick={() => setSelectedRoom(selectedRoom === room ? null : room)}
                        className={`px-6 py-3 rounded-lg transition-colors ${
                          selectedRoom === room
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {room}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Showtimes Display */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Suất Chiếu</h2>
                
                {filteredShowtimes.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Không có suất chiếu</h3>
                    <p className="text-gray-500">
                      Không có suất chiếu nào cho phim này vào ngày {format(selectedDate, 'dd/MM/yyyy')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedShowtimes)
                      .filter(([room]) => !selectedRoom || room === selectedRoom)
                      .map(([room, roomShowtimes]) => (
                        <div key={room} className="bg-white rounded-xl shadow-md overflow-hidden">
                          <div className="bg-gray-50 px-6 py-4 border-b">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
                                <h3 className="font-medium text-gray-900">{room}</h3>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <CreditCard className="h-4 w-4 mr-1" />
                                <span>{roomShowtimes[0].price_Tier}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <div className="flex flex-wrap gap-3">
                              {roomShowtimes.map((showtime) => (
                                <button
                                  key={showtime.showtime_ID}
                                  onClick={() => navigate(`/booking/${showtime.showtime_ID}`)}
                                  className="min-w-[100px] py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors flex flex-col items-center"
                                >
                                  <span className="font-medium">{showtime.start_Time}</span>
                                  <span className="text-xs text-gray-500">
                                    {showtime.base_Price.toLocaleString('vi-VN')}đ
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              
              {/* Similar Movies */}
              {similarMovies.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Phim Tương Tự</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {similarMovies.map((similarMovie) => (
                      <div 
                        key={similarMovie.movie_ID}
                        className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/movie/${similarMovie.movie_ID}`)}
                      >
                        <div className="aspect-[2/3] relative">
                          <img 
                            src={similarMovie.poster_URL} 
                            alt={similarMovie.movie_Name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-md flex items-center">
                            <Star className="h-3 w-3 fill-current mr-1" />
                            {similarMovie.rating}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 line-clamp-1">{similarMovie.movie_Name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{similarMovie.genre}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Thông Tin Phim</h2>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed mb-6">{movie.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Chi Tiết</h3>
                        <ul className="space-y-3">
                          <li className="flex">
                            <span className="text-gray-500 w-32">Đạo diễn:</span>
                            <span className="text-gray-900 font-medium">{movie.director}</span>
                          </li>
                          <li className="flex">
                            <span className="text-gray-500 w-32">Diễn viên:</span>
                            <span className="text-gray-900 font-medium">{movie.cast}</span>
                          </li>
                          <li className="flex">
                            <span className="text-gray-500 w-32">Thể loại:</span>
                            <span className="text-gray-900 font-medium">{movie.genre}</span>
                          </li>
                          <li className="flex">
                            <span className="text-gray-500 w-32">Khởi chiếu:</span>
                            <span className="text-gray-900 font-medium">
                              {format(parseISO(movie.release_Date), 'dd/MM/yyyy')}
                            </span>
                          </li>
                          <li className="flex">
                            <span className="text-gray-500 w-32">Thời lượng:</span>
                            <span className="text-gray-900 font-medium">{movie.duration} phút</span>
                          </li>
                          <li className="flex">
                            <span className="text-gray-500 w-32">Giới hạn tuổi:</span>
                            <span className="text-gray-900 font-medium">{movie.age_Restriction || 'Không giới hạn'}</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Đánh Giá</h3>
                        <div className="flex items-center mb-6">
                          <div className="bg-yellow-500 text-black text-2xl font-bold w-16 h-16 rounded-xl flex items-center justify-center mr-4">
                            {movie.rating}
                          </div>
                          <div>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < Math.floor(parseFloat(movie.rating) / 2)
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p
                             className="text-sm text-gray-500 mt-1">Dựa trên đánh giá của khán giả</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setActiveTab('reviews')}
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                          >
                            Xem tất cả đánh giá <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Movie Trailer Section */}
                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Trailer</h3>
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={`https://www.youtube.com/embed/${movie.trailer_URL?.split('v=')[1] || 'dQw4w9WgXcQ'}`}
                          title={`${movie.movie_Name} Trailer`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-1">
                    <div className="sticky top-24">
                      <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông Tin Vé</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">Giá vé từ</p>
                            <p className="text-xl font-bold text-gray-900">
                              {showtimes.length > 0 
                                ? `${Math.min(...showtimes.map(s => s.base_Price)).toLocaleString('vi-VN')}đ` 
                                : 'Chưa có thông tin'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Suất chiếu hiện có</p>
                            <p className="text-xl font-bold text-gray-900">{showtimes.length}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Ngày chiếu cuối</p>
                            <p className="text-xl font-bold text-gray-900">
                              {showtimes.length > 0 
                                ? format(
                                    new Date(Math.max(...showtimes.map(s => new Date(s.show_Date).getTime()))),
                                    'dd/MM/yyyy'
                                  )
                                : 'Chưa có thông tin'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <button
                            onClick={() => setActiveTab('showtimes')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Ticket className="h-5 w-5 mr-2" />
                            Đặt Vé Ngay
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Lưu ý</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                          <li className="flex items-start">
                            <Info className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                            Vui lòng đến trước giờ chiếu 15-30 phút để hoàn tất thủ tục
                          </li>
                          <li className="flex items-start">
                            <Info className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                            Không sử dụng thiết bị ghi hình trong phòng chiếu
                          </li>
                          <li className="flex items-start">
                            <Info className="h-5 w-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" />
                            Giá vé có thể thay đổi vào cuối tuần và ngày lễ
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh Giá & Bình Luận</h2>
                    
                    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Viết đánh giá của bạn</h3>
                        <div className="flex items-center mb-4">
                          <p className="mr-4 text-gray-700">Chấm điểm:</p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button key={i} className="text-gray-300 hover:text-yellow-500">
                                <Star className="h-6 w-6" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          rows={4}
                        ></textarea>
                        <div className="mt-4 flex justify-end">
                          <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg transition-colors">
                            Gửi Đánh Giá
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Sample reviews - in a real app, these would come from an API */}
                      {[
                        {
                          id: 1,
                          user: 'Nguyễn Văn A',
                          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                          rating: 4.5,
                          date: '12/03/2025',
                          content: 'Phim rất hay, diễn xuất của các diễn viên rất tự nhiên và chân thực. Cốt truyện lôi cuốn từ đầu đến cuối. Đặc biệt là phần âm nhạc rất phù hợp với từng cảnh quay.'
                        },
                        {
                          id: 2,
                          user: 'Trần Thị B',
                          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
                          rating: 5,
                          date: '10/03/2025',
                          content: 'Một trong những bộ phim hay nhất mà tôi từng xem. Tôi đã xem đi xem lại nhiều lần và vẫn cảm thấy thích thú. Khuyên mọi người nên xem ít nhất một lần trong đời.'
                        },
                        {
                          id: 3,
                          user: 'Lê Văn C',
                          avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
                          rating: 3,
                          date: '08/03/2025',
                          content: 'Phim có cốt truyện khá thú vị nhưng tiết tấu hơi chậm. Một số cảnh quay còn thiếu sự liền mạch. Tuy nhiên, diễn xuất của dàn diễn viên chính rất tốt.'
                        }
                      ].map((review) => (
                        <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                          <div className="flex items-start">
                            <img 
                              src={review.avatar} 
                              alt={review.user}
                              className="w-12 h-12 rounded-full mr-4"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-900">{review.user}</h4>
                                <span className="text-sm text-gray-500">{review.date}</span>
                              </div>
                              <div className="flex items-center mb-3">
                                <div className="flex mr-2">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < Math.floor(review.rating)
                                          ? 'text-yellow-500 fill-current'
                                          : i < review.rating
                                            ? 'text-yellow-500 fill-current opacity-50'
                                            : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-700">{review.rating}/5</span>
                              </div>
                              <p className="text-gray-700">{review.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-1">
                    <div className="sticky top-24">
                      <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Thống Kê Đánh Giá</h3>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="flex items-center">
                              <span className="w-8 text-sm text-gray-600">{star} sao</span>
                              <div className="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-500 rounded-full"
                                  style={{ 
                                    width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 8 : star === 2 ? 1 : 1}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="w-8 text-sm text-right text-gray-600">
                                {star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 8 : star === 2 ? 1 : 1}%
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600">Đánh giá trung bình</span>
                            <div className="flex items-center">
                              <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                              <span className="font-bold text-gray-900">{movie.rating}/10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Tổng số đánh giá</span>
                            <span className="font-bold text-gray-900">142</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-indigo-50 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-indigo-900 mb-4">Bạn đã xem phim này?</h3>
                        <p className="text-indigo-700 mb-4">Hãy chia sẻ cảm nhận của bạn và giúp người khác có quyết định đúng đắn!</p>
                        <button
                          onClick={() => {
                            document.querySelector('textarea')?.focus();
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors"
                        >
                          Viết Đánh Giá
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Trailer Modal */}
        {isTrailerOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl">
              <button
                onClick={() => setIsTrailerOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300"
                aria-label="Close trailer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${movie.trailer_URL?.split('v=')[1] || 'dQw4w9WgXcQ'}?autoplay=1`}
                  title={`${movie.movie_Name} Trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        )}
        
        {/* Custom CSS for hiding scrollbars */}
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    );
  };
  
  export default MovieDetailPage;
  