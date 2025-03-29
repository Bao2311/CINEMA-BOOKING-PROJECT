using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Models;
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
        private readonly CinemaDbContext _context;
        private readonly IConfiguration _configuration;

        public PayOSController(
            ILogger<PayOSController> logger,
            PayOSNugetService payosService,
            BookingService bookingService,
            CinemaDbContext context,
            IConfiguration configuration)
        {
            _logger = logger;
            _payosService = payosService;
            _bookingService = bookingService;
            _context = context;
            _configuration = configuration;
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

                // Lấy bookingId từ orderCode
                int bookingId = _payosService.GetBookingIdFromOrderCode(orderCode);
                if (bookingId == 0)
                {
                    return BadRequest(new { success = false, message = "OrderCode không hợp lệ" });
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
                _logger.LogInformation($"Người dùng quay lại từ PayOS với orderCode: {orderCode}, Status: {status}");

                // Tự lấy bookingId từ orderCode
                int bookingId = 0;
                if (long.TryParse(orderCode, out long numericOrderCode))
                {
                    bookingId = (int)(numericOrderCode / 1000);
                }
                else
                {
                    string[] parts = orderCode.Split('_');
                    if (parts.Length >= 2 && parts[0] == "BOOKING" && int.TryParse(parts[1], out int id))
                    {
                        bookingId = id;
                    }
                }

                if (bookingId == 0)
                {
                    _logger.LogWarning($"Mã đơn hàng không hợp lệ: {orderCode}");
                    return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=error&message=invalid_order");
                }

                // Kiểm tra trạng thái thanh toán từ PayOS
                var paymentStatus = await _payosService.CheckPaymentStatus(orderCode);

                // Lấy thông tin đặt vé từ cơ sở dữ liệu
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogWarning($"Không tìm thấy đơn đặt vé {bookingId}");
                    return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=error&message=booking_not_found");
                }

                // Xử lý thanh toán thành công
                if (paymentStatus.Success && paymentStatus.Status == "PAID" && booking.Status == "Pending")
                {
                    _logger.LogInformation($"Cập nhật đơn đặt vé {bookingId} thành Confirmed");
                    await _bookingService.UpdateBookingPayment(bookingId, booking.User_ID);

                    // Chuyển hướng về trang thành công với thông tin bookingId
                    return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=success&orderCode={orderCode}&bookingId={bookingId}");
                }
                // Xử lý thanh toán bị hủy
                else if (paymentStatus.Success && paymentStatus.Status == "CANCELLED" && booking.Status == "Pending")
                {
                    _logger.LogInformation($"Hủy đơn đặt vé {bookingId}");
                    booking.Status = "Cancelled";

                    // Thêm lịch sử hủy đơn
                    var history = new BookingHistory
                    {
                        Booking_ID = bookingId,
                        Date = DateTime.Now,
                        Status = "Cancelled"
                    };
                    _context.BookingHistories.Add(history);

                    // Giải phóng ghế
                    var seats = await _context.Seats.Where(s => s.Booking_ID == bookingId).ToListAsync();
                    foreach (var seat in seats)
                    {
                        seat.Seat_Status = "Available";
                        seat.Booking_ID = null;
                        seat.Last_Updated = DateTime.Now;
                    }

                    // Lưu thay đổi
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Đã hủy đơn đặt vé {bookingId} thành công");

                    // Chuyển hướng về trang hủy với thông tin
                    return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=cancelled&orderCode={orderCode}&bookingId={bookingId}");
                }

                // Nếu không rơi vào các trường hợp trên, chuyển về trang với trạng thái hiện tại
                return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status={paymentStatus.Status.ToLower()}&orderCode={orderCode}&bookingId={bookingId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý PayOS return");
                return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=error&message=internal_error");
            }
        }

        /// <summary>
        /// Xử lý khi người dùng hủy thanh toán
        /// </summary>
        [HttpGet("cancel")]
        public async Task<IActionResult> PaymentCancel([FromQuery] string orderCode, [FromQuery] string status)
        {
            try
            {
                _logger.LogInformation($"Người dùng được chuyển đến URL cancel với orderCode: {orderCode}, Status: {status}");

                // Tự lấy bookingId từ orderCode không qua service
                int bookingId = 0;
                if (long.TryParse(orderCode, out long numericOrderCode))
                {
                    bookingId = (int)(numericOrderCode / 1000);
                }
                else
                {
                    string[] parts = orderCode.Split('_');
                    if (parts.Length >= 2 && parts[0] == "BOOKING" && int.TryParse(parts[1], out int id))
                    {
                        bookingId = id;
                    }
                }

                if (bookingId == 0)
                {
                    _logger.LogWarning($"Mã đơn hàng không hợp lệ: {orderCode}");
                    return Redirect($"{_configuration["PayOS:CancelUrl"]}?status=error&message=invalid_order");
                }

                // LẤY BOOKING TRỰC TIẾP TỪ ENTITY FRAMEWORK
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogError($"Không tìm thấy đơn đặt vé {bookingId}");
                    return Redirect($"{_configuration["PayOS:CancelUrl"]}?status=error&message=booking_not_found");
                }

                // Kiểm tra trạng thái thanh toán từ PayOS
                var paymentStatus = await _payosService.CheckPaymentStatus(orderCode);

                // Nếu thanh toán bị hủy và booking đang ở trạng thái Pending, cập nhật thành Cancelled
                if (booking.Status == "Pending")
                {
                    _logger.LogInformation($"Hủy đơn đặt vé {bookingId}");

                    // CẬP NHẬT TRỰC TIẾP QUA ENTITY FRAMEWORK
                    booking.Status = "Cancelled";

                    // Thêm lịch sử hủy đơn
                    var history = new BookingHistory
                    {
                        Booking_ID = bookingId,
                        Date = DateTime.Now,
                        Status = "Cancelled"
                    };
                    _context.BookingHistories.Add(history);

                    // Cập nhật trạng thái ghế
                    var seats = await _context.Seats.Where(s => s.Booking_ID == bookingId).ToListAsync();
                    foreach (var seat in seats)
                    {
                        seat.Seat_Status = "Available";
                        seat.Booking_ID = null;
                        seat.Last_Updated = DateTime.Now;
                    }

                    // Lưu tất cả thay đổi
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Đã hủy đơn đặt vé {bookingId} thành công");
                }

                // Chuyển về trang profile với thông tin hủy
                return Redirect($"{_configuration["PayOS:CancelUrl"]}?status=cancelled&orderCode={orderCode}&bookingId={bookingId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý PayOS cancel URL");
                return Redirect($"{_configuration["PayOS:CancelUrl"]}?status=error&message=internal_error");
            }
        }

        /// <summary>
        /// Chuyển hướng hủy thanh toán - Phương thức mới
        /// </summary>
        [HttpGet("redirect-cancel")]
        public async Task<IActionResult> CancelPayment(string orderCode)
        {
            if (string.IsNullOrEmpty(orderCode))
            {
                return BadRequest("Mã đơn hàng là bắt buộc");
            }

            // Trích xuất ID đặt vé từ orderCode
            int bookingId = _payosService.GetBookingIdFromOrderCode(orderCode);

            if (bookingId <= 0)
            {
                return BadRequest("Mã đơn hàng không hợp lệ");
            }

            // Gọi phương thức hủy đặt vé
            bool canceled = await _payosService.CancelBooking(bookingId);

            if (!canceled)
            {
                return BadRequest("Không thể hủy đặt vé");
            }

            // Chuyển hướng đến trang profile với tham số hủy
            string cancelUrl = _configuration["PayOS:CancelUrl"] ?? "http://localhost:5173/profile";
            return Redirect($"{cancelUrl}?code=000&id={orderCode}&cancel=true&status=CANCELLED&orderCode={orderCode}");
        }

        // DTO cho yêu cầu tạo thanh toán
        public class CreatePaymentDto
        {
            public int BookingId { get; set; }
        }
    }
}