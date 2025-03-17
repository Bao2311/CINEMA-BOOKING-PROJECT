// import React, { useState, useEffect } from 'react';
// import { Plus, RefreshCw, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
// import Modal from '../components/Admin/Modal';
// import axios from 'axios';

// const ManageMoviesPage: React.FC = () => {
//   const [movies, setMovies] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const moviesPerPage = 5;
//   const [isAddingMovie, setIsAddingMovie] = useState(false);
//   const [isUpdatingMovie, setIsUpdatingMovie] = useState(false);
//   const [currentMovie, setCurrentMovie] = useState<any>(null);
//   const [posterFile, setPosterFile] = useState<File | null>(null);

//   // Search filters state
//   const [searchFilters, setSearchFilters] = useState({
//     movieId: '',
//     movieName: '',
//     genre: '',
//     language: '',
//     rating: '',
//     status: ''
//   });

//   const [newMovie, setNewMovie] = useState({
//     movie_ID: 0,
//     movie_Name: '',
//     release_Date: '',
//     end_Date: '',
//     production_Company: '',
//     director: '',
//     cast: '',
//     duration: 0,
//     genre: '',
//     rating: '',
//     language: '',
//     country: '',
//     synopsis: '',
//     poster_URL: '',
//     trailer_Link: '',
//     status: '',
//   });

//   // Fetch movies
//   useEffect(() => {
//     const fetchMovies = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         setError('Invalid token. Please log in again.');
//         setIsLoading(false);
//         return;
//       }

//       try {
//         const response = await axios.get('https://localhost:7168/api/Movie', {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (Array.isArray(response.data.$values)) {
//           setMovies(response.data.$values);
//         } else {
//           setError('Invalid movie data.');
//         }
//       } catch (error: any) {
//         if (error.response && error.response.status === 404) {
//           setError('Movie API not found. Please check the URL or server.');
//         } else {
//           setError('An error occurred while loading data.');
//         }
//         console.error('Error fetching movies:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchMovies();
//   }, []);

//   // Add movie
//   const addMovie = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setError('Invalid token. Please log in again.');
//       return;
//     }

//     try {
//       const formData = new FormData();
//       formData.append('movie_Name', newMovie.movie_Name);
//       formData.append('release_Date', newMovie.release_Date); // định dạng yyyy-mm-dd
//       formData.append('end_Date', newMovie.end_Date);         // định dạng yyyy-mm-dd
//       formData.append('production_Company', newMovie.production_Company);
//       formData.append('director', newMovie.director);
//       formData.append('cast', newMovie.cast);
//       formData.append('duration', newMovie.duration.toString());
//       formData.append('genre', newMovie.genre);
//       formData.append('rating', newMovie.rating);
//       formData.append('language', newMovie.language);
//       formData.append('country', newMovie.country);
//       formData.append('synopsis', newMovie.synopsis);
//       formData.append('trailer_Link', newMovie.trailer_Link);
//       formData.append('status', newMovie.status);

//       // Thêm file poster nếu có (không bắt buộc)
//       if (posterFile) {
//         formData.append('posterFile', posterFile);
//       }

//       console.log("FormData content (Add Movie):");
//       for (let pair of formData.entries()) {
//         console.log(pair[0] + ': ' + pair[1]);
//       }

//       const response = await axios.post('https://localhost:7168/api/Movie', formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       setMovies([...movies, response.data]);
//       resetNewMovie();
//       setIsAddingMovie(false);
//     } catch (error) {
//       console.error('Error adding movie:', error);
//       alert('Error adding movie. Please check console for details.');
//     }
//   };

//   // Update movie (nếu không update poster thì không gửi file mới, giữ lại poster cũ)
//   const updateMovie = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setError('Invalid token. Please log in again.');
//       return;
//     }

//     try {
//       const formData = new FormData();
//       // Thêm ID phim vào FormData
//       formData.append('movie_ID', newMovie.movie_ID.toString());
//       // Thêm các trường dữ liệu
//       formData.append('movie_Name', newMovie.movie_Name);
//       formData.append('release_Date', newMovie.release_Date);
//       formData.append('end_Date', newMovie.end_Date);
//       formData.append('production_Company', newMovie.production_Company);
//       formData.append('director', newMovie.director);
//       formData.append('cast', newMovie.cast);
//       formData.append('duration', newMovie.duration.toString());
//       formData.append('genre', newMovie.genre);
//       formData.append('rating', newMovie.rating);
//       formData.append('language', newMovie.language);
//       formData.append('country', newMovie.country);
//       formData.append('synopsis', newMovie.synopsis);
//       formData.append('trailer_Link', newMovie.trailer_Link);
//       formData.append('status', newMovie.status);

//       // Nếu có chọn file poster mới thì mới gửi, còn không thì không gửi gì về poster để giữ nguyên poster cũ
//       if (posterFile) {
//         formData.append('posterFile', posterFile);
//       }

