using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STP.Repository.Data;
using STP.Repository.Models;
using STP.Repository.Services;
using System.Security.Claims;

namespace STP.APIService.Controllers
{
    /// <summary>
    /// Controller thanh toán giả lập — thay thế PayOS trong môi trường phát triển.
    /// Không cần kết nối dịch vụ thanh toán bên thứ 3.
    /// </summary>
    [Route("api/mock-payment")]
    [ApiController]
    public class MockPaymentController : ControllerBase
    {
        private readonly ILogger<MockPaymentController> _logger;
        private readonly CinemaDbContext _context;
        private readonly BookingService _bookingService;
        private readonly IConfiguration _configuration;
        private readonly PointsService _pointsService;

        public MockPaymentController(
            ILogger<MockPaymentController> logger,
            CinemaDbContext context,
            BookingService bookingService,
            IConfiguration configuration,
            PointsService pointsService)
        {
            _logger = logger;
            _context = context;
            _bookingService = bookingService;
            _configuration = configuration;
            _pointsService = pointsService;
        }

        /// <summary>
        /// Lấy thông tin thanh toán và URL chuyển đến trang thanh toán giả lập
        /// GET /api/mock-payment/payment-url/{bookingId}
        /// </summary>
        [HttpGet("payment-url/{bookingId}")]
        [Authorize]
        public async Task<IActionResult> GetPaymentUrl(int bookingId)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Không thể xác định người dùng" });

                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime).ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime).ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Tickets)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                bool isStaffOrAdmin = userRole == "Staff" || userRole == "Admin";
                if (booking.User_ID != userId && !isStaffOrAdmin)
                    return Unauthorized(new { success = false, message = "Bạn không có quyền thanh toán đơn đặt vé này" });

                if (DateTime.Now > booking.Payment_Deadline)
                {
                    // Tự động gia hạn cho môi trường demo/mock để không bị chặn
                    booking.Payment_Deadline = DateTime.Now.AddMinutes(15);
                    await _context.SaveChangesAsync();
                }

                // Tạo token giả lập để bảo vệ callback
                var mockToken = GenerateMockToken(bookingId, userId.Value);

                var frontendUrl = "http://localhost:5173";
                var paymentUrl = $"{frontendUrl}/mock-payment?bookingId={bookingId}&amount={booking.Total_Amount}&token={mockToken}";

                _logger.LogInformation($"[MockPayment] Tạo URL thanh toán giả lập cho booking {bookingId}, amount={booking.Total_Amount}");

                return Ok(new
                {
                    success = true,
                    paymentUrl = paymentUrl,
                    bookingId = bookingId,
                    amount = booking.Total_Amount,
                    movieName = booking.Showtime?.Movie?.Movie_Name ?? "N/A",
                    showDate = booking.Showtime?.Show_Date.ToString("dd/MM/yyyy") ?? "N/A",
                    startTime = booking.Showtime?.Start_Time.ToString(@"hh\:mm") ?? "N/A",
                    roomName = booking.Showtime?.CinemaRoom?.Room_Name ?? "N/A",
                    ticketCount = booking.Tickets?.Count ?? 0,
                    paymentDeadline = booking.Payment_Deadline.ToString("dd/MM/yyyy HH:mm"),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[MockPayment] Lỗi khi tạo payment URL cho booking {bookingId}");
                return StatusCode(500, new { success = false, message = "Lỗi server khi tạo thanh toán" });
            }
        }

        /// <summary>
        /// Xác nhận thanh toán thành công (giả lập)
        /// POST /api/mock-payment/confirm
        /// </summary>
        [HttpPost("confirm")]
        [Authorize]
        public async Task<IActionResult> ConfirmPayment([FromBody] MockPaymentConfirmDto request)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Không thể xác định người dùng" });

                // Xác thực token giả lập
                if (!ValidateMockToken(request.Token, request.BookingId, userId.Value))
                    return Unauthorized(new { success = false, message = "Token không hợp lệ" });

                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == request.BookingId);

                if (booking == null)
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });

                if (booking.Status != "Pending")
                    return BadRequest(new { success = false, message = $"Đơn đặt vé đang ở trạng thái '{booking.Status}'" });

                _logger.LogInformation($"[MockPayment] Xác nhận thanh toán thành công cho booking {request.BookingId}");

                // Gọi service cập nhật booking y như PayOS làm
                await _bookingService.UpdateBookingPayment(request.BookingId, userId.Value);

                var returnUrl = "http://localhost:5173/profile/bookings";
                return Ok(new
                {
                    success = true,
                    message = "Thanh toán thành công!",
                    bookingId = request.BookingId,
                    redirectUrl = $"{returnUrl}?status=success&bookingId={request.BookingId}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[MockPayment] Lỗi khi xác nhận thanh toán booking {request.BookingId}");
                return StatusCode(500, new { success = false, message = "Lỗi server khi xác nhận thanh toán" });
            }
        }

        /// <summary>
        /// Hủy thanh toán (giả lập)
        /// POST /api/mock-payment/cancel
        /// </summary>
        [HttpPost("cancel")]
        [Authorize]
        public async Task<IActionResult> CancelPayment([FromBody] MockPaymentConfirmDto request)
        {
            try
            {
                var userId = GetUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Không thể xác định người dùng" });

                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == request.BookingId);

                if (booking == null)
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });

                if (booking.Status == "Cancelled")
                    return Ok(new { success = true, message = "Đơn đặt vé đã được hủy trước đó" });

                if (booking.Status != "Pending")
                    return BadRequest(new { success = false, message = "Không thể hủy đơn đặt vé ở trạng thái này" });

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Cập nhật trạng thái booking
                    booking.Status = "Cancelled";
                    _context.BookingHistories.Add(new BookingHistory
                    {
                        Booking_ID = request.BookingId,
                        Date = DateTime.Now,
                        Status = "Cancelled",
                        Notes = "Người dùng hủy thanh toán"
                    });

                    // Giải phóng ghế
                    var seats = await _context.Seats.Where(s => s.Booking_ID == request.BookingId).ToListAsync();
                    foreach (var seat in seats)
                    {
                        seat.Seat_Status = "Available";
                        seat.Booking_ID = null;
                        seat.Last_Updated = DateTime.Now;
                    }

                    // Xóa tickets
                    var tickets = await _context.Tickets.Where(t => t.Booking_ID == request.BookingId).ToListAsync();
                    if (tickets.Any()) _context.Tickets.RemoveRange(tickets);

                    // Hoàn điểm nếu có
                    if (booking.Points_Used > 0 && booking.User_ID.HasValue)
                    {
                        await _pointsService.RefundPointsForExpiredBookingAsync(
                            request.BookingId, booking.User_ID.Value, booking.Points_Used);
                        booking.Points_Used = 0;
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation($"[MockPayment] Đã hủy booking {request.BookingId}");

                    return Ok(new
                    {
                        success = true,
                        message = "Đã hủy đặt vé",
                        redirectUrl = "http://localhost:5173/profile/bookings?status=cancelled"
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[MockPayment] Lỗi khi hủy booking {request.BookingId}");
                return StatusCode(500, new { success = false, message = "Lỗi server khi hủy thanh toán" });
            }
        }

        /// <summary>
        /// Lấy thông tin booking để hiển thị trang thanh toán (không cần auth đặc biệt)
        /// GET /api/mock-payment/booking-info/{bookingId}
        /// </summary>
        [HttpGet("booking-info/{bookingId}")]
        [Authorize]
        public async Task<IActionResult> GetBookingInfo(int bookingId)
        {
            try
            {
                var userId = GetUserId();

                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime).ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime).ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Tickets).ThenInclude(t => t.Seat).ThenInclude(s => s.SeatLayout)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                    return NotFound(new { success = false, message = "Không tìm thấy đơn đặt vé" });

                return Ok(new
                {
                    success = true,
                    bookingId = booking.Booking_ID,
                    status = booking.Status,
                    totalAmount = booking.Total_Amount,
                    paymentDeadline = booking.Payment_Deadline,
                    movieName = booking.Showtime?.Movie?.Movie_Name ?? "N/A",
                    posterUrl = booking.Showtime?.Movie?.Poster_URL ?? "",
                    showDate = booking.Showtime?.Show_Date.ToString("dd/MM/yyyy"),
                    startTime = booking.Showtime?.Start_Time.ToString(@"hh\:mm"),
                    endTime = booking.Showtime?.End_Time.ToString(@"hh\:mm"),
                    roomName = booking.Showtime?.CinemaRoom?.Room_Name ?? "N/A",
                    roomType = booking.Showtime?.CinemaRoom?.Room_Type ?? "Standard",
                    ticketCount = booking.Tickets?.Count ?? 0,
                    seats = booking.Tickets?.Select(t => new
                    {
                        row = t.Seat?.SeatLayout?.Row_Label ?? "?",
                        col = t.Seat?.SeatLayout?.Column_Number ?? 0,
                        seatType = t.Seat?.SeatLayout?.Seat_Type ?? "Standard",
                        finalPrice = t.Final_Price
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[MockPayment] Lỗi khi lấy thông tin booking {bookingId}");
                return StatusCode(500, new { success = false, message = "Lỗi server" });
            }
        }

        // ── Helpers ──────────────────────────────────────────────────────────────

        private int? GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("UserId")?.Value
                ?? User.FindFirst("userId")?.Value;

            return int.TryParse(userIdStr, out var id) ? id : null;
        }

        private static string GenerateMockToken(int bookingId, int userId)
        {
            // Token đơn giản: hash của bookingId + userId + secret
            var raw = $"MOCK_{bookingId}_{userId}_STP_CINEMA_2026";
            using var sha = System.Security.Cryptography.SHA256.Create();
            var bytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(bytes)[..16];
        }

        private static bool ValidateMockToken(string token, int bookingId, int userId)
        {
            if (string.IsNullOrEmpty(token)) return false;
            var expected = GenerateMockToken(bookingId, userId);
            return string.Equals(token, expected, StringComparison.OrdinalIgnoreCase);
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────────

    public class MockPaymentConfirmDto
    {
        public int BookingId { get; set; }
        public string Token { get; set; } = "";
    }
}
