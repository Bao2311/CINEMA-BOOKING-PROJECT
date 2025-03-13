import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, Star, ArrowRight } from 'lucide-react';
import NavbarLoginAdmin from '../components/Layout/Navbar-Login-Admin';
import MovieCard from '../components/Movies/MovieCard';
import { Movie, Promotion } from '../types';
import { mockMovies, mockPromotions } from '../data/mockData';

const HomepageAdmin: React.FC = () => {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  
  useEffect(() => {
    // In a real app, these would be API calls
    // For now, we'll use mock data
    
    // Get top rated movies for featured section
    const sortedByRating = [...mockMovies].sort((a, b) => {
      // Chuyển đổi rating thành kiểu number trước khi so sánh
      return parseFloat(b.rating) - parseFloat(a.rating);
    });
    
    setFeaturedMovies(sortedByRating.slice(0, 4));
    
    // Get upcoming movies
    const today = new Date();
    const upcoming = mockMovies.filter(movie => new Date(movie.releaseDate) > today);
    setUpcomingMovies(upcoming.slice(0, 4));
    
    // Get active promotions
    const activePromotions = mockPromotions.filter(
      promo => promo.isActive && new Date(promo.endDate) >= today
    );
    setPromotions(activePromotions);
  }, []);

  return (
    <>
      <NavbarLoginAdmin />
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
              Experience Movies Like Never Before
            </h1>
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
              <Link
                to="/promotions"
                className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-md font-medium transition-colors flex items-center"
              >
                <Star className="mr-2 h-5 w-5" />
                View Promotions
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
            {featuredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      </section>

      {/* Promotions */}
      {promotions.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Current Promotions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map(promotion => (
                <div
                  key={promotion.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{promotion.name}</h3>
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {promotion.discountPercentage}% OFF
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{promotion.description}</p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Code: <span className="font-medium">{promotion.code}</span></span>
                      <span>Valid until: {new Date(promotion.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <Link
                to="/promotions"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All Promotions <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

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
            {upcomingMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      </section>

      {/* Membership Benefits */}
      <section className="py-12 bg-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Become a Member</h2>
            <p className="text-indigo-200 max-w-3xl mx-auto">
              Join our membership program and enjoy exclusive benefits, discounts, and special offers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-indigo-800 rounded-lg p-6 text-center">
              <div className="bg-indigo-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Discounted Tickets</h3>
              <p className="text-indigo-200">
                Members get special pricing on all movie tickets and concessions.
              </p>
            </div>
            
            <div className="bg-indigo-800 rounded-lg p-6 text-center">
              <div className="bg-indigo-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Early Access</h3>
              <p className="text-indigo-200">
                Book tickets for upcoming blockbusters before they're available to the public.
              </p>
            </div>
            
            <div className="bg-indigo-800 rounded-lg p-6 text-center">
              <div className="bg-indigo-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Exclusive Events</h3>
              <p className="text-indigo-200">
                Get invited to special screenings, premieres, and member-only events.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link
              to="/membership"
              className="bg-white text-indigo-900 hover:bg-gray-100 px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center"
            >
              Join Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomepageAdmin;
