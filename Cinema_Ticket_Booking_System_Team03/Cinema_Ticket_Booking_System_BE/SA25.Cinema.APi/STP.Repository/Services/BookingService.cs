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
        public BookingService(CinemaDbContext context, ILogger<BookingService> logger, PayOSNugetService payosService, PointsService pointsService, MemberService memberService)
        {
            _context = context;
            _logger = logger;
            _payosService = payosService;
            _pointsService = pointsService;
            _memberService = memberService;
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
                    // THÊM MỚI: Kiểm tra xem người dùng có booking đang Pending không
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

                // Kiểm tra xem ghế đã được đặt chưa
                var bookedSeats = await _context.Seats
                    .Where(s => request.Seat_IDs.Contains(s.Seat_ID) && s.Booking_ID != null)
                    .ToListAsync();

                if (bookedSeats.Any())
                {
                    var bookedSeatIds = bookedSeats.Select(s => s.Seat_ID).ToList();
                    throw new InvalidOperationException($"Một số ghế đã được đặt: {string.Join(", ", bookedSeatIds)}");
                }

                // Lấy thông tin ghế - chỉ lấy các thuộc tính cần thiết để tránh lỗi SeatLayoutLayout_ID
                var seats = await _context.Seats
                    .AsNoTracking() // Không theo dõi thay đổi để tránh các vấn đề về navigation properties
                    .Where(s => request.Seat_IDs.Contains(s.Seat_ID))
                    .Select(s => new { s.Seat_ID, s.Layout_ID })
                    .ToListAsync();

                if (seats.Count != request.Seat_IDs.Count)
                {
                    throw new ArgumentException("Một số ghế không tồn tại");
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
                    .Where(s => request.Seat_IDs.Contains(s.Seat_ID))
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
                    Notes = isStaffBooking ? "Đặt vé tại quầy bởi nhân viên" : null
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
                        var bookedSeats = await _context.Seats
                            .Where(s => ticketSeats.Contains(s.Seat_ID) && s.Booking_ID != null && s.Booking_ID != bookingId)
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
                            .Where(s => ticketSeats.Contains(s.Seat_ID))
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
                        var seats = await _context.Seats
                            .Where(s => s.Booking_ID == bookingId)
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
                        Notes = oldStatus == "Cancelled" ? "Đơn hàng được khôi phục sau khi thanh toán thành công" : null
                    };

                    _context.BookingHistories.Add(bookingHistory);
                    await _context.SaveChangesAsync();

                    // Thêm điểm thưởng khi thanh toán thành công (5% của số tiền thực tế thanh toán)
                    int pointsEarned = 0;
                    int currentPoints = 0;
                    try
                    {
                        // Chỉ thêm điểm nếu trước đó đơn hàng là Pending và có User_ID
                        if (oldStatus == "Pending" && booking.User_ID.HasValue && booking.User_ID > 0)
                        {
                            pointsEarned = await _pointsService.AddPointsFromBookingAsync(
                                booking.User_ID.Value, // Sử dụng User_ID từ booking thay vì staffId
                                bookingId,
                                booking.Total_Amount,
                                0 // Không có pointsUsed
                            );

                            booking.Points_Earned = pointsEarned;
                            await _context.SaveChangesAsync();

                            _logger.LogInformation($"Đã thêm {pointsEarned} điểm cho booking {bookingId}, user {booking.User_ID}");

                            // Cập nhật lịch sử đặt vé để ghi nhận việc thêm điểm
                            var pointsHistory = new BookingHistory
                            {
                                Booking_ID = bookingId,
                                Status = "Points Earned",
                                Date = DateTime.Now,
                                Notes = $"Đã thêm {pointsEarned} điểm thưởng"
                            };

                            _context.BookingHistories.Add(pointsHistory);
                            await _context.SaveChangesAsync();

                            // Lấy số điểm hiện tại của người dùng
                            currentPoints = await _pointsService.GetUserPointsTotalAsync(booking.User_ID.Value);
                        }
                        else
                        {
                            _logger.LogInformation($"Không thêm điểm cho booking {bookingId} - Status: {oldStatus}, User_ID: {booking.User_ID}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi thêm điểm cho booking {bookingId}, nhưng vẫn tiếp tục xử lý");
                        // Không throw exception ở đây để tránh ảnh hưởng đến quá trình thanh toán
                    }

                    // CRITICAL: Commit the transaction - the missing piece!
                    await transaction.CommitAsync();
                    _logger.LogInformation($"Transaction successfully committed for booking {bookingId}");

                    // Lấy thông tin ghế đã định dạng
                    string formattedSeats = await GetFormattedSeatPositions(bookingId);

                    // Tạo response DTO
                    var response = new BookingResponseDTO
                    {
                        Booking_ID = booking.Booking_ID,
                        User_ID = booking.User_ID, // Có thể là null cho booking tại quầy không liên kết member
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

                        // Thêm thông tin về điểm
                        PointsEarned = pointsEarned,
                        CurrentPoints = currentPoints
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

        public async Task<BookingResponseDTO> CancelBooking(int bookingId, int userId)
        {
            try
            {
                // Sử dụng transaction để đảm bảo tính nhất quán
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Lấy thông tin đơn đặt vé kèm thông tin thanh toán
                    var booking = await _context.TicketBookings
                        .Include(b => b.Showtime)
                        .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                    if (booking == null)
                        throw new KeyNotFoundException("Không tìm thấy đơn đặt vé");

                    // Kiểm tra quyền hạn
                    if (booking.User_ID != userId)
                        throw new UnauthorizedAccessException("Bạn không có quyền hủy đơn đặt vé này");

                    // Kiểm tra trạng thái đơn hàng - chỉ cho phép hủy đơn Pending
                    if (booking.Status != "Pending")
                        throw new InvalidOperationException($"Không thể hủy đơn hàng có trạng thái {booking.Status}");

                    // Lấy thông tin thanh toán từ bảng Payment
                    var payment = await _context.Payments
                        .Where(p => p.Booking_ID == bookingId)
                        .OrderByDescending(p => p.Transaction_Date)
                        .FirstOrDefaultAsync();

                    // Cập nhật trạng thái đơn đặt vé
                    string oldStatus = booking.Status;
                    booking.Status = "Cancelled";

                    // Cập nhật trạng thái ghế và xóa liên kết với Booking_ID
                    var seats = await _context.Seats
                        .Where(s => s.Booking_ID == bookingId)
                        .ToListAsync();

                    foreach (var seat in seats)
                    {
                        seat.Seat_Status = "Available";
                        seat.Last_Updated = DateTime.Now;
                        seat.Booking_ID = null; // Xóa liên kết với Booking_ID
                    }

                    // Thêm lịch sử hủy đơn
                    var bookingHistory = new BookingHistory
                    {
                        Booking_ID = booking.Booking_ID,
                        Status = "Cancelled",
                        Date = DateTime.Now,
                        Notes = "Hủy đơn bởi người dùng"
                    };

                    _context.BookingHistories.Add(bookingHistory);

                    // Cập nhật trạng thái của các ticket liên quan
                    var tickets = await _context.Tickets
                        .Where(t => t.Booking_ID == bookingId)
                        .ToListAsync();

                    foreach (var ticket in tickets)
                    {
                        ticket.Status = "Cancelled";
                    }

                    // THÊM MỚI: Hoàn trả điểm nếu booking có sử dụng điểm
                    int refundedPoints = 0;
                    if (booking.Points_Used > 0)
                    {
                        try
                        {
                            refundedPoints = booking.Points_Used;
                            _logger.LogInformation($"Đang hoàn trả {refundedPoints} điểm cho người dùng {userId} từ booking {bookingId}");

                            await _pointsService.RefundPointsForExpiredBookingAsync(
                                booking.Booking_ID,
                                userId,
                                refundedPoints
                            );

                            // Ghi lại trong lịch sử booking
                            var pointsRefundHistory = new BookingHistory
                            {
                                Booking_ID = booking.Booking_ID,
                                Status = "Points Refunded",
                                Date = DateTime.Now,
                                Notes = $"Hoàn trả {refundedPoints} điểm do hủy đơn bởi người dùng"
                            };
                            _context.BookingHistories.Add(pointsRefundHistory);

                            // Đặt lại Points_Used sau khi đã hoàn điểm
                            booking.Points_Used = 0;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho booking {bookingId}, User ID: {userId}");
                            // Không ném ngoại lệ để tiếp tục quá trình hủy booking
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Lấy số điểm hiện tại của người dùng sau khi hoàn trả
                    int currentPoints = await _pointsService.GetUserPointsTotalAsync(userId);

                    // Tạo response DTO với thông tin từ cả TicketBooking và Payment
                    var response = new BookingResponseDTO
                    {
                        Booking_ID = booking.Booking_ID,
                        User_ID = userId,
                        Booking_Date = booking.Booking_Date,
                        Total_Amount = booking.Total_Amount,
                        Status = booking.Status,
                        // Lấy thông tin thanh toán từ bảng Payment
                        Payment_Method = payment?.Payment_Method,
                        Transaction_Date = payment?.Transaction_Date ?? DateTime.MinValue,
                        // Thời điểm hủy đơn là thời điểm hiện tại
                        Cancellation_Date = DateTime.Now,
                        // Thêm thông tin về điểm đã hoàn trả
                        PointsRefunded = refundedPoints,
                        CurrentPoints = currentPoints
                    };

                    return response;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, $"Đã rollback transaction do lỗi khi hủy booking {bookingId}");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling booking for ID: {bookingId}");
                throw;
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
            var tickets = await _context.Tickets.Where(t => t.Booking_ID == bookingId).ToListAsync();
            foreach (var ticket in tickets)
            {
                _logger.LogInformation($"Ticket ID: {ticket.Ticket_ID}, Seat ID: {ticket.Seat_ID}");

                var seat = await _context.Seats.FindAsync(ticket.Seat_ID);
                if (seat != null)
                {
                    _logger.LogInformation($"Seat ID: {seat.Seat_ID}, Layout ID: {seat.Layout_ID}");

                    var layout = await _context.SeatLayouts.FindAsync(seat.Layout_ID);
                    if (layout != null)
                    {
                        _logger.LogInformation($"Layout ID: {layout.Layout_ID}, Row: {layout.Row_Label}, Column: {layout.Column_Number}");
                    }
                    else
                    {
                        _logger.LogWarning($"Không tìm thấy layout cho Layout ID: {seat.Layout_ID}");
                    }
                }
                else
                {
                    _logger.LogWarning($"Không tìm thấy ghế cho Seat ID: {ticket.Seat_ID}");
                }
            }
            // Thêm log để debug
            _logger.LogInformation($"Đang lấy thông tin ghế cho đặt vé {bookingId}");

            string seatPositionsString = null;

            try
            {
                // Kiểm tra xem có vé nào được tạo cho đặt vé này chưa
                var ticketsExist = await _context.Tickets.AnyAsync(t => t.Booking_ID == bookingId);
                if (!ticketsExist)
                {
                    _logger.LogWarning($"Không tìm thấy vé nào cho đặt vé {bookingId}");
                    return null;
                }

                // Lấy thông tin ghế trực tiếp từ EF Core thay vì sử dụng ADO.NET
                var seatInfo = await (from t in _context.Tickets
                                      join s in _context.Seats on t.Seat_ID equals s.Seat_ID
                                      join sl in _context.SeatLayouts on s.Layout_ID equals sl.Layout_ID
                                      where t.Booking_ID == bookingId
                                      select new { sl.Row_Label, sl.Column_Number })
                                    .ToListAsync();

                if (seatInfo.Any())
                {
                    var seatCodes = seatInfo.Select(si => si.Row_Label + si.Column_Number.ToString()).ToList();
                    seatPositionsString = string.Join(", ", seatCodes);
                    _logger.LogInformation($"Đã tìm thấy ghế: {seatPositionsString}");
                }
                else
                {
                    _logger.LogWarning($"Truy vấn không trả về bất kỳ dữ liệu nào cho đặt vé {bookingId}");

                    // Fallback: Thử cách khác nếu cách trên không có kết quả
                    string connectionString = _context.Database.GetDbConnection().ConnectionString;
                    using (SqlConnection connection = new SqlConnection(connectionString))
                    {
                        await connection.OpenAsync();
                        string query = @"
                SELECT t.Ticket_ID, t.Seat_ID, s.Layout_ID, sl.Row_Label, sl.Column_Number
                FROM Tickets t
                JOIN Seats s ON t.Seat_ID = s.Seat_ID
                JOIN Seat_Layout sl ON s.Layout_ID = sl.Layout_ID
                WHERE t.Booking_ID = @BookingId";

                        using (SqlCommand command = new SqlCommand(query, connection))
                        {
                            command.Parameters.AddWithValue("@BookingId", bookingId);
                            List<string> seatCodes = new List<string>();

                            using (SqlDataReader reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    string rowLabel = reader.GetString(3); // Row_Label
                                    int columnNumber = reader.GetInt32(4); // Column_Number
                                    string seatCode = rowLabel + columnNumber.ToString();
                                    seatCodes.Add(seatCode);
                                    _logger.LogInformation($"Ghế tìm thấy: {seatCode}");
                                }
                            }

                            if (seatCodes.Any())
                            {
                                seatPositionsString = string.Join(", ", seatCodes);
                                _logger.LogInformation($"Đã tìm thấy ghế (phương thức fallback): {seatPositionsString}");
                            }
                            else
                            {
                                _logger.LogWarning($"Cả hai phương thức đều không tìm thấy thông tin ghế cho đặt vé {bookingId}");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin ghế cho đặt vé {bookingId}");
            }

            return seatPositionsString;
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
                    var seats = await _context.Seats
                        .Where(s => s.Booking_ID == bookingId)
                        .ToListAsync();

                    foreach (var seat in seats)
                    {
                        _logger.LogInformation($"Cập nhật ghế {seat.Seat_ID} từ trạng thái '{seat.Seat_Status}' thành 'Available'");
                        seat.Seat_Status = "Available";
                        seat.Last_Updated = DateTime.Now;
                        seat.Booking_ID = null; // Xóa liên kết với Booking_ID
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