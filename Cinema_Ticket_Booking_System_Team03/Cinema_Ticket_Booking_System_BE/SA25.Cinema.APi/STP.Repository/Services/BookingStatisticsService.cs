using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class BookingStatisticsService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<BookingStatisticsService> _logger;

        public BookingStatisticsService(CinemaDbContext context, ILogger<BookingStatisticsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy thống kê đặt vé và doanh thu theo khoảng thời gian
        /// </summary>
        public async Task<BookingStatisticsDTO> GetBookingStatisticsAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                if (startDate > endDate)
                {
                    throw new ArgumentException("Ngày bắt đầu phải trước ngày kết thúc");
                }

                // Lấy các booking và bao gồm Tickets và Payments
                var bookings = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Tickets) // Thêm để đếm số lượng vé
                    .Include(b => b.Payments) // Thêm để lấy phương thức thanh toán
                    .Where(b => b.Booking_Date >= startDate && b.Booking_Date <= endDate)
                    .ToListAsync();

                var confirmedBookings = bookings.Where(b => b.Status == "Confirmed").ToList();

                // Tính tổng số vé từ các tickets
                int totalTickets = confirmedBookings.Sum(b => b.Tickets != null ? b.Tickets.Count : 0);

                // Tính trung bình số vé trên mỗi booking
                double avgTickets = confirmedBookings.Any()
                    ? confirmedBookings.Average(b => b.Tickets != null ? b.Tickets.Count : 0)
                    : 0;

                var result = new BookingStatisticsDTO
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    TotalBookings = bookings.Count,
                    ConfirmedBookings = confirmedBookings.Count,
                    CancelledBookings = bookings.Count(b => b.Status == "Cancelled"),
                    TotalRevenue = confirmedBookings.Sum(b => b.Total_Amount),
                    AverageTicketsPerBooking = avgTickets,

                    // Thống kê theo phim
                    MovieStatistics = GetMovieStatistics(confirmedBookings),

                    // Thống kê theo phòng
                    RoomStatistics = GetRoomStatistics(confirmedBookings),

                    // Thống kê theo thời gian
                    DailyStatistics = GetDailyStatistics(confirmedBookings),

                    // Thống kê theo phương thức thanh toán
                    PaymentMethodStatistics = GetPaymentMethodStatistics(confirmedBookings)
                };

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi tạo thống kê đặt vé từ {startDate} đến {endDate}");
                throw;
            }
        }

        private List<MovieStatisticsDTO> GetMovieStatistics(List<TicketBooking> bookings)
        {
            return bookings
                .Where(b => b.Showtime?.Movie != null)
                .GroupBy(b => new { MovieId = b.Showtime.Movie.Movie_ID, MovieName = b.Showtime.Movie.Movie_Name })
                .Select(g => new MovieStatisticsDTO
                {
                    MovieId = g.Key.MovieId,
                    MovieName = g.Key.MovieName,
                    TotalBookings = g.Count(),
                    TotalTickets = g.Sum(b => b.Tickets != null ? b.Tickets.Count : 0),
                    TotalRevenue = g.Sum(b => b.Total_Amount)
                })
                .OrderByDescending(m => m.TotalRevenue)
                .Take(10)
                .ToList();
        }

        private List<RoomStatisticsDTO> GetRoomStatistics(List<TicketBooking> bookings)
        {
            return bookings
                .Where(b => b.Showtime?.CinemaRoom != null)
                .GroupBy(b => new { RoomId = b.Showtime.CinemaRoom.Cinema_Room_ID, RoomName = b.Showtime.CinemaRoom.Room_Name })
                .Select(g => new RoomStatisticsDTO
                {
                    RoomId = g.Key.RoomId,
                    RoomName = g.Key.RoomName,
                    TotalBookings = g.Count(),
                    TotalTickets = g.Sum(b => b.Tickets != null ? b.Tickets.Count : 0),
                    TotalRevenue = g.Sum(b => b.Total_Amount)
                })
                .OrderByDescending(r => r.TotalRevenue)
                .ToList();
        }

        private Dictionary<string, DailyStatisticsDTO> GetDailyStatistics(List<TicketBooking> bookings)
        {
            return bookings
                .GroupBy(b => b.Booking_Date.DayOfWeek.ToString())
                .ToDictionary(
                    g => TranslateDayOfWeek(g.Key), // Chuyển đổi sang tên tiếng Việt
                    g => new DailyStatisticsDTO
                    {
                        Day = TranslateDayOfWeek(g.Key),
                        TotalBookings = g.Count(),
                        TotalTickets = g.Sum(b => b.Tickets != null ? b.Tickets.Count : 0),
                        TotalRevenue = g.Sum(b => b.Total_Amount)
                    }
                );
        }

        private string TranslateDayOfWeek(string englishDay)
        {
            switch (englishDay)
            {
                case "Monday": return "Thứ Hai";
                case "Tuesday": return "Thứ Ba";
                case "Wednesday": return "Thứ Tư";
                case "Thursday": return "Thứ Năm";
                case "Friday": return "Thứ Sáu";
                case "Saturday": return "Thứ Bảy";
                case "Sunday": return "Chủ Nhật";
                default: return englishDay;
            }
        }

        private Dictionary<string, decimal> GetPaymentMethodStatistics(List<TicketBooking> bookings)
        {
            var result = new Dictionary<string, decimal>();

            foreach (var booking in bookings)
            {
                // Lấy phương thức thanh toán từ bảng Payments
                var payment = booking.Payments?.OrderByDescending(p => p.Transaction_Date).FirstOrDefault();
                string paymentMethod = payment?.Payment_Method ?? "Không xác định";

                if (result.ContainsKey(paymentMethod))
                {
                    result[paymentMethod] += booking.Total_Amount;
                }
                else
                {
                    result[paymentMethod] = booking.Total_Amount;
                }
            }

            return result;
        }
    }
}