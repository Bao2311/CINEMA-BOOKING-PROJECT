using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;

namespace STP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScoreHistoryController : ControllerBase
    {
        private readonly PointsService _pointsService;
        private readonly ILogger<ScoreHistoryController> _logger;

        public ScoreHistoryController(PointsService pointsService, ILogger<ScoreHistoryController> logger)
        {
            _pointsService = pointsService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy lịch sử tích và sử dụng điểm của khách hàng
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserScoreHistory(int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest("Mã khách hàng không hợp lệ");
                }

                var pointsInfo = await _pointsService.GetUserPointsAsync(userId);
                var earningsHistory = await _pointsService.GetPointsEarningHistoryAsync(userId);
                var redemptionsHistory = await _pointsService.GetPointsRedemptionHistoryAsync(userId);

                var result = new
                {
                    CurrentPoints = pointsInfo,
                    EarningsHistory = earningsHistory,
                    RedemptionsHistory = redemptionsHistory
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy lịch sử điểm của khách hàng {userId}");
                return StatusCode(500, "Đã xảy ra lỗi khi lấy lịch sử điểm tích lũy.");
            }
        }
    }
}