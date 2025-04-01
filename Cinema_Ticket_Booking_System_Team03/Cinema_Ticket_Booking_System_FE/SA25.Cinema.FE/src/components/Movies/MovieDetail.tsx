import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Calendar, Star, Film, Play, Ticket } from 'lucide-react';
import { Movie, Showtime } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface MovieDetailProps {
  movie: Movie;
  showtimes: Showtime[];
}

const MovieDetail: React.FC<MovieDetailProps> = ({ movie, showtimes }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Convert rating to a number
  const rating = parseFloat(movie.rating);
  
  // Get unique dates from showtimes
  const dates = Array.from(
    new Set(showtimes.map(showtime => showtime.show_Date))
  ).sort();
  
  // Filter showtimes by selected date
  const filteredShowtimes = selectedDate
    ? showtimes.filter(showtime => showtime.show_Date === selectedDate)
    : [];
  
  // Group showtimes by date for display
  const showtimesByDate = dates.reduce((acc, date) => {
    acc[date] = showtimes.filter(showtime => showtime.show_Date === date);
    return acc;
  }, {} as Record<string, Showtime[]>);

  const handleBooking = (showtimeId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${showtimeId}` } });
      return;
    }
    
    navigate(`/booking/${showtimeId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative">
        {/* Movie backdrop */}
        <div className="w-full h-96 bg-gray-900">
          <img
            src={movie.poster_URL}
            alt={movie.movie_Name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        </div>
        
        {/* Movie info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-4xl font-bold mb-2">{movie.movie_Name}</h1>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-1 text-yellow-400 fill-current" />
              <span>{!isNaN(rating) ? rating.toFixed(1) : 'N/A'}/10</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-1" />
              <span>{movie.duration} min</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-1" />
              <span>{new Date(movie.release_Date).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genre.split(',').map((genre, index) => (
              <span
                key={index}
                className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm"
              >
                {genre}
              </span>
            ))}
          </div>
          
          <div className="flex space-x-4">
            <a
              href={movie.trailer_Link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Play className="h-5 w-5 mr-2" />
              Watch Trailer
            </a>
            <button
              onClick={() => setSelectedDate(dates[0] || '')}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Ticket className="h-5 w-5 mr-2" />
              Book Tickets
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
          <p className="text-gray-700">{movie.synopsis}</p>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Showtimes</h2>
          
          {dates.length === 0 ? (
            <p className="text-gray-500">No showtimes available for this movie.</p>
          ) : (
            <div>
              <div className="mb-6 overflow-x-auto">
                <div className="flex space-x-2">
                  {dates.map(date => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`px-4 py-2 rounded-md whitespace-nowrap ${
                        selectedDate === date
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedDate ? (
                filteredShowtimes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredShowtimes.map(showtime => (
                      <button
                        key={showtime.showtime_ID}
                        onClick={() => handleBooking(showtime.showtime_ID.toString())}
                        className="bg-white border border-gray-300 hover:border-indigo-500 rounded-md p-4 text-center transition-colors"
                      >
                        <p className="font-medium text-gray-900">
                          {new Date(`${showtime.show_Date}T${showtime.start_Time}`).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">Room {showtime.cinema_Room_ID}</p>
                        <p className="text-sm font-medium text-indigo-600 mt-2">
                          {showtime.base_Price.toLocaleString()} VND
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No showtimes available for the selected date.</p>
                )
              ) : (
                <p className="text-gray-500">Select a date to see available showtimes.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;