import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import axios from 'axios';

const ManageMoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newMovie, setNewMovie] = useState({
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
  });

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJOZ3V54buFbiBWxINuIE1pbmgiLCJlbWFpbCI6Im5ndXllbnZhbmFAY2luZW1hLmNvbSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc0MTg4MTg2OSwiZXhwIjoxNzQxOTY4MjY5LCJpYXQiOjE3NDE4ODE4NjksImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcxNjgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTY4In0.E2BDWXEGaBhdBvsuReK94u_Ee4ycqukiw6L2ft-iMr8'; // Thay thế bằng token thực tế

  // Hàm để lấy dữ liệu phim
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('https://localhost:7168/api/Movie', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (Array.isArray(response.data.$values)) {
          setMovies(response.data.$values);
        } else {
          setError('Dữ liệu phim không hợp lệ.');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          setError('Không tìm thấy API phim. Vui lòng kiểm tra lại URL hoặc máy chủ.');
        } else {
          setError('Có lỗi xảy ra khi tải dữ liệu.');
        }
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Hàm thêm phim
  const addMovie = async () => {
    try {
      const response = await axios.post('https://localhost:7168/api/Movie', newMovie, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMovies([...movies, response.data]);
      setNewMovie({
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
      });
    } catch (error) {
      console.error('Error adding movie:', error);
    }
  };

  // Hàm xóa phim
  const deleteMovie = async (movieId: number) => {
    try {
      await axios.delete(`https://localhost:7168/api/Movie/${movieId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMovies(movies.filter(movie => movie.movie_ID !== movieId));
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  // Hàm chỉnh sửa thông tin phim
  const editMovie = async (movieId: number) => {
    // Có thể tạo form để sửa thông tin hoặc mở modal
    // Sau khi sửa, gửi yêu cầu PUT để cập nhật phim
    try {
      const updatedMovie = { ...newMovie, movie_ID: movieId }; // Chỉnh sửa thông tin theo form nhập
      await axios.put(`https://localhost:7168/api/Movie/${movieId}`, updatedMovie, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMovies(movies.map(movie => (movie.movie_ID === movieId ? updatedMovie : movie)));
    } catch (error) {
      console.error('Error editing movie:', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-semibold text-gray-800 mb-8 text-center">Quản Lý Phim</h1>

        {/* Hiển thị khi đang tải dữ liệu */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        ) : (
          <div>
            {/* Form thêm phim */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Thêm Phim Mới</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newMovie.movie_Name}
                  onChange={(e) => setNewMovie({ ...newMovie, movie_Name: e.target.value })}
                  placeholder="Tên Phim"
                  className="border p-2 rounded"
                />
                <input
                  type="date"
                  value={newMovie.release_Date}
                  onChange={(e) => setNewMovie({ ...newMovie, release_Date: e.target.value })}
                  placeholder="Ngày Phát Hành"
                  className="border p-2 rounded"
                />
                {/* Thêm các input còn lại cho các trường khác */}
              </div>
              <button
                onClick={addMovie}
                className="mt-4 bg-blue-600 text-white py-2 px-6 rounded"
              >
                Thêm Phim
              </button>
            </div>

            {/* Danh sách phim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
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
                    {/* Các nút quản lý: Chỉnh sửa, xóa */}
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => editMovie(movie.movie_ID)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteMovie(movie.movie_ID)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageMoviesPage;
