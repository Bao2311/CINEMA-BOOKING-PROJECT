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
    public class NotificationService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly string[] _allowedStatuses = { "Confirmed", "Cancelled", "Points Earned", "Points Refunded", "Reminder Sent" };

        public NotificationService(
            CinemaDbContext context,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách thông báo của người dùng (chỉ lấy các loại thông báo được phép)
        /// </summary>
        public async Task<NotificationListResponseDto> GetUserNotificationsAsync(int userId, int skip = 0, int take = 10)
        {
            try
            {
                // Chỉ truy vấn những booking history có status nằm trong danh sách cho phép
                var bookingHistories = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.Movie)
                    .Where(bh => bh.TicketBooking.User_ID == userId &&
                                _allowedStatuses.Contains(bh.Status)) // Chỉ lấy các status được phép
                    .OrderByDescending(bh => bh.Date)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                // Chuyển đổi sang đối tượng thông báo
                var notificationDtos = new List<NotificationDto>();

                foreach (var bh in bookingHistories)
                {
                    var title = GetTitleFromStatus(bh.Status);
                    if (title == null) continue; // Bỏ qua các status không được phép

                    notificationDtos.Add(new NotificationDto
                    {
                        Notification_ID = bh.Booking_History_ID,
                        Title = title,
                        Content = GetContentFromBookingHistory(bh),
                        Creation_Date = bh.Date,
                        Is_Read = bh.IsRead, // Sử dụng trực tiếp từ model
                        Read_Date = bh.IsRead ? bh.Date : null, // Có thể thêm trường ngày đọc nếu cần
                        Type = MapBookingHistoryStatusToType(bh.Status),
                        Related_ID = bh.Booking_ID
                    });
                }

                // Đếm số lượng thông báo chưa đọc (dựa trên IsRead)
                var unreadCount = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                    .Where(bh => bh.TicketBooking.User_ID == userId &&
                           bh.Date > DateTime.Now.AddDays(-7) &&
                           _allowedStatuses.Contains(bh.Status) &&
                           !bh.IsRead) // Kiểm tra chưa đọc
                    .CountAsync();

                return new NotificationListResponseDto
                {
                    Success = true,
                    TotalCount = notificationDtos.Count,
                    UnreadCount = unreadCount,
                    Notifications = notificationDtos
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting notifications for user {userId}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Đánh dấu tất cả thông báo là đã đọc
        /// </summary>
        public async Task<int> MarkAllNotificationsAsReadAsync(int userId)
        {
            try
            {
                // Tìm tất cả thông báo chưa đọc trong 7 ngày gần đây
                var unreadNotifications = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                    .Where(bh => bh.TicketBooking.User_ID == userId &&
                           bh.Date > DateTime.Now.AddDays(-7) &&
                           _allowedStatuses.Contains(bh.Status) &&
                           !bh.IsRead)
                    .ToListAsync();

                // Đánh dấu tất cả là đã đọc
                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                }

                await _context.SaveChangesAsync();

                return unreadNotifications.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking all notifications as read for user {userId}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Đánh dấu một thông báo cụ thể là đã đọc
        /// </summary>
        public async Task<bool> MarkNotificationAsReadAsync(int userId, int notificationId)
        {
            try
            {
                // Tìm thông báo cụ thể
                var notification = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                    .FirstOrDefaultAsync(bh =>
                        bh.Booking_History_ID == notificationId &&
                        bh.TicketBooking.User_ID == userId &&
                        _allowedStatuses.Contains(bh.Status));

                if (notification == null)
                {
                    _logger.LogWarning($"Notification {notificationId} not found for user {userId}");
                    return false;
                }

                // Đánh dấu đã đọc
                notification.IsRead = true;
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking notification {notificationId} as read for user {userId}: {ex.Message}");
                throw;
            }
        }

        #region Helper Methods

        // Hàm helper để chuyển đổi Status thành Title thông báo
        private string GetTitleFromStatus(string status)
        {
            switch (status)
            {
                case "Confirmed":
                    return "Đặt vé thành công";
                case "Cancelled":
                    return "Đặt vé đã bị hủy";
                case "Points Earned":
                    return "Tích lũy điểm thành công";
                case "Points Refunded":
                    return "Hoàn điểm thành công";
                case "Reminder Sent":
                    return "Phim sắp chiếu";
                default:
                    return null; // Trả về null với các status không cần hiển thị
            }
        }

        // Hàm helper để tạo nội dung thông báo từ BookingHistory
        private string GetContentFromBookingHistory(BookingHistory bh)
        {
            try
            {
                if (bh?.TicketBooking?.Showtime?.Movie == null)
                {
                    return "Thông tin đặt vé đã được cập nhật";
                }

                string movieName = bh.TicketBooking.Showtime.Movie.Movie_Name ?? "Không xác định";
                string showDate = bh.TicketBooking.Showtime.Show_Date.ToString("dd/MM/yyyy") ?? "";
                string showTime = bh.TicketBooking.Showtime.Start_Time.ToString(@"hh\:mm") ?? "";

                switch (bh.Status)
                {
                    case "Confirmed":
                        return $"Bạn đã đặt vé xem phim {movieName} thành công. Suất chiếu: {showDate} {showTime}";
                    case "Cancelled":
                        return $"Đơn đặt vé xem phim {movieName} đã bị hủy. Suất chiếu: {showDate} {showTime}";
                    case "Points Earned":
                        return $"Bạn đã tích lũy điểm từ đơn đặt vé phim {movieName}. Kiểm tra tài khoản của bạn.";
                    case "Points Refunded":
                        return $"Bạn đã được hoàn điểm từ đơn đặt vé phim {movieName}. Kiểm tra tài khoản của bạn.";
                    case "Reminder Sent":
                        return $"Phim {movieName} sẽ bắt đầu trong 15 phút. Vui lòng đến rạp sớm để check-in.";
                    default:
                        return "Thông tin đơn đặt vé đã được cập nhật";
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error creating notification content for history ID {bh?.Booking_History_ID}: {ex.Message}");
                return "Thông tin đơn đặt vé đã được cập nhật";
            }
        }

        // Hàm helper để map BookingHistory Status sang Type thông báo
        private string MapBookingHistoryStatusToType(string status)
        {
            switch (status)
            {
                case "Confirmed":
                    return "BookingSuccess";
                case "Cancelled":
                    return "BookingCancel";
                case "Points Earned":
                    return "PointsEarned";
                case "Points Refunded":
                    return "PointsRefund";
                case "Reminder Sent":
                    return "UpcomingScreening";
                default:
                    return "StatusUpdate";
            }
        }

        #endregion
    }
}