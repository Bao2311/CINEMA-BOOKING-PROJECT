import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Filter, Clock, Star, Film,
  X, Zap, SlidersHorizontal, ArrowUpDown, ChevronDown
} from 'lucide-react';
import MovieCard from '../components/Movies/MovieCard';
import { Movie } from '../types';

const GENRES = [
  'Tất cả', 'Action', 'Adventure', 'Sci-Fi', 'Drama', 'Thriller',
  'Comedy', 'Horror', 'Fantasy', 'Animation', 'Crime'
];

const MoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeTab, setActiveTab] = useState<'all' | 'now' | 'coming'>('all');
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('rating');
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5204/api/Movie', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && Array.isArray(response.data.$values)) {
          setMovies(response.data.$values);
        } else if (Array.isArray(response.data)) {
          setMovies(response.data);
        } else {
          setError('Không thể tải danh sách phim.');
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu phim.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Sync search param
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);

  // Filtered and sorted movies
  const filteredMovies = movies
    .filter((m) => {
      // Tab filter
      if (activeTab === 'now' && m.status !== 'Now Showing') return false;
      if (activeTab === 'coming' && m.status !== 'Coming Soon') return false;

      // Genre filter
      if (
        selectedGenre !== 'Tất cả' &&
        !(m.genre || '').toLowerCase().includes(selectedGenre.toLowerCase())
      ) {
        return false;
      }

      // Rating filter
      if (minRating > 0 && parseFloat(m.rating || '0') < minRating) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const matchTitle = m.movie_Name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDirector = (m.director || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchCast = (m.cast || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchTitle && !matchDirector && !matchCast) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
      if (sortBy === 'newest') return new Date(b.release_Date).getTime() - new Date(a.release_Date).getTime();
      if (sortBy === 'title') return a.movie_Name.localeCompare(b.movie_Name);
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Film className="h-8 w-8 text-red-500" />
            Khám phá điện ảnh
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Tìm kiếm và lựa chọn những bộ phim đặc sắc nhất đang chiếu và sắp ra mắt
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-[#161D2F] border border-white/10 rounded-2xl p-4 lg:p-6 mb-8 shadow-xl space-y-4">
          {/* Top Row: Tabs + Search + Sort */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Status Tabs */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1 flex-shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tất cả ({movies.length})
              </button>
              <button
                onClick={() => setActiveTab('now')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
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
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'coming'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Sắp chiếu
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên phim, đạo diễn, diễn viên..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-red-500/50 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort & Rating */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 lg:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 text-gray-300 rounded-xl pl-4 pr-9 py-2.5 text-sm focus:outline-none focus:border-red-500/50 cursor-pointer"
                >
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="newest">Mới phát hành</option>
                  <option value="title">Tên phim (A-Z)</option>
                  <option value="duration">Thời lượng dài nhất</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="appearance-none bg-white/5 border border-white/10 text-gray-300 rounded-xl pl-3 pr-8 py-2.5 text-sm focus:outline-none focus:border-red-500/50 cursor-pointer"
                >
                  <option value={0}>Tất cả ⭐</option>
                  <option value={7}>⭐ 7.0+</option>
                  <option value={8}>⭐ 8.0+</option>
                  <option value={8.5}>⭐ 8.5+</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bottom Row: Genre Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-hide border-t border-white/5">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap mr-1 flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-red-400" /> Thể loại:
            </span>
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  selectedGenre === genre
                    ? 'bg-red-600/20 border-red-500/50 text-red-400 font-bold shadow-lg shadow-red-500/10'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400 text-sm">
            Hiển thị <span className="text-white font-bold">{filteredMovies.length}</span> bộ phim
            {selectedGenre !== 'Tất cả' && <span className="text-red-400 font-semibold"> • {selectedGenre}</span>}
            {searchTerm && <span className="text-amber-400"> • Từ khóa: "{searchTerm}"</span>}
          </p>
        </div>

        {/* Movie Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-[#161D2F] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
                <div className="w-full bg-white/5" style={{ aspectRatio: '2/3' }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.movie_ID} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-[#161D2F] border border-white/10 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-bold text-white">Không tìm thấy bộ phim phù hợp</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-sm">
              Hãy thử chọn thể loại khác hoặc xóa bộ lọc tìm kiếm hiện tại.
            </p>
            <button
              onClick={() => {
                setSelectedGenre('Tất cả');
                setSearchTerm('');
                setActiveTab('all');
                setMinRating(0);
              }}
              className="mt-5 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
