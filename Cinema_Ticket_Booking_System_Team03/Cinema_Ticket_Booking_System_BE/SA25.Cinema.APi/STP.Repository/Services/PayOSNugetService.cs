using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Net.payOS;
using Net.payOS.Types;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class PayOSNugetService
    {
        private readonly ILogger<PayOSNugetService> _logger;
        private readonly IConfiguration _configuration;
        private readonly PayOS _payOS;
        private readonly CinemaDbContext _context;
        private readonly PointsService _pointsService;

        public PayOSNugetService(
            ILogger<PayOSNugetService> logger,
            IConfiguration configuration,
            CinemaDbContext context,
            PointsService pointsService)
        {
            _logger = logger;
            _configuration = configuration;
            _context = context;

            // Lấy thông tin từ cấu hình
            string clientId = _configuration["PayOS:ClientId"];
            string apiKey = _configuration["PayOS:ApiKey"];
            string checksumKey = _configuration["PayOS:ChecksumKey"];

            // Khởi tạo PayOS
            _payOS = new PayOS(clientId, apiKey, checksumKey);
            _pointsService = pointsService;
        }

        /// <summary>
        /// Tạo link thanh toán 
        /// </summary>
        public async Task<PaymentResponse> CreatePaymentLink(int bookingId, decimal amount, string description, string customerName = null)
        {
            try
            {
                _logger.LogInformation($"Tạo link thanh toán cho đơn đặt vé {bookingId} với số tiền {amount}");

                // Tạo mã đơn hàng duy nhất - Chuyển thành long theo yêu cầu của PayOS
                long orderCode = bookingId * 1000 + DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 1000;

                // Tạo danh sách các item
                var item = new ItemData("Thanh toán vé xem phim", 1, (int)amount);
                var items = new List<ItemData> { item };

                // URL trả về sau khi thanh toán - sử dụng đường dẫn API của backend
                string returnUrl = $"{_configuration["AppSettings:ApiBaseUrl"]}/api/payos/return";
                string cancelUrl = $"{_configuration["AppSettings:ApiBaseUrl"]}/api/payos/cancel";

                _logger.LogInformation($"ReturnURL: {returnUrl}, CancelURL: {cancelUrl}");

                // Tạo dữ liệu thanh toán
                var paymentData = new PaymentData(
                    orderCode, // orderCode phải là long, không phải string
                    (int)amount, // amount (phải là số nguyên)
                    description, // description
                    items, // items
                    returnUrl, // returnUrl
                    cancelUrl // cancelUrl
                );

                // Gọi API tạo link thanh toán
                var result = await _payOS.createPaymentLink(paymentData);

                if (result == null || string.IsNullOrEmpty(result.checkoutUrl))
                {
                    _logger.LogError($"Không thể tạo link thanh toán cho đơn đặt vé {bookingId}");
                    return new PaymentResponse
                    {
                        Success = false,
                        Message = "Không thể tạo link thanh toán"
                    };
                }

                _logger.LogInformation($"Tạo link thanh toán thành công: {result.checkoutUrl}");

                // Trả về kết quả
                return new PaymentResponse
                {
                    Success = true,
                    Message = "Tạo link thanh toán thành công",
                    PaymentUrl = result.checkoutUrl,
                    QrCodeUrl = result.qrCode,
                    OrderCode = orderCode.ToString(), // Chuyển lại thành string để trả về
                    Amount = amount,
                    PaymentLinkId = result.paymentLinkId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi tạo link thanh toán: {ex.Message}");
                return new PaymentResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái thanh toán
        /// </summary>
        public async Task<PaymentStatusResponse> CheckPaymentStatus(string orderCode)
        {
            try
            {
                _logger.LogInformation($"Kiểm tra trạng thái thanh toán cho đơn hàng {orderCode}");

                // Chuyển orderCode từ string sang long
                if (!long.TryParse(orderCode, out long orderCodeLong))
                {
                    _logger.LogError($"Không thể chuyển đổi OrderCode '{orderCode}' thành long");
                    return new PaymentStatusResponse
                    {
                        Success = false,
                        Message = "Mã đơn hàng không hợp lệ"
                    };
                }

                // Gọi API kiểm tra trạng thái - Sử dụng đúng tên phương thức
                var result = await _payOS.getPaymentLinkInformation(orderCodeLong);

                if (result == null)
                {
                    _logger.LogError($"Không thể lấy thông tin thanh toán cho đơn hàng {orderCode}");
                    return new PaymentStatusResponse
                    {
                        Success = false,
                        Message = "Không thể lấy thông tin thanh toán"
                    };
                }

                _logger.LogInformation($"Trạng thái thanh toán: {result.status}");

                // Trả về kết quả
                return new PaymentStatusResponse
                {
                    Success = true,
                    Message = "Lấy thông tin thanh toán thành công",
                    OrderId = orderCode,
                    Status = result.status,
                    Amount = result.amount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi kiểm tra trạng thái thanh toán: {ex.Message}");
                return new PaymentStatusResponse
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        /// <summary>
        /// Chuyển Unix timestamp sang DateTime
        /// </summary>
        private DateTime? UnixTimeStampToDateTime(long? unixTimeStamp)
        {
            if (!unixTimeStamp.HasValue)
                return null;

            // Unix timestamp tính bằng giây
            DateTime dateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            dateTime = dateTime.AddSeconds(unixTimeStamp.Value);
            return dateTime;
        }

        /// <summary>
        /// Lấy bookingId từ orderCode
        /// </summary>
        public int GetBookingIdFromOrderCode(string orderCode)
        {
            // Kiểm tra nếu OrderCode là dạng số (bookingId * 1000 + timestamp % 1000)
            if (long.TryParse(orderCode, out long numericOrderCode))
            {
                return (int)(numericOrderCode / 1000);
            }
            else
            {
                // Nếu là dạng chuỗi, thử phân tích dạng BOOKING_{BookingId}_{Timestamp}
                string[] parts = orderCode.Split('_');
                if (parts.Length >= 2 && parts[0] == "BOOKING" && int.TryParse(parts[1], out int bookingId))
                {
                    return bookingId;
                }
            }

            return 0; // Giá trị mặc định nếu không phân tích được
        }

        /// <summary>
        /// Lấy thông tin ghế của booking
        /// </summary>
        public async Task<string> GetBookingSeatsInfo(int bookingId)
        {
            try
            {
                var seats = await (from t in _context.Tickets
                                   join s in _context.Seats on t.Seat_ID equals s.Seat_ID
                                   join sl in _context.SeatLayouts on s.Layout_ID equals sl.Layout_ID
                                   where t.Booking_ID == bookingId
                                   select new { sl.Row_Label, sl.Column_Number })
                              .ToListAsync();

                if (seats.Any())
                {
                    var seatCodes = seats.Select(s => s.Row_Label + s.Column_Number.ToString());
                    return string.Join(", ", seatCodes);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin ghế cho booking {bookingId}");
            }

            return "Không có thông tin ghế";
        }

        /// <summary>
        /// Lấy thông tin booking
        /// </summary>
        public async Task<BookingDetailInfo> GetBookingDetail(int bookingId)
        {
            try
            {
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .Where(b => b.Booking_ID == bookingId)
                    .Select(b => new BookingDetailInfo
                    {
                        BookingId = b.Booking_ID,
                        UserId = b.User_ID,
                        MovieName = b.Showtime.Movie.Movie_Name,
                        RoomName = b.Showtime.CinemaRoom.Room_Name,
                        Amount = b.Total_Amount,
                        Status = b.Status
                    })
                    .FirstOrDefaultAsync();

                if (booking != null)
                {
                    booking.Seats = await GetBookingSeatsInfo(bookingId);
                }

                return booking;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin chi tiết booking {bookingId}");
                return null;
            }
        }

        /// <summary>
        /// Cập nhật trạng thái đơn hàng thành "Cancelled" khi người dùng hủy thanh toán
        /// </summary>
        public async Task<bool> CancelBooking(int bookingId)
        {
            try
            {
                _logger.LogInformation($"Bắt đầu hủy đơn đặt vé {bookingId}");

                // Kiểm tra và lấy thông tin đặt vé
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId && b.Status == "Pending");

                if (booking == null)
                {
                    _logger.LogWarning($"Không tìm thấy đơn đặt vé {bookingId} hoặc đơn không ở trạng thái Pending");
                    return false;
                }

                // Lấy trạng thái hiện tại để log
                _logger.LogInformation($"Trạng thái hiện tại của đơn đặt vé {bookingId}: {booking.Status}");

                // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        // 1. Cập nhật trạng thái đơn đặt vé
                        booking.Status = "Cancelled";
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Đã hủy đơn đặt vé {bookingId} thành công");

                        // 2. THÊM MỚI: Hoàn trả điểm nếu booking có sử dụng điểm
                        if (booking.Points_Used > 0)
                        {
                            try
                            {
                                _logger.LogInformation($"Đang hoàn trả {booking.Points_Used} điểm cho người dùng {booking.User_ID} từ booking {bookingId}");

                                await _pointsService.RefundPointsForExpiredBookingAsync(
                                    booking.Booking_ID,
                                    booking.User_ID.Value,
                                    booking.Points_Used
                                );

                                // Ghi lại trong lịch sử booking
                                var pointsRefundHistory = new BookingHistory
                                {
                                    Booking_ID = booking.Booking_ID,
                                    Status = "Points Refunded",
                                    Date = DateTime.Now,
                                    Notes = $"Hoàn trả {booking.Points_Used} điểm do hủy đơn bởi người dùng"
                                };
                                _context.BookingHistories.Add(pointsRefundHistory);

                                // Đặt lại Points_Used sau khi đã hoàn điểm
                                booking.Points_Used = 0;
                                await _context.SaveChangesAsync();

                                _logger.LogInformation($"Đã hoàn trả {booking.Points_Used} điểm cho người dùng {booking.User_ID} từ booking {bookingId}");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho booking {bookingId}, User ID: {booking.User_ID}");
                                // Không ném ngoại lệ để tiếp tục quá trình hủy booking
                            }
                        }

                        // 3. Cập nhật trạng thái ghế và xóa liên kết với Booking_ID
                        var seats = await _context.Seats
                            .Where(s => s.Booking_ID == bookingId)
                            .ToListAsync();

                        _logger.LogInformation($"Tìm thấy {seats.Count} ghế cần cập nhật cho đơn {bookingId}");

                        foreach (var seat in seats)
                        {
                            _logger.LogInformation($"Cập nhật ghế {seat.Seat_ID} từ trạng thái '{seat.Seat_Status}' thành 'Available'");
                            seat.Seat_Status = "Available";
                            seat.Last_Updated = DateTime.Now;
                            seat.Booking_ID = null; // Xóa liên kết với Booking_ID
                        }

                        await _context.SaveChangesAsync();

                        // Nếu không tìm thấy ghế, thử dùng SQL trực tiếp
                        if (seats.Count == 0)
                        {
                            _logger.LogWarning($"Không tìm thấy ghế nào với Booking_ID={bookingId}, thử dùng SQL trực tiếp");

                            // Sử dụng SQL trực tiếp để cập nhật ghế
                            string updateQuery = @"
                    UPDATE Seats 
                    SET Seat_Status = 'Available', 
                        Last_Updated = @now, 
                        Booking_ID = NULL 
                    WHERE Booking_ID = @bookingId";

                            var parameters = new[]
                            {
                    new Microsoft.Data.SqlClient.SqlParameter("@now", DateTime.Now),
                    new Microsoft.Data.SqlClient.SqlParameter("@bookingId", bookingId)
                };

                            var updated = await _context.Database.ExecuteSqlRawAsync(updateQuery, parameters);

                            _logger.LogInformation($"Cập nhật trực tiếp {updated} ghế cho đơn đặt vé {bookingId}");
                        }

                        // 4. Thêm lịch sử hủy đơn
                        var bookingHistory = new BookingHistory
                        {
                            Booking_ID = booking.Booking_ID,
                            Status = "Cancelled",
                            Date = DateTime.Now,
                            Notes = "Hủy đơn bởi người dùng thông qua PayOS"
                        };

                        _context.BookingHistories.Add(bookingHistory);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Đã thêm lịch sử hủy đơn đặt vé {bookingId}");

                        // Commit transaction nếu tất cả thành công
                        await transaction.CommitAsync();
                        _logger.LogInformation($"Đã commit transaction hủy đơn đặt vé {bookingId}");

                        return true;
                    }
                    catch (Exception ex)
                    {
                        // Rollback transaction nếu có lỗi
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, $"Lỗi khi hủy đơn đặt vé {bookingId}, đã rollback transaction");
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi không xử lý được khi hủy đơn đặt vé {bookingId}");
                return false;
            }
        }

        /// <summary>
        /// Lấy URL thanh toán từ PayOS
        /// </summary>
        /// <param name="bookingId">ID của đơn đặt vé</param>
        /// <returns>URL thanh toán và thông tin liên quan</returns>
        public async Task<PaymentUrlResponse> GetPaymentUrl(int bookingId)
        {
            try
            {
                _logger.LogInformation($"Lấy URL thanh toán cho đơn đặt vé {bookingId}");

                // Lấy thông tin booking từ database
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogError($"Không tìm thấy thông tin đơn đặt vé {bookingId}");
                    return new PaymentUrlResponse
                    {
                        Success = false,
                        Message = "Không tìm thấy thông tin đơn đặt vé"
                    };
                }

                // Kiểm tra trạng thái booking
                if (booking.Status != "Pending")
                {
                    _logger.LogWarning($"Đơn đặt vé {bookingId} không ở trạng thái Pending, trạng thái hiện tại: {booking.Status}");
                    return new PaymentUrlResponse
                    {
                        Success = false,
                        Message = $"Đơn đặt vé không ở trạng thái chờ thanh toán (hiện tại: {booking.Status})"
                    };
                }

                // Trước tiên, tìm kiếm thanh toán hiện có trong database
                var existingPayment = await _context.Payments
                    .Where(p => p.Booking_ID == bookingId && p.Payment_Status == "Pending")
                    .OrderByDescending(p => p.Transaction_Date)
                    .FirstOrDefaultAsync();

                if (existingPayment != null)
                {
                    // Kiểm tra xem có thông tin URL trong Processor_Response không
                    if (!string.IsNullOrEmpty(existingPayment.Processor_Response))
                    {
                        try
                        {
                            var responseData = System.Text.Json.JsonSerializer.Deserialize<PaymentResponseData>(
                                existingPayment.Processor_Response);

                            string paymentUrl = responseData?.PaymentUrl;
                            string qrCodeUrl = responseData?.QrCodeUrl;

                            if (!string.IsNullOrEmpty(paymentUrl))
                            {
                                _logger.LogInformation($"Đã tìm thấy URL thanh toán hiện có cho đơn đặt vé {bookingId}: {paymentUrl}");

                                return new PaymentUrlResponse
                                {
                                    Success = true,
                                    Message = "Lấy URL thanh toán thành công",
                                    PaymentUrl = paymentUrl,
                                    QrCodeUrl = qrCodeUrl,
                                    OrderCode = existingPayment.Payment_Reference,
                                    Amount = existingPayment.Amount,
                                    PaymentId = existingPayment.Payment_ID
                                };
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning($"Không thể parse Processor_Response: {ex.Message}");
                            // Tiếp tục tìm kiếm hoặc tạo mới
                        }
                    }

                    // Nếu có Payment_Reference nhưng không có URL, thì kiểm tra trạng thái thông qua API PayOS
                    if (!string.IsNullOrEmpty(existingPayment.Payment_Reference))
                    {
                        try
                        {
                            var paymentStatus = await CheckPaymentStatus(existingPayment.Payment_Reference);
                            if (paymentStatus.Success && paymentStatus.Status == "PENDING")
                            {
                                _logger.LogInformation($"Đơn thanh toán vẫn đang chờ xử lý, tuy nhiên không có URL. Lấy thông tin từ API");

                                // Lấy thông tin từ API create để không phải tạo mới
                                // Yêu cầu tạo thanh toán mới do không thể lấy lại URL
                                _logger.LogWarning($"Không thể lấy lại URL thanh toán từ API, cần tạo mới");
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, $"Lỗi khi kiểm tra trạng thái thanh toán hiện có: {ex.Message}");
                        }
                    }
                }

                // Không tìm thấy thanh toán hiện có hoặc không thể lấy URL, tạo mới
                string description = $"Thanh toán vé #{bookingId}";
                if (description.Length > 25)
                {
                    description = description.Substring(0, 25);
                }

                // Tạo link thanh toán mới
                var paymentResponse = await CreatePaymentLink(
                    bookingId: bookingId,
                    amount: booking.Total_Amount,
                    description: description,
                    customerName: "Khách hàng"
                );

                if (!paymentResponse.Success)
                {
                    _logger.LogError($"Không thể tạo URL thanh toán cho đơn đặt vé {bookingId}: {paymentResponse.Message}");
                    return new PaymentUrlResponse
                    {
                        Success = false,
                        Message = paymentResponse.Message
                    };
                }

                // Lưu thông tin thanh toán mới vào database
                try
                {
                    // Serialize thông tin response
                    string processorResponse = System.Text.Json.JsonSerializer.Serialize(new PaymentResponseData
                    {
                        PaymentUrl = paymentResponse.PaymentUrl,
                        QrCodeUrl = paymentResponse.QrCodeUrl,
                        PaymentLinkId = paymentResponse.PaymentLinkId
                    });

                    // Nếu đã có payment, cập nhật thay vì tạo mới
                    if (existingPayment != null)
                    {
                        existingPayment.Payment_Reference = paymentResponse.OrderCode;
                        existingPayment.Processor_Response = processorResponse;
                        existingPayment.Transaction_Date = DateTime.Now;
                    }
                    else
                    {
                        // Tạo mới nếu chưa có
                        var payment = new Payment
                        {
                            Booking_ID = bookingId,
                            Amount = booking.Total_Amount,
                            Payment_Method = "PayOS",
                            Payment_Reference = paymentResponse.OrderCode,
                            Transaction_Date = DateTime.Now,
                            Payment_Status = "Pending",
                            Processor_Response = processorResponse
                        };

                        _context.Payments.Add(payment);
                    }

                    await _context.SaveChangesAsync();

                    return new PaymentUrlResponse
                    {
                        Success = true,
                        Message = "Lấy URL thanh toán thành công",
                        PaymentUrl = paymentResponse.PaymentUrl,
                        QrCodeUrl = paymentResponse.QrCodeUrl,
                        OrderCode = paymentResponse.OrderCode,
                        Amount = booking.Total_Amount,
                        PaymentId = existingPayment?.Payment_ID
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Không thể lưu thông tin thanh toán vào database: {ex.Message}");
                    // Vẫn trả về URL thanh toán cho dù không lưu được vào database
                    return new PaymentUrlResponse
                    {
                        Success = true,
                        Message = "Lấy URL thanh toán thành công, nhưng không lưu được vào database",
                        PaymentUrl = paymentResponse.PaymentUrl,
                        QrCodeUrl = paymentResponse.QrCodeUrl,
                        OrderCode = paymentResponse.OrderCode,
                        Amount = booking.Total_Amount
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy URL thanh toán cho đơn đặt vé {bookingId}: {ex.Message}");
                return new PaymentUrlResponse
                {
                    Success = false,
                    Message = $"Lỗi: {ex.Message}"
                };
            }
        }

        // DTO cho kết quả lấy URL thanh toán
        public class PaymentUrlResponse
        {
            public bool Success { get; set; }
            public string Message { get; set; }
            public string PaymentUrl { get; set; }
            public string QrCodeUrl { get; set; }
            public string OrderCode { get; set; }
            public decimal Amount { get; set; }
            public int? PaymentId { get; set; }
        }

        // DTO để lưu thông tin response vào Processor_Response
        private class PaymentResponseData
        {
            public string PaymentUrl { get; set; }
            public string QrCodeUrl { get; set; }
            public string PaymentLinkId { get; set; }
        }

        /// <summary>
        /// Tạo HTML cho trang trạng thái thanh toán
        /// </summary>
        public string CreatePaymentStatusHtml(string orderCode, string status, BookingDetailInfo booking, decimal amount, string paymentMethod = null, DateTime? transactionTime = null)
        {
            string statusClass = status == "PAID" ? "success" : (status == "CANCELLED" ? "failed" : "pending");
            string statusTitle = status == "PAID" ? "Thanh toán thành công!" :
                               (status == "CANCELLED" ? "Thanh toán đã bị hủy" : "Thanh toán chưa hoàn tất");
            string statusMessage = status == "CANCELLED" ?
                "Bạn đã hủy quá trình thanh toán. Đơn đặt vé của bạn đã được hủy." : "";

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
        {(string.IsNullOrEmpty(statusMessage) ? "" : $"<p>{statusMessage}</p>")}
        
        <div class=""info"">
            <p><strong>Mã đơn hàng:</strong> {orderCode}</p>
            <p><strong>Trạng thái:</strong> {status}</p>
            <p><strong>Số tiền:</strong> {amount.ToString("N0")} VNĐ</p>
            {(!string.IsNullOrEmpty(paymentMethod) ? $"<p><strong>Phương thức:</strong> {paymentMethod}</p>" : "")}
            {(booking != null ? $"<p><strong>Tên phim:</strong> {booking.MovieName}</p>" : "")}
            {(booking != null ? $"<p><strong>Phòng:</strong> {booking.RoomName}</p>" : "")}
            <p><strong>Ghế:</strong> {(booking != null ? booking.Seats : "Không có thông tin ghế")}</p>
        </div>
        
        <a href=""http://localhost:5173/"" class=""btn"">Quay lại trang chủ</a>
    </div>
</body>
</html>";

            return htmlContent;
        }

        /// <summary>
        /// Tạo HTML cho trang lỗi
        /// </summary>
        public string CreateErrorHtml()
        {
            return @"
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
        <a href=""http://localhost:5173/"" class=""btn"">Quay lại trang chủ</a>
    </div>
</body>
</html>";
        }
    }

    // DTO cho response
    public class PaymentResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string PaymentUrl { get; set; }
        public string QrCodeUrl { get; set; }
        public string OrderCode { get; set; }
        public decimal Amount { get; set; }
        public string PaymentLinkId { get; set; }
    }

    // DTO cho kết quả kiểm tra trạng thái
    public class PaymentStatusResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string OrderId { get; set; }
        public string Status { get; set; }
        public long? Amount { get; set; }
        public string PaymentMethod { get; set; }
        public DateTime? TransactionTime { get; set; }
        public string TransactionId { get; set; }
    }

    public class BookingDetailInfo
    {
        public int BookingId { get; set; }
        public int? UserId { get; set; }
        public string MovieName { get; set; }
        public string RoomName { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; }
        public string Seats { get; set; }
    }
}