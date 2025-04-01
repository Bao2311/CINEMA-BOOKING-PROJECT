import React from 'react';

// Component cho thẻ trạng thái đặt vé
const BookingStatusBadge: React.FC<{ status: 'Pending' | 'Cancelled' | 'Confirmed' }> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'Pending': return 'Đang chờ thanh toán';
      case 'Confirmed': return 'Đã xác nhận';
      case 'Cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${getStatusStyles()}`}>
      {getStatusText()}
    </span>
  );
};

export default BookingStatusBadge;