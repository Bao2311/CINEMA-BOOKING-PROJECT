import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play, Ticket, Star, Clock, ChevronLeft, ChevronRight,
  X, Search, Filter, ChevronDown, Flame, Zap, Sparkles,
  Calendar, Eye
} from 'lucide-react';
import MovieCard from '../components/Movies/MovieCard';
import axios from 'axios';
import { Movie } from '../types';

// ─────────────────────────────────────
// Skeleton Loader
// ─────────────────────────────────────
const MovieSkeleton = () => (
  <div className="flex flex-col bg-[#161D2F] rounded-2xl overflow-hidden border border-white/5">
    <div className="animate-pulse" style={{ aspectRatio: '2/3' }}>
      <div className="w-full h-full bg-white/5" />
    </div>
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-white/5 rounded-full" />
        <div className="h-5 w-12 bg-white/5 rounded-full" />
      </div>
      <div className="h-5 w-full bg-white/5 rounded" />
      <div className="h-5 w-3/4 bg-white/5 rounded" />
      <div className="h-10 w-full bg-white/5 rounded-xl" />
    </div>
  </div>
);

// ─────────────────────────────────────
// Genre Pills Data
// ─────────────────────────────────────
const GENRES = [
  'Tất cả', 'Action', 'Adventure', 'Sci-Fi', 'Drama', 'Thriller',
  'Comedy', 'Horror', 'Fantasy', 'Animation', 'Crime',
];

// ─────────────────────────────────────
// Extract YouTube ID
// ─────────────────────────────────────
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/);
  return match ? match[1] : null;
};

// ─────────────────────────────────────
// High-Resolution Landscape Backdrop & Poster Mapping
// ─────────────────────────────────────
const getMovieMedia = (movie: Movie) => {
  const name = (movie.movie_Name || '').toLowerCase();
  
  if (name.includes('avengers') || name.includes('endgame')) {
    return {
      backdrop: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
      poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/or06FN3Dka5tukK1e9sl16pB3iy.jpg'
    };
  }
  if (name.includes('spider') || name.includes('nhện')) {
    return {
      backdrop: 'https://image.tmdb.org/t/p/original/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg',
      poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg'
    };
  }
  if (name.includes('inception')) {
    return {
      backdrop: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
      poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
    };
  }
  if (name.includes('interstellar')) {
    return {
      backdrop: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
      poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
    };
  }
  if (name.includes('avatar')) {
    return {
      backdrop: 'https://image.tmdb.org/t/p/original/o075VitstqIgOi6zjqAmBAnZwFi.jpg',
      poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg'
    };
  }

  return {
    backdrop: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    poster: movie.poster_URL || 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/or06FN3Dka5tukK1e9sl16pB3iy.jpg'
  };
};

// ─────────────────────────────────────
// Showcase Hero Slide
// ─────────────────────────────────────
interface HeroSlideProps {
  movie: Movie;
  isActive: boolean;
  onTrailer: () => void;
}

