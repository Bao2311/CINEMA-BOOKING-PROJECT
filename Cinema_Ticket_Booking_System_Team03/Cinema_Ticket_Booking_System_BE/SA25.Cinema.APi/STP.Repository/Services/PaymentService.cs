//using System;
//using System.Linq;
//using System.Threading.Tasks;
//using System.Collections.Generic;
//using Microsoft.EntityFrameworkCore;
//using STP.Repository.Data;
//using STP.Repository.Models;

//namespace STP.Repository.Services
//{
//    /// <summary>
//    /// Service để xử lý các chức năng liên quan đến thanh toán
//    /// </summary>
//    public class PaymentService
//    {
//        private readonly CinemaDbContext _context;
//        private readonly EmailService _emailService;
//        private readonly SmsService _smsService;

//        public PaymentService(CinemaDbContext context, EmailService emailService, SmsService smsService)
//        {
//            _context = context;
//            _emailService = emailService;
//            _smsService = smsService;
//        }

//        /// <summary>
//        /// Lấy thông tin đơn đặt vé để thanh toán
//        /// </summary>
//        public async Task<TicketBooking> GetBookingForPaymentAsync(int bookingId)
//        {
//            return await _context.TicketBookings
//                .Include(tb => tb.User)
//                .Include(tb => tb.Showtime)
//                    .ThenInclude(s => s.Movie)
//                .Include(tb => tb.Showtime)
//                    .ThenInclude(s => s.CinemaRoom)
//                .Include(tb => tb.Seats)
//                .Include(tb => tb.Promotion)
//                .FirstOrDefaultAsync(tb => tb.Booking_ID == bookingId && tb.Status == "Pending");
//        }

//        /// <summary>
//        /// Xử lý thanh toán tiền mặt
//        /// </summary>
//        public async Task<Payment> ProcessCashPaymentAsync(int bookingId, decimal amount, int processedBy)
//        {
//            var booking = await _context.TicketBookings.FindAsync(bookingId);
//            if (booking == null || booking.Status != "Pending")
//                return null;

//            var payment = new Payment
//            {
//                Booking_ID = bookingId,
//                Amount = amount,
//                Payment_Method = "Cash",
//                Payment_Reference = GeneratePaymentReference(),
//                Transaction_Date = DateTime.Now,
//                Payment_Status = "Completed",
//                Processor_Response = "Cash payment processed successfully",
//                Processed_By = processedBy
//            };

//            // Cập nhật trạng thái đơn đặt vé
//            booking.Status = "Confirmed";

//            // Tạo lịch sử đặt vé
//            var bookingHistory = new BookingHistory
//            {
//                Booking_ID = bookingId,
//                Date = DateTime.Now,
//                Status = "Confirmed"
//            };

//            // Cập nhật điểm tích lũy cho người dùng
//            int pointsEarned = (int)(booking.Total_Amount / 10000);
//            booking.Points_Earned = pointsEarned;

//            var score = new Score
//            {
//                User_ID = booking.User_ID, // Dùng trực tiếp, không cần .Value
//                Points_Added = pointsEarned,
//                Points_Used = 0,
//                Date = DateTime.Now
//            };

//            await _context.Scores.AddAsync(score);

//            await _context.Payments.AddAsync(payment);
//            await _context.BookingHistories.AddAsync(bookingHistory);
//            await _context.SaveChangesAsync();

//            // Gửi thông báo xác nhận thanh toán
//            await SendPaymentConfirmationAsync(bookingId);

//            return payment;
//        }

//        /// <summary>
//        /// Xử lý thanh toán thẻ tín dụng
//        /// </summary>
//        public async Task<Payment> ProcessCreditCardPaymentAsync(int bookingId, decimal amount, string cardNumber,
//            string cardholderName, string expiryDate, string cvv)
//        {
//            var booking = await _context.TicketBookings.FindAsync(bookingId);
//            if (booking == null || booking.Status != "Pending")
//                return null;

//            // Mã hóa thông tin thẻ để lưu trữ an toàn
//            string maskedCardNumber = MaskCreditCardNumber(cardNumber);

