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

                // Lấy ghế cho suất chiếu cụ thể này
                var seatsForShowtime = await _context.Seats
                    .Where(s => s.Showtime_ID == showtimeId)
                    .Include(s => s.SeatLayout)
                    .Include(s => s.TicketBooking)
                    .ToListAsync();

                // Nếu chưa có ghế cho suất chiếu này, tạo mới
                if (!seatsForShowtime.Any())
                {
                    await CreateSeatsForShowtimeAsync(showtimeId);

                    // Lấy lại danh sách ghế sau khi tạo
                    seatsForShowtime = await _context.Seats
                        .Where(s => s.Showtime_ID == showtimeId)
                        .Include(s => s.SeatLayout)
                        .Include(s => s.TicketBooking)
                        .ToListAsync();
                }

                // Lấy tất cả SeatLayout hoạt động của phòng
                var roomLayouts = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == showtime.Cinema_Room_ID && sl.Is_Active)
                    .OrderBy(sl => sl.Row_Label)
                    .ThenBy(sl => sl.Column_Number)
                    .ToListAsync();

                var seatDTOs = new List<SeatDto>();
                var uniqueRows = new HashSet<string>();

                foreach (var layout in roomLayouts)
                {
                    // Tìm ghế tương ứng với layout trong suất chiếu này
                    var seat = seatsForShowtime.FirstOrDefault(s => s.Layout_ID == layout.Layout_ID);

                    if (seat == null)
                    {
                        // Nếu không tìm thấy ghế, có thể layout mới được thêm sau khi tạo xuất chiếu
                        continue;
                    }

                    // Lấy giá vé
                    var price = ticketPricings.FirstOrDefault(p =>
                        p.Room_Type == cinemaRoom.Room_Type &&
                        p.Seat_Type == layout.Seat_Type);

                    // Thêm hàng vào danh sách các hàng duy nhất
                    uniqueRows.Add(layout.Row_Label);

                    seatDTOs.Add(new SeatDto
                    {
                        Seat_ID = seat.Seat_ID,
                        Seat = null, // Để null như trong DTO gốc
                        Row_Name = layout.Row_Label ?? "N/A",
                        Seat_Number = layout.Column_Number,
                        Seat_Type = layout.Seat_Type ?? "Regular",
                        Price = price?.Base_Price ?? 70000m,
                        Seat_Status = seat.Seat_Status ?? "Available",
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
                    .Include(s => s.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                    .Include(s => s.TicketBooking)
                    .FirstOrDefaultAsync(s => s.Seat_ID == seatId);

                if (seat == null)
                {
                    return null;
                }

                // Lấy giá từ bảng TicketPricing
                var price = await _context.TicketPricings
                    .Where(p => p.Status == "Active")
                    .Where(p => p.Room_Type == seat.Showtime.CinemaRoom.Room_Type &&
                                p.Seat_Type == seat.SeatLayout.Seat_Type)
                    .FirstOrDefaultAsync();

                return new SeatDto
                {
                    Seat_ID = seat.Seat_ID,
                    Layout_ID = seat.Layout_ID,
                    Row_Name = seat.SeatLayout.Row_Label,
                    Seat_Number = seat.SeatLayout.Column_Number,
                    Seat_Type = seat.SeatLayout.Seat_Type,
                    Price = price?.Base_Price ?? 70000,
                    Seat_Status = seat.Seat_Status,
                    Showtime_ID = seat.Showtime_ID
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seat details for seat ID: {seatId}");
                throw;
            }
        }

        public async Task<int> CreateSeatsForShowtimeAsync(int showtimeId)
        {
            try
            {
                _logger.LogInformation($"Bắt đầu tạo ghế cho suất chiếu ID: {showtimeId}");

                var showtime = await _context.Showtimes
                    .Include(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(s => s.Showtime_ID == showtimeId);

                if (showtime == null)
                {
                    _logger.LogWarning($"Không tìm thấy suất chiếu ID: {showtimeId}");
                    throw new KeyNotFoundException($"Không tìm thấy suất chiếu có ID {showtimeId}");
                }

                // Kiểm tra xem đã tạo ghế cho suất chiếu này chưa
                var existingSeats = await _context.Seats
                    .AnyAsync(s => s.Showtime_ID == showtimeId);

                if (existingSeats)
                {
                    _logger.LogWarning($"Ghế cho suất chiếu ID: {showtimeId} đã được tạo trước đó");
                    return 0; // Hoặc trả về số lượng ghế hiện có
                }

                // Lấy tất cả SeatLayout hoạt động của phòng
                var seatLayouts = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == showtime.Cinema_Room_ID && sl.Is_Active)
                    .ToListAsync();

                if (!seatLayouts.Any())
                {
                    _logger.LogWarning($"Phòng chiếu ID: {showtime.Cinema_Room_ID} chưa có SeatLayout");
                    return 0;
                }

                // Tạo ghế cho mỗi layout
                var seats = new List<Seat>();
                foreach (var layout in seatLayouts)
                {
                    seats.Add(new Seat
                    {
                        Layout_ID = layout.Layout_ID,
                        Seat_Status = "Available",
                        Last_Updated = DateTime.Now,
                        Booking_ID = null,
                        Showtime_ID = showtimeId
                    });
                }

                await _context.Seats.AddRangeAsync(seats);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Đã tạo {seats.Count} ghế cho suất chiếu ID: {showtimeId}");

                // Cập nhật số ghế khả dụng cho suất chiếu
                showtime.Capacity_Available = seats.Count;
                await _context.SaveChangesAsync();

                return seats.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi tạo ghế cho suất chiếu ID: {showtimeId}");
                throw;
            }
        }
    }
}


