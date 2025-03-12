import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import SeatSelection from '../components/Booking/SeatSelection';
import BookingSummary from '../components/Booking/BookingSummary';
import { Showtime, Movie, Seat, Promotion } from '../types';
import { mockShowtimes, mockMovies, mockSeats, mockPromotions } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${id}` } });
      return;
    }
    
    // Check if user is a member
    if (user && !user.isMember) {
      navigate('/membership', { state: { message: 'You need to be a member to book tickets.' } });
      return;
    }
    
    // In a real app, these would be API calls
    // For now, we'll use mock data
    
    if (!id) {
      navigate('/movies');
      return;
    }
    
    const foundShowtime = mockShowtimes.find(s => s.id === id);
    
    if (!foundShowtime) {
      navigate('/movies');
      return;
    }
    
    setShowtime(foundShowtime);
    
    // Get movie for this showtime
    const foundMovie = mockMovies.find(m => m.id === foundShowtime.movieId);
    
    if (!foundMovie) {
      navigate('/movies');
      return;
    }
    
    setMovie(foundMovie);
    
    // Get seats for this showtime
    // In a real app, this would be based on the room and availability
    setSeats(mockSeats);
    
    // Get active promotions
    const today = new Date();
    const activePromotions = mockPromotions.filter(
      promo => promo.isActive && new Date(promo.endDate) >= today
    );
    setPromotions(activePromotions);
    
    setIsLoading(false);
  }, [id, navigate, isAuthenticated, user]);

  const handleSeatSelect = (seats: Seat[]) => {
    setSelectedSeats(seats);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!showtime || !movie) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-center text-gray-500 text-lg">Showtime not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Tickets</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SeatSelection
              seats={seats}
              showtime={showtime}
              movie={movie}
              onSeatSelect={handleSeatSelect}
            />
          </div>
          
          <div>
            <BookingSummary
              selectedSeats={selectedSeats}
              showtime={showtime}
              movie={movie}
              promotions={promotions}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingPage;