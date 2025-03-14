import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import MovieDetail from '../components/Movies/MovieDetail';
import { Movie, Showtime } from '../types';
import axios from 'axios';

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const movieResponse = await axios.get(`https://localhost:7168/api/Movie/${id}`);
        setMovie(movieResponse.data);

        const showtimesResponse = await axios.get('https://localhost:7168/api/Showtimes');
        const allShowtimes = showtimesResponse.data['$values'];
        const filteredShowtimes = allShowtimes.filter((showtime: Showtime) => showtime.movie_ID.toString() === id);
        setShowtimes(filteredShowtimes);
      } catch (error) {
        setError('Failed to fetch movie details or showtimes.');
        console.error('Error fetching data:', error);
        navigate('/movies');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    } else {
      navigate('/movies');
    }
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