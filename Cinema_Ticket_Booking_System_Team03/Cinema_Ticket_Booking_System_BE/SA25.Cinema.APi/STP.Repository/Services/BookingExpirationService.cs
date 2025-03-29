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
            _logger.LogInformation("BookingExpirationService đã bắt đầu.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckExpiredBookings();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong vòng lặp kiểm tra đơn hàng quá hạn");
                }

                // Kiểm tra mỗi 1 phút
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("BookingExpirationService đã dừng.");
        }

        private async Task CheckExpiredBookings()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
                var pointsService = scope.ServiceProvider.GetRequiredService<PointsService>();

                var now = DateTime.Now;
                _logger.LogInformation($"Đang kiểm tra các booking quá hạn thanh toán tại {now}");

                try
                {
                    // Lấy tất cả đơn hàng quá hạn
                    var expiredBookings = await dbContext.TicketBookings
                        .AsNoTracking() // Chỉ đọc trước để tránh vấn đề tracking
                        .Where(b => b.Status == "Pending" && b.Payment_Deadline < now)
                        .Select(b => new { b.Booking_ID })
                        .ToListAsync();

                    _logger.LogInformation($"Tìm thấy {expiredBookings.Count} booking quá hạn thanh toán");

                    // Xử lý từng đơn hàng
                    foreach (var booking in expiredBookings)
                    {
                        await ProcessExpiredBooking(booking.Booking_ID, dbContext, pointsService);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi truy vấn và xử lý đơn hàng quá hạn");
                }
            }
        }

        private async Task ProcessExpiredBooking(int bookingId, CinemaDbContext dbContext, PointsService pointsService)
        {
            _logger.LogInformation($"Bắt đầu xử lý booking quá hạn ID: {bookingId}");

            // Lấy thông tin chi tiết đơn hàng (sử dụng truy vấn mới)
            var booking = await dbContext.TicketBookings
                .FirstOrDefaultAsync(b => b.Booking_ID == bookingId && b.Status == "Pending");

            if (booking == null)
            {
                _logger.LogWarning($"Không tìm thấy booking {bookingId} hoặc không còn ở trạng thái Pending");
                return;
            }

            _logger.LogInformation($"Xử lý booking {bookingId} - User: {booking.User_ID}, Points: {booking.Points_Used}, Amount: {booking.Total_Amount}");

            using var transaction = await dbContext.Database.BeginTransactionAsync();

            try
            {
                // 1. Hoàn trả điểm nếu có
                if (booking.Points_Used > 0)
                {
                    _logger.LogInformation($"Hoàn trả {booking.Points_Used} điểm cho User {booking.User_ID}");

                    // Lưu số điểm cần hoàn
                    int pointsToRefund = booking.Points_Used;

                    try
                    {
                        // Gọi phương thức hoàn điểm
                        await pointsService.RefundPointsForExpiredBookingAsync(
                            booking.Booking_ID,
                            booking.User_ID,
                            pointsToRefund
                        );

                        // Thêm lịch sử hoàn điểm
                        var pointsRefundHistory = new BookingHistory
                        {
                            Booking_ID = booking.Booking_ID,
                            Status = "Points Refunded",
                            Date = DateTime.Now,
                            Notes = $"Hoàn trả {pointsToRefund} điểm do hết hạn thanh toán"
                        };
                        dbContext.BookingHistories.Add(pointsRefundHistory);

                        // Đặt lại điểm đã sử dụng
                        booking.Points_Used = 0;

                        await dbContext.SaveChangesAsync();
                        _logger.LogInformation($"Đã hoàn trả điểm thành công cho booking {bookingId}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho booking {bookingId}, User ID: {booking.User_ID}");
                        throw; // Re-throw để đảm bảo transaction được rollback
                    }
                }

                // 2. Cập nhật trạng thái booking thành Cancelled
                booking.Status = "Cancelled";

                // 3. Thêm lịch sử hủy đơn
                var bookingHistory = new BookingHistory
                {
                    Booking_ID = booking.Booking_ID,
                    Status = "Cancelled",
                    Date = DateTime.Now,
                    Notes = "Hủy tự động do quá hạn thanh toán"
                };
                dbContext.BookingHistories.Add(bookingHistory);

                // 4. Cập nhật trạng thái ghế
                var seats = await dbContext.Seats
                    .Where(s => s.Booking_ID == bookingId)
                    .ToListAsync();

                foreach (var seat in seats)
                {
                    _logger.LogInformation($"Cập nhật ghế {seat.Seat_ID} thành Available");
                    seat.Seat_Status = "Available";
                    seat.Last_Updated = DateTime.Now;
                    seat.Booking_ID = null;
                }

                // 5. Lưu tất cả thay đổi
                await dbContext.SaveChangesAsync();

                // 6. Commit transaction
                await transaction.CommitAsync();
                _logger.LogInformation($"Đã hủy thành công booking {bookingId}");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Lỗi và đã rollback khi xử lý booking {bookingId}");
            }
        }
    }
}