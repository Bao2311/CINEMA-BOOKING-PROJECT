import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Film,
  Calendar,
  Clock,
  MapPin,
  Tag,
  RotateCcw,
  ChevronDown,
  Info,
  ChevronRight,
  Bot
} from 'lucide-react';
import api from '../../config/axios';

interface MovieCard {
  movie_ID: number;
  movie_Name: string;
  poster_URL?: string;
  duration: number;
  rating?: string;
  genre?: string;
  synopsis?: string;
}

interface ShowtimeCard {
  showtime_ID: number;
  movie_ID: number;
  movie_Name: string;
  poster_URL?: string;
  room_Name: string;
  room_Type: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  base_Price: number;
  capacity_Available: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  movies?: MovieCard[];
  showtimes?: ShowtimeCard[];
  suggestedActions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  '🎬 Phim đang chiếu hot nhất?',
  '🎟️ Tìm suất chiếu hôm nay',
  '🍿 Bảng giá vé & Combo bắp nước',
  '🔥 Gợi ý phim hành động',
  '📍 Địa chỉ rạp & Hướng dẫn check-in'
];

export const AiBookingAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! 👋 Tôi là **CinemaBot** - Trợ lý AI đặt vé thông minh của **STP Cinema** 🍿.\n\n' +
        'Tôi có thể giúp bạn tìm phim hay, tra cứu lịch chiếu, kiểm tra giá vé và dẫn bạn đến thẳng bước chọn ghế chỉ với 1 cú click! Bạn muốn xem phim gì hôm nay?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: DEFAULT_SUGGESTIONS
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại gần nhất
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await api.post('/AiAssistant/chat', {
        message: text,
        history
      });

      const data = response.data;

      // Hỗ trợ $values nếu API bọc dạng json references
      const movies = data.movies?.$values || data.movies || [];
      const showtimes = data.showtimes?.$values || data.showtimes || [];
      const suggestedActions = data.suggestedActions?.$values || data.suggestedActions || DEFAULT_SUGGESTIONS;

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Dạ tôi đã ghi nhận! Bạn cần hỗ trợ thêm thông tin gì nữa không?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        movies: movies.length > 0 ? movies : undefined,
        showtimes: showtimes.length > 0 ? showtimes : undefined,
        suggestedActions
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Xin lỗi bạn, kết nối đến trợ lý AI bị gián đoạn trong giây lát. Bạn có thể hỏi lại hoặc xem danh sách phim trực tiếp trên trang chủ nhé!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: DEFAULT_SUGGESTIONS
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content:
          'Cuộc trò chuyện đã được làm mới! 👋 Tôi có thể hỗ trợ bạn tìm phim, tra cứu suất chiếu hay giá vé thế nào?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: DEFAULT_SUGGESTIONS
      }
    ]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. NÚT KÍCH HOẠT FLOATING BUTTON (KHI CHƯA MỞ HOẶC THU NHỎ) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-red-600/50 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20"
          aria-label="Mở Trợ lý AI Đặt vé"
        >
          {/* Pulsing indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-[#0B0F19]"></span>
          </span>

          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-200 flex items-center gap-1">
              CinemaBot AI <span className="text-[10px] bg-red-800/80 px-1.5 py-0.2 rounded-full">Trợ lý</span>
            </span>
            <span className="text-sm font-bold text-white drop-shadow">Đặt vé thông minh</span>
          </div>
        </button>
      )}

      {/* 2. CỬA SỔ CHAT WINDOW */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[410px] transition-all duration-300 flex flex-col rounded-3xl bg-[#0F172A]/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl overflow-hidden ${
            isMinimized ? 'h-[70px]' : 'h-[620px] max-h-[85vh]'
          }`}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(220, 38, 38, 0.15)'
          }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] border-b border-slate-700/60 select-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0F172A] rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-wide">CinemaBot AI</h3>
                  <span className="text-[10px] font-semibold bg-red-600/30 text-red-400 border border-red-500/40 px-1.5 py-0.2 rounded-md">
                    24/7
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Trợ lý đặt vé STP Cinema
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="p-1.5 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* NỘI DUNG CHAT (NẾU KHÔNG THU NHỎ) */}
          {!isMinimized && (
            <>
              {/* MESSAGES LIST */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl transition-all shadow-md ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-tr-none'
                          : 'bg-[#1E293B]/90 border border-slate-700/60 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {/* Text content with simple markdown formatting */}
                      <div className="whitespace-pre-line leading-relaxed text-[13px]">
                        {msg.content.split('\n').map((line, idx) => {
                          // In đậm nếu có **
                          const boldParsed = line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          });
                          return (
                            <React.Fragment key={idx}>
                              {boldParsed}
                              {idx < msg.content.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* MOVIE CARDS (NẾU CÓ) */}
                      {msg.movies && msg.movies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                            <Film className="w-3 h-3" /> Phim liên quan:
                          </p>
                          <div className="space-y-2">
                            {msg.movies.map((movie) => (
                              <div
                                key={movie.movie_ID}
                                className="flex gap-2.5 p-2 bg-[#0B0F19]/80 rounded-xl border border-slate-700/60 hover:border-red-500/50 transition group"
                              >
                                {movie.poster_URL ? (
                                  <img
                                    src={movie.poster_URL}
                                    alt={movie.movie_Name}
                                    className="w-12 h-16 object-cover rounded-lg flex-shrink-0 shadow"
                                  />
                                ) : (
                                  <div className="w-12 h-16 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Film className="w-5 h-5 text-slate-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <h4 className="font-bold text-xs text-white truncate group-hover:text-red-400 transition">
                                      {movie.movie_Name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                                      <span className="bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded text-[10px]">
                                        {movie.rating || 'P'}
                                      </span>
                                      <span>•</span>
                                      <span>{movie.duration}p</span>
                                      {movie.genre && (
                                        <>
                                          <span>•</span>
                                          <span className="truncate max-w-[80px]">{movie.genre.split(',')[0]}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-2">
                                    <button
                                      onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                                      className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md transition font-medium"
                                    >
                                      Chi tiết
                                    </button>
                                    <button
                                      onClick={() => handleSendMessage(`Suất chiếu ${movie.movie_Name}`)}
                                      className="text-[11px] bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white px-2 py-1 rounded-md transition font-medium border border-red-500/40"
                                    >
                                      Xem lịch chiếu
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SHOWTIME CARDS (NẾU CÓ) */}
                      {msg.showtimes && msg.showtimes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Suất chiếu có thể đặt ngay:
                          </p>
                          <div className="space-y-2.5">
                            {msg.showtimes.map((st) => (
                              <div
                                key={st.showtime_ID}
                                className="p-3 bg-gradient-to-br from-[#0B0F19] to-[#161d31] rounded-xl border border-slate-700/80 hover:border-red-500/60 transition shadow-md flex gap-3 items-center group"
                              >
                                {/* Poster thumbnail */}
                                <div className="w-14 h-20 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700/60 relative group-hover:shadow-red-900/40 transition shadow">
                                  {st.poster_URL ? (
                                    <img
                                      src={st.poster_URL}
                                      alt={st.movie_Name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                      <Film className="w-6 h-6" />
                                    </div>
                                  )}
                                  <span className="absolute bottom-0 inset-x-0 bg-red-600/90 text-[9px] text-white font-bold text-center py-0.5">
                                    {st.room_Type || '2D'}
                                  </span>
                                </div>

                                {/* Movie details & showtime info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                                  <div>
                                    <h5
                                      className="text-[13px] font-bold text-white truncate leading-tight group-hover:text-red-400 transition"
                                      title={st.movie_Name}
                                    >
                                      🎬 {st.movie_Name}
                                    </h5>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-300">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                                        {st.room_Name}
                                      </span>
                                      <span className="text-slate-400">📅 {st.show_Date}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-md bg-red-600/20 border border-red-500/40 text-red-300 font-bold text-xs tracking-wide">
                                        {st.start_Time} ~ {st.end_Time}
                                      </span>
                                      <span className="text-xs font-bold text-amber-400">
                                        {formatPrice(st.base_Price)}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => navigate(`/cinema-room/${st.showtime_ID}?movieId=${st.movie_ID}`)}
                                      className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow hover:shadow-red-600/40 transition active:scale-95 flex-shrink-0"
                                    >
                                      🎟️ Đặt vé <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {msg.time}
                    </span>

                    {/* SUGGESTION ACTION PILLS */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                        {msg.suggestedActions.map((action, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleSendMessage(action)}
                            className="text-[11px] bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full transition duration-150 active:scale-95"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* TYPING INDICATOR */}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-[#1E293B] border border-slate-700/60 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-xs text-slate-400 ml-1">CinemaBot đang tìm kiếm...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-3 bg-[#0B0F19]/90 border-t border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 bg-[#1E293B]/80 rounded-2xl border border-slate-700/70 px-3 py-1.5 focus-within:border-red-500/70 focus-within:ring-1 focus-within:ring-red-500/50 transition">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi CinemaBot: phim gì hay, suất chiếu, giá vé..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className={`p-2 rounded-xl transition ${
                      inputMessage.trim() && !isLoading
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-600/30'
                        : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
                  <span>Trợ lý đặt vé STP Cinema AI</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Sẵn sàng 24/7
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AiBookingAssistant;
