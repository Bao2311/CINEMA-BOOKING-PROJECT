import React from 'react';
import { X, QrCode, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#161D2F] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden text-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-red-500" />
            <h3 className="text-xl font-bold text-white">Vé Điện Tử & Mã QR Check-in</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Movie info banner */}
          <div className="bg-gradient-to-r from-red-900/30 to-red-600/10 border border-red-500/20 p-4 rounded-xl">
            <h4 className="font-bold text-xl text-red-400 mb-1">{firstTicket.movieInfo.movie_Name}</h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
              <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-md font-semibold border border-red-500/30">
                {firstTicket.movieInfo.rating}
              </span>
              <span>Thời lượng: {firstTicket.movieInfo.duration} phút</span>
            </div>
          </div>

          {/* Ticket Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white/5 border border-white/5 p-4 rounded-xl text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Mã đơn đặt vé</p>
              <p className="font-mono text-amber-400 font-bold mt-0.5">#{firstTicket.booking_ID}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Ghế đã chọn</p>
              <p className="font-bold text-white mt-0.5">{seatLabels}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Phòng chiếu</p>
              <p className="font-semibold text-white mt-0.5">{firstTicket.cinemaRoomInfo.room_Name} ({firstTicket.cinemaRoomInfo.room_Type})</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Ngày chiếu</p>
              <p className="font-semibold text-white mt-0.5">{firstTicket.showtimeInfo.showDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Giờ chiếu</p>
              <p className="font-semibold text-white mt-0.5">{firstTicket.showtimeInfo.startTime} - {firstTicket.showtimeInfo.endTime}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Tổng thanh toán</p>
              <p className="font-bold text-red-400 mt-0.5">{totalPrice.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>

          {/* QR Code Cards for each Ticket */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Mã QR Vé Quét Tại Rạp ({tickets.length} vé)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tickets.map((ticket, idx) => (
                <div 
                  key={ticket.ticket_ID || idx}
                  className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg border border-gray-200"
                >
                  <div className="mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Ghế {ticket.seatInfo?.seatLabel || `G${idx + 1}`}
                    </span>
                  </div>
                  
                  {/* QR Code SVG */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-inner my-1">
                    <QRCodeSVG 
                      value={ticket.ticket_Code} 
                      size={150} 
                      level="M" 
                      includeMargin={false}
                    />
                  </div>

                  {/* Ticket Code */}
                  <p className="font-mono text-gray-800 font-extrabold text-sm tracking-wider mt-2 mb-1">
                    {ticket.ticket_Code}
                  </p>

                  {/* Status Badge */}
                  {ticket.is_Checked_In ? (
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã check-in {ticket.checkInTime ? `(${ticket.checkInTime})` : ''}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Chưa check-in (Đưa QR cho NV rạp)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-between items-center">
          <p className="text-xs text-gray-400">💡 Quét mã QR tại quầy vé để vào phòng chiếu</p>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 px-6 py-2 transition-colors text-sm font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
