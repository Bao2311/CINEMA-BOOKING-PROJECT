// import React, { useState } from 'react';
// import { FaPlus, FaEye, FaCopy, FaCheck, FaTimes, FaCalendarAlt, FaFilm, FaDoorOpen, FaSpinner, FaInfoCircle } from 'react-icons/fa';
// import { toast } from 'react-toastify';

// const BulkShowtimeCreator = ({ token, movies, cinemaRooms, onShowtimesCreated }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [showDate, setShowDate] = useState('');
//   const [cinemaRoomId, setCinemaRoomId] = useState('');
//   const [movieSelections, setMovieSelections] = useState([
//     { movieId: '', showtimeCount: 1 }
//   ]);
//   const [previewData, setPreviewData] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPreviewLoading, setIsPreviewLoading] = useState(false);
//   const [savedConfigurations, setSavedConfigurations] = useState([]);

//   // Load saved configurations from localStorage on component mount
//   React.useEffect(() => {
//     try {
//       const savedConfigs = JSON.parse(localStorage.getItem('savedShowtimeConfigs')) || [];
//       setSavedConfigurations(savedConfigs);
//     } catch (e) {
//       console.error('Error loading saved configurations:', e);
//     }
//   }, []);

//   // Format date for display
//   const formatDate = (dateString) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('vi-VN', { 
//       year: 'numeric', 
//       month: 'short', 
//       day: 'numeric' 
//     });
//   };

//   // Add a new movie selection row
//   const addMovieSelection = () => {
//     setMovieSelections([...movieSelections, { movieId: '', showtimeCount: 1 }]);
//   };

//   // Remove a movie selection row
//   const removeMovieSelection = (index) => {
//     const updatedSelections = [...movieSelections];
//     updatedSelections.splice(index, 1);
//     setMovieSelections(updatedSelections);
//   };

//   // Update a movie selection
//   const updateMovieSelection = (index, field, value) => {
//     const updatedSelections = [...movieSelections];
//     updatedSelections[index][field] = field === 'showtimeCount' ? parseInt(value) : value;
//     setMovieSelections(updatedSelections);
//   };

//   // Validate form before submission
//   const validateForm = () => {
//     if (!showDate) {
//       toast.error('Vui lòng chọn ngày chiếu');
//       return false;
//     }
    
//     if (!cinemaRoomId) {
//       toast.error('Vui lòng chọn phòng chiếu');
//       return false;
//     }
    
//     // Check if at least one movie is selected
//     const hasMovieSelected = movieSelections.some(selection => selection.movieId);
//     if (!hasMovieSelected) {
//       toast.error('Vui lòng chọn ít nhất một phim');
//       return false;
//     }
    
//     // Check if all selected movies have valid IDs and counts
//     const invalidSelections = movieSelections.filter(
//       selection => selection.movieId && (selection.showtimeCount < 1 || selection.showtimeCount > 10)
//     );
    
//     if (invalidSelections.length > 0) {
//       toast.error('Số lượng suất chiếu phải từ 1 đến 10');
//       return false;
//     }
    
//     return true;
//   };

//   // Preview showtimes
//   const previewShowtimes = async () => {
//     if (!validateForm()) return;
    
//     // Filter out empty movie selections
//     const validMovieSelections = movieSelections.filter(selection => selection.movieId);
    
//     if (validMovieSelections.length === 0) {
//       toast.error('Vui lòng chọn ít nhất một phim');
//       return;
//     }
    
//     try {
//       setIsPreviewLoading(true);
      
//       const previewPayload = {
//         showDate: new Date(showDate).toISOString(),
//         cinemaRoomId: parseInt(cinemaRoomId),
//         movies: validMovieSelections.map(selection => ({
//           movieId: parseInt(selection.movieId),
//           showtimeCount: selection.showtimeCount
//         }))
//       };
      
//       const response = await fetch('https://localhost:7168/api/Showtimes/preview', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(previewPayload),
//       });
      
//       if (!response.ok) {
//         throw new Error(`Lỗi khi tạo bản xem trước: ${response.status}`);
//       }
      
//       const data = await response.json();
//       setPreviewData(data);
//     } catch (error) {
//       console.error('Error previewing showtimes:', error);
//       toast.error('Không thể tạo bản xem trước: ' + error.message);
//     } finally {
//       setIsPreviewLoading(false);
//     }
//   };

