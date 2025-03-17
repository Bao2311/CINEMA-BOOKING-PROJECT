// import React, { useState, useEffect } from 'react';
// import Layout from '../components/Layout/Layout';
// import axios from 'axios';
// import MovieDetailPage from './pages/MovieDetailPage';
// import { useAuth } from '../context/AuthContext';

// interface Movie {
//   movie_ID: string;
//   movie_Name: string;
//   director: string;
//   release_Date: string;
//   end_Date: string;
//   genre: string;
//   synopsis: string;
//   production_Company: string;
//   duration: number;
//   rating: string;
//   language: string;
//   country: string;
//   poster_URL: string;
//   trailer_Link: string;
// }

// interface Showtime {
//   showtime_ID: number;
//   movie_ID: number;
//   cinema_Room_ID: number;
//   room_Name: string;
//   show_Date: string;
//   start_Time: string;
//   end_Time: string;
//   price_Tier: string;
//   base_Price: number;
//   status: string;
// }

// const MoviesPage: React.FC = () => {
//   const [movies, setMovies] = useState<Movie[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterDirector, setFilterDirector] = useState('');
//   const [filterReleaseDate, setFilterReleaseDate] = useState('');
//   const [filterCountry, setFilterCountry] = useState('');
//   const [filterLanguage, setFilterLanguage] = useState('');
//   const [filterRating, setFilterRating] = useState('');
//   const { token } = useAuth();

//   useEffect(() => {
//     const fetchMovies = async () => {
//       try {
//         const response = await axios.get('https://localhost:7168/api/Movie', {
//           headers: {
//             Authorization: `Bearer ${token}`, // Add the authorization header
//           },
//         });

//         console.log(response.data);

//         if (Array.isArray(response.data.$values)) {
//           setMovies(response.data.$values);
//         } else {
//           setError('Dữ liệu phim không hợp lệ.');
//         }
//       } catch (error: unknown) {
//         if (axios.isAxiosError(error)) {
//           if (error.response?.status === 401) {
//             setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
//             // Optionally redirect to login page
//             // window.location.href = '/login';
//           } else if (error.response?.status === 404) {
//             setError("Không tìm thấy API phim. Vui lòng kiểm tra lại URL hoặc máy chủ.");
//           } else {
//             setError("Có lỗi xảy ra khi tải dữ liệu.");
//           }
//         }
//         console.error("Error fetching movies:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (token) { // Only fetch if we have a token
//       fetchMovies();
//     } else {
//       setError("Vui lòng đăng nhập để xem danh sách phim.");
//     }
//   }, [token]);

//   const filteredMovies = movies.filter((movie) => {
//     const matchesSearchTerm = movie.movie_Name.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesDirector = filterDirector ? movie.director.toLowerCase().includes(filterDirector.toLowerCase()) : true;
//     const matchesReleaseDate = filterReleaseDate ? movie.release_Date.includes(filterReleaseDate) : true;
//     const matchesCountry = filterCountry ? movie.country.toLowerCase() === filterCountry.toLowerCase() : true;
//     const matchesLanguage = filterLanguage ? movie.language.toLowerCase() === filterLanguage.toLowerCase() : true;
//     const matchesRating = filterRating ? movie.rating.includes(filterRating) : true;
//     return matchesSearchTerm && matchesDirector && matchesReleaseDate && matchesCountry && matchesLanguage && matchesRating;
//   });

//   const handleCardClick = (movieId: string) => {
//     // Navigate to the movie detail page for the specific movie
//     window.location.href = `/movie/${movieId}`;
//   };

//   return (
//     <div>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <h1 className="text-4xl font-semibold text-gray-800 mb-8 text-center">Movies List</h1>

//         {/* Phần tìm kiếm và lọc được trang trí lại */}
//         <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-xl p-8 mb-10">
//           <h2 className="text-2xl font-bold text-white text-center mb-6">Search &amp; Filter</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-white mb-1">Name</label>
//               <input
//                 type="text"
//                 placeholder="Search by name"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="mt-1 block w-full rounded-lg border-2 border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-white mb-1">Director</label>
//               <input
//                 type="text"
//                 placeholder="Search by director"
//                 value={filterDirector}
//                 onChange={(e) => setFilterDirector(e.target.value)}
//                 className="mt-1 block w-full rounded-lg border-2 border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-white mb-1">Release Date</label>
//               <input
//                 type="text"
//                 placeholder="Filter by release date"
//                 value={filterReleaseDate}
//                 onChange={(e) => setFilterReleaseDate(e.target.value)}
//                 className="mt-1 block w-full rounded-lg border-2 border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
//               />
//             </div>
//           </div>
//           <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-white mb-1">Country</label>
//               <input
//                 type="text"
//                 placeholder="Filter by country"
//                 value={filterCountry}
//                 onChange={(e) => setFilterCountry(e.target.value)}
//                 className="mt-1 block w-full rounded-lg border-2 border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-white mb-1">Language</label>
//               <input
//                 type="text"
//                 placeholder="Filter by language"
//                 value={filterLanguage}
//                 onChange={(e) => setFilterLanguage(e.target.value)}
//                 className="mt-1 block w-full rounded-lg border-2 border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-white mb-1">Rating</label>
//               <input
//                 type="text"
//                 placeholder="Filter by rating"
//                 value={filterRating}
//                 onChange={(e) => setFilterRating(e.target.value)}
//                 className="mt-1 block w-full rounded-lg border-2 border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
//               />
//             </div>
//           </div>
//         </div>

