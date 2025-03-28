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
        public BookingService(CinemaDbContext context, ILogger<BookingService> logger, PayOSNugetService payosService)
        {
            _context = context;
            _logger = logger;
            _payosService = payosService;
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
                // Kiểm tra người dùng tồn tại
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"Người dùng với ID {userId} không tồn tại trong hệ thống");
                    throw new KeyNotFoundException($"Người dùng với ID {userId} không tồn tại trong hệ thống");
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
                    User_ID = userId,
                    Created_By = userId, // Thêm trường Created_By
                    Showtime_ID = request.Showtime_ID,
                    Booking_Date = DateTime.Now,
                    Total_Amount = totalAmount,
                    Status = "Pending",
                    Payment_Deadline = DateTime.Now.AddMinutes(5),
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
                    Date = DateTime.Now
                };

                _context.BookingHistories.Add(history);
                await _context.SaveChangesAsync();
                string formattedSeats = await GetFormattedSeatPositions(booking.Booking_ID);
                // Tạo response
                var response = new BookingResponseDTO
                {
                    Booking_ID = booking.Booking_ID,
                    User_ID = userId,
                    Booking_Date = booking.Booking_Date,
                    Payment_Deadline = booking.Payment_Deadline,
                    Total_Amount = booking.Total_Amount,
                    Status = booking.Status,
                    Seats = formattedSeats,
                    Payment_Method = initialPayment?.Payment_Method,

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
                    }).ToList()
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
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    throw new KeyNotFoundException("Không tìm thấy đơn đặt vé");
                }

                // Kiểm tra người dùng có quyền cập nhật đơn đặt vé không
                if (booking.User_ID != userId)
                {
                    throw new UnauthorizedAccessException("Bạn không có quyền cập nhật đơn đặt vé này");
                }

                // Kiểm tra trạng thái đơn đặt vé
                if (booking.Status != "Pending")
                {
                    throw new InvalidOperationException("Đơn đặt vé không ở trạng thái chờ thanh toán");
                }

                // Kiểm tra xem đơn đặt vé có quá hạn không
                if (DateTime.Now > booking.Payment_Deadline)
                {
                    // Tự động hủy đơn nếu quá hạn
                    await AutoCancelExpiredBooking(bookingId);
                    throw new InvalidOperationException("Đơn đặt vé đã quá hạn thanh toán và đã bị hủy tự động");
                }

                // Cập nhật trạng thái đơn đặt vé
                booking.Status = "Confirmed";

                // Cập nhật trạng thái ghế
                var seats = await _context.Seats
                    .Where(s => s.Booking_ID == bookingId)
                    .ToListAsync();

                foreach (var seat in seats)
                {
                    seat.Seat_Status = "Sold";
                    seat.Last_Updated = DateTime.Now;
                }

                // Cập nhật thanh toán
                var payment = new Payment
                {
                    Booking_ID = bookingId,
                    Amount = booking.Total_Amount,
                    Payment_Method = "Online", // Hoặc lấy từ request
                };

                _context.Payments.Add(payment);

                // Thêm lịch sử đơn đặt vé
                var bookingHistory = new BookingHistory
                {
                    Booking_ID = bookingId,
                    Status = "Confirmed",
                    Date = DateTime.Now
                };

                _context.BookingHistories.Add(bookingHistory);

                await _context.SaveChangesAsync();

                // Tạo response DTO
                var response = new BookingResponseDTO
                {
                    Booking_ID = booking.Booking_ID,
                    Booking_Date = booking.Booking_Date,
                    Total_Amount = booking.Total_Amount,
                    Status = booking.Status,
                    Payment_Method = payment.Payment_Method
                };

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating booking payment for ID: {bookingId}");
                throw;
            }
        }

        public async Task<BookingResponseDTO> CancelBooking(int bookingId, int userId)
        {
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

                // Lấy thông tin thanh toán từ bảng Payment
                var payment = await _context.Payments
                    .Where(p => p.Booking_ID == bookingId)
                    .OrderByDescending(p => p.Transaction_Date)
                    .FirstOrDefaultAsync();

                // Cập nhật trạng thái đơn đặt vé
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
                };

                _context.BookingHistories.Add(bookingHistory);
                await _context.SaveChangesAsync();

                // Tạo response DTO với thông tin từ cả TicketBooking và Payment
                var response = new BookingResponseDTO
                {
                    Booking_ID = booking.Booking_ID,
                    Booking_Date = booking.Booking_Date,
                    Total_Amount = booking.Total_Amount,
                    Status = booking.Status,
                    // Lấy thông tin thanh toán từ bảng Payment
                    Payment_Method = payment?.Payment_Method,
                    Transaction_Date = payment?.Transaction_Date ?? DateTime.MinValue,
                    // Thời điểm hủy đơn là thời điểm hiện tại
                    Cancellation_Date = DateTime.Now
                };

                return response;
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
            try
            {
                // Lấy thông tin đơn đặt vé
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                    throw new KeyNotFoundException("Không tìm thấy đơn đặt vé");

                // Cập nhật trạng thái đơn đặt vé
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
                };

                _context.BookingHistories.Add(bookingHistory);
                await _context.SaveChangesAsync();

                // Tạo response DTO
                var response = new BookingResponseDTO
                {
                    Booking_ID = booking.Booking_ID,
                    Booking_Date = booking.Booking_Date,
                    Total_Amount = booking.Total_Amount,
                    Status = booking.Status,
                    Cancellation_Date = DateTime.Now,
                };

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error auto-cancelling booking for ID: {bookingId}");
                throw;
            }
        }
    }
}
