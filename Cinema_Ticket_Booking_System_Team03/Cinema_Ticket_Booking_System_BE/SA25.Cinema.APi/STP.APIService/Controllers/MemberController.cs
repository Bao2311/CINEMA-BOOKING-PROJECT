using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STP.Repository.Models;
using STP.Repository.Services;

namespace STP.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MemberController : ControllerBase
    {
        private readonly MemberService _memberService;
        private readonly BookingService _bookingService;
        private readonly ILogger<MemberController> _logger;

        public MemberController(MemberService memberService, BookingService bookingService, ILogger<MemberController> logger)
        {
            _memberService = memberService;
            _bookingService = bookingService;
            _logger = logger;
        }

        /// <summary>
        /// Tìm kiếm thành viên theo số điện thoại
        /// </summary>
        [HttpGet("lookup/phone/{phoneNumber}")]
        public async Task<IActionResult> LookupByPhone(string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                return BadRequest("Số điện thoại không được để trống");

            var member = await _memberService.FindMemberByPhoneAsync(phoneNumber);
            if (member == null)
                return NotFound("Không tìm thấy thành viên với số điện thoại này");

            // Lấy thông tin điểm thưởng của thành viên
            int currentPoints = await _memberService.GetCurrentPointsAsync(member.User_ID);
            bool isVip = await _memberService.IsVipMemberAsync(member.User_ID);

            var result = new
            {
                member.User_ID,
                member.Full_Name,
                member.Email,
                member.Phone_Number,
                CurrentPoints = currentPoints,
                IsVip = isVip,
                MembershipStatus = isVip ? "VIP" : "Regular"
            };

            return Ok(result);
        }

        /// <summary>
        /// Tìm kiếm thành viên theo email
        /// </summary>
        [HttpGet("lookup/email/{email}")]
        public async Task<IActionResult> LookupByEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email không được để trống");

            var member = await _memberService.FindMemberByEmailAsync(email);
            if (member == null)
                return NotFound("Không tìm thấy thành viên với email này");

            // Lấy thông tin điểm thưởng của thành viên
            int currentPoints = await _memberService.GetCurrentPointsAsync(member.User_ID);
            bool isVip = await _memberService.IsVipMemberAsync(member.User_ID);

            var result = new
            {
                member.User_ID,
                member.Full_Name,
                member.Email,
                member.Phone_Number,
                CurrentPoints = currentPoints,
                IsVip = isVip,
                MembershipStatus = isVip ? "VIP" : "Regular"
            };

            return Ok(result);
        }

        /// <summary>
        /// Liên kết booking với thành viên
        /// </summary>
        [HttpPost("link-member")]
        [Authorize(Roles = "Staff,Admin")]
        public async Task<IActionResult> LinkBookingToMember([FromBody] LinkBookingRequestDto request)
        {
            try
            {
                // Lấy ID người dùng hiện tại từ token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                    User.FindFirst("nameid")?.Value ??
                    User.FindFirst("UserId")?.Value ??
                    User.FindFirst("userId")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var result = await _bookingService.LinkBookingToMemberAsync(
                    request.BookingId,
                    request.MemberIdentifier,
                    int.Parse(userId)
                );

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
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
                _logger.LogError(ex, "Lỗi khi liên kết booking với thành viên");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi liên kết booking với thành viên" });
            }
        }

        public class LinkBookingRequestDto
        {
            public int BookingId { get; set; }
            public string MemberIdentifier { get; set; }
        }


        /// <summary>
        /// Áp dụng giảm giá VIP cho đơn đặt vé
        /// </summary>
        [HttpPost("discount/vip")]
        public async Task<IActionResult> ApplyVipDiscount([FromBody] ApplyDiscountRequest request)
        {
            if (request == null || request.UserId <= 0 || request.BookingId <= 0)
                return BadRequest("Dữ liệu không hợp lệ");

            var member = await _memberService.FindMemberByIdAsync(request.UserId);
            if (member == null)
                return NotFound("Không tìm thấy thành viên");

            bool isVip = await _memberService.IsVipMemberAsync(request.UserId);
            if (!isVip)
                return BadRequest("Thành viên không có quyền lợi VIP");

            // Giả lập áp dụng giảm giá VIP (10%)
            var result = new
            {
                BookingId = request.BookingId,
                OriginalAmount = request.OriginalAmount,
                DiscountAmount = request.OriginalAmount * 0.1M,
                FinalAmount = _memberService.ApplyVipDiscount(request.OriginalAmount)
            };

            return Ok(result);
        }

        /// <summary>
        /// Áp dụng điểm thưởng cho đơn đặt vé
        /// </summary>
        [HttpPost("discount/points")]
        public async Task<IActionResult> ApplyPointsDiscount([FromBody] ApplyPointsRequest request)
        {
            if (request == null || request.UserId <= 0 || request.BookingId <= 0 || request.PointsToUse <= 0)
                return BadRequest("Dữ liệu không hợp lệ");

            var member = await _memberService.FindMemberByIdAsync(request.UserId);
            if (member == null)
                return NotFound("Không tìm thấy thành viên");

            int availablePoints = await _memberService.GetCurrentPointsAsync(request.UserId);
            if (request.PointsToUse > availablePoints)
                return BadRequest($"Số điểm không đủ. Hiện có: {availablePoints} điểm");

            // Tính toán giá trị quy đổi của điểm
            decimal discountAmount = _memberService.ConvertPointsToMoney(request.PointsToUse);

            // Đảm bảo giảm giá không vượt quá tổng tiền
            if (discountAmount > request.OriginalAmount)
                discountAmount = request.OriginalAmount;

            // Áp dụng điểm cho đơn đặt vé
            bool success = await _memberService.UsePointsForDiscountAsync(
                request.UserId, request.PointsToUse, request.BookingId);

            if (!success)
                return BadRequest("Không thể áp dụng điểm thưởng, vui lòng thử lại");

            var result = new
            {
                BookingId = request.BookingId,
                OriginalAmount = request.OriginalAmount,
                PointsUsed = request.PointsToUse,
                DiscountAmount = discountAmount,
                FinalAmount = request.OriginalAmount - discountAmount
            };

            return Ok(result);
        }

        /// <summary>
        /// Áp dụng mã khuyến mãi cho đơn đặt vé
        /// </summary>
        [HttpPost("discount/promotion")]
        public async Task<IActionResult> ApplyPromotionDiscount([FromBody] ApplyPromotionRequest request)
        {
            if (request == null || request.UserId <= 0 || request.BookingId <= 0 || request.PromotionId <= 0)
                return BadRequest("Dữ liệu không hợp lệ");

            bool success = await _memberService.ApplyPromotionAsync(
                request.PromotionId, request.BookingId, request.UserId);

            if (!success)
                return BadRequest("Không thể áp dụng mã khuyến mãi, vui lòng kiểm tra lại");

            return Ok(new { Success = true, Message = "Áp dụng mã khuyến mãi thành công" });
        }
    }

    public class ApplyDiscountRequest
    {
        public int UserId { get; set; }
        public int BookingId { get; set; }
        public decimal OriginalAmount { get; set; }
    }

    public class ApplyPointsRequest
    {
        public int UserId { get; set; }
        public int BookingId { get; set; }
        public int PointsToUse { get; set; }
        public decimal OriginalAmount { get; set; }
    }

    public class ApplyPromotionRequest
    {
        public int UserId { get; set; }
        public int BookingId { get; set; }
        public int PromotionId { get; set; }
    }
}