//         {isLoading ? (
//           <div className="flex justify-center items-center h-64">
//             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
//           </div>
//         ) : error ? (
//           <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
//             {error}
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//             {filteredMovies.length > 0 ? (
//               filteredMovies.map((movie: Movie) => (
//                 <div
//                   key={movie.movie_ID}
//                   className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition duration-300 cursor-pointer"
//                   onClick={() => handleCardClick(movie.movie_ID)}
//                 >
//                   <div className="h-48 overflow-hidden">
//                     <img
//                       src={movie.poster_URL}
//                       alt={movie.movie_Name}
//                       className="w-full h-full object-cover"
//                     />
//                   </div>
//                   <div className="p-4">
//                     <h2 className="text-xl font-bold text-gray-900 mb-2">{movie.movie_Name}</h2>
//                     <p className="text-sm text-gray-700 mb-1">Director: {movie.director}</p>
//                     <p className="text-sm text-gray-700 mb-1">Release Date: {new Date(movie.release_Date).toLocaleDateString()}</p>
//                     <p className="text-sm text-gray-700 mb-1">End Date: {new Date(movie.end_Date).toLocaleDateString()}</p>
//                     <p className="text-sm text-gray-700 mb-1">Genre: {movie.genre}</p>
//                     <p className="text-sm text-gray-800 mb-1">Synopsis: {movie.synopsis.length > 60 ? `${movie.synopsis.slice(0, 60)}...` : movie.synopsis}</p>
//                     <p className="text-sm text-gray-700 mb-1">Production Company: {movie.production_Company}</p>
//                     <p className="text-sm text-gray-700 mb-1">Duration: {movie.duration} minutes</p>
//                     <p className="text-sm text-gray-700 mb-1">Rating: {movie.rating}</p>
//                     <p className="text-sm text-gray-700 mb-1">Language: {movie.language}</p>
//                     <p className="text-sm text-gray-700 mb-1">Country: {movie.country}</p>
//                     <a
//                       href={movie.trailer_Link}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-indigo-600 hover:text-indigo-800 font-semibold"
//                     >
//                       Xem Trailer
//                     </a>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p className="text-center text-gray-500">Không có phim để hiển thị.</p>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MoviesPage;

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import axios from 'axios';
import MovieDetailPage from './pages/MovieDetailPage';

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

interface Showtime {
  showtime_ID: number;
  movie_ID: number;
  cinema_Room_ID: number;
  room_Name: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
}

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirector, setFilterDirector] = useState('');
  const [filterReleaseDate, setFilterReleaseDate] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterRating, setFilterRating] = useState('');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('https://localhost:7168/api/Movie');

        console.log(response.data);

        if (Array.isArray(response.data.$values)) {
          setMovies(response.data.$values);
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
  }, []);  // Remove token dependency

  const filteredMovies = movies.filter((movie) => {
    const matchesSearchTerm = movie.movie_Name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDirector = filterDirector ? movie.director.toLowerCase().includes(filterDirector.toLowerCase()) : true;
    const matchesReleaseDate = filterReleaseDate ? movie.release_Date.includes(filterReleaseDate) : true;
    const matchesCountry = filterCountry ? movie.country.toLowerCase() === filterCountry.toLowerCase() : true;
    const matchesLanguage = filterLanguage ? movie.language.toLowerCase() === filterLanguage.toLowerCase() : true;
    const matchesRating = filterRating ? movie.rating.includes(filterRating) : true;
    return matchesSearchTerm && matchesDirector && matchesReleaseDate && matchesCountry && matchesLanguage && matchesRating;
  });

  const handleCardClick = (movieId: string) => {
    // Navigate to the movie detail page for the specific movie
    window.location.href = `/movie/${movieId}`;
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-semibold text-gray-800 mb-8 text-center">Movies List</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Search by director"
            value={filterDirector}
            onChange={(e) => setFilterDirector(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Filter by release date"
            value={filterReleaseDate}
            onChange={(e) => setFilterReleaseDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Filter by country"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Filter by language"
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="Filter by rating"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.length > 0 ? (
              filteredMovies.map((movie: Movie) => (
                <div
                  key={movie.movie_ID}
                  className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition duration-300 cursor-pointer"
                  onClick={() => handleCardClick(movie.movie_ID)}
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={movie.poster_URL}
                      alt={movie.movie_Name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{movie.movie_Name}</h2>
                    <p className="text-sm text-gray-700 mb-1">Director: {movie.director}</p>
                    <p className="text-sm text-gray-700 mb-1">Release Date: {new Date(movie.release_Date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-700 mb-1">End Date: {new Date(movie.end_Date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-700 mb-1">Genre: {movie.genre}</p>
                    <p className="text-sm text-gray-800 mb-1">Synopsis: {movie.synopsis.length > 60 ? `${movie.synopsis.slice(0, 60)}...` : movie.synopsis}</p>
                    <p className="text-sm text-gray-700 mb-1">Production Company: {movie.production_Company}</p>
                    <p className="text-sm text-gray-700 mb-1">Duration: {movie.duration} minutes</p>
                    <p className="text-sm text-gray-700 mb-1">Rating: {movie.rating}</p>
                    <p className="text-sm text-gray-700 mb-1">Language: {movie.language}</p>
                    <p className="text-sm text-gray-700 mb-1">Country: {movie.country}</p>
                    <a
                      href={movie.trailer_Link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Xem Trailer
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Không có phim để hiển thị.</p>
            )}
          </div>
        )}
      </div>
    </div >
  );
};

export default MoviesPage;
