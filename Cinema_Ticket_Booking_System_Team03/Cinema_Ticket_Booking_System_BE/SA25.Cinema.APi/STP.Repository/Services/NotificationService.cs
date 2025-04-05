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

        public NotificationService(
            CinemaDbContext context,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách thông báo của người dùng dựa trên BookingHistories
        /// </summary>
        public async Task<NotificationListResponseDto> GetUserNotificationsAsync(int userId, int skip = 0, int take = 10)
        {
            try
            {
                // Updated query to exclude records with Status "Pending"
                var bookingHistories = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.Movie)
                    .Where(bh => bh.TicketBooking.User_ID == userId &&
                          bh.Status != null &&
                          bh.Status != "Pending") // Added this condition
                    .OrderByDescending(bh => bh.Date)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                // Chuyển đổi booking histories thành thông báo
                var notificationDtos = bookingHistories.Select(bh => new NotificationDto
                {
                    Notification_ID = bh.Booking_History_ID,
                    Title = GetTitleFromStatus(bh.Status),
                    Content = GetContentFromBookingHistory(bh),
                    Creation_Date = bh.Date,
                    Type = MapBookingHistoryStatusToType(bh.Status),
                    Related_ID = bh.Booking_ID
                }).ToList();

                // Updated query to exclude "Pending" status for unread count
                var recentNotificationsCount = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                    .Where(bh => bh.TicketBooking.User_ID == userId &&
                           bh.Date > DateTime.Now.AddDays(-7) &&
                           bh.Status != null &&
                           bh.Status != "Pending") // Added this condition
                    .CountAsync();

                return new NotificationListResponseDto
                {
                    Success = true,
                    TotalCount = notificationDtos.Count,
                    UnreadCount = recentNotificationsCount,
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
        /// Đánh dấu tất cả thông báo đã đọc (giả lập)
        /// </summary>
        public async Task<int> MarkAllNotificationsAsReadAsync(int userId)
        {
            try
            {
                // Updated query to exclude "Pending" status
                var recentNotificationsCount = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                    .Where(bh => bh.TicketBooking.User_ID == userId &&
                           bh.Date > DateTime.Now.AddDays(-7) &&
                           bh.Status != "Pending") // Added this condition
                    .CountAsync();

                return recentNotificationsCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking all notifications as read for user {userId}: {ex.Message}");
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
                    return $"Cập nhật trạng thái: {status}";
            }
        }

        // Hàm helper để chuyển đổi BookingHistory thành nội dung thông báo
        private string GetContentFromBookingHistory(BookingHistory bh)
        {
            try
            {
                // Kiểm tra null cho tất cả các tham chiếu
                if (bh == null || bh.TicketBooking == null || bh.TicketBooking.Showtime == null)
                {
                    return "Thông tin đặt vé đã được cập nhật";
                }

                string movieName = bh.TicketBooking?.Showtime?.Movie?.Movie_Name ?? "Không xác định";
                string showDate = bh.TicketBooking?.Showtime?.Show_Date.ToString("dd/MM/yyyy") ?? "";
                string showTime = bh.TicketBooking?.Showtime?.Start_Time.ToString(@"hh\:mm") ?? "";

                // Đảm bảo Status không null trước khi sử dụng
                string status = bh.Status ?? "Unknown";

                switch (status)
                {
                    case "Confirmed":
                        return $"Bạn đã đặt vé xem phim {movieName} thành công. Suất chiếu: {showDate} {showTime}";

                    case "Cancelled":
                        return $"Đơn đặt vé xem phim {movieName} đã bị hủy. Suất chiếu: {showDate} {showTime}";

                    case "Points Earned":
                        if (bh.Notes != null && bh.Notes.Contains("thêm"))
                        {
                            // Trích xuất số điểm từ Notes nếu có
                            int points = ExtractPointsFromNotes(bh.Notes);
                            return $"Bạn đã tích lũy thêm {points} điểm từ đơn đặt vé phim {movieName}. Kiểm tra tài khoản của bạn.";
                        }
                        return $"Bạn đã tích lũy điểm từ đơn đặt vé phim {movieName}. Kiểm tra tài khoản của bạn.";

                    case "Points Refunded":
                        if (bh.Notes != null && bh.Notes.Contains("hoàn"))
                        {
                            // Trích xuất số điểm từ Notes nếu có
                            int points = ExtractPointsFromNotes(bh.Notes);
                            return $"Bạn đã được hoàn {points} điểm từ đơn đặt vé phim {movieName}. Kiểm tra tài khoản của bạn.";
                        }
                        return $"Bạn đã được hoàn điểm từ đơn đặt vé phim {movieName}. Kiểm tra tài khoản của bạn.";

                    case "Reminder Sent":
                        return $"Phim {movieName} sẽ bắt đầu trong 15 phút. Vui lòng đến rạp sớm để check-in.";

                    default:
                        return bh.Notes ?? $"Trạng thái đơn đặt vé của bạn đã được cập nhật thành {status}";
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Error creating notification content for history ID {bh?.Booking_History_ID}: {ex.Message}");
                return "Thông tin đơn đặt vé đã được cập nhật";
            }
        }

        // Hàm helper để trích xuất số điểm từ nội dung Notes
        private int ExtractPointsFromNotes(string notes)
        {
            try
            {
                // Tìm số điểm từ notes, ví dụ: "Đã thêm 25 điểm thưởng"
                var parts = notes.Split(' ');
                for (int i = 0; i < parts.Length - 1; i++)
                {
                    if (int.TryParse(parts[i], out int points))
                    {
                        return points;
                    }
                }
                return 0;
            }
            catch
            {
                return 0;
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

        /// <summary>
        /// Đánh dấu một thông báo cụ thể là đã đọc
        /// </summary>
        /// <param name="userId">ID của người dùng</param>
        /// <param name="notificationId">ID của thông báo</param>
        /// <returns>Trả về true nếu đánh dấu thành công, false nếu không tìm thấy</returns>
        public async Task<bool> MarkNotificationAsReadAsync(int userId, int notificationId)
        {
            try
            {
                // Tìm booking history tương ứng với notification ID và user ID
                var bookingHistory = await _context.BookingHistories
                    .Include(bh => bh.TicketBooking)
                    .FirstOrDefaultAsync(bh =>
                        bh.Booking_History_ID == notificationId &&
                        bh.TicketBooking.User_ID == userId);

                // Kiểm tra nếu không tìm thấy booking history
                if (bookingHistory == null)
                {
                    _logger.LogWarning($"Notification {notificationId} not found for user {userId}");
                    return false;
                }

                // Đánh dấu đã đọc (ở đây có thể thêm trường IsRead nếu cần)
                // Ví dụ: bookingHistory.IsRead = true;

                // Lưu thay đổi
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking notification {notificationId} as read for user {userId}: {ex.Message}");
                throw;
            }
        }
    }
}