//       console.log("FormData content (Update Movie):");
//       for (let pair of formData.entries()) {
//         console.log(pair[0] + ': ' + pair[1]);
//       }

//       // Gọi PUT request theo mẫu API (không truyền ID vào URL)
//       const response = await axios.put('https://localhost:7168/api/Movie', formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       setMovies(movies.map(movie => (movie.movie_ID === newMovie.movie_ID ? response.data : movie)));
//       resetNewMovie();
//       setIsUpdatingMovie(false);
//     } catch (error) {
//       console.error('Error updating movie:', error);
//       alert('Error updating movie. Please check console for details.');
//     }
//   };

//   // Delete movie
//   const deleteMovie = async (movieId: number) => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       setError('Invalid token. Please log in again.');
//       return;
//     }
//     const confirmDelete = window.confirm("Are you sure you want to delete this movie?");
//     if (!confirmDelete) return;

//     try {
//       const response = await axios.delete(`https://localhost:7168/api/Movie/${movieId}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       if (response.status === 200) {
//         setMovies(movies.filter(movie => movie.movie_ID !== movieId));
//       } else {
//         setError('An error occurred while deleting the movie.');
//       }
//     } catch (error: any) {
//       if (error.response) {
//         setError(`Error: ${error.response.data.message || 'An error occurred.'}`);
//       } else {
//         setError('An error occurred while connecting to the server.');
//       }
//       console.error('Error deleting movie:', error);
//     }
//   };

//   // Edit movie: giữ nguyên nội dung đã có của form edit cũ
//   const editMovie = (movie: any) => {
//     setCurrentMovie(movie);
//     setNewMovie(movie);
//     setIsUpdatingMovie(true);
//   };

//   // Reset new movie state
//   const resetNewMovie = () => {
//     setNewMovie({
//       movie_ID: 0,
//       movie_Name: '',
//       release_Date: '',
//       end_Date: '',
//       production_Company: '',
//       director: '',
//       cast: '',
//       duration: 0,
//       genre: '',
//       rating: '',
//       language: '',
//       country: '',
//       synopsis: '',
//       poster_URL: '',
//       trailer_Link: '',
//       status: '',
//     });
//     setPosterFile(null);
//   };

//   // Filter movies based on search criteria
//   const filteredMovies = movies.filter(movie => {
//     return (
//       (searchFilters.movieId === '' || movie.movie_ID.toString().includes(searchFilters.movieId)) &&
//       (searchFilters.movieName === '' || movie.movie_Name.toLowerCase().includes(searchFilters.movieName.toLowerCase())) &&
//       (searchFilters.genre === '' || movie.genre.toLowerCase().includes(searchFilters.genre.toLowerCase())) &&
//       (searchFilters.language === '' || movie.language.toLowerCase().includes(searchFilters.language.toLowerCase())) &&
//       (searchFilters.rating === '' || movie.rating.toLowerCase().includes(searchFilters.rating.toLowerCase())) &&
//       (searchFilters.status === '' || movie.status.toLowerCase().includes(searchFilters.status.toLowerCase()))
//     );
//   });

//   // Calculate movies to display based on current page
//   const indexOfLastMovie = currentPage * moviesPerPage;
//   const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
//   const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
//   const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

//   return (
//     <div>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <h1 className="text-4xl font-semibold text-gray-800 mb-8 text-center">Manage Movies</h1>

//         {isLoading ? (
//           <div className="flex justify-center items-center h-64">
//             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
//           </div>
//         ) : error ? (
//           <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
//         ) : (
//           <div>
//             <div className="flex justify-between mb-4">
//               <button onClick={() => setIsAddingMovie(true)} className="bg-blue-600 text-white py-2 px-4 rounded flex items-center">
//                 <Plus className="h-5 w-5 mr-2" />
//                 Add New Movie
//               </button>
//               <button onClick={() => window.location.reload()} className="bg-green-600 text-white py-2 px-4 rounded flex items-center">
//                 <RefreshCw className="h-5 w-5 mr-2" />
//                 Refresh
//               </button>
//             </div>

