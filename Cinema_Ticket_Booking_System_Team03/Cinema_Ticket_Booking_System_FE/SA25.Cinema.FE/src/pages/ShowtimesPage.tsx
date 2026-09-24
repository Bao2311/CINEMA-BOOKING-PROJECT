import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { format, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar as CalendarIcon, Clock, Star, Film,
  ChevronLeft, ChevronRight, Ticket, Tv, Search
} from 'lucide-react';
import { Modal } from 'antd';
import { toast } from 'react-toastify';
import { Movie, Showtime } from '../types';

const ShowtimesPage: React.FC = () => {
  const { movieId } = useParams<{ movieId?: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
  const [selectedShowtimeInfo, setSelectedShowtimeInfo] = useState<{ showtimeId: number; movieId: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 14 days list
  const dateList = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const [stRes, mvRes] = await Promise.all([
          axios.get('http://localhost:5204/api/Showtimes', { headers }),
          axios.get('http://localhost:5204/api/Movie', { headers }),
        ]);

        const stData = stRes.data?.$values || stRes.data || [];
        const mvData = mvRes.data?.$values || mvRes.data || [];
        setShowtimes(Array.isArray(stData) ? stData : []);
        setMovies(Array.isArray(mvData) ? mvData : []);
      } catch (err) {
        console.error('Error fetching showtimes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter showtimes by selected date and status
  const validShowtimes = showtimes.filter((st) => {
    if (!st.show_Date) return false;
    const d = new Date(st.show_Date);
    const dateMatch =
      isSameDay(d, selectedDate) ||
      format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    const statusMatch = st.status !== 'Hidden' && st.status !== 'Cancelled';
    const movieMatch = movieId ? st.movie_ID === parseInt(movieId) : true;
    return dateMatch && statusMatch && movieMatch;
  });

  // Group showtimes by Movie
  const showtimesByMovie = validShowtimes.reduce((acc, st) => {
    const mId = st.movie_ID;
    if (!acc[mId]) acc[mId] = [];
    acc[mId].push(st);
    return acc;
  }, {} as Record<number, Showtime[]>);

  // Filter movies that have showtimes on this date
  const filteredMovieIds = Object.keys(showtimesByMovie)
    .map(Number)
    .filter((mId) => {
      if (!searchQuery) return true;
      const m = movies.find((mov) => mov.movie_ID === mId);
      return m?.movie_Name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const handleBooking = async (showtimeId: number, targetMovieId: number) => {
    const token = localStorage.getItem('token');
    try {
      // Check if user has unpaid bookings
      const unpaidRes = await axios.get('http://localhost:5204/api/TicketBookings/user/unpaid', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (unpaidRes.status === 200 && unpaidRes.data && unpaidRes.data.length > 0) {
        setPendingBookingId(unpaidRes.data[0].booking_ID);
        setSelectedShowtimeInfo({ showtimeId, movieId: targetMovieId });
        setIsModalVisible(true);
        return;
      }
    } catch {
      // proceed directly
    }
    navigate(`/cinema-room/${showtimeId}?movieId=${targetMovieId}`);
  };

  const handleCancelBooking = async () => {
    if (!pendingBookingId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5204/api/TicketBookings/${pendingBookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã hủy đơn đặt vé thành công!');
      setIsModalVisible(false);
      if (selectedShowtimeInfo) {
        navigate(`/cinema-room/${selectedShowtimeInfo.showtimeId}?movieId=${selectedShowtimeInfo.movieId}`);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi hủy đơn vé.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-red-500" />
              Lịch chiếu phim
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Chọn ngày và giờ chiếu phù hợp để đặt vé nhanh chóng
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm phim theo tên..."
              className="w-full bg-[#161D2F] border border-white/10 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>

        {/* Date Selector Strip */}
        <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-4 mb-8 shadow-xl">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
            {dateList.map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-500/30 scale-105'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {index === 0 ? 'Hôm nay' : format(date, 'EEE', { locale: vi })}
                  </span>
                  <span className="text-2xl font-black mt-1">{format(date, 'dd')}</span>
                  <span className="text-xs opacity-70">Tháng {format(date, 'MM')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Showtimes by Movie list */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#161D2F] border border-white/10 rounded-2xl p-6 animate-pulse flex gap-6">
                <div className="w-28 h-40 bg-white/5 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-white/5 rounded w-1/3" />
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-10 bg-white/5 rounded-xl w-1/2 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMovieIds.length > 0 ? (
          <div className="space-y-6">
            {filteredMovieIds.map((mId) => {
              const movie = movies.find((m) => m.movie_ID === mId);
              const mShowtimes = (showtimesByMovie[mId] || []).sort((a, b) =>
                a.start_Time.localeCompare(b.start_Time)
              );

              if (!movie) return null;

              return (
                <div
                  key={mId}
                  className="bg-[#161D2F] border border-white/10 hover:border-white/20 rounded-2xl p-6 shadow-xl transition-all"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Movie Poster */}
                    <div
                      onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                      className="w-28 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0 cursor-pointer group relative"
                    >
                      <img
                        src={movie.poster_URL}
                        alt={movie.movie_Name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded">
                        {movie.rating || 'PG'}
                      </div>
                    </div>

                    {/* Movie Info & Showtimes */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3
                              onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                              className="text-xl sm:text-2xl font-bold text-white hover:text-red-400 cursor-pointer transition-colors"
                            >
                              {movie.movie_Name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                              {movie.duration > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-red-400" />
                                  {movie.duration} phút
                                </span>
                              )}
                              <span>•</span>
                              <span>{movie.genre}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                            className="hidden sm:flex text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg transition-colors"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>

                      {/* Showtimes Grid */}
                      <div className="mt-6">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Tv className="h-3.5 w-3.5 text-amber-400" /> Các suất chiếu trong ngày:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {mShowtimes.map((st) => (
                            <button
                              key={st.showtime_ID}
                              onClick={() => handleBooking(st.showtime_ID, movie.movie_ID)}
                              className="group flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500 hover:bg-red-500/15 transition-all shadow-md"
                            >
                              <span className="text-base font-bold text-white group-hover:text-red-400">
                                {st.start_Time?.substring(0, 5)}
                              </span>
                              <span className="text-[11px] text-gray-400 mt-0.5">
                                ~ {st.end_Time?.substring(0, 5)}
                              </span>
                              <span className="text-xs font-bold text-amber-400 mt-1.5">
                                {st.base_Price?.toLocaleString('vi-VN')} đ
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#161D2F] border border-white/10 rounded-2xl py-20 text-center">
            <Ticket className="h-12 w-12 mx-auto text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-white">Không có suất chiếu vào ngày này</h3>
            <p className="text-gray-400 text-sm mt-1">
              Hãy thử chọn một ngày khác trên thanh lịch phía trên.
            </p>
          </div>
        )}
      </div>

      {/* Unpaid Booking Modal */}
      <Modal
        title="Đơn đặt vé chưa thanh toán"
        open={isModalVisible}
        onOk={handleCancelBooking}
        onCancel={() => setIsModalVisible(false)}
        okText="Hủy đơn cũ & tiếp tục"
        cancelText="Đóng"
        okButtonProps={{ type: 'primary', danger: true }}
      >
        <p>Bạn đang có đơn đặt vé chưa thanh toán. Bạn có muốn hủy đơn cũ để đặt suất chiếu mới?</p>
      </Modal>
    </div>
  );
};

export default ShowtimesPage;