//   // Create showtimes
//   const createShowtimes = async () => {
//     if (!validateForm()) return;
    
//     // Filter out empty movie selections
//     const validMovieSelections = movieSelections.filter(selection => selection.movieId);
    
//     try {
//       setIsLoading(true);
      
//       const createPayload = {
//         showDate: new Date(showDate).toISOString(),
//         cinemaRoomId: parseInt(cinemaRoomId),
//         movies: validMovieSelections.map(selection => ({
//           movieId: parseInt(selection.movieId),
//           showtimeCount: selection.showtimeCount
//         }))
//       };
      
//       // Save this configuration for future use
//       const newSavedConfig = {
//         id: Date.now(),
//         showDate: showDate,
//         cinemaRoomId: cinemaRoomId,
//         movies: [...validMovieSelections],
//         timestamp: new Date().toISOString()
//       };
      
//       setSavedConfigurations(prev => [newSavedConfig, ...prev.slice(0, 4)]);
      
//       // Store in localStorage
//       try {
//         const existingConfigs = JSON.parse(localStorage.getItem('savedShowtimeConfigs')) || [];
//         localStorage.setItem('savedShowtimeConfigs', 
//           JSON.stringify([newSavedConfig, ...existingConfigs.slice(0, 4)]));
//       } catch (e) {
//         console.error('Error saving to localStorage:', e);
//       }
      
//       const response = await fetch('https://localhost:7168/api/Showtimes/create', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(createPayload),
//       });
      
//       if (!response.ok) {
//         throw new Error(`Lỗi khi tạo lịch chiếu: ${response.status}`);
//       }
      
//       const data = await response.json();
//       toast.success(`Đã tạo thành công ${data.$values.length} lịch chiếu!`);
      
//       // Reset form
//       setPreviewData(null);
      
//       // Notify parent component
//       if (onShowtimesCreated) {
//         onShowtimesCreated();
//       }
      
//       // Close the modal after a delay
//       setTimeout(() => {
//         setIsOpen(false);
//       }, 1500);
      
//     } catch (error) {
//       console.error('Error creating showtimes:', error);
//       toast.error('Không thể tạo lịch chiếu: ' + error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Apply a saved configuration
//   const applySavedConfig = (config) => {
//     setShowDate(config.showDate);
//     setCinemaRoomId(config.cinemaRoomId);
//     setMovieSelections(config.movies);
//     toast.info('Đã áp dụng cấu hình đã lưu');
//   };

//   // Get movie name by ID
//   const getMovieName = (movieId) => {
//     const movie = movies.find(m => m.movie_ID === parseInt(movieId));
//     return movie ? movie.title : `Phim ID: ${movieId}`;
//   };

//   // Get room name by ID
//   const getRoomName = (roomId) => {
//     const room = cinemaRooms.find(r => r.cinema_Room_ID === parseInt(roomId));
//     return room ? room.room_Name : `Phòng ${roomId}`;
//   };

//   return (
//     <>
//       {/* Button to open modal */}
//       <button 
//         onClick={() => setIsOpen(true)} 
//         className="px-4 py-2.5 bg-green-600 text-white rounded-full flex items-center font-medium transition-all shadow-sm hover:bg-green-700"
//       >
//         <FaPlus className="mr-2" />
//         Tạo nhiều suất chiếu
//       </button>
      
//       {/* Modal */}
//       {isOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
//               <h3 className="text-xl font-semibold text-gray-800">Tạo nhiều suất chiếu cùng lúc</h3>
//               <button 
//                 onClick={() => setIsOpen(false)}
//                 className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
//               >
//                 <FaTimes size={20} />
//               </button>
//             </div>
            
//             <div className="p-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     <div className="flex items-center">
//                       <FaCalendarAlt className="mr-2 text-blue-500" />
//                       Ngày chiếu
//                     </div>
//                   </label>
//                   <input 
//                     type="date" 
//                     value={showDate} 
//                     onChange={(e) => setShowDate(e.target.value)}
//                     min={new Date().toISOString().split('T')[0]}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
//                   />
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     <div className="flex items-center">
//                       <FaDoorOpen className="mr-2 text-blue-500" />
//                       Phòng chiếu
//                     </div>
//                   </label>
//                   <select 
//                     value={cinemaRoomId} 
//                     onChange={(e) => setCinemaRoomId(e.target.value)}
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
//                   >
//                     <option value="">-- Chọn phòng chiếu --</option>
//                     {cinemaRooms.map(room => (
//                       <option key={room.cinema_Room_ID} value={room.cinema_Room_ID}>
//                         {room.room_Name} ({room.room_Type})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
              
