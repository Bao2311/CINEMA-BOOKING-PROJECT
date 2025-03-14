using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Security.Claims;
using System.Collections.Generic;
using STP.Service.Services;
using STP.Repository.DTOs;
using STP.Repository.Models;

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
        [Authorize(Roles = "Admin,Manager")] // Chỉ Admin và Manager mới có quyền cập nhật lịch chiếu
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UpdateShowtime(int id, [FromBody] ShowtimeUpdateDto showtimeDto)
        {
            try
            {
                // Kiểm tra tính hợp lệ của dữ liệu đầu vào
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Lấy ID người dùng từ token JWT
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Gọi service để cập nhật lịch chiếu
                var result = await _showtimeService.UpdateShowtimeAsync(id, showtimeDto, userId);

                // Kiểm tra nếu không tìm thấy lịch chiếu
                if (!result)
                    return NotFound($"Không tìm thấy lịch chiếu ID: {id}");

                // Trả về dữ liệu đã cập nhật
                return Ok(showtimeDto);
            }
            catch (InvalidOperationException ex)
            {
                // Xử lý lỗi nghiệp vụ và trả về mã lỗi 400
                _logger.LogWarning(ex, $"Lỗi nghiệp vụ khi cập nhật lịch chiếu ID: {id}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
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
    }
}
