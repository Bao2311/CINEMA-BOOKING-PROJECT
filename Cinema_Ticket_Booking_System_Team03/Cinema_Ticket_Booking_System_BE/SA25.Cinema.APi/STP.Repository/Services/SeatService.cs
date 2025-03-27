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
                // 1. Lấy thông tin Showtime và Phòng chiếu
                var showtime = await _context.Showtimes
                    .Include(s => s.Movie)
                    .Include(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(s => s.Showtime_ID == showtimeId);

                if (showtime == null)
                {
                    _logger.LogWarning($"Showtime not found with ID: {showtimeId}");
                    return null;
                }

                // 2. Lấy tất cả SeatLayout của phòng chiếu đó (chỉ lấy layout đang hoạt động)
                var roomLayouts = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == showtime.Cinema_Room_ID && sl.Is_Active)
                    .OrderBy(sl => sl.Row_Label)
                    .ThenBy(sl => sl.Column_Number)
                    .ToListAsync();

                // Lấy danh sách các Layout_ID
                var layoutIds = roomLayouts.Select(sl => sl.Layout_ID).ToList();

                // 3. Lấy TẤT CẢ các bản ghi Seat tương ứng với các Layout_ID trong phòng
                //    *** Thay đổi cốt lõi: Lấy Seat theo Layout_ID, không phải theo Booking ***
                var allSeatsInRoom = await _context.Seats
                    .Where(s => layoutIds.Contains(s.Layout_ID))
                    .Include(s => s.TicketBooking) // Vẫn include để kiểm tra status nếu cần
                    .ToListAsync();

                // Tạo Dictionary để tra cứu nhanh Seat từ Layout_ID
                var seatDict = allSeatsInRoom.ToDictionary(s => s.Layout_ID);

                // 4. Lấy ID các Booking chỉ thuộc về Showtime hiện tại (để xác định trạng thái chính xác)
                var bookingsForThisShowtimeIds = await _context.TicketBookings
                    .Where(tb => tb.Showtime_ID == showtimeId)
                    .Select(tb => tb.Booking_ID) // Chỉ cần lấy Booking_ID
                    .ToListAsync();
                // Dùng HashSet để kiểm tra nhanh
                var bookingIdSetForThisShowtime = new HashSet<int>(bookingsForThisShowtimeIds);

                // 5. Lấy thông tin giá vé
                var ticketPricings = await _context.TicketPricings
                    .Where(p => p.Status == "Active")
                    .ToListAsync();

                // 6. Tạo danh sách DTO
                var seatDTOs = new List<SeatDto>();
                foreach (var layout in roomLayouts)
                {
                    // Tìm bản ghi Seat tương ứng với layout hiện tại từ Dictionary
                    if (!seatDict.TryGetValue(layout.Layout_ID, out var persistentSeat))
                    {
                        // Trường hợp này không nên xảy ra nếu giả định là đúng
                        // (Mỗi Layout_ID phải có một Seat tương ứng)
                        _logger.LogWarning($"Seat record not found for Layout_ID: {layout.Layout_ID}. Skipping.");
                        continue; // Bỏ qua layout này nếu không tìm thấy Seat
                    }

                    // Xác định trạng thái của ghế NÀY cho SUẤT CHIẾU NÀY
                    string currentStatus = "Available"; // Mặc định là Available

                    // Kiểm tra xem ghế này có Booking_ID và Booking_ID đó có thuộc suất chiếu này không
                    if (persistentSeat.Booking_ID.HasValue && bookingIdSetForThisShowtime.Contains(persistentSeat.Booking_ID.Value))
                    {
                        // Ghế này ĐÃ ĐƯỢC ĐẶT cho suất chiếu hiện tại
                        // Có thể lấy trạng thái từ persistentSeat.Seat_Status hoặc đặt cứng là "Reserved"/"Sold"
                        currentStatus = persistentSeat.Seat_Status; // Giả định Seat_Status phản ánh đúng
                    }
                    // Optional: Thêm logic kiểm tra trạng thái khác như "Maintenance" dựa trên persistentSeat.Seat_Status nếu cần

                    // Lấy giá vé
                    var price = ticketPricings.FirstOrDefault(p =>
                        p.Room_Type == showtime.CinemaRoom.Room_Type &&
                        p.Seat_Type == layout.Seat_Type);

                    seatDTOs.Add(new SeatDto
                    {
                        // *** Lấy Seat_ID từ bản ghi persistentSeat ***
                        Seat_ID = persistentSeat.Seat_ID, // Bây giờ luôn có giá trị (theo giả định)

                        Layout_ID = layout.Layout_ID,
                        Row_Name = layout.Row_Label,
                        Seat_Number = layout.Column_Number,
                        Seat_Type = layout.Seat_Type,
                        Price = price?.Base_Price ?? 70000,
                        Seat_Status = currentStatus // Trạng thái đã xác định cho suất chiếu này
                    });
                }

                // 7. Tạo và trả về SeatMapDTO
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
                throw; // Rethrow the exception after logging
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


