using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Models;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace STP.Repository.Services
{
    /// <summary>
    /// Dịch vụ nền gửi email nhắc nhở trước khi phim bắt đầu 15 phút kèm vé
    /// </summary>
    public class BookingReminderService : BackgroundService
    {
        private readonly ILogger<BookingReminderService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public BookingReminderService(
            ILogger<BookingReminderService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("BookingReminderService đã bắt đầu.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SendReminderEmails();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong vòng lặp gửi email nhắc nhở");
                }

                // Kiểm tra mỗi 1 phút
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("BookingReminderService đã dừng.");
        }

        private async Task SendReminderEmails()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
                var ticketService = scope.ServiceProvider.GetRequiredService<TicketService>();

                var now = DateTime.Now;
                var reminderTime = now.AddMinutes(15); // 15 phút tới

                _logger.LogInformation($"Đang kiểm tra các suất chiếu sắp bắt đầu tại {now} (suất chiếu ~{reminderTime})");

                try
                {
                    // Lấy tất cả đơn hàng đã xác nhận có suất chiếu trong 15 phút tới
                    // và chưa được gửi email nhắc nhở
                    var bookingsToRemind = await dbContext.TicketBookings
                        .Include(b => b.User)
                        .Include(b => b.Showtime)
                            .ThenInclude(s => s.Movie)
                        .Include(b => b.Showtime)
                            .ThenInclude(s => s.CinemaRoom)
                        .Include(b => b.BookingHistories)
                        .Where(b =>
                            b.Status == "Confirmed" &&
                            b.User != null &&
                            b.User.Email != null &&
                            b.Showtime.Show_Date.Date == now.Date &&
                            b.Showtime.Start_Time > now.TimeOfDay &&
                            b.Showtime.Start_Time <= reminderTime.TimeOfDay &&
                            !b.BookingHistories.Any(h => h.Status == "Reminder Sent"))
                        .ToListAsync();

                    _logger.LogInformation($"Tìm thấy {bookingsToRemind.Count} booking cần gửi email nhắc nhở");

                    // Xử lý từng đơn hàng
                    foreach (var booking in bookingsToRemind)
                    {
                        await SendReminderEmail(booking, dbContext, emailService, ticketService);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi truy vấn và xử lý email nhắc nhở");
                }
            }
        }

        private async Task SendReminderEmail(
            TicketBooking booking,
            CinemaDbContext dbContext,
            EmailService emailService,
            TicketService ticketService)
        {
            if (booking.User == null || string.IsNullOrEmpty(booking.User.Email))
            {
                _logger.LogWarning($"Booking {booking.Booking_ID} không có thông tin email người dùng");
                return;
            }

            try
            {
                _logger.LogInformation($"Đang gửi email nhắc nhở cho booking {booking.Booking_ID} đến {booking.User.Email}");

                // Lấy thông tin vé
                var tickets = await dbContext.Tickets
                    .Include(t => t.Seat)
                        .ThenInclude(s => s.SeatLayout)
                    .Where(t => t.Booking_ID == booking.Booking_ID && t.Status != "Cancelled")
                    .ToListAsync();

                if (!tickets.Any())
                {
                    _logger.LogWarning($"Không tìm thấy vé hợp lệ cho booking {booking.Booking_ID}");
                    return;
                }

                string startTimeStr = booking.Showtime.Start_Time.ToString(@"HH\:mm");
                string movieName = booking.Showtime.Movie.Movie_Name;
                string cinemaRoom = booking.Showtime.CinemaRoom.Room_Name;
                string seats = string.Join(", ", tickets.Select(t =>
                    $"{t.Seat.SeatLayout.Row_Label}{t.Seat.SeatLayout.Column_Number}"));

                // Tạo các file PDF cho vé sử dụng template
                List<(string ticketCode, byte[] pdfContent)> pdfTickets = new List<(string, byte[])>();
                foreach (var ticket in tickets)
                {
                    try
                    {
                        byte[] pdfContent = await ticketService.GenerateTicketFromTemplateAsync(ticket.Ticket_ID);
                        if (pdfContent != null && pdfContent.Length > 0)
                        {
                            pdfTickets.Add((ticket.Ticket_Code, pdfContent));
                            _logger.LogInformation($"PDF vé được tạo thành công cho vé {ticket.Ticket_Code}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi tạo PDF cho vé {ticket.Ticket_ID}: {ex.Message}");
                    }
                }

                // Chuẩn bị thông tin booking để gửi email
                Dictionary<string, string> bookingInfo = new Dictionary<string, string>()
        {
            { "BookingId", booking.Booking_ID.ToString() },
            { "MovieName", movieName },
            { "CinemaRoom", cinemaRoom },
            { "ShowDate", booking.Showtime.Show_Date.ToString("dd/MM/yyyy") },
            { "ShowTime", startTimeStr },
            { "Seats", seats }
        };

                // Gửi email nhắc nhở với vé đính kèm
                bool emailSent = await emailService.SendReminderEmailAsync(
                    booking.User.Email,
                    booking.User.Full_Name,
                    bookingInfo,
                    pdfTickets,
                    15); // Nhắc nhở trước 15 phút

                if (emailSent)
                {
                    // Lưu lịch sử gửi email
                    var bookingHistory = new BookingHistory
                    {
                        Booking_ID = booking.Booking_ID,
                        Status = "Reminder Sent",
                        Date = DateTime.Now,
                        Notes = $"Đã gửi email nhắc nhở trước suất chiếu 15 phút kèm {pdfTickets.Count} vé"
                    };

                    dbContext.BookingHistories.Add(bookingHistory);
                    await dbContext.SaveChangesAsync();

                    _logger.LogInformation($"Đã gửi email nhắc nhở thành công cho booking {booking.Booking_ID} kèm {pdfTickets.Count} vé");
                }
                else
                {
                    _logger.LogWarning($"Không thể gửi email nhắc nhở cho booking {booking.Booking_ID}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi gửi email nhắc nhở cho booking {booking.Booking_ID}: {ex.Message}");
            }
        }
    }
}