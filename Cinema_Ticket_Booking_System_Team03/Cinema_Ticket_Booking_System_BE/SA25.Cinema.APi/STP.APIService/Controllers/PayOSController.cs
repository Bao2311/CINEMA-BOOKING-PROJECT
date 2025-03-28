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
        public PayOSController(
            ILogger<PayOSController> logger,
            PayOSNugetService payosService,
            BookingService bookingService,
            CinemaDbContext context)
        {
            _logger = logger;
            _payosService = payosService;
            _bookingService = bookingService;
            _context = context;
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
                    return BadRequest(new { success = false, message = "Mã đơn hàng không hợp lệ" });
                }

                // Kiểm tra trạng thái thanh toán từ PayOS
                var paymentStatus = await _payosService.CheckPaymentStatus(orderCode);

                // Lấy thông tin đặt vé từ cơ sở dữ liệu
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogWarning($"Không tìm thấy đơn đặt vé {bookingId}");
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });
                }

                // Xử lý thanh toán thành công
                if (paymentStatus.Success && paymentStatus.Status == "PAID" && booking.Status == "Pending")
                {
                    _logger.LogInformation($"Cập nhật đơn đặt vé {bookingId} thành Confirmed");
                    await _bookingService.UpdateBookingPayment(bookingId, booking.User_ID);
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
                }

                // Lấy thông tin ghế
                string seatInfoStr = "Không có thông tin ghế";
                try
                {
                    var seatInfo = await _context.Tickets
                        .Where(t => t.Booking_ID == bookingId)
                        .Join(_context.Seats,
                              t => t.Seat_ID,
                              s => s.Seat_ID,
                              (t, s) => new { s.Layout_ID })
                        .Join(_context.SeatLayouts,
                              ts => ts.Layout_ID,
                              sl => sl.Layout_ID,
                              (ts, sl) => new { sl.Row_Label, sl.Column_Number })
                        .ToListAsync();

                    if (seatInfo.Any())
                    {
                        var seatCodes = seatInfo.Select(s => s.Row_Label + s.Column_Number.ToString());
                        seatInfoStr = string.Join(", ", seatCodes);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi lấy thông tin ghế");
                }

                // Xác định số tiền và trạng thái hiển thị
                decimal amount = paymentStatus.Success ? paymentStatus.Amount ?? booking.Total_Amount : booking.Total_Amount;
                string statusClass = paymentStatus.Status == "PAID" ? "success" : "failed";
                string statusTitle = paymentStatus.Status == "PAID" ? "Thanh toán thành công!" : "Thanh toán chưa hoàn tất";

                // Tạo nội dung HTML
                string htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Kết quả thanh toán</title>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
        .success {{ color: #28a745; }}
        .failed {{ color: #dc3545; }}
        h1 {{ font-size: 24px; margin-bottom: 20px; }}
        .info {{ margin-bottom: 10px; text-align: left; }}
        .btn {{ display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; 
               text-decoration: none; border-radius: 4px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <h1 class=""{statusClass}"">{statusTitle}</h1>
        
        <div class=""info"">
            <p><strong>Mã đơn hàng:</strong> {orderCode}</p>
            <p><strong>Trạng thái:</strong> {paymentStatus.Status}</p>
            <p><strong>Số tiền:</strong> {amount.ToString("N0")} VNĐ</p>
            <p><strong>Tên phim:</strong> {booking.Showtime?.Movie?.Movie_Name ?? "Không xác định"}</p>
            <p><strong>Phòng:</strong> {booking.Showtime?.CinemaRoom?.Room_Name ?? "Không xác định"}</p>
            <p><strong>Ghế:</strong> {seatInfoStr}</p>
        </div>
        
        <a href=""/"" class=""btn"">Quay lại trang chủ</a>
    </div>
</body>
</html>";

                return Content(htmlContent, "text/html", System.Text.Encoding.UTF8);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý PayOS return");
                string errorHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>Lỗi xử lý thanh toán</title>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        h1 { font-size: 24px; margin-bottom: 20px; color: #dc3545; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; 
              text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class=""container"">
        <h1>Đã xảy ra lỗi</h1>
        <p>Không thể xử lý thanh toán. Vui lòng thử lại sau.</p>
        <a href=""/"" class=""btn"">Quay lại trang chủ</a>
    </div>
</body>
</html>";

                return Content(errorHtml, "text/html", System.Text.Encoding.UTF8);
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
                    return BadRequest(new { success = false, message = "Mã đơn hàng không hợp lệ" });
                }

                _logger.LogInformation($"Đã xác định bookingId: {bookingId} từ orderCode: {orderCode}");

                // LẤY BOOKING TRỰC TIẾP TỪ ENTITY FRAMEWORK
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogError($"Không tìm thấy đơn đặt vé {bookingId}");
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });
                }

                // Kiểm tra trạng thái thanh toán từ PayOS
                var paymentStatus = await _payosService.CheckPaymentStatus(orderCode);
                decimal amount = paymentStatus.Success ? paymentStatus.Amount ?? booking.Total_Amount : booking.Total_Amount;

                // Nếu status là PAID và booking đang ở trạng thái Pending, cập nhật thành Confirmed
                if (status == "PAID" && paymentStatus.Status == "PAID" && booking.Status == "Pending")
                {
                    try
                    {
                        _logger.LogInformation($"Cập nhật đơn đặt vé {bookingId} thành Confirmed");
                        await _bookingService.UpdateBookingPayment(bookingId, booking.User_ID);

                        // Lấy booking đã cập nhật
                        booking = await _context.TicketBookings.FindAsync(bookingId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi cập nhật trạng thái đơn đặt vé: {ex.Message}");
                    }
                }
                else if (status == "CANCELLED" || status == null)
                {
                    // Nếu người dùng hủy thanh toán và booking đang ở trạng thái Pending, cập nhật thành Cancelled
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
                }

                // Lấy thông tin ghế từ Entity Framework
                var seatInfo = await _context.Tickets
                    .Where(t => t.Booking_ID == bookingId)
                    .Join(_context.Seats,
                          t => t.Seat_ID,
                          s => s.Seat_ID,
                          (t, s) => new { s.Layout_ID })
                    .Join(_context.SeatLayouts,
                          ts => ts.Layout_ID,
                          sl => sl.Layout_ID,
                          (ts, sl) => new { sl.Row_Label, sl.Column_Number })
                    .ToListAsync();

                string seatInfoStr = "Không có thông tin ghế";
                if (seatInfo.Any())
                {
                    var seatCodes = seatInfo.Select(s => s.Row_Label + s.Column_Number.ToString());
                    seatInfoStr = string.Join(", ", seatCodes);
                }

                // Tạo nội dung HTML cho cancel page
                string cancelledStatus = status == "PAID" ? "PAID" : "CANCELLED";
                string statusClass = status == "PAID" ? "success" : "failed";
                string statusTitle = status == "PAID" ? "Thanh toán thành công!" : "Thanh toán đã bị hủy";
                string message = status == "PAID"
                    ? "Thanh toán của bạn đã được xác nhận."
                    : "Bạn đã hủy quá trình thanh toán. Đơn đặt vé của bạn đã được hủy.";

                string htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <title>Kết quả thanh toán</title>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
        .success {{ color: #28a745; }}
        .pending {{ color: #ffc107; }}
        .failed {{ color: #dc3545; }}
        h1 {{ font-size: 24px; margin-bottom: 20px; }}
        .info {{ margin-bottom: 10px; text-align: left; }}
        .btn {{ display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; 
               text-decoration: none; border-radius: 4px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <h1 class=""{statusClass}"">{statusTitle}</h1>
        <p>{message}</p>
        
        <div class=""info"">
            <p><strong>Mã đơn hàng:</strong> {orderCode}</p>
            <p><strong>Trạng thái:</strong> {cancelledStatus}</p>
            <p><strong>Số tiền:</strong> {amount.ToString("N0")} VNĐ</p>
            <p><strong>Tên phim:</strong> {booking.Showtime?.Movie?.Movie_Name ?? "Không xác định"}</p>
            <p><strong>Phòng:</strong> {booking.Showtime?.CinemaRoom?.Room_Name ?? "Không xác định"}</p>
            <p><strong>Ghế:</strong> {seatInfoStr}</p>
        </div>
        
        <a href=""/"" class=""btn"">Quay lại trang chủ</a>
    </div>
</body>
</html>";

                return Content(htmlContent, "text/html", System.Text.Encoding.UTF8);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xử lý PayOS cancel URL");
                // Trả về trang lỗi
                string errorHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>Lỗi xử lý thanh toán</title>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        h1 { font-size: 24px; margin-bottom: 20px; color: #dc3545; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; 
              text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class=""container"">
        <h1>Đã xảy ra lỗi</h1>
        <p>Không thể xử lý thanh toán. Vui lòng thử lại sau.</p>
        <a href=""/"" class=""btn"">Quay lại trang chủ</a>
    </div>
</body>
</html>";

                return Content(errorHtml, "text/html", System.Text.Encoding.UTF8);
            }
        }

        // DTO cho yêu cầu tạo thanh toán
        public class CreatePaymentDto
        {
            public int BookingId { get; set; }
        }
    }
}