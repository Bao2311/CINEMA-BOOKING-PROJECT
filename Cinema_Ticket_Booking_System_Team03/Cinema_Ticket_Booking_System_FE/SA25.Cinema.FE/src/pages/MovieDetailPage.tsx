import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import MovieDetail from '../components/Movies/MovieDetail';
import { Movie, Showtime } from '../types';
import { mockMovies, mockShowtimes } from '../data/mockData';

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, these would be API calls
    // For now, we'll use mock data
    
    if (!id) {
      navigate('/movies');
      return;
    }
    
    const foundMovie = mockMovies.find(m => m.id === id);
    
    if (!foundMovie) {
      navigate('/movies');
      return;
    }
    
    setMovie(foundMovie);
    
    // Get showtimes for this movie
    const movieShowtimes = mockShowtimes.filter(s => s.movieId === id);
    setShowtimes(movieShowtimes);
    
    setIsLoading(false);
  }, [id, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!movie) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-gray-500 text-lg">Movie not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <MovieDetail movie={movie} showtimes={showtimes} />
      </div>
    </Layout>
  );
};

export default MovieDetailPage;