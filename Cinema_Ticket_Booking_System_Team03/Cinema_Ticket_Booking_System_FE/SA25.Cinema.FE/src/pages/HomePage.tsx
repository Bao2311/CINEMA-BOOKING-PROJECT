import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowRight, Star, Calendar, Clock, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from '../components/Movies/MovieCard';
import axios from 'axios';
import { Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage: React.FC = () => {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const featuredRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://localhost:7168/api/Movie', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && Array.isArray(response.data.$values)) {
          const allMovies = response.data.$values;
          
          // Featured movies (highest rated)
          const sortedByRating = [...allMovies].sort((a: Movie, b: Movie) => parseFloat(b.rating) - parseFloat(a.rating));
          setFeaturedMovies(sortedByRating.slice(0, 8));
          
          // Hero movies (top 5 for carousel)
          const heroMovies = sortedByRating.slice(0, 5);
          
          // Upcoming movies
          const today = new Date();
          const upcoming = allMovies.filter((movie: Movie) => {
            return new Date(movie.release_Date) > today;
          });
          setUpcomingMovies(upcoming.slice(0, 8));
          
          // Popular movies (different selection for variety)
          const sortedByPopularity = [...allMovies]
            .filter(movie => parseFloat(movie.rating) > 7.0)
            .sort(() => 0.5 - Math.random()); // Simple shuffle
          setPopularMovies(sortedByPopularity.slice(0, 8));
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

    // Auto rotate hero carousel
    const carouselInterval = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % 5);
    }, 6000);

    return () => clearInterval(carouselInterval);
  }, []);

  const scrollSection = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -ref.current.clientWidth / 2 : ref.current.clientWidth / 2;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/movies?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const renderHeroSection = () => {
    if (isLoading || featuredMovies.length === 0) {
      return (
        <div className="relative bg-gray-900 text-white h-[600px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
        </div>
      );
    }

    return (
      <section className="relative bg-gray-900 text-white h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHeroIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10"></div>
            <img
              src={featuredMovies[currentHeroIndex]?.poster_URL || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop"}
              alt={featuredMovies[currentHeroIndex]?.movie_Name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex">
          {featuredMovies.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroIndex(index)}
              className={`h-1.5 flex-1 mx-1 my-6 rounded-full transition-all duration-300 ${
                index === currentHeroIndex ? 'bg-white' : 'bg-white/30'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
                {featuredMovies[currentHeroIndex]?.movie_Name}
              </h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center bg-yellow-500 text-black px-2 py-1 rounded mr-3">
                  <Star className="h-4 w-4 mr-1 fill-current" />
                  <span className="font-bold">{featuredMovies[currentHeroIndex]?.rating}</span>
                </div>
                <span className="text-gray-300 mr-3">{featuredMovies[currentHeroIndex]?.genre}</span>
                <span className="text-gray-300">{new Date(featuredMovies[currentHeroIndex]?.release_Date).getFullYear()}</span>
              </div>
              <p className="text-xl mb-8 text-gray-300 line-clamp-3">
                Directed by {featuredMovies[currentHeroIndex]?.director}. Starring {featuredMovies[currentHeroIndex]?.cast}.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={`/movie/${featuredMovies[currentHeroIndex]?.movie_ID}`}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-md font-medium transition-colors flex items-center"
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Get Tickets
                </Link>
                <Link
                  to={`/movie/${featuredMovies[currentHeroIndex]?.movie_ID}`}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-4 rounded-md font-medium transition-colors flex items-center"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Trailer
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  };

  const renderSearchBar = () => (
    <section className="py-8 bg-gradient-to-r from-indigo-900 to-purple-900">
      <div className="max-w-4xl mx-auto px-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search for movies, genres, actors..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`w-full py-4 px-6 pr-12 rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-white/60 border-2 transition-all duration-300 focus:outline-none ${
              isSearchFocused ? 'border-white/40' : 'border-transparent'
            }`}
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );

  const renderMovieSection = (
    title: string,
    movies: Movie[],
    ref: React.RefObject<HTMLDivElement>,
    bgClass: string = "bg-white"
  ) => (
    <section className={`py-16 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollSection('left', ref)}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollSection('right', ref)}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <Link
              to="/movies"
              className="ml-4 text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              View All <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        ) : (
          <div
            ref={ref}
            className="flex space-x-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {movies.map((movie) => (
              <div key={movie.movie_ID} className="snap-start min-w-[280px] w-[280px]">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const renderPromotionSection = () => (
    <section className="py-16 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Membership Benefits</h2>
            <p className="text-lg mb-8 text-purple-200">
              Join our premium membership program and enjoy exclusive benefits including discounted tickets, 
              free snacks, and priority seating.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                'Up to 25% off on all movie tickets',
                'Free popcorn and drink on your birthday',
                'Exclusive access to premiere screenings',
                'No booking fees',
                'Earn points with every purchase'
              ].map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-6 w-6 text-purple-300 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/membership"
              className="inline-block bg-white text-purple-900 px-8 py-3 rounded-md font-medium hover:bg-purple-100 transition-colors"
            >
              Join Now
            </Link>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Cinema membership"
              className="rounded-xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -right-6 bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg shadow-xl">
              25% OFF
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderAppDownloadSection = () => (
    <section className="py-16 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Mobile app"
                className="rounded-3xl shadow-xl max-w-xs"
              />
              <div className="absolute -top-4 -right-4 bg-red-500 text-white font-bold py-2 px-4 rounded-full shadow-lg">
                NEW
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold mb-6">Download Our App</h2>
            <p className="text-lg mb-8 text-gray-600">
              Get the best cinema experience with our mobile app. Book tickets, check showtimes, and receive exclusive offers directly on your phone.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                className="flex items-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.707 9.293l-5-5a.999.999 0 00-1.414 0l-5 5a.999.999 0 101.414 1.414L12 6.414l4.293 4.293a.997.997 0 001.414 0 .999.999 0 000-1.414zM12 18a1 1 0 01-1-1v-8a1 1 0 012 0v8a1 1 0 01-1 1z" />
                </svg>
                <div>
                  <div className="text-xs">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.707 9.293l-5-5a.999.999 0 00-1.414 0l-5 5a.999.999 0 101.414 1.414L12 6.414l4.293 4.293a.997.997 0 001.414 0 .999.999 0 000-1.414zM12 18a1 1 0 01-1-1v-8a1 1 0 012 0v8a1 1 0 01-1 1z" />
                </svg>
                <div>
                  <div className="text-xs">GET IT ON</div>
                  <div className="text-lg font-semibold">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="bg-white">
      {/* Custom CSS for hiding scrollbars */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {renderHeroSection()}
      {renderSearchBar()}
      {renderMovieSection("Featured Movies", featuredMovies, featuredRef)}
      {renderPromotionSection()}
      {renderMovieSection("Coming Soon", upcomingMovies, upcomingRef, "bg-gray-50")}
      {renderAppDownloadSection()}
      {renderMovieSection("Popular Movies", popularMovies, popularRef)}
    </div>
  );
};

export default HomePage;