//               {/* Movie selections */}
//               <div className="mb-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <label className="block text-sm font-medium text-gray-700">
//                     <div className="flex items-center">
//                       <FaFilm className="mr-2 text-blue-500" />
//                       Chọn phim và số lượng suất chiếu
//                     </div>
//                   </label>
//                   <button 
//                     onClick={addMovieSelection}
//                     className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center text-sm"
//                   >
//                     <FaPlus className="mr-1" size={12} />
//                     Thêm phim
//                   </button>
//                 </div>
                
//                 {movieSelections.map((selection, index) => (
//                   <div key={index} className="flex items-center gap-3 mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
//                     <div className="flex-grow">
//                       <select 
//                         value={selection.movieId} 
//                         onChange={(e) => updateMovieSelection(index, 'movieId', e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
//                       >
//                         <option value="">-- Chọn phim --</option>
//                         {movies.map(movie => (
//                           <option key={movie.movie_ID} value={movie.movie_ID}>
//                             {movie.title} ({movie.duration} phút)
//                           </option>
//                         ))}
//                       </select>
//                     </div>
                    
//                     <div className="w-32">
//                       <input 
//                         type="number" 
//                         min="1" 
//                         max="10"
//                         value={selection.showtimeCount} 
//                         onChange={(e) => updateMovieSelection(index, 'showtimeCount', e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
//                         placeholder="Số lượng"
//                       />
//                     </div>
                    
//                     <button 
//                       onClick={() => removeMovieSelection(index)}
//                       className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
//                       title="Xóa"
//                       disabled={movieSelections.length === 1}
//                     >
//                       <FaTimes />
//                     </button>
//                   </div>
//                 ))}
                
//                 <div className="text-sm text-gray-500 mt-2 flex items-center">
//                   <FaInfoCircle className="mr-1" />
//                   Bạn có thể thêm tối đa 5 phim khác nhau và tối đa 10 suất chiếu cho mỗi phim
//                 </div>
//               </div>
              
//               {/* Saved configurations */}
//               {savedConfigurations.length > 0 && (
//                 <div className="mb-6">
//                   <h4 className="text-sm font-medium text-gray-700 mb-3">Cấu hình đã lưu gần đây</h4>
//                   <div className="space-y-2">
//                     {savedConfigurations.map(config => (
//                       <div key={config.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
//                         <div>
//                           <div className="text-sm font-medium">{formatDate(config.showDate)} - {getRoomName(config.cinemaRoomId)}</div>
//                           <div className="text-xs text-gray-500">
//                             {config.movies.map((movie, idx) => (
//                               <span key={idx} className="mr-2">
//                                 {getMovieName(movie.movieId)} ({movie.showtimeCount} suất)
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                         <button 
//                           onClick={() => applySavedConfig(config)}
//                           className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center text-sm"
//                         >
//                           <FaCopy className="mr-1" size={12} />
//                           Áp dụng
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
              
//               {/* Preview section */}
//               {previewData && (
//                 <div className="mb-6 border border-blue-200 rounded-lg bg-blue-50 p-4">
//                   <h4 className="text-md font-medium text-blue-800 mb-3 flex items-center">
//                     <FaEye className="mr-2" />
//                     Xem trước lịch chiếu
//                   </h4>
                  
//                   <div className="mb-3">
//                     <div className="text-sm font-medium text-blue-700">
//                       Ngày: {formatDate(previewData.date)}
//                     </div>
//                     <div className="text-sm font-medium text-blue-700">
//                       Phòng: {previewData.roomName}
//                     </div>
//                   </div>
                  
//                   <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
//                     <table className="min-w-full divide-y divide-blue-100">
//                       <thead className="bg-blue-50">
//                         <tr>
//                           <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Phim</th>
//                           <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Giờ bắt đầu</th>
//                           <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Giờ kết thúc</th>
//                           <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Loại giá</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-blue-100">
//                         {previewData.showtimes.$values.map((showtime, index) => (
//                           <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
//                             <td className="px-4 py-2 text-sm text-gray-800">{showtime.movieName}</td>
//                             <td className="px-4 py-2 text-sm text-gray-800">{showtime.startTime}</td>
//                             <td className="px-4 py-2 text-sm text-gray-800">{showtime.endTime}</td>
//                             <td className="px-4 py-2 text-sm text-gray-800">{showtime.priceTier}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}
              
