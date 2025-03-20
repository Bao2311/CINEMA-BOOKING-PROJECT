using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.APIService.Controllers.DTOs;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.DTOs;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class BookingService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<BookingService> _logger;

        public BookingService(CinemaDbContext context, ILogger<BookingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<BookingHistoryDTO>> GetUserBookings(int userId)
        {
            try
            {
                // Lấy danh sách đơn đặt vé
                var bookings = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Payments)  // Include payments
                    .Include(b => b.BookingHistories)  // Include booking histories
                    .Where(b => b.User_ID == userId)
                    .OrderByDescending(b => b.Booking_Date)
                    .ToListAsync();

                var result = new List<BookingHistoryDTO>();

                foreach (var b in bookings)
                {
                    // Lấy thông tin thanh toán mới nhất
                    var latestPayment = b.Payments.OrderByDescending(p => p.Transaction_Date).FirstOrDefault();

                    // Lấy thông tin hủy đơn nếu có
                    var cancellation = b.BookingHistories
                        .Where(h => h.Status == "Cancelled")
                        .OrderByDescending(h => h.Date)
                        .FirstOrDefault();

                    var bookingHistory = new BookingHistoryDTO
                    {
                        Booking_ID = b.Booking_ID,
                        Booking_Date = b.Booking_Date,
                        Total_Amount = b.Total_Amount,
                        Status = b.Status,
                        Payment_Method = latestPayment?.Payment_Method,
                        Payment_Date = latestPayment?.Transaction_Date,
                        Cancellation_Date = cancellation?.Date,
                        Showtime = new ShowtimeInfoDTO
                        {
                            Showtime_ID = b.Showtime.Showtime_ID,
                            Show_Date = b.Showtime.Show_Date,
                            Start_Time = b.Showtime.Start_Time,
                            Movie = new MovieInfoDTO
                            {
                                Movie_ID = b.Showtime.Movie.Movie_ID,
                                Movie_Name = b.Showtime.Movie.Movie_Name,
                                Duration = b.Showtime.Movie.Duration,
                                Rating = b.Showtime.Movie.Rating,
                                Poster_URL = b.Showtime.Movie.Poster_URL
                            },
                            Room = new RoomDTO
                            {
                                Cinema_Room_ID = b.Showtime.CinemaRoom.Cinema_Room_ID,
                                Room_Name = b.Showtime.CinemaRoom.Room_Name,
                                Room_Type = b.Showtime.CinemaRoom.Room_Type
                            }
                        }
                    };

                    result.Add(bookingHistory);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                throw;
            }
        }

        public async Task<BookingDetailDto> GetBookingDetail(int bookingId)
        {
            // Lấy thông tin đơn đặt vé từ cơ sở dữ liệu
            var booking = await _context.TicketBookings
                .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                .Include(b => b.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                .Include(b => b.Tickets)
                .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException("Không tìm thấy đặt vé");
            }

            // Khởi tạo giá trị mặc định cho thông tin ghế
            string seatPositionsString = "Không có thông tin ghế";

            try
            {
                // Lấy connection string từ DbContext
                string connectionString = _context.Database.GetDbConnection().ConnectionString;

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();

                    // Truy vấn SQL để lấy thông tin ghế
                    string query = @"
                SELECT t.Ticket_ID, t.Seat_ID, s.Layout_ID, sl.Row_Label, sl.Column_Number
                FROM Tickets t
                JOIN Seats s ON t.Seat_ID = s.Seat_ID
                JOIN Seat_Layout sl ON s.Layout_ID = sl.Layout_ID
                WHERE t.Booking_ID = @BookingId";

                    using (SqlCommand command = new SqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@BookingId", bookingId);

                        List<string> seatCodes = new List<string>();

                        using (SqlDataReader reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                // Đọc thông tin từ kết quả truy vấn
                                int ticketId = reader.GetInt32(0); // Ticket_ID
                                int seatId = reader.GetInt32(1);   // Seat_ID
                                int layoutId = reader.GetInt32(2); // Layout_ID
                                string rowLabel = reader.GetString(3); // Row_Label
                                int columnNumber = reader.GetInt32(4); // Column_Number

                                // Log thông tin để kiểm tra
                                _logger.LogInformation($"Found seat: Ticket={ticketId}, SeatID={seatId}, Layout={layoutId}, Row={rowLabel}, Column={columnNumber}");

                                // Tạo mã ghế (ví dụ: "A4")
                                string seatCode = rowLabel + columnNumber.ToString();
                                seatCodes.Add(seatCode);
                            }
                        }

                        // Nếu có thông tin ghế, tạo chuỗi phân cách bằng dấu phẩy
                        if (seatCodes.Any())
                        {
                            seatPositionsString = string.Join(", ", seatCodes);
                            _logger.LogInformation($"Final seat positions: {seatPositionsString}");
                        }
                        else
                        {
                            _logger.LogWarning($"No seat information found for booking {bookingId}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving seat information for booking {bookingId}");
                // Giữ giá trị mặc định nếu có lỗi
            }

            // Tạo DTO với thông tin đã lấy được
            var result = new BookingDetailDto
            {
                Booking_ID = booking.Booking_ID,
                MovieName = booking.Showtime.Movie.Movie_Name,
                RoomName = booking.Showtime.CinemaRoom.Room_Name,
                Show_Date = booking.Showtime.Show_Date,
                Start_Time = booking.Showtime.Start_Time,
                Total_Amount = booking.Total_Amount,
                Status = booking.Status,
                Payment_Deadline = booking.Payment_Deadline,
                Seats = seatPositionsString, // Gán thông tin ghế đã lấy được
                Payment_Method = booking.Payments?.OrderByDescending(p => p.Transaction_Date)
                    .FirstOrDefault()?.Payment_Method,
                Transaction_Date = booking.Payments?.OrderByDescending(p => p.Transaction_Date)
                    .FirstOrDefault()?.Transaction_Date ?? DateTime.MinValue,
                Booking_Date = booking.Booking_Date,
                Cancellation_Date = DateTime.MinValue,
                User_ID = booking.User_ID,
                Showtime = new ShowtimeDetailDTO
                {
                    Showtime_ID = booking.Showtime.Showtime_ID,
                    Show_Date = booking.Showtime.Show_Date,
                    Start_Time = booking.Showtime.Start_Time,
                    Room = new RoomDTO
                    {
                        Cinema_Room_ID = booking.Showtime.CinemaRoom.Cinema_Room_ID,
                        Room_Name = booking.Showtime.CinemaRoom.Room_Name,
                        Room_Type = booking.Showtime.CinemaRoom.Room_Type
                    },
                    Movie = new MovieInfoDTO
                    {
                        Movie_ID = booking.Showtime.Movie.Movie_ID,
                        Movie_Name = booking.Showtime.Movie.Movie_Name,
                        Duration = booking.Showtime.Movie.Duration,
                        Rating = booking.Showtime.Movie.Rating,
                        Poster_URL = booking.Showtime.Movie.Poster_URL
                    }
                },
                Tickets = booking.Tickets.Select(t => new TicketDTO
                {
                    Ticket_ID = t.Ticket_ID,
                    Ticket_Code = t.Ticket_Code,
                    Seat_ID = t.Seat_ID,
                    Seat_Status = t.Seat?.Seat_Status,
                    Price = t.Final_Price
                }).ToList()
            };

            return result;
        }
    }
}


