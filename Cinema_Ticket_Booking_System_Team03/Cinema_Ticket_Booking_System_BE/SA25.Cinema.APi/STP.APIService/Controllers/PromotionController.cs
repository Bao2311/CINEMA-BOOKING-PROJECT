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
    public class PromotionController : ControllerBase
    {
        private readonly PromotionService _promotionService;
        private readonly ILogger<PromotionController> _logger;

        public PromotionController(PromotionService promotionService, ILogger<PromotionController> logger)
        {
            _promotionService = promotionService;
            _logger = logger;
        }

        [HttpGet]
        //[Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllPromotions([FromQuery] bool includeInactive = false)
        {
            try
            {
                var promotions = await _promotionService.GetAllPromotionsAsync(includeInactive);
                return Ok(promotions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting promotions");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách khuyến mãi" });
            }
        }

        [HttpGet("{id}")]
        //[Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetPromotion(int id)
        {
            try
            {
                var promotion = await _promotionService.GetPromotionAsync(id);
                return Ok(promotion);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting promotion {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin khuyến mãi" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CreatePromotion([FromBody] PromotionCreateDto model)
        {
            try
            {
                if (model == null)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ" });

                var userId = GetCurrentUserId();
                if (userId <= 0)
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                dynamic promotion = await _promotionService.CreatePromotionAsync(model, userId);
                return Ok(promotion); // Thay đổi ở đây
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating promotion");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo khuyến mãi mới" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdatePromotion(int id, [FromBody] PromotionUpdateDto model)
        {
            try
            {
                if (model == null)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ" });

                var result = await _promotionService.UpdatePromotionAsync(id, model);
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
                _logger.LogError(ex, $"Error updating promotion {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật khuyến mãi" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> DeletePromotion(int id)
        {
            try
            {
                var result = await _promotionService.DeletePromotionAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting promotion {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa khuyến mãi" });
            }
        }

        [HttpGet("validate/{code}")]
        [Authorize]
        public async Task<IActionResult> ValidatePromotionCode(string code, [FromQuery] decimal totalAmount = 0)
        {
            try
            {
                var result = await _promotionService.ValidatePromotionAsync(code, totalAmount);
                return Ok(new
                {
                    valid = result.IsValid,
                    message = result.Message,
                    promotion_id = result.PromotionId,
                    title = result.Title,
                    discount_type = result.DiscountType,
                    discount_value = result.DiscountValue,
                    discount_amount = result.DiscountAmount,
                    final_amount = result.FinalAmount,
                    expires_on = result.ExpiresOn
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating promotion code {code}");
                return StatusCode(500, new { valid = false, message = "Có lỗi xảy ra khi kiểm tra mã khuyến mãi" });
            }
        }

        [HttpPost("apply")]
        [Authorize]
        public async Task<IActionResult> ApplyPromotion([FromBody] ApplyPromotionDto model)
        {
            try
            {
                if (model == null || string.IsNullOrEmpty(model.PromotionCode) || model.BookingId <= 0)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

                var userId = GetCurrentUserId();
                if (userId <= 0)
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                var result = await _promotionService.ApplyPromotionAsync(model.BookingId, model.PromotionCode, userId);
                return Ok(new
                {
                    success = result.Success,
                    message = result.Message,
                    booking_id = result.BookingId,
                    promotion_id = result.PromotionId,
                    promotion_code = result.PromotionCode,
                    discount_amount = result.DiscountAmount,
                    original_total = result.OriginalTotal,
                    new_total = result.NewTotal
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying promotion");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi áp dụng khuyến mãi" });
            }
        }

        [HttpDelete("remove/{bookingId}")]
        [Authorize]
        public async Task<IActionResult> RemovePromotion(int bookingId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId <= 0)
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                var result = await _promotionService.RemovePromotionAsync(bookingId, userId);
                return Ok(new
                {
                    success = result.Success,
                    message = result.Message,
                    booking_id = result.BookingId,
                    new_total = result.NewTotal
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing promotion from booking {bookingId}");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi hủy khuyến mãi" });
            }
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailablePromotions([FromQuery] decimal amount = 0)
        {
            try
            {
                var result = await _promotionService.GetAvailablePromotionsAsync(amount);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available promotions");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách khuyến mãi" });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("nameid")?.Value ??
                User.FindFirst("UserId")?.Value ??
                User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return -1;

            return userId;
        }
    }
}


