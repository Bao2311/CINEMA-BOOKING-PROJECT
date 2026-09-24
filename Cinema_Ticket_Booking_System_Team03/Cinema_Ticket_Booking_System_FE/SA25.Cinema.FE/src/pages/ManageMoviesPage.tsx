// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import {
//   Plus,
//   RefreshCw,
//   ChevronLeft,
//   ChevronRight,
//   Edit,
//   Trash2,
//   Search,
//   Film,
//   Calendar,
//   Clock,
//   Star,
//   Globe,
//   Info,
// } from "lucide-react";
// import Modal from "../components/Admin/Modal";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { useNavigate } from "react-router-dom"; // Thêm useNavigate để điều hướng
// // Định nghĩa kiểu dữ liệu Movie
// interface Movie {
//   movie_ID: number;
//   movie_Name: string;
//   release_Date: string;
//   end_Date: string;
//   production_Company: string;
//   director: string;
//   cast: string;
//   duration: number;
//   genre: string;
//   rating: string;
//   language: string;
//   country: string;
//   synopsis: string;
//   poster_URL: string;
//   trailer_Link: string;
//   status: string;
// }

// // Định nghĩa kiểu dữ liệu cho bộ lọc tìm kiếm
// interface SearchFilters {
//   movieId: string;
//   movieName: string;
//   genre: string;
//   language: string;
//   rating: string;
//   status: string;
// }

// // Component Spinner để hiển thị trạng thái đang tải
// const Spinner = () => (
//   <div className="flex justify-center items-center">
//     <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
//   </div>
// );

// // Component Badge để hiển thị trạng thái phim
// const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
//   const getStatusColor = () => {
//     switch (status) {
//       case "Now Showing":
//         return "bg-green-500";
//       case "Coming Soon":
//         return "bg-blue-500";
//       default:
//         return "bg-red-500";
//     }
//   };

//   return (
//     <span
//       className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}
//     >
//       {status}
//     </span>
//   );
// };

// // Component AlertDialog để xác nhận xóa
// const AlertDialog: React.FC<{
//   isOpen: boolean;
//   title: string;
//   message: string;
//   onConfirm: () => void;
//   onCancel: () => void;
// }> = ({ isOpen, title, message, onConfirm, onCancel }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg p-6 max-w-md w-full">
//         <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
//         <p className="text-sm text-gray-500 mb-4">{message}</p>
//         <div className="flex justify-end space-x-2">
//           <button
//             onClick={onCancel}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//           >
//             Hủy
//           </button>
//           <button
//             onClick={onConfirm}
//             className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
//           >
//             Xác nhận
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const API_URL = API_URL;

// const ManageMoviesPage: React.FC = () => {
//   // State quản lý danh sách phim
//   const [movies, setMovies] = useState<Movie[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const navigate = useNavigate();
//   // State quản lý phân trang
//   const [currentPage, setCurrentPage] = useState(1);
//   const moviesPerPage = 5;

//   // State quản lý modal
//   const [isAddingMovie, setIsAddingMovie] = useState(false);
//   const [isUpdatingMovie, setIsUpdatingMovie] = useState(false);
//   const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
//   const [posterFile, setPosterFile] = useState<File | null>(null);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

//   // State quản lý bộ lọc tìm kiếm
//   const [searchFilters, setSearchFilters] = useState<SearchFilters>({
//     movieId: "",
//     movieName: "",
//     genre: "",
//     language: "",
//     rating: "",
//     status: "",
//   });

//   // State quản lý form thêm/sửa phim
//   const [newMovie, setNewMovie] = useState<Movie>({
//     movie_ID: 0,
//     movie_Name: "",
//     release_Date: "",
//     end_Date: "",
//     production_Company: "",
//     director: "",
//     cast: "",
//     duration: 0,
//     genre: "",
//     rating: "",
//     language: "",
//     country: "",
//     synopsis: "",
//     poster_URL: "",
//     trailer_Link: "",
//     status: "",
//   });

//   // Lấy token từ localStorage
//   const getToken = () => {
//     return localStorage.getItem("token") || sessionStorage.getItem("token");
//   };

//   // Lấy role từ localStorage
//   const getRole = () => {
//     return localStorage.getItem("role") || sessionStorage.getItem("role");
//   };

//   // Kiểm tra quyền truy cập
//   useEffect(() => {
//     const role = getRole();
//     if (role !== "Admin") {
//       toast.error("Bạn không có quyền truy cập trang này.");
//       navigate("/"); // Điều hướng sang trang unauthorized
//     }
//   }, [navigate]);
//   // Hàm fetch danh sách phim
//   const fetchMovies = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);
//     const token = getToken();

//     if (!token) {
//       setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.get(`${API_URL}/Movie`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (
//         response.data &&
//         response.data.$values &&
//         Array.isArray(response.data.$values)
//       ) {
//         setMovies(response.data.$values);
//       } else {
//         setError("Định dạng dữ liệu không hợp lệ.");
//       }
//     } catch (error: any) {
//       console.error("Error fetching movies:", error);
//       if (error.response && error.response.status === 404) {
//         setError(
//           "Không tìm thấy API phim. Vui lòng kiểm tra URL hoặc máy chủ."
//         );
//       } else if (error.response && error.response.status === 401) {
//         setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
//       } else {
//         setError("Đã xảy ra lỗi khi tải dữ liệu phim.");
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // Khởi tạo danh sách phim
//   useEffect(() => {
//     fetchMovies();
//   }, [fetchMovies]);

//   // Hàm thêm phim mới
//   const addMovie = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     const token = getToken();

//     if (!token) {
//       toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       const formData = new FormData();

//       // Thêm các trường dữ liệu vào FormData
//       Object.entries(newMovie).forEach(([key, value]) => {
//         if (
//           key !== "movie_ID" &&
//           key !== "poster_URL" &&
//           value !== null &&
//           value !== undefined
//         ) {
//           formData.append(key, value.toString());
//         }
//       });

//       // Thêm file poster nếu có
//       if (posterFile) {
//         formData.append("posterFile", posterFile);
//       }

//       const response = await axios.post(`${API_URL}/Movie`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       if (response.status === 201 || response.status === 200) {
//         toast.success("Thêm phim thành công!");
//         setMovies([...movies, response.data]);
//         resetNewMovie();
//         setIsAddingMovie(false);
//         await fetchMovies(); // Refresh danh sách phim
//       }
//     } catch (error: any) {
//       console.error("Error adding movie:", error);
//       const errorMessage =
//         error.response?.data?.message || "Đã xảy ra lỗi khi thêm phim.";
//       toast.error(`Lỗi: ${errorMessage}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Hàm cập nhật phim
//   const updateMovie = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     const token = getToken();

//     if (!token) {
//       toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       const formData = new FormData();

//       // Thêm các trường dữ liệu vào FormData
//       Object.entries(newMovie).forEach(([key, value]) => {
//         if (value !== null && value !== undefined) {
//           formData.append(key, value.toString());
//         }
//       });

//       // Xử lý poster
//       if (posterFile) {
//         formData.append("posterFile", posterFile);
//       } else if (!posterFile && newMovie.poster_URL) {
//         // Nếu không có file mới và có poster_URL, tạo một file rỗng
//         const emptyBlob = new Blob([], { type: 'application/octet-stream' });
//         const emptyFile = new File([emptyBlob], 'empty.jpg', { type: 'image/jpeg' });
//         formData.append("posterFile", emptyFile);
//         // Thêm flag để backend biết là giữ poster cũ
//         formData.append("keepExistingPoster", "true");
//       } else {
//         toast.error("Vui lòng chọn poster cho phim");
//         setIsSubmitting(false);
//         return;
//       }

//       const response = await axios.put(`${API_URL}/Movie`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       if (response.status === 200) {
//         toast.success("Cập nhật phim thành công!");
//         setMovies(
//           movies.map((movie) =>
//             movie.movie_ID === newMovie.movie_ID ? response.data : movie
//           )
//         );
//         resetNewMovie();
//         setIsUpdatingMovie(false);
//         await fetchMovies(); // Refresh danh sách phim
//       }
//     } catch (error: any) {
//       console.error("Error updating movie:", error);
//       const errorMessage =
//         error.response?.data?.message || "Đã xảy ra lỗi khi cập nhật phim.";
//       toast.error(`Lỗi: ${errorMessage}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Hàm xóa phim
//   const deleteMovie = async () => {
//     if (!movieToDelete) return;

//     setIsSubmitting(true);
//     const token = getToken();

