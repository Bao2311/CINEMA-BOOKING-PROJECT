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
    [Authorize(Roles = "Admin,Staff")]
    public class SeatTypeController : ControllerBase
    {
        private readonly SeatTypeService _seatTypeService;
        private readonly ILogger<SeatTypeController> _logger;

        public SeatTypeController(SeatTypeService seatTypeService, ILogger<SeatTypeController> logger)
        {
            _seatTypeService = seatTypeService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSeatTypes()
        {
            try
            {
                var result = await _seatTypeService.GetAllSeatTypesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting seat types");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách loại ghế" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSeatType(int id)
        {
            try
            {
                var result = await _seatTypeService.GetSeatTypeAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting seat type {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin loại ghế" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateSeatType([FromBody] SeatTypeCreateDto model)
        {
            try
            {
                if (model == null)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ" });

                var result = await _seatTypeService.CreateSeatTypeAsync(model);
                return CreatedAtAction(nameof(GetSeatType), new { id = result.Price_ID }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating seat type");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo loại ghế mới" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSeatType(int id, [FromBody] SeatTypeUpdateDto model)
        {
            try
            {
                if (model == null)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ" });

                var result = await _seatTypeService.UpdateSeatTypeAsync(id, model);
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
                _logger.LogError(ex, $"Error updating seat type {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật loại ghế" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeatType(int id)
        {
            try
            {
                var result = await _seatTypeService.DeleteSeatTypeAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting seat type {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa loại ghế" });
            }
        }

        [HttpPut("bulk-update")]
        public async Task<IActionResult> BulkUpdatePrices([FromBody] BulkPriceUpdateDto model)
        {
            try
            {
                if (model == null || model.PriceUpdates == null || !model.PriceUpdates.Any())
                    return BadRequest(new { message = "Dữ liệu không hợp lệ" });

                var result = await _seatTypeService.BulkUpdatePricesAsync(model);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk updating prices");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật hàng loạt giá vé" });
            }
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableSeatTypes()
        {
            try
            {
                var result = await _seatTypeService.GetAvailableSeatTypesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available seat types");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách loại ghế có sẵn" });
            }
        }
    }
}

