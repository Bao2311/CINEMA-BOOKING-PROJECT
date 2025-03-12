import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import MovieList from '../components/Movies/MovieList';
import { Movie } from '../types';
import { mockMovies } from '../data/mockData';

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll use mock data
    setMovies(mockMovies);
    setIsLoading(false);
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Movies</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <MovieList movies={movies} />
        )}
      </div>
    </Layout>
  );
};

export default MoviesPage;