//            // Giả lập kết nối đến cổng thanh toán
//            bool paymentSuccess = await SimulateCreditCardPaymentGateway(cardNumber, cardholderName, expiryDate, cvv, amount);

//            var payment = new Payment
//            {
//                Booking_ID = bookingId,
//                Amount = amount,
//                Payment_Method = "Credit Card",
//                Payment_Reference = GeneratePaymentReference(),
//                Transaction_Date = DateTime.Now,
//                Payment_Status = paymentSuccess ? "Completed" : "Failed",
//                Processor_Response = paymentSuccess ?
//                    $"Payment successful with card {maskedCardNumber}" :
//                    "Card payment failed. Please try again or use a different payment method."
//            };

//            if (paymentSuccess)
//            {
//                // Cập nhật trạng thái đơn đặt vé
//                booking.Status = "Confirmed";

//                // Tạo lịch sử đặt vé
//                var bookingHistory = new BookingHistory
//                {
//                    Booking_ID = bookingId,
//                    Date = DateTime.Now,
//                    Status = "Confirmed"
//                };

//                // Cập nhật điểm tích lũy cho người dùng
//                int pointsEarned = (int)(booking.Total_Amount / 10000);
//                booking.Points_Earned = pointsEarned;

//                var score = new Score
//                {
//                    User_ID = booking.User_ID, // Dùng trực tiếp, không cần .Value
//                    Points_Added = pointsEarned,
//                    Points_Used = 0,
//                    Date = DateTime.Now
//                };

//                await _context.Scores.AddAsync(score);

//                await _context.BookingHistories.AddAsync(bookingHistory);

//                // Gửi thông báo xác nhận thanh toán
//                await SendPaymentConfirmationAsync(bookingId);
//            }

//            await _context.Payments.AddAsync(payment);
//            await _context.SaveChangesAsync();

//            return payment;
//        }

//        /// <summary>
//        /// Xử lý thanh toán qua ZaloPay
//        /// </summary>
//        public async Task<Payment> ProcessZaloPayAsync(int bookingId, decimal amount)
//        {
//            var booking = await _context.TicketBookings.FindAsync(bookingId);
//            if (booking == null || booking.Status != "Pending")
//                return null;

//            // Tạo một giao dịch ZaloPay
//            string zaloPayOrderId = await CreateZaloPayOrder(bookingId, amount);

//            // Ghi nhận thông tin thanh toán vào cơ sở dữ liệu
//            var payment = new Payment
//            {
//                Booking_ID = bookingId,
//                Amount = amount,
//                Payment_Method = "ZaloPay",
//                Payment_Reference = zaloPayOrderId,
//                Transaction_Date = DateTime.Now,
//                Payment_Status = "Pending", // Trạng thái ban đầu là Pending
//                Processor_Response = "ZaloPay payment initiated. Waiting for confirmation."
//            };

//            await _context.Payments.AddAsync(payment);
//            await _context.SaveChangesAsync();

//            return payment;
//        }

//        /// <summary>
//        /// Xử lý thanh toán qua VNPay
//        /// </summary>
//        public async Task<Payment> ProcessVNPayAsync(int bookingId, decimal amount)
//        {
//            var booking = await _context.TicketBookings.FindAsync(bookingId);
//            if (booking == null || booking.Status != "Pending")
//                return null;

//            // Tạo một giao dịch VNPay
//            string vnpayOrderId = await CreateVNPayOrder(bookingId, amount);

//            // Ghi nhận thông tin thanh toán vào cơ sở dữ liệu
//            var payment = new Payment
//            {
//                Booking_ID = bookingId,
//                Amount = amount,
//                Payment_Method = "VNPay",
//                Payment_Reference = vnpayOrderId,
//                Transaction_Date = DateTime.Now,
//                Payment_Status = "Pending", // Trạng thái ban đầu là Pending
//                Processor_Response = "VNPay payment initiated. Waiting for confirmation."
//            };

//            await _context.Payments.AddAsync(payment);
//            await _context.SaveChangesAsync();

//            return payment;
//        }

