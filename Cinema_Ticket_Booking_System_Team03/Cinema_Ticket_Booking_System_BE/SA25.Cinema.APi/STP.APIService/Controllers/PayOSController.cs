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
        private readonly PointsService _pointsService;

        public PayOSController(
            ILogger<PayOSController> logger,
            PayOSNugetService payosService,
            BookingService bookingService,
            CinemaDbContext context,
            IConfiguration configuration,
            PointsService pointsService)
        {
            _logger = logger;
            _payosService = payosService;
            _bookingService = bookingService;
            _context = context;
            _configuration = configuration;
            _pointsService = pointsService;
        }

        /// <summary>
        /// Lấy URL thanh toán cho đơn đặt vé
        /// </summary>
        [HttpGet("payment-url/{bookingId}")]
        [Authorize]
        public async Task<IActionResult> GetPaymentUrl(int bookingId)
        {
            try
            {
                _logger.LogInformation($"Đang lấy URL thanh toán cho đơn đặt vé: {bookingId}");

                // Lấy thông tin người dùng từ token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                    User.FindFirst("nameid")?.Value ??
                    User.FindFirst("UserId")?.Value ??
                    User.FindFirst("userId")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Không thể xác định người dùng" });
                }

                // Lấy thông tin đặt vé
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });
                }

                // Kiểm tra quyền của người dùng
                if (booking.User_ID != int.Parse(userId))
                {
                    return Unauthorized(new { success = false, message = "Bạn không có quyền xem thông tin thanh toán đơn đặt vé này" });
                }

                // Lấy URL thanh toán
                var result = await _payosService.GetPaymentUrl(bookingId);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.Message });
                }

                // Trả về thông tin thanh toán
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    paymentUrl = result.PaymentUrl,
                    qrCodeUrl = result.QrCodeUrl,
                    orderCode = result.OrderCode,
                    amount = result.Amount,
                    paymentId = result.PaymentId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy URL thanh toán: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy URL thanh toán" });
            }
        }

        [HttpGet("pending-payment")]
        [Authorize]
        public async Task<IActionResult> GetPendingPayment()
        {
            try
            {
                // Lấy userId từ token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { success = false, message = "Không thể xác định người dùng" });
                }

                // Tìm booking đang pending của người dùng hiện tại
                var pendingBooking = await _context.TicketBookings
                    .Where(b => b.User_ID == int.Parse(userId) && b.Status == "Pending")
                    .OrderByDescending(b => b.Booking_Date)
                    .FirstOrDefaultAsync();

                if (pendingBooking == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé đang chờ thanh toán" });
                }

                // Lấy URL thanh toán
                var paymentResult = await _payosService.GetPaymentUrl(pendingBooking.Booking_ID);

                if (!paymentResult.Success)
                {
                    return BadRequest(new { success = false, message = paymentResult.Message });
                }

                // Trả về thông tin thanh toán
                return Ok(new
                {
                    success = true,
                    bookingId = pendingBooking.Booking_ID,
                    paymentUrl = paymentResult.PaymentUrl,
                    qrCodeUrl = paymentResult.QrCodeUrl,
                    orderCode = paymentResult.OrderCode,
                    amount = paymentResult.Amount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin thanh toán đang chờ");
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi lấy thông tin thanh toán" });
            }
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

                // Lấy vai trò người dùng từ token
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isStaffOrAdmin = userRole == "Staff" || userRole == "Admin";

                // ĐIỂM THAY ĐỔI: Kiểm tra quyền của người dùng
                // Cho phép tiếp tục nếu:
                // 1. Người dùng là chủ sở hữu booking HOẶC
                // 2. Người dùng là nhân viên/admin (có thể thanh toán cho bất kỳ booking nào)
                if (booking.User_ID != int.Parse(userId) && !isStaffOrAdmin)
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
                    // Tải lại booking mà không cần JOIN với Showtimes
                    booking = await _context.TicketBookings
                        .Where(b => b.Booking_ID == bookingId)
                        .FirstOrDefaultAsync();

                    if (booking == null)
                    {
                        _logger.LogError($"Không tìm thấy đặt vé với Booking_ID {bookingId} trong bảng Ticket_Bookings.");
                        return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=error&message=booking_not_found");
                    }

                    _logger.LogInformation($"Đã tải lại booking: Trạng thái: {booking.Status}, Points_Used: {booking.Points_Used}, User_ID: {booking.User_ID}, User_ID.HasValue: {booking.User_ID.HasValue}");
                }

                // Xử lý thanh toán thành công
                if (paymentStatus.Success && paymentStatus.Status == "PAID" && booking.Status == "Pending")
                {
                    _logger.LogInformation($"Cập nhật đơn đặt vé {bookingId} thành Confirmed");
                    await _bookingService.UpdateBookingPayment(bookingId, booking.User_ID.Value);

                    // Chuyển hướng về trang thành công với thông tin bookingId
                    return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=success&orderCode={orderCode}&bookingId={bookingId}");
                }
                // Xử lý thanh toán bị hủy
                else if (paymentStatus.Success && paymentStatus.Status == "CANCELLED")
                {
                    _logger.LogInformation($"Hủy đơn đặt vé {bookingId} do thanh toán bị hủy. Trạng thái hiện tại: {booking.Status}, Points_Used: {booking.Points_Used}, User_ID: {booking.User_ID}");

                    // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
                    using (var transaction = await _context.Database.BeginTransactionAsync())
                    {
                        try
                        {
                            // Chỉ cập nhật trạng thái và ghế nếu đặt vé chưa bị hủy
                            if (booking.Status != "Cancelled")
                            {
                                // Cập nhật trạng thái booking
                                booking.Status = "Cancelled";

                                // Thêm lịch sử hủy đơn
                                var history = new BookingHistory
                                {
                                    Booking_ID = bookingId,
                                    Date = DateTime.Now,
                                    Status = "Cancelled",
                                    Notes = "Hủy đơn do người dùng hủy thanh toán"
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

                                // THÊM MỚI: Cập nhật Promotion_Usage
                                if (booking.Promotion_ID.HasValue)
                                {
                                    // Tìm các bản ghi Promotion_Usage liên quan đến booking này
                                    var promotionUsages = await _context.PromotionUsages
                                        .Where(pu => pu.Booking_ID == bookingId)
                                        .ToListAsync();

                                    foreach (var usage in promotionUsages)
                                    {
                                        _logger.LogInformation($"Đặt lại HasUsed = false cho PromotionUsage ID: {usage.Usage_ID}");
                                        usage.HasUsed = false;
                                    }

                                    // Giảm lượt sử dụng của mã khuyến mãi
                                    var promotion = await _context.Promotions
                                        .FindAsync(booking.Promotion_ID.Value);

                                    if (promotion != null && promotion.Current_Usage > 0)
                                    {
                                        promotion.Current_Usage -= 1;
                                        _logger.LogInformation($"Giảm lượt sử dụng của mã khuyến mãi ID: {promotion.Promotion_ID}, Còn lại: {promotion.Current_Usage}");
                                    }
                                }
                            }
                            else
                            {
                                _logger.LogInformation($"Đơn đặt vé {bookingId} đã ở trạng thái Cancelled, không cần cập nhật trạng thái hoặc ghế.");
                            }

                            // Hoàn trả điểm nếu có
                            if (booking.Points_Used > 0 && booking.User_ID.HasValue)
                            {
                                try
                                {
                                    _logger.LogInformation($"Bắt đầu hoàn trả {booking.Points_Used} điểm cho người dùng {booking.User_ID} từ đơn đặt vé {bookingId}");

                                    // Gọi phương thức hoàn điểm
                                    await _pointsService.RefundPointsForExpiredBookingAsync(
                                        bookingId,
                                        booking.User_ID.Value,
                                        booking.Points_Used
                                    );

                                    // Ghi log việc hoàn điểm
                                    _context.BookingHistories.Add(new BookingHistory
                                    {
                                        Booking_ID = bookingId,
                                        Date = DateTime.Now,
                                        Status = "Points Refunded",
                                        Notes = $"Hoàn trả {booking.Points_Used} điểm do hủy đơn"
                                    });

                                    // Đặt lại số điểm đã sử dụng
                                    booking.Points_Used = 0;

                                    _logger.LogInformation($"Đã hoàn trả {booking.Points_Used} điểm thành công cho người dùng {booking.User_ID} từ đơn đặt vé {bookingId}");
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho đơn đặt vé {bookingId}: {ex.Message}");
                                    throw;
                                }
                            }
                            else
                            {
                                _logger.LogInformation($"Không cần hoàn điểm cho đơn đặt vé {bookingId}. Points_Used: {booking.Points_Used}, User_ID: {booking.User_ID}");
                            }

                            // Lưu tất cả thay đổi
                            await _context.SaveChangesAsync();

                            // Commit transaction
                            await transaction.CommitAsync();

                            _logger.LogInformation($"Đã hủy đơn đặt vé {bookingId} thành công");
                        }
                        catch (Exception ex)
                        {
                            // Rollback nếu có lỗi
                            await transaction.RollbackAsync();
                            _logger.LogError(ex, $"Lỗi khi hủy đơn đặt vé {bookingId}: {ex.Message}");
                            throw;
                        }
                    }

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

                // Lấy thông tin booking từ database
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogError($"Không tìm thấy đơn đặt vé {bookingId}");
                    return Redirect($"{_configuration["PayOS:CancelUrl"]}?status=error&message=booking_not_found");
                }

                // Kiểm tra trạng thái thanh toán từ PayOS API
                var paymentStatus = await _payosService.CheckPaymentStatus(orderCode);

                // PHẦN FIX: Kiểm tra trạng thái thanh toán từ PayOS và từ tham số status
                bool isPaid = (paymentStatus.Success && paymentStatus.Status == "PAID") || status == "PAID";

                _logger.LogInformation($"Trạng thái thanh toán: API={paymentStatus.Status}, Tham số={status}, IsPaid={isPaid}");

                // Nếu thanh toán đã thành công, cập nhật booking thành confirmed thay vì hủy
                if (isPaid && booking.Status == "Pending")
                {
                    _logger.LogInformation($"Thanh toán đã thành công cho đơn đặt vé {bookingId}, cập nhật thành Confirmed");

                    try
                    {
                        // Sử dụng BookingService để cập nhật trạng thái thành Confirmed
                        await _bookingService.UpdateBookingPayment(bookingId, booking.User_ID.Value);
                        _logger.LogInformation($"Đã cập nhật đơn đặt vé {bookingId} thành Confirmed");

                        // Chuyển hướng tới trang thành công với thông tin 
                        return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=success&orderCode={orderCode}&bookingId={bookingId}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi cập nhật trạng thái booking {bookingId} sau thanh toán thành công: {ex.Message}");
                        return Redirect($"{_configuration["PayOS:ReturnUrl"]}?status=success&orderCode={orderCode}&bookingId={bookingId}&message=update_error");
                    }
                }

                // Xử lý hủy đặt vé nếu thanh toán không thành công (status không phải PAID)
                else if (!isPaid)
                {
                    _logger.LogInformation($"Hủy đơn đặt vé {bookingId} do thanh toán bị hủy. Trạng thái hiện tại: {booking.Status}, Points_Used: {booking.Points_Used}, User_ID: {booking.User_ID}");

                    // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
                    using (var transaction = await _context.Database.BeginTransactionAsync())
                    {
                        try
                        {
                            // Chỉ cập nhật trạng thái và ghế nếu đặt vé chưa bị hủy
                            if (booking.Status != "Cancelled")
                            {
                                // Cập nhật trạng thái booking
                                booking.Status = "Cancelled";

                                // Thêm lịch sử hủy đơn
                                var history = new BookingHistory
                                {
                                    Booking_ID = bookingId,
                                    Date = DateTime.Now,
                                    Status = "Cancelled",
                                    Notes = "Hủy đơn do người dùng hủy thanh toán"
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
                            }
                            else
                            {
                                _logger.LogInformation($"Đơn đặt vé {bookingId} đã ở trạng thái Cancelled, không cần cập nhật trạng thái hoặc ghế.");
                            }

                            // Hoàn trả điểm nếu có
                            if (booking.Points_Used > 0 && booking.User_ID.HasValue)
                            {
                                try
                                {
                                    _logger.LogInformation($"Bắt đầu hoàn trả {booking.Points_Used} điểm cho người dùng {booking.User_ID} từ đơn đặt vé {bookingId}");

                                    // Gọi phương thức hoàn điểm
                                    await _pointsService.RefundPointsForExpiredBookingAsync(
                                        bookingId,
                                        booking.User_ID.Value,
                                        booking.Points_Used
                                    );

                                    // Ghi log việc hoàn điểm
                                    _context.BookingHistories.Add(new BookingHistory
                                    {
                                        Booking_ID = bookingId,
                                        Date = DateTime.Now,
                                        Status = "Points Refunded",
                                        Notes = $"Hoàn trả {booking.Points_Used} điểm do hủy đơn"
                                    });

                                    // Đặt lại số điểm đã sử dụng
                                    booking.Points_Used = 0;

                                    _logger.LogInformation($"Đã hoàn trả {booking.Points_Used} điểm thành công cho người dùng {booking.User_ID} từ đơn đặt vé {bookingId}");
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho đơn đặt vé {bookingId}: {ex.Message}");
                                    throw;
                                }
                            }
                            else
                            {
                                _logger.LogInformation($"Không cần hoàn điểm cho đơn đặt vé {bookingId}. Points_Used: {booking.Points_Used}, User_ID: {booking.User_ID}");
                            }

                            // Lưu tất cả thay đổi
                            await _context.SaveChangesAsync();

                            // Commit transaction
                            await transaction.CommitAsync();

                            _logger.LogInformation($"Đã hủy đơn đặt vé {bookingId} thành công");
                        }
                        catch (Exception ex)
                        {
                            // Rollback nếu có lỗi
                            await transaction.RollbackAsync();
                            _logger.LogError(ex, $"Lỗi khi hủy đơn đặt vé {bookingId}: {ex.Message}");
                            throw;
                        }
                    }

                    // Chuyển hướng về trang hủy với thông tin
                    return Redirect($"{_configuration["PayOS:CancelUrl"]}?status=cancelled&orderCode={orderCode}&bookingId={bookingId}");
                }
                else
                {
                    // Trường hợp không rơi vào các điều kiện trên (ví dụ: trạng thái không hợp lệ)
                    _logger.LogInformation($"Không thực hiện hành động nào cho đơn đặt vé {bookingId}. Trạng thái thanh toán: {isPaid}, Trạng thái đặt vé: {booking.Status}");
                    return Redirect($"{_configuration["PayOS:CancelUrl"]}?status={booking.Status.ToLower()}&orderCode={orderCode}&bookingId={bookingId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi không xử lý được khi xử lý PayOS cancel URL: {ex.Message}");
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
