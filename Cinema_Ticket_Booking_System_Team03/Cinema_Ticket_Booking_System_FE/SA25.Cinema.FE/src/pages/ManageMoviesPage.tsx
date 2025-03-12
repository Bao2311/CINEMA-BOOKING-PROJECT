import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import MovieForm from '../components/Admin/MovieForm';
import { Movie } from '../types';
import { mockMovies } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

const ManageMoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMovie, setIsAddingMovie] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Check if user is authenticated and has appropriate role
    // if (!isAuthenticated || (user && user.role !== 'admin' && user.role !== 'employee')) {
    //   navigate('/');
    //   return;
    // }
    
    // In a real app, this would be an API call
    // For now, we'll use mock data
    setMovies(mockMovies);
    setIsLoading(false);
  }, [isAuthenticated, user, navigate]);

  const handleAddMovie = (movieData: Omit<Movie, 'id'>) => {
    // In a real app, this would be an API call
    // For now, we'll simulate adding a movie
    const newMovie: Movie = {
      id: `movie-${Date.now()}`,
      ...movieData,
    };
    
    setMovies([...movies, newMovie]);
    setIsAddingMovie(false);
  };

  const handleUpdateMovie = (movieData: Omit<Movie, 'id'>) => {
    // In a real app, this would be an API call
    // For now, we'll simulate updating a movie
    if (!editingMovie) return;
    
    const updatedMovies = movies.map(movie => 
      movie.id === editingMovie.id ? { ...movie, ...movieData } : movie
    );
    
    setMovies(updatedMovies);
    setEditingMovie(null);
  };

  const handleDeleteMovie = (id: string) => {
    // In a real app, this would be an API call with confirmation
    // For now, we'll simulate deleting a movie
    if (window.confirm('Are you sure you want to delete this movie?')) {
      setMovies(movies.filter(movie => movie.id !== id));
    }
  };

  const filteredMovies = movies.filter(movie => 
    movie.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Movies</h1>
          <button
            onClick={() => setIsAddingMovie(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-1" />
            Add Movie
          </button>
        </div>
        
        {isAddingMovie && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Movie</h2>
            <MovieForm
              onSubmit={handleAddMovie}
              onCancel={() => setIsAddingMovie(false)}
            />
          </div>
        )}
        
        {editingMovie && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Movie</h2>
            <MovieForm
              movie={editingMovie}
              onSubmit={handleUpdateMovie}
              onCancel={() => setEditingMovie(null)}
            />
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Genre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Release Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMovies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No movies found.
                      </td>
                    </tr>
                  ) : (
                    filteredMovies.map(movie => (
                      <tr key={movie.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={movie.posterUrl}
                                alt={movie.title}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{movie.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {movie.genre.join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{movie.duration} min</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(movie.releaseDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{movie.rating.toFixed(1)}/10</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/movies/${movie.id}`)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditingMovie(movie)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMovie(movie.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ManageMoviesPage;