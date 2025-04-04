using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Security.Claims;
using System.Collections.Generic;
using STP.Repository.Dtos;
using STP.Repository.Models;
using STP.Repository.Repositories;
using STP.Repository.Services;
using STP.Service.Services;

namespace STP.API.Controllers
{
    // Định nghĩa controller API và route
    [ApiController]
    [Route("api/[controller]")]

    public class ShowtimesController : ControllerBase
    {
        // Khai báo các service và logger cần thiết
        private readonly ShowtimeService _showtimeService;
        private readonly ILogger<ShowtimesController> _logger;

        // Constructor nhận các dependency thông qua DI
        public ShowtimesController(
            ShowtimeService showtimeService,
            ILogger<ShowtimesController> logger)
        {
            _showtimeService = showtimeService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả lịch chiếu
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<IEnumerable<ShowtimeDto>>> GetShowtimes()
        {
            try
            {
                // Gọi service để lấy tất cả lịch chiếu
                var showtimes = await _showtimeService.GetAllShowtimesAsync();
                return Ok(showtimes);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, "Lỗi khi lấy danh sách lịch chiếu");
                return StatusCode(500, "Lỗi hệ thống");
            }
        }

        /// <summary>
        /// Lấy thông tin lịch chiếu theo ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ShowtimeDto>> GetShowtime(int id)
        {
            try
            {
                // Gọi service để lấy lịch chiếu theo ID
                var showtime = await _showtimeService.GetShowtimeByIdAsync(id);

                // Kiểm tra nếu không tìm thấy lịch chiếu
                if (showtime == null)
                    return NotFound($"Không tìm thấy lịch chiếu ID: {id}");

                return Ok(showtime);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, $"Lỗi khi lấy lịch chiếu ID: {id}");
                return StatusCode(500, "Lỗi hệ thống");
            }
        }

        /// <summary>
        /// Tạo lịch chiếu mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")] // Chỉ Admin và Manager mới có quyền tạo lịch chiếu
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<int>> CreateShowtime([FromBody] ShowtimeCreateDto showtimeDto)
        {
            try
            {
                // Kiểm tra tính hợp lệ của dữ liệu đầu vào
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Lấy ID người dùng từ token JWT
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                // Gọi service để tạo lịch chiếu mới
                var id = await _showtimeService.CreateShowtimeAsync(showtimeDto, userId);

                // Trả về kết quả với mã 201 Created và đường dẫn đến lịch chiếu mới
                return CreatedAtAction(nameof(GetShowtime), new { id }, id);
            }
            catch (InvalidOperationException ex)
            {
                // Xử lý lỗi nghiệp vụ và trả về mã lỗi 400
                _logger.LogWarning(ex, "Lỗi nghiệp vụ khi tạo lịch chiếu");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, "Lỗi khi tạo lịch chiếu");
                return StatusCode(500, "Lỗi hệ thống");
            }
        }



        /// <summary>
        /// Cập nhật thông tin lịch chiếu
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateShowtime(int id, [FromBody] ShowtimeUpdateDto showtimeDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Log để debug
                _logger.LogInformation($"Attempting to update showtime ID: {id} with data: " +
                    $"Movie: {showtimeDto.Movie_ID}, Room: {showtimeDto.Cinema_Room_ID}, " +
                    $"Date: {showtimeDto.Show_Date:yyyy-MM-dd}, Time: {showtimeDto.Start_Time}, " +
                    $"Status: {showtimeDto.Status}");

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var result = await _showtimeService.UpdateShowtimeAsync(id, showtimeDto, userId);

                if (!result)
                    return NotFound($"Không tìm thấy lịch chiếu ID: {id}");

                return Ok(showtimeDto);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, $"Lỗi nghiệp vụ khi cập nhật lịch chiếu ID: {id}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi cập nhật lịch chiếu ID: {id}");
                return StatusCode(500, "Lỗi hệ thống");
            }
        }

        /// <summary>
        /// Ẩn lịch chiếu (thay đổi trạng thái thành Hidden)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // Chỉ Admin mới có quyền ẩn lịch chiếu
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> HideShowtime(int id)
        {
            try
            {
                // Lấy ID người dùng từ token JWT
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                // Gọi service để ẩn lịch chiếu thay vì xóa hoàn toàn
                var result = await _showtimeService.HideShowtimeAsync(id, userId);

                // Kiểm tra nếu không tìm thấy lịch chiếu
                if (!result)
                    return NotFound($"Không tìm thấy lịch chiếu ID: {id}");

                // Trả về thông báo thành công
                return Ok(new { Message = $"Lịch chiếu ID: {id} đã được ẩn thành công" });
            }
            catch (InvalidOperationException ex)
            {
                // Xử lý lỗi nghiệp vụ và trả về mã lỗi 400
                _logger.LogWarning(ex, $"Lỗi nghiệp vụ khi ẩn lịch chiếu ID: {id}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, $"Lỗi khi ẩn lịch chiếu ID: {id}");
                return StatusCode(500, "Lỗi hệ thống");
            }
        }


        [HttpPost("hide-expired")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> HideExpiredShowtimes()
        {
            try
            {
                int hiddenCount = await _showtimeService.AutoHideExpiredShowtimesAsync();
                return Ok(new { hiddenCount, message = $"Đã ẩn {hiddenCount} suất chiếu đã hết hạn" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi ẩn các suất chiếu đã hết hạn thủ công");
                return StatusCode(500, "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.");
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

        [HttpPost("preview")]
        public async Task<IActionResult> PreviewAutoSchedule([FromBody] AutoScheduleRequest request)
        {
            try
            {
                // Giả sử User ID là 1 cho người quản trị
                int userId = 1; // Hoặc lấy từ token xác thực

                var result = await _showtimeService.AutoScheduleShowtimesAsync(request, userId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Dữ liệu đầu vào không hợp lệ");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo lịch chiếu tự động");
                return StatusCode(500, new { error = "Đã xảy ra lỗi khi tạo lịch chiếu tự động" });
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateAutoSchedule([FromBody] AutoScheduleRequest request)
        {
            try
            {
                // Giả sử User ID là 1 cho người quản trị
                int userId = 1; // Hoặc lấy từ token xác thực

                var result = await _showtimeService.SaveAutoScheduledShowtimesAsync(request, userId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Dữ liệu đầu vào không hợp lệ");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo và lưu lịch chiếu tự động");
                return StatusCode(500, new { error = "Đã xảy ra lỗi khi tạo và lưu lịch chiếu tự động" });
            }
        }

        /// <summary>
        /// Ẩn tất cả các xuất chiếu trong một ngày cho một phòng chiếu
        /// </summary>
        /// <param name="roomId">ID phòng chiếu</param>
        /// <param name="date">Ngày cần ẩn xuất chiếu</param>
        /// <returns>Số lượng xuất chiếu đã ẩn</returns>
        [HttpPut("hide-all-showtimes")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> HideAllShowtimesForDate(
            [FromQuery] int roomId,
            [FromQuery] DateTime date)
        {
            try
            {
                // Lấy ID người dùng từ token
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                // Gọi service để ẩn xuất chiếu
                int hiddenCount = await _showtimeService.HideAllShowtimesForDateAsync(roomId, date, userId);

                return Ok(new
                {
                    message = $"Đã ẩn {hiddenCount} xuất chiếu",
                    hiddenCount
                });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Lỗi validate dữ liệu");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi hệ thống khi ẩn xuất chiếu");
                return StatusCode(500, new { message = "Đã có lỗi xảy ra" });
            }
        }
    }
}
