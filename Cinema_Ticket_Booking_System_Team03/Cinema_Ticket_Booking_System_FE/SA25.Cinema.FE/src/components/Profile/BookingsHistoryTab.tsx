import React, { useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { Loader2, Ticket, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
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
    } catch {
      return dateString.split('T')[0];
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch {
      return dateString;
    }
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  return (
    <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden text-white">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-red-500" /> Lịch sử đặt vé
        </h2>

        {isLoading && (
          <div className="text-center py-16">
            <Loader2 className="animate-spin h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Đang tải lịch sử đặt vé...</p>
          </div>
        )}

        {!isLoading && bookings.length === 0 && (
          <div className="text-center py-16">
            <Ticket className="h-14 w-14 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">Bạn chưa có đơn đặt vé nào</h3>
            <p className="text-gray-400 text-xs mt-1">Khám phá các bộ phim hot và đặt vé ngay hôm nay.</p>
            <button
              onClick={() => navigate('/movies')}
              className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-red-500/30"
            >
              Đặt vé ngay
            </button>
          </div>
        )}

        {!isLoading && bookings.length > 0 && (
          <>
            <div className="space-y-4">
              {currentBookings.map(booking => (
                <div
                  key={booking.id}
                  className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden transition-all shadow-lg"
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                      <div>
                        <h4 className="font-bold text-base text-white">{booking.movieTitle}</h4>
                        <p className="text-xs text-gray-400 mt-1">{booking.cinema}</p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400 uppercase font-medium">Suất chiếu</p>
                        <p className="font-semibold text-white mt-0.5">{formatDateTime(booking.showtime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-medium">Mã đặt vé</p>
                        <p className="font-mono text-amber-400 mt-0.5 font-bold">#{booking.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-medium">Tổng tiền</p>
                        <p className="font-bold text-red-400 mt-0.5">{booking.totalAmount.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase font-medium">Thanh toán</p>
                        <p className="font-medium text-gray-300 mt-0.5">
                          {booking.status === 'Pending' ? (
                            <span className="text-amber-400 font-semibold">Chờ thanh toán</span>
                          ) : booking.status === 'Cancelled' ? (
                            <span className="text-gray-500">Đã hủy</span>
                          ) : (
                            booking.paymentMethod || 'Giả lập'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 border-t border-white/5 px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span>Đặt lúc: {formatDateTime(booking.bookingDate)}</span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleViewDetails(booking.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        Xem chi tiết
                      </button>
                      {booking.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handlePayment(booking.id)}
                            disabled={isPaymentLoading[booking.id]}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                          >
                            {isPaymentLoading[booking.id] ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" /> Đang chuyển hướng...
                              </>
                            ) : (
                              'Thanh toán ngay'
                            )}
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold"
                          >
                            Hủy vé
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-white/10">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === i + 1
                        ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsHistoryTab;
