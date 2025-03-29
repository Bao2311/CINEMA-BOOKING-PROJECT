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
    }
}