//               {/* Action buttons */}
//               <div className="flex justify-end space-x-3 mt-6">
//                 <button 
//                   onClick={() => setIsOpen(false)} 
//                   className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
//                 >
//                   Hủy
//                 </button>
                
//                 <button 
//                   onClick={previewShowtimes} 
//                   disabled={isPreviewLoading}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
//                 >
//                   {isPreviewLoading ? (
//                     <>
//                       <FaSpinner className="mr-2 animate-spin" />
//                       Đang tạo xem trước...
//                     </>
//                   ) : (
//                     <>
//                       <FaEye className="mr-2" />
//                       Xem trước
//                     </>
//                   )}
//                 </button>
                
//                 <button 
//                   onClick={createShowtimes} 
//                   disabled={isLoading || !previewData}
//                   className={`px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center ${
//                     isLoading || !previewData
//                       ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
//                       : 'bg-green-600 text-white hover:bg-green-700'
//                   }`}
//                 >
//                   {isLoading ? (
//                     <>
//                       <FaSpinner className="mr-2 animate-spin" />
//                       Đang tạo...
//                     </>
//                   ) : (
//                     <>
//                       <FaCheck className="mr-2" />
//                       Tạo lịch chiếu
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default BulkShowtimeCreator;


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
        className="px-4 py-2.5 bg-green-600 text-white rounded-full flex items-center font-medium transition-all shadow-sm hover:bg-green-700"
      >
        <FaPlus className="mr-2" />
        Tạo nhiều suất chiếu
      </button>
      
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold text-gray-800">Tạo nhiều suất chiếu cùng lúc</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Stepper */}
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between mb-8 relative">
                {/* Progress bar underneath */}
                <div className="absolute h-1 bg-gray-200 left-0 right-0 top-6 -z-10">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(currentStep - 1) * 50}%` }}
                  ></div>
                </div>
                
                {[1, 2, 3].map(step => (
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
                      {currentStep > step ? <FaCheck className="text-lg" /> : (
                        step === 1 ? <FaFilm /> : step === 2 ? <FaDoorOpen /> : <FaCalendarAlt />
                      )}
                    </div>
                    <div className="text-sm font-medium text-center max-w-[100px]">
                      {step === 1 && "Chọn phim"}
                      {step === 2 && "Chọn phòng"}
                      {step === 3 && "Chọn ngày"}
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <FaFilm className="mr-2 text-blue-500" />
                      Bước 1: Chọn phim đang chiếu
                    </h4>
                    
                    {validationErrors.movies && (
                      <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                        <div className="flex items-center">
                          <FaExclamationTriangle className="mr-2" />
                          <span>{validationErrors.movies}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {movies.map(movie => (
                        <div 
                          key={movie.movie_ID}
                          onClick={() => toggleMovieSelection(movie)}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            isMovieSelected(movie.movie_ID) 
                              ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="relative pb-[140%]">
                            <img 
                              src={movie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                              alt={movie.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            {isMovieSelected(movie.movie_ID) && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                                <div className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full">
                                  <FaCheck />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3 bg-white">
                            <h5 className="font-medium text-gray-800 truncate">{movie.title}</h5>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">{movie.duration} phút</span>
                              {isMovieSelected(movie.movie_ID) && (
                                <div className="flex items-center">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const currentCount = getShowtimeCount(movie.movie_ID);
                                      if (currentCount > 1) {
                                        updateShowtimeCount(movie.movie_ID, currentCount - 1);
                                      }
                                    }}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300"
                                  >
                                    -
                                  </button>
                                  <span className="mx-2 text-sm font-medium">
                                    {getShowtimeCount(movie.movie_ID)}
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const currentCount = getShowtimeCount(movie.movie_ID);
                                      if (currentCount < 10) {
                                        updateShowtimeCount(movie.movie_ID, currentCount + 1);
                                      }
                                    }}
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {selectedMovies.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h5 className="font-medium text-blue-800 mb-3">Phim đã chọn</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedMovies.map(movie => (
                            <div 
                              key={movie.movie_ID} 
                              className="flex items-center bg-white px-3 py-2 rounded-lg border border-blue-200"
                            >
                              <img 
                                src={movie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                                alt={movie.title}
                                className="w-8 h-8 rounded object-cover mr-2"
                              />
                              <span className="text-sm font-medium mr-2">{movie.title}</span>
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {getShowtimeCount(movie.movie_ID)} suất
                              </span>
                              <button 
                                onClick={() => toggleMovieSelection(movie)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <FaTimes size={12} />
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <FaDoorOpen className="mr-2 text-blue-500" />
                      Bước 2: Chọn phòng chiếu
                    </h4>
                    
                    {validationErrors.cinemaRoomId && (
                      <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                        <div className="flex items-center">
                          <FaExclamationTriangle className="mr-2" />
                          <span>{validationErrors.cinemaRoomId}</span>
                        </div>
                      </div>
                    )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {cinemaRooms.map(room => (
                        <div 
                          key={room.cinema_Room_ID}
                          onClick={() => selectRoom(room)}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                            selectedRoom?.cinema_Room_ID === room.cinema_Room_ID 
                              ? 'border-blue-500 bg-blue-50 shadow-md' 
                              : 'border-gray-200 hover:border-blue-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-800 text-lg">{room.room_Name}</h5>
                            {selectedRoom?.cinema_Room_ID === room.cinema_Room_ID && (
                              <div className="bg-blue-500 text-white p-1 rounded-full">
                                <FaCheck size={12} />
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              room.room_Type === '2D' 
                                ? 'bg-green-100 text-green-800' 
                                : room.room_Type === '3D' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {room.room_Type}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                              {room.seats_Count} chỗ ngồi
                            </span>
                          </div>
                          
                          <div className="mt-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <span className="w-24">Trạng thái:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                room.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {room.status === 'Active' ? 'Hoạt động' : 'Không hoạt động'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {selectedRoom && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h5 className="font-medium text-blue-800 mb-2">Phòng đã chọn</h5>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{selectedRoom.room_Name}</p>
                            <p className="text-xs text-gray-600">Loại phòng: {selectedRoom.room_Type} | Số ghế: {selectedRoom.seats_Count}</p>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedRoom(null);
                              setCinemaRoomId('');
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimes size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* Step 3: Chọn ngày */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      Bước 3: Chọn ngày chiếu
                    </h4>
                    
                    {validationErrors.showDate && (
                      <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                        <div className="flex items-center">
                          <FaExclamationTriangle className="mr-2" />
                          <span>{validationErrors.showDate}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-700">Chọn ngày chiếu</h5>
                        <div className="flex space-x-2">
                          <button 
                            onClick={scrollDatesLeft}
                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            <FaChevronLeft size={14} />
                          </button>
                          <button 
                            onClick={scrollDatesRight}
                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            <FaChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
                        <div className="flex space-x-2">
                          {visibleDates.map((date, index) => (
                            <div 
                              key={index}
                              onClick={() => selectDate(date)}
                              className={`flex-shrink-0 w-20 p-2 rounded-lg cursor-pointer border transition-all ${
                                isDateSelected(date) 
                                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                                  : 'border-gray-200 hover:border-blue-300 bg-white'
                              }`}
                            >
                              <div className="text-center">
                                <p className={`text-xs mb-1 font-medium ${
                                  isToday(date) ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                  {isToday(date) ? 'Hôm nay' : formatDayOfWeek(date)}
                                </p>
                                <p className="text-lg font-bold text-gray-800">{formatDayMonth(date)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hoặc chọn ngày cụ thể</label>
                        <input 
                          type="date" 
                          value={showDate} 
                          onChange={(e) => setShowDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                        />
                      </div>
                    </div>
                    
                    {/* Saved configurations */}
                    {savedConfigurations.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <FaCopy className="mr-2 text-blue-500" />
                          Cấu hình đã lưu gần đây
                        </h4>
                        <div className="space-y-2">
                          {savedConfigurations.map(config => (
                            <div key={config.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium">{formatDate(config.showDate)} - {getRoomName(config.cinemaRoomId)}</div>
                                <div className="text-xs text-gray-500 flex flex-wrap gap-1 mt-1">
                                  {config.movies.map((movie, idx) => (
                                    <span key={idx} className="inline-flex items-center bg-white px-2 py-1 rounded border border-gray-200">
                                      {getMovieName(movie.movieId)} 
                                      <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 rounded-full">
                                        {movie.showtimeCount}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button 
                                onClick={() => applySavedConfig(config)}
                                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors flex items-center text-sm"
                              >
                                <FaCopy className="mr-1" size={12} />
                                Áp dụng
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Summary */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h5 className="font-medium text-blue-800 mb-3">Tóm tắt lịch chiếu</h5>
                      <div className="space-y-3">
                        <div className="flex">
                          <span className="w-24 text-sm text-gray-600">Ngày chiếu:</span>
                          <span className="text-sm font-medium">{showDate ? formatDate(showDate) : 'Chưa chọn'}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-sm text-gray-600">Phòng chiếu:</span>
                          <span className="text-sm font-medium">{selectedRoom ? selectedRoom.room_Name : 'Chưa chọn'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 mb-1">Phim đã chọn:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedMovies.map(movie => (
                              <div key={movie.movie_ID} className="flex items-center bg-white px-2 py-1 rounded border border-gray-200">
                                <img 
                                  src={movie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                                  alt={movie.title}
                                  className="w-6 h-6 rounded object-cover mr-1"
                                />
                                <span className="text-xs font-medium">{movie.title}</span>
                                <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 rounded-full">
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
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                      >
                        {isPreviewLoading ? (
                          <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Đang tạo xem trước...
                          </>
                        ) : (
                          <>
                            <FaEye className="mr-2" />
                            Xem trước lịch chiếu
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Preview section */}
                    {previewData && (
                      <div className="mt-6 border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
                        <div className="p-4 bg-blue-100 border-b border-blue-200">
                          <h4 className="text-md font-medium text-blue-800 flex items-center">
                            <FaEye className="mr-2" />
                            Xem trước lịch chiếu
                          </h4>
                          
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-blue-600 mr-2" />
                              <div>
                                <span className="text-xs text-blue-600 block">Ngày chiếu</span>
                                <span className="font-medium">{formatDate(previewData.date)}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <FaDoorOpen className="text-blue-600 mr-2" />
                              <div>
                                <span className="text-xs text-blue-600 block">Phòng chiếu</span>
                                <span className="font-medium">{previewData.roomName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-blue-200">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                    Phim
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                    Giờ bắt đầu
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                    Giờ kết thúc
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                                    Loại Phòng 
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-blue-100">
                                {previewData.showtimes.$values.map((showtime, index) => {
                                  const movie = movies.find(m => m.title === showtime.movieName);
                                  
                                  return (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center">
                                          {movie && (
                                            <img 
                                              src={movie.poster_URL || 'https://via.placeholder.com/300x450?text=No+Image'} 
                                              alt={showtime.movieName}
                                              className="w-10 h-14 object-cover rounded mr-3"
                                            />
                                          )}
                                          <div>
                                            <div className="font-medium text-gray-900">{showtime.movieName}</div>
                                            {movie && (
                                              <div className="text-xs text-gray-500">{movie.duration} phút</div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center">
                                          <FaClock className="text-green-500 mr-2" />
                                          <span className="text-sm font-medium">{showtime.startTime}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center">
                                          <FaClock className="text-red-500 mr-2" />
                                          <span className="text-sm font-medium">{showtime.endTime}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          showtime.priceTier === 'Normal' 
                                            ? 'bg-green-100 text-green-800' 
                                            : showtime.priceTier === 'Weekend' 
                                              ? 'bg-orange-100 text-orange-800' 
                                              : 'bg-blue-100 text-blue-800'
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
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                <button 
                  onClick={currentStep > 1 ? goToPreviousStep : () => setIsOpen(false)} 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-sm flex items-center"
                >
                  {currentStep > 1 ? (
                    <>
                      <FaChevronLeft className="mr-2" />
                      Quay lại
                    </>
                  ) : 'Hủy'}
                </button>
                
                <div className="flex space-x-3">
                  {currentStep < 3 ? (
                    <button 
                      onClick={goToNextStep} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                    >
                      Tiếp tục
                      <FaArrowRight className="ml-2" />
                    </button>
                  ) : (
                    <button 
                      onClick={createShowtimes} 
                      disabled={isLoading || !previewData}
                      className={`px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center ${
                        isLoading || !previewData
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
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
                          Tạo lịch chiếu
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

                    

