import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { Plus, RefreshCw, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import Modal from '../components/Admin/Modal';
import axios from 'axios';

const ManageMoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 5;
  const [isAddingMovie, setIsAddingMovie] = useState(false);

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
      setIsAddingMovie(false);
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

  // Tính toán các phim hiển thị dựa trên trang hiện tại
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = movies.slice(indexOfFirstMovie, indexOfLastMovie);

  // Tính tổng số trang
  const totalPages = Math.ceil(movies.length / moviesPerPage);

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
            {/* Buttons for actions */}
            <div className="flex justify-between mb-4">
              <button
                onClick={() => setIsAddingMovie(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Tạo phim
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 text-white py-2 px-4 rounded flex items-center"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>

            {/* Danh sách phim */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">ID</th>
                    <th className="py-2 px-4 border-b">Hình ảnh</th>
                    <th className="py-2 px-4 border-b">Tên phim</th>
                    <th className="py-2 px-4 border-b">Loại phim</th>
                    <th className="py-2 px-4 border-b">Năm phát hành</th>
                    <th className="py-2 px-4 border-b">Thể loại</th>
                    <th className="py-2 px-4 border-b">View</th>
                    <th className="py-2 px-4 border-b">Rating</th>
                    <th className="py-2 px-4 border-b">Trạng thái</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMovies.map((movie) => (
                    <tr key={movie.movie_ID}>
                      <td className="py-2 px-4 border-b">{movie.movie_ID}</td>
                      <td className="py-2 px-4 border-b">
                        <img src={movie.poster_URL} alt={movie.movie_Name} className="h-16 w-16 object-cover" />
                      </td>
                      <td className="py-2 px-4 border-b">{movie.movie_Name}</td>
                      <td className="py-2 px-4 border-b">{movie.genre}</td>
                      <td className="py-2 px-4 border-b">{new Date(movie.release_Date).getFullYear()}</td>
                      <td className="py-2 px-4 border-b">{movie.genre}</td>
                      <td className="py-2 px-4 border-b">{movie.view}</td>
                      <td className="py-2 px-4 border-b">{movie.rating}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-white ${movie.status === 'Công khai' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {movie.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => editMovie(movie.movie_ID)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteMovie(movie.movie_ID)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l flex items-center"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </button>
              <span className="text-lg font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r flex items-center"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Adding Movie */}
      <Modal isOpen={isAddingMovie} onClose={() => setIsAddingMovie(false)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Thêm Phim Mới</h2>
        <form onSubmit={(e) => { e.preventDefault(); addMovie(); }}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="movie_Name">
              Tên phim
            </label>
            <input
              type="text"
              id="movie_Name"
              value={newMovie.movie_Name}
              onChange={(e) => setNewMovie({ ...newMovie, movie_Name: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="release_Date">
              Ngày phát hành
            </label>
            <input
              type="date"
              id="release_Date"
              value={newMovie.release_Date}
              onChange={(e) => setNewMovie({ ...newMovie, release_Date: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          {/* Add other fields similarly */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Thêm
            </button>
            <button
              type="button"
              onClick={() => setIsAddingMovie(false)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ManageMoviesPage;  