import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar, Clock, MapPin, Users, Star, Film,
  ChevronLeft, Play, Ticket, Sparkles, X, Tv, ArrowLeft, Tag
} from 'lucide-react';
import { Modal } from 'antd';
import { toast } from 'react-toastify';
import { Movie, Showtime } from '../types';
import { API_URL } from '../config/apiUrl';

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/);
  return match ? match[1] : null;
};

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);
  const [selectedShowtimeInfo, setSelectedShowtimeInfo] = useState<{ showtimeId: number; movieId: number } | null>(null);

  // Generate 14 days
  const dateList = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    const fetchDetails = async () => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const [movieRes, showtimeRes] = await Promise.all([
          axios.get(`${API_URL}/Movie/${id}`, { headers }),
          axios.get(`${API_URL}/Showtimes/movie/${id}`, { headers })
            .catch(() => ({ data: { dates: { $values: [] } } })),
        ]);

        setMovie(movieRes.data);
        
        // Giải nén cấu trúc phân cấp từ API showtimes/movie/{id}
        const rawDates = showtimeRes.data?.dates?.$values || showtimeRes.data?.dates || [];
        const allShowtimes: any[] = [];
        if (Array.isArray(rawDates)) {
          rawDates.forEach((dateObj: any) => {
            const dateStr = dateObj.show_Date;
            const rawSt = dateObj.showtimes?.$values || dateObj.showtimes || [];
            if (Array.isArray(rawSt)) {
              rawSt.forEach((st: any) => {
                allShowtimes.push({
                  ...st,
                  show_Date: dateStr,
                  cinema_Room_ID: st.cinema_Room_ID || st.room?.cinema_Room_ID,
                  room_Name: st.room_Name || st.room?.room_Name
                });
              });
            }
          });
        } else if (Array.isArray(showtimeRes.data?.$values)) {
          allShowtimes.push(...showtimeRes.data.$values);
        } else if (Array.isArray(showtimeRes.data)) {
          allShowtimes.push(...showtimeRes.data);
        }

        setShowtimes(allShowtimes);
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Filter showtimes for selected date
  const selectedDateShowtimes = showtimes.filter((st) => {
    if (!st.show_Date) return false;
    const d = new Date(st.show_Date);
    const dateMatches =
      isSameDay(d, selectedDate) ||
      format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    return dateMatches && st.status !== 'Hidden' && st.status !== 'Cancelled';
  });

  // Group by room
  const showtimesByRoom = selectedDateShowtimes.reduce((acc, curr) => {
    const roomKey = curr.room_Name || (curr.cinema_Room_ID ? `Phòng ${curr.cinema_Room_ID}` : 'Phòng Tiêu Chuẩn');
    if (!acc[roomKey]) acc[roomKey] = [];
    acc[roomKey].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  const handleBooking = (showtimeId: number) => {
    navigate(`/cinema-room/${showtimeId}?movieId=${id}`);
  };

  const handleCancelBooking = async () => {
    if (!pendingBookingId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/TicketBookings/${pendingBookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã hủy đơn đặt vé thành công!');
      setIsModalVisible(false);
      if (selectedShowtimeInfo) {
        navigate(`/cinema-room/${selectedShowtimeInfo.showtimeId}?movieId=${selectedShowtimeInfo.movieId}`);
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi hủy đơn vé.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold">Không tìm thấy phim</h2>
        <button
          onClick={() => navigate('/movies')}
          className="mt-4 px-6 py-2.5 bg-red-600 rounded-xl text-white font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const ytId = getYouTubeId(movie.trailer_Link);
  const genres = movie.genre?.split(',') || [];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pb-20">
      {/* ───── HERO BACKDROP ───── */}
      <div className="relative h-[480px] lg:h-[560px] w-full overflow-hidden">
        <img
          src={movie.poster_URL}
          alt={movie.movie_Name}
          className="w-full h-full object-cover filter blur-sm scale-105 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-transparent to-[#0B0F19]" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 border border-white/10 rounded-xl text-sm font-medium backdrop-blur-md transition-all z-10"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
      </div>

      {/* ───── MAIN CONTENT CONTAINER ───── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-72 lg:-mt-80 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Poster Column */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 w-full max-w-[320px] aspect-[2/3] group">
              <img
                src={movie.poster_URL}
                alt={movie.movie_Name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-lg shadow-red-500/40">
                {movie.status === 'Now Showing' ? 'ĐANG CHIẾU' : 'SẮP CHIẾU'}
              </div>
              <div className="absolute top-3 right-3 bg-amber-500 text-black font-black text-xs px-2.5 py-1 rounded-md shadow-lg">
                {movie.rating || 'PG'}
              </div>

              {ytId && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                >
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl shadow-red-500/50">
                    <Play className="h-7 w-7 text-white fill-current ml-1" />
                  </div>
                  <span className="text-white text-sm font-semibold">Xem Trailer</span>
                </button>
              )}
            </div>

            {/* Quick Actions under poster */}
            {ytId && (
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="w-full max-w-[320px] mt-4 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-semibold transition-all"
              >
                <Play className="h-4 w-4 fill-current text-red-500" />
                Xem Trailer chính thức
              </button>
            )}
          </div>

          {/* Details Column */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              {movie.movie_Name}
            </h1>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {movie.rating && (
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-lg text-sm font-bold">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{movie.rating} / 10</span>
                </div>
              )}
              {movie.duration > 0 && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-lg text-sm">
                  <Clock className="h-4 w-4 text-red-400" />
                  <span>{movie.duration} phút</span>
                </div>
              )}
              {movie.release_Date && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-lg text-sm">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>{format(new Date(movie.release_Date), 'dd/MM/yyyy')}</span>
                </div>
              )}
            </div>

            {/* Genre Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {genres.map((g, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300"
                >
                  {g.trim()}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> Nội dung phim
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {movie.synopsis || 'Đang cập nhật nội dung...'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10 text-sm">
                <div>
                  <span className="text-gray-400">Đạo diễn:</span>
                  <p className="text-white font-medium mt-0.5">{movie.director || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Diễn viên:</span>
                  <p className="text-white font-medium mt-0.5">{movie.cast || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Ngôn ngữ:</span>
                  <p className="text-white font-medium mt-0.5">{movie.language || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Quốc gia:</span>
                  <p className="text-white font-medium mt-0.5">{movie.country || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* ───── SHOWTIMES SELECTOR ───── */}
            <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-red-500" /> Lịch chiếu & Đặt vé
                </h3>
              </div>

              {/* Date Scroll Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6 border-b border-white/10">
                {dateList.map((date, index) => {
                  const isSelected = isSameDay(date, selectedDate);
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {index === 0 ? 'Hôm nay' : format(date, 'EEE', { locale: vi })}
                      </span>
                      <span className="text-lg font-black mt-1">{format(date, 'dd')}</span>
                      <span className="text-[10px] opacity-70">{format(date, 'MM')}</span>
                    </button>
                  );
                })}
              </div>

              {/* Showtimes List */}
              {Object.keys(showtimesByRoom).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(showtimesByRoom).map(([roomName, roomShowtimes]) => (
                    <div key={roomName} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <Tv className="h-4 w-4 text-amber-400" />
                        <span>{roomName}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {roomShowtimes.map((st) => (
                          <button
                            key={st.showtime_ID}
                            onClick={() => handleBooking(st.showtime_ID)}
                            className="group flex flex-col p-3 rounded-xl bg-white/5 border border-white/10 hover:border-red-500 hover:bg-red-500/10 transition-all text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-base font-bold text-white group-hover:text-red-400">
                                {st.start_Time?.substring(0, 5)}
                              </span>
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-medium">
                                {st.price_Tier || '2D'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 mt-1">
                              ~ {st.end_Time?.substring(0, 5)}
                            </span>
                            <span className="text-xs font-bold text-amber-400 mt-2">
                              {st.base_Price?.toLocaleString('vi-VN')} đ
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Ticket className="h-10 w-10 mx-auto text-gray-600 mb-3" />
                  <p className="font-semibold text-white">Chưa có suất chiếu vào ngày này</p>
                  <p className="text-xs text-gray-500 mt-1">Vui lòng chọn ngày khác để xem lịch chiếu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ───── TRAILER MODAL ───── */}
      {isTrailerOpen && ytId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setIsTrailerOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                title={movie.movie_Name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-black/60 border border-white/20 text-white hover:bg-white/20 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

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
        <p>Bạn đang có đơn đặt vé chưa thanh toán. Bạn có muốn hủy đơn này để tiến hành chọn ghế mới?</p>
      </Modal>
    </div>
  );
};

export default MovieDetailPage;
