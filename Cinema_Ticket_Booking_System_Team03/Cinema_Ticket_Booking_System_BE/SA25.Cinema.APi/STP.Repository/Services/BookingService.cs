using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class BookingService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<BookingService> _logger;
        private readonly PayOSNugetService _payosService;
        private readonly PointsService _pointsService;
        private readonly MemberService _memberService;
        private readonly TicketService _ticketService;

        public BookingService(CinemaDbContext context, ILogger<BookingService> logger, PayOSNugetService payosService, PointsService pointsService, MemberService memberService, TicketService ticketService)
        {
            _context = context;
            _logger = logger;
            _payosService = payosService;
            _pointsService = pointsService;
            _memberService = memberService;
            _ticketService = ticketService;
        }

        public async Task<IEnumerable<BookingHistoryDTO>> GetAllBookings()
        {
            try
            {
                // Lấy danh sách tất cả các đơn đặt vé, bao gồm thông tin liên quan
                var bookings = await _context.TicketBookings
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Payments)
                    .Include(b => b.BookingHistories)
                    .OrderByDescending(b => b.Booking_Date) // Sắp xếp theo ngày đặt vé (mới nhất trước)
                    .ToListAsync();

                var result = new List<BookingHistoryDTO>();

                foreach (var booking in bookings)
                {
                    // Lấy thông tin thanh toán mới nhất (nếu có)
                    var latestPayment = booking.Payments.OrderByDescending(p => p.Transaction_Date).FirstOrDefault();

                    // Lấy thông tin về việc hủy đơn (nếu có)
                    var cancellation = booking.BookingHistories
                        .Where(h => h.Status == "Cancelled")
                        .OrderByDescending(h => h.Date)
                        .FirstOrDefault();

                    // Tạo đối tượng DTO
                    var bookingHistoryDto = new BookingHistoryDTO
                    {
                        Booking_ID = booking.Booking_ID,
                        Booking_Date = booking.Booking_Date,
                        Total_Amount = booking.Total_Amount,
                        Status = booking.Status,
                        Payment_Method = latestPayment?.Payment_Method, // Phương thức thanh toán
                        Payment_Date = latestPayment?.Transaction_Date, // Ngày thanh toán
                        Cancellation_Date = cancellation?.Date, // Ngày hủy (nếu có)
                        User_ID = booking.User_ID, // User ID của người đặt
                        Showtime = new ShowtimeInfoDTO // Thông tin suất chiếu
                        {
                            Showtime_ID = booking.Showtime.Showtime_ID,
                            Show_Date = booking.Showtime.Show_Date,
                            Start_Time = booking.Showtime.Start_Time,
                            Movie = new MovieInfoDTO
                            {
                                Movie_ID = booking.Showtime.Movie.Movie_ID,
                                Movie_Name = booking.Showtime.Movie.Movie_Name,
                                Duration = booking.Showtime.Movie.Duration,
                                Rating = booking.Showtime.Movie.Rating,
                                Poster_URL = booking.Showtime.Movie.Poster_URL
                            },
                            Room = new RoomDTO
                            {
                                Cinema_Room_ID = booking.Showtime.CinemaRoom.Cinema_Room_ID,
                                Room_Name = booking.Showtime.CinemaRoom.Room_Name,
                                Room_Type = booking.Showtime.CinemaRoom.Room_Type
                            }
                        }
                    };

                    result.Add(bookingHistoryDto);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy danh sách tất cả đơn đặt vé");
                throw; // Re-throw để xử lý ở tầng cao hơn
            }
        }

        public async Task<BookingResponseDTO> CreateBooking(BookingRequestDTO request, int userId)
        {
            try
            {
                // Lấy thông tin người dùng để kiểm tra role
                var currentUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.User_ID == userId);

                if (currentUser == null)
                {
                    _logger.LogWarning($"Không tìm thấy thông tin người dùng với ID {userId}");
                    throw new KeyNotFoundException($"Người dùng với ID {userId} không tồn tại trong hệ thống");
                }

                // Xác định tự động liệu đây có phải là đặt vé từ nhân viên hay không
                bool isStaffBooking = currentUser.Role == "Staff" || currentUser.Role == "Admin";

                _logger.LogInformation($"Tạo đơn đặt vé mới - {(isStaffBooking ? "Đặt tại quầy" : "Đặt online")} - UserId: {userId}");

                // Nếu là đơn đặt vé online (khách hàng tự đặt), thực hiện các kiểm tra như trước
                if (!isStaffBooking)
                {
                    // Kiểm tra xem người dùng có booking đang Pending không
                    var pendingBooking = await CheckPendingBooking(userId);
                    if (pendingBooking != null)
                    {
                        _logger.LogWarning($"Người dùng {userId} đang có booking Pending ID: {pendingBooking.Booking_ID}");

                        // Tạo exception với thông tin chi tiết về booking đang Pending
                        var exception = new InvalidOperationException("Bạn đang có đơn đặt vé chưa thanh toán. Vui lòng thanh toán hoặc hủy đơn đặt vé trước đó để tiếp tục.");

                        // Thêm data vào exception để frontend có thể hiển thị thông tin
                        exception.Data.Add("PendingBookingDetails", pendingBooking);
                        throw exception;
                    }
                }

                // Lấy thông tin suất chiếu
                var showtime = await _context.Showtimes
                    .Include(s => s.Movie)
                    .Include(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(s => s.Showtime_ID == request.Showtime_ID);

                if (showtime == null)
                {
                    throw new KeyNotFoundException("Không tìm thấy suất chiếu");
                }

                // Kiểm tra thời gian đặt vé
                if (showtime.Show_Date.Date < DateTime.Today ||
                    (showtime.Show_Date.Date == DateTime.Today && showtime.Start_Time <= DateTime.Now.TimeOfDay))
                {
                    throw new InvalidOperationException("Suất chiếu đã bắt đầu hoặc đã kết thúc");
                }

                // LƯU Ý: Cập nhật câu truy vấn để lọc theo Showtime_ID
                // Kiểm tra xem ghế đã được đặt chưa
                var bookedSeats = await _context.Seats
                    .Where(s => request.Seat_IDs.Contains(s.Seat_ID)
                          && s.Booking_ID != null
                          && s.Showtime_ID == request.Showtime_ID) // Lọc theo suất chiếu
                    .ToListAsync();

                if (bookedSeats.Any())
                {
                    var bookedSeatIds = bookedSeats.Select(s => s.Seat_ID).ToList();
                    throw new InvalidOperationException($"Một số ghế đã được đặt: {string.Join(", ", bookedSeatIds)}");
                }

                // Lấy thông tin ghế cho suất chiếu cụ thể này
                var seats = await _context.Seats
                    .AsNoTracking()
                    .Where(s => request.Seat_IDs.Contains(s.Seat_ID) && s.Showtime_ID == request.Showtime_ID) // Lọc theo suất chiếu
                    .Select(s => new { s.Seat_ID, s.Layout_ID })
                    .ToListAsync();

                if (seats.Count != request.Seat_IDs.Count)
                {
                    // Kiểm tra xem có ghế nào chưa được tạo cho suất chiếu này không
                    var missingSeats = request.Seat_IDs.Except(seats.Select(s => s.Seat_ID)).ToList();
                    if (missingSeats.Any())
                    {
                        _logger.LogWarning($"Một số ghế chưa được tạo cho suất chiếu {request.Showtime_ID}: {string.Join(", ", missingSeats)}");

                        // Kiểm tra xem ghế có tồn tại trong layout không
                        var seatLayoutIds = await _context.Seats
                            .AsNoTracking()
                            .Where(s => missingSeats.Contains(s.Seat_ID))
                            .Select(s => s.Layout_ID)
                            .ToListAsync();

                        if (seatLayoutIds.Any())
                        {
                            _logger.LogWarning("Ghế tồn tại nhưng chưa được tạo cho suất chiếu này");
                            throw new InvalidOperationException("Ghế đã chọn tồn tại nhưng chưa được thiết lập cho suất chiếu này. Vui lòng liên hệ quản trị viên.");
                        }
                        else
                        {
                            throw new ArgumentException("Một số ghế không tồn tại");
                        }
                    }
                    else
                    {
                        throw new ArgumentException("Một số ghế không tồn tại");
                    }
                }

                // Lấy thông tin SeatLayout cho từng ghế
                var layoutIds = seats.Select(s => s.Layout_ID).Distinct().ToList();
                var seatLayouts = await _context.SeatLayouts
                    .AsNoTracking()
                    .Where(sl => layoutIds.Contains(sl.Layout_ID))
                    .ToDictionaryAsync(sl => sl.Layout_ID);

                // Kiểm tra xem có thể lấy được SeatLayout cho tất cả ghế
                foreach (var seat in seats)
                {
                    if (!seatLayouts.TryGetValue(seat.Layout_ID, out var layout))
                    {
                        _logger.LogWarning($"Không tìm thấy SeatLayout cho ghế ID: {seat.Seat_ID}");
                        throw new InvalidOperationException($"Không tìm thấy thông tin layout cho ghế ID: {seat.Seat_ID}");
                    }
                }

                // Lấy thông tin giá vé từ bảng TicketPricing dựa trên loại phòng và loại ghế
                var roomType = showtime.CinemaRoom.Room_Type;

                // Tính tổng tiền dựa trên loại ghế
                decimal totalAmount = 0;
                var ticketPricings = new Dictionary<string, decimal>();

                foreach (var seat in seats)
                {
                    var seatType = seatLayouts[seat.Layout_ID].Seat_Type;

                    // Lấy giá vé từ cache hoặc từ database
                    if (!ticketPricings.TryGetValue(seatType, out var price))
                    {
                        var pricing = await _context.TicketPricings
                            .AsNoTracking()
                            .FirstOrDefaultAsync(p => p.Room_Type == roomType && p.Seat_Type == seatType);

                        if (pricing == null)
                        {
                            throw new InvalidOperationException($"Không tìm thấy thông tin giá vé cho loại phòng {roomType} và loại ghế {seatType}");
                        }

                        price = pricing.Base_Price;
                        ticketPricings[seatType] = price;
                    }

                    totalAmount += price;
                }

                // Tạo đơn đặt vé mới
                var booking = new TicketBooking
                {
                    User_ID = isStaffBooking ? null : userId, // Nếu đặt tại quầy, User_ID là null
                    Created_By = userId, // Nhân viên hoặc khách hàng tạo đơn
                    Showtime_ID = request.Showtime_ID,
                    Booking_Date = DateTime.Now,
                    Total_Amount = totalAmount,
                    Status = "Pending",
                    Payment_Deadline = DateTime.Now.AddMinutes(isStaffBooking ? 15 : 5), // Thời gian lâu hơn cho đặt tại quầy
                };

                _context.TicketBookings.Add(booking);

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException ex)
                {
                    _logger.LogError($"Database error when creating booking: {ex.Message}");
                    _logger.LogError($"Inner exception: {ex.InnerException?.Message}");

                    if (ex.InnerException?.Message.Contains("FK_Ticket_Bookings_Creators") == true)
                    {
                        _logger.LogError($"Foreign key constraint violation. Created_By: {booking.Created_By}, User_ID: {booking.User_ID}");
                    }

                    throw;
                }

                // Cập nhật trạng thái ghế và liên kết với Booking_ID
                var seatsToUpdate = await _context.Seats
                    .Where(s => request.Seat_IDs.Contains(s.Seat_ID) && s.Showtime_ID == request.Showtime_ID) // Lọc theo suất chiếu
                    .ToListAsync();

                foreach (var seat in seatsToUpdate)
                {
                    seat.Seat_Status = "Reserved";
                    seat.Last_Updated = DateTime.Now;
                    seat.Booking_ID = booking.Booking_ID; // Cập nhật Booking_ID vào ghế
                }

                // Tạo vé cho từng ghế
                var tickets = new List<Ticket>();
                foreach (var seat in seats)
                {
                    var seatType = seatLayouts[seat.Layout_ID].Seat_Type;
                    var price = ticketPricings[seatType];

                    var ticket = new Ticket
                    {
                        Booking_ID = booking.Booking_ID,
                        Seat_ID = seat.Seat_ID,
                        Base_Price = price,
                        Discount_Amount = 0,
                        Final_Price = price,
                        Ticket_Code = Guid.NewGuid().ToString().Substring(0, 8).ToUpper(), // Tạo mã vé ngẫu nhiên
                        Is_Checked_In = false
                    };
                    tickets.Add(ticket);
                }

                // Tạo thanh toán ban đầu nếu cần
                Payment initialPayment = null;
                if (!string.IsNullOrEmpty(request.Payment_Method))
                {
                    initialPayment = new Payment
                    {
                        Booking_ID = booking.Booking_ID,
                        Amount = 0, // Chưa thanh toán thực tế
                        Payment_Method = request.Payment_Method,
                        Payment_Reference = Guid.NewGuid().ToString(),
                        Transaction_Date = DateTime.Now,
                        Payment_Status = "Initiated",
                        Processor_Response = "Payment method selected"
                    };

                    _context.Payments.Add(initialPayment);
                }

                _context.Tickets.AddRange(tickets);

                // Tạo lịch sử đặt vé
                var history = new BookingHistory
                {
                    Booking_ID = booking.Booking_ID,
                    Status = booking.Status,
                    Date = DateTime.Now,
                    Notes = isStaffBooking ? "Đặt vé tại quầy bởi nhân viên" : "Đơn hàng đang chờ xử lý thanh toán"
                };

                _context.BookingHistories.Add(history);
                await _context.SaveChangesAsync();

                // Lấy số điểm hiện tại của người dùng - chỉ áp dụng cho đặt online
                int currentPoints = 0;
                if (!isStaffBooking)
                {
                    currentPoints = await _pointsService.GetUserPointsTotalAsync(userId);
                }

                string formattedSeats = await GetFormattedSeatPositions(booking.Booking_ID);

                // Tạo response
                var response = new BookingResponseDTO
                {
                    Booking_ID = booking.Booking_ID,
                    User_ID = isStaffBooking ? null : userId,
                    Booking_Date = booking.Booking_Date,
                    Payment_Deadline = booking.Payment_Deadline,
                    Total_Amount = booking.Total_Amount,
                    Status = booking.Status,
                    Seats = formattedSeats,
                    Payment_Method = initialPayment?.Payment_Method,
                    IsStaffBooking = isStaffBooking, // Thêm trường này để frontend biết đây là đơn đặt tại quầy

                    // Thêm các trường ánh xạ từ đối tượng con
                    MovieName = showtime.Movie.Movie_Name,
                    RoomName = showtime.CinemaRoom.Room_Name,
                    Show_Date = showtime.Show_Date,
                    Start_Time = showtime.Start_Time,

                    Showtime = new ShowtimeInfoDTO
                    {
                        Showtime_ID = showtime.Showtime_ID,
                        Show_Date = showtime.Show_Date,
                        Start_Time = showtime.Start_Time,
                        Movie = new MovieInfoDTO
                        {
                            Movie_ID = showtime.Movie.Movie_ID,
                            Movie_Name = showtime.Movie.Movie_Name,
                            Duration = showtime.Movie.Duration,
                            Rating = showtime.Movie.Rating,
                            Poster_URL = showtime.Movie.Poster_URL
                        },
                        Room = new RoomDTO
                        {
                            Cinema_Room_ID = showtime.CinemaRoom.Cinema_Room_ID,
                            Room_Name = showtime.CinemaRoom.Room_Name,
                            Room_Type = showtime.CinemaRoom.Room_Type
                        }
                    },
                    Tickets = tickets.Select(t => new TicketDTO
                    {
                        Ticket_ID = t.Ticket_ID,
                        Ticket_Code = t.Ticket_Code,
                        Seat_ID = t.Seat_ID,
                        Price = t.Final_Price,
                        Seat_Status = "Reserved" // Thêm trạng thái ghế
                    }).ToList(),

                    // Thêm thông tin về điểm
                    CurrentPoints = currentPoints
                };

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating booking");
                throw;
            }
        }

        public async Task<BookingResponseDTO> UpdateBookingPayment(int bookingId, int userId)
        {
            _logger.LogInformation($"Starting UpdateBookingPayment for booking {bookingId} by user {userId}");

            // Use transaction with explicit isolation level to prevent concurrency issues
            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            try
            {
                // Lấy thông tin đơn đặt vé
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Tickets)
                    .ThenInclude(t => t.Seat)
                    .Include(b => b.Payments)
                    .Include(b => b.BookingHistories)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogError($"Không tìm thấy đơn đặt vé {bookingId}");
                    await transaction.RollbackAsync();
                    throw new KeyNotFoundException($"Không tìm thấy đơn đặt vé {bookingId}");
                }

                // IMPORTANT: If already confirmed, just return success response
                if (booking.Status == "Confirmed")
                {
                    _logger.LogInformation($"Booking {bookingId} already confirmed, skipping update process");
                    await transaction.CommitAsync();

                    // Return existing confirmed booking details
                    return new BookingResponseDTO
                    {
                        Booking_ID = booking.Booking_ID,
                        User_ID = booking.User_ID,
                        Booking_Date = booking.Booking_Date,
                        Total_Amount = booking.Total_Amount,
                        Status = booking.Status,
                        // Other properties...
                        MovieName = booking.Showtime?.Movie?.Movie_Name,
                        RoomName = booking.Showtime?.CinemaRoom?.Room_Name
                    };
                }

                // Xác định đây là đơn đặt tại quầy hay đơn đặt online
                bool isStaffBooking = booking.Created_By != booking.User_ID || booking.User_ID == null;

                // Kiểm tra quyền - khác nhau giữa đặt online và đặt tại quầy
                if (isStaffBooking)
                {
                    // Đối với đơn đặt tại quầy, chỉ nhân viên mới có quyền thanh toán
                    // CẢNH BÁO: Nếu mô hình phân quyền của bạn yêu cầu nghiêm ngặt hơn,
                    // có thể cần kiểm tra xem staffId có phải nhân viên hay không
                }
                else if (booking.User_ID != userId)
                {
                    // Đối với đơn đặt online, chỉ khách hàng đặt mới có quyền thanh toán
                    _logger.LogWarning($"Người dùng {userId} không có quyền cập nhật đơn đặt vé {bookingId}");
                    await transaction.RollbackAsync();
                    throw new UnauthorizedAccessException("Bạn không có quyền cập nhật đơn đặt vé này");
                }

                // Kiểm tra trạng thái đơn đặt vé - CHỈ CHẤP NHẬN PENDING HOẶC CANCELLED
                if (booking.Status != "Pending" && booking.Status != "Cancelled")
                {
                    _logger.LogWarning($"Đơn đặt vé {bookingId} hiện có trạng thái {booking.Status}, không thể cập nhật");
                    await transaction.RollbackAsync();
                    throw new InvalidOperationException("Đơn đặt vé không ở trạng thái cho phép thanh toán");
                }

                // Kiểm tra xem đơn đặt vé có quá hạn không (chỉ áp dụng cho đơn Pending)
                if (booking.Status == "Pending" && DateTime.Now > booking.Payment_Deadline)
                {
                    _logger.LogWarning($"Đơn đặt vé {bookingId} đã quá hạn thanh toán");

                    try
                    {
                        // Rollback current transaction before starting a new one
                        await transaction.RollbackAsync();

                        // Tự động hủy đơn nếu quá hạn - sử dụng transaction bên trong AutoCancelExpiredBooking
                        var cancelResult = await AutoCancelExpiredBooking(bookingId);
                        _logger.LogInformation($"Đã hủy thành công đơn đặt vé quá hạn {bookingId}");

                        // Lấy thông tin về số điểm đã hoàn trả (nếu có)
                        string pointsMessage = cancelResult.PointsRefunded > 0
                            ? $" và hoàn trả {cancelResult.PointsRefunded} điểm"
                            : "";

                        throw new InvalidOperationException($"Đơn đặt vé đã quá hạn thanh toán và đã bị hủy tự động{pointsMessage}");
                    }
                    catch (Exception ex)
                    {
                        if (ex is InvalidOperationException)
                            throw; // Re-throw nếu là thông báo từ việc hủy thành công

                        _logger.LogError(ex, $"Lỗi khi tự động hủy đơn đặt vé quá hạn {bookingId}");
                        throw new InvalidOperationException("Đơn đặt vé đã quá hạn thanh toán nhưng không thể hủy tự động");
                    }
                }

                try
                {
                    // Nếu đơn đã bị hủy (Cancelled), cần phục hồi ghế
                    if (booking.Status == "Cancelled")
                    {
                        _logger.LogInformation($"Đơn đặt vé {bookingId} đã bị hủy trước đó, đang phục hồi đơn và ghế...");

                        // Lấy danh sách ID ghế từ các vé đã đặt
                        var ticketSeats = booking.Tickets
                            .Where(t => t.Seat_ID != null)
                            .Select(t => t.Seat_ID)
                            .ToList();

                        if (ticketSeats.Count == 0)
                        {
                            _logger.LogWarning($"Không tìm thấy thông tin ghế cho đơn đặt vé {bookingId}");
                            await transaction.RollbackAsync();
                            throw new InvalidOperationException("Không thể phục hồi đơn đặt vé vì không tìm thấy thông tin ghế");
                        }

                        // Kiểm tra xem có ghế nào đã được đặt bởi đơn hàng khác không
                        // LƯU Ý: Cập nhật câu truy vấn để lọc theo Showtime_ID
                        var bookedSeats = await _context.Seats
                            .Where(s => ticketSeats.Contains(s.Seat_ID) &&
                                       s.Showtime_ID == booking.Showtime_ID && // Thêm điều kiện lọc này
                                       s.Booking_ID != null &&
                                       s.Booking_ID != bookingId)
                            .ToListAsync();

                        if (bookedSeats.Any())
                        {
                            var bookedSeatIds = bookedSeats.Select(s => s.Seat_ID).ToList();
                            _logger.LogError($"Không thể khôi phục đơn đặt vé {bookingId} vì các ghế đã được đặt bởi đơn khác: {string.Join(", ", bookedSeatIds)}");
                            await transaction.RollbackAsync();
                            throw new InvalidOperationException("Không thể khôi phục đơn đặt vé vì ghế đã được đặt bởi đơn khác");
                        }

                        // Phục hồi trạng thái ghế và liên kết với booking
                        var seats = await _context.Seats
                            .Where(s => ticketSeats.Contains(s.Seat_ID) && s.Showtime_ID == booking.Showtime_ID) // Thêm điều kiện lọc này
                            .ToListAsync();

                        foreach (var seat in seats)
                        {
                            _logger.LogInformation($"Cập nhật ghế {seat.Seat_ID} từ trạng thái '{seat.Seat_Status}' thành 'Sold'");
                            seat.Seat_Status = "Sold";
                            seat.Booking_ID = bookingId;
                            seat.Last_Updated = DateTime.Now;
                        }

                        // Cập nhật trạng thái của các ticket liên quan
                        var tickets = await _context.Tickets
                            .Where(t => t.Booking_ID == bookingId)
                            .ToListAsync();

                        foreach (var ticket in tickets)
                        {
                            ticket.Status = "Active"; // Khôi phục trạng thái ticket
                        }

                        await _context.SaveChangesAsync();
                    }
                    else // Trạng thái là Pending
                    {
                        // Cập nhật trạng thái ghế
                        // LƯU Ý: Cập nhật câu truy vấn để lọc theo Showtime_ID
                        var seats = await _context.Seats
                            .Where(s => s.Booking_ID == bookingId && s.Showtime_ID == booking.Showtime_ID)
                            .ToListAsync();

                        foreach (var seat in seats)
                        {
                            _logger.LogInformation($"Cập nhật ghế {seat.Seat_ID} từ trạng thái '{seat.Seat_Status}' thành 'Sold'");
                            seat.Seat_Status = "Sold";
                            seat.Last_Updated = DateTime.Now;
                        }

                        await _context.SaveChangesAsync();
                    }

                    // Cập nhật trạng thái đơn đặt vé
                    string oldStatus = booking.Status;
                    booking.Status = "Confirmed";

                    // Cập nhật thanh toán
                    var payment = new Payment
                    {
                        Booking_ID = bookingId,
                        Amount = booking.Total_Amount,
                        Payment_Method = "Online", // Hoặc lấy từ request
                        Payment_Status = "Completed",
                        Transaction_Date = DateTime.Now,
                        Payment_Reference = Guid.NewGuid().ToString(),
                        Processor_Response = "Payment completed successfully"
                    };

                    _context.Payments.Add(payment);

                    // Thêm lịch sử đơn đặt vé
                    var bookingHistory = new BookingHistory
                    {
                        Booking_ID = bookingId,
                        Status = "Confirmed",
                        Date = DateTime.Now,
                        Notes = oldStatus == "Cancelled" ? "Đơn hàng được khôi phục sau khi thanh toán thành công" : "Thanh toán hoàn tất"
                    };

                    _context.BookingHistories.Add(bookingHistory);
                    await _context.SaveChangesAsync();

                    // [phần còn lại của phương thức không cần thay đổi]
                    // ...

                    // Commit the transaction
                    await transaction.CommitAsync();
                    _logger.LogInformation($"Transaction successfully committed for booking {bookingId}");

                    // Lấy thông tin ghế đã định dạng
                    string formattedSeats = await GetFormattedSeatPositions(bookingId);

                    // Tạo response DTO
                    var response = new BookingResponseDTO
                    {
                        Booking_ID = booking.Booking_ID,
                        User_ID = booking.User_ID,
                        Booking_Date = booking.Booking_Date,
                        Total_Amount = booking.Total_Amount,
                        Status = booking.Status,
                        Payment_Method = payment.Payment_Method,
                        Transaction_Date = payment.Transaction_Date,
                        Seats = formattedSeats,
                        IsStaffBooking = isStaffBooking,

                        // Thêm các trường ánh xạ từ đối tượng con
                        MovieName = booking.Showtime.Movie.Movie_Name,
                        RoomName = booking.Showtime.CinemaRoom.Room_Name,
                        Show_Date = booking.Showtime.Show_Date,
                        Start_Time = booking.Showtime.Start_Time,

                        // [phần còn lại không thay đổi]
                    };

                    return response;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error updating booking payment for ID: {bookingId}. Rolling back transaction.");
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Outer exception in UpdateBookingPayment for ID: {bookingId}");
                // Transaction is automatically rolled back if not committed when disposed
                throw;
            }
        }
        /// <summary>
        /// Cập nhật trạng thái đơn hàng thành "Cancelled" khi người dùng hủy thanh toán
        /// </summary>
        public async Task<bool> CancelBooking(int bookingId)
        {
            try
            {
                _logger.LogInformation($"===== BẮT ĐẦU HỦY ĐƠN ĐẶT VÉ {bookingId} =====");

                // Lấy thông tin đặt vé và bao gồm thông tin về suất chiếu
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogWarning($"[ERROR] Không tìm thấy đơn đặt vé {bookingId}");
                    return false;
                }

                // Log chi tiết về booking
                _logger.LogInformation($"[INFO] Chi tiết booking {bookingId}: Status={booking.Status}, " +
                                      $"PromotionID={booking.Promotion_ID}, UserID={booking.User_ID}, " +
                                      $"PointsUsed={booking.Points_Used}, ShowtimeID={booking.Showtime_ID}");

                // Log nếu có mã khuyến mãi
                if (booking.Promotion_ID.HasValue)
                {
                    var promotion = await _context.Promotions.FindAsync(booking.Promotion_ID.Value);
                    if (promotion != null)
                    {
                        _logger.LogInformation($"[PROMOTION] Tìm thấy mã KM: ID={promotion.Promotion_ID}, " +
                                              $"Code={promotion.Promotion_Code}, CurrentUsage={promotion.Current_Usage}");
                    }
                    else
                    {
                        _logger.LogWarning($"[PROMOTION] [ERROR] Không tìm thấy mã KM với ID={booking.Promotion_ID}");
                    }
                }
                else
                {
                    _logger.LogInformation($"[PROMOTION] Booking {bookingId} không có mã khuyến mãi");
                }

                // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        // XỬ LÝ HOÀN TRẢ MÃ KHUYẾN MÃI - KHÔNG KIỂM TRA TRẠNG THÁI
                        if (booking.Promotion_ID.HasValue)
                        {
                            try
                            {
                                _logger.LogInformation($"[PROMOTION] Bắt đầu xử lý hoàn trả KM ID={booking.Promotion_ID}");

                                // Lấy thông tin promotion một lần nữa trong transaction
                                var promotion = await _context.Promotions
                                    .FindAsync(booking.Promotion_ID.Value);

                                if (promotion == null)
                                {
                                    _logger.LogWarning($"[PROMOTION] [ERROR] Không tìm thấy mã KM trong transaction");
                                }
                                else
                                {
                                    _logger.LogInformation($"[PROMOTION] Thông tin KM trong transaction: " +
                                                          $"ID={promotion.Promotion_ID}, Code={promotion.Promotion_Code}, " +
                                                          $"CurrentUsage={promotion.Current_Usage}");

                                    // Tìm các bản ghi Promotion_Usage liên quan đến booking
                                    var promotionUsages = await _context.PromotionUsages
                                        .Where(pu => pu.Booking_ID == bookingId)
                                        .ToListAsync();

                                    _logger.LogInformation($"[PROMOTION] Tìm thấy {promotionUsages.Count} bản ghi PromotionUsages " +
                                                          $"cho booking {bookingId}");

                                    if (promotionUsages.Any())
                                    {
                                        foreach (var usage in promotionUsages)
                                        {
                                            _logger.LogInformation($"[PROMOTION] Chi tiết PromotionUsage: ID={usage.Usage_ID}, " +
                                                                 $"PromotionID={usage.Promotion_ID}, HasUsed={usage.HasUsed}");

                                            usage.HasUsed = false;
                                            _logger.LogInformation($"[PROMOTION] Đã cập nhật HasUsed=false cho Usage_ID={usage.Usage_ID}");
                                        }

                                        // Ghi log trước khi giảm lượt sử dụng
                                        _logger.LogInformation($"[PROMOTION] Chuẩn bị giảm Current_Usage " +
                                                             $"của promotion {promotion.Promotion_ID} " +
                                                             $"từ {promotion.Current_Usage}");

                                        // Giảm lượt sử dụng của mã khuyến mãi
                                        if (promotion.Current_Usage > 0)
                                        {
                                            int oldUsage = promotion.Current_Usage;
                                            promotion.Current_Usage -= 1;
                                            _logger.LogInformation($"[PROMOTION] Đã giảm Current_Usage từ {oldUsage} " +
                                                                 $"xuống {promotion.Current_Usage}");
                                        }
                                        else
                                        {
                                            _logger.LogWarning($"[PROMOTION] [ERROR] Current_Usage đã là 0, không thể giảm thêm");
                                        }

                                        // Thêm BookingHistory cho việc hoàn trả khuyến mãi
                                        var historyEntry = new BookingHistory
                                        {
                                            Booking_ID = bookingId,
                                            Status = "Promotion Refunded",
                                            Date = DateTime.Now,
                                            Notes = $"Hoàn trả KM ID: {booking.Promotion_ID} (Code: {promotion.Promotion_Code})"
                                        };
                                        _context.BookingHistories.Add(historyEntry);
                                        _logger.LogInformation($"[PROMOTION] Đã thêm lịch sử hoàn trả KM");

                                        // Xóa liên kết promotion với booking
                                        var oldPromotionId = booking.Promotion_ID;
                                        booking.Promotion_ID = null;
                                        _logger.LogInformation($"[PROMOTION] Đã xóa liên kết PromotionID={oldPromotionId} từ booking");
                                    }
                                    else
                                    {
                                        _logger.LogWarning($"[PROMOTION] [ERROR] Không tìm thấy PromotionUsage cho booking {bookingId} " +
                                                          $"mặc dù có PromotionID={booking.Promotion_ID}");
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"[PROMOTION] [ERROR] Lỗi khi xử lý hoàn trả KM: {ex.Message}");
                                // Không ném lại ngoại lệ để tiếp tục xử lý
                            }
                        }

                        // Cập nhật trạng thái đơn đặt vé nếu chưa bị hủy
                        if (booking.Status != "Cancelled")
                        {
                            booking.Status = "Cancelled";
                            _logger.LogInformation($"Cập nhật trạng thái booking {bookingId} thành Cancelled");

                            // Cập nhật trạng thái ghế và xóa liên kết với booking_id
                            // LƯU Ý: Cập nhật câu truy vấn để lọc theo Showtime_ID
                            var seats = await _context.Seats
                                .Where(s => s.Booking_ID == bookingId && s.Showtime_ID == booking.Showtime_ID)
                                .ToListAsync();

                            foreach (var seat in seats)
                            {
                                seat.Seat_Status = "Available";
                                seat.Last_Updated = DateTime.Now;
                                seat.Booking_ID = null; // Xóa liên kết với booking
                                _logger.LogInformation($"Đặt lại ghế {seat.Seat_ID} thành Available và xóa liên kết với booking");
                            }

                            // Cập nhật trạng thái ticket
                            var tickets = await _context.Tickets
                                .Where(t => t.Booking_ID == bookingId)
                                .ToListAsync();

                            foreach (var ticket in tickets)
                            {
                                ticket.Status = "Cancelled";
                                _logger.LogInformation($"Cập nhật ticket {ticket.Ticket_ID} thành Cancelled");
                            }

                            // Thêm lịch sử hủy đơn
                            var bookingHistory = new BookingHistory
                            {
                                Booking_ID = bookingId,
                                Status = "Cancelled",
                                Date = DateTime.Now,
                                Notes = "Đơn đặt vé đã bị hủy"
                            };

                            _context.BookingHistories.Add(bookingHistory);
                        }
                        else
                        {
                            _logger.LogInformation($"Booking {bookingId} đã ở trạng thái Cancelled, không cần cập nhật trạng thái");
                        }

                        // Lưu thay đổi và theo dõi số bản ghi bị ảnh hưởng
                        int changedRecords = await _context.SaveChangesAsync();
                        _logger.LogInformation($"Đã lưu thay đổi: {changedRecords} bản ghi bị ảnh hưởng");

                        // Commit transaction
                        await transaction.CommitAsync();
                        _logger.LogInformation($"===== HỦY ĐƠN ĐẶT VÉ {bookingId} THÀNH CÔNG =====");

                        return true;
                    }
                    catch (Exception ex)
                    {
                        // Rollback nếu có lỗi
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, $"[ERROR] Lỗi transaction khi hủy đơn {bookingId}: {ex.Message}");
                        _logger.LogInformation($"Đã rollback transaction do lỗi");
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[ERROR] Lỗi không xử lý được khi hủy đơn {bookingId}: {ex.Message}");
                return false;
            }
        }

        public async Task<IEnumerable<BookingHistoryDTO>> GetUserBookings(int userId)
        {
            try
            {
                // Lấy danh sách đơn đặt vé
                var bookings = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Payments)  // Include payments
                    .Include(b => b.BookingHistories)  // Include booking histories
                    .Where(b => b.User_ID == userId)
                    .OrderByDescending(b => b.Booking_Date)
                    .ToListAsync();

                var result = new List<BookingHistoryDTO>();

                foreach (var b in bookings)
                {
                    // Lấy thông tin thanh toán mới nhất
                    var latestPayment = b.Payments.OrderByDescending(p => p.Transaction_Date).FirstOrDefault();

                    // Lấy thông tin hủy đơn nếu có
                    var cancellation = b.BookingHistories
                        .Where(h => h.Status == "Cancelled")
                        .OrderByDescending(h => h.Date)
                        .FirstOrDefault();

                    var bookingHistory = new BookingHistoryDTO
                    {
                        Booking_ID = b.Booking_ID,
                        Booking_Date = b.Booking_Date,
                        Total_Amount = b.Total_Amount,
                        Status = b.Status,
                        Payment_Method = latestPayment?.Payment_Method,
                        Payment_Date = latestPayment?.Transaction_Date,
                        Cancellation_Date = cancellation?.Date,
                        PointsEarned = b.Points_Earned,
                        Showtime = new ShowtimeInfoDTO
                        {
                            Showtime_ID = b.Showtime.Showtime_ID,
                            Show_Date = b.Showtime.Show_Date,
                            Start_Time = b.Showtime.Start_Time,
                            Movie = new MovieInfoDTO
                            {
                                Movie_ID = b.Showtime.Movie.Movie_ID,
                                Movie_Name = b.Showtime.Movie.Movie_Name,
                                Duration = b.Showtime.Movie.Duration,
                                Rating = b.Showtime.Movie.Rating,
                                Poster_URL = b.Showtime.Movie.Poster_URL
                            },
                            Room = new RoomDTO
                            {
                                Cinema_Room_ID = b.Showtime.CinemaRoom.Cinema_Room_ID,
                                Room_Name = b.Showtime.CinemaRoom.Room_Name,
                                Room_Type = b.Showtime.CinemaRoom.Room_Type
                            }
                        }
                    };

                    result.Add(bookingHistory);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                throw;
            }
        }

        public async Task<BookingDetailDto> GetBookingDetail(int bookingId)
        {
            // Lấy thông tin đơn đặt vé từ cơ sở dữ liệu
            var booking = await _context.TicketBookings
                .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                .Include(b => b.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                .Include(b => b.Tickets)
                .Include(b => b.Payments)
                .Include(b => b.BookingHistories)
                .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

            if (booking == null)
            {
                throw new KeyNotFoundException("Không tìm thấy đặt vé");
            }

            // Khởi tạo giá trị mặc định cho thông tin ghế
            string seatPositionsString = "Không có thông tin ghế";

            try
            {
                // Sử dụng EF Core thay vì ADO.NET trực tiếp
                var seatInfo = await _context.Tickets
                    .Where(t => t.Booking_ID == bookingId)
                    .Join(_context.Seats,
                          t => t.Seat_ID,
                          s => s.Seat_ID,
                          (t, s) => new { s.Layout_ID, SeatId = s.Seat_ID })
                    .Join(_context.SeatLayouts,
                          ts => ts.Layout_ID,
                          sl => sl.Layout_ID,
                          (ts, sl) => new { sl.Row_Label, sl.Column_Number })
                    .ToListAsync();

                if (seatInfo.Any())
                {
                    var seatCodes = seatInfo.Select(s => s.Row_Label + s.Column_Number.ToString());
                    seatPositionsString = string.Join(", ", seatCodes);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving seat information for booking {bookingId}");
                // Giữ giá trị mặc định nếu có lỗi
            }

            // Tạo DTO với thông tin đã lấy được
            var result = new BookingDetailDto
            {
                Booking_ID = booking.Booking_ID,
                MovieName = booking.Showtime.Movie.Movie_Name,
                RoomName = booking.Showtime.CinemaRoom.Room_Name,
                Show_Date = booking.Showtime.Show_Date,
                Start_Time = booking.Showtime.Start_Time,
                Total_Amount = booking.Total_Amount,
                Status = booking.Status,
                Payment_Deadline = booking.Payment_Deadline,
                Seats = seatPositionsString, // Gán thông tin ghế đã lấy được
                Payment_Method = booking.Payments?.OrderByDescending(p => p.Transaction_Date)
                    .FirstOrDefault()?.Payment_Method,
                Transaction_Date = booking.Payments?.OrderByDescending(p => p.Transaction_Date)
                    .FirstOrDefault()?.Transaction_Date ?? DateTime.MinValue,
                Booking_Date = booking.Booking_Date,
                Cancellation_Date = DateTime.MinValue,
                User_ID = booking.User_ID,
                PointsEarned = booking.Points_Earned,
                Showtime = new ShowtimeDetailDTO
                {
                    Showtime_ID = booking.Showtime.Showtime_ID,
                    Show_Date = booking.Showtime.Show_Date,
                    Start_Time = booking.Showtime.Start_Time,
                    Room = new RoomDTO
                    {
                        Cinema_Room_ID = booking.Showtime.CinemaRoom.Cinema_Room_ID,
                        Room_Name = booking.Showtime.CinemaRoom.Room_Name,
                        Room_Type = booking.Showtime.CinemaRoom.Room_Type
                    },
                    Movie = new MovieInfoDTO
                    {
                        Movie_ID = booking.Showtime.Movie.Movie_ID,
                        Movie_Name = booking.Showtime.Movie.Movie_Name,
                        Duration = booking.Showtime.Movie.Duration,
                        Rating = booking.Showtime.Movie.Rating,
                        Poster_URL = booking.Showtime.Movie.Poster_URL
                    }
                },
                Tickets = booking.Tickets.Select(t => new TicketDTO
                {
                    Ticket_ID = t.Ticket_ID,
                    Ticket_Code = t.Ticket_Code,
                    Seat_ID = t.Seat_ID,
                    Seat_Status = t.Seat?.Seat_Status,
                    Price = t.Final_Price
                }).ToList()
            };

            return result;
        }
        private async Task<string> GetFormattedSeatPositions(int bookingId)
        {
            try
            {
                // Lấy thông tin booking để biết Showtime_ID
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogWarning($"Không tìm thấy booking với ID {bookingId}");
                    return null;
                }

                int showtimeId = booking.Showtime_ID;
                _logger.LogInformation($"Đang lấy thông tin ghế cho đặt vé {bookingId}, suất chiếu {showtimeId}");

                // Lấy thông tin ghế dùng Entity Framework với các điều kiện phù hợp
                var seatInfo = await (from t in _context.Tickets
                                      join s in _context.Seats on t.Seat_ID equals s.Seat_ID
                                      join sl in _context.SeatLayouts on s.Layout_ID equals sl.Layout_ID
                                      where t.Booking_ID == bookingId && s.Showtime_ID == showtimeId
                                      select new { sl.Row_Label, sl.Column_Number })
                                  .ToListAsync();

                if (seatInfo.Any())
                {
                    var seatCodes = seatInfo.Select(si => si.Row_Label + si.Column_Number.ToString()).ToList();
                    string formattedSeats = string.Join(", ", seatCodes);
                    _logger.LogInformation($"Đã tìm thấy ghế: {formattedSeats}");
                    return formattedSeats;
                }
                else
                {
                    _logger.LogWarning($"Không tìm thấy thông tin ghế cho đặt vé {bookingId}");

                    // Fallback: Thử cách khác nếu cách trên không có kết quả
                    string connectionString = _context.Database.GetDbConnection().ConnectionString;
                    using (SqlConnection connection = new SqlConnection(connectionString))
                    {
                        await connection.OpenAsync();
                        string query = @"
                SELECT t.Ticket_ID, t.Seat_ID, s.Layout_ID, s.Showtime_ID, sl.Row_Label, sl.Column_Number
                FROM Tickets t
                JOIN Seats s ON t.Seat_ID = s.Seat_ID
                JOIN Seat_Layout sl ON s.Layout_ID = sl.Layout_ID
                WHERE t.Booking_ID = @BookingId AND s.Showtime_ID = @ShowtimeId";

                        using (SqlCommand command = new SqlCommand(query, connection))
                        {
                            command.Parameters.AddWithValue("@BookingId", bookingId);
                            command.Parameters.AddWithValue("@ShowtimeId", showtimeId);
                            List<string> seatCodes = new List<string>();

                            using (SqlDataReader reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    string rowLabel = reader.GetString(4); // Row_Label
                                    int columnNumber = reader.GetInt32(5); // Column_Number
                                    string seatCode = rowLabel + columnNumber.ToString();
                                    seatCodes.Add(seatCode);
                                    _logger.LogInformation($"Ghế tìm thấy: {seatCode}");
                                }
                            }

                            if (seatCodes.Any())
                            {
                                string result = string.Join(", ", seatCodes);
                                _logger.LogInformation($"Đã tìm thấy ghế (phương thức fallback): {result}");
                                return result;
                            }
                        }
                    }

                    return "Không có thông tin ghế";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin ghế cho đặt vé {bookingId}");
                return "Lỗi khi lấy thông tin ghế";
            }
        }

        public async Task<BookingResponseDTO> AutoCancelExpiredBooking(int bookingId)
        {
            _logger.LogInformation($"Bắt đầu tự động hủy đơn đặt vé quá hạn {bookingId}");

            try
            {
                // Sử dụng transaction để đảm bảo tính nhất quán
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Lấy thông tin đơn đặt vé
                    var booking = await _context.TicketBookings
                        .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                        .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                        .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                    if (booking == null)
                    {
                        _logger.LogError($"Không tìm thấy đơn đặt vé {bookingId}");
                        throw new KeyNotFoundException($"Không tìm thấy đơn đặt vé {bookingId}");
                    }

                    _logger.LogInformation($"Tự động hủy đơn đặt vé ID: {bookingId}, User: {booking.User_ID}, Points: {booking.Points_Used}");

                    // Hoàn trả điểm nếu booking có sử dụng điểm
                    int refundedPoints = 0;
                    if (booking.Points_Used > 0)
                    {
                        try
                        {
                            refundedPoints = booking.Points_Used;
                            _logger.LogInformation($"Đang hoàn trả {refundedPoints} điểm cho người dùng {booking.User_ID} từ booking {bookingId}");

                            await _pointsService.RefundPointsForExpiredBookingAsync(
                                booking.Booking_ID,
                                booking.User_ID.Value,
                                refundedPoints
                            );

                            // Ghi lại trong lịch sử booking
                            var pointsRefundHistory = new BookingHistory
                            {
                                Booking_ID = booking.Booking_ID,
                                Status = "Points Refunded",
                                Date = DateTime.Now,
                                Notes = $"Hoàn trả {refundedPoints} điểm do hết hạn thanh toán"
                            };
                            _context.BookingHistories.Add(pointsRefundHistory);

                            // Đặt lại Points_Used sau khi đã hoàn điểm
                            booking.Points_Used = 0;
                            await _context.SaveChangesAsync();

                            _logger.LogInformation($"Đã hoàn trả điểm thành công cho booking {bookingId}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho booking {bookingId}, User ID: {booking.User_ID}");
                            // Vẫn tiếp tục với các bước còn lại
                        }
                    }

                    // Cập nhật trạng thái đơn đặt vé
                    string oldStatus = booking.Status;
                    booking.Status = "Cancelled";

                    // Cập nhật trạng thái ghế và xóa liên kết với Booking_ID
                    // LƯU Ý: Cập nhật câu truy vấn để lọc theo Showtime_ID
                    var seats = await _context.Seats
                        .Where(s => s.Booking_ID == bookingId && s.Showtime_ID == booking.Showtime_ID)
                        .ToListAsync();

                    foreach (var seat in seats)
                    {
                        _logger.LogInformation($"Cập nhật ghế {seat.Seat_ID} từ trạng thái '{seat.Seat_Status}' thành 'Available'");
                        seat.Seat_Status = "Available";
                        seat.Last_Updated = DateTime.Now;
                        seat.Booking_ID = null; // Xóa liên kết với Booking_ID
                    }

                    // THÊM MỚI: Cập nhật Promotion_Usage
                    if (booking.Promotion_ID.HasValue)
                    {
                        // [Phần xử lý promotion giữ nguyên]
                        // ...
                    }

                    // Cập nhật trạng thái của các ticket liên quan
                    var tickets = await _context.Tickets
                        .Where(t => t.Booking_ID == bookingId)
                        .ToListAsync();

                    foreach (var ticket in tickets)
                    {
                        ticket.Status = "Cancelled";
                    }

                    // Thêm lịch sử hủy đơn
                    var bookingHistory = new BookingHistory
                    {
                        Booking_ID = booking.Booking_ID,
                        Status = "Cancelled",
                        Date = DateTime.Now,
                        Notes = "Hủy tự động do quá hạn thanh toán"
                    };

                    _context.BookingHistories.Add(bookingHistory);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                    _logger.LogInformation($"Đã commit transaction hủy đơn đặt vé {bookingId}");

                    // Tạo response DTO
                    var response = new BookingResponseDTO
                    {
                        Booking_ID = booking.Booking_ID,
                        User_ID = booking.User_ID,
                        Booking_Date = booking.Booking_Date,
                        Total_Amount = booking.Total_Amount,
                        Status = booking.Status,
                        Cancellation_Date = DateTime.Now,
                        PointsRefunded = refundedPoints,
                        MovieName = booking.Showtime?.Movie?.Movie_Name,
                        RoomName = booking.Showtime?.CinemaRoom?.Room_Name,
                        Show_Date = booking.Showtime?.Show_Date ?? DateTime.MinValue,
                        Start_Time = booking.Showtime?.Start_Time ?? TimeSpan.Zero
                    };

                    return response;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, $"Lỗi và đã rollback khi tự động hủy đơn đặt vé {bookingId}");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error auto-cancelling booking for ID: {bookingId}");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra xem người dùng có booking đang ở trạng thái Pending không
        /// Nếu có, người dùng cần hủy booking cũ trước khi đặt mới
        /// </summary>
        /// <param name="userId">ID của người dùng</param>
        /// <param name="userId">ID của người dùng</param>
        /// <returns>Thông tin về booking Pending hoặc null nếu không có</returns>
        public async Task<PendingBookingCheckDTO> CheckPendingBooking(int userId)
        {
            try
            {
                _logger.LogInformation($"Kiểm tra booking Pending của người dùng {userId}");

                // Tìm booking gần nhất đang ở trạng thái Pending của người dùng
                var pendingBooking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .Where(b => b.User_ID == userId && b.Status == "Pending")
                    .OrderByDescending(b => b.Booking_Date)
                    .FirstOrDefaultAsync();

                if (pendingBooking == null)
                {
                    _logger.LogInformation($"Không tìm thấy booking Pending cho người dùng {userId}");
                    return null;
                }

                _logger.LogInformation($"Tìm thấy booking Pending ID: {pendingBooking.Booking_ID} cho người dùng {userId}");

                // Lấy thông tin ghế
                string formattedSeats = await GetFormattedSeatPositions(pendingBooking.Booking_ID);

                // Kiểm tra xem booking có quá hạn không
                bool isExpired = DateTime.Now > pendingBooking.Payment_Deadline;

                // Nếu booking đã quá hạn, tự động hủy và cho phép đặt mới
                if (isExpired)
                {
                    _logger.LogInformation($"Booking {pendingBooking.Booking_ID} đã quá hạn thanh toán, tự động hủy");
                    try
                    {
                        await AutoCancelExpiredBooking(pendingBooking.Booking_ID);
                        return null; // Trả về null để cho phép đặt vé mới
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi tự động hủy booking quá hạn {pendingBooking.Booking_ID}");
                        // Vẫn trả về thông tin booking để người dùng tự hủy
                    }
                }

                // Trả về thông tin về booking Pending
                return new PendingBookingCheckDTO
                {
                    Booking_ID = pendingBooking.Booking_ID,
                    Booking_Date = pendingBooking.Booking_Date,
                    Payment_Deadline = pendingBooking.Payment_Deadline,
                    IsExpired = isExpired,
                    Seats = formattedSeats,
                    Total_Amount = pendingBooking.Total_Amount,
                    MovieName = pendingBooking.Showtime.Movie.Movie_Name,
                    RoomName = pendingBooking.Showtime.CinemaRoom.Room_Name,
                    Show_Date = pendingBooking.Showtime.Show_Date,
                    Start_Time = pendingBooking.Showtime.Start_Time,
                    RemainingMinutes = isExpired ? 0 : (int)Math.Ceiling((pendingBooking.Payment_Deadline - DateTime.Now).TotalMinutes)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi kiểm tra booking Pending của người dùng {userId}");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra xem nhân viên có booking đang ở trạng thái Pending không
        /// Nếu có, nhân viên cần hủy booking cũ trước khi đặt mới
        /// </summary>
        /// <param name="staffId">ID của nhân viên</param>
        /// <returns>Thông tin về booking Pending hoặc null nếu không có</returns>
        public async Task<PendingBookingCheckDTO> CheckPendingBookingForStaff(int staffId)
        {
            try
            {
                _logger.LogInformation($"Kiểm tra booking Pending của nhân viên {staffId}");

                // Tìm booking gần nhất đang ở trạng thái Pending được tạo bởi nhân viên
                var pendingBooking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .Where(b => b.Created_By == staffId && b.Status == "Pending" && b.User_ID == null)
                    .OrderByDescending(b => b.Booking_Date)
                    .FirstOrDefaultAsync();

                if (pendingBooking == null)
                {
                    _logger.LogInformation($"Không tìm thấy booking Pending cho nhân viên {staffId}");
                    return null;
                }

                _logger.LogInformation($"Tìm thấy booking Pending ID: {pendingBooking.Booking_ID} của nhân viên {staffId}");

                // Lấy thông tin ghế
                string formattedSeats = await GetFormattedSeatPositions(pendingBooking.Booking_ID);

                // Kiểm tra xem booking có quá hạn không
                bool isExpired = DateTime.Now > pendingBooking.Payment_Deadline;

                // Nếu booking đã quá hạn, tự động hủy và cho phép đặt mới
                if (isExpired)
                {
                    _logger.LogInformation($"Booking {pendingBooking.Booking_ID} đã quá hạn thanh toán, tự động hủy");
                    try
                    {
                        await AutoCancelExpiredBooking(pendingBooking.Booking_ID);
                        return null; // Trả về null để cho phép đặt vé mới
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi tự động hủy booking quá hạn {pendingBooking.Booking_ID}");
                        // Vẫn trả về thông tin booking để nhân viên tự hủy
                    }
                }

                // Trả về thông tin về booking Pending
                return new PendingBookingCheckDTO
                {
                    Booking_ID = pendingBooking.Booking_ID,
                    Booking_Date = pendingBooking.Booking_Date,
                    Payment_Deadline = pendingBooking.Payment_Deadline,
                    IsExpired = isExpired,
                    Seats = formattedSeats,
                    Total_Amount = pendingBooking.Total_Amount,
                    MovieName = pendingBooking.Showtime.Movie.Movie_Name,
                    RoomName = pendingBooking.Showtime.CinemaRoom.Room_Name,
                    Show_Date = pendingBooking.Showtime.Show_Date,
                    Start_Time = pendingBooking.Showtime.Start_Time,
                    RemainingMinutes = isExpired ? 0 : (int)Math.Ceiling((pendingBooking.Payment_Deadline - DateTime.Now).TotalMinutes)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi kiểm tra booking Pending của nhân viên {staffId}");
                throw;
            }
        }

        /// <summary>
        /// Liên kết booking với khách hàng thành viên
        /// </summary>
        /// <param name="bookingId">ID của booking</param>
        /// <param name="memberIdentifier">Số điện thoại hoặc email của khách hàng</param>
        /// <param name="staffId">ID của nhân viên thực hiện thao tác</param>
        /// <returns>Thông tin booking đã cập nhật</returns>
        public async Task<BookingResponseDTO> LinkBookingToMemberAsync(int bookingId, string memberIdentifier, int currentUserId)
        {
            try
            {
                // Lấy thông tin người dùng hiện tại để kiểm tra role
                var currentUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.User_ID == currentUserId);

                if (currentUser == null)
                {
                    throw new KeyNotFoundException($"Không tìm thấy thông tin người dùng với ID {currentUserId}");
                }

                // Kiểm tra xem người thực hiện thao tác có phải là nhân viên không
                bool isStaff = currentUser.Role == "Staff" || currentUser.Role == "Admin";

                if (!isStaff)
                {
                    throw new UnauthorizedAccessException("Chỉ nhân viên mới có quyền liên kết booking với thành viên");
                }

                _logger.LogInformation($"Liên kết booking {bookingId} với khách hàng {memberIdentifier} bởi nhân viên {currentUserId}");

                // Phần còn lại giữ nguyên như cũ
                // Kiểm tra booking có tồn tại không
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .Include(b => b.Tickets)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    throw new KeyNotFoundException($"Không tìm thấy booking với ID {bookingId}");
                }

                // Kiểm tra trạng thái booking - chỉ cho phép liên kết khi đang Pending
                if (booking.Status != "Pending")
                {
                    throw new InvalidOperationException($"Chỉ có thể liên kết thành viên cho booking có trạng thái Pending");
                }

                // Kiểm tra xem booking đã được liên kết với khách hàng khác chưa
                if (booking.User_ID != null && booking.User_ID > 0)
                {
                    throw new InvalidOperationException($"Booking này đã được liên kết với khách hàng khác (ID: {booking.User_ID})");
                }

                // Tìm khách hàng dựa trên số điện thoại hoặc email
                User member = null;
                if (memberIdentifier.Contains("@"))
                {
                    // Tìm theo email
                    member = await _memberService.FindMemberByEmailAsync(memberIdentifier);
                }
                else
                {
                    // Tìm theo số điện thoại
                    member = await _memberService.FindMemberByPhoneAsync(memberIdentifier);
                }

                if (member == null)
                {
                    throw new KeyNotFoundException($"Không tìm thấy thành viên với thông tin: {memberIdentifier}");
                }

                // Cập nhật booking với User_ID của khách hàng
                booking.User_ID = member.User_ID;

                // Thêm lịch sử booking
                var history = new BookingHistory
                {
                    Booking_ID = booking.Booking_ID,
                    Status = "Member Linked",
                    Date = DateTime.Now,
                    Notes = $"Liên kết với thành viên {member.Full_Name} (ID: {member.User_ID}) bởi nhân viên ID: {currentUserId}"
                };

                _context.BookingHistories.Add(history);
                await _context.SaveChangesAsync();

                // Lấy thông tin ghế
                string formattedSeats = await GetFormattedSeatPositions(bookingId);

                // Lấy điểm hiện tại của khách hàng
                int currentPoints = await _pointsService.GetUserPointsTotalAsync(member.User_ID);

                // Tạo response
                var response = new BookingResponseDTO
                {
                    Booking_ID = booking.Booking_ID,
                    User_ID = member.User_ID,
                    Booking_Date = booking.Booking_Date,
                    Payment_Deadline = booking.Payment_Deadline,
                    Total_Amount = booking.Total_Amount,
                    Status = booking.Status,
                    Seats = formattedSeats,

                    // Thêm thông tin từ các đối tượng con
                    MovieName = booking.Showtime.Movie.Movie_Name,
                    RoomName = booking.Showtime.CinemaRoom.Room_Name,
                    Show_Date = booking.Showtime.Show_Date,
                    Start_Time = booking.Showtime.Start_Time,

                    // Thêm thông tin về điểm hiện tại
                    CurrentPoints = currentPoints,

                    // Thêm thông tin về thành viên
                    MemberInfo = new MemberInfoDTO
                    {
                        User_ID = member.User_ID,
                        Full_Name = member.Full_Name,
                        Phone_Number = member.Phone_Number,
                        Email = member.Email
                    }
                };

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi liên kết booking {bookingId} với thành viên {memberIdentifier}");
                throw;
            }
        }
    }
}


