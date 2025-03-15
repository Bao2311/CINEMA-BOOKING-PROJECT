import React, { useState, useEffect } from 'react';
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
  const [isUpdatingMovie, setIsUpdatingMovie] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<any>(null);

  const [newMovie, setNewMovie] = useState({
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

  // Fetch movies
  useEffect(() => {
    const fetchMovies = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Invalid token. Please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('https://localhost:7168/api/Movie', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (Array.isArray(response.data.$values)) {
          setMovies(response.data.$values);
        } else {
          setError('Invalid movie data.');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          setError('Movie API not found. Please check the URL or server.');
        } else {
          setError('An error occurred while loading data.');
        }
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Add movie
  const addMovie = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Invalid token. Please log in again.');
      return;
    }

    try {
      const response = await axios.post('https://localhost:7168/api/Movie', newMovie, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMovies([...movies, response.data]);
      resetNewMovie();
      setIsAddingMovie(false);
    } catch (error) {
      console.error('Error adding movie:', error);
    }
  };

  // Update movie
  const updateMovie = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Invalid token. Please log in again.');
      return;
    }

    try {
      const response = await axios.put(`https://localhost:7168/api/Movie/${newMovie.movie_ID}`, newMovie, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMovies(movies.map(movie => (movie.movie_ID === newMovie.movie_ID ? response.data : movie)));
      resetNewMovie();
      setIsUpdatingMovie(false);
    } catch (error) {
      console.error('Error updating movie:', error);
      setError('An error occurred while updating the movie.');
    }
  };

  // Delete movie
  const deleteMovie = async (movieId: number) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Invalid token. Please log in again.');
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this movie?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`https://localhost:7168/api/Movie/${movieId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setMovies(movies.filter(movie => movie.movie_ID !== movieId));
      } else {
        setError('An error occurred while deleting the movie.');
      }
    } catch (error: any) {
      if (error.response) {
        setError(`Error: ${error.response.data.message || 'An error occurred.'}`);
      } else {
        setError('An error occurred while connecting to the server.');
      }
      console.error('Error deleting movie:', error);
    }
  };

  // Edit movie
  const editMovie = (movie: any) => {
    setCurrentMovie(movie);
    setNewMovie(movie);
    setIsUpdatingMovie(true);
  };

  // Reset new movie state
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
  };

  // Calculate movies to display based on current page
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = movies.slice(indexOfFirstMovie, indexOfLastMovie);

  // Calculate total pages
  const totalPages = Math.ceil(movies.length / moviesPerPage);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-semibold text-gray-800 mb-8 text-center">Manage Movies</h1>

        {/* Loading state */}
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
                Add New Movie
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 text-white py-2 px-4 rounded flex items-center"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </button>
            </div>

            {/* Movie list */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">ID</th>
                    <th className="py-2 px-4 border-b">Image</th>
                    <th className="py-2 px-4 border-b">Movie Name</th>
                    <th className="py-2 px-4 border-b">Type</th>
                    <th className="py-2 px-4 border-b">Release Year</th>
                    <th className="py-2 px-4 border-b">Genre</th>
                    <th className="py-2 px-4 border-b">Language</th>
                    <th className="py-2 px-4 border-b">Rating</th>
                    <th className="py-2 px-4 border-b">Status</th>
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
                      <td className="py-2 px-4 border-b">{movie.language}</td>
                      <td className="py-2 px-4 border-b">{movie.rating}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-white ${movie.status === 'Now Showing' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {movie.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button
                          onClick={() => editMovie(movie)}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Movie</h2>
        <form onSubmit={(e) => { e.preventDefault(); addMovie(); }} className="grid grid-cols-3 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="movie_Name">
              Movie Name
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
              Release Date
            </label>
            <input
              type="text"
              id="release_Date"
              placeholder='yyyy-mm-dd'
              value={newMovie.release_Date}
              onChange={(e) => setNewMovie({ ...newMovie, release_Date: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end_Date">
              End Date
            </label>
            <input
              type="text"
              id="end_Date"
              placeholder='yyyy-mm-dd'
              value={newMovie.end_Date}
              onChange={(e) => setNewMovie({ ...newMovie, end_Date: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="production_Company">
              Production Company
            </label>
            <input
              type="text"
              id="production_Company"
              value={newMovie.production_Company}
              onChange={(e) => setNewMovie({ ...newMovie, production_Company: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="director">
              Director
            </label>
            <input
              type="text"
              id="director"
              value={newMovie.director}
              onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cast">
              Cast
            </label>
            <input
              type="text"
              id="cast"
              value={newMovie.cast}
              onChange={(e) => setNewMovie({ ...newMovie, cast: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={newMovie.duration}
              onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="genre">
              Genre
            </label>
            <input
              type="text"
              id="genre"
              value={newMovie.genre}
              onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rating">
              Rating
            </label>
            <input
              type="text"
              id="rating"
              value={newMovie.rating}
              onChange={(e) => setNewMovie({ ...newMovie, rating: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
              Language
            </label>
            <input
              type="text"
              id="language"
              value={newMovie.language}
              onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={newMovie.country}
              onChange={(e) => setNewMovie({ ...newMovie, country: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="synopsis">
              Synopsis
            </label>
            <textarea
              id="synopsis"
              value={newMovie.synopsis}
              onChange={(e) => setNewMovie({ ...newMovie, synopsis: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="poster_URL">
              Poster URL
            </label>
            <input
              type="text"
              id="poster_URL"
              value={newMovie.poster_URL}
              onChange={(e) => setNewMovie({ ...newMovie, poster_URL: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="trailer_Link">
              Trailer Link
            </label>
            <input
              type="text"
              id="trailer_Link"
              value={newMovie.trailer_Link}
              onChange={(e) => setNewMovie({ ...newMovie, trailer_Link: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
              Status
            </label>
            <input
              type="text"
              id="status"
              value={newMovie.status}
              onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setIsUpdatingMovie(false); resetNewMovie(); }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal for Updating Movie */}
      <Modal isOpen={isUpdatingMovie} onClose={() => { setIsUpdatingMovie(false); resetNewMovie(); }}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Movie</h2>
        <form onSubmit={(e) => { e.preventDefault(); updateMovie(); }} className="grid grid-cols-3 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="movie_Name">
              Movie Name
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
              Release Date
            </label>
            <input
              type="text"
              id="release_Date"
              placeholder='yyyy-mm-dd'
              value={newMovie.release_Date}
              onChange={(e) => setNewMovie({ ...newMovie, release_Date: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end_Date">
              End Date
            </label>
            <input
              type="text"
              id="end_Date"
              placeholder='yyyy-mm-dd'
              value={newMovie.end_Date}
              onChange={(e) => setNewMovie({ ...newMovie, end_Date: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="production_Company">
              Production Company
            </label>
            <input
              type="text"
              id="production_Company"
              value={newMovie.production_Company}
              onChange={(e) => setNewMovie({ ...newMovie, production_Company: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="director">
              Director
            </label>
            <input
              type="text"
              id="director"
              value={newMovie.director}
              onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cast">
              Cast
            </label>
            <input
              type="text"
              id="cast"
              value={newMovie.cast}
              onChange={(e) => setNewMovie({ ...newMovie, cast: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={newMovie.duration}
              onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="genre">
              Genre
            </label>
            <input
              type="text"
              id="genre"
              value={newMovie.genre}
              onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rating">
              Rating
            </label>
            <input
              type="text"
              id="rating"
              value={newMovie.rating}
              onChange={(e) => setNewMovie({ ...newMovie, rating: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
              Language
            </label>
            <input
              type="text"
              id="language"
              value={newMovie.language}
              onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={newMovie.country}
              onChange={(e) => setNewMovie({ ...newMovie, country: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="synopsis">
              Synopsis
            </label>
            <textarea
              id="synopsis"
              value={newMovie.synopsis}
              onChange={(e) => setNewMovie({ ...newMovie, synopsis: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="poster_URL">
              Poster URL
            </label>
            <input
              type="text"
              id="poster_URL"
              value={newMovie.poster_URL}
              onChange={(e) => setNewMovie({ ...newMovie, poster_URL: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="trailer_Link">
              Trailer Link
            </label>
            <input
              type="text"
              id="trailer_Link"
              value={newMovie.trailer_Link}
              onChange={(e) => setNewMovie({ ...newMovie, trailer_Link: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
              Status
            </label>
            <input
              type="text"
              id="status"
              value={newMovie.status}
              onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => { setIsUpdatingMovie(false); resetNewMovie(); }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageMoviesPage;  