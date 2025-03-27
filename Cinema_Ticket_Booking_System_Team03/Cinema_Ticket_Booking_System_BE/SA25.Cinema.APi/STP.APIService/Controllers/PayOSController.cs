using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/payos")]
    [ApiController]
    public class PayOSController : ControllerBase
    {
        private readonly ILogger<PayOSController> _logger;
        private readonly PayOSNugetService _payosService;
        private readonly BookingService _bookingService;

        public PayOSController(
            ILogger<PayOSController> logger,
            PayOSNugetService payosService,
            BookingService bookingService)
        {
            _logger = logger;
            _payosService = payosService;
            _bookingService = bookingService;
        }

        /// <summary>
        /// Tạo thanh toán với PayOS
        /// </summary>
        [HttpPost("create")]
        [Authorize]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto request)
        {
            try
            {
                _logger.LogInformation($"Creating PayOS payment for booking ID: {request.BookingId}");

                // Lấy thông tin người dùng từ token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                    User.FindFirst("nameid")?.Value ??
                    User.FindFirst("UserId")?.Value ??
                    User.FindFirst("userId")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                // Lấy thông tin booking
                var booking = await _bookingService.GetBookingDetail(request.BookingId);
                if (booking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });
                }

                // Kiểm tra quyền của người dùng
                if (booking.User_ID != int.Parse(userId))
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền thanh toán đơn đặt vé này" });
                }

                // Kiểm tra trạng thái đơn đặt vé
                if (booking.Status != "Pending")
                {
                    return BadRequest(new { success = false, message = "Đơn đặt vé không ở trạng thái chờ thanh toán" });
                }

                // Kiểm tra thời hạn thanh toán
                if (DateTime.Now > booking.Payment_Deadline)
                {
                    return BadRequest(new { success = false, message = "Đơn đặt vé đã quá hạn thanh toán" });
                }

                // Tạo mô tả
                string description = $"Thanh toán vé - {booking.Booking_ID}";

                // Lấy thông tin người dùng
                string customerName = User.FindFirst(ClaimTypes.Name)?.Value ?? "";

                // Tạo thanh toán với PayOS
                var paymentResponse = await _payosService.CreatePaymentLink(
                    request.BookingId,
                    booking.Total_Amount,
                    description,
                    customerName);

                if (!paymentResponse.Success)
                {
                    return StatusCode(500, new { success = false, message = paymentResponse.Message });
                }

                // Trả về thông tin thanh toán
                return Ok(new
                {
                    success = true,
                    message = "Tạo thanh toán thành công",
                    paymentUrl = paymentResponse.PaymentUrl,
                    qrCodeUrl = paymentResponse.QrCodeUrl,
                    orderCode = paymentResponse.OrderCode,
                    amount = paymentResponse.Amount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayOS payment");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tạo thanh toán" });
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái thanh toán
        /// </summary>
        [HttpGet("status")]
        [Authorize]
        public async Task<IActionResult> CheckPaymentStatus([FromQuery] string orderCode)
        {
            try
            {
                _logger.LogInformation($"Checking PayOS payment status for order code: {orderCode}");

                if (string.IsNullOrEmpty(orderCode))
                {
                    return BadRequest(new { success = false, message = "OrderCode không được để trống" });
                }

                // Lấy BookingId từ OrderCode (BOOKING_{BookingId}_{Timestamp})
                string[] parts = orderCode.Split('_');
                if (parts.Length < 2 || parts[0] != "BOOKING")
                {
                    return BadRequest(new { success = false, message = "OrderCode không hợp lệ" });
                }

                int bookingId;
                if (!int.TryParse(parts[1], out bookingId))
                {
                    return BadRequest(new { success = false, message = "BookingId không hợp lệ" });
                }

                // Kiểm tra trạng thái thanh toán
                var paymentStatus = await _payosService.CheckPaymentStatus(orderCode);

                if (!paymentStatus.Success)
                {
                    return StatusCode(500, new { success = false, message = paymentStatus.Message });
                }

                // Nếu thanh toán thành công, cập nhật trạng thái đơn đặt vé
                if (paymentStatus.Status == "PAID")
                {
                    // Lấy thông tin người dùng từ token
                    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                        User.FindFirst("nameid")?.Value ??
                        User.FindFirst("UserId")?.Value ??
                        User.FindFirst("userId")?.Value;

                    if (string.IsNullOrEmpty(userId))
                    {
                        return Unauthorized(new { message = "Không thể xác định người dùng" });
                    }

                    try
                    {
                        // Cập nhật trạng thái đơn đặt vé
                        await _bookingService.UpdateBookingPayment(bookingId, int.Parse(userId));
                        _logger.LogInformation($"Updated booking {bookingId} status to Confirmed after PayOS payment");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error updating booking status after payment: {ex.Message}");
                        // Vẫn trả về thông tin thanh toán, nhưng có thông báo không thể cập nhật đơn đặt vé
                        return Ok(new
                        {
                            success = true,
                            payment = new
                            {
                                status = paymentStatus.Status,
                                amount = paymentStatus.Amount,
                                method = paymentStatus.PaymentMethod,
                                transactionTime = paymentStatus.TransactionTime
                            },
                            booking = new
                            {
                                message = "Thanh toán thành công nhưng không thể cập nhật trạng thái đơn đặt vé",
                                error = ex.Message
                            }
                        });
                    }
                }

                // Trả về thông tin trạng thái thanh toán
                return Ok(new
                {
                    success = true,
                    message = "Kiểm tra trạng thái thanh toán thành công",
                    status = paymentStatus.Status,
                    amount = paymentStatus.Amount,
                    paymentMethod = paymentStatus.PaymentMethod,
                    transactionTime = paymentStatus.TransactionTime
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking PayOS payment status");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi kiểm tra trạng thái thanh toán" });
            }
        }

        /// <summary>
        /// Xử lý khi người dùng quay lại từ trang thanh toán
        /// </summary>
        [HttpGet("return")]
        public async Task<IActionResult> PaymentReturn([FromQuery] string orderCode, [FromQuery] string status)
        {
            try
            {
                _logger.LogInformation($"User returned from PayOS payment page. OrderCode: {orderCode}, Status: {status}");

                // Kiểm tra trạng thái thanh toán từ PayOS
                var paymentStatus = await _payosService.CheckPaymentStatus(orderCode);

                // Redirect người dùng đến trang frontend tương ứng
                string redirectUrl = $"/payment/result?orderCode={orderCode}&status={status}";

                if (paymentStatus.Success)
                {
                    redirectUrl += $"&paymentStatus={paymentStatus.Status}";
                }

                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling PayOS return");
                return Redirect("/payment/error");
            }
        }
    }

    // DTO cho yêu cầu tạo thanh toán
    public class CreatePaymentDto
    {
        public int BookingId { get; set; }
    }
}