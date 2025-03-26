using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShowtimesController : ControllerBase
    {
        private readonly ShowtimeService _showtimeService;
        private readonly ILogger<ShowtimesController> _logger;

        public ShowtimesController(ShowtimeService showtimeService, ILogger<ShowtimesController> logger)
        {
            _showtimeService = showtimeService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetShowtimes(
            [FromQuery] DateTime? date = null,
            [FromQuery] int? movieId = null,
            [FromQuery] int? roomId = null)
        {
            try
            {
                var result = await _showtimeService.GetShowtimesAsync(date, movieId, roomId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting showtimes");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách suất chiếu" });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShowtime(int id)
        {
            try
            {
                var showtime = await _showtimeService.GetShowtimeAsync(id);
                return Ok(showtime);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtime {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin suất chiếu" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CreateShowtime([FromBody] ShowtimeCreateDto model)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId <= 0)
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                var showtime = await _showtimeService.CreateShowtimeAsync(model, userId);
                return CreatedAtAction(nameof(GetShowtime), new { id = showtime.Showtime_ID }, showtime);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating showtime");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo suất chiếu mới" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateShowtime(int id, [FromBody] ShowtimeUpdateDto model)
        {
            try
            {
                var showtime = await _showtimeService.UpdateShowtimeAsync(id, model);
                return Ok(showtime);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating showtime {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật suất chiếu" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CancelShowtime(int id)
        {
            try
            {
                var result = await _showtimeService.CancelShowtimeAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling showtime {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi hủy suất chiếu" });
            }
        }

        [HttpGet("movie/{movieId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShowtimesByMovie(int movieId)
        {
            try
            {
                var result = await _showtimeService.GetShowtimesByMovieAsync(movieId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtimes for movie {movieId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy lịch chiếu" });
            }
        }

        [HttpGet("room/{roomId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetShowtimesByRoom(int roomId, [FromQuery] DateTime? date = null)
        {
            try
            {
                var result = await _showtimeService.GetShowtimesByRoomAsync(roomId, date);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtimes for room {roomId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy lịch chiếu" });
            }
        }

        [HttpGet("movie/{movieId}/dates")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShowtimeDates(int movieId)
        {
            try
            {
                var dates = await _showtimeService.GetShowtimeDatesAsync(movieId);
                return Ok(dates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtime dates for movie ID: {movieId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách ngày chiếu" });
            }
        }

        [HttpGet("movie/{movieId}/date/{date}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShowtimesByDate(int movieId, DateTime date)
        {
            try
            {
                var showtimes = await _showtimeService.GetShowtimesByDateAsync(movieId, date);
                return Ok(showtimes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtimes for movie ID: {movieId}, date: {date}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách suất chiếu" });
            }
        }

        [HttpPost("search")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShowtimesByRequest([FromBody] ShowtimeRequestDTO request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { message = "Yêu cầu không hợp lệ" });

                var showtimes = await _showtimeService.GetShowtimesByRequestAsync(request);
                return Ok(showtimes);
            }
            catch (ArgumentNullException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching showtimes");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tìm kiếm suất chiếu" });
            }
        }

        [HttpGet("rooms")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRooms()
        {
            try
            {
                var rooms = await _showtimeService.GetRoomsAsync();
                return Ok(rooms);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cinema rooms");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách phòng chiếu" });
            }
        }

        [HttpGet("room/{roomId}/date/{date}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetShowtimesByRoomAndDate(int roomId, DateTime date)
        {
            try
            {
                var showtimes = await _showtimeService.GetShowtimesByRoomAndDateAsync(roomId, date);
                return Ok(showtimes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtimes for room ID: {roomId}, date: {date}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách suất chiếu" });
            }
        }

        [HttpGet("admin/movie/{movieId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetShowtimesByMovieForAdmin(int movieId)
        {
            try
            {
                var showtimes = await _showtimeService.GetShowtimesByMovieForAdminAsync(movieId);
                return Ok(showtimes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtimes for movie ID: {movieId} (admin)");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách suất chiếu" });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("nameid")?.Value ??
                User.FindFirst("UserId")?.Value ??
                User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return -1;

            return userId;
        }
    }
}