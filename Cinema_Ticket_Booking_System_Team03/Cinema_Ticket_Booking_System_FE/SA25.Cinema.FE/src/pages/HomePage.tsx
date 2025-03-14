import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import MovieCard from '../components/Movies/MovieCard';
import axios from 'axios';
import { Movie } from '../types';

const HomePage: React.FC = () => {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://localhost:7168/api/Movie');

        if (response.data && Array.isArray(response.data.$values)) {
          const sortedByRating = [...response.data.$values].sort((a: Movie, b: Movie) => parseFloat(b.rating) - parseFloat(a.rating));
          setFeaturedMovies(sortedByRating.slice(0, 4));

          const today = new Date();
          const upcoming = response.data.$values.filter((movie: Movie) => {
            return new Date(movie.release_Date) > today;
          });
          setUpcomingMovies(upcoming.slice(0, 4));
        } else {
          setError('Dữ liệu phim không hợp lệ.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
            alt="Cinema"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Experience Movies Like Never Before</h1>
            <p className="text-xl mb-8">
              Immerse yourself in the ultimate cinematic experience with state-of-the-art technology and premium comfort.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/movies"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center"
              >
                <Ticket className="mr-2 h-5 w-5" />
                Browse Movies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Movies */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Movies</h2>
            <Link
              to="/movies"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              View All <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                {error}
              </div>
            ) : (
              featuredMovies.map((movie) => (
                <MovieCard key={movie.movie_ID} movie={movie} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Movies */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Coming Soon</h2>
            <Link
              to="/movies"
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              View All <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                {error}
              </div>
            ) : (
              upcomingMovies.map((movie) => (
                <MovieCard key={movie.movie_ID} movie={movie} />
              ))
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;