//     if (!token) {
//       toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       const response = await axios.delete(
//         `${API_URL}/Movie/${movieToDelete.movie_ID}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.status === 200) {
//         toast.success("Xóa phim thành công!");
//         setMovies(
//           movies.filter((movie) => movie.movie_ID !== movieToDelete.movie_ID)
//         );

//         // Điều chỉnh trang hiện tại nếu đã xóa phim cuối cùng của trang
//         const remainingMovies = movies.filter(
//           (movie) => movie.movie_ID !== movieToDelete.movie_ID
//         );
//         const totalPages = Math.ceil(remainingMovies.length / moviesPerPage);
//         if (currentPage > totalPages && totalPages > 0) {
//           setCurrentPage(totalPages);
//         }
//       }
//     } catch (error: any) {
//       console.error("Error deleting movie:", error);
//       const errorMessage =
//         error.response?.data?.message || "Đã xảy ra lỗi khi xóa phim.";
//       toast.error(`Lỗi: ${errorMessage}`);
//     } finally {
//       setIsSubmitting(false);
//       setShowDeleteConfirm(false);
//       setMovieToDelete(null);
//     }
//   };

//   // Hàm mở form chỉnh sửa phim
//   const editMovie = (movie: Movie) => {
//     setCurrentMovie(movie);
//     setNewMovie(movie);
//     setIsUpdatingMovie(true);
//   };

//   // Hàm xác nhận xóa phim
//   const confirmDeleteMovie = (movie: Movie) => {
//     setMovieToDelete(movie);
//     setShowDeleteConfirm(true);
//   };

//   // Hàm reset form thêm/sửa phim
//   const resetNewMovie = () => {
//     setNewMovie({
//       movie_ID: 0,
//       movie_Name: "",
//       release_Date: "",
//       end_Date: "",
//       production_Company: "",
//       director: "",
//       cast: "",
//       duration: 0,
//       genre: "",
//       rating: "",
//       language: "",
//       country: "",
//       synopsis: "",
//       poster_URL: "",
//       trailer_Link: "",
//       status: "",
//     });
//     setPosterFile(null);
//   };

//   // Hàm reset bộ lọc tìm kiếm
//   const resetFilters = () => {
//     setSearchFilters({
//       movieId: "",
//       movieName: "",
//       genre: "",
//       language: "",
//       rating: "",
//       status: "",
//     });
//   };

//   // Lọc danh sách phim theo bộ lọc tìm kiếm
//   const filteredMovies = useMemo(() => {
//     return movies.filter((movie) => {
//       return (
//         (searchFilters.movieId === "" ||
//           movie.movie_ID.toString().includes(searchFilters.movieId)) &&
//         (searchFilters.movieName === "" ||
//           movie.movie_Name
//             .toLowerCase()
//             .includes(searchFilters.movieName.toLowerCase())) &&
//         (searchFilters.genre === "" ||
//           movie.genre
//             .toLowerCase()
//             .includes(searchFilters.genre.toLowerCase())) &&
//         (searchFilters.language === "" ||
//           movie.language
//             .toLowerCase()
//             .includes(searchFilters.language.toLowerCase())) &&
//         (searchFilters.rating === "" ||
//           movie.rating
//             .toLowerCase()
//             .includes(searchFilters.rating.toLowerCase())) &&
//         (searchFilters.status === "" ||
//           movie.status
//             .toLowerCase()
//             .includes(searchFilters.status.toLowerCase()))
//       );
//     });
//   }, [movies, searchFilters]);

//   // Tính toán danh sách phim hiển thị trên trang hiện tại
//   const currentMovies = useMemo(() => {
//     const indexOfLastMovie = currentPage * moviesPerPage;
//     const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
//     return filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
//   }, [filteredMovies, currentPage, moviesPerPage]);

//   // Tính tổng số trang
//   const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

//   // Hàm xử lý thay đổi giá trị input
//   const handleInputChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const { id, value } = e.target;
//     setNewMovie((prev) => ({ ...prev, [id]: value }));
//   };

//   // Hàm xử lý thay đổi file poster
//   const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setPosterFile(e.target.files[0]);
//     }
//   };

//   // Hàm xử lý thay đổi bộ lọc tìm kiếm
//   const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setSearchFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
//         <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý phim</h1>

//         {/* Actions bar */}
//         <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
//           <button
//             onClick={() => setIsAddingMovie(true)}
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center transition-colors"
//           >
//             <Plus className="h-5 w-5 mr-2" />
//             Thêm phim mới
//           </button>
//           <button
//             onClick={fetchMovies}
//             className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center transition-colors"
//           >
//             <RefreshCw className="h-5 w-5 mr-2" />
//             Làm mới
//           </button>
//         </div>

//         {/* Error message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
//             <Info className="h-5 w-5 mr-2" />
//             <span>{error}</span>
//           </div>
//         )}

