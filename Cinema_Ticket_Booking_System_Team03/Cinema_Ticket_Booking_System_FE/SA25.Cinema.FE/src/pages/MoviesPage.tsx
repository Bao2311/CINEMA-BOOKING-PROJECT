// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const MoviesPage: React.FC = () => {
//   const [movies, setMovies] = useState<any[]>([]); // Sử dụng mảng rỗng làm giá trị ban đầu
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // JWT Token
//   const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJOZ3V54buFbiBWxINuIE1pbmgiLCJlbWFpbCI6Im5ndXllbnZhbmFAY2luZW1hLmNvbSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc0MTg4MTg2OSwiZXhwIjoxNzQxOTY4MjY5LCJpYXQiOjE3NDE4ODE4NjksImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcxNjgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTY4In0.E2BDWXEGaBhdBvsuReK94u_Ee4ycqukiw6L2ft-iMr8';

//   useEffect(() => {
//     const fetchMovies = async () => {
//       try {
//         const response = await axios.get('https://localhost:7168/api/Movie', {
//           headers: {
//             Authorization: `Bearer ${token}`, // Gửi token trong header
//           },
//         });
  
//         // Log dữ liệu trả về từ API
//         console.log("API Response:", response.data);
  
//         // Kiểm tra kỹ dữ liệu trả về
//         if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
//           setMovies(response.data.$values); // Nếu là mảng trong "$values", lưu vào state movies
//         } else {
//           // Nếu không phải mảng hoặc không có "$values", hiển thị thông báo lỗi
//           setMovies([]); 
//           setError("Dữ liệu phim không hợp lệ.");
//         }
//       } catch (err) {
//         console.error("Error fetching movies:", err);
//         setError("Có lỗi xảy ra khi tải dữ liệu.");
//       } finally {
//         setIsLoading(false); // Kết thúc quá trình tải
//       }
//     };
  
//     fetchMovies();
//   }, []); // useEffect chạy khi component được mount lần đầu
  

//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-4xl font-bold text-center mb-6">Quản lý Bộ Phim</h1>

//       {/* Hiển thị khi đang tải dữ liệu */}
//       {isLoading && (
//         <div className="flex justify-center items-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
//         </div>
//       )}

//       {/* Hiển thị khi có lỗi */}
//       {error && (
//         <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
//           {error}
//         </div>
//       )}

//       {/* Hiển thị danh sách phim nếu không có lỗi */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {Array.isArray(movies) && movies.length > 0 ? (
//           movies.map((movie) => (
//             <div
//               key={movie.movie_ID}
//               className="bg-white border rounded-lg shadow-lg overflow-hidden"
//             >
//               <img
//                 src={movie.poster_URL}
//                 alt={movie.movie_Name}
//                 className="w-full h-60 object-cover"
//               />
//               <div className="p-4">
//                 <h2 className="text-xl font-bold">{movie.movie_Name}</h2>
//                 <p className="text-sm text-gray-600">Đạo diễn: {movie.director}</p>
//                 <p className="text-sm text-gray-600">Diễn viên: {movie.cast}</p>
//                 <p className="text-sm text-gray-600">Ngày phát hành: {new Date(movie.release_Date).toLocaleDateString()}</p>
//                 <p className="text-sm text-gray-600">Thể loại: {movie.genre}</p>
//                 <p className="text-sm text-gray-600">Tình trạng: {movie.status}</p>
//                 <p className="mt-2 text-sm text-gray-700">{movie.synopsis}</p>
//                 <div className="mt-4">
//                   <a
//                     href={movie.trailer_Link}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-indigo-600 hover:text-indigo-800"
//                   >
//                     Xem Trailer
//                   </a>
//                 </div>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p className="text-center text-gray-500">Không có phim để hiển thị.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MoviesPage;

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import axios from 'axios';

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy token từ localStorage (hoặc sessionStorage)
  //const token = localStorage.getItem('authToken');  // Token được lưu trong localStorage dưới tên 'authToken'
    const token ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJOZ3V54buFbiBWxINuIE1pbmgiLCJlbWFpbCI6Im5ndXllbnZhbmFAY2luZW1hLmNvbSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc0MTk0MTM4MSwiZXhwIjoxNzQyMDI3NzgxLCJpYXQiOjE3NDE5NDEzODEsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcxNjgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTY4In0.TWIOf4mEpy98Z4-u4Dg_jsHd10Wv_XevyAEhfiNLN-s'; 
  useEffect(() => {
    const fetchMovies = async () => {
      if (!token) {
        setError('Token không hợp lệ hoặc không tồn tại.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('https://localhost:7168/api/Movie', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(response.data);

        if (Array.isArray(response.data.$values)) {
          setMovies(response.data.$values);
        } else {
          setError('Dữ liệu phim không hợp lệ.');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
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
  }, [token]);  // token được theo dõi như một dependency

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-semibold text-gray-800 mb-8 text-center">Danh Sách Phim</h1>

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
            {movies.length > 0 ? (
              movies.map((movie: any) => (
                <div key={movie.movie_ID} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition duration-300">
                  <img
                    src={movie.poster_URL}
                    alt={movie.movie_Name}
                    className="w-full h-72 object-cover"
                  />
                  <div className="p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">{movie.movie_Name}</h2>
                    <p className="text-sm text-gray-600 mb-2">Đạo diễn: {movie.director}</p>
                    <p className="text-sm text-gray-600 mb-2">Ngày phát hành: {new Date(movie.release_Date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 mb-4">Thể loại: {movie.genre}</p>
                    <p className="text-sm text-gray-700">{movie.synopsis.length > 100 ? `${movie.synopsis.slice(0, 100)}...` : movie.synopsis}</p>
                    <div className="mt-4 text-center">
                      <a
                        href={movie.trailer_Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Xem Trailer
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Không có phim để hiển thị.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MoviesPage;

  
