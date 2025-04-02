import React from 'react';
import { X } from 'lucide-react';
import { TicketDetail } from '../../interfaces/ProfileInterfaces';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: TicketDetail[];
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ isOpen, onClose, tickets }) => {
  if (!isOpen || tickets.length === 0) return null;

  const firstTicket = tickets[0];
  const seatLabels = tickets.map(ticket => ticket.seatInfo.seatLabel).join(', ');
  const totalPrice = tickets.reduce((sum, ticket) => sum + ticket.priceInfo.final_Price, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-gray-900">Chi tiết đặt vé</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg text-indigo-900 mb-2">{firstTicket.movieInfo.movie_Name}</h4>
              <p className="text-indigo-700">Phân loại: {firstTicket.movieInfo.rating}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Mã vé</p>
                <p className="font-medium">{tickets.map(t => t.ticket_Code).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ghế</p>
                <p className="font-medium">{seatLabels}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngày chiếu</p>
                <p className="font-medium">{firstTicket.showtimeInfo.showDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Giờ chiếu</p>
                <p className="font-medium">
                  {firstTicket.showtimeInfo.startTime} - {firstTicket.showtimeInfo.endTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phòng chiếu</p>
                <p className="font-medium">{firstTicket.cinemaRoomInfo.room_Name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Loại phòng</p>
                <p className="font-medium">{firstTicket.cinemaRoomInfo.room_Type}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Tổng tiền</p>
                <p className="text-lg font-bold text-indigo-600">
                  {totalPrice.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;