import React, { useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { Loader2, Ticket, Clock } from 'lucide-react';
import { Booking } from '../../interfaces/ProfileInterfaces';
import BookingStatusBadge from './BookingStatusBadge';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface BookingsHistoryTabProps {
  bookings: Booking[];
  isLoading: boolean;
  isPaymentLoading: { [key: string]: boolean };
  handlePayment: (bookingId: string) => Promise<void>;
  handleCancelBooking: (bookingId: string) => Promise<void>;
  handleViewDetails: (bookingId: string) => Promise<void>;
  navigate: NavigateFunction;
}

const BookingsHistoryTab: React.FC<BookingsHistoryTabProps> = ({
  bookings,
  isLoading,
  isPaymentLoading,
  handlePayment,
  handleCancelBooking,
  handleViewDetails,
  navigate
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString.split('T')[0];
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return dateString;
    }
  };

  // Logic phân trang
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch sử đặt vé</h2>
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-500">Đang tải lịch sử đặt vé...</p>
          </div>
        )}
        {!isLoading && bookings.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Bạn chưa có lịch sử đặt vé nào.</p>
            <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
              Đặt vé ngay
            </button>
          </div>
        )}
        {!isLoading && bookings.length > 0 && (
          <>
            <div className="space-y-6">
              {currentBookings.map(booking => (
                <div
                  key={booking.id}
                  className={`border rounded-lg overflow-hidden transition-shadow hover:shadow-md ${
                    booking.status === 'Pending'
                      ? 'border-yellow-200 bg-yellow-50'
                      : booking.status === 'Confirmed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50 opacity-80'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{booking.movieTitle}</h4>
                        <p className="text-sm text-gray-600 mt-1">{booking.cinema}</p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Suất chiếu</p>
                        <p className="font-medium text-gray-800">{formatDateTime(booking.showtime)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Mã đặt vé</p>
                        <p className="font-medium text-gray-800">{booking.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Tổng tiền</p>
                        <p className="font-medium text-gray-800">{booking.totalAmount.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Thanh toán</p>
                        <p className="font-medium text-gray-800">{booking.paymentMethod || 'N/A'}</p>
                      </div>
                      {booking.status === 'Cancelled' && booking.cancellationDate && (
                        <div>
                          <p className="text-xs text-red-600 uppercase font-medium">Ngày hủy</p>
                          <p className="font-medium text-red-800">{formatDate(booking.cancellationDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={`${
                      booking.status === 'Pending'
                        ? 'bg-yellow-100 border-t border-yellow-200'
                        : booking.status === 'Confirmed'
                        ? 'bg-green-100 border-t border-green-200'
                        : 'bg-red-100 border-t border-red-200'
                    } px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2`}
                  >
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span>Đặt lúc: {formatDateTime(booking.bookingDate)}</span>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => handleViewDetails(booking.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Xem chi tiết
                      </button>
                      {booking.status === 'Pending' && (
                        <button 
                          onClick={() => handlePayment(booking.id)}
                          disabled={isPaymentLoading[booking.id]}
                          className="text-xs text-yellow-600 hover:text-yellow-800 font-medium flex items-center"
                        >
                          {isPaymentLoading[booking.id] ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            'Thanh toán'
                          )}
                        </button>
                      )}
                      {booking.status === 'Pending' && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Hủy vé
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md text-sm ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsHistoryTab;