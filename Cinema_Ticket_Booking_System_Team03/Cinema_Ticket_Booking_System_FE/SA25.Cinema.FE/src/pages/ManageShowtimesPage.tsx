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

const ManageShowtimesPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editShowtime, setEditShowtime] = useState<Showtime | null>(null);
  const [newShowtime, setNewShowtime] = useState<Showtime>({
    showtime_ID: 0,
    movie_ID: 0,
    cinema_Room_ID: 0,
    room_Name: '',
    show_Date: '',
    start_Time: '',
    end_Time: '',
    price_Tier: '',
    base_Price: 0,
    status: 'active',
  });

  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJOZ3V54buFbiBWxINuIE1pbmgiLCJlbWFpbCI6Im5ndXllbnZhbmFAY2luZW1hLmNvbSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc0MTkxMzExMCwiZXhwIjoxNzQxOTk5NTEwLCJpYXQiOjE3NDE5MTMxMTAsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcxNjgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTY4In0.TB5uLsWtcJh3Rac6Jnz2bZTeBajZd4803vhhlVWB8wQ"; // Insert the token here

  useEffect(() => {
    const fetchShowtimes = async () => {
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

  const handleCreateShowtime = async () => {
    try {
      const response = await fetch('https://localhost:7168/api/Showtimes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newShowtime),
      });

      if (!response.ok) {
        throw new Error('Failed to create showtime');
      }

      const data = await response.json();
      setShowtimes((prevShowtimes) => [...prevShowtimes, data]);
      setNewShowtime({
        showtime_ID: 0,
        movie_ID: 0,
        cinema_Room_ID: 0,
        room_Name: '',
        show_Date: '',
        start_Time: '',
        end_Time: '',
        price_Tier: '',
        base_Price: 0,
        status: 'active',
      }); // Reset form
    } catch (err) {
      setError('Error creating showtime, please try again.');
      console.error(err);
    }
  };

  const handleUpdateShowtime = async () => {
    if (!editShowtime) return;

    try {
      const response = await fetch(`https://localhost:7168/api/Showtimes/${editShowtime.showtime_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editShowtime),
      });

      if (!response.ok) {
        throw new Error('Failed to update showtime');
      }

      const updatedShowtime = await response.json();
      setShowtimes((prevShowtimes) =>
        prevShowtimes.map((showtime) =>
          showtime.showtime_ID === updatedShowtime.showtime_ID ? updatedShowtime : showtime
        )
      );
      setEditShowtime(null); // Reset edit state
    } catch (err) {
      setError('Error updating showtime, please try again.');
      console.error(err);
    }
  };

  const handleDeleteShowtime = async (showtime_ID: number) => {
    try {
      const response = await fetch(`https://localhost:7168/api/Showtimes/${showtime_ID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete showtime');
      }

      setShowtimes((prevShowtimes) =>
        prevShowtimes.filter((showtime) => showtime.showtime_ID !== showtime_ID)
      );
    } catch (err) {
      setError('Error deleting showtime, please try again.');
      console.error(err);
    }
  };

  return (
    <div>
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
          <h2 className="text-2xl font-bold mb-4 text-gray-800 tracking-tight">Manage Showtimes</h2>

          <div className="space-x-4">
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-xl"
              onClick={() => setEditShowtime(null)} // Clear form to create new
            >
              Create Showtime
            </button>
          </div>
        </motion.div>

        {/* Showtime Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-xl font-semibold mb-4">{editShowtime ? 'Edit Showtime' : 'Create Showtime'}</h3>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Room Name"
              value={editShowtime ? editShowtime.room_Name : newShowtime.room_Name}
              onChange={(e) => (editShowtime ? setEditShowtime({ ...editShowtime, room_Name: e.target.value }) : setNewShowtime({ ...newShowtime, room_Name: e.target.value }))}
              className="px-4 py-2 border rounded-md w-full"
            />
            {/* Add other form fields similarly */}
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-xl"
              onClick={editShowtime ? handleUpdateShowtime : handleCreateShowtime}
            >
              {editShowtime ? 'Update Showtime' : 'Create Showtime'}
            </button>
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
                    onClick={() => setEditShowtime(showtime)} // Set for editing
                  >
                    Edit
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                    onClick={() => handleDeleteShowtime(showtime.showtime_ID)} // Delete the showtime
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div >
  );
};

export default ManageShowtimesPage;
