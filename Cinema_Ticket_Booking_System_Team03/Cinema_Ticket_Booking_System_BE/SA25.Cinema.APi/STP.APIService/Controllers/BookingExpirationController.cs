using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Models;
using STP.Repository.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class BookingExpirationController : ControllerBase
    {
        private readonly ILogger<BookingExpirationController> _logger;
        private readonly CinemaDbContext _context;
        private readonly PointsService _pointsService;

        public BookingExpirationController(
            ILogger<BookingExpirationController> logger,
            CinemaDbContext context,
            PointsService pointsService)
        {
            _logger = logger;
            _context = context;
            _pointsService = pointsService;
        }

        // GET: api/BookingExpiration/check-expired
        [HttpGet("check-expired")]
        public async Task<IActionResult> CheckExpiredBookings()
        {
            try
            {
                var now = DateTime.Now;
                _logger.LogInformation($"Đang kiểm tra thủ công các booking quá hạn thanh toán tại {now}");

                // Truy vấn các booking quá hạn
                var expiredBookings = await _context.TicketBookings
                    .Where(b => b.Status == "Pending" && b.Payment_Deadline < now)
                    .ToListAsync();

                _logger.LogInformation($"Tìm thấy {expiredBookings.Count} booking quá hạn thanh toán");

                if (expiredBookings.Count == 0)
                {
                    // Log thêm thông tin để debug
                    var pendingBookings = await _context.TicketBookings
                        .Where(b => b.Status == "Pending")
                        .Select(b => new
                        {
                            b.Booking_ID,
                            b.Payment_Deadline,
                            CurrentTime = now,
                            IsExpired = b.Payment_Deadline < now,
                            TimeDifference = EF.Functions.DateDiffMinute(b.Payment_Deadline, now)
                        })
                        .ToListAsync();

                    return Ok(new
                    {
                        message = "Không tìm thấy booking nào quá hạn",
                        currentTime = now,
                        pendingBookings = pendingBookings
                    });
                }

                // Danh sách kết quả xử lý
                var results = new List<object>();

                // Xử lý từng booking
                foreach (var booking in expiredBookings)
                {
                    try
                    {
                        // Lưu trạng thái ban đầu
                        var originalStatus = booking.Status;
                        var pointsUsed = booking.Points_Used;

                        // Cập nhật trạng thái booking
                        booking.Status = "Cancelled";

                        // Hoàn trả điểm nếu có
                        if (booking.Points_Used > 0)
                        {
                            await _pointsService.RefundPointsForExpiredBookingAsync(
                                booking.Booking_ID,
                                booking.User_ID.Value,
                                booking.Points_Used);

                            // Thêm lịch sử hoàn điểm
                            var pointsRefundHistory = new BookingHistory
                            {
                                Booking_ID = booking.Booking_ID,
                                Status = "Points Refunded",
                                Date = DateTime.Now,
                                Notes = $"Hoàn trả {booking.Points_Used} điểm do hết hạn thanh toán (thủ công)"
                            };
                            _context.BookingHistories.Add(pointsRefundHistory);

                            // Đặt lại điểm đã sử dụng
                            booking.Points_Used = 0;
                        }

                        // Cập nhật trạng thái ghế
                        var seats = await _context.Seats
                            .Where(s => s.Booking_ID == booking.Booking_ID)
                            .ToListAsync();

                        foreach (var seat in seats)
                        {
                            seat.Seat_Status = "Available";
                            seat.Last_Updated = DateTime.Now;
                            seat.Booking_ID = null;
                        }

                        // Thêm lịch sử hủy đơn
                        var bookingHistory = new BookingHistory
                        {
                            Booking_ID = booking.Booking_ID,
                            Status = "Cancelled",
                            Date = DateTime.Now,
                            Notes = "Hủy thủ công do quá hạn thanh toán"
                        };
                        _context.BookingHistories.Add(bookingHistory);

                        // Lưu thay đổi
                        await _context.SaveChangesAsync();

                        // Thêm kết quả xử lý
                        results.Add(new
                        {
                            booking.Booking_ID,
                            booking.User_ID,
                            OriginalStatus = originalStatus,
                            NewStatus = booking.Status,
                            PointsRefunded = pointsUsed,
                            SeatsUpdated = seats.Count,
                            Success = true
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi xử lý booking {booking.Booking_ID}");

                        // Thêm kết quả lỗi
                        results.Add(new
                        {
                            booking.Booking_ID,
                            booking.User_ID,
                            Error = ex.Message,
                            Success = false
                        });
                    }
                }

                return Ok(new
                {
                    message = $"Đã xử lý {results.Count} booking quá hạn",
                    processedBookings = results
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra và xử lý các booking quá hạn");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xử lý", error = ex.Message });
            }
        }

        // POST: api/BookingExpiration/set-expired/{id}
        [HttpPost("set-expired/{id}")]
        public async Task<IActionResult> SetBookingExpired(int id)
        {
            try
            {
                // Tìm booking
                var booking = await _context.TicketBookings.FindAsync(id);
                if (booking == null)
                {
                    return NotFound(new { message = $"Không tìm thấy booking ID {id}" });
                }

                if (booking.Status != "Pending")
                {
                    return BadRequest(new { message = $"Booking ID {id} không ở trạng thái Pending" });
                }

                // Đặt deadline về 10 phút trước
                var pastTime = DateTime.Now.AddMinutes(-1);
                var originalDeadline = booking.Payment_Deadline;
                booking.Payment_Deadline = pastTime;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Đã đặt deadline của booking ID {id} về quá khứ",
                    bookingId = booking.Booking_ID,
                    originalDeadline = originalDeadline,
                    newDeadline = booking.Payment_Deadline,
                    currentTime = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi đặt booking {id} về trạng thái quá hạn");
                return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
            }
        }
    }
}