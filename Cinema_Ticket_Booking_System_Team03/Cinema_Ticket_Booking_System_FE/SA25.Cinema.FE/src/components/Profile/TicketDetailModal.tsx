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
      <div className="bg-[#161D2F] border border-white/10 rounded-2xl max-w-2xl w-full mx-4 overflow-hidden text-white">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-white">Chi tiết đặt vé</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <h4 className="font-semibold text-lg text-red-400 mb-1">{firstTicket.movieInfo.movie_Name}</h4>
              <p className="text-sm text-gray-300">Phân loại: {firstTicket.movieInfo.rating}</p>
            </div>
 
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Mã vé</p>
                <p className="font-medium text-white">{tickets.map(t => t.ticket_Code).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Ghế</p>
                <p className="font-medium text-white">{seatLabels}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Ngày chiếu</p>
                <p className="font-medium text-white">{firstTicket.showtimeInfo.showDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Giờ chiếu</p>
                <p className="font-medium text-white">
                  {firstTicket.showtimeInfo.startTime} - {firstTicket.showtimeInfo.endTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Phòng chiếu</p>
                <p className="font-medium text-white">{firstTicket.cinemaRoomInfo.room_Name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Loại phòng</p>
                <p className="font-medium text-white">{firstTicket.cinemaRoomInfo.room_Type}</p>
              </div>
            </div>
 
            <div className="border-t border-white/10 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-white">Tổng tiền</p>
                <p className="text-lg font-bold text-red-400">
                  {totalPrice.toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>
          </div>
 
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 px-5 py-2.5 transition-colors text-sm font-semibold"
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
