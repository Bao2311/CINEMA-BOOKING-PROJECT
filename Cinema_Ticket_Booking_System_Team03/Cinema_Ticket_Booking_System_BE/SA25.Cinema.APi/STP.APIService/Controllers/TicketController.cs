using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STP.Repository.Data;
using STP.Repository.Models;
using STP.Repository.Services;

namespace STP.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketController : ControllerBase
    {
        private readonly TicketService _ticketService;
        private readonly CinemaDbContext _context; // Added missing context
        private readonly ILogger<TicketController> _logger;
        public TicketController(TicketService ticketService, CinemaDbContext context, ILogger<TicketController> logger) // Injected context
        {
            _ticketService = ticketService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tạo vé cho đơn đặt vé đã xác nhận thanh toán
        /// </summary>
        [HttpPost("generate/{bookingId}")]
        public async Task<IActionResult> GenerateTickets(int bookingId)
        {
            if (bookingId <= 0)
                return BadRequest("ID đơn đặt vé không hợp lệ");

            var tickets = await _ticketService.GenerateTicketsAsync(bookingId);
            if (tickets == null || !tickets.Any())
                return BadRequest("Không thể tạo vé, vui lòng kiểm tra trạng thái đơn đặt vé");

            var result = tickets.Select(t => new
            {
                t.Ticket_ID,
                t.Booking_ID,
                t.Seat_ID,
                t.Ticket_Code,
                t.Base_Price,
                t.Discount_Amount,
                t.Final_Price,
                t.Is_Checked_In
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin vé theo mã đặt vé
        /// </summary>
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetTicketsByBookingId(int bookingId)
        {
            if (bookingId <= 0)
                return BadRequest("ID đơn đặt vé không hợp lệ");

            var tickets = await _ticketService.GetTicketsByBookingIdAsync(bookingId);
            if (tickets == null || !tickets.Any())
                return NotFound("Không tìm thấy vé cho đơn đặt vé này");

            var result = tickets.Select(t => new
            {
                t.Ticket_ID,
                t.Booking_ID,
                t.Ticket_Code,
                SeatInfo = new
                {
                    t.Seat.Seat_ID,
                    t.Seat.SeatLayout.Row_Label,
                    t.Seat.SeatLayout.Column_Number,
                    t.Seat.SeatLayout.Seat_Type,
                    SeatLabel = $"{t.Seat.SeatLayout.Row_Label}{t.Seat.SeatLayout.Column_Number}"
                },
                MovieInfo = new
                {
                    t.TicketBooking.Showtime.Movie.Movie_ID,
                    t.TicketBooking.Showtime.Movie.Movie_Name,
                    t.TicketBooking.Showtime.Movie.Duration,
                    t.TicketBooking.Showtime.Movie.Rating
                },
                ShowtimeInfo = new
                {
                    t.TicketBooking.Showtime.Showtime_ID,
                    ShowDate = t.TicketBooking.Showtime.Show_Date.ToString("dd/MM/yyyy"),
                    StartTime = t.TicketBooking.Showtime.Start_Time.ToString(@"hh\:mm"),
                    EndTime = t.TicketBooking.Showtime.End_Time.ToString(@"hh\:mm")
                },
                CinemaRoomInfo = new
                {
                    t.TicketBooking.Showtime.CinemaRoom.Cinema_Room_ID,
                    t.TicketBooking.Showtime.CinemaRoom.Room_Name,
                    t.TicketBooking.Showtime.CinemaRoom.Room_Type
                },
                PriceInfo = new
                {
                    t.Base_Price,
                    t.Discount_Amount,
                    t.Final_Price
                },
                t.Is_Checked_In,
                CheckInTime = t.Check_In_Time?.ToString("dd/MM/yyyy HH:mm:ss")
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin vé theo mã vé
        /// </summary>
        [HttpGet("code/{ticketCode}")]
        public async Task<IActionResult> GetTicketByCode(string ticketCode)
        {
            if (string.IsNullOrEmpty(ticketCode))
                return BadRequest("Mã vé không hợp lệ");

            var ticket = await _ticketService.GetTicketByCodeAsync(ticketCode);
            if (ticket == null)
                return NotFound("Không tìm thấy vé với mã này");

            var result = new
            {
                ticket.Ticket_ID,
                ticket.Booking_ID,
                ticket.Ticket_Code,
                CustomerInfo = new
                {
                    ticket.TicketBooking.User?.User_ID,
                    ticket.TicketBooking.User?.Full_Name,
                    ticket.TicketBooking.User?.Email,
                    ticket.TicketBooking.User?.Phone_Number
                },
                SeatInfo = new
                {
                    ticket.Seat.Seat_ID,
                    ticket.Seat.SeatLayout.Row_Label,
                    ticket.Seat.SeatLayout.Column_Number,
                    ticket.Seat.SeatLayout.Seat_Type,
                    SeatLabel = $"{ticket.Seat.SeatLayout.Row_Label}{ticket.Seat.SeatLayout.Column_Number}"
                },
                MovieInfo = new
                {
                    ticket.TicketBooking.Showtime.Movie.Movie_ID,
                    ticket.TicketBooking.Showtime.Movie.Movie_Name,
                    ticket.TicketBooking.Showtime.Movie.Duration,
                    ticket.TicketBooking.Showtime.Movie.Rating
                },
                ShowtimeInfo = new
                {
                    ticket.TicketBooking.Showtime.Showtime_ID,
                    ShowDate = ticket.TicketBooking.Showtime.Show_Date.ToString("dd/MM/yyyy"),
                    StartTime = ticket.TicketBooking.Showtime.Start_Time.ToString(@"hh\:mm"),
                    EndTime = ticket.TicketBooking.Showtime.End_Time.ToString(@"hh\:mm")
                },
                CinemaRoomInfo = new
                {
                    ticket.TicketBooking.Showtime.CinemaRoom.Cinema_Room_ID,
                    ticket.TicketBooking.Showtime.CinemaRoom.Room_Name,
                    ticket.TicketBooking.Showtime.CinemaRoom.Room_Type
                },
                PriceInfo = new
                {
                    ticket.Base_Price,
                    ticket.Discount_Amount,
                    ticket.Final_Price
                },
                ticket.Is_Checked_In,
                CheckInTime = ticket.Check_In_Time?.ToString("dd/MM/yyyy HH:mm:ss")
            };

            return Ok(result);
        }

        /// <summary>
        /// Kiểm tra tình trạng vé (Task 7.2)
        /// </summary>
        [HttpGet("verify/{ticketCode}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> VerifyTicket(string ticketCode)
        {
            if (string.IsNullOrEmpty(ticketCode))
                return BadRequest("Mã vé không hợp lệ");

            try
            {
                var ticket = await _ticketService.GetTicketByCodeAsync(ticketCode);
                if (ticket == null)
                    return NotFound(new { success = false, message = "Không tìm thấy vé với mã này" });

                // Lấy thông tin suất chiếu
                var showtime = await _context.Showtimes
                    .Include(s => s.Movie)
                    .Include(s => s.CinemaRoom) // Added missing include
                    .FirstOrDefaultAsync(s => s.Showtime_ID == ticket.TicketBooking.Showtime_ID);

                if (showtime == null)
                    return NotFound(new { success = false, message = "Không tìm thấy thông tin suất chiếu của vé này" });

                // Kiểm tra tính hợp lệ của vé
                bool isValidForToday = showtime.Show_Date.Date == DateTime.Now.Date;
                DateTime showtimeStart = showtime.Show_Date.Add(showtime.Start_Time);
                bool isShowtimeStarted = DateTime.Now >= showtimeStart;
                bool isShowtimeEnded = DateTime.Now >= showtimeStart.AddMinutes(showtime.Movie.Duration);
                bool isValidShowtime = isValidForToday && !isShowtimeEnded;

                // Lấy thông tin ghế
                var seat = await _context.Seats
                    .Include(s => s.SeatLayout)
                    .FirstOrDefaultAsync(s => s.Seat_ID == ticket.Seat_ID);

                string seatInfo = seat != null ? $"{seat.SeatLayout.Row_Label}{seat.SeatLayout.Column_Number}" : "Unknown";

                // Tạo kết quả kiểm tra
                var result = new
                {
                    success = true,
                    ticket_info = new
                    {
                        ticket_id = ticket.Ticket_ID,
                        ticket_code = ticket.Ticket_Code,
                        is_checked_in = ticket.Is_Checked_In,
                        check_in_time = ticket.Check_In_Time,
                        booking_status = ticket.TicketBooking.Status
                    },
                    movie_info = new
                    {
                        movie_id = showtime.Movie.Movie_ID,
                        movie_name = showtime.Movie.Movie_Name,
                        duration = showtime.Movie.Duration,
                        show_date = showtime.Show_Date.ToString("dd/MM/yyyy"),
                        start_time = showtime.Start_Time.ToString(@"hh\:mm"),
                        end_time = showtime.End_Time.ToString(@"hh\:mm"),
                        showtime_id = showtime.Showtime_ID
                    },
                    seat_info = new
                    {
                        seat_id = ticket.Seat_ID,
                        seat_label = seatInfo,
                        room_name = showtime.CinemaRoom.Room_Name,
                        room_type = showtime.CinemaRoom.Room_Type
                    },
                    validation = new
                    {
                        is_valid = isValidShowtime && ticket.TicketBooking.Status == "Confirmed" && !ticket.Is_Checked_In,
                        is_for_today = isValidForToday,
                        is_showtime_started = isShowtimeStarted,
                        is_showtime_ended = isShowtimeEnded,
                        is_checked_in = ticket.Is_Checked_In,
                        reason = GetValidationReason(isValidForToday, isShowtimeEnded, ticket.Is_Checked_In, ticket.TicketBooking.Status)
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi kiểm tra vé: {ex.Message}" });
            }
        }

        // Helper method để lấy lý do hợp lệ/không hợp lệ của vé
        private string GetValidationReason(bool isForToday, bool isShowtimeEnded, bool isCheckedIn, string bookingStatus)
        {
            if (!isForToday)
                return "Vé không phải cho ngày hôm nay";

            if (isShowtimeEnded)
                return "Suất chiếu đã kết thúc";

            if (isCheckedIn)
                return "Vé đã được sử dụng";

            if (bookingStatus != "Confirmed")
                return $"Trạng thái đặt vé không hợp lệ: {bookingStatus}";

            return "Vé hợp lệ";
        }

        /// <summary>
        /// Quét vé - Check-in vé tại rạp (Task 7.2)
        /// </summary>
        [HttpPost("scan/{ticketCode}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> ScanTicket(string ticketCode)
        {
            if (string.IsNullOrEmpty(ticketCode))
                return BadRequest("Mã vé không hợp lệ");

            try
            {
                // Lấy thông tin vé
                var ticket = await _ticketService.GetTicketByCodeAsync(ticketCode);
                if (ticket == null)
                    return NotFound(new { success = false, message = "Không tìm thấy vé với mã này" });

                if (ticket.Is_Checked_In)
                    return BadRequest(new { success = false, message = "Vé đã được check-in trước đó" });

                // Lấy thông tin suất chiếu
                var showtime = await _context.Showtimes
                    .Include(s => s.Movie)
                    .Include(s => s.CinemaRoom) // Added missing include
                    .FirstOrDefaultAsync(s => s.Showtime_ID == ticket.TicketBooking.Showtime_ID);

                if (showtime == null)
                    return NotFound(new { success = false, message = "Không tìm thấy thông tin suất chiếu của vé này" });

                // Kiểm tra tính hợp lệ của vé
                bool isValidForToday = showtime.Show_Date.Date == DateTime.Now.Date;
                DateTime showtimeStart = showtime.Show_Date.Add(showtime.Start_Time);
                bool isShowtimeEnded = DateTime.Now >= showtimeStart.AddMinutes(showtime.Movie.Duration);

                // Chỉ cho phép check-in vé trong ngày chiếu và trước khi suất chiếu kết thúc
                if (!isValidForToday)
                    return BadRequest(new { success = false, message = "Vé không phải cho ngày hôm nay" });

                if (isShowtimeEnded)
                    return BadRequest(new { success = false, message = "Suất chiếu đã kết thúc" });

                if (ticket.TicketBooking.Status != "Confirmed")
                    return BadRequest(new { success = false, message = $"Trạng thái đặt vé không hợp lệ: {ticket.TicketBooking.Status}" });

                // Thực hiện check-in vé
                bool success = await _ticketService.CheckInTicketAsync(ticketCode);

                if (success)
                {
                    // Lấy thông tin ghế
                    var seat = await _context.Seats
                        .Include(s => s.SeatLayout)
                        .FirstOrDefaultAsync(s => s.Seat_ID == ticket.Seat_ID);

                    string seatInfo = seat != null ? $"{seat.SeatLayout.Row_Label}{seat.SeatLayout.Column_Number}" : "Unknown";

                    return Ok(new
                    {
                        success = true,
                        message = "Check-in vé thành công",
                        check_in_time = DateTime.Now,
                        ticket_info = new
                        {
                            ticket_id = ticket.Ticket_ID,
                            ticket_code = ticket.Ticket_Code,
                            movie_name = showtime.Movie.Movie_Name,
                            show_date = showtime.Show_Date.ToString("dd/MM/yyyy"),
                            start_time = showtime.Start_Time.ToString(@"hh\:mm"),
                            room_name = showtime.CinemaRoom.Room_Name,
                            seat = seatInfo
                        }
                    });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Không thể check-in vé" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi check-in vé: {ex.Message}" });
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả vé cần quét trong ngày (Task 7.2)
        /// </summary>
        [HttpGet("scan-list")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetTicketsToScan([FromQuery] DateTime? date = null)
        {
            try
            {
                // Mặc định lấy vé cho ngày hôm nay
                DateTime scanDate = date?.Date ?? DateTime.Now.Date;

                // Lấy danh sách các vé cần quét cho ngày được chỉ định
                var tickets = await _context.Tickets
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.Movie)
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.CinemaRoom)
                    .Include(t => t.Seat)
                        .ThenInclude(s => s.SeatLayout)
                    .Where(t =>
                        t.TicketBooking.Showtime.Show_Date.Date == scanDate &&
                        t.TicketBooking.Status == "Confirmed")
                    .ToListAsync();

                var result = tickets.Select(t => new
                {
                    ticket_id = t.Ticket_ID,
                    ticket_code = t.Ticket_Code,
                    is_checked_in = t.Is_Checked_In,
                    check_in_time = t.Check_In_Time,
                    movie_info = new
                    {
                        movie_id = t.TicketBooking.Showtime.Movie.Movie_ID,
                        movie_name = t.TicketBooking.Showtime.Movie.Movie_Name
                    },
                    showtime_info = new
                    {
                        showtime_id = t.TicketBooking.Showtime.Showtime_ID,
                        start_time = t.TicketBooking.Showtime.Start_Time.ToString(@"hh\:mm")
                    },
                    room_info = new
                    {
                        room_id = t.TicketBooking.Showtime.CinemaRoom.Cinema_Room_ID,
                        room_name = t.TicketBooking.Showtime.CinemaRoom.Room_Name
                    },
                    seat_info = new
                    {
                        seat_id = t.Seat.Seat_ID,
                        seat_label = $"{t.Seat.SeatLayout.Row_Label}{t.Seat.SeatLayout.Column_Number}"
                    }
                }).ToList();

                // Fixed anonymous object creation with proper method calls
                return Ok(new
                {
                    scan_date = scanDate.ToString("dd/MM/yyyy"),
                    total_tickets = result.Count,
                    checked_in = result.Count(r => r.is_checked_in),
                    pending = result.Count(r => !r.is_checked_in),
                    tickets = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi lấy danh sách vé: {ex.Message}" });
            }
        }

        /// <summary>
        /// Thống kê check-in của từng suất chiếu (Task 7.2)
        /// </summary>
        [HttpGet("checkin-stats")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetCheckInStats([FromQuery] DateTime? date = null)
        {
            try
            {
                // Mặc định lấy vé cho ngày hôm nay
                DateTime statsDate = date?.Date ?? DateTime.Now.Date;

                // Lấy tất cả suất chiếu trong ngày
                var showtimes = await _context.Showtimes
                    .Include(s => s.Movie)
                    .Include(s => s.CinemaRoom)
                    .Include(s => s.TicketBookings)
                        .ThenInclude(tb => tb.Tickets)
                    .Where(s => s.Show_Date.Date == statsDate)
                    .ToListAsync();

                var resultList = new List<object>();

                foreach (var s in showtimes)
                {
                    // Lấy tất cả vé của các đơn đặt vé đã xác nhận cho suất chiếu này
                    var confirmedTickets = s.TicketBookings
                        .Where(tb => tb.Status == "Confirmed")
                        .SelectMany(tb => tb.Tickets)
                        .ToList();

                    var totalTickets = confirmedTickets.Count;
                    var checkedInTickets = confirmedTickets.Count(t => t.Is_Checked_In);
                    var checkInPercentage = totalTickets > 0 ? (double)checkedInTickets / totalTickets * 100 : 0;

                    resultList.Add(new
                    {
                        showtime_id = s.Showtime_ID,
                        movie_name = s.Movie.Movie_Name,
                        room_name = s.CinemaRoom.Room_Name,
                        start_time = s.Start_Time.ToString(@"hh\:mm"),
                        end_time = s.End_Time.ToString(@"hh\:mm"),
                        total_tickets = totalTickets,
                        checked_in = checkedInTickets,
                        pending = totalTickets - checkedInTickets,
                        check_in_percentage = Math.Round(checkInPercentage, 1)
                    });
                }

                // Fixed anonymous object creation with proper method calls
                return Ok(new
                {
                    date = statsDate.ToString("dd/MM/yyyy"),
                    total_showtimes = resultList.Count,
                    total_tickets = resultList.Sum(r => ((dynamic)r).total_tickets),
                    total_checkins = resultList.Sum(r => ((dynamic)r).checked_in),
                    showtimes = resultList
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi lấy thống kê check-in: {ex.Message}" });
            }
        }

        /// <summary>
        /// Kiểm tra vé vào khi khách hàng đến rạp
        /// </summary>
        [HttpPost("check-in/{ticketCode}")]
        public async Task<IActionResult> CheckInTicket(string ticketCode)
        {
            if (string.IsNullOrEmpty(ticketCode))
                return BadRequest("Mã vé không hợp lệ");

            bool success = await _ticketService.CheckInTicketAsync(ticketCode);
            if (!success)
                return BadRequest("Không thể check-in vé. Vé không hợp lệ hoặc đã được check-in");

            return Ok(new { Success = true, Message = "Check-in vé thành công" });
        }

        /// <summary>
        /// Tạo và download file PDF vé điện tử
        /// </summary>
        [HttpGet("pdf/{ticketId}")]
        public async Task<IActionResult> DownloadTicketPdf(int ticketId)
        {
            if (ticketId <= 0)
                return BadRequest("ID vé không hợp lệ");

            byte[] pdfContent = await _ticketService.GenerateTicketPdfAsync(ticketId);
            if (pdfContent == null)
                return NotFound("Không tìm thấy vé hoặc không thể tạo file PDF");

            return File(pdfContent, "application/pdf", $"Ticket_{ticketId}.pdf");
        }

        /// <summary>
        /// Gửi vé qua email
        /// </summary>
        [HttpPost("send/email")]
        public async Task<IActionResult> SendTicketByEmail([FromBody] SendTicketEmailRequest request)
        {
            if (request == null || request.BookingId <= 0)
                return BadRequest("Dữ liệu không hợp lệ");

            bool success = await _ticketService.SendTicketFromTemplateByEmailAsync(request.BookingId, request.Email);
            if (!success)
                return BadRequest("Không thể gửi vé qua email, vui lòng thử lại");

            return Ok(new { Success = true, Message = "Gửi vé qua email thành công" });
        }

        /// <summary>
        /// Dọn dẹp vé không hợp lệ (chỉ Admin có quyền thực hiện)
        /// </summary>
        /// <remarks>
        /// Endpoint này sẽ xóa tất cả các vé liên kết với đơn đặt chỗ chưa được xác nhận.
        /// Chỉ sử dụng khi cần cập nhật hệ thống hoặc sửa lỗi dữ liệu.
        /// </remarks>
        /// <returns>Số lượng vé đã xóa</returns>
        [HttpPost("cleanup-tickets")]
        public async Task<IActionResult> CleanupTickets()
        {
            try
            {
                _logger.LogInformation("Bắt đầu quá trình dọn dẹp vé không hợp lệ");

                int removedTickets = await _ticketService.CleanupExistingTicketsAsync();

                return Ok(new
                {
                    Success = true,
                    Message = $"Đã xóa thành công {removedTickets} vé không hợp lệ",
                    RemovedTickets = removedTickets
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi dọn dẹp vé không hợp lệ");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi dọn dẹp vé",
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái vé cho các đơn đặt chỗ đã xác nhận
        /// </summary>
        /// <remarks>
        /// Endpoint này sẽ cập nhật tất cả các vé có trạng thái NULL mà liên kết với đơn đặt chỗ đã xác nhận.
        /// Đặt trạng thái các vé này thành "Active".
        /// </remarks>
        /// <returns>Số lượng vé đã cập nhật</returns>
        [HttpPost("update-ticket-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTicketStatus()
        {
            try
            {
                _logger.LogInformation("Bắt đầu quá trình cập nhật trạng thái vé");

                int updatedTickets = await _ticketService.UpdateTicketStatusForConfirmedBookingsAsync();

                return Ok(new
                {
                    Success = true,
                    Message = $"Đã cập nhật thành công trạng thái cho {updatedTickets} vé",
                    UpdatedTickets = updatedTickets
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật trạng thái vé");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi cập nhật trạng thái vé",
                    Error = ex.Message
                });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllTickets()
        {
            try
            {
                // Chỉ lấy danh sách tickets cơ bản, không include các bảng khác
                var tickets = await _context.Tickets
                    .OrderByDescending(t => t.Ticket_ID)
                    .ToListAsync();

                var totalCount = await _context.Tickets.CountAsync();

                return Ok(new
                {
                    success = true,
                    total_records = totalCount,
                    tickets = tickets.Select(t => new
                    {
                        ticket_id = t.Ticket_ID,
                        ticket_code = t.Ticket_Code,
                        booking_id = t.Booking_ID,
                        is_checked_in = t.Is_Checked_In,
                        status = t.Status
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi chi tiết khi lấy tất cả vé: {Message}", ex.Message);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi server",
                    error = ex.ToString() // Thêm để debug
                });
            }
        }

        [HttpGet("my-tickets")]
        [Authorize]
        public async Task<IActionResult> GetMyTickets()
        {
            try
            {
                // Ghi log danh sách claims để debug
                _logger.LogInformation("Danh sách claims trong token:");
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
                }

                // Lấy ID user từ token sử dụng claim đúng (nameidentifier)
                string userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userIdClaim == null)
                {
                    userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
                }

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    _logger.LogWarning("Không tìm thấy claim nameidentifier trong token");
                    return Unauthorized(new { success = false, message = "Không tìm thấy thông tin người dùng trong token" });
                }

                int userId = int.Parse(userIdClaim);
                _logger.LogInformation($"Lấy danh sách vé cho người dùng ID: {userId}");

                if (userId == 0)
                {
                    return Unauthorized(new { success = false, message = "Người dùng chưa đăng nhập" });
                }

                // Truy vấn cơ bản với một số JOIN cần thiết nhưng tối giản
                var tickets = await _context.Tickets
                    .Join(
                        _context.TicketBookings,
                        ticket => ticket.Booking_ID,
                        booking => booking.Booking_ID,
                        (ticket, booking) => new { ticket, booking }
                    )
                    .Where(t => t.booking.User_ID == userId)
                    .OrderByDescending(t => t.booking.Booking_Date)
                    .Select(t => new
                    {
                        ticket_id = t.ticket.Ticket_ID,
                        ticket_code = t.ticket.Ticket_Code,
                        booking_id = t.ticket.Booking_ID,
                        status = t.ticket.Status,
                        is_checked_in = t.ticket.Is_Checked_In,
                        final_price = t.ticket.Final_Price,
                        booking_date = t.booking.Booking_Date
                    })
                    .ToListAsync();

                // Thêm truy vấn để lấy thông tin showtime và phim cho các vé
                var ticketsWithDetails = new List<object>();
                foreach (var ticket in tickets)
                {
                    // Lấy thông tin showtime và phim
                    var booking = await _context.TicketBookings
                        .Include(b => b.Showtime)
                            .ThenInclude(s => s.Movie)
                        .Include(b => b.Showtime)
                            .ThenInclude(s => s.CinemaRoom)
                        .FirstOrDefaultAsync(b => b.Booking_ID == ticket.booking_id);

                    if (booking != null)
                    {
                        // Lấy thông tin ghế
                        var ticketEntity = await _context.Tickets
                            .Include(t => t.Seat)
                                .ThenInclude(s => s.SeatLayout)
                            .FirstOrDefaultAsync(t => t.Ticket_ID == ticket.ticket_id);

                        string seatInfo = ticketEntity?.Seat != null ?
                            $"{ticketEntity.Seat.SeatLayout.Row_Label}{ticketEntity.Seat.SeatLayout.Column_Number}" : "N/A";

                        ticketsWithDetails.Add(new
                        {
                            ticket.ticket_id,
                            ticket.ticket_code,
                            ticket.booking_id,
                            ticket.status,
                            ticket.is_checked_in,
                            ticket.final_price,
                            ticket.booking_date,
                            movie_info = booking.Showtime.Movie != null ? new
                            {
                                movie_id = booking.Showtime.Movie.Movie_ID,
                                movie_name = booking.Showtime.Movie.Movie_Name,
                                poster_url = booking.Showtime.Movie.Poster_URL
                            } : null,
                            showtime_info = new
                            {
                                showtime_id = booking.Showtime.Showtime_ID,
                                show_date = booking.Showtime.Show_Date.ToString("yyyy-MM-dd"),
                                start_time = booking.Showtime.Start_Time.ToString(@"hh\:mm"),
                                room_name = booking.Showtime.CinemaRoom.Room_Name
                            },
                            seat_info = seatInfo
                        });
                    }
                    else
                    {
                        // Nếu không tìm thấy thông tin đầy đủ, vẫn trả về thông tin cơ bản
                        ticketsWithDetails.Add(ticket);
                    }
                }

                var ticketsToReturn = ticketsWithDetails.Count > 0 ? ticketsWithDetails : tickets.Cast<object>().ToList();

                return Ok(new
                {
                    success = true,
                    total = tickets.Count,
                    tickets = ticketsToReturn
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy vé của người dùng: {Message}", ex.Message);
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Lỗi: {ex.Message}",
                    error_details = ex.ToString() // Thêm chi tiết lỗi để debug
                });
            }
        }

    }
    public class SendTicketEmailRequest
    {
        public int BookingId { get; set; }
        public string Email { get; set; }
    }

    public class SendTicketSmsRequest
    {
        public int BookingId { get; set; }
        public string PhoneNumber { get; set; }
    }
}

