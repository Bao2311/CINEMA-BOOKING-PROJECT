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
            while (!stoppingToken.IsCancellationRequested)
            {
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
                    var pointsService = scope.ServiceProvider.GetRequiredService<PointsService>();

                    var now = DateTime.Now;
                    var expiredBookings = await dbContext.TicketBookings
                        .Where(b => b.Status == "Pending" && b.Payment_Deadline < now && b.Points_Used > 0)
                        .ToListAsync();

                    foreach (var booking in expiredBookings)
                    {
                        try
                        {
                            // Hoàn trả điểm
                            await pointsService.RefundPointsForExpiredBookingAsync(booking.Booking_ID, booking.User_ID, booking.Points_Used);

                            // Cập nhật trạng thái booking và ghế như cũ
                            booking.Status = "Cancelled";
                            booking.Points_Used = 0; // Đặt lại điểm đã sử dụng

                            var seats = await dbContext.Seats
                                .Where(s => s.Booking_ID == booking.Booking_ID)
                                .ToListAsync();

                            foreach (var seat in seats)
                            {
                                seat.Seat_Status = "Available";
                                seat.Last_Updated = DateTime.Now;
                                seat.Booking_ID = null;
                            }

                            // Thêm lịch sử hủy đơn
                            var bookingHistory = new BookingHistory
                            {
                                Booking_ID = booking.Booking_ID,
                                Status = "Cancelled",
                                Date = DateTime.Now,
                                Notes = "Hủy do quá hạn thanh toán - Hoàn trả điểm"
                            };

                            dbContext.BookingHistories.Add(bookingHistory);
                            await dbContext.SaveChangesAsync();

                            _logger.LogInformation($"Đã hoàn trả {booking.Points_Used} điểm cho booking ID: {booking.Booking_ID}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho booking ID: {booking.Booking_ID}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra và hủy booking hết hạn");
            }
        }
    }
}
