using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;

namespace STP.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize(Roles = "Admin,Staff")]
    public class SeatLayoutController : ControllerBase
    {
        private readonly SeatLayoutService _seatLayoutService;
        private readonly ILogger<SeatLayoutController> _logger;

        public SeatLayoutController(SeatLayoutService seatLayoutService, ILogger<SeatLayoutController> logger)
        {
            _seatLayoutService = seatLayoutService;
            _logger = logger;
        }

        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetSeatLayout(int roomId)
        {
            try
            {
                var result = await _seatLayoutService.GetSeatLayoutAsync(roomId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seat layout for room {roomId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy sơ đồ ghế" });
            }
        }

        [HttpPost("room/{roomId}")]
        public async Task<IActionResult> ConfigureSeatLayout(int roomId, [FromBody] SeatMapConfigurationDto model)
        {
            try
            {
                var result = await _seatLayoutService.ConfigureSeatLayoutAsync(roomId, model);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error configuring seat layout for room {roomId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cấu hình sơ đồ ghế" });
            }
        }

        [HttpPut("seat/{layoutId}")]
        public async Task<IActionResult> UpdateSeatType(int layoutId, [FromBody] UpdateSeatTypeDto model)
        {
            try
            {
                var result = await _seatLayoutService.UpdateSeatTypeAsync(layoutId, model);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating seat type for layout {layoutId}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật loại ghế" });
            }
        }

        [HttpPut("bulk-update")]
        public async Task<IActionResult> BulkUpdateSeatTypes([FromBody] BulkUpdateSeatsDto model)
        {
            try
            {
                if (model == null || model.LayoutIds == null || !model.LayoutIds.Any())
                    return BadRequest(new { message = "Danh sách ghế cần cập nhật không được trống" });

                var result = await _seatLayoutService.BulkUpdateSeatTypesAsync(model);
                if (result.UsedSeats != null && result.UsedSeats.Any())
                    return BadRequest(new { message = result.Message, used_seats = result.UsedSeats });

                return Ok(new
                {
                    updated_count = result.UpdatedCount,
                    seat_type = result.SeatType,
                    is_active = result.IsActive
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk updating seat types");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật hàng loạt loại ghế" });
            }
        }

        [HttpGet("seat-types")]
        public async Task<IActionResult> GetSeatTypes()
        {
            try
            {
                var result = await _seatLayoutService.GetSeatTypesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting seat types");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách loại ghế" });
            }
        }

        [HttpPost("bulk/{roomId}")]
        public async Task<IActionResult> BulkConfigureSeatLayout(int roomId, [FromBody] BulkRowConfigurationDto model)
        {
            try
            {
                var result = await _seatLayoutService.BulkConfigureSeatLayoutAsync(roomId, model);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cấu hình hàng loạt sơ đồ ghế cho phòng {RoomId}", roomId);
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xử lý yêu cầu." });
            }
        }

        /// <summary>
        /// Xóa mềm một hoặc nhiều ghế
        /// </summary>
        [HttpDelete("bulk-delete")]
        public async Task<IActionResult> SoftDeleteSeatLayouts([FromBody] BulkDeleteSeatsDto model)
        {
            try
            {
                if (model == null || model.LayoutIds == null || !model.LayoutIds.Any())
                    return BadRequest(new { message = "Danh sách ghế cần xóa không được trống" });

                var result = await _seatLayoutService.SoftDeleteSeatLayoutsAsync(model);

                // Kiểm tra nếu có ghế đang được sử dụng
                if (result is IDictionary<string, object> dict &&
                    dict.ContainsKey("success") &&
                    dict["success"] is bool success &&
                    !success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa mềm ghế");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa ghế" });
            }
        }

        /// <summary>
        /// Xóa cứng một hoặc nhiều ghế
        /// </summary>
        [HttpDelete("hard-delete")]
        [Authorize(Roles = "Admin,Manager")] // Chỉ admin hoặc manager mới có quyền xóa cứng
        public async Task<IActionResult> HardDeleteSeatLayouts([FromBody] BulkDeleteSeatsDto model)
        {
            try
            {
                if (model == null || model.LayoutIds == null || !model.LayoutIds.Any())
                    return BadRequest(new { message = "Danh sách ghế cần xóa không được trống" });

                var result = await _seatLayoutService.HardDeleteSeatLayoutsAsync(model);
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
                _logger.LogError(ex, "Lỗi khi xóa cứng ghế: {Message}", ex.Message);
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa ghế" });
            }
        }

        [HttpPost("create-room-with-layout")]
        [Authorize(Roles = "Admin,Manager")] // Giới hạn quyền truy cập nếu cần
        public async Task<IActionResult> CreateRoomWithExistingLayout([FromBody] CreateRoomWithLayoutDto model)
        {
            try
            {
                var result = await _seatLayoutService.CreateRoomWithExistingLayoutAsync(model);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo phòng chiếu mới với layout có sẵn");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo phòng chiếu mới" });
            }
        }
    }
}

