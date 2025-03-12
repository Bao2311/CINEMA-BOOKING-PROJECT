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
    [ApiController]
    [Route("api/[controller]")]
    public class ShowtimesController : ControllerBase
    {
        private readonly ShowtimeService _showtimeService;
        private readonly ILogger<ShowtimesController> _logger;

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
                var showtimes = await _showtimeService.GetAllShowtimesAsync();
                return Ok(showtimes);
            }
            catch (Exception ex)
            {
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
                var showtime = await _showtimeService.GetShowtimeByIdAsync(id);

                if (showtime == null)
                    return NotFound($"Không tìm thấy lịch chiếu ID: {id}");

                return Ok(showtime);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy lịch chiếu ID: {id}");
                return StatusCode(500, "Lỗi hệ thống");
            }
        }

        /// <summary>
        /// Tạo lịch chiếu mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<int>> CreateShowtime([FromBody] ShowtimeCreateDto showtimeDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var id = await _showtimeService.CreateShowtimeAsync(showtimeDto, userId);

                return CreatedAtAction(nameof(GetShowtime), new { id }, id);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Lỗi nghiệp vụ khi tạo lịch chiếu");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo lịch chiếu");
                return StatusCode(500, "Lỗi hệ thống");
            }
        }


    }
}
