using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PointsController : ControllerBase
    {
        private readonly PointsService _pointsService;
        private readonly ILogger<PointsController> _logger;

        public PointsController(PointsService pointsService, ILogger<PointsController> logger)
        {
            _pointsService = pointsService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy thông tin điểm hiện tại của người dùng đăng nhập
        /// </summary>
        [HttpGet("my-points")]
        public async Task<IActionResult> GetMyPoints()
        {
            try
            {
                // Lấy thông tin người dùng từ token
                var userId = GetUserIdFromToken();
                if (userId == 0)
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var userPoints = await _pointsService.GetUserPointsAsync(userId);
                return Ok(userPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin điểm của người dùng");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin điểm" });
            }
        }

        /// <summary>
        /// Lấy lịch sử tích điểm của người dùng đăng nhập
        /// </summary>
        [HttpGet("earning-history")]
        public async Task<IActionResult> GetEarningHistory()
        {
            try
            {
                // Lấy thông tin người dùng từ token
                var userId = GetUserIdFromToken();
                if (userId == 0)
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var history = await _pointsService.GetPointsEarningHistoryAsync(userId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy lịch sử tích điểm");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy lịch sử tích điểm" });
            }
        }

        /// <summary>
        /// Lấy lịch sử sử dụng điểm của người dùng đăng nhập
        /// </summary>
        [HttpGet("redemption-history")]
        public async Task<IActionResult> GetRedemptionHistory()
        {
            try
            {
                // Lấy thông tin người dùng từ token
                var userId = GetUserIdFromToken();
                if (userId == 0)
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var history = await _pointsService.GetPointsRedemptionHistoryAsync(userId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy lịch sử sử dụng điểm");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy lịch sử sử dụng điểm" });
            }
        }

        /// <summary>
        /// API cho Admin: Lấy thông tin điểm của một người dùng cụ thể
        /// </summary>
        [HttpGet("users/{userId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUserPoints(int userId)
        {
            try
            {
                var userPoints = await _pointsService.GetUserPointsAsync(userId);
                return Ok(userPoints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin điểm của người dùng {userId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin điểm" });
            }
        }

        /// <summary>
        /// API cho Admin: Lấy lịch sử tích điểm của một người dùng cụ thể
        /// </summary>
        [HttpGet("users/{userId}/earning-history")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUserEarningHistory(int userId)
        {
            try
            {
                var history = await _pointsService.GetPointsEarningHistoryAsync(userId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy lịch sử tích điểm của người dùng {userId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy lịch sử tích điểm" });
            }
        }

        /// <summary>
        /// API cho Admin: Lấy lịch sử sử dụng điểm của một người dùng cụ thể
        /// </summary>
        [HttpGet("users/{userId}/redemption-history")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUserRedemptionHistory(int userId)
        {
            try
            {
                var history = await _pointsService.GetPointsRedemptionHistoryAsync(userId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy lịch sử sử dụng điểm của người dùng {userId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy lịch sử sử dụng điểm" });
            }
        }

        /// <summary>
        /// Helper để lấy userId từ token
        /// </summary>
        private int GetUserIdFromToken()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("nameid")?.Value ??
                User.FindFirst("UserId")?.Value ??
                User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return 0;
            }

            if (int.TryParse(userId, out int userIdInt))
            {
                return userIdInt;
            }

            return 0;
        }

        /// <summary>
        /// Áp dụng điểm giảm giá cho booking
        /// </summary>
        [HttpPost("booking/{bookingId}/apply-discount")]
        public async Task<ActionResult<BookingResponseDTO>> ApplyPointsDiscount(
            int bookingId,
            [FromBody] int pointsToUse)
        {
            try
            {
                // Lấy ID người dùng hiện tại từ token (nhân viên hoặc khách hàng)
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                // Xác định vai trò của người dùng
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isStaff = userRole == "Staff" || userRole == "Admin";

                // Lấy thông tin booking trước khi áp dụng điểm
                // (Lưu ý: Việc này đã được cập nhật trong PointsService.ApplyPointsDiscount)

                _logger.LogInformation($"Applying points discount to booking {bookingId}, requested by user {currentUserId}, role: {userRole}");

                // Gọi service với userId hiện tại
                // PointsService đã được cập nhật để sử dụng đúng ID của khách hàng được liên kết với booking
                var bookingResponse = await _pointsService.ApplyPointsDiscount(
                    bookingId,
                    currentUserId, // Truyền ID người dùng hiện tại. PointsService sẽ xác định đúng ID để sử dụng
                    pointsToUse
                );

                return Ok(bookingResponse);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning($"Unauthorized access attempting to apply points to booking {bookingId}: {ex.Message}");
                return Forbid();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning($"Booking not found: {ex.Message}");
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Invalid operation when applying points: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error applying points discount to booking {bookingId}");
                return StatusCode(500, new { message = "Lỗi khi áp dụng điểm giảm giá", error = ex.Message });
            }
        }
    }
}


