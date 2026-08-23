import React, { useState } from 'react';
import MovieCard from './MovieCard';
import { Movie } from '../../types';
import { Search, Filter } from 'lucide-react';

interface MovieListProps {
  movies: Movie[];
}

const MovieList: React.FC<MovieListProps> = ({ movies }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  // Extract all unique genres from movies
  const allGenres = Array.from(
    new Set(movies.flatMap(movie => movie.genre))
  ).sort();
  
  // Filter movies based on search term and selected genre
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === '' || movie.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  return (
    <div>
      <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search movies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>
          
          <div className="md:w-64">
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>
        </div>
      </div>
      
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No movies found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieList;