//        /// <summary>
//        /// Xử lý callback từ cổng thanh toán (ZaloPay, VNPay)
//        /// </summary>
//        public async Task<bool> ProcessPaymentCallbackAsync(string paymentMethod, string orderId, string status, string signature)
//        {
//            // Xác thực signature từ cổng thanh toán
//            bool isValidSignature = VerifyPaymentSignature(paymentMethod, orderId, status, signature);
//            if (!isValidSignature)
//                return false;

//            // Tìm payment dựa trên orderId
//            var payment = await _context.Payments
//                .FirstOrDefaultAsync(p => p.Payment_Reference == orderId);

//            if (payment == null)
//                return false;

//            // Cập nhật trạng thái thanh toán
//            payment.Payment_Status = status == "success" ? "Completed" : "Failed";
//            payment.Processor_Response = $"{paymentMethod} payment {status}. Transaction ID: {orderId}";

//            if (status == "success")
//            {
//                // Tìm booking tương ứng
//                var booking = await _context.TicketBookings.FindAsync(payment.Booking_ID);
//                if (booking != null)
//                {
//                    // Cập nhật trạng thái đơn đặt vé
//                    booking.Status = "Confirmed";

//                    // Tạo lịch sử đặt vé
//                    var bookingHistory = new BookingHistory
//                    {
//                        Booking_ID = payment.Booking_ID,
//                        Date = DateTime.Now,
//                        Status = "Confirmed"
//                    };

//                    // Cập nhật điểm tích lũy cho người dùng
//                    int pointsEarned = (int)(booking.Total_Amount / 10000);
//                    booking.Points_Earned = pointsEarned;

//                    var score = new Score
//                    {
//                        User_ID = booking.User_ID, // Dùng trực tiếp, không cần .Value
//                        Points_Added = pointsEarned,
//                        Points_Used = 0,
//                        Date = DateTime.Now
//                    };

//                    await _context.Scores.AddAsync(score);

//                    await _context.BookingHistories.AddAsync(bookingHistory);

//                    // Gửi thông báo xác nhận thanh toán
//                    await SendPaymentConfirmationAsync(payment.Booking_ID);
//                }
//            }

//            await _context.SaveChangesAsync();
//            return true;
//        }

//        /// <summary>
//        /// Lấy lịch sử thanh toán của một đơn đặt vé
//        /// </summary>
//        public async Task<List<Payment>> GetPaymentHistoryAsync(int bookingId)
//        {
//            return await _context.Payments
//                .Where(p => p.Booking_ID == bookingId)
//                .OrderByDescending(p => p.Transaction_Date)
//                .ToListAsync();
//        }

//        /// <summary>
//        /// Gửi thông báo xác nhận thanh toán
//        /// </summary>
//        private async Task SendPaymentConfirmationAsync(int bookingId)
//        {
//            var booking = await _context.TicketBookings
//                .Include(tb => tb.User)
//                .Include(tb => tb.Showtime)
//                    .ThenInclude(s => s.Movie)
//                .Include(tb => tb.Showtime)
//                    .ThenInclude(s => s.CinemaRoom)
//                .FirstOrDefaultAsync(tb => tb.Booking_ID == bookingId);

//            if (booking == null || booking.User == null)
//                return;

//            // Gửi email xác nhận
//            if (!string.IsNullOrEmpty(booking.User.Email))
//            {
//                string subject = "Xác nhận thanh toán đặt vé xem phim";
//                string body = $"Kính gửi {booking.User.Full_Name},\n\n" +
//                              $"Cảm ơn bạn đã đặt vé xem phim tại rạp của chúng tôi. " +
//                              $"Đơn đặt vé của bạn đã được thanh toán thành công.\n\n" +
//                              $"Thông tin đặt vé:\n" +
//                              $"- Mã đặt vé: {booking.Booking_ID}\n" +
//                              $"- Phim: {booking.Showtime.Movie.Movie_Name}\n" +
//                              $"- Phòng chiếu: {booking.Showtime.CinemaRoom.Room_Name}\n" +
//                              $"- Ngày chiếu: {booking.Showtime.Show_Date.ToString("dd/MM/yyyy")}\n" +
//                              $"- Giờ chiếu: {booking.Showtime.Start_Time.ToString(@"hh\:mm")}\n" +
//                              $"- Tổng tiền: {booking.Total_Amount.ToString("N0")} VND\n\n" +
//                              $"Vé của bạn đã sẵn sàng. Bạn có thể nhận vé tại quầy hoặc sử dụng mã QR được gửi kèm email này.\n\n" +
//                              $"Chúc bạn có buổi xem phim vui vẻ!\n\n" +
//                              $"Trân trọng,\nRạp chiếu phim STP";

