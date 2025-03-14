import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { motion } from 'framer-motion';

interface Showtime {
  showtime_ID: number;
  movie_ID: number;
  cinema_Room_ID: number;
  room_Name: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
}

const ShowtimesPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchShowtimes = async () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJOZ3V54buFbiBWxINuIE1pbmgiLCJlbWFpbCI6Im5ndXllbnZhbmFAY2luZW1hLmNvbSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc0MTg4MTg2OSwiZXhwIjoxNzQxOTY4MjY5LCJpYXQiOjE3NDE4ODE4NjksImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcxNjgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTY4In0.E2BDWXEGaBhdBvsuReK94u_Ee4ycqukiw6L2ft-iMr8"; // Thay thế bằng token hợp lệ

      try {
        const response = await fetch('https://localhost:7168/api/Showtimes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setShowtimes(data['$values']);
      } catch (err) {
        setError('Error fetching data, please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, []);

  const getFormattedDate = (date: string) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800 tracking-tight">Select Your Show Date</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[...Array(7)].map((_, index) => {
              const date = new Date();
              date.setDate(date.getDate() + index);
              return (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={index}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                    selectedDate.toDateString() === date.toDateString()
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Showtimes */}
        {loading ? (
          <div className="text-center text-gray-600">Loading showtimes...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <div className="space-y-8">
            {showtimes.map((showtime, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 + 0.3 }}
                key={showtime.showtime_ID}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{`Showtime for Room ${showtime.room_Name}`}</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">{showtime.price_Tier}</span>
                    <span className="text-gray-600">{showtime.base_Price.toLocaleString()} VND</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
                    onClick={() => {
                      // Handle booking or viewing details
                    }}
                  >
                    {getFormattedDate(showtime.show_Date)} - {showtime.start_Time} to {showtime.end_Time}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default ShowtimesPage;