//             <div className="bg-white p-4 rounded-lg shadow mb-6">
//               <h3 className="text-lg font-medium text-gray-700 mb-3">Search Filters</h3>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
//                   <input 
//                     type="text" 
//                     value={searchFilters.movieId} 
//                     onChange={(e) => setSearchFilters({ ...searchFilters, movieId: e.target.value })} 
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
//                     placeholder="Search by ID" 
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Movie Name</label>
//                   <input 
//                     type="text" 
//                     value={searchFilters.movieName} 
//                     onChange={(e) => setSearchFilters({ ...searchFilters, movieName: e.target.value })} 
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
//                     placeholder="Search by name" 
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
//                   <input 
//                     type="text" 
//                     value={searchFilters.genre} 
//                     onChange={(e) => setSearchFilters({ ...searchFilters, genre: e.target.value })} 
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
//                     placeholder="Search by genre" 
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
//                   <input 
//                     type="text" 
//                     value={searchFilters.language} 
//                     onChange={(e) => setSearchFilters({ ...searchFilters, language: e.target.value })} 
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
//                     placeholder="Search by language" 
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
//                   <input 
//                     type="text" 
//                     value={searchFilters.rating} 
//                     onChange={(e) => setSearchFilters({ ...searchFilters, rating: e.target.value })} 
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
//                     placeholder="Search by rating" 
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//                   <input 
//                     type="text" 
//                     value={searchFilters.status} 
//                     onChange={(e) => setSearchFilters({ ...searchFilters, status: e.target.value })} 
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
//                     placeholder="Search by status" 
//                   />
//                 </div>
//               </div>
//               <div className="mt-4 flex justify-end">
//                 <button onClick={() => setSearchFilters({
//                   movieId: '',
//                   movieName: '',
//                   genre: '',
//                   language: '',
//                   rating: '',
//                   status: ''
//                 })} 
//                 className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300">
//                   Clear Filters
//                 </button>
//               </div>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full bg-white">
//                 <thead>
//                   <tr>
//                     <th className="py-2 px-4 border-b">ID</th>
//                     <th className="py-2 px-4 border-b">Image</th>
//                     <th className="py-2 px-4 border-b">Movie Name</th>
//                     <th className="py-2 px-4 border-b">Release Year</th>
//                     <th className="py-2 px-4 border-b">Genre</th>
//                     <th className="py-2 px-4 border-b">Language</th>
//                     <th className="py-2 px-4 border-b">Rating</th>
//                     <th className="py-2 px-4 border-b">Status</th>
//                     <th className="py-2 px-4 border-b">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {currentMovies.map((movie) => (
//                     <tr key={movie.movie_ID}>
//                       <td className="py-2 px-4 border-b">{movie.movie_ID}</td>
//                       <td className="py-2 px-4 border-b">
//                         <img src={movie.poster_URL} alt={movie.movie_Name} className="h-16 w-16 object-cover" />
//                       </td>
//                       <td className="py-2 px-4 border-b">{movie.movie_Name}</td>
//                       <td className="py-2 px-4 border-b">{new Date(movie.release_Date).getFullYear()}</td>
//                       <td className="py-2 px-4 border-b">{movie.genre}</td>
//                       <td className="py-2 px-4 border-b">{movie.language}</td>
//                       <td className="py-2 px-4 border-b">{movie.rating}</td>
//                       <td className="py-2 px-4 border-b">
//                         <span className={`px-2 py-1 rounded-full text-white ${
//                           movie.status === 'Now Showing' 
//                             ? 'bg-green-500' 
//                             : movie.status === 'Coming Soon' 
//                               ? 'bg-blue-500' 
//                               : 'bg-red-500'
//                         }`}>
//                           {movie.status}
//                         </span>
//                       </td>
//                       <td className="py-2 px-4 border-b">
//                         <button onClick={() => editMovie(movie)} className="text-blue-600 hover:text-blue-800 mr-2">
//                           <Edit className="h-5 w-5" />
//                         </button>
//                         <button onClick={() => deleteMovie(movie.movie_ID)} className="text-red-600 hover:text-red-800">
//                           <Trash2 className="h-5 w-5" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="flex justify-between items-center mt-6">
//               <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l flex items-center">
//                 <ChevronLeft className="h-5 w-5" />
//                 Previous
//               </button>
//               <span className="text-lg font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
//               <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r flex items-center">
//                 Next
//                 <ChevronRight className="h-5 w-5" />
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modal for Adding Movie */}
//       <Modal isOpen={isAddingMovie} onClose={() => setIsAddingMovie(false)}>
//         <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Movie</h2>
//         <form onSubmit={addMovie} className="grid grid-cols-3 gap-4">
//           <div className="mb-4">
//             <label htmlFor="movie_Name" className="block text-gray-700 text-sm font-bold mb-2">Movie Name</label>
//             <input
//               type="text"
//               id="movie_Name"
//               value={newMovie.movie_Name}
//               onChange={(e) => setNewMovie({ ...newMovie, movie_Name: e.target.value })}
//               placeholder="Phức Ngu"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="release_Date" className="block text-gray-700 text-sm font-bold mb-2">Release Date</label>
//             <input
//               type="text"
//               id="release_Date"
//               placeholder="2025-11-23"
//               value={newMovie.release_Date}
//               onChange={(e) => setNewMovie({ ...newMovie, release_Date: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="end_Date" className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
//             <input
//               type="text"
//               id="end_Date"
//               placeholder="2026-11-23"
//               value={newMovie.end_Date}
//               onChange={(e) => setNewMovie({ ...newMovie, end_Date: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="production_Company" className="block text-gray-700 text-sm font-bold mb-2">Production Company</label>
//             <input
//               type="text"
//               id="production_Company"
//               value={newMovie.production_Company}
//               onChange={(e) => setNewMovie({ ...newMovie, production_Company: e.target.value })}
//               placeholder="Phim Viet Productions"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="director" className="block text-gray-700 text-sm font-bold mb-2">Director</label>
//             <input
//               type="text"
//               id="director"
//               value={newMovie.director}
//               onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
//               placeholder="Nguyên Dop Dien"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="cast" className="block text-gray-700 text-sm font-bold mb-2">Cast</label>
//             <input
//               type="text"
//               id="cast"
//               value={newMovie.cast}
//               onChange={(e) => setNewMovie({ ...newMovie, cast: e.target.value })}
//               placeholder="Tran Dien Vien, Le Dien Vien, Pham Dien Vien"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">Duration (minutes)</label>
//             <input
//               type="number"
//               id="duration"
//               value={newMovie.duration}
//               onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
//               placeholder="120"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="genre" className="block text-gray-700 text-sm font-bold mb-2">Genre</label>
//             <input
//               type="text"
//               id="genre"
//               value={newMovie.genre}
//               onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
//               placeholder="Lang Man"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="rating" className="block text-gray-700 text-sm font-bold mb-2">Rating</label>
//             <input
//               type="text"
//               id="rating"
//               value={newMovie.rating}
//               onChange={(e) => setNewMovie({ ...newMovie, rating: e.target.value })}
//               placeholder="Ví dụ: FIX hoặc P13"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="language" className="block text-gray-700 text-sm font-bold mb-2">Language</label>
//             <input
//               type="text"
//               id="language"
//               value={newMovie.language}
//               onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
//               placeholder="Tiếng Anh"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Country</label>
//             <input
//               type="text"
//               id="country"
//               value={newMovie.country}
//               onChange={(e) => setNewMovie({ ...newMovie, country: e.target.value })}
//               placeholder="Viet Nam"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="synopsis" className="block text-gray-700 text-sm font-bold mb-2">Synopsis</label>
//             <textarea
//               id="synopsis"
//               value={newMovie.synopsis}
//               onChange={(e) => setNewMovie({ ...newMovie, synopsis: e.target.value })}
//               placeholder="Mat cuo: phieu luu day hap dan tai Viet Nam"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="trailer_Link" className="block text-gray-700 text-sm font-bold mb-2">Trailer Link</label>
//             <input
//               type="text"
//               id="trailer_Link"
//               value={newMovie.trailer_Link}
//               onChange={(e) => setNewMovie({ ...newMovie, trailer_Link: e.target.value })}
//               placeholder="https://www.youtube.com/watch?v=2SWMeZVIXT7E"
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="posterFile" className="block text-gray-700 text-sm font-bold mb-2">Poster Image</label>
//             <input
//               type="file"
//               id="posterFile"
//               accept="image/*"
//               onChange={(e) => setPosterFile(e.target.files ? e.target.files[0] : null)}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//             />
//           </div>

//           <div className="mb-4">
//             <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status</label>
//             <select
//               id="status"
//               value={newMovie.status}
//               onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             >
//               <option value="">Select Status</option>
//               <option value="Now Showing">Now Showing</option>
//               <option value="Coming Soon">Coming Soon</option>
//             </select>
//           </div>

//           <div className="flex items-center justify-between col-span-3">
//             <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
//               Add Movie
//             </button>
//             <button type="button" onClick={() => { setIsAddingMovie(false); resetNewMovie(); }} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
//               Cancel
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* Modal for Updating Movie */}
//       <Modal isOpen={isUpdatingMovie} onClose={() => setIsUpdatingMovie(false)}>
//         <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Movie</h2>
//         <form onSubmit={updateMovie} className="grid grid-cols-3 gap-4">
//           <div className="mb-4">
//             <label htmlFor="movie_Name" className="block text-gray-700 text-sm font-bold mb-2">Movie Name</label>
//             <input
//               type="text"
//               id="movie_Name"
//               value={newMovie.movie_Name}
//               onChange={(e) => setNewMovie({ ...newMovie, movie_Name: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="release_Date" className="block text-gray-700 text-sm font-bold mb-2">Release Date</label>
//             <input
//               type="text"
//               id="release_Date"
//               value={newMovie.release_Date}
//               onChange={(e) => setNewMovie({ ...newMovie, release_Date: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="end_Date" className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
//             <input
//               type="text"
//               id="end_Date"
//               value={newMovie.end_Date}
//               onChange={(e) => setNewMovie({ ...newMovie, end_Date: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="production_Company" className="block text-gray-700 text-sm font-bold mb-2">Production Company</label>
//             <input
//               type="text"
//               id="production_Company"
//               value={newMovie.production_Company}
//               onChange={(e) => setNewMovie({ ...newMovie, production_Company: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="director" className="block text-gray-700 text-sm font-bold mb-2">Director</label>
//             <input
//               type="text"
//               id="director"
//               value={newMovie.director}
//               onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="cast" className="block text-gray-700 text-sm font-bold mb-2">Cast</label>
//             <input
//               type="text"
//               id="cast"
//               value={newMovie.cast}
//               onChange={(e) => setNewMovie({ ...newMovie, cast: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">Duration (minutes)</label>
//             <input
//               type="number"
//               id="duration"
//               value={newMovie.duration}
//               onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="genre" className="block text-gray-700 text-sm font-bold mb-2">Genre</label>
//             <input
//               type="text"
//               id="genre"
//               value={newMovie.genre}
//               onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="rating" className="block text-gray-700 text-sm font-bold mb-2">Rating</label>
//             <input
//               type="text"
//               id="rating"
//               value={newMovie.rating}
//               onChange={(e) => setNewMovie({ ...newMovie, rating: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="language" className="block text-gray-700 text-sm font-bold mb-2">Language</label>
//             <input
//               type="text"
//               id="language"
//               value={newMovie.language}
//               onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Country</label>
//             <input
//               type="text"
//               id="country"
//               value={newMovie.country}
//               onChange={(e) => setNewMovie({ ...newMovie, country: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="synopsis" className="block text-gray-700 text-sm font-bold mb-2">Synopsis</label>
//             <textarea
//               id="synopsis"
//               value={newMovie.synopsis}
//               onChange={(e) => setNewMovie({ ...newMovie, synopsis: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="trailer_Link" className="block text-gray-700 text-sm font-bold mb-2">Trailer Link</label>
//             <input
//               type="text"
//               id="trailer_Link"
//               value={newMovie.trailer_Link}
//               onChange={(e) => setNewMovie({ ...newMovie, trailer_Link: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label htmlFor="posterFile" className="block text-gray-700 text-sm font-bold mb-2">Poster Image (Leave empty to keep current)</label>
//             <input
//               type="file"
//               id="posterFile"
//               accept="image/*"
//               onChange={(e) => setPosterFile(e.target.files ? e.target.files[0] : null)}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//             />
//             {newMovie.poster_URL && (
//               <div className="mt-2">
//                 <p className="text-sm text-gray-500">Current poster:</p>
//                 <img src={newMovie.poster_URL} alt="Current poster" className="h-20 w-20 object-cover mt-1" />
//               </div>
//             )}
//           </div>
//           <div className="mb-4">
//             <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status</label>
//             <select
//               id="status"
//               value={newMovie.status}
//               onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
//               className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//               required
//             >
//               <option value="">Select Status</option>
//               <option value="Now Showing">Now Showing</option>
//               <option value="Coming Soon">Coming Soon</option>
//             </select>
//           </div>
//           <div className="flex items-center justify-between col-span-3">
//             <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
//               Update
//             </button>
//             <button type="button" onClick={() => { setIsUpdatingMovie(false); resetNewMovie(); }} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
//               Cancel
//             </button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default ManageMoviesPage;


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, RefreshCw, ChevronLeft, ChevronRight, Edit, Trash2, Search, Film, Calendar, Clock, Star, Globe, Info } from 'lucide-react';
import Modal from '../components/Admin/Modal';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      case 'Now Showing':
        return 'bg-green-500';
      case 'Coming Soon':
        return 'bg-blue-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor()}`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

