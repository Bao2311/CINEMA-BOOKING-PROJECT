using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.APIService.Services
{
    public class SeatService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<SeatService> _logger;

        public SeatService(CinemaDbContext context, ILogger<SeatService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy sơ đồ ghế ngồi của một suất chiếu
        /// </summary>
        public async Task<SeatMapDTO> GetSeatMapAsync(int showtimeId)
        {
            try
            {
                // Kiểm tra suất chiếu có tồn tại không
                var showtime = await _context.Showtimes
                    .Include(s => s.Movie)
                    .Include(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(s => s.Showtime_ID == showtimeId);

                if (showtime == null)
                {
                    return null;
                }

                // Lấy thông tin về bố cục ghế của phòng chiếu
                var seatLayouts = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == showtime.Cinema_Room_ID)
                    .OrderBy(sl => sl.Row_Label)
                    .ThenBy(sl => sl.Column_Number)
                    .ToListAsync();

                // Lấy danh sách các đặt chỗ hiện tại cho suất chiếu này
                var bookingsForShowtime = await _context.TicketBookings
                    .Where(tb => tb.Showtime_ID == showtimeId)
                    .ToListAsync();

                // Lấy danh sách các ghế đã được đặt cho suất chiếu này
                var bookedSeats = await _context.Seats
                    .Include(s => s.TicketBooking)
                    .Where(s => s.TicketBooking != null && s.TicketBooking.Showtime_ID == showtimeId)
                    .ToListAsync();

                // Lấy thông tin giá vé từ bảng TicketPricing
                var ticketPricings = await _context.TicketPricings
                    .Where(p => p.Status == "Active")
                    .ToListAsync();

                // Tạo danh sách ghế cho sơ đồ
                var seatDTOs = new List<SeatDto>();

                foreach (var layout in seatLayouts)
                {
                    // Tìm ghế đã được đặt cho layout này (nếu có)
                    var bookedSeat = bookedSeats.FirstOrDefault(bs => bs.Layout_ID == layout.Layout_ID);

                    // Tìm giá phù hợp dựa trên loại phòng và loại ghế
                    var price = ticketPricings.FirstOrDefault(p =>
                        p.Room_Type == showtime.CinemaRoom.Room_Type &&
                        p.Seat_Type == layout.Seat_Type);

                    // Xác định trạng thái ghế
                    string seatStatus = "Available";
                    int? seatId = null;

                    if (bookedSeat != null)
                    {
                        seatStatus = bookedSeat.Seat_Status; // "Reserved" hoặc "Sold"
                        seatId = bookedSeat.Seat_ID;
                    }

                    seatDTOs.Add(new SeatDto
                    {
                        Seat_ID = seatId ?? 0, // 0 nếu ghế chưa được tạo trong bảng Seats
                        Layout_ID = layout.Layout_ID,
                        Row_Name = layout.Row_Label,
                        Seat_Number = layout.Column_Number,
                        Seat_Type = layout.Seat_Type,
                        Price = price?.Base_Price ?? 70000, // Giá mặc định nếu không tìm thấy
                        Seat_Status = seatStatus
                    });
                }

                // Tạo và trả về SeatMapDTO
                var seatMap = new SeatMapDTO
                {
                    Showtime_ID = showtime.Showtime_ID,
                    Movie_Title = showtime.Movie.Movie_Name,
                    Cinema_Room = showtime.CinemaRoom.Room_Name,
                    Start_Time = showtime.Start_Time,
                    End_Time = showtime.End_Time,
                    Seats = seatDTOs
                };

                return seatMap;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seat map for showtime ID: {showtimeId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một ghế
        /// </summary>
        public async Task<SeatDto> GetSeatDetailsAsync(int seatId)
        {
            try
            {
                var seat = await _context.Seats
                    .Include(s => s.SeatLayout)
                    .Include(s => s.TicketBooking)
                    .ThenInclude(tb => tb.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(s => s.Seat_ID == seatId);

                if (seat == null)
                {
                    return null;
                }

                // Lấy giá từ bảng TicketPricing
                var price = await _context.TicketPricings
                    .Where(p => p.Status == "Active")
                    .Where(p => p.Room_Type == seat.TicketBooking.Showtime.CinemaRoom.Room_Type &&
                                p.Seat_Type == seat.SeatLayout.Seat_Type)
                    .FirstOrDefaultAsync();

                return new SeatDto
                {
                    Seat_ID = seat.Seat_ID,
                    Layout_ID = seat.Layout_ID,
                    Row_Name = seat.SeatLayout.Row_Label,
                    Seat_Number = seat.SeatLayout.Column_Number,
                    Seat_Type = seat.SeatLayout.Seat_Type,
                    Price = price?.Base_Price ?? 70000, // Giá mặc định nếu không tìm thấy
                    Seat_Status = seat.Seat_Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seat details for seat ID: {seatId}");
                throw;
            }
        }
    }
}


