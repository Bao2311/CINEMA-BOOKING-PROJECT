import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, QrCode } from 'lucide-react';
import { Seat, Showtime, Movie, Promotion } from '../../types';

interface BookingSummaryProps {
  selectedSeats: Seat[];
  showtime: Showtime;
  movie: Movie;
  promotions: Promotion[];
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedSeats,
  showtime,
  movie,
  promotions,
}) => {
  const navigate = useNavigate();
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'qr'>('card');
  
  const basePrice = selectedSeats.length * showtime.price;
  const discount = selectedPromotion ? (basePrice * selectedPromotion.discountPercentage) / 100 : 0;
  const totalPrice = basePrice - discount;
  
  const handlePromoCodeApply = () => {
    const promotion = promotions.find(
      p => p.code === promoCode && p.isActive && new Date(p.endDate) >= new Date()
    );
    
    if (promotion) {
      setSelectedPromotion(promotion);
      setPromoCode('');
    }
  };
  
  const handleCompleteBooking = () => {
    // In a real app, this would make an API call to create the booking
    // For now, we'll just navigate to a confirmation page
    navigate('/booking/confirmation');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Booking Summary</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Movie:</span>
          <span className="font-medium">{movie.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">
            {new Date(showtime.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Time:</span>
          <span className="font-medium">
            {new Date(`${showtime.date}T${showtime.startTime}`).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Room:</span>
          <span className="font-medium">Room {showtime.roomId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Seats:</span>
          <span className="font-medium">
            {selectedSeats.map(seat => `${seat.row}${seat.number}`).join(', ')}
          </span>
        </div>
      </div>
      
      <div className="border-t border-b border-gray-200 py-4 mb-6">
        <div className="mb-4">
          <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-1">
            Promo Code
          </label>
          <div className="flex">
            <input
              type="text"
              id="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter promo code"
            />
            <button
              onClick={handlePromoCodeApply}
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
        
        {selectedPromotion && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-green-800">{selectedPromotion.name}</p>
                <p className="text-sm text-green-600">{selectedPromotion.description}</p>
              </div>
              <button
                onClick={() => setSelectedPromotion(null)}
                className="text-green-800 hover:text-green-900"
              >
                Remove
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Ticket Price:</span>
            <span>${showtime.price.toFixed(2)} x {selectedSeats.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>${basePrice.toFixed(2)}</span>
          </div>
          {selectedPromotion && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({selectedPromotion.discountPercentage}%):</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`flex flex-col items-center justify-center p-3 border rounded-md ${
              paymentMethod === 'card'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-300'
            }`}
          >
            <CreditCard className={`h-6 w-6 mb-1 ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-gray-500'}`} />
            <span className={`text-sm ${paymentMethod === 'card' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
              Credit Card
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('wallet')}
            className={`flex flex-col items-center justify-center p-3 border rounded-md ${
              paymentMethod === 'wallet'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-300'
            }`}
          >
            <Wallet className={`h-6 w-6 mb-1 ${paymentMethod === 'wallet' ? 'text-indigo-600' : 'text-gray-500'}`} />
            <span className={`text-sm ${paymentMethod === 'wallet' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
              E-Wallet
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('qr')}
            className={`flex flex-col items-center justify-center p-3 border rounded-md ${
              paymentMethod === 'qr'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-300'
            }`}
          >
            <QrCode className={`h-6 w-6 mb-1 ${paymentMethod === 'qr' ? 'text-indigo-600' : 'text-gray-500'}`} />
            <span className={`text-sm ${paymentMethod === 'qr' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>
              QR Payment
            </span>
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center font-bold text-lg mb-6">
        <span>Total:</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>
      
      <button
        onClick={handleCompleteBooking}
        disabled={selectedSeats.length === 0}
        className="w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Complete Booking
      </button>
    </div>
  );
};

export default BookingSummary;
