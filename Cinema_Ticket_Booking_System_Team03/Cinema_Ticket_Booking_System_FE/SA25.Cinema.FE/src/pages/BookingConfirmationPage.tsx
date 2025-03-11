import React from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout/Layout';

const BookingConfirmationPage: React.FC = () => {
  // In a real app, this data would come from the booking API response
  const bookingData = {
    id: 'BK' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
    movie: 'Inception',
    date: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: '7:30 PM',
    seats: ['A12', 'A13'],
    room: 'Room 3',
    totalPrice: 24.00,
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-green-600 text-white p-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p>Your tickets have been booked successfully.</p>
          </div>
          
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <QRCode value={`BOOKING:${bookingData.id}`} size={180} />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
              <p className="text-2xl font-bold">{bookingData.id}</p>
            </div>
            
            <div className="border-t border-b border-gray-200 py-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Movie</p>
                  <p className="font-medium">{bookingData.movie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium">{bookingData.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time</p>
                  <p className="font-medium">{bookingData.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Room</p>
                  <p className="font-medium">{bookingData.room}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Seats</p>
                  <p className="font-medium">{bookingData.seats.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Price</p>
                  <p className="font-medium">${bookingData.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Please show this QR code at the cinema entrance. You can also print or download your e-ticket.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                  <Printer className="h-5 w-5 mr-2" />
                  Print Ticket
                </button>
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download className="h-5 w-5 mr-2" />
                  Download E-Ticket
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingConfirmationPage;