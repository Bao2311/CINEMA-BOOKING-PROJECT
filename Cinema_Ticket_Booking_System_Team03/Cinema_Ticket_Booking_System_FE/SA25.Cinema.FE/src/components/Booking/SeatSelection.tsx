import React, { useState } from 'react';
import { Seat, Showtime, Movie } from '../../types';

interface SeatSelectionProps {
  seats: Seat[];
  showtime: Showtime;
  movie: Movie;
  onSeatSelect: (selectedSeats: Seat[]) => void;
}

const SeatSelection: React.FC<SeatSelectionProps> = ({
  seats,
  showtime,
  movie,
  onSeatSelect,
}) => {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows alphabetically
  const rows = Object.keys(seatsByRow).sort();

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'reserved') {
      return;
    }

    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Update parent component when selection changes
  React.useEffect(() => {
    onSeatSelect(selectedSeats);
  }, [selectedSeats, onSeatSelect]);

  const getSeatColor = (seat: Seat) => {
    if (seat.status === 'booked' || seat.status === 'reserved') {
      return 'bg-gray-400 cursor-not-allowed';
    }
    
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isSelected) {
      return 'bg-indigo-600 text-white';
    }
    
    if (seat.type === 'vip') {
      return 'bg-purple-100 hover:bg-purple-200';
    }
    
    if (seat.type === 'disabled') {
      return 'bg-blue-100 hover:bg-blue-200';
    }
    
    return 'bg-gray-100 hover:bg-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Your Seats</h2>
        <p className="text-gray-600">
          Movie: <span className="font-medium">{movie.title}</span> | 
          Time: <span className="font-medium">
            {new Date(`${showtime.date}T${showtime.startTime}`).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </p>
      </div>
      
      <div className="mb-8">
        <div className="w-full h-4 bg-gray-300 rounded-lg mb-6 flex items-center justify-center">
          <span className="text-xs text-gray-600">SCREEN</span>
        </div>
        
        <div className="flex justify-center mb-8">
          <div className="space-y-2">
            {rows.map(row => (
              <div key={row} className="flex items-center">
                <div className="w-8 text-center font-medium text-gray-700">{row}</div>
                <div className="flex space-x-2">
                  {seatsByRow[row].map(seat => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'booked' || seat.status === 'reserved'}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${getSeatColor(seat)}`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded-sm mr-2"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-600 rounded-sm mr-2"></div>
            <span className="text-sm text-gray-600">Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 rounded-sm mr-2"></div>
            <span className="text-sm text-gray-600">Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 rounded-sm mr-2"></div>
            <span className="text-sm text-gray-600">VIP</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 rounded-sm mr-2"></div>
            <span className="text-sm text-gray-600">Accessible</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Selected Seats: <span className="font-medium">
              {selectedSeats.length > 0 
                ? selectedSeats.map(s => `${s.row}${s.number}`).join(', ') 
                : 'None'}
            </span></p>
            <p className="text-gray-600">Total Price: <span className="font-medium">
              ${(selectedSeats.length * showtime.price).toFixed(2)}
            </span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;