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
                var showtime = await _context.Showtimes
                    .Include(s => s.Movie)
                    .Include(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(s => s.Showtime_ID == showtimeId);

                if (showtime == null)
                {
                    _logger.LogWarning($"Showtime not found with ID: {showtimeId}");
                    return new SeatMapDTO
                    {
                        Showtime_ID = showtimeId,
                        Seats = new List<SeatDto>(),
                        Movie = new MovieInfoDTO(),
                        Room = new RoomDTO(),
                        Movie_Title = "Không xác định",
                        Cinema_Room = "Không xác định"
                    };
                }

                // Kiểm tra và gán giá trị mặc định
                var movie = showtime.Movie ?? new Movie { Movie_Name = "Không xác định" };
                var cinemaRoom = showtime.CinemaRoom ?? new CinemaRoom { Room_Name = "Không xác định" };

                // Lấy thông tin giá vé
                var ticketPricings = await _context.TicketPricings
                    .Where(p => p.Status == "Active")
                    .ToListAsync();

                // Lấy layout ghế
                var roomLayouts = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == showtime.Cinema_Room_ID && sl.Is_Active)
                    .OrderBy(sl => sl.Row_Label)
                    .ThenBy(sl => sl.Column_Number)
                    .ToListAsync();

                // Lấy các booking cho suất chiếu này
                var bookingsForThisShowtimeIds = await _context.TicketBookings
                    .Where(tb => tb.Showtime_ID == showtimeId)
                    .Select(tb => tb.Booking_ID)
                    .ToListAsync();

                var bookingIdSetForThisShowtime = new HashSet<int>(bookingsForThisShowtimeIds);

                // Lấy thông tin ghế
                var allSeatsInRoom = await _context.Seats
                    .Where(s => s.SeatLayout.Cinema_Room_ID == showtime.Cinema_Room_ID)
                    .Include(s => s.SeatLayout)
                    .Include(s => s.TicketBooking)
                    .ToListAsync();

                var seatDTOs = new List<SeatDto>();
                var uniqueRows = new HashSet<string>();

                foreach (var layout in roomLayouts)
                {
                    // Tìm ghế tương ứng với layout
                    var seat = allSeatsInRoom.FirstOrDefault(s => s.Layout_ID == layout.Layout_ID);

                    // Lấy giá vé
                    var price = ticketPricings.FirstOrDefault(p =>
                        p.Room_Type == cinemaRoom.Room_Type &&
                        p.Seat_Type == layout.Seat_Type);

                    // Xác định trạng thái ghế
                    string seatStatus = "Available";
                    if (seat?.Booking_ID.HasValue == true &&
                        bookingIdSetForThisShowtime.Contains(seat.Booking_ID.Value))
                    {
                        seatStatus = seat.Seat_Status ?? "Reserved";
                    }

                    // Thêm hàng vào danh sách các hàng duy nhất
                    uniqueRows.Add(layout.Row_Label);

                    seatDTOs.Add(new SeatDto
                    {
                        Seat_ID = seat?.Seat_ID ?? 0,
                        Seat = null, // Để null như trong DTO gốc
                        Row_Name = layout.Row_Label ?? "N/A",
                        Seat_Number = layout.Column_Number,
                        Seat_Type = layout.Seat_Type ?? "Regular",
                        Price = price?.Base_Price ?? 70000m,
                        Seat_Status = seatStatus,
                        Layout_ID = layout.Layout_ID,
                        Is_Active = layout.Is_Active
                    });
                }

                return new SeatMapDTO
                {
                    Showtime_ID = showtime.Showtime_ID,
                    Movie = new MovieInfoDTO
                    {
                        Movie_ID = movie.Movie_ID,
                        Movie_Name = movie.Movie_Name,
                        Duration = movie.Duration,
                        Rating = movie.Rating,
                        Poster_URL = movie.Poster_URL
                    },
                    Room = new RoomDTO
                    {
                        Cinema_Room_ID = cinemaRoom.Cinema_Room_ID,
                        Room_Name = cinemaRoom.Room_Name,
                        Room_Type = cinemaRoom.Room_Type
                    },
                    Show_Date = showtime.Show_Date,
                    Start_Time = showtime.Start_Time,
                    End_Time = showtime.End_Time,
                    Movie_Title = movie.Movie_Name,
                    Cinema_Room = cinemaRoom.Room_Name,
                    Rows = uniqueRows.OrderBy(r => r).ToList(),
                    Seats = seatDTOs,
                    Room_ID = cinemaRoom.Cinema_Room_ID
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Detailed error getting seat map for showtime ID: {showtimeId}");
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


