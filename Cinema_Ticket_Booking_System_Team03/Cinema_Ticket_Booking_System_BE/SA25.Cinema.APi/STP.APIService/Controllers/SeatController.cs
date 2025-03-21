

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STP.APIService.Services;
using STP.Repository.Dtos;
using System;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeatController : ControllerBase
    {
        private readonly SeatService _seatService;
        private readonly ILogger<SeatController> _logger;

        public SeatController(SeatService seatService, ILogger<SeatController> logger)
        {
            _seatService = seatService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy sơ đồ ghế ngồi của một suất chiếu
        /// </summary>
        [HttpGet("showtime/{showtimeId}")]
        [AllowAnonymous]
        public async Task<ActionResult<SeatMapDTO>> GetSeatMap(int showtimeId)
        {
            try
            {
                var seatMap = await _seatService.GetSeatMapAsync(showtimeId);

                if (seatMap == null)
                {
                    return NotFound(new { message = "Không tìm thấy suất chiếu" });
                }

                return Ok(seatMap);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seat map for showtime ID: {showtimeId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy sơ đồ ghế ngồi" });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một ghế
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<SeatDto>> GetSeatDetails(int id)
        {
            try
            {
                var seat = await _seatService.GetSeatDetailsAsync(id);

                if (seat == null)
                {
                    return NotFound(new { message = "Không tìm thấy ghế" });
                }

                return Ok(seat);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seat details for ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin chi tiết ghế" });
            }
        }
    }
}