//                await _emailService.SendEmailAsync(booking.User.Email, subject, body);
//            }

//            // Gửi SMS xác nhận
//            if (!string.IsNullOrEmpty(booking.User.Phone_Number))
//            {
//                string message = $"STP Cinema: Don dat ve {booking.Booking_ID} da duoc thanh toan thanh cong. " +
//                                 $"Phim: {booking.Showtime.Movie.Movie_Name}, " +
//                                 $"Ngay: {booking.Showtime.Show_Date.ToString("dd/MM")}, " +
//                                 $"Gio: {booking.Showtime.Start_Time.ToString(@"hh\:mm")}. " +
//                                 $"Cam on quy khach!";

//                await _smsService.SendSmsAsync(booking.User.Phone_Number, message);
//            }
//        }

//        #region Helper Methods

//        /// <summary>
//        /// Tạo mã tham chiếu thanh toán
//        /// </summary>
//        private string GeneratePaymentReference()
//        {
//            return $"PAY-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
//        }

//        /// <summary>
//        /// Che một phần số thẻ tín dụng
//        /// </summary>
//        private string MaskCreditCardNumber(string cardNumber)
//        {
//            if (string.IsNullOrEmpty(cardNumber) || cardNumber.Length < 13)
//                return "Invalid card number";

//            // Giữ lại 4 số cuối cùng, che các số còn lại
//            return $"XXXX-XXXX-XXXX-{cardNumber.Substring(cardNumber.Length - 4)}";
//        }

//        /// <summary>
//        /// Giả lập kết nối đến cổng thanh toán thẻ tín dụng
//        /// </summary>
//        private Task<bool> SimulateCreditCardPaymentGateway(string cardNumber, string cardholderName,
//            string expiryDate, string cvv, decimal amount)
//        {
//            // Giả lập thanh toán thành công (trong môi trường thực tế, đây sẽ là một API call đến cổng thanh toán)
//            bool isValidCard = cardNumber.Length >= 13 && cardNumber.Length <= 19 &&
//                              !string.IsNullOrEmpty(cardholderName) &&
//                              !string.IsNullOrEmpty(expiryDate) &&
//                              !string.IsNullOrEmpty(cvv);

//            // Giả lập xác suất thành công 95%
//            bool randomSuccess = new Random().NextDouble() < 0.95;

//            return Task.FromResult(isValidCard && randomSuccess);
//        }

//        /// <summary>
//        /// Tạo một đơn hàng ZaloPay
//        /// </summary>
//        private Task<string> CreateZaloPayOrder(int bookingId, decimal amount)
//        {
//            // Giả lập tạo đơn hàng ZaloPay (trong môi trường thực tế, đây sẽ là một API call đến ZaloPay)
//            string orderId = $"ZLP{DateTime.Now:yyyyMMddHHmmss}{bookingId}";
//            return Task.FromResult(orderId);
//        }

//        /// <summary>
//        /// Tạo một đơn hàng VNPay
//        /// </summary>
//        private Task<string> CreateVNPayOrder(int bookingId, decimal amount)
//        {
//            // Giả lập tạo đơn hàng VNPay (trong môi trường thực tế, đây sẽ là một API call đến VNPay)
//            string orderId = $"VNP{DateTime.Now:yyyyMMddHHmmss}{bookingId}";
//            return Task.FromResult(orderId);
//        }

//        /// <summary>
//        /// Xác thực chữ ký từ cổng thanh toán
//        /// </summary>
//        private bool VerifyPaymentSignature(string paymentMethod, string orderId, string status, string signature)
//        {
//            // Giả lập xác thực chữ ký (trong môi trường thực tế, đây sẽ là một phương thức xác thực chữ ký số)
//            return !string.IsNullOrEmpty(signature);
//        }

//        #endregion
//    }
//}

