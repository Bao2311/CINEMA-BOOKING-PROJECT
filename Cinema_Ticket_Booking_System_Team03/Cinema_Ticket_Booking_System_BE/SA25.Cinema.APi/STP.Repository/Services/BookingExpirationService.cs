using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace STP.Repository.Services
{
    public class BookingExpirationService : BackgroundService
    {
        private readonly ILogger<BookingExpirationService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public BookingExpirationService(
            ILogger<BookingExpirationService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Booking Expiration Service is running.");

            // Chạy kiểm tra mỗi 1 phút
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Checking for expired bookings at: {time}", DateTimeOffset.Now);

                await CheckExpiredBookings();

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task CheckExpiredBookings()
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

                    // Lấy tất cả các đơn đặt vé đang ở trạng thái "Pending" và đã quá hạn thanh toán
                    var now = DateTime.Now;
                    var expiredBookings = await dbContext.TicketBookings
                        .Where(b => b.Status == "Pending" && b.Payment_Deadline < now)
                        .ToListAsync();

                    _logger.LogInformation($"Found {expiredBookings.Count} expired bookings");

                    foreach (var booking in expiredBookings)
                    {
                        try
                        {
                            _logger.LogInformation($"Auto-cancelling expired booking ID: {booking.Booking_ID}");

                            // Cập nhật trạng thái đơn đặt vé
                            booking.Status = "Cancelled";

                            // Cập nhật trạng thái ghế và xóa liên kết với Booking_ID
                            var seats = await dbContext.Seats
                                .Where(s => s.Booking_ID == booking.Booking_ID)
                                .ToListAsync();

                            foreach (var seat in seats)
                            {
                                seat.Seat_Status = "Available";
                                seat.Last_Updated = DateTime.Now;
                                seat.Booking_ID = null; // Xóa liên kết với Booking_ID
                            }

                            // Thêm lịch sử hủy đơn
                            var bookingHistory = new BookingHistory
                            {
                                Booking_ID = booking.Booking_ID,
                                Status = "Cancelled",
                                Date = DateTime.Now,
                            };

                            dbContext.BookingHistories.Add(bookingHistory);
                            await dbContext.SaveChangesAsync();

                            _logger.LogInformation($"Successfully auto-cancelled booking ID: {booking.Booking_ID}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error auto-cancelling booking ID: {booking.Booking_ID}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking for expired bookings");
            }
        }
    }
}
