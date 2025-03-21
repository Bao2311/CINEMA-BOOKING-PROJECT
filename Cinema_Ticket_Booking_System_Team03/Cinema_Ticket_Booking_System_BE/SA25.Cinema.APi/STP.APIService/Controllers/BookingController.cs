using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _bookingService;
        private readonly ILogger<BookingController> _logger;
        private readonly CinemaDbContext _context;

        public BookingController(BookingService bookingService, ILogger<BookingController> logger, CinemaDbContext context)
        {
            _bookingService = bookingService;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Tạo đơn đặt vé mới
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<BookingResponseDTO>> CreateBooking([FromBody] BookingRequestDTO request)
        {
            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }
            try
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

                // Chuyển đổi userId thành số
                if (!int.TryParse(userId, out int userIdInt))
                {
                    return BadRequest(new { message = "ID người dùng không hợp lệ" });
                }

                // Kiểm tra xem người dùng có tồn tại trong cơ sở dữ liệu không
                var user = await _context.Users.FindAsync(userIdInt);
                if (user == null)
                {
                    _logger.LogWarning($"Người dùng với ID {userIdInt} không tồn tại trong hệ thống");
                    return BadRequest(new { message = $"Người dùng với ID {userIdInt} không tồn tại trong hệ thống" });
                }

                _logger.LogInformation($"Tạo đặt vé cho người dùng: {user.Full_Name} (ID: {userIdInt})");
                var response = await _bookingService.CreateBooking(request, userIdInt);
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Lỗi tham số khi tạo đặt vé");
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Không tìm thấy dữ liệu khi tạo đặt vé");
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Thao tác không hợp lệ khi tạo đặt vé");
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Lỗi cập nhật cơ sở dữ liệu khi tạo đặt vé");

                // Xử lý riêng cho lỗi ràng buộc khóa ngoại
                if (ex.InnerException?.Message.Contains("FK_Ticket_Bookings_Creators") == true)
                {
                    return BadRequest(new { message = $"Không thể tạo đặt vé vì người dùng không có quyền tạo đặt vé hoặc không tồn tại trong hệ thống" });
                }

                return StatusCode(500, new { message = "Lỗi cơ sở dữ liệu khi tạo đặt vé" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi không xác định khi tạo đặt vé");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo đơn đặt vé" });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái đơn đặt vé (thanh toán thành công)
        /// </summary>
        [HttpPut("{id}/payment")]
        [Authorize]
        public async Task<ActionResult<BookingResponseDTO>> UpdateBookingPayment(int id)
        {
            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }
            try
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

                var response = await _bookingService.UpdateBookingPayment(id, int.Parse(userId));
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating booking payment for ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật trạng thái đơn đặt vé" });
            }
        }

        /// <summary>
        /// Hủy đơn đặt vé
        /// </summary>
        [HttpPut("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelBooking(int id)
        {
            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }
            try
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

                var response = await _bookingService.CancelBooking(id, int.Parse(userId));
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling booking for ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi hủy đơn đặt vé" });
            }
        }

        /// <summary>
        /// Lấy danh sách đơn đặt vé của người dùng hiện tại
        /// </summary>
        [HttpGet("my-bookings")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BookingHistoryDTO>>> GetMyBookings()
        {
            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }
            try
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

                var bookings = await _bookingService.GetUserBookings(int.Parse(userId));
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn đặt vé" });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của đơn đặt vé
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<BookingResponseDTO>> GetBookingDetails(int id)
        {
            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }
            try
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

                var booking = await _bookingService.GetBookingDetail(id);
                return Ok(booking);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting booking details for ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin chi tiết đơn đặt vé" });
            }
        }
        /// <summary>
        /// Tìm kiếm đơn đặt vé theo nhiều tiêu chí khác nhau (Task 7.1)
        /// </summary>
        [HttpGet("search")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<IEnumerable<BookingSearchResponseDTO>>> SearchBookings(
            [FromQuery] string customerName = null,
            [FromQuery] string phoneEmail = null,
            [FromQuery] string movieName = null,
            [FromQuery] string showDate = null,
            [FromQuery] string status = null,
            [FromQuery] string paymentMethod = null)
        {
            try
            {
                _logger.LogInformation("Tìm kiếm đơn đặt vé với tiêu chí: " +
                    $"customerName={customerName}, phoneEmail={phoneEmail}, movieName={movieName}, " +
                    $"showDate={showDate}, status={status}, paymentMethod={paymentMethod}");

                // Xây dựng truy vấn cơ bản để lấy thông tin đặt vé và các bảng liên quan
                var query = _context.TicketBookings
                    .Include(b => b.User)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Payments)
                    .Include(b => b.BookingHistories)
                    .AsQueryable();

                // Áp dụng bộ lọc nếu có
                if (!string.IsNullOrEmpty(customerName))
                {
                    customerName = customerName.Trim().ToLower();
                    query = query.Where(b => b.User.Full_Name.ToLower().Contains(customerName));
                }

                if (!string.IsNullOrEmpty(phoneEmail))
                {
                    phoneEmail = phoneEmail.Trim().ToLower();
                    query = query.Where(b =>
                        b.User.Email.ToLower().Contains(phoneEmail) ||
                        b.User.Phone_Number.Contains(phoneEmail));
                }

                if (!string.IsNullOrEmpty(movieName))
                {
                    movieName = movieName.Trim().ToLower();
                    query = query.Where(b => b.Showtime.Movie.Movie_Name.ToLower().Contains(movieName));
                }

                if (!string.IsNullOrEmpty(showDate))
                {
                    if (DateTime.TryParse(showDate, out DateTime parsedDate))
                    {
                        query = query.Where(b => b.Showtime.Show_Date.Date == parsedDate.Date);
                    }
                }

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(b => b.Status == status);
                }

                if (!string.IsNullOrEmpty(paymentMethod))
                {
                    query = query.Where(b => b.Payments.Any(p => p.Payment_Method == paymentMethod));
                }

                // Sắp xếp kết quả theo ngày đặt vé giảm dần (mới nhất đầu tiên)
                query = query.OrderByDescending(b => b.Booking_Date);

                // Thực hiện truy vấn
                var bookings = await query.ToListAsync();

                // Chuyển đổi kết quả sang DTO để trả về
                var result = bookings.Select(b => new BookingSearchResponseDTO
                {
                    Booking_ID = b.Booking_ID,
                    CustomerName = b.User?.Full_Name,
                    CustomerEmail = b.User?.Email,
                    CustomerPhone = b.User?.Phone_Number,
                    MovieName = b.Showtime.Movie.Movie_Name,
                    ShowDate = b.Showtime.Show_Date,
                    StartTime = b.Showtime.Start_Time,
                    RoomName = b.Showtime.CinemaRoom.Room_Name,
                    Amount = b.Total_Amount,
                    Status = b.Status,
                    BookingDate = b.Booking_Date,
                    PaymentMethod = b.Payments.OrderByDescending(p => p.Transaction_Date)
                        .FirstOrDefault()?.Payment_Method,
                    // Format seat information
                    Seats = string.Join(", ", GetFormattedSeatsForBooking(b.Booking_ID).Result)
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tìm kiếm đơn đặt vé");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tìm kiếm đơn đặt vé" });
            }
        }

        /// <summary>
        /// Helper method to get formatted seats for a booking
        /// </summary>
        private async Task<List<string>> GetFormattedSeatsForBooking(int bookingId)
        {
            try
            {
                var formattedSeats = new List<string>();

                var seatInfo = await (from t in _context.Tickets
                                      join s in _context.Seats on t.Seat_ID equals s.Seat_ID
                                      join sl in _context.SeatLayouts on s.Layout_ID equals sl.Layout_ID
                                      where t.Booking_ID == bookingId
                                      select new { sl.Row_Label, sl.Column_Number })
                                    .ToListAsync();

                foreach (var seat in seatInfo)
                {
                    formattedSeats.Add($"{seat.Row_Label}{seat.Column_Number}");
                }

                return formattedSeats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin ghế cho đặt vé {bookingId}");
                return new List<string>();
            }
        }

        /// <summary>
        /// Xuất báo cáo đặt vé ra CSV (Task 7.1)
        /// </summary>
        [HttpGet("export")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> ExportBookings(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string status = null)
        {
            try
            {
                // Mặc định lấy dữ liệu của tháng hiện tại nếu không chỉ định ngày
                if (!startDate.HasValue)
                    startDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);

                if (!endDate.HasValue)
                    endDate = DateTime.Now.Date.AddDays(1).AddSeconds(-1); // Đến cuối ngày hôm nay

                // Kiểm tra ngày hợp lệ
                if (startDate > endDate)
                    return BadRequest(new { message = "Ngày bắt đầu phải trước ngày kết thúc" });

                _logger.LogInformation($"Xuất báo cáo đặt vé từ {startDate.Value} đến {endDate.Value}");

                // Xây dựng truy vấn
                var query = _context.TicketBookings
                    .Include(b => b.User)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Payments)
                    .Where(b => b.Booking_Date >= startDate && b.Booking_Date <= endDate);

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(b => b.Status == status);

                var bookings = await query.OrderByDescending(b => b.Booking_Date).ToListAsync();

                // Tạo dữ liệu CSV
                var csv = new System.Text.StringBuilder();

                // Header
                csv.AppendLine("Booking ID,Customer Name,Email,Phone,Movie,Show Date,Show Time,Room,Amount,Status,Payment Method,Payment Date,Booking Date");

                // Data rows
                foreach (var booking in bookings)
                {
                    var payment = booking.Payments.OrderByDescending(p => p.Transaction_Date).FirstOrDefault();

                    csv.AppendLine(
                        $"{booking.Booking_ID}," +
                        $"\"{EscapeCsvField(booking.User?.Full_Name)}\"," +
                        $"\"{EscapeCsvField(booking.User?.Email)}\"," +
                        $"\"{EscapeCsvField(booking.User?.Phone_Number)}\"," +
                        $"\"{EscapeCsvField(booking.Showtime.Movie.Movie_Name)}\"," +
                        $"{booking.Showtime.Show_Date:dd/MM/yyyy}," +
                        $"{booking.Showtime.Start_Time:hh\\:mm}," +
                        $"\"{EscapeCsvField(booking.Showtime.CinemaRoom.Room_Name)}\"," +
                        $"{booking.Total_Amount}," +
                        $"{booking.Status}," +
                        $"\"{EscapeCsvField(payment?.Payment_Method)}\"," +
                        $"{payment?.Transaction_Date.ToString("dd/MM/yyyy HH:mm:ss") ?? "-"}," +
                        $"{booking.Booking_Date:dd/MM/yyyy HH:mm:ss}"
                    );
                }

                // Trả về file CSV
                byte[] bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
                var startDateStr = startDate.Value.ToString("yyyyMMdd");
                var endDateStr = endDate.Value.ToString("yyyyMMdd");
                return File(bytes, "text/csv", $"BookingReport_{startDateStr}_{endDateStr}.csv");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xuất báo cáo đặt vé");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xuất báo cáo đặt vé" });
            }
        }

        // Helper để escape các trường văn bản trong CSV
        private string EscapeCsvField(string field)
        {
            if (string.IsNullOrEmpty(field))
                return "";

            // Thay thế dấu nháy kép bởi hai dấu nháy kép
            return field.Replace("\"", "\"\"");
        }
        /// <summary>
        /// Xử lý hoàn tiền cho đơn đặt vé (Task 7.3)
        /// </summary>
        [HttpPost("{id}/refund")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult<RefundResponseDTO>> ProcessRefund(int id, [FromBody] RefundRequestDTO request)
        {
            if (request == null || string.IsNullOrEmpty(request.Reason))
                return BadRequest(new { message = "Phải cung cấp lý do hoàn tiền" });

            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }

            try
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

                var result = await _bookingService.ProcessRefund(id, request, int.Parse(userId));
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
                _logger.LogError(ex, $"Lỗi xử lý hoàn tiền cho đơn đặt vé ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xử lý hoàn tiền" });
            }
        }

        /// <summary>
        /// Tính toán số tiền hoàn lại mà không thực hiện hoàn tiền (Task 7.3)
        /// </summary>
        [HttpGet("{id}/refund-calculation")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> CalculateRefund(int id)
        {
            try
            {
                // Lấy thông tin đơn đặt vé
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .Include(b => b.Payments.Where(p => p.Payment_Status == "Completed"))
                    .Include(b => b.Tickets)
                    .FirstOrDefaultAsync(b => b.Booking_ID == id);

                if (booking == null)
                    return NotFound(new { message = $"Không tìm thấy đơn đặt vé có ID {id}" });

                if (booking.Status != "Confirmed")
                    return BadRequest(new { message = $"Chỉ có thể hoàn tiền cho đơn đặt vé đã xác nhận thanh toán, trạng thái hiện tại: {booking.Status}" });

                // Kiểm tra xem vé đã được check-in chưa
                var checkedInTickets = booking.Tickets.Where(t => t.Is_Checked_In).ToList();
                if (checkedInTickets.Any())
                    return BadRequest(new { message = "Không thể hoàn tiền cho đơn đặt vé đã có vé check-in" });

                // Kiểm tra thời gian suất chiếu
                var showDateTime = booking.Showtime.Show_Date.Add(booking.Showtime.Start_Time);
                if (DateTime.Now > showDateTime)
                    return BadRequest(new { message = "Không thể hoàn tiền cho đơn đặt vé sau khi suất chiếu đã bắt đầu" });

                // Lấy thanh toán gần nhất
                var payment = booking.Payments.OrderByDescending(p => p.Transaction_Date).FirstOrDefault();
                if (payment == null)
                    return BadRequest(new { message = "Không tìm thấy thanh toán cho đơn đặt vé này" });

                // Tính số tiền hoàn lại theo chính sách
                TimeSpan timeUntilShow = showDateTime - DateTime.Now;
                double hoursUntilShow = timeUntilShow.TotalHours;

                int refundPercentage;
                string refundPolicy;

                if (hoursUntilShow > 48)
                {
                    refundPercentage = 100;
                    refundPolicy = "Hoàn tiền 100% cho hủy trước 48 giờ";
                }
                else if (hoursUntilShow > 24)
                {
                    refundPercentage = 75;
                    refundPolicy = "Hoàn tiền 75% cho hủy trước 24-48 giờ";
                }
                else if (hoursUntilShow > 12)
                {
                    refundPercentage = 50;
                    refundPolicy = "Hoàn tiền 50% cho hủy trước 12-24 giờ";
                }
                else if (hoursUntilShow > 6)
                {
                    refundPercentage = 25;
                    refundPolicy = "Hoàn tiền 25% cho hủy trước 6-12 giờ";
                }
                else
                {
                    refundPercentage = 0;
                    refundPolicy = "Không hoàn tiền cho hủy trong vòng 6 giờ trước suất chiếu";
                }

                decimal refundAmount = booking.Total_Amount * refundPercentage / 100;

                return Ok(new
                {
                    booking_id = booking.Booking_ID,
                    original_amount = booking.Total_Amount,
                    refund_amount = refundAmount,
                    refund_percentage = refundPercentage,
                    refund_policy = refundPolicy,
                    hours_until_show = Math.Round(hoursUntilShow, 1),
                    show_datetime = showDateTime.ToString("dd/MM/yyyy HH:mm")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi tính toán hoàn tiền cho đơn đặt vé ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tính toán hoàn tiền" });
            }
        }

        /// <summary>
        /// Xem lịch sử hoàn tiền (Task 7.3)
        /// </summary>
        [HttpGet("refund-history")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<ActionResult> GetRefundHistory(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Mặc định lấy dữ liệu của 30 ngày gần nhất nếu không chỉ định ngày
                if (!startDate.HasValue)
                    startDate = DateTime.Now.AddDays(-30).Date;

                if (!endDate.HasValue)
                    endDate = DateTime.Now.Date.AddDays(1).AddSeconds(-1);

                // Lấy tất cả các giao dịch hoàn tiền trong khoảng thời gian
                var refunds = await _context.Payments
                    .Include(p => p.TicketBooking)
                        .ThenInclude(tb => tb.User)
                    .Include(p => p.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.Movie)
                    .Include(p => p.ProcessedBy)
                    .Where(p => p.Payment_Status == "Refunded" &&
                           p.Refund_Date >= startDate &&
                           p.Refund_Date <= endDate)
                    .OrderByDescending(p => p.Refund_Date)
                    .ToListAsync();

                var result = refunds.Select(r => new {
                    refund_id = r.Payment_ID,
                    booking_id = r.Booking_ID,
                    customer_name = r.TicketBooking.User?.Full_Name ?? "Unknown",
                    customer_email = r.TicketBooking.User?.Email,
                    movie_name = r.TicketBooking.Showtime.Movie.Movie_Name,
                    show_date = r.TicketBooking.Showtime.Show_Date.ToString("dd/MM/yyyy"),
                    show_time = r.TicketBooking.Showtime.Start_Time.ToString(@"hh\:mm"),
                    original_amount = Math.Abs(r.Amount),
                    refund_amount = r.Refund_Amount,
                    refund_date = r.Refund_Date,
                    refund_reason = r.Refund_Reason,
                    processed_by = r.ProcessedBy?.Full_Name ?? "System"
                }).ToList();

                return Ok(new
                {
                    start_date = startDate.Value.ToString("dd/MM/yyyy"),
                    end_date = endDate.Value.ToString("dd/MM/yyyy"),
                    total_refunds = result.Count,
                    total_amount = result.Sum(r => r.refund_amount),
                    refunds = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy lịch sử hoàn tiền");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy lịch sử hoàn tiền" });
            }
        }
    }
}
