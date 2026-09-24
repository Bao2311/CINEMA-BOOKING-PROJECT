import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEye, FaCopy, FaCheck, FaTimes, FaCalendarAlt, FaFilm, 
  FaDoorOpen, FaSpinner, FaInfoCircle, FaExclamationTriangle, 
  FaArrowRight, FaChevronLeft, FaChevronRight, FaClock
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { format, addDays, isBefore, isAfter, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const BulkShowtimeCreator = ({ token, movies, cinemaRooms, onShowtimesCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Chọn phim, 2: Chọn phòng, 3: Chọn ngày
  const [showDate, setShowDate] = useState('');
  const [cinemaRoomId, setCinemaRoomId] = useState('');
  const [movieSelections, setMovieSelections] = useState([
    { movieId: '', showtimeCount: 1 }
  ]);
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [savedConfigurations, setSavedConfigurations] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [visibleDates, setVisibleDates] = useState([]);

  // Tạo danh sách ngày hiển thị (14 ngày tính từ hôm nay)
  useEffect(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      dates.push(date);
    }
    setVisibleDates(dates);
  }, []);

  // Load saved configurations from localStorage on component mount
  useEffect(() => {
    try {
      const savedConfigs = JSON.parse(localStorage.getItem('savedShowtimeConfigs')) || [];
      setSavedConfigurations(savedConfigs);
    } catch (e) {
      console.error('Error loading saved configurations:', e);
    }
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy', { locale: vi });
  };

  // Format day of week
  const formatDayOfWeek = (date) => {
    return format(date, 'EEEE', { locale: vi });
  };

  // Format day and month
  const formatDayMonth = (date) => {
    return format(date, 'dd/MM', { locale: vi });
  };

  // Add a new movie selection row
  const addMovieSelection = () => {
    setMovieSelections([...movieSelections, { movieId: '', showtimeCount: 1 }]);
  };

  // Remove a movie selection row
  const removeMovieSelection = (index) => {
    const updatedSelections = [...movieSelections];
    updatedSelections.splice(index, 1);
    setMovieSelections(updatedSelections);
  };

  // Update a movie selection
  const updateMovieSelection = (index, field, value) => {
    const updatedSelections = [...movieSelections];
    updatedSelections[index][field] = field === 'showtimeCount' ? parseInt(value) : value;
    setMovieSelections(updatedSelections);
  };

  // Toggle movie selection
  const toggleMovieSelection = (movie) => {
    // Check if movie is already selected
    const existingIndex = selectedMovies.findIndex(m => m.movie_ID === movie.movie_ID);
    
    if (existingIndex >= 0) {
      // Remove movie if already selected
      const newSelectedMovies = [...selectedMovies];
      newSelectedMovies.splice(existingIndex, 1);
      setSelectedMovies(newSelectedMovies);
      
      // Also remove from movieSelections
      const newMovieSelections = movieSelections.filter(
        selection => selection.movieId !== movie.movie_ID.toString()
      );
      setMovieSelections(newMovieSelections.length ? newMovieSelections : [{ movieId: '', showtimeCount: 1 }]);
    } else {
      // Add movie if not selected
      setSelectedMovies([...selectedMovies, movie]);
      
      // Add to movieSelections
      const existingSelection = movieSelections.find(
        selection => selection.movieId === '' || selection.movieId === movie.movie_ID.toString()
      );
      
      if (existingSelection) {
        // Update existing empty selection
        const updatedSelections = movieSelections.map(selection => {
          if (selection === existingSelection) {
            return { ...selection, movieId: movie.movie_ID.toString() };
          }
          return selection;
        });
        setMovieSelections(updatedSelections);
      } else {
        // Add new selection
        setMovieSelections([...movieSelections, { movieId: movie.movie_ID.toString(), showtimeCount: 1 }]);
      }
    }
  };

  // Select room
  const selectRoom = (room) => {
    setSelectedRoom(room);
    setCinemaRoomId(room.cinema_Room_ID.toString());
    setValidationErrors({...validationErrors, cinemaRoomId: ''});
  };

  // Select date
  const selectDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) {
      toast.error('Không thể chọn ngày trong quá khứ');
      return;
    }
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    setShowDate(formattedDate);
    setValidationErrors({...validationErrors, showDate: ''});
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Validate date
    if (!showDate) {
      errors.showDate = 'Vui lòng chọn ngày chiếu';
      isValid = false;
    } else {
      const selectedDate = new Date(showDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isBefore(selectedDate, today)) {
        errors.showDate = 'Không thể tạo lịch chiếu trong quá khứ';
        isValid = false;
      }
    }
    
    // Validate room
    if (!cinemaRoomId) {
      errors.cinemaRoomId = 'Vui lòng chọn phòng chiếu';
      isValid = false;
    }
    
    // Check if at least one movie is selected
    const validMovieSelections = movieSelections.filter(selection => selection.movieId);
    if (validMovieSelections.length === 0) {
      errors.movies = 'Vui lòng chọn ít nhất một phim';
      isValid = false;
    }
    
    // Check if all selected movies have valid counts
    const invalidSelections = validMovieSelections.filter(
      selection => selection.showtimeCount < 1 || selection.showtimeCount > 10
    );
    
    if (invalidSelections.length > 0) {
      errors.showtimeCount = 'Số lượng suất chiếu phải từ 1 đến 10';
      isValid = false;
    }
    
    setValidationErrors(errors);
    
    if (!isValid) {
      // Display error messages
      Object.values(errors).forEach(error => {
        toast.error(error);
      });
    }
    
    return isValid;
  };

  // Preview showtimes
  const previewShowtimes = async () => {
    if (!validateForm()) return;
    
    // Filter out empty movie selections
    const validMovieSelections = movieSelections.filter(selection => selection.movieId);
    
    try {
      setIsPreviewLoading(true);
      
      const previewPayload = {
        showDate: new Date(showDate).toISOString(),
        cinemaRoomId: parseInt(cinemaRoomId),
        movies: validMovieSelections.map(selection => ({
          movieId: parseInt(selection.movieId),
          showtimeCount: selection.showtimeCount
        }))
      };
      
      const response = await fetch('https://localhost:7168/api/Showtimes/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewPayload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi tạo bản xem trước: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error previewing showtimes:', error);
      toast.error('Không thể tạo bản xem trước: ' + error.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Create showtimes
  const createShowtimes = async () => {
    if (!validateForm()) return;
    
    // Filter out empty movie selections
    const validMovieSelections = movieSelections.filter(selection => selection.movieId);
    
    try {
      setIsLoading(true);
      
      const createPayload = {
        showDate: new Date(showDate).toISOString(),
        cinemaRoomId: parseInt(cinemaRoomId),
        movies: validMovieSelections.map(selection => ({
          movieId: parseInt(selection.movieId),
          showtimeCount: selection.showtimeCount
        }))
      };
      
      // Save this configuration for future use
      const newSavedConfig = {
        id: Date.now(),
        showDate: showDate,
        cinemaRoomId: cinemaRoomId,
        movies: [...validMovieSelections],
        timestamp: new Date().toISOString()
      };
      
      setSavedConfigurations(prev => [newSavedConfig, ...prev.slice(0, 4)]);
      
      // Store in localStorage
      try {
        const existingConfigs = JSON.parse(localStorage.getItem('savedShowtimeConfigs')) || [];
        localStorage.setItem('savedShowtimeConfigs', 
          JSON.stringify([newSavedConfig, ...existingConfigs.slice(0, 4)]));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
      
      const response = await fetch('https://localhost:7168/api/Showtimes/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi khi tạo lịch chiếu: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      toast.success(`Đã tạo thành công ${data.$values.length} lịch chiếu!`);
      
      // Reset form
      setPreviewData(null);
      
      // Notify parent component
      if (onShowtimesCreated) {
        onShowtimesCreated();
      }
      
      // Close the modal after a delay
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating showtimes:', error);
      toast.error('Không thể tạo lịch chiếu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentStep(1);
    setShowDate('');
    setCinemaRoomId('');
    setMovieSelections([{ movieId: '', showtimeCount: 1 }]);
    setPreviewData(null);
    setSelectedMovies([]);
    setSelectedRoom(null);
    setValidationErrors({});
  };

  // Apply a saved configuration
  const applySavedConfig = (config) => {
    // Validate if the saved config is for the same room and date
    const isSameRoomAndDate = savedConfigurations.some(
      savedConfig => 
        savedConfig.id !== config.id && 
        savedConfig.cinemaRoomId === config.cinemaRoomId && 
        savedConfig.showDate === config.showDate
    );
    
    if (isSameRoomAndDate) {
      toast.error('Không thể áp dụng cấu hình này vào cùng một phòng trong cùng ngày');
      return;
    }
    
    // Check if date is in the past
    const configDate = new Date(config.showDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(configDate, today)) {
      toast.error('Không thể áp dụng cấu hình với ngày trong quá khứ');
      return;
    }
    
    setShowDate(config.showDate);
    setCinemaRoomId(config.cinemaRoomId);
    
    // Set selected room
    const room = cinemaRooms.find(r => r.cinema_Room_ID === parseInt(config.cinemaRoomId));
    setSelectedRoom(room);
    
    // Set selected movies and movie selections
    const selectedMoviesList = [];
    const movieSelectionsList = [];
    
    config.movies.forEach(movieConfig => {
      const movie = movies.find(m => m.movie_ID === parseInt(movieConfig.movieId));
      if (movie) {
        selectedMoviesList.push(movie);
        movieSelectionsList.push({
          movieId: movieConfig.movieId,
          showtimeCount: movieConfig.showtimeCount
        });
      }
    });
    
    setSelectedMovies(selectedMoviesList);
    setMovieSelections(movieSelectionsList.length ? movieSelectionsList : [{ movieId: '', showtimeCount: 1 }]);
    
    // Move to final step
    setCurrentStep(3);
    
    toast.info('Đã áp dụng cấu hình đã lưu');
  };

  // Get movie name by ID
  const getMovieName = (movieId) => {
    const movie = movies.find(m => m.movie_ID === parseInt(movieId));
    return movie ? movie.title : `Phim ID: ${movieId}`;
  };

  // Get room name by ID
  const getRoomName = (roomId) => {
    const room = cinemaRooms.find(r => r.cinema_Room_ID === parseInt(roomId));
    return room ? room.room_Name : `Phòng ${roomId}`;
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep === 1) {
      // Validate movie selection
      if (selectedMovies.length === 0) {
        toast.error('Vui lòng chọn ít nhất một phim');
        return;
      }
    } else if (currentStep === 2) {
      // Validate room selection
      if (!selectedRoom) {
        toast.error('Vui lòng chọn phòng chiếu');
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Scroll dates left
  const scrollDatesLeft = () => {
    if (visibleDates.length > 0) {
      const newDates = [...visibleDates];
      const firstDate = new Date(newDates[0]);
      firstDate.setDate(firstDate.getDate() - 7);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Don't allow scrolling to dates before today
      if (isBefore(firstDate, today)) {
        return;
      }
      
      const newVisibleDates = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date(firstDate);
        date.setDate(date.getDate() + i);
        newVisibleDates.push(date);
      }
      setVisibleDates(newVisibleDates);
    }
  };

  // Scroll dates right
  const scrollDatesRight = () => {
    if (visibleDates.length > 0) {
      const newDates = [...visibleDates];
      const lastDate = new Date(newDates[newDates.length - 1]);
      lastDate.setDate(lastDate.getDate() + 1);
      
      const newVisibleDates = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date(lastDate);
        date.setDate(date.getDate() + i);
        newVisibleDates.push(date);
      }
      setVisibleDates(newVisibleDates);
    }
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if a date is selected
  const isDateSelected = (date) => {
    if (!showDate) return false;
    const selectedDate = new Date(showDate);
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Check if a movie is selected
  const isMovieSelected = (movieId) => {
    return selectedMovies.some(movie => movie.movie_ID === movieId);
  };

  // Get showtime count for a movie
  const getShowtimeCount = (movieId) => {
    const selection = movieSelections.find(
      selection => selection.movieId === movieId.toString()
    );
    return selection ? selection.showtimeCount : 1;
  };

  // Update showtime count for a movie
  const updateShowtimeCount = (movieId, count) => {
    const updatedSelections = movieSelections.map(selection => {
      if (selection.movieId === movieId.toString()) {
        return { ...selection, showtimeCount: count };
      }
      return selection;
    });
    setMovieSelections(updatedSelections);
  };

  return (
    <>
      {/* Button to open modal */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20"
      >
        <FaPlus className="mr-2" />
        Tạo nhiều suất chiếu
      </button>
      
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161D2F] border border-white/10 text-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#161D2F]/95 backdrop-blur-md z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-6 bg-red-600 rounded-full inline-block"></span>
                Tạo nhiều suất chiếu cùng lúc
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            {/* Stepper */}
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between mb-8 relative max-w-2xl mx-auto">
                {/* Progress bar underneath */}
                <div className="absolute h-0.5 bg-white/10 left-6 right-6 top-6 -z-0">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-rose-600 transition-all duration-300"
                    style={{ width: `${(currentStep - 1) * 50}%` }}
                  ></div>
                </div>
                
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all font-semibold ${
                        currentStep === step 
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 scale-110 border border-red-400/30' 
                          : currentStep > step 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-[#1E2738] text-gray-400 border border-white/10'
                      }`}
                    >
                      {currentStep > step ? <FaCheck className="text-base" /> : (
                        step === 1 ? <FaFilm /> : step === 2 ? <FaDoorOpen /> : <FaCalendarAlt />
                      )}
                    </div>
                    <div className={`text-xs font-medium text-center ${currentStep === step ? 'text-white font-semibold' : 'text-gray-400'}`}>
                      {step === 1 && "1. Chọn phim"}
                      {step === 2 && "2. Chọn phòng"}
                      {step === 3 && "3. Chọn ngày & Tạo"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Chọn phim */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FaFilm className="text-red-500" />
                        Bước 1: Chọn phim đang chiếu
                      </h4>
                      <span className="text-xs text-gray-400">Đã chọn: {selectedMovies.length} phim</span>
                    </div>
                    
                    {validationErrors.movies && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2 text-sm">
                        <FaExclamationTriangle className="text-red-400 shrink-0" />
                        <span>{validationErrors.movies}</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {movies.map(movie => {
                        const isSelected = isMovieSelected(movie.movie_ID);
                        return (
                          <div 
                            key={movie.movie_ID}
                            onClick={() => toggleMovieSelection(movie)}
                            className={`cursor-pointer rounded-xl overflow-hidden border transition-all bg-[#1E2738] ${
                              isSelected 
                                ? 'border-red-500 ring-2 ring-red-500/30 shadow-lg shadow-red-600/20' 
                                : 'border-white/10 hover:border-red-500/40 hover:bg-[#1E2738]/80'
                            }`}
                          >
                            <div className="relative pb-[135%] bg-black/40">
                              <img 
                                src={movie.poster_URL || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'} 
                                alt={movie.title}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                                }}
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex items-center justify-center">
                                  <div className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg shadow-md">
                                    <FaCheck size={12} />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h5 className="font-semibold text-white truncate text-sm" title={movie.title}>{movie.title}</h5>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                <span className="text-xs text-gray-400">{movie.duration} phút</span>
                                {isSelected && (
                                  <div className="flex items-center gap-1 bg-[#0B0F19] px-1.5 py-0.5 rounded-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => {
                                        const currentCount = getShowtimeCount(movie.movie_ID);
                                        if (currentCount > 1) {
                                          updateShowtimeCount(movie.movie_ID, currentCount - 1);
                                        }
                                      }}
                                      className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-gray-300 hover:text-white hover:bg-white/15 text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="mx-1 text-xs font-bold text-white min-w-[14px] text-center">
                                      {getShowtimeCount(movie.movie_ID)}
                                    </span>
                                    <button 
                                      onClick={() => {
                                        const currentCount = getShowtimeCount(movie.movie_ID);
                                        if (currentCount < 10) {
                                          updateShowtimeCount(movie.movie_ID, currentCount + 1);
                                        }
                                      }}
                                      className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-gray-300 hover:text-white hover:bg-white/15 text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedMovies.length > 0 && (
                      <div className="mt-4 p-4 bg-[#0B0F19]/60 rounded-xl border border-white/10">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Phim đã chọn ({selectedMovies.length})</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedMovies.map(movie => (
                            <div 
                              key={movie.movie_ID} 
                              className="flex items-center bg-[#1E2738] px-3 py-1.5 rounded-lg border border-white/10"
                            >
                              <img 
                                src={movie.poster_URL || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'} 
                                alt={movie.title}
                                className="w-6 h-8 rounded object-cover mr-2"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                                }}
                              />
                              <span className="text-xs font-medium text-white mr-2 truncate max-w-[160px]">{movie.title}</span>
                              <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] px-2 py-0.5 rounded-full font-semibold">
                                {getShowtimeCount(movie.movie_ID)} suất
                              </span>
                              <button 
                                onClick={() => toggleMovieSelection(movie)}
                                className="ml-2 text-gray-400 hover:text-red-400"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* Step 2: Chọn phòng */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaDoorOpen className="text-red-500" />
                      Bước 2: Chọn phòng chiếu
                    </h4>
                    
                    {validationErrors.cinemaRoomId && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2 text-sm">
                        <FaExclamationTriangle className="text-red-400 shrink-0" />
                        <span>{validationErrors.cinemaRoomId}</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {cinemaRooms.map(room => {
                        const isSelected = selectedRoom?.cinema_Room_ID === room.cinema_Room_ID;
                        return (
                          <div 
                            key={room.cinema_Room_ID}
                            onClick={() => selectRoom(room)}
                            className={`cursor-pointer p-4 rounded-xl border transition-all ${
                              isSelected 
                                ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/20 shadow-lg shadow-red-600/10' 
                                : 'border-white/10 hover:border-red-500/40 bg-[#1E2738]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-white text-base">{room.room_Name}</h5>
                              {isSelected && (
                                <div className="bg-red-600 text-white p-1 rounded-md shadow-sm">
                                  <FaCheck size={11} />
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                room.room_Type === '2D' 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : room.room_Type === '3D' 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {room.room_Type}
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                                {room.seats_Count} ghế
                              </span>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-400 flex items-center justify-between">
                              <span>Trạng thái:</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                room.status === 'Active' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {room.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedRoom && (
                      <div className="mt-4 p-4 bg-[#0B0F19]/60 rounded-xl border border-white/10 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {selectedRoom.room_Name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">Loại: {selectedRoom.room_Type} • Sức chứa: {selectedRoom.seats_Count} chỗ</p>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedRoom(null);
                            setCinemaRoomId('');
                          }}
                          className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* Step 3: Chọn ngày */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-red-500" />
                      Bước 3: Chọn ngày chiếu & xem trước
                    </h4>
                    
                    {validationErrors.showDate && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2 text-sm">
                        <FaExclamationTriangle className="text-red-400 shrink-0" />
                        <span>{validationErrors.showDate}</span>
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-300">Chọn nhanh ngày chiếu</h5>
                        <div className="flex space-x-2">
                          <button 
                            onClick={scrollDatesLeft}
                            className="p-1.5 rounded-lg bg-[#1E2738] hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
                          >
                            <FaChevronLeft size={12} />
                          </button>
                          <button 
                            onClick={scrollDatesRight}
                            className="p-1.5 rounded-lg bg-[#1E2738] hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
                          >
                            <FaChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
                        <div className="flex space-x-2.5">
                          {visibleDates.map((date, index) => {
                            const isSelected = isDateSelected(date);
                            return (
                              <div 
                                key={index}
                                onClick={() => selectDate(date)}
                                className={`flex-shrink-0 w-24 p-3 rounded-xl cursor-pointer border transition-all text-center ${
                                  isSelected 
                                    ? 'border-red-500 bg-red-500/15 ring-2 ring-red-500/20 shadow-lg shadow-red-600/10' 
                                    : 'border-white/10 hover:border-red-500/40 bg-[#1E2738]'
                                }`}
                              >
                                <p className={`text-xs mb-1 font-medium ${
                                  isToday(date) ? 'text-red-400 font-bold' : 'text-gray-400'
                                }`}>
                                  {isToday(date) ? 'Hôm nay' : formatDayOfWeek(date)}
                                </p>
                                <p className="text-base font-bold text-white">{formatDayMonth(date)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Hoặc chọn ngày cụ thể từ lịch</label>
                        <input 
                          type="date" 
                          value={showDate} 
                          onChange={(e) => setShowDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/15 rounded-xl text-white focus:outline-none focus:border-red-500 [color-scheme:dark]" 
                        />
                      </div>
                    </div>
                    
                    {/* Saved configurations */}
                    {savedConfigurations.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <FaCopy className="text-red-400" />
                          Cấu hình đã lưu gần đây
                        </h4>
                        <div className="space-y-2">
                          {savedConfigurations.map(config => (
                            <div key={config.id} className="p-3 border border-white/10 rounded-xl bg-[#1E2738] flex justify-between items-center">
                              <div>
                                <div className="text-sm font-semibold text-white">{formatDate(config.showDate)} - {getRoomName(config.cinemaRoomId)}</div>
                                <div className="text-xs text-gray-400 flex flex-wrap gap-1.5 mt-1.5">
                                  {config.movies.map((movie, idx) => (
                                    <span key={idx} className="inline-flex items-center bg-[#0B0F19] px-2 py-0.5 rounded border border-white/10 text-gray-300">
                                      {getMovieName(movie.movieId)} 
                                      <span className="ml-1.5 bg-red-500/20 text-red-300 text-[11px] px-1.5 rounded-full font-semibold">
                                        {movie.showtimeCount}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button 
                                onClick={() => applySavedConfig(config)}
                                className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center text-xs font-semibold"
                              >
                                <FaCopy className="mr-1.5" size={11} />
                                Áp dụng
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Summary */}
                    <div className="mt-6 p-4 bg-[#0B0F19]/60 rounded-xl border border-white/10">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Tóm tắt cấu hình</h5>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center">
                          <span className="w-28 text-gray-400">Ngày chiếu:</span>
                          <span className="font-semibold text-white">{showDate ? formatDate(showDate) : 'Chưa chọn'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-28 text-gray-400">Phòng chiếu:</span>
                          <span className="font-semibold text-white">{selectedRoom ? selectedRoom.room_Name : 'Chưa chọn'}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start">
                          <span className="w-28 text-gray-400 shrink-0 mb-1 sm:mb-0">Phim ({selectedMovies.length}):</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedMovies.map(movie => (
                              <div key={movie.movie_ID} className="flex items-center bg-[#1E2738] px-2.5 py-1 rounded-lg border border-white/10">
                                <img 
                                  src={movie.poster_URL || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'} 
                                  alt={movie.title}
                                  className="w-5 h-7 rounded object-cover mr-2"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                                  }}
                                />
                                <span className="text-xs font-medium text-white mr-1.5">{movie.title}</span>
                                <span className="bg-red-500/20 text-red-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                  {getShowtimeCount(movie.movie_ID)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview button */}
                    <div className="mt-6 flex justify-center">
                      <button 
                        onClick={previewShowtimes} 
                        disabled={isPreviewLoading}
                        className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/20 font-semibold flex items-center text-sm disabled:opacity-50"
                      >
                        {isPreviewLoading ? (
                          <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Đang tạo xem trước...
                          </>
                        ) : (
                          <>
                            <FaEye className="mr-2" />
                            Xem trước lịch chiếu tự động
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Preview section */}
                    {previewData && (
                      <div className="mt-6 border border-white/10 rounded-xl bg-[#1E2738] overflow-hidden">
                        <div className="p-4 bg-[#0B0F19]/80 border-b border-white/10">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <FaEye className="text-red-500" />
                            Xem trước lịch chiếu dự kiến ({previewData.showtimes?.$values?.length || 0} suất)
                          </h4>
                          
                          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center text-gray-300">
                              <FaCalendarAlt className="text-red-400 mr-2 shrink-0" />
                              <span>Ngày: <strong className="text-white">{formatDate(previewData.date)}</strong></span>
                            </div>
                            <div className="flex items-center text-gray-300">
                              <FaDoorOpen className="text-red-400 mr-2 shrink-0" />
                              <span>Phòng: <strong className="text-white">{previewData.roomName}</strong></span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2 sm:p-4 overflow-x-auto">
                          <table className="min-w-full divide-y divide-white/10">
                            <thead>
                              <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <th scope="col" className="px-3 py-2.5">Phim</th>
                                <th scope="col" className="px-3 py-2.5">Bắt đầu</th>
                                <th scope="col" className="px-3 py-2.5">Kết thúc</th>
                                <th scope="col" className="px-3 py-2.5">Loại giá</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                              {previewData.showtimes.$values.map((showtime, index) => {
                                const movie = movies.find(m => m.title === showtime.movieName);
                                return (
                                  <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center">
                                        {movie && (
                                          <img 
                                            src={movie.poster_URL || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'} 
                                            alt={showtime.movieName}
                                            className="w-8 h-11 object-cover rounded mr-2.5 shrink-0"
                                            onError={(e) => {
                                              e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80';
                                            }}
                                          />
                                        )}
                                        <div>
                                          <div className="font-semibold text-white text-xs sm:text-sm">{showtime.movieName}</div>
                                          {movie && (
                                            <div className="text-[11px] text-gray-400">{movie.duration} phút</div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center text-emerald-400 font-semibold text-xs sm:text-sm">
                                        <FaClock className="mr-1.5 shrink-0" />
                                        <span>{showtime.startTime}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-center text-rose-400 font-semibold text-xs sm:text-sm">
                                        <FaClock className="mr-1.5 shrink-0" />
                                        <span>{showtime.endTime}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span className={`px-2 py-0.5 inline-flex text-[11px] font-semibold rounded-full ${
                                        showtime.priceTier === 'Normal' 
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                          : showtime.priceTier === 'Weekend' 
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      }`}>
                                        {showtime.priceTier === 'Normal' ? 'Thường' : 
                                         showtime.priceTier === 'Weekend' ? 'Cuối tuần' : showtime.priceTier}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                <button 
                  onClick={currentStep > 1 ? goToPreviousStep : () => setIsOpen(false)} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-colors flex items-center text-sm font-medium"
                >
                  {currentStep > 1 ? (
                    <>
                      <FaChevronLeft className="mr-2" />
                      Quay lại
                    </>
                  ) : 'Đóng'}
                </button>
                
                <div className="flex space-x-3">
                  {currentStep < 3 ? (
                    <button 
                      onClick={goToNextStep} 
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-600/20 font-semibold flex items-center text-sm"
                    >
                      Tiếp tục
                      <FaArrowRight className="ml-2" />
                    </button>
                  ) : (
                    <button 
                      onClick={createShowtimes} 
                      disabled={isLoading || !previewData}
                      className={`px-6 py-2.5 rounded-xl transition-all shadow-lg font-semibold flex items-center text-sm ${
                        isLoading || !previewData
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <FaSpinner className="mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-2" />
                          Xác nhận tạo {previewData?.showtimes?.$values?.length || ''} suất
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkShowtimeCreator;
