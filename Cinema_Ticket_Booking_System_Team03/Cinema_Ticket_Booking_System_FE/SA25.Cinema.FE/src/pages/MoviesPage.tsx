import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiFilter, FiX, FiClock, FiCalendar, FiFlag,
  FiGlobe, FiStar, FiUser, FiFilm, FiChevronDown, FiSliders,
  FiCheck, FiTrash2, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiGrid, FiList, FiCalendar as FiCalendarIcon
} from 'react-icons/fi';
import { Tooltip } from 'react-tooltip';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import debounce from 'lodash/debounce';


interface Movie {
  movie_ID: string;
  movie_Name: string;
  director: string;
  release_Date: string;
  end_Date: string;
  genre: string;
  synopsis: string;
  production_Company: string;
  duration: number;
  rating: string;
  language: string;
  country: string;
  poster_URL: string;
  trailer_Link: string;
}


interface Filters {
  searchTerm: string;
  director: string;
  releaseDate: Date | null;
  country: string;
  language: string;
  rating: string;
  genre: string[];
  durationRange: [number, number];
}


// Pagination settings
const ITEMS_PER_PAGE = 12;


const MoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<string>('genres');
  const [appliedFiltersCount, setAppliedFiltersCount] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
 
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
 
  const initialFilters: Filters = {
    searchTerm: '',
    director: '',
    releaseDate: null,
    country: '',
    language: '',
    rating: '',
    genre: [],
    durationRange: [0, 300]
  };
 
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);


  // Load filters from URL on initial load
  useEffect(() => {
    const searchTermParam = searchParams.get('search');
    const directorParam = searchParams.get('director');
    const releaseDateParam = searchParams.get('releaseDate');
    const countryParam = searchParams.get('country');
    const languageParam = searchParams.get('language');
    const ratingParam = searchParams.get('rating');
    const genreParam = searchParams.get('genre');
    const durationMinParam = searchParams.get('durationMin');
    const durationMaxParam = searchParams.get('durationMax');
    const pageParam = searchParams.get('page');
   
    const newFilters = { ...initialFilters };
   
    if (searchTermParam) newFilters.searchTerm = searchTermParam;
    if (directorParam) newFilters.director = directorParam;
    if (releaseDateParam) newFilters.releaseDate = new Date(releaseDateParam);
    if (countryParam) newFilters.country = countryParam;
    if (languageParam) newFilters.language = languageParam;
    if (ratingParam) newFilters.rating = ratingParam;
    if (genreParam) newFilters.genre = genreParam.split(',');
    if (durationMinParam && durationMaxParam) {
      newFilters.durationRange = [parseInt(durationMinParam), parseInt(durationMaxParam)];
    }
   
    setFilters(newFilters);
    setTempFilters(newFilters);
   
    if (pageParam) {
      setCurrentPage(parseInt(pageParam));
    }
  }, []);


  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
   
    if (filters.searchTerm) params.set('search', filters.searchTerm);
    if (filters.director) params.set('director', filters.director);
    if (filters.releaseDate) params.set('releaseDate', filters.releaseDate.toISOString());
    if (filters.country) params.set('country', filters.country);
    if (filters.language) params.set('language', filters.language);
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.genre.length > 0) params.set('genre', filters.genre.join(','));
    if (filters.durationRange[0] > 0 || filters.durationRange[1] < 300) {
      params.set('durationMin', filters.durationRange[0].toString());
      params.set('durationMax', filters.durationRange[1].toString());
    }
   
    params.set('page', currentPage.toString());
   
    setSearchParams(params);
  }, [filters, currentPage, setSearchParams]);


  // Effect để theo dõi số lượng filter đã áp dụng
  useEffect(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.director) count++;
    if (filters.releaseDate) count++;
    if (filters.country) count++;
    if (filters.language) count++;
    if (filters.rating) count++;
    if (filters.genre.length > 0) count++;
    if (filters.durationRange[0] > 0 || filters.durationRange[1] < 300) count++;
   
    setAppliedFiltersCount(count);
  }, [filters]);


  // Unique filter options derived from movies data
  const filterOptions = useMemo(() => {
    if (!movies.length) return {
      countries: [],
      languages: [],
      ratings: [],
      genres: [],
      directors: [],
      minDuration: 0,
      maxDuration: 300
    };
   
    // Extract all genres and flatten the array
    const allGenres = movies.flatMap(movie =>
      movie.genre.split(',').map(g => g.trim())
    );
   
    return {
      countries: [...new Set(movies.map(movie => movie.country))].sort(),
      languages: [...new Set(movies.map(movie => movie.language))].sort(),
      ratings: [...new Set(movies.map(movie => movie.rating))].sort(),
      genres: [...new Set(allGenres)].sort(),
      directors: [...new Set(movies.map(movie => movie.director))].sort(),
      minDuration: Math.min(...movies.map(movie => movie.duration)),
      maxDuration: Math.max(...movies.map(movie => movie.duration))
    };
  }, [movies]);


  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('https://localhost:7168/api/Movie');


        if (Array.isArray(response.data.$values)) {
          setMovies(response.data.$values);
         
          // Set initial duration range based on actual movie durations
          const minDuration = Math.min(...response.data.$values.map((movie: Movie) => movie.duration));
          const maxDuration = Math.max(...response.data.$values.map((movie: Movie) => movie.duration));
         
          setFilters(prev => ({
            ...prev,
            durationRange: [minDuration, maxDuration]
          }));
         
          setTempFilters(prev => ({
            ...prev,
            durationRange: [minDuration, maxDuration]
          }));
         
        } else {
          setError('Dữ liệu phim không hợp lệ.');
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
          setError("Không tìm thấy API phim. Vui lòng kiểm tra lại URL hoặc máy chủ.");
        } else {
          setError("Có lỗi xảy ra khi tải dữ liệu.");
        }
        console.error("Error fetching movies:", error);
      } finally {
        setIsLoading(false);
      }
    };


    fetchMovies();
  }, []);


  // Debounced search handler for instant filtering
  const debouncedSearchChange = useCallback(
    debounce((value: string) => {
      setFilters(prev => ({ ...prev, searchTerm: value }));
      setCurrentPage(1); // Reset to first page on search
    }, 300),
    []
  );


  const handleSearchChange = (value: string) => {
    setTempFilters(prev => ({ ...prev, searchTerm: value }));
    debouncedSearchChange(value);
  };


  const handleTempFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };


  const handleGenreToggle = (genre: string) => {
    setTempFilters(prev => {
      const currentGenres = [...prev.genre];
      if (currentGenres.includes(genre)) {
        return { ...prev, genre: currentGenres.filter(g => g !== genre) };
      } else {
        return { ...prev, genre: [...currentGenres, genre] };
      }
    });
  };


  const applyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1); // Reset to first page when applying new filters
  };


  const clearAllFilters = () => {
    const resetFilters = {
      ...initialFilters,
      durationRange: [
        filterOptions.minDuration || 0,
        filterOptions.maxDuration || 300
      ]
    };
    setFilters(resetFilters);
    setTempFilters(resetFilters);
    setCurrentPage(1); // Reset to first page when clearing filters
  };


  const resetCurrentTab = () => {
    switch (activeFilterTab) {
      case 'genres':
        setTempFilters(prev => ({ ...prev, genre: [] }));
        break;
      case 'ratings':
        setTempFilters(prev => ({ ...prev, rating: '' }));
        break;
      case 'countries':
        setTempFilters(prev => ({ ...prev, country: '' }));
        break;
      case 'languages':
        setTempFilters(prev => ({ ...prev, language: '' }));
        break;
      case 'directors':
        setTempFilters(prev => ({ ...prev, director: '' }));
        break;
      case 'duration':
        setTempFilters(prev => ({
          ...prev,
          durationRange: [filterOptions.minDuration || 0, filterOptions.maxDuration || 300]
        }));
        break;
      case 'dates':
        setTempFilters(prev => ({ ...prev, releaseDate: null }));
        break;
    }
  };


  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearchTerm = movie.movie_Name.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesDirector = !filters.director || movie.director.toLowerCase().includes(filters.director.toLowerCase());
     
      const matchesReleaseDate = !filters.releaseDate ||
        new Date(movie.release_Date).toDateString() === filters.releaseDate.toDateString();
     
      const matchesCountry = !filters.country || movie.country === filters.country;
      const matchesLanguage = !filters.language || movie.language === filters.language;
      const matchesRating = !filters.rating || movie.rating === filters.rating;
     
      const matchesGenre = filters.genre.length === 0 ||
        filters.genre.some(genre => movie.genre.toLowerCase().includes(genre.toLowerCase()));
     
      const matchesDuration = movie.duration >= filters.durationRange[0] &&
                              movie.duration <= filters.durationRange[1];
     
      return matchesSearchTerm && matchesDirector && matchesReleaseDate &&
             matchesCountry && matchesLanguage && matchesRating &&
             matchesGenre && matchesDuration;
    });
  }, [movies, filters]);


  // Movies for current page
  const currentMovies = useMemo(() => {
    const indexOfLastMovie = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstMovie = indexOfLastMovie - ITEMS_PER_PAGE;
    return filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  }, [filteredMovies, currentPage]);


  // Movies for calendar view - grouped by release date
  const calendarMovies = useMemo(() => {
    const moviesByDate: Record<string, Movie[]> = {};
   
    filteredMovies.forEach(movie => {
      const releaseDate = new Date(movie.release_Date).toDateString();
      if (!moviesByDate[releaseDate]) {
        moviesByDate[releaseDate] = [];
      }
      moviesByDate[releaseDate].push(movie);
    });
   
    return moviesByDate;
  }, [filteredMovies]);


  // Calculate total pages
  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);


  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleCardClick = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };


  // Function to check if a date has movies
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
   
    const dateString = date.toDateString();
    const hasMovies = calendarMovies[dateString] && calendarMovies[dateString].length > 0;
   
    if (hasMovies) {
      return (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full"></div>
      );
    }
   
    return null;
  };


  // Function to render movies for selected calendar date
  const renderCalendarDayMovies = () => {
    const dateString = calendarDate.toDateString();
    const moviesForDay = calendarMovies[dateString] || [];
   
    if (moviesForDay.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No movies released on this date</p>
        </div>
      );
    }
   
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {moviesForDay.map(movie => (
          <motion.div
            key={movie.movie_ID}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-md overflow-hidden flex"
            onClick={() => handleCardClick(movie.movie_ID)}
          >
            <div className="w-1/3">
              <img
                src={movie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Poster'}
                alt={movie.movie_Name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster';
                }}
              />
            </div>
            <div className="w-2/3 p-3">
              <h3 className="font-bold text-gray-900 mb-1">{movie.movie_Name}</h3>
              <p className="text-sm text-gray-600 mb-1">{movie.director}</p>
              <div className="flex items-center text-xs">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded mr-2">{movie.rating}</span>
                <span className="text-gray-500">{movie.duration} min</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-gray-900 mb-8 text-center"
        >
          Discover Movies
        </motion.h1>


        {/* Search and filter section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies by name..."
                value={tempFilters.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {tempFilters.searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )}
            </div>
           
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  showFilters
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {showFilters ? <FiX /> : <FiFilter />}
                {showFilters ? 'Close Filters' : 'Filter Movies'}
                {appliedFiltersCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs font-bold text-white bg-indigo-700 rounded-full">
                    {appliedFiltersCount}
                  </span>
                )}
              </button>
             
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1 px-3 py-2 ${
                    viewMode === 'grid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiGrid size={16} /> Grid
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1 px-3 py-2 ${
                    viewMode === 'calendar'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiCalendarIcon size={16} /> Calendar
                </button>
              </div>
            </div>
           
            {appliedFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FiTrash2 /> Clear All Filters
              </button>
            )}
          </div>


          {/* Advanced filters - Completely redesigned */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden"
              >
                {/* Filter tabs */}
                <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
                  {['genres', 'ratings', 'countries', 'languages', 'directors', 'duration', 'dates'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilterTab(tab)}
                      className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeFilterTab === tab
                          ? 'text-indigo-600 border-b-2 border-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
               
                {/* Filter content */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {activeFilterTab.charAt(0).toUpperCase() + activeFilterTab.slice(1)}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={resetCurrentTab}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <FiRefreshCw size={14} /> Reset
                      </button>
                    </div>
                  </div>
                 
                  {/* Genre filter */}
                  {activeFilterTab === 'genres' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.genres.map(genre => (
                          <button
                            key={genre}
                            onClick={() => handleGenreToggle(genre)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              tempFilters.genre.includes(genre)
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {tempFilters.genre.includes(genre) && <FiCheck className="inline mr-1" size={14} />}
                            {genre}
                          </button>
                        ))}
                      </div>
                      {filterOptions.genres.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No genres available</p>
                      )}
                    </div>
                  )}
                 
                  {/* Rating filter */}
                  {activeFilterTab === 'ratings' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {filterOptions.ratings.map(rating => (
                        <button
                          key={rating}
                          onClick={() => handleTempFilterChange('rating', rating === tempFilters.rating ? '' : rating)}
                          className={`px-4 py-3 rounded-lg text-center transition-all ${
                            tempFilters.rating === rating
                              ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 font-medium'
                              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                      {filterOptions.ratings.length === 0 && (
                        <p className="text-gray-500 text-center py-4 col-span-full">No ratings available</p>
                      )}
                    </div>
                  )}
                 
                  {/* Country filter */}
                  {activeFilterTab === 'countries' && (
                    <div>
                      <div className="relative mb-4">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search countries..."
                          className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          onChange={(e) => {
                            // This would filter the displayed countries, but we'll keep it simple
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                        {filterOptions.countries.map(country => (
                          <button
                            key={country}
                            onClick={() => handleTempFilterChange('country', country === tempFilters.country ? '' : country)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              tempFilters.country === country
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 font-medium'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {country}
                          </button>
                        ))}
                        {filterOptions.countries.length === 0 && (
                          <p className="text-gray-500 text-center py-4 col-span-full">No countries available</p>
                        )}
                      </div>
                    </div>
                  )}
                 
                  {/* Language filter */}
                  {activeFilterTab === 'languages' && (
                    <div>
                      <div className="relative mb-4">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search languages..."
                          className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          onChange={(e) => {
                            // This would filter the displayed languages, but we'll keep it simple
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                        {filterOptions.languages.map(language => (
                          <button
                            key={language}
                            onClick={() => handleTempFilterChange('language', language === tempFilters.language ? '' : language)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              tempFilters.language === language
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 font-medium'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {language}
                          </button>
                        ))}
                        {filterOptions.languages.length === 0 && (
                          <p className="text-gray-500 text-center py-4 col-span-full">No languages available</p>
                        )}
                      </div>
                    </div>
                  )}
                 
                  {/* Director filter */}
                  {activeFilterTab === 'directors' && (
                    <div>
                      <div className="relative mb-4">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by director name..."
                          value={tempFilters.director}
                          onChange={(e) => handleTempFilterChange('director', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {tempFilters.director && (
                          <button
                            onClick={() => handleTempFilterChange('director', '')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                     
                      {tempFilters.director && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested directors:</h4>
                          <div className="flex flex-wrap gap-2">
                            {filterOptions.directors
                              .filter(director =>
                                director.toLowerCase().includes(tempFilters.director.toLowerCase())
                              )
                              .slice(0, 8)
                              .map(director => (
                                <button
                                  key={director}
                                  onClick={() => handleTempFilterChange('director', director)}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                                >
                                  {director}
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                 
                  {/* Duration filter */}
                  {activeFilterTab === 'duration' && (
                    <div>
                      <div className="mb-8 px-4">
                        <Slider
                          range
                          min={filterOptions.minDuration || 0}
                          max={filterOptions.maxDuration || 300}
                          value={tempFilters.durationRange}
                          onChange={(value) => handleTempFilterChange('durationRange', value as [number, number])}
                          trackStyle={[{ backgroundColor: '#4f46e5' }]}
                          handleStyle={[
                            {
                              borderColor: '#4f46e5',
                              backgroundColor: '#4f46e5',
                              boxShadow: '0 0 0 5px rgba(79, 70, 229, 0.2)'
                            },
                            {
                              borderColor: '#4f46e5',
                              backgroundColor: '#4f46e5',
                              boxShadow: '0 0 0 5px rgba(79, 70, 229, 0.2)'
                            }
                          ]}
                          railStyle={{ backgroundColor: '#e5e7eb' }}
                        />
                      </div>
                     
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-gray-800">
                            {tempFilters.durationRange[0]}
                          </span>
                          <span className="text-sm text-gray-500">min</span>
                        </div>
                       
                        <div className="text-center">
                          <span className="block text-gray-500 text-sm">Duration Range</span>
                          <span className="block text-indigo-600 font-medium">
                            {tempFilters.durationRange[1] - tempFilters.durationRange[0]} minutes
                          </span>
                        </div>
                       
                        <div className="text-center">
                          <span className="block text-2xl font-bold text-gray-800">
                            {tempFilters.durationRange[1]}
                          </span>
                          <span className="text-sm text-gray-500">min</span>
                        </div>
                      </div>
                     
                      <div className="mt-6 grid grid-cols-4 gap-2">
                        {[60, 90, 120, 180].map(duration => (
                          <button
                            key={duration}
                            onClick={() => handleTempFilterChange('durationRange', [0, duration])}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                          >
                            Under {duration} min
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                 
                  {/* Date filter - Improved UI */}
                  {activeFilterTab === 'dates' && (
                    <div>
                      <div className="mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <DatePicker
                            selected={tempFilters.releaseDate}
                            onChange={(date) => handleTempFilterChange('releaseDate', date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Select release date"
                            isClearable
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            calendarClassName="date-picker-custom"
                            wrapperClassName="w-full"
                            popperClassName="date-picker-popper"
                            customInput={
                              <div className="relative w-full">
                                <input
                                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                                  placeholder="Select release date"
                                  value={tempFilters.releaseDate ? tempFilters.releaseDate.toLocaleDateString() : ''}
                                  readOnly
                                />
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                {tempFilters.releaseDate && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTempFilterChange('releaseDate', null);
                                    }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    <FiX />
                                  </button>
                                )}
                              </div>
                            }
                          />
                        </div>
                      </div>
                     
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <button
                          onClick={() => {
                            const today = new Date();
                            handleTempFilterChange('releaseDate', today);
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                        >
                          <FiCalendar size={14} /> Today
                        </button>
                        <button
                          onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            handleTempFilterChange('releaseDate', tomorrow);
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                        >
                          <FiCalendar size={14} /> Tomorrow
                        </button>
                        <button
                          onClick={() => {
                            const nextWeek = new Date();
                            nextWeek.setDate(nextWeek.getDate() + 7);
                            handleTempFilterChange('releaseDate', nextWeek);
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                        >
                          <FiCalendar size={14} /> Next Week
                        </button>
                        <button
                          onClick={() => {
                            const nextMonth = new Date();
                            nextMonth.setMonth(nextMonth.getMonth() + 1);
                            handleTempFilterChange('releaseDate', nextMonth);
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                        >
                          <FiCalendar size={14} /> Next Month
                        </button>
                      </div>
                     
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Popular time periods:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'This Year', value: new Date(new Date().getFullYear(), 0, 1) },
                            { label: 'Last Year', value: new Date(new Date().getFullYear() - 1, 0, 1) },
                            { label: 'Last 5 Years', value: new Date(new Date().getFullYear() - 5, 0, 1) },
                            { label: 'Last 10 Years', value: new Date(new Date().getFullYear() - 10, 0, 1) },
                            { label: '2000s', value: new Date(2000, 0, 1) },
                            { label: '1990s', value: new Date(1990, 0, 1) },
                          ].map((option) => (
                            <button
                              key={option.label}
                              onClick={() => handleTempFilterChange('releaseDate', option.value)}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
               
                {/* Action buttons */}
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {filteredMovies.length} movies match your filters
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={applyFilters}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <FiCheck size={16} /> Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Active filters display */}
        {appliedFiltersCount > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
             
              {filters.searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Search: {filters.searchTerm}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {filters.director && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Director: {filters.director}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, director: '' }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {filters.releaseDate && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Date: {filters.releaseDate.toLocaleDateString()}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, releaseDate: null }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {filters.country && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Country: {filters.country}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, country: '' }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {filters.language && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Language: {filters.language}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, language: '' }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {filters.rating && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Rating: {filters.rating}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, rating: '' }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {filters.genre.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Genres: {filters.genre.join(', ')}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, genre: [] }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {(filters.durationRange[0] > (filterOptions.minDuration || 0) ||
                filters.durationRange[1] < (filterOptions.maxDuration || 300)) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                  Duration: {filters.durationRange[0]}-{filters.durationRange[1]} min
                  <button
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      durationRange: [filterOptions.minDuration || 0, filterOptions.maxDuration || 300]
                    }))}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              )}
             
              {appliedFiltersCount > 1 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}


        {/* Results count */}
        <div className="mb-4 text-gray-600">
          {!isLoading && (
            <p className="text-sm">
              {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'} found
              {appliedFiltersCount > 0 ? ' matching your filters' : ''}
            </p>
          )}
        </div>


        {/* Calendar View */}
        {viewMode === 'calendar' && !isLoading && !error && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="calendar-container">
                  <Calendar
                    onChange={setCalendarDate}
                    value={calendarDate}
                    tileContent={tileContent}
                    className="w-full rounded-lg border-0 shadow-sm"
                  />
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Selected Date</h3>
                    <p className="text-indigo-600 font-medium">
                      {calendarDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {calendarMovies[calendarDate.toDateString()]?.length || 0} movies released
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Movies Released on {calendarDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <div className="overflow-y-auto max-h-[500px] pr-2">
                  {renderCalendarDayMovies()}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Movies grid - with pagination */}
        {viewMode === 'grid' && (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Loading movies...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm mb-4">
                <h3 className="text-lg font-semibold mb-2">Error</h3>
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentMovies.length > 0 ? (
                    currentMovies.map((movie: Movie) => (
                      <motion.div
                        key={movie.movie_ID}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        className="bg-white rounded-xl overflow-hidden shadow-lg cursor-pointer group"
                        onClick={() => handleCardClick(movie.movie_ID)}
                        data-tooltip-id={`movie-tooltip-${movie.movie_ID}`}
                      >
                        <div className="relative h-80 overflow-hidden">
                          <img
                            src={movie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Poster'}
                            alt={movie.movie_Name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <h2 className="text-xl font-bold text-white mb-1">{movie.movie_Name}</h2>
                            <p className="text-sm text-gray-200">{movie.director}</p>
                            <div className="flex items-center mt-2">
                              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded mr-2">{movie.rating}</span>
                              <span className="flex items-center text-gray-200 text-sm">
                                <FiClock className="mr-1" /> {movie.duration} min
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h2 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{movie.movie_Name}</h2>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{movie.genre}</p>
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{movie.synopsis}</p>
                         
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(movie.trailer_Link, '_blank');
                            }}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Watch Trailer
                          </button>
                        </div>
                       
                        <Tooltip id={`movie-tooltip-${movie.movie_ID}`} place="top">
                          <div className="max-w-xs">
                            <h3 className="font-bold mb-1">{movie.movie_Name}</h3>
                            <p className="text-sm mb-1">Director: {movie.director}</p>
                            <p className="text-sm mb-1">Release: {new Date(movie.release_Date).toLocaleDateString()}</p>
                            <p className="text-sm">Click to see details</p>
                          </div>
                        </Tooltip>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy phim</h3>
                      <p className="text-gray-500 max-w-md">Không có phim nào phù hợp với bộ lọc hiện tại. Vui lòng thử điều chỉnh các bộ lọc của bạn.</p>
                      <button
                        onClick={clearAllFilters}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  )}
                </div>
               
                {/* Pagination */}
                {filteredMovies.length > 0 && totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <nav className="flex items-center space-x-2" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <FiChevronLeft className="h-5 w-5" />
                      </button>
                     
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => handlePageChange(1)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            1
                          </button>
                          {currentPage > 4 && (
                            <span className="px-2 py-2 text-gray-500">...</span>
                          )}
                        </>
                      )}
                     
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                       
                        if (pageNum > 0 && pageNum <= totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 rounded-md ${
                                pageNum === currentPage
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        return null;
                      })}
                     
                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <span className="px-2 py-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                     
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};


export default MoviesPage;