//         {/* Search filters */}
//         <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
//           <div className="p-4 border-b border-gray-200 bg-gray-50">
//             <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
//               <Search className="h-5 w-5 mr-2" />
//               Bộ lọc tìm kiếm
//             </h3>
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   ID
//                 </label>
//                 <input
//                   type="text"
//                   name="movieId"
//                   value={searchFilters.movieId}
//                   onChange={handleFilterChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Tìm theo ID"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Tên phim
//                 </label>
//                 <input
//                   type="text"
//                   name="movieName"
//                   value={searchFilters.movieName}
//                   onChange={handleFilterChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Tìm theo tên"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Thể loại
//                 </label>
//                 <input
//                   type="text"
//                   name="genre"
//                   value={searchFilters.genre}
//                   onChange={handleFilterChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Tìm theo thể loại"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Ngôn ngữ
//                 </label>
//                 <input
//                   type="text"
//                   name="language"
//                   value={searchFilters.language}
//                   onChange={handleFilterChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Tìm theo ngôn ngữ"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Xếp hạng
//                 </label>
//                 <input
//                   type="text"
//                   name="rating"
//                   value={searchFilters.rating}
//                   onChange={handleFilterChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Tìm theo xếp hạng"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Trạng thái
//                 </label>
//                 <input
//                   type="text"
//                   name="status"
//                   value={searchFilters.status}
//                   onChange={handleFilterChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Tìm theo trạng thái"
//                 />
//               </div>
//             </div>
//             <div className="mt-4 flex justify-end">
//               <button
//                 onClick={resetFilters}
//                 className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
//               >
//                 Xóa bộ lọc
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Movies table */}
//         <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
//           {isLoading ? (
//             <div className="flex justify-center items-center h-64">
//               <Spinner />
//               <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
//             </div>
//           ) : filteredMovies.length === 0 ? (
//             <div className="p-8 text-center text-gray-500">
//               <Film className="h-12 w-12 mx-auto mb-4 text-gray-400" />
//               <h3 className="text-lg font-medium text-gray-900 mb-1">
//                 Không tìm thấy phim nào
//               </h3>
//               <p>Thử thay đổi bộ lọc tìm kiếm hoặc thêm phim mới.</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       ID
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Hình ảnh
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Tên phim
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Năm phát hành
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Thể loại
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Ngôn ngữ
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Xếp hạng
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Trạng thái
//                     </th>
//                     <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Thao tác
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {currentMovies.map((movie) => (
//                     <tr key={movie.movie_ID} className="hover:bg-gray-50">
//                       <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {movie.movie_ID}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap">
//                         <div className="h-16 w-12 overflow-hidden rounded">
//                           {movie.poster_URL ? (
//                             <img
//                               src={movie.poster_URL}
//                               alt={movie.movie_Name}
//                               className="h-full w-full object-cover"
//                               onError={(e) => {
//                                 (e.target as HTMLImageElement).src =
//                                   "https://via.placeholder.com/150x225?text=No+Image";
//                               }}
//                             />
//                           ) : (
//                             <div className="h-full w-full bg-gray-200 flex items-center justify-center">
//                               <Film className="h-6 w-6 text-gray-400" />
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
//                         {movie.movie_Name}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
//                         {movie.release_Date
//                           ? new Date(movie.release_Date).getFullYear()
//                           : "N/A"}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
//                         {movie.genre}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
//                         {movie.language}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
//                         {movie.rating}
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm">
//                         <StatusBadge status={movie.status} />
//                       </td>
//                       <td className="px-4 py-3 whitespace-nowrap text-sm">
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => editMovie(movie)}
//                             className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
//                             title="Chỉnh sửa"
//                           >
//                             <Edit className="h-5 w-5" />
//                           </button>
//                           <button
//                             onClick={() => confirmDeleteMovie(movie)}
//                             className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
//                             title="Xóa"
//                           >
//                             <Trash2 className="h-5 w-5" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* Pagination */}
//           {!isLoading && filteredMovies.length > 0 && (
//             <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
//               <div className="flex-1 flex justify-between sm:hidden">
//                 <button
//                   onClick={() =>
//                     setCurrentPage((prev) => Math.max(prev - 1, 1))
//                   }
//                   disabled={currentPage === 1}
//                   className={`px-4 py-2 border border-gray-300 rounded-md ${
//                     currentPage === 1
//                       ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                       : "bg-white text-gray-700 hover:bg-gray-50"
//                   }`}
//                 >
//                   Trước
//                 </button>
//                 <button
//                   onClick={() =>
//                     setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//                   }
//                   disabled={currentPage === totalPages}
//                   className={`px-4 py-2 border border-gray-300 rounded-md ${
//                     currentPage === totalPages
//                       ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                       : "bg-white text-gray-700 hover:bg-gray-50"
//                   }`}
//                 >
//                   Sau
//                 </button>
//               </div>
//               <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//                 <div>
//                   <p className="text-sm text-gray-700">
//                     Hiển thị{" "}
//                     <span className="font-medium">
//                       {(currentPage - 1) * moviesPerPage + 1}
//                     </span>{" "}
//                     đến{" "}
//                     <span className="font-medium">
//                       {Math.min(
//                         currentPage * moviesPerPage,
//                         filteredMovies.length
//                       )}
//                     </span>{" "}
//                     trong tổng số{" "}
//                     <span className="font-medium">{filteredMovies.length}</span>{" "}
//                     phim
//                   </p>
//                 </div>
//                 <div>
//                   <nav
//                     className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
//                     aria-label="Pagination"
//                   >
//                     <button
//                       onClick={() =>
//                         setCurrentPage((prev) => Math.max(prev - 1, 1))
//                       }
//                       disabled={currentPage === 1}
//                       className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
//                         currentPage === 1
//                           ? "text-gray-300 cursor-not-allowed"
//                           : "text-gray-500 hover:bg-gray-50"
//                       }`}
//                     >
//                       <span className="sr-only">Trang trước</span>
//                       <ChevronLeft className="h-5 w-5" />
//                     </button>

//                     {/* Page numbers */}
//                     {Array.from({ length: Math.min(5, totalPages) }).map(
//                       (_, i) => {
//                         let pageNum;

//                         if (totalPages <= 5) {
//                           pageNum = i + 1;
//                         } else if (currentPage <= 3) {
//                           pageNum = i + 1;
//                         } else if (currentPage >= totalPages - 2) {
//                           pageNum = totalPages - 4 + i;
//                         } else {
//                           pageNum = currentPage - 2 + i;
//                         }

//                         return (
//                           <button
//                             key={pageNum}
//                             onClick={() => setCurrentPage(pageNum)}
//                             className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
//                               currentPage === pageNum
//                                 ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
//                                 : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
//                             }`}
//                           >
//                             {pageNum}
//                           </button>
//                         );
//                       }
//                     )}

//                     <button
//                       onClick={() =>
//                         setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//                       }
//                       disabled={currentPage === totalPages}
//                       className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
//                         currentPage === totalPages
//                           ? "text-gray-300 cursor-not-allowed"
//                           : "text-gray-500 hover:bg-gray-50"
//                       }`}
//                     >
//                       <span className="sr-only">Trang sau</span>
//                       <ChevronRight className="h-5 w-5" />
//                     </button>
//                   </nav>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modal for Adding Movie */}
//       <Modal
//         isOpen={isAddingMovie}
//         onClose={() => !isSubmitting && setIsAddingMovie(false)}
//       >
//         <div className="p-6">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//             <Film className="h-6 w-6 mr-2 text-blue-600" />
//             Thêm phim mới
//           </h2>
//           <form
//             onSubmit={addMovie}
//             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
//           >
//             <div className="mb-4">
//               <label
//                 htmlFor="movie_Name"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Tên phim *
//               </label>
//               <input
//                 type="text"
//                 id="movie_Name"
//                 value={newMovie.movie_Name}
//                 onChange={handleInputChange}
//                 placeholder="Nhập tên phim"
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="release_Date"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Ngày phát hành *
//               </label>
//               <input
//                 type="date"
//                 id="release_Date"
//                 value={
//                   newMovie.release_Date
//                     ? newMovie.release_Date.split("T")[0]
//                     : ""
//                 }
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 Định dạng: YYYY-MM-DD
//               </p>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="end_Date"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Ngày kết thúc
//               </label>
//               <input
//                 type="date"
//                 id="end_Date"
//                 value={newMovie.end_Date ? newMovie.end_Date.split("T")[0] : ""}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 Định dạng: YYYY-MM-DD
//               </p>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="production_Company"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Công ty sản xuất *
//               </label>
//               <input
//                 type="text"
//                 id="production_Company"
//                 value={newMovie.production_Company}
//                 onChange={handleInputChange}
//                 placeholder="Nhập tên công ty sản xuất"
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="director"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Đạo diễn *
//               </label>
//               <input
//                 type="text"
//                 id="director"
//                 value={newMovie.director}
//                 onChange={handleInputChange}
//                 placeholder="Nhập tên đạo diễn"
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="cast"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Diễn viên *
//               </label>
//               <input
//                 type="text"
//                 id="cast"
//                 value={newMovie.cast}
//                 onChange={handleInputChange}
//                 placeholder="Nhập danh sách diễn viên"
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="duration"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Thời lượng (phút) *
//               </label>
//               <input
//                 type="number"
//                 id="duration"
//                 value={newMovie.duration || ""}
//                 onChange={handleInputChange}
//                 placeholder="Nhập thời lượng phim"
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 min="1"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="genre"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Thể loại *
//               </label>
//               <select
//                 id="genre"
//                 value={newMovie.genre}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">{newMovie.genre || "Chọn thể loại"}</option>
//                 <option value="Hành động">Hành động</option>
//                 <option value="Hài hước">Hài hước</option>
//                 <option value="Tình cảm">Tình cảm</option>
//                 <option value="Tâm lý – Kịch tính">Tâm lý – Kịch tính</option>
//                 <option value="Kinh dị">Kinh dị</option>
//                 <option value="Phiêu lưu">Phiêu lưu</option>
//                 <option value="Khoa học viễn tưởng">Khoa học viễn tưởng</option>
//                 <option value="Hoạt hình">Hoạt hình</option>
//                 <option value="Tội phạm – Hình sự">Tội phạm – Hình sự</option>
//                 <option value="Chiến tranh">Chiến tranh</option>
//                 <option value="Âm nhạc">Âm nhạc</option>
//                 <option value="Tài liệu">Tài liệu</option>
//                 <option value="Kỳ ảo">Kỳ ảo</option>
//               </select>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="rating"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Xếp hạng *
//               </label>
//               <select
//                 id="rating"
//                 value={newMovie.rating}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">Chọn xếp hạng</option>
//                 <option value="P">P - Phổ thông</option>
//                 <option value="P13">P13 - Cấm trẻ em dưới 13 tuổi</option>
//                 <option value="P16">P16 - Cấm trẻ em dưới 16 tuổi</option>
//                 <option value="P18">P18 - Cấm trẻ em dưới 18 tuổi</option>
//               </select>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="language"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Ngôn ngữ *
//               </label>
//               <select
//                 id="language"
//                 value={newMovie.language}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">{newMovie.language || "Chọn ngôn ngữ"}</option>
//                 <option value="Tiếng Anh">Tiếng Anh</option>
//                 <option value="Tiếng Hàn">Tiếng Hàn</option>
//                 <option value="Tiếng Trung">Tiếng Trung</option>
//                 <option value="Tiếng Nhật">Tiếng Nhật</option>
//                 <option value="Tiếng Việt">Tiếng Việt</option>
//                 <option value="Tiếng Pháp">Tiếng Pháp</option>
//                 <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
//                 <option value="Tiếng Hindi (Ấn Độ)">Tiếng Hindi (Ấn Độ)</option>
//                 <option value="Tiếng Đức">Tiếng Đức</option>
//                 <option value="Tiếng Thái">Tiếng Thái</option>
//               </select>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="country"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Quốc gia *
//               </label>
//               <select
//                 id="country"
//                 value={newMovie.country}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">{newMovie.country || "Chọn quốc gia"}</option>
//                 <option value="Mỹ">Mỹ</option>
//                 <option value="Hàn Quốc">Hàn Quốc</option>
//                 <option value="Trung Quốc">Trung Quốc</option>
//                 <option value="Nhật Bản">Nhật Bản</option>
//                 <option value="Việt Nam">Việt Nam</option>
//                 <option value="Pháp">Pháp</option>
//                 <option value="Ấn Độ">Ấn Độ</option>
//                 <option value="Thái Lan">Thái Lan</option>
//                 <option value="Anh Quốc">Anh Quốc</option>
//                 <option value="Mexico">Mexico</option>
//                 <option value="Tây Ban Nha">Tây Ban Nha</option>
//               </select>
//             </div>

//             <div className="mb-4 md:col-span-2">
//               <label
//                 htmlFor="synopsis"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Tóm tắt nội dung *
//               </label>
//               <textarea
//                 id="synopsis"
//                 value={newMovie.synopsis}
//                 onChange={handleInputChange}
//                 placeholder="Nhập tóm tắt nội dung phim"
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 rows={3}
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="trailer_Link"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Link trailer *
//               </label>
//               <input
//                 type="url"
//                 id="trailer_Link"
//                 value={newMovie.trailer_Link}
//                 onChange={handleInputChange}
//                 placeholder="https://www.youtube.com/watch?v=..."
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="posterFile"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Poster phim
//               </label>
//               <input
//                 type="file"
//                 id="posterFile"
//                 accept="image/*"
//                 onChange={handlePosterChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 Định dạng: JPG, PNG. Kích thước tối đa: 2MB
//               </p>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="status"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Trạng thái *
//               </label>
//               <select
//                 id="status"
//                 value={newMovie.status}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">Chọn trạng thái</option>
//                 <option value="Now Showing">Đang chiếu</option>
//                 <option value="Coming Soon">Sắp chiếu</option>
//                 <option value="Ended">Đã kết thúc</option>
//               </select>
//             </div>

//             <div className="flex items-center justify-between col-span-full mt-4">
//               <p className="text-sm text-gray-500">* Trường bắt buộc</p>
//               <div className="flex space-x-2">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setIsAddingMovie(false);
//                     resetNewMovie();
//                   }}
//                   disabled={isSubmitting}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
//                 >
//                   Hủy
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   {isSubmitting ? (
//                     <div className="flex items-center">
//                       <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
//                       Đang xử lý...
//                     </div>
//                   ) : (
//                     "Thêm phim"
//                   )}
//                 </button>
//               </div>
//             </div>
//           </form>
//         </div>
//       </Modal>

//       {/* Modal for Updating Movie */}
//       <Modal
//         isOpen={isUpdatingMovie}
//         onClose={() => !isSubmitting && setIsUpdatingMovie(false)}
//       >
//         <div className="p-6">
//           <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
//             <Edit className="h-6 w-6 mr-2 text-blue-600" />
//             Cập nhật phim
//           </h2>
//           <form
//             onSubmit={updateMovie}
//             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
//           >
//             <div className="mb-4">
//               <label
//                 htmlFor="movie_Name"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Tên phim *
//               </label>
//               <input
//                 type="text"
//                 id="movie_Name"
//                 value={newMovie.movie_Name}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="release_Date"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Ngày phát hành *
//               </label>
//               <input
//                 type="date"
//                 id="release_Date"
//                 value={
//                   newMovie.release_Date
//                     ? newMovie.release_Date.split("T")[0]
//                     : ""
//                 }
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="end_Date"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Ngày kết thúc
//               </label>
//               <input
//                 type="date"
//                 id="end_Date"
//                 value={newMovie.end_Date ? newMovie.end_Date.split("T")[0] : ""}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="production_Company"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Công ty sản xuất *
//               </label>
//               <input
//                 type="text"
//                 id="production_Company"
//                 value={newMovie.production_Company}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="director"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Đạo diễn *
//               </label>
//               <input
//                 type="text"
//                 id="director"
//                 value={newMovie.director}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="cast"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Diễn viên *
//               </label>
//               <input
//                 type="text"
//                 id="cast"
//                 value={newMovie.cast}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="duration"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Thời lượng (phút) *
//               </label>
//               <input
//                 type="number"
//                 id="duration"
//                 value={newMovie.duration || ""}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 min="1"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="genre"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Thể loại *
//               </label>
//               <select
//                 id="genre"
//                 value={newMovie.genre}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">{newMovie.genre || "Chọn thể loại"}</option>
//                 <option value="Hành động">Hành động</option>
//                 <option value="Hài hước">Hài hước</option>
//                 <option value="Tình cảm">Tình cảm</option>
//                 <option value="Tâm lý – Kịch tính">Tâm lý – Kịch tính</option>
//                 <option value="Kinh dị">Kinh dị</option>
//                 <option value="Phiêu lưu">Phiêu lưu</option>
//                 <option value="Khoa học viễn tưởng">Khoa học viễn tưởng</option>
//                 <option value="Hoạt hình">Hoạt hình</option>
//                 <option value="Tội phạm – Hình sự">Tội phạm – Hình sự</option>
//                 <option value="Chiến tranh">Chiến tranh</option>
//                 <option value="Âm nhạc">Âm nhạc</option>
//                 <option value="Tài liệu">Tài liệu</option>
//                 <option value="Kỳ ảo">Kỳ ảo</option>
//               </select>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="rating"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Xếp hạng *
//               </label>
//               <select
//                 id="rating"
//                 value={newMovie.rating}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">Chọn xếp hạng</option>
//                 <option value="P">P - Phổ thông</option>
//                 <option value="P13">P13 - Cấm trẻ em dưới 13 tuổi</option>
//                 <option value="P16">P16 - Cấm trẻ em dưới 16 tuổi</option>
//                 <option value="P18">P18 - Cấm trẻ em dưới 18 tuổi</option>
//               </select>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="language"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Ngôn ngữ *
//               </label>
//               <select
//                 id="language"
//                 value={newMovie.language}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">{newMovie.language || "Chọn ngôn ngữ"}</option>
//                 <option value="Tiếng Anh">Tiếng Anh</option>
//                 <option value="Tiếng Hàn">Tiếng Hàn</option>
//                 <option value="Tiếng Trung">Tiếng Trung</option>
//                 <option value="Tiếng Nhật">Tiếng Nhật</option>
//                 <option value="Tiếng Việt">Tiếng Việt</option>
//                 <option value="Tiếng Pháp">Tiếng Pháp</option>
//                 <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
//                 <option value="Tiếng Hindi (Ấn Độ)">Tiếng Hindi (Ấn Độ)</option>
//                 <option value="Tiếng Đức">Tiếng Đức</option>
//                 <option value="Tiếng Thái">Tiếng Thái</option>
//               </select>
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="country"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Quốc gia *
//               </label>
//               <select
//                 id="country"
//                 value={newMovie.country}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">{newMovie.country || "Chọn quốc gia"}</option>
//                 <option value="Mỹ">Mỹ</option>
//                 <option value="Hàn Quốc">Hàn Quốc</option>
//                 <option value="Trung Quốc">Trung Quốc</option>
//                 <option value="Nhật Bản">Nhật Bản</option>
//                 <option value="Việt Nam">Việt Nam</option>
//                 <option value="Pháp">Pháp</option>
//                 <option value="Ấn Độ">Ấn Độ</option>
//                 <option value="Thái Lan">Thái Lan</option>
//                 <option value="Anh Quốc">Anh Quốc</option>
//                 <option value="Mexico">Mexico</option>
//                 <option value="Tây Ban Nha">Tây Ban Nha</option>
//               </select>
//             </div>

//             <div className="mb-4 md:col-span-2">
//               <label
//                 htmlFor="synopsis"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Tóm tắt nội dung *
//               </label>
//               <textarea
//                 id="synopsis"
//                 value={newMovie.synopsis}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 rows={3}
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="trailer_Link"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Link trailer *
//               </label>
//               <input
//                 type="url"
//                 id="trailer_Link"
//                 value={newMovie.trailer_Link}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="posterFile"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Poster phim (Để trống để giữ poster hiện tại)
//               </label>
//               <input
//                 type="file"
//                 id="posterFile"
//                 accept="image/*"
//                 onChange={handlePosterChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//               {newMovie.poster_URL && (
//                 <div className="mt-2 flex items-center">
//                   <span className="text-sm text-gray-500 mr-2">
//                     Poster hiện tại:
//                   </span>
//                   <img
//                     src={newMovie.poster_URL}
//                     alt="Current poster"
//                     className="h-16 w-12 object-cover rounded"
//                   />
//                 </div>
//               )}
//             </div>

//             <div className="mb-4">
//               <label
//                 htmlFor="status"
//                 className="block text-gray-700 text-sm font-bold mb-2"
//               >
//                 Trạng thái *
//               </label>
//               <select
//                 id="status"
//                 value={newMovie.status}
//                 onChange={handleInputChange}
//                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">Chọn trạng thái</option>
//                 <option value="Now Showing">Đang chiếu</option>
//                 <option value="Coming Soon">Sắp chiếu</option>
//                 <option value="Ended">Đã kết thúc</option>
//               </select>
//             </div>

//             <div className="flex items-center justify-between col-span-full mt-4">
//               <p className="text-sm text-gray-500">* Trường bắt buộc</p>
//               <div className="flex space-x-2">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setIsUpdatingMovie(false);
//                     resetNewMovie();
//                   }}
//                   disabled={isSubmitting}
//                   className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
//                 >
//                   Hủy
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   {isSubmitting ? (
//                     <div className="flex items-center">
//                       <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
//                       Đang xử lý...
//                     </div>
//                   ) : (
//                     "Cập nhật phim"
//                   )}
//                 </button>
//               </div>
//             </div>
//           </form>
//         </div>
//       </Modal>

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog
//         isOpen={showDeleteConfirm}
//         title="Xác nhận xóa phim"
//         message={`Bạn có chắc chắn muốn xóa phim "${movieToDelete?.movie_Name}"? Hành động này không thể hoàn tác.`}
//         onConfirm={deleteMovie}
//         onCancel={() => setShowDeleteConfirm(false)}
//       />

//       {/* Toast notifications */}
//       <ToastContainer position="bottom-right" autoClose={3000} />
//     </div>
//   );
// };

// export default ManageMoviesPage;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Search,
  Film,
  Calendar,
  Clock,
  Star,
  Globe,
  Info,
  Upload,
  X,
  Play,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Modal from "../components/Admin/Modal";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config/apiUrl';

// Định nghĩa kiểu dữ liệu Movie
interface Movie {
  movie_ID: number;
  movie_Name: string;
  release_Date: string;
  end_Date: string;
  production_Company: string;
  director: string;
  cast: string;
  duration: number;
  genre: string;
  rating: string;
  language: string;
  country: string;
  synopsis: string;
  poster_URL: string;
  trailer_Link: string;
  status: string;
}

// Định nghĩa kiểu dữ liệu cho bộ lọc tìm kiếm
interface SearchFilters {
  movieId: string;
  movieName: string;
  genre: string;
  language: string;
  rating: string;
  status: string;
}

// Component Spinner để hiển thị trạng thái đang tải
const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

// Component Badge để hiển thị trạng thái phim
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case "Now Showing":
        return "bg-green-500";
      case "Coming Soon":
        return "bg-blue-500";
      default:
        return "bg-red-500";
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}
    >
      {status}
    </span>
  );
};

// Component AlertDialog để xác nhận xóa
const AlertDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#161D2F] border border-white/10 text-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

// Component để hiển thị video trailer
const TrailerPreview: React.FC<{ trailerUrl: string }> = ({ trailerUrl }) => {
  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  const embedUrl = getYoutubeEmbedUrl(trailerUrl);

  if (!embedUrl) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">URL trailer không hợp lệ hoặc không được hỗ trợ</p>
      </div>
    );
  }

  return (
    <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden border border-white/10">
      <iframe
        src={embedUrl}
        title="Trailer"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
};

// Component để hiển thị và upload poster
const PosterUpload: React.FC<{
  currentPosterUrl?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
}> = ({ currentPosterUrl, onChange, onRemove }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPosterUrl || null);

  useEffect(() => {
    setPreviewUrl(currentPosterUrl || null);
  }, [currentPosterUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    
    if (e.target.files && e.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-gray-300 text-sm font-semibold">
          Poster phim
        </label>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-red-400 hover:text-red-300 text-sm flex items-center transition"
          >
            <X className="h-4 w-4 mr-1" /> Xóa
          </button>
        )}
      </div>
      
      {previewUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40">
          <div className="aspect-w-2 aspect-h-3 max-h-60 overflow-hidden flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Movie poster preview"
              className="object-cover max-h-60 rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=60';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2.5 backdrop-blur-sm transition"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 bg-white/5 hover:border-red-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors"
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-300 font-medium mb-1">Kéo thả hoặc click để tải lên</p>
          <p className="text-xs text-gray-400">PNG, JPG (tối đa 2MB)</p>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        id="posterFile"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

// Component để hiển thị lỗi validation
const ValidationError: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <p className="text-red-400 text-xs mt-1.5 flex items-center">
      <AlertCircle className="h-3.5 w-3.5 mr-1" /> {message}
    </p>
  );
};

// Component để hiển thị các bước trong quy trình tạo phim
const CreateMovieSteps: React.FC<{
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
}> = ({ currentStep, totalSteps, onStepChange }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          return (
            <React.Fragment key={index}>
              <div 
                className={`flex flex-col items-center cursor-pointer transition ${
                  isActive ? 'text-red-400 font-semibold' : isCompleted ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => onStepChange(index)}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 transition-all font-semibold text-sm ${
                  isCompleted 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-[#1E2738] text-gray-400 border border-white/10'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="text-xs">
                  {index === 0 ? 'Thông tin cơ bản' : index === 1 ? 'Chi tiết phim' : 'Media & Trạng thái'}
                </span>
              </div>
              
              {index < totalSteps - 1 && (
                <div className={`flex-1 h-0.5 mx-3 transition-colors ${
                  isCompleted ? 'bg-emerald-500/60' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};



const ManageMoviesPage: React.FC = () => {
  // State quản lý danh sách phim
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // State quản lý phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 5;

  // State quản lý modal
  const [isAddingMovie, setIsAddingMovie] = useState(false);
  const [isUpdatingMovie, setIsUpdatingMovie] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  
  // State quản lý quy trình tạo phim
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 3;
  
  // State quản lý validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showTrailerPreview, setShowTrailerPreview] = useState(false);

  // State quản lý bộ lọc tìm kiếm
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    movieId: "",
    movieName: "",
    genre: "",
    language: "",
    rating: "",
    status: "",
  });

  // State quản lý form thêm/sửa phim
  const [newMovie, setNewMovie] = useState<Movie>({
    movie_ID: 0,
    movie_Name: "",
    release_Date: "",
    end_Date: "",
    production_Company: "",
    director: "",
    cast: "",
    duration: 0,
    genre: "",
    rating: "",
    language: "",
    country: "",
    synopsis: "",
    poster_URL: "",
    trailer_Link: "",
    status: "",
  });

  // Lấy token từ localStorage
  const getToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };

  // Lấy role từ localStorage
  const getRole = () => {
    return localStorage.getItem("role") || sessionStorage.getItem("role");
  };

  // Kiểm tra quyền truy cập
  useEffect(() => {
    const role = getRole();
    if (role !== "Admin") {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate("/"); // Điều hướng sang trang unauthorized
    }
  }, [navigate]);
  
  // Hàm fetch danh sách phim
  const fetchMovies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = getToken();

    if (!token) {
      setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/Movie`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        response.data &&
        response.data.$values &&
        Array.isArray(response.data.$values)
      ) {
        setMovies(response.data.$values);
      } else {
        setError("Định dạng dữ liệu không hợp lệ.");
      }
    } catch (error: any) {
      console.error("Error fetching movies:", error);
      if (error.response && error.response.status === 404) {
        setError(
          "Không tìm thấy API phim. Vui lòng kiểm tra URL hoặc máy chủ."
        );
      } else if (error.response && error.response.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setError("Đã xảy ra lỗi khi tải dữ liệu phim.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Khởi tạo danh sách phim
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Validate form theo từng bước
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (step === 0) {
      // Validate thông tin cơ bản
      if (!newMovie.movie_Name.trim()) {
        errors.movie_Name = "Tên phim không được để trống";
      }
      
      if (!newMovie.release_Date) {
        errors.release_Date = "Ngày phát hành không được để trống";
      }
      
      if (!newMovie.production_Company.trim()) {
        errors.production_Company = "Công ty sản xuất không được để trống";
      }
      
      if (!newMovie.director.trim()) {
        errors.director = "Đạo diễn không được để trống";
      }
    } else if (step === 1) {
      // Validate chi tiết phim
      if (!newMovie.cast.trim()) {
        errors.cast = "Danh sách diễn viên không được để trống";
      }
      
      if (!newMovie.duration || newMovie.duration <= 0) {
        errors.duration = "Thời lượng phải lớn hơn 0";
      }
      
      if (!newMovie.genre) {
        errors.genre = "Vui lòng chọn thể loại";
      }
      
      if (!newMovie.rating) {
        errors.rating = "Vui lòng chọn xếp hạng";
      }
      
      if (!newMovie.language) {
        errors.language = "Vui lòng chọn ngôn ngữ";
      }
      
      if (!newMovie.country) {
        errors.country = "Vui lòng chọn quốc gia";
      }
      
      if (!newMovie.synopsis.trim()) {
        errors.synopsis = "Tóm tắt nội dung không được để trống";
      } else if (newMovie.synopsis.length < 20) {
        errors.synopsis = "Tóm tắt nội dung phải có ít nhất 20 ký tự";
      }
    } else if (step === 2) {
      // Validate media & trạng thái
      if (!newMovie.trailer_Link.trim()) {
        errors.trailer_Link = "Link trailer không được để trống";
      } else {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!youtubeRegex.test(newMovie.trailer_Link)) {
          errors.trailer_Link = "Link trailer phải là URL YouTube hợp lệ";
        }
      }
      
      if (!isUpdatingMovie && !posterFile) {
        errors.posterFile = "Vui lòng tải lên poster cho phim";
      }
      
      if (!newMovie.status) {
        errors.status = "Vui lòng chọn trạng thái";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Hàm xử lý chuyển bước
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepChange = (step: number) => {
    // Chỉ cho phép quay lại các bước trước đó
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step > currentStep) {
      // Nếu muốn nhảy tới bước tiếp theo, phải validate bước hiện tại
      if (validateStep(currentStep)) {
        setCurrentStep(step);
      }
    }
  };

  // Hàm thêm phim mới
  const addMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate bước cuối cùng trước khi submit
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsSubmitting(true);
    const token = getToken();

    if (!token) {
      toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();

      // Thêm các trường dữ liệu vào FormData
      Object.entries(newMovie).forEach(([key, value]) => {
        if (
          key !== "movie_ID" &&
          key !== "poster_URL" &&
          value !== null &&
          value !== undefined
        ) {
          formData.append(key, value.toString());
        }
      });

      // Thêm file poster nếu có
      if (posterFile) {
        formData.append("posterFile", posterFile);
      }

      const response = await axios.post(`${API_URL}/Movie`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast.success("Thêm phim thành công!");
        setMovies([...movies, response.data]);
        resetNewMovie();
        setIsAddingMovie(false);
        await fetchMovies(); // Refresh danh sách phim
      }
    } catch (error: any) {
      console.error("Error adding movie:", error);
      const errorMessage =
        error.response?.data?.message || "Đã xảy ra lỗi khi thêm phim.";
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm cập nhật phim
  const updateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate bước cuối cùng trước khi submit
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsSubmitting(true);
    const token = getToken();

    if (!token) {
      toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();

      // Thêm các trường dữ liệu vào FormData
      Object.entries(newMovie).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Xử lý poster
      if (posterFile) {
        formData.append("posterFile", posterFile);
      } else if (!posterFile && newMovie.poster_URL) {
        // Nếu không có file mới và có poster_URL, tạo một file rỗng
        const emptyBlob = new Blob([], { type: 'application/octet-stream' });
        const emptyFile = new File([emptyBlob], 'empty.jpg', { type: 'image/jpeg' });
        formData.append("posterFile", emptyFile);
        // Thêm flag để backend biết là giữ poster cũ
        formData.append("keepExistingPoster", "true");
      }

      const response = await axios.put(`${API_URL}/Movie`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        toast.success("Cập nhật phim thành công!");
        setMovies(
          movies.map((movie) =>
            movie.movie_ID === newMovie.movie_ID ? response.data : movie
          )
        );
        resetNewMovie();
        setIsUpdatingMovie(false);
        await fetchMovies(); // Refresh danh sách phim
      }
    } catch (error: any) {
      console.error("Error updating movie:", error);
      const errorMessage =
        error.response?.data?.message || "Đã xảy ra lỗi khi cập nhật phim.";
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm xóa phim
  const deleteMovie = async () => {
    if (!movieToDelete) return;

    setIsSubmitting(true);
    const token = getToken();

    if (!token) {
      toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/Movie/${movieToDelete.movie_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Xóa phim thành công!");
        setMovies(
          movies.filter((movie) => movie.movie_ID !== movieToDelete.movie_ID)
        );

        // Điều chỉnh trang hiện tại nếu đã xóa phim cuối cùng của trang
        const remainingMovies = movies.filter(
          (movie) => movie.movie_ID !== movieToDelete.movie_ID
        );
        const totalPages = Math.ceil(remainingMovies.length / moviesPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      }
    } catch (error: any) {
      console.error("Error deleting movie:", error);
      const errorMessage =
        error.response?.data?.message || "Đã xảy ra lỗi khi xóa phim.";
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setMovieToDelete(null);
    }
  };

  // Hàm mở form chỉnh sửa phim
  const editMovie = (movie: Movie) => {
    setCurrentMovie(movie);
    setNewMovie(movie);
    setCurrentStep(0); // Reset về bước đầu tiên
    setIsUpdatingMovie(true);
    setValidationErrors({}); // Reset validation errors
  };

  // Hàm xác nhận xóa phim
  const confirmDeleteMovie = (movie: Movie) => {
    setMovieToDelete(movie);
    setShowDeleteConfirm(true);
  };

  // Hàm reset form thêm/sửa phim
  const resetNewMovie = () => {
    setNewMovie({
      movie_ID: 0,
      movie_Name: "",
      release_Date: "",
      end_Date: "",
      production_Company: "",
      director: "",
      cast: "",
      duration: 0,
      genre: "",
      rating: "",
      language: "",
      country: "",
      synopsis: "",
      poster_URL: "",
      trailer_Link: "",
      status: "",
    });
    setPosterFile(null);
    setCurrentStep(0);
    setValidationErrors({});
    setShowTrailerPreview(false);
  };

  // Hàm reset bộ lọc tìm kiếm
  const resetFilters = () => {
    setSearchFilters({
      movieId: "",
      movieName: "",
      genre: "",
      language: "",
      rating: "",
      status: "",
    });
  };

  // Lọc danh sách phim theo bộ lọc tìm kiếm
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      return (
        (searchFilters.movieId === "" ||
          movie.movie_ID.toString().includes(searchFilters.movieId)) &&
        (searchFilters.movieName === "" ||
          movie.movie_Name
            .toLowerCase()
            .includes(searchFilters.movieName.toLowerCase())) &&
        (searchFilters.genre === "" ||
          movie.genre
            .toLowerCase()
            .includes(searchFilters.genre.toLowerCase())) &&
        (searchFilters.language === "" ||
          movie.language
            .toLowerCase()
            .includes(searchFilters.language.toLowerCase())) &&
        (searchFilters.rating === "" ||
          movie.rating
            .toLowerCase()
            .includes(searchFilters.rating.toLowerCase())) &&
        (searchFilters.status === "" ||
          movie.status
            .toLowerCase()
            .includes(searchFilters.status.toLowerCase()))
      );
    });
  }, [movies, searchFilters]);

  // Tính toán danh sách phim hiển thị trên trang hiện tại
  const currentMovies = useMemo(() => {
    const indexOfLastMovie = currentPage * moviesPerPage;
    const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
    return filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  }, [filteredMovies, currentPage, moviesPerPage]);

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

  // Hàm xử lý thay đổi giá trị input
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    // Xóa lỗi validation khi người dùng thay đổi giá trị
    setValidationErrors(prev => ({
      ...prev,
      [id]: ''
    }));
    
    setNewMovie((prev) => ({ ...prev, [id]: value }));
  };

  // Hàm xử lý thay đổi file poster
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Kiểm tra kích thước file (tối đa 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setValidationErrors(prev => ({
          ...prev,
          posterFile: 'Kích thước file không được vượt quá 2MB'
        }));
        return;
      }
      
      // Kiểm tra định dạng file
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setValidationErrors(prev => ({
          ...prev,
          posterFile: 'Chỉ chấp nhận file JPG hoặc PNG'
        }));
        return;
      }
      
      setPosterFile(file);
      setValidationErrors(prev => ({
        ...prev,
        posterFile: ''
      }));
    }
  };

  // Hàm xử lý xóa poster
  const handleRemovePoster = () => {
    setPosterFile(null);
    setNewMovie(prev => ({
      ...prev,
      poster_URL: ''
    }));
  };

  // Hàm xử lý thay đổi bộ lọc tìm kiếm
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Hàm xử lý toggle trailer preview
  const toggleTrailerPreview = () => {
    setShowTrailerPreview(!showTrailerPreview);
  };

  // Render form theo bước hiện tại
  const renderStepContent = () => {
    const inputBaseClass = "w-full px-4 py-2.5 bg-[#0B0F19] border text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm";
    const labelClass = "block text-gray-300 text-sm font-medium mb-1.5";

    switch (currentStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-2">
              <label htmlFor="movie_Name" className={labelClass}>
                Tên phim *
              </label>
              <input
                type="text"
                id="movie_Name"
                value={newMovie.movie_Name}
                onChange={handleInputChange}
                placeholder="Nhập tên phim"
                className={`${inputBaseClass} ${validationErrors.movie_Name ? 'border-red-500' : 'border-white/15'}`}
              />
              <ValidationError message={validationErrors.movie_Name || ''} />
            </div>

            <div className="mb-2">
              <label htmlFor="release_Date" className={labelClass}>
                Ngày phát hành *
              </label>
              <input
                type="date"
                id="release_Date"
                value={
                  newMovie.release_Date
                    ? newMovie.release_Date.split("T")[0]
                    : ""
                }
                onChange={handleInputChange}
                className={`${inputBaseClass} [color-scheme:dark] ${validationErrors.release_Date ? 'border-red-500' : 'border-white/15'}`}
              />
              <ValidationError message={validationErrors.release_Date || ''} />
              <p className="text-xs text-gray-400 mt-1">
                Định dạng: YYYY-MM-DD
              </p>
            </div>

            <div className="mb-2">
              <label htmlFor="end_Date" className={labelClass}>
                Ngày kết thúc
              </label>
              <input
                type="date"
                id="end_Date"
                value={newMovie.end_Date ? newMovie.end_Date.split("T")[0] : ""}
                onChange={handleInputChange}
                className={`${inputBaseClass} [color-scheme:dark] border-white/15`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Định dạng: YYYY-MM-DD
              </p>
            </div>

            <div className="mb-2">
              <label htmlFor="production_Company" className={labelClass}>
                Công ty sản xuất *
              </label>
              <input
                type="text"
                id="production_Company"
                value={newMovie.production_Company}
                onChange={handleInputChange}
                placeholder="Nhập tên công ty sản xuất"
                className={`${inputBaseClass} ${validationErrors.production_Company ? 'border-red-500' : 'border-white/15'}`}
              />
              <ValidationError message={validationErrors.production_Company || ''} />
            </div>

            <div className="mb-2 md:col-span-2">
              <label htmlFor="director" className={labelClass}>
                Đạo diễn *
              </label>
              <input
                type="text"
                id="director"
                value={newMovie.director}
                onChange={handleInputChange}
                placeholder="Nhập tên đạo diễn"
                className={`${inputBaseClass} ${validationErrors.director ? 'border-red-500' : 'border-white/15'}`}
              />
              <ValidationError message={validationErrors.director || ''} />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-2 md:col-span-2">
              <label htmlFor="cast" className={labelClass}>
                Diễn viên *
              </label>
              <input
                type="text"
                id="cast"
                value={newMovie.cast}
                onChange={handleInputChange}
                placeholder="Nhập danh sách diễn viên"
                className={`${inputBaseClass} ${validationErrors.cast ? 'border-red-500' : 'border-white/15'}`}
              />
              <ValidationError message={validationErrors.cast || ''} />
            </div>

            <div className="mb-2">
              <label htmlFor="duration" className={labelClass}>
                Thời lượng (phút) *
              </label>
              <input
                type="number"
                id="duration"
                value={newMovie.duration || ""}
                onChange={handleInputChange}
                placeholder="Nhập thời lượng phim"
                className={`${inputBaseClass} ${validationErrors.duration ? 'border-red-500' : 'border-white/15'}`}
                min="1"
              />
              <ValidationError message={validationErrors.duration || ''} />
            </div>

            <div className="mb-2">
              <label htmlFor="genre" className={labelClass}>
                Thể loại *
              </label>
              <select
                id="genre"
                value={newMovie.genre}
                onChange={handleInputChange}
                className={`${inputBaseClass} ${validationErrors.genre ? 'border-red-500' : 'border-white/15'}`}
              >
                <option value="">{newMovie.genre || "Chọn thể loại"}</option>
                <option value="Hành động">Hành động</option>
                <option value="Hài hước">Hài hước</option>
                <option value="Tình cảm">Tình cảm</option>
                <option value="Tâm lý – Kịch tính">Tâm lý – Kịch tính</option>
                <option value="Kinh dị">Kinh dị</option>
                <option value="Phiêu lưu">Phiêu lưu</option>
                <option value="Khoa học viễn tưởng">Khoa học viễn tưởng</option>
                <option value="Hoạt hình">Hoạt hình</option>
                <option value="Tội phạm – Hình sự">Tội phạm – Hình sự</option>
                <option value="Chiến tranh">Chiến tranh</option>
                <option value="Âm nhạc">Âm nhạc</option>
                <option value="Tài liệu">Tài liệu</option>
                <option value="Kỳ ảo">Kỳ ảo</option>
              </select>
              <ValidationError message={validationErrors.genre || ''} />
            </div>

            <div className="mb-2">
              <label htmlFor="rating" className={labelClass}>
                Xếp hạng *
              </label>
              <select
                id="rating"
                value={newMovie.rating}
                onChange={handleInputChange}
                className={`${inputBaseClass} ${validationErrors.rating ? 'border-red-500' : 'border-white/15'}`}
              >
                <option value="">Chọn xếp hạng</option>
                <option value="P">P - Phổ thông</option>
                <option value="P13">P13 - Cấm trẻ em dưới 13 tuổi</option>
                <option value="P16">P16 - Cấm trẻ em dưới 16 tuổi</option>
                <option value="P18">P18 - Cấm trẻ em dưới 18 tuổi</option>
              </select>
              <ValidationError message={validationErrors.rating || ''} />
            </div>

            <div className="mb-2">
              <label htmlFor="language" className={labelClass}>
                Ngôn ngữ *
              </label>
              <select
                id="language"
                value={newMovie.language}
                onChange={handleInputChange}
                className={`${inputBaseClass} ${validationErrors.language ? 'border-red-500' : 'border-white/15'}`}
              >
                <option value="">{newMovie.language || "Chọn ngôn ngữ"}</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Tiếng Hàn">Tiếng Hàn</option>
                <option value="Tiếng Trung">Tiếng Trung</option>
                <option value="Tiếng Nhật">Tiếng Nhật</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Tiếng Pháp">Tiếng Pháp</option>
                <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
                <option value="Tiếng Hindi (Ấn Độ)">Tiếng Hindi (Ấn Độ)</option>
                <option value="Tiếng Đức">Tiếng Đức</option>
                <option value="Tiếng Thái">Tiếng Thái</option>
              </select>
              <ValidationError message={validationErrors.language || ''} />
            </div>

            <div className="mb-2">
              <label htmlFor="country" className={labelClass}>
                Quốc gia *
              </label>
              <select
                id="country"
                value={newMovie.country}
                onChange={handleInputChange}
                className={`${inputBaseClass} ${validationErrors.country ? 'border-red-500' : 'border-white/15'}`}
              >
                <option value="">{newMovie.country || "Chọn quốc gia"}</option>
                <option value="Mỹ">Mỹ</option>
                <option value="Hàn Quốc">Hàn Quốc</option>
                <option value="Trung Quốc">Trung Quốc</option>
                <option value="Nhật Bản">Nhật Bản</option>
                <option value="Việt Nam">Việt Nam</option>
                <option value="Pháp">Pháp</option>
                <option value="Ấn Độ">Ấn Độ</option>
                <option value="Thái Lan">Thái Lan</option>
                <option value="Anh Quốc">Anh Quốc</option>
                <option value="Mexico">Mexico</option>
                <option value="Tây Ban Nha">Tây Ban Nha</option>
              </select>
              <ValidationError message={validationErrors.country || ''} />
            </div>

            <div className="mb-2 md:col-span-2">
              <label htmlFor="synopsis" className={labelClass}>
                Tóm tắt nội dung *
              </label>
              <textarea
                id="synopsis"
                value={newMovie.synopsis}
                onChange={handleInputChange}
                placeholder="Nhập tóm tắt nội dung phim"
                className={`${inputBaseClass} ${validationErrors.synopsis ? 'border-red-500' : 'border-white/15'}`}
                rows={4}
              />
              <ValidationError message={validationErrors.synopsis || ''} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <div className="mb-4">
                <label htmlFor="trailer_Link" className={labelClass}>
                  Link trailer *
                </label>
                <div className="flex">
                  <input
                    type="url"
                    id="trailer_Link"
                    value={newMovie.trailer_Link}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`w-full px-4 py-2.5 bg-[#0B0F19] border ${validationErrors.trailer_Link ? 'border-red-500' : 'border-white/15'} text-white rounded-l-xl placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm`}
                  />
                  <button
                    type="button"
                    onClick={toggleTrailerPreview}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 rounded-r-xl flex items-center transition"
                    disabled={!newMovie.trailer_Link}
                    title="Xem trước trailer"
                  >
                    {showTrailerPreview ? <X className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                </div>
                <ValidationError message={validationErrors.trailer_Link || ''} />
              </div>
              
              {showTrailerPreview && newMovie.trailer_Link && (
                <div className="mt-4 mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Xem trước trailer:</p>
                  <TrailerPreview trailerUrl={newMovie.trailer_Link} />
                </div>
              )}
              
              <div className="mb-4 mt-6">
                <label htmlFor="status" className={labelClass}>
                  Trạng thái *
                </label>
                <select
                  id="status"
                  value={newMovie.status}
                  onChange={handleInputChange}
                  className={`${inputBaseClass} ${validationErrors.status ? 'border-red-500' : 'border-white/15'}`}
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="Now Showing">Đang chiếu</option>
                  <option value="Coming Soon">Sắp chiếu</option>
                  <option value="Ended">Đã kết thúc</option>
                </select>
                <ValidationError message={validationErrors.status || ''} />
              </div>
            </div>
            
            <div className="mb-4">
              <PosterUpload
                currentPosterUrl={newMovie.poster_URL}
                onChange={handlePosterChange}
                onRemove={handleRemovePoster}
              />
              <ValidationError message={validationErrors.posterFile || ''} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0B0F19] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-8">Quản lý phim</h1>

        {/* Actions bar */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <button
            onClick={() => {
              resetNewMovie();
              setIsAddingMovie(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-xl flex items-center shadow-lg transition-colors cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm phim mới
          </button>
          <button
            onClick={fetchMovies}
            className="bg-[#1E2738] hover:bg-white/10 text-white border border-white/10 font-medium py-2.5 px-5 rounded-xl flex items-center transition-colors cursor-pointer"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Làm mới
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Search filters */}
        <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="p-5 border-b border-white/10 bg-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2 text-red-500" />
              Bộ lọc tìm kiếm
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  ID
                </label>
                <input
                  type="text"
                  name="movieId"
                  value={searchFilters.movieId}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-[#1E2738] border border-white/10 text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Tìm theo ID"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Tên phim
                </label>
                <input
                  type="text"
                  name="movieName"
                  value={searchFilters.movieName}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-[#1E2738] border border-white/10 text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Tìm theo tên"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Thể loại
                </label>
                <input
                  type="text"
                  name="genre"
                  value={searchFilters.genre}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-[#1E2738] border border-white/10 text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Tìm theo thể loại"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Ngôn ngữ
                </label>
                <input
                  type="text"
                  name="language"
                  value={searchFilters.language}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-[#1E2738] border border-white/10 text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Tìm theo ngôn ngữ"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Xếp hạng
                </label>
                <input
                  type="text"
                  name="rating"
                  value={searchFilters.rating}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-[#1E2738] border border-white/10 text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Tìm theo xếp hạng"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Trạng thái
                </label>
                <input
                  type="text"
                  name="status"
                  value={searchFilters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-[#1E2738] border border-white/10 text-white rounded-xl placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Tìm theo trạng thái"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="bg-white/10 text-white py-2 px-4 rounded-xl hover:bg-white/20 transition-colors text-sm font-medium cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Movies table */}
        <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden mb-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
              <span className="ml-2 text-gray-400">Đang tải dữ liệu...</span>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Film className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-1">
                Không tìm thấy phim nào
              </h3>
              <p className="text-gray-400">Thử thay đổi bộ lọc tìm kiếm hoặc thêm phim mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Hình ảnh
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Tên phim
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Năm phát hành
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Thể loại
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Ngôn ngữ
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Xếp hạng
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentMovies.map((movie) => (
                    <tr key={movie.movie_ID} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-white">
                        {movie.movie_ID}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-16 w-12 overflow-hidden rounded-lg group relative border border-white/10">
                          {movie.poster_URL ? (
                            <>
                              <img
                                src={movie.poster_URL}
                                alt={movie.movie_Name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://via.placeholder.com/150x225?text=No+Image";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100">
                                <a 
                                  href={movie.poster_URL} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition"
                                >
                                  <Search className="h-4 w-4" />
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="h-full w-full bg-[#1E2738] flex items-center justify-center">
                              <Film className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                        {movie.movie_Name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                        {movie.release_Date
                          ? new Date(movie.release_Date).getFullYear()
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {movie.genre}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {movie.language}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-400 font-semibold">
                        {movie.rating}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <StatusBadge status={movie.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editMovie(movie)}
                            className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteMovie(movie)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {movie.trailer_Link && (
                            <a
                              href={movie.trailer_Link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 p-1.5 rounded-lg hover:bg-white/10 transition"
                              title="Xem trailer"
                            >
                              <Play className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredMovies.length > 0 && (
            <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border border-white/10 rounded-xl text-sm ${
                    currentPage === 1
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-[#1E2738] text-gray-200 hover:bg-white/10"
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border border-white/10 rounded-xl text-sm ${
                    currentPage === totalPages
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-[#1E2738] text-gray-200 hover:bg-white/10"
                  }`}
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Hiển thị{" "}
                    <span className="font-semibold text-white">
                      {(currentPage - 1) * moviesPerPage + 1}
                    </span>{" "}
                    đến{" "}
                    <span className="font-semibold text-white">
                      {Math.min(
                        currentPage * moviesPerPage,
                        filteredMovies.length
                      )}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-semibold text-white">{filteredMovies.length}</span>{" "}
                    phim
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px overflow-hidden border border-white/10"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-3 py-2 bg-[#1E2738] text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="sr-only">Trang trước</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }).map(
                      (_, i) => {
                        let pageNum;

                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border-r border-white/10 text-sm font-medium ${
                              currentPage === pageNum
                                ? "z-10 bg-red-600 text-white font-bold"
                                : "bg-[#1E2738] text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-3 py-2 bg-[#1E2738] text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-600 cursor-not-allowed"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="sr-only">Trang sau</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Adding Movie */}
      <Modal
        isOpen={isAddingMovie}
        onClose={() => !isSubmitting && setIsAddingMovie(false)}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Film className="h-6 w-6 mr-2.5 text-red-500" />
            Thêm phim mới
          </h2>
          
          <CreateMovieSteps 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            onStepChange={handleStepChange}
          />
          
          <form onSubmit={addMovie}>
            {renderStepContent()}
            
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400">* Trường bắt buộc</p>
              <div className="flex space-x-3">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="bg-white/10 hover:bg-white/20 text-gray-200 font-medium py-2.5 px-5 rounded-xl transition-colors focus:outline-none"
                  >
                    Quay lại
                  </button>
                )}
                
                {currentStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center focus:outline-none"
                  >
                    Tiếp theo
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingMovie(false);
                        resetNewMovie();
                      }}
                      disabled={isSubmitting}
                      className="bg-white/10 hover:bg-white/20 text-gray-200 font-medium py-2.5 px-5 rounded-xl transition-colors focus:outline-none"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-red-600/30 focus:outline-none"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Đang xử lý...
                        </div>
                      ) : (
                        "Thêm phim"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal for Updating Movie */}
      <Modal
        isOpen={isUpdatingMovie}
        onClose={() => !isSubmitting && setIsUpdatingMovie(false)}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Edit className="h-6 w-6 mr-2.5 text-red-500" />
            Cập nhật phim
          </h2>
          
          <CreateMovieSteps 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
            onStepChange={handleStepChange}
          />
          
          <form onSubmit={updateMovie}>
            {renderStepContent()}
            
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400">* Trường bắt buộc</p>
              <div className="flex space-x-3">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="bg-white/10 hover:bg-white/20 text-gray-200 font-medium py-2.5 px-5 rounded-xl transition-colors focus:outline-none"
                  >
                    Quay lại
                  </button>
                )}
                
                {currentStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center focus:outline-none"
                  >
                    Tiếp theo
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUpdatingMovie(false);
                        resetNewMovie();
                      }}
                      disabled={isSubmitting}
                      className="bg-white/10 hover:bg-white/20 text-gray-200 font-medium py-2.5 px-5 rounded-xl transition-colors focus:outline-none"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-red-600/30 focus:outline-none"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Đang xử lý...
                        </div>
                      ) : (
                        "Cập nhật phim"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa phim"
        message={`Bạn có chắc chắn muốn xóa phim "${movieToDelete?.movie_Name}"? Hành động này không thể hoàn tác.`}
        onConfirm={deleteMovie}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Toast notifications */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default ManageMoviesPage;