const HeroSlide: React.FC<HeroSlideProps> = ({ movie, isActive, onTrailer }) => {
  const navigate = useNavigate();
  const ytId = getYouTubeId(movie.trailer_Link);
  const genres = movie.genre?.split(',').slice(0, 3) || [];
  const { backdrop, poster } = getMovieMedia(movie);

  return (
    <div
      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
        isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
      }`}
    >
      {/* ── Background Landscape Layer (Cinematic dark ambient with gradient fade) ── */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={backdrop}
          alt={movie.movie_Name}
          className="w-full h-full object-cover object-center filter brightness-[0.35] contrast-125 scale-105 transform transition-transform duration-10000 ease-out"
        />
        {/* Soft gradient masks to blend into page theme seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/70 to-[#0B0F19]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/80 to-transparent" />
      </div>

      {/* ── Showcase Content Layer (Split: Info Left + Floating 3D Poster Right) ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Movie Meta & Call-to-Actions (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Badges */}
            <div className="flex items-center flex-wrap gap-2.5 mb-4">
              <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 text-red-400 px-3.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-lg shadow-red-500/10">
                <Flame className="h-3.5 w-3.5 animate-pulse text-red-500" />
                TRENDING NOW
              </div>
              <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                movie.status === 'Now Showing' || movie.status === 'NowShowing'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${movie.status === 'Now Showing' || movie.status === 'NowShowing' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {movie.status === 'Now Showing' || movie.status === 'NowShowing' ? 'ĐANG CHIẾU' : 'SẮP CHIẾU'}
              </div>
            </div>

            {/* Movie Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight mb-4 tracking-tight drop-shadow-lg">
              {movie.movie_Name}
            </h1>

            {/* Quick Meta Row */}
            <div className="flex items-center flex-wrap gap-3.5 mb-5 text-sm">
              {movie.rating && (
                <div className="flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 text-amber-400 px-3 py-1 rounded-lg font-bold">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{movie.rating}</span>
                  <span className="text-gray-400 text-xs font-normal">/ 10</span>
                </div>
              )}
              {movie.duration > 0 && (
                <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                  <Clock className="h-4 w-4 text-red-400" />
                  <span>{movie.duration} phút</span>
                </div>
              )}
              {genres.map((g, i) => (
                <span
                  key={i}
                  className="text-xs font-medium text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full"
                >
                  {g.trim()}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-8 line-clamp-3 max-w-xl">
              {movie.synopsis || 'Khám phá câu chuyện điện ảnh đặc sắc tại CinemaPlus với chất lượng âm thanh và hình ảnh hàng đầu.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {movie.status === 'Now Showing' || movie.status === 'NowShowing' ? (
                <button
                  onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-500/40 hover:shadow-red-500/60 hover:-translate-y-0.5"
                >
                  <Ticket className="h-5 w-5" />
                  Đặt vé ngay
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/movie/${movie.movie_ID}`)}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-all hover:-translate-y-0.5"
                >
                  Xem chi tiết
                </button>
              )}

              {ytId && (
                <button
                  onClick={onTrailer}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl backdrop-blur-md transition-all hover:-translate-y-0.5 group"
                >
                  <div className="w-6 h-6 rounded-full bg-red-600/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-3 w-3 text-white fill-current ml-0.5" />
                  </div>
                  Xem Trailer
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Sharp 3D Floating Poster Card (5 Cols) */}
          <div className="lg:col-span-5 hidden lg:flex justify-center items-center">
            <div className="relative group">
              {/* Ambient Glow behind poster */}
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              
              {/* Poster Card */}
              <div className="relative w-72 xl:w-80 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/80 transform group-hover:scale-[1.02] transition-all duration-300">
                <img
                  src={poster}
                  alt={movie.movie_Name}
                  className="w-full h-full object-cover"
                />
                
                {/* Floating Tags */}
                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg shadow-red-500/40">
                  {movie.status === 'Now Showing' || movie.status === 'NowShowing' ? '● ĐANG CHIẾU' : '⏳ SẮP CHIẾU'}
                </div>

                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm border border-white/20 text-amber-400 text-xs font-black px-2.5 py-1 rounded-md flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {movie.rating || '8.8'}
                </div>

                {/* Hover Play Overlay */}
                {ytId && (
                  <div
                    onClick={onTrailer}
                    className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer gap-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl shadow-red-500/60 transform group-hover:scale-110 transition-transform">
                      <Play className="h-7 w-7 text-white fill-current ml-1" />
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/60 px-3 py-1 rounded-full border border-white/20">
                      Bấm xem trailer
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────
// Main HomePage Component
// ─────────────────────────────────────
const HomePage: React.FC = () => {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [activeTab, setActiveTab] = useState<'now' | 'coming'>('now');
  const [activeGenre, setActiveGenre] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');

  // Trailer modal
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const isNowShowing = (s?: string) => s === 'Now Showing' || s === 'NowShowing';
  const isComingSoon = (s?: string) => s === 'Coming Soon' || s === 'ComingSoon';

  // Fetch movies from API
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await axios.get('http://localhost:5204/api/Movie', { headers });
        let movies: Movie[] = [];
        if (Array.isArray(res.data)) {
          movies = res.data;
        } else if (res.data && Array.isArray(res.data.$values)) {
          movies = res.data.$values;
        }
        if (movies.length > 0) {
          setAllMovies(movies);
          const hero = [...movies]
            .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
            .slice(0, 5);
          setHeroMovies(hero);
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovies();
  }, []);

  // Hero carousel auto-rotation
  useEffect(() => {
    if (heroMovies.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentHeroIndex((p) => (p + 1) % heroMovies.length);
    }, 6500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [heroMovies.length]);

  const prevHero = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentHeroIndex((p) => (p - 1 + heroMovies.length) % heroMovies.length);
  };

  const nextHero = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentHeroIndex((p) => (p + 1) % heroMovies.length);
  };

  // Filter logic
  const filteredMovies = allMovies
    .filter((m) => {
      const tabMatch =
        activeTab === 'now' ? isNowShowing(m.status) : isComingSoon(m.status);
      const genreMatch =
        activeGenre === 'Tất cả' || (m.genre || '').toLowerCase().includes(activeGenre.toLowerCase());
      const searchMatch =
        !searchQuery || m.movie_Name.toLowerCase().includes(searchQuery.toLowerCase());
      return tabMatch && genreMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
      if (sortBy === 'newest') return new Date(b.release_Date).getTime() - new Date(a.release_Date).getTime();
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      return 0;
    });

  const ytId = trailerMovie ? getYouTubeId(trailerMovie.trailer_Link) : null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      {/* ───── HERO SHOWCASE SECTION ───── */}
      <section className="relative min-h-[620px] lg:h-[720px] overflow-hidden bg-[#0B0F19]">
        {isLoading ? (
          <div className="absolute inset-0 bg-[#161D2F] animate-pulse" />
        ) : heroMovies.length > 0 ? (
          <>
            {heroMovies.map((movie, i) => (
              <HeroSlide
                key={movie.movie_ID}
                movie={movie}
                isActive={i === currentHeroIndex}
                onTrailer={() => setTrailerMovie(movie)}
              />
            ))}

            {/* Navigation Arrows */}
            {heroMovies.length > 1 && (
              <>
                <button
                  onClick={prevHero}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-red-600 transition-all z-20 shadow-xl"
                  title="Phim trước"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextHero}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-red-600 transition-all z-20 shadow-xl"
                  title="Phim tiếp theo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Bottom Slider Indicators with Movie Titles */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
              {heroMovies.map((m, i) => (
                <button
                  key={m.movie_ID}
                  onClick={() => {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setCurrentHeroIndex(i);
                  }}
                  className={`transition-all duration-300 rounded-full h-2.5 ${
                    i === currentHeroIndex
                      ? 'w-10 bg-red-600 shadow-lg shadow-red-500/50'
                      : 'w-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                  title={m.movie_Name}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

      {/* ───── FILTER & DISCOVERY BAR ───── */}
      <section className="sticky top-16 z-30 bg-[#0B0F19]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex flex-col gap-4">
            {/* Tabs + Search + Sort Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Tab switcher */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setActiveTab('now')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'now'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Đang chiếu
                </button>
                <button
                  onClick={() => setActiveTab('coming')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'coming'
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Sắp chiếu
                </button>
              </div>

              {/* Search */}
              <div className="flex-1 min-w-[220px] relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm phim..."
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-all"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 text-gray-300 rounded-xl pl-4 pr-9 py-2.5 text-sm focus:outline-none focus:border-red-500/50 cursor-pointer"
                >
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="newest">Mới nhất</option>
                  <option value="duration">Thời lượng</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Genre Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    activeGenre === genre
                      ? 'bg-red-600/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/10'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── MOVIE GRID ───── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">
              {activeTab === 'now' ? '🎬 Phim đang chiếu' : '🎭 Phim sắp chiếu'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {filteredMovies.length} bộ phim {activeGenre !== 'Tất cả' ? `• ${activeGenre}` : ''}
            </p>
          </div>
          <Link
            to="/movies"
            className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors font-medium"
          >
            Xem tất cả →
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
            {Array.from({ length: 12 }).map((_, i) => <MovieSkeleton key={i} />)}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.movie_ID} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400">Không tìm thấy phim</h3>
            <p className="text-gray-600 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <button
              onClick={() => { setActiveGenre('Tất cả'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 text-sm text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-all"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </section>

      {/* ───── PROMO BANNER ───── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-900/50 via-red-800/30 to-indigo-900/50 border border-red-500/20 p-8 lg:p-12">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                🎁 ƯU ĐÃI ĐẶC BIỆT
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-3">
                Giảm 10% cho lần đặt vé đầu tiên
              </h2>
              <p className="text-gray-400 text-sm max-w-md">
                Dùng mã <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">WELCOME10</span> khi thanh toán để nhận ưu đãi ngay hôm nay.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                to="/movies"
                className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-500/30 hover:scale-105"
              >
                <Ticket className="h-5 w-5" />
                Đặt vé ngay
              </Link>
              <Link
                to="/promotion"
                className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-2xl transition-all"
              >
                Xem tất cả ưu đãi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── TRAILER MODAL ───── */}
      {trailerMovie && ytId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setTrailerMovie(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                title={trailerMovie.movie_Name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <button
              onClick={() => setTrailerMovie(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white font-semibold">{trailerMovie.movie_Name} — Trailer chính thức</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
