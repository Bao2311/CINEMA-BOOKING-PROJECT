using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly ILogger<NotificationController> _logger;
        private readonly NotificationService _notificationService;

        public NotificationController(
            ILogger<NotificationController> logger,
            NotificationService notificationService)
        {
            _logger = logger;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Lấy danh sách thông báo của người dùng
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int skip = 0, [FromQuery] int take = 10)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = await _notificationService.GetUserNotificationsAsync(userId, skip, take);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting notifications: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi khi lấy thông báo" });
            }
        }

        /// <summary>
        /// Đánh dấu tất cả thông báo đã đọc (giả lập)
        /// </summary>
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                int count = await _notificationService.MarkAllNotificationsAsReadAsync(userId);
                return Ok(new { success = true, message = $"Đã đánh dấu {count} thông báo đã đọc" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking all notifications as read: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi khi đánh dấu tất cả thông báo đã đọc" });
            }
        }

        /// <summary>
        /// Đánh dấu một thông báo cụ thể là đã đọc
        /// </summary>
        /// <param name="notificationId">ID của thông báo cần đánh dấu</param>
        [HttpPut("{notificationId}/read")]
        public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                var result = await _notificationService.MarkNotificationAsReadAsync(userId, notificationId);

                if (result)
                {
                    return Ok(new { success = true, message = "Đã đánh dấu thông báo đã đọc" });
                }
                else
                {
                    return NotFound(new { success = false, message = "Không tìm thấy thông báo" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error marking notification {notificationId} as read: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Đã xảy ra lỗi khi đánh dấu thông báo đã đọc" });
            }
        }
    }
}