const API_URL = 'https://localhost:7168/api';

const ManageMoviesPage: React.FC = () => {
  // State quản lý danh sách phim
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // State quản lý bộ lọc tìm kiếm
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    movieId: '',
    movieName: '',
    genre: '',
    language: '',
    rating: '',
    status: ''
  });

  // State quản lý form thêm/sửa phim
  const [newMovie, setNewMovie] = useState<Movie>({
    movie_ID: 0,
    movie_Name: '',
    release_Date: '',
    end_Date: '',
    production_Company: '',
    director: '',
    cast: '',
    duration: 0,
    genre: '',
    rating: '',
    language: '',
    country: '',
    synopsis: '',
    poster_URL: '',
    trailer_Link: '',
    status: '',
  });

  // Lấy token từ localStorage
  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Hàm fetch danh sách phim
  const fetchMovies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = getToken();

    if (!token) {
      setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/Movie`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
        setMovies(response.data.$values);
      } else {
        setError('Định dạng dữ liệu không hợp lệ.');
      }
    } catch (error: any) {
      console.error('Error fetching movies:', error);
      if (error.response && error.response.status === 404) {
        setError('Không tìm thấy API phim. Vui lòng kiểm tra URL hoặc máy chủ.');
      } else if (error.response && error.response.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Đã xảy ra lỗi khi tải dữ liệu phim.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Khởi tạo danh sách phim
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Hàm thêm phim mới
  const addMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = getToken();

    if (!token) {
      toast.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Thêm các trường dữ liệu vào FormData
      Object.entries(newMovie).forEach(([key, value]) => {
        if (key !== 'movie_ID' && key !== 'poster_URL' && value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Thêm file poster nếu có
      if (posterFile) {
        formData.append('posterFile', posterFile);
      }

      const response = await axios.post(`${API_URL}/Movie`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201 || response.status === 200) {
        toast.success('Thêm phim thành công!');
        setMovies([...movies, response.data]);
        resetNewMovie();
        setIsAddingMovie(false);
        await fetchMovies(); // Refresh danh sách phim
      }
    } catch (error: any) {
      console.error('Error adding movie:', error);
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi thêm phim.';
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm cập nhật phim
  const updateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = getToken();

    if (!token) {
      toast.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Thêm các trường dữ liệu vào FormData
      Object.entries(newMovie).forEach(([key, value]) => {
        if (key !== 'poster_URL' && value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Thêm file poster nếu có
      if (posterFile) {
        formData.append('posterFile', posterFile);
      }

      const response = await axios.put(`${API_URL}/Movie`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        toast.success('Cập nhật phim thành công!');
        setMovies(movies.map(movie => (movie.movie_ID === newMovie.movie_ID ? response.data : movie)));
        resetNewMovie();
        setIsUpdatingMovie(false);
        await fetchMovies(); // Refresh danh sách phim
      }
    } catch (error: any) {
      console.error('Error updating movie:', error);
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật phim.';
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
      toast.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/Movie/${movieToDelete.movie_ID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        toast.success('Xóa phim thành công!');
        setMovies(movies.filter(movie => movie.movie_ID !== movieToDelete.movie_ID));
        
        // Điều chỉnh trang hiện tại nếu đã xóa phim cuối cùng của trang
        const remainingMovies = movies.filter(movie => movie.movie_ID !== movieToDelete.movie_ID);
        const totalPages = Math.ceil(remainingMovies.length / moviesPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      }
    } catch (error: any) {
      console.error('Error deleting movie:', error);
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi xóa phim.';
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
    setIsUpdatingMovie(true);
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
      movie_Name: '',
      release_Date: '',
      end_Date: '',
      production_Company: '',
      director: '',
      cast: '',
      duration: 0,
      genre: '',
      rating: '',
      language: '',
      country: '',
      synopsis: '',
      poster_URL: '',
      trailer_Link: '',
      status: '',
    });
    setPosterFile(null);
  };

  // Hàm reset bộ lọc tìm kiếm
  const resetFilters = () => {
    setSearchFilters({
      movieId: '',
      movieName: '',
      genre: '',
      language: '',
      rating: '',
      status: ''
    });
  };

  // Lọc danh sách phim theo bộ lọc tìm kiếm
  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      return (
        (searchFilters.movieId === '' || movie.movie_ID.toString().includes(searchFilters.movieId)) &&
        (searchFilters.movieName === '' || movie.movie_Name.toLowerCase().includes(searchFilters.movieName.toLowerCase())) &&
        (searchFilters.genre === '' || movie.genre.toLowerCase().includes(searchFilters.genre.toLowerCase())) &&
        (searchFilters.language === '' || movie.language.toLowerCase().includes(searchFilters.language.toLowerCase())) &&
        (searchFilters.rating === '' || movie.rating.toLowerCase().includes(searchFilters.rating.toLowerCase())) &&
        (searchFilters.status === '' || movie.status.toLowerCase().includes(searchFilters.status.toLowerCase()))
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setNewMovie(prev => ({ ...prev, [id]: value }));
  };

  // Hàm xử lý thay đổi file poster
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPosterFile(e.target.files[0]);
    }
  };

  // Hàm xử lý thay đổi bộ lọc tìm kiếm
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý phim</h1>

        {/* Actions bar */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <button 
            onClick={() => setIsAddingMovie(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm phim mới
          </button>
          <button 
            onClick={fetchMovies} 
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center transition-colors"
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Bộ lọc tìm kiếm
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input 
                  type="text" 
                  name="movieId"
                  value={searchFilters.movieId} 
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Tìm theo ID" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên phim</label>
                <input 
                  type="text" 
                  name="movieName"
                  value={searchFilters.movieName} 
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Tìm theo tên" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                <input 
                  type="text" 
                  name="genre"
                  value={searchFilters.genre} 
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Tìm theo thể loại" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                <input 
                  type="text" 
                  name="language"
                  value={searchFilters.language} 
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Tìm theo ngôn ngữ" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xếp hạng</label>
                <input 
                  type="text" 
                  name="rating"
                  value={searchFilters.rating} 
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Tìm theo xếp hạng" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <input 
                  type="text" 
                  name="status"
                  value={searchFilters.status} 
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Tìm theo trạng thái" 
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={resetFilters} 
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Movies table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
              <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Film className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Không tìm thấy phim nào</h3>
              <p>Thử thay đổi bộ lọc tìm kiếm hoặc thêm phim mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phim</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Năm phát hành</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thể loại</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngôn ngữ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xếp hạng</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentMovies.map((movie) => (
                    <tr key={movie.movie_ID} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{movie.movie_ID}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-16 w-12 overflow-hidden rounded">
                          {movie.poster_URL ? (
                            <img 
                              src={movie.poster_URL} 
                              alt={movie.movie_Name} 
                              className="h-full w-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x225?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                              <Film className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{movie.movie_Name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {movie.release_Date ? new Date(movie.release_Date).getFullYear() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{movie.genre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{movie.language}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{movie.rating}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <StatusBadge status={movie.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => editMovie(movie)} 
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => confirmDeleteMovie(movie)} 
                            className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
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
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border border-gray-300 rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border border-gray-300 rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                
              <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(currentPage - 1) * moviesPerPage + 1}</span> đến <span className="font-medium">
                      {Math.min(currentPage * moviesPerPage, filteredMovies.length)}
                    </span> trong tổng số <span className="font-medium">{filteredMovies.length}</span> phim
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Trang trước</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum 
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
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
      <Modal isOpen={isAddingMovie} onClose={() => !isSubmitting && setIsAddingMovie(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Film className="h-6 w-6 mr-2 text-blue-600" />
            Thêm phim mới
          </h2>
          <form onSubmit={addMovie} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="mb-4">
              <label htmlFor="movie_Name" className="block text-gray-700 text-sm font-bold mb-2">Tên phim *</label>
              <input
                type="text"
                id="movie_Name"
                value={newMovie.movie_Name}
                onChange={handleInputChange}
                placeholder="Nhập tên phim"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="release_Date" className="block text-gray-700 text-sm font-bold mb-2">Ngày phát hành *</label>
              <input
                type="date"
                id="release_Date"
                value={newMovie.release_Date ? newMovie.release_Date.split('T')[0] : ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Định dạng: YYYY-MM-DD</p>
            </div>

            <div className="mb-4">
              <label htmlFor="end_Date" className="block text-gray-700 text-sm font-bold mb-2">Ngày kết thúc</label>
              <input
                type="date"
                id="end_Date"
                value={newMovie.end_Date ? newMovie.end_Date.split('T')[0] : ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Định dạng: YYYY-MM-DD</p>
            </div>

            <div className="mb-4">
              <label htmlFor="production_Company" className="block text-gray-700 text-sm font-bold mb-2">Công ty sản xuất *</label>
              <input
                type="text"
                id="production_Company"
                value={newMovie.production_Company}
                onChange={handleInputChange}
                placeholder="Nhập tên công ty sản xuất"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="director" className="block text-gray-700 text-sm font-bold mb-2">Đạo diễn *</label>
              <input
                type="text"
                id="director"
                value={newMovie.director}
                onChange={handleInputChange}
                placeholder="Nhập tên đạo diễn"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="cast" className="block text-gray-700 text-sm font-bold mb-2">Diễn viên *</label>
              <input
                type="text"
                id="cast"
                value={newMovie.cast}
                onChange={handleInputChange}
                placeholder="Nhập danh sách diễn viên"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">Thời lượng (phút) *</label>
              <input
                type="number"
                id="duration"
                value={newMovie.duration || ''}
                onChange={handleInputChange}
                placeholder="Nhập thời lượng phim"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="genre" className="block text-gray-700 text-sm font-bold mb-2">Thể loại *</label>
              <input
                type="text"
                id="genre"
                value={newMovie.genre}
                onChange={handleInputChange}
                placeholder="Nhập thể loại phim"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="rating" className="block text-gray-700 text-sm font-bold mb-2">Xếp hạng *</label>
              <select
                id="rating"
                value={newMovie.rating}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn xếp hạng</option>
                <option value="P">P - Phổ thông</option>
                <option value="C13">C13 - Cấm trẻ em dưới 13 tuổi</option>
                <option value="C16">C16 - Cấm trẻ em dưới 16 tuổi</option>
                <option value="C18">C18 - Cấm trẻ em dưới 18 tuổi</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="language" className="block text-gray-700 text-sm font-bold mb-2">Ngôn ngữ *</label>
              <input
                type="text"
                id="language"
                value={newMovie.language}
                onChange={handleInputChange}
                placeholder="Nhập ngôn ngữ phim"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Quốc gia *</label>
              <input
                type="text"
                id="country"
                value={newMovie.country}
                onChange={handleInputChange}
                placeholder="Nhập quốc gia sản xuất"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4 md:col-span-2">
              <label htmlFor="synopsis" className="block text-gray-700 text-sm font-bold mb-2">Tóm tắt nội dung *</label>
              <textarea
                id="synopsis"
                value={newMovie.synopsis}
                onChange={handleInputChange}
                placeholder="Nhập tóm tắt nội dung phim"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="trailer_Link" className="block text-gray-700 text-sm font-bold mb-2">Link trailer *</label>
              <input
                type="url"
                id="trailer_Link"
                value={newMovie.trailer_Link}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="posterFile" className="block text-gray-700 text-sm font-bold mb-2">Poster phim</label>
              <input
                type="file"
                id="posterFile"
                accept="image/*"
                onChange={handlePosterChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Định dạng: JPG, PNG. Kích thước tối đa: 2MB</p>
            </div>

            <div className="mb-4">
              <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Trạng thái *</label>
              <select
                id="status"
                value={newMovie.status}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn trạng thái</option>
                <option value="Now Showing">Đang chiếu</option>
                <option value="Coming Soon">Sắp chiếu</option>
                <option value="Ended">Đã kết thúc</option>
              </select>
            </div>

            <div className="flex items-center justify-between col-span-full mt-4">
              <p className="text-sm text-gray-500">* Trường bắt buộc</p>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => { setIsAddingMovie(false); resetNewMovie(); }} 
                  disabled={isSubmitting}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    'Thêm phim'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal for Updating Movie */}
      <Modal isOpen={isUpdatingMovie} onClose={() => !isSubmitting && setIsUpdatingMovie(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Edit className="h-6 w-6 mr-2 text-blue-600" />
            Cập nhật phim
          </h2>
          <form onSubmit={updateMovie} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="mb-4">
              <label htmlFor="movie_Name" className="block text-gray-700 text-sm font-bold mb-2">Tên phim *</label>
              <input
                type="text"
                id="movie_Name"
                value={newMovie.movie_Name}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="release_Date" className="block text-gray-700 text-sm font-bold mb-2">Ngày phát hành *</label>
              <input
                type="date"
                id="release_Date"
                value={newMovie.release_Date ? newMovie.release_Date.split('T')[0] : ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="end_Date" className="block text-gray-700 text-sm font-bold mb-2">Ngày kết thúc</label>
              <input
                type="date"
                id="end_Date"
                value={newMovie.end_Date ? newMovie.end_Date.split('T')[0] : ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="production_Company" className="block text-gray-700 text-sm font-bold mb-2">Công ty sản xuất *</label>
              <input
                type="text"
                id="production_Company"
                value={newMovie.production_Company}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="director" className="block text-gray-700 text-sm font-bold mb-2">Đạo diễn *</label>
              <input
                type="text"
                id="director"
                value={newMovie.director}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="cast" className="block text-gray-700 text-sm font-bold mb-2">Diễn viên *</label>
              <input
                type="text"
                id="cast"
                value={newMovie.cast}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="duration" className="block text-gray-700 text-sm font-bold mb-2">Thời lượng (phút) *</label>
              <input
                type="number"
                id="duration"
                value={newMovie.duration || ''}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="genre" className="block text-gray-700 text-sm font-bold mb-2">Thể loại *</label>
              <input
                type="text"
                id="genre"
                value={newMovie.genre}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="rating" className="block text-gray-700 text-sm font-bold mb-2">Xếp hạng *</label>
              <select
                id="rating"
                value={newMovie.rating}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn xếp hạng</option>
                <option value="P">P - Phổ thông</option>
                <option value="C13">C13 - Cấm trẻ em dưới 13 tuổi</option>
                <option value="C16">C16 - Cấm trẻ em dưới 16 tuổi</option>
                <option value="C18">C18 - Cấm trẻ em dưới 18 tuổi</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="language" className="block text-gray-700 text-sm font-bold mb-2">Ngôn ngữ *</label>
              <input
                type="text"
                id="language"
                value={newMovie.language}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-2">Quốc gia *</label>
              <input
                type="text"
                id="country"
                value={newMovie.country}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4 md:col-span-2">
              <label htmlFor="synopsis" className="block text-gray-700 text-sm font-bold mb-2">Tóm tắt nội dung *</label>
              <textarea
                id="synopsis"
                value={newMovie.synopsis}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="trailer_Link" className="block text-gray-700 text-sm font-bold mb-2">Link trailer *</label>
              <input
                type="url"
                id="trailer_Link"
                value={newMovie.trailer_Link}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="posterFile" className="block text-gray-700 text-sm font-bold mb-2">Poster phim (Để trống để giữ poster hiện tại)</label>
              <input
                type="file"
                id="posterFile"
                accept="image/*"
                onChange={handlePosterChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {newMovie.poster_URL && (
                <div className="mt-2 flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Poster hiện tại:</span>
                  <img src={newMovie.poster_URL} alt="Current poster" className="h-16 w-12 object-cover rounded" />
                </div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Trạng thái *</label>
              <select
                id="status"
                value={newMovie.status}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn trạng thái</option>
                <option value="Now Showing">Đang chiếu</option>
                <option value="Coming Soon">Sắp chiếu</option>
                <option value="Ended">Đã kết thúc</option>
              </select>
            </div>

            <div className="flex items-center justify-between col-span-full mt-4">
              <p className="text-sm text-gray-500">* Trường bắt buộc</p>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => { setIsUpdatingMovie(false); resetNewMovie(); }} 
                  disabled={isSubmitting}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    'Cập nhật phim'
                  )}
                </button>
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
