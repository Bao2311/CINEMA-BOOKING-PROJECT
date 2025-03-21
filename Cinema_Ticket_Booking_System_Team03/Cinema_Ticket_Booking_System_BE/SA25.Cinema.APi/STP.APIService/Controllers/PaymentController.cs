using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using STP.Repository.Models;
using STP.Repository.Services;

namespace STP.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /// <summary>
        /// Lấy thông tin đơn đặt vé để thanh toán
        /// </summary>
        [HttpGet("booking/{bookingId}")]
        public async Task<IActionResult> GetBookingForPayment(int bookingId)
        {
            if (bookingId <= 0)
                return BadRequest("ID đơn đặt vé không hợp lệ");

            var booking = await _paymentService.GetBookingForPaymentAsync(bookingId);
            if (booking == null)
                return NotFound("Không tìm thấy đơn đặt vé hoặc đơn đã được thanh toán");

            // Map dữ liệu để hiển thị thông tin thanh toán
            var showtime = booking.Showtime;
            var movie = showtime.Movie;
            var cinemaRoom = showtime.CinemaRoom;

            var paymentInfo = new
            {
                booking.Booking_ID,
                booking.User.Full_Name,
                MovieInfo = new
                {
                    movie.Movie_ID,
                    movie.Movie_Name,
                    movie.Duration,
                    movie.Rating
                },
                ShowtimeInfo = new
                {
                    showtime.Showtime_ID,
                    ShowDate = showtime.Show_Date.ToString("dd/MM/yyyy"),
                    StartTime = showtime.Start_Time.ToString(@"hh\:mm"),
                    EndTime = showtime.End_Time.ToString(@"hh\:mm")
                },
                CinemaRoomInfo = new
                {
                    cinemaRoom.Cinema_Room_ID,
                    cinemaRoom.Room_Name,
                    cinemaRoom.Room_Type
                },
                SeatInfo = booking.Seats.Select(s => new
                {
                    s.Seat_ID,
                    s.SeatLayout.Row_Label,
                    s.SeatLayout.Column_Number,
                    s.SeatLayout.Seat_Type,
                    SeatLabel = $"{s.SeatLayout.Row_Label}{s.SeatLayout.Column_Number}"
                }).ToList(),
                booking.Total_Amount,
                PromotionInfo = booking.Promotion != null ? new
                {
                    booking.Promotion.Promotion_ID,
                    booking.Promotion.Title,
                    booking.Promotion.Promotion_Code,
                    booking.Promotion.Discount_Type,
                    booking.Promotion.Discount_Value
                } : null,
                booking.Points_Used,
                booking.Status,
                PaymentDeadline = booking.Payment_Deadline.ToString("dd/MM/yyyy HH:mm")
            };

            return Ok(paymentInfo);
        }

        /// <summary>
        /// Xử lý thanh toán tiền mặt
        /// </summary>
        [HttpPost("cash")]
        public async Task<IActionResult> ProcessCashPayment([FromBody] CashPaymentRequest request)
        {
            if (request == null || request.BookingId <= 0 || request.Amount <= 0 || request.ProcessedBy <= 0)
                return BadRequest("Dữ liệu thanh toán không hợp lệ");

            var payment = await _paymentService.ProcessCashPaymentAsync(
                request.BookingId, request.Amount, request.ProcessedBy);

            if (payment == null)
                return BadRequest("Không thể xử lý thanh toán, vui lòng kiểm tra lại");

            var result = new
            {
                payment.Payment_ID,
                payment.Booking_ID,
                payment.Amount,
                payment.Payment_Method,
                payment.Payment_Reference,
                TransactionDate = payment.Transaction_Date.ToString("dd/MM/yyyy HH:mm:ss"),
                payment.Payment_Status,
                payment.Processor_Response
            };

            return Ok(result);
        }

        /// <summary>
        /// Xử lý thanh toán thẻ tín dụng
        /// </summary>
        [HttpPost("credit-card")]
        public async Task<IActionResult> ProcessCreditCardPayment([FromBody] CreditCardPaymentRequest request)
        {
            if (request == null || request.BookingId <= 0 || request.Amount <= 0 ||
                string.IsNullOrEmpty(request.CardNumber) || string.IsNullOrEmpty(request.CardholderName) ||
                string.IsNullOrEmpty(request.ExpiryDate) || string.IsNullOrEmpty(request.CVV))
                return BadRequest("Dữ liệu thanh toán không hợp lệ");

            var payment = await _paymentService.ProcessCreditCardPaymentAsync(
                request.BookingId, request.Amount, request.CardNumber,
                request.CardholderName, request.ExpiryDate, request.CVV);

            if (payment == null)
                return BadRequest("Không thể xử lý thanh toán, vui lòng kiểm tra lại");

            var result = new
            {
                payment.Payment_ID,
                payment.Booking_ID,
                payment.Amount,
                payment.Payment_Method,
                payment.Payment_Reference,
                TransactionDate = payment.Transaction_Date.ToString("dd/MM/yyyy HH:mm:ss"),
                payment.Payment_Status,
                payment.Processor_Response
            };

            return Ok(result);
        }

        /// <summary>
        /// Xử lý thanh toán qua ZaloPay
        /// </summary>
        [HttpPost("zalopay")]
        public async Task<IActionResult> ProcessZaloPay([FromBody] OnlinePaymentRequest request)
        {
            if (request == null || request.BookingId <= 0 || request.Amount <= 0)
                return BadRequest("Dữ liệu thanh toán không hợp lệ");

            var payment = await _paymentService.ProcessZaloPayAsync(request.BookingId, request.Amount);

            if (payment == null)
                return BadRequest("Không thể khởi tạo thanh toán ZaloPay, vui lòng thử lại");

            var result = new
            {
                payment.Payment_ID,
                payment.Booking_ID,
                payment.Amount,
                payment.Payment_Method,
                payment.Payment_Reference,
                TransactionDate = payment.Transaction_Date.ToString("dd/MM/yyyy HH:mm:ss"),
                payment.Payment_Status,
                payment.Processor_Response,
                RedirectUrl = $"https://zalopay.com.vn/payment?order_id={payment.Payment_Reference}" // URL giả định
            };

            return Ok(result);
        }

        /// <summary>
        /// Xử lý thanh toán qua VNPay
        /// </summary>
        [HttpPost("vnpay")]
        public async Task<IActionResult> ProcessVNPay([FromBody] OnlinePaymentRequest request)
        {
            if (request == null || request.BookingId <= 0 || request.Amount <= 0)
                return BadRequest("Dữ liệu thanh toán không hợp lệ");

            var payment = await _paymentService.ProcessVNPayAsync(request.BookingId, request.Amount);

            if (payment == null)
                return BadRequest("Không thể khởi tạo thanh toán VNPay, vui lòng thử lại");

            var result = new
            {
                payment.Payment_ID,
                payment.Booking_ID,
                payment.Amount,
                payment.Payment_Method,
                payment.Payment_Reference,
                TransactionDate = payment.Transaction_Date.ToString("dd/MM/yyyy HH:mm:ss"),
                payment.Payment_Status,
                payment.Processor_Response,
                RedirectUrl = $"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?order_id={payment.Payment_Reference}" // URL giả định
            };

            return Ok(result);
        }

        /// <summary>
        /// Endpoint callback cho cổng thanh toán (ZaloPay, VNPay)
        /// </summary>
        [HttpPost("callback")]
        public async Task<IActionResult> PaymentCallback([FromBody] PaymentCallbackRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.PaymentMethod) ||
                string.IsNullOrEmpty(request.OrderId) || string.IsNullOrEmpty(request.Status) ||
                string.IsNullOrEmpty(request.Signature))
                return BadRequest("Dữ liệu callback không hợp lệ");

            bool processed = await _paymentService.ProcessPaymentCallbackAsync(
                request.PaymentMethod, request.OrderId, request.Status, request.Signature);

            if (!processed)
                return BadRequest("Không thể xử lý callback thanh toán");

            return Ok(new { Success = true });
        }

        /// <summary>
        /// Lấy lịch sử thanh toán của một đơn đặt vé
        /// </summary>
        [HttpGet("history/{bookingId}")]
        public async Task<IActionResult> GetPaymentHistory(int bookingId)
        {
            if (bookingId <= 0)
                return BadRequest("ID đơn đặt vé không hợp lệ");

            var paymentHistory = await _paymentService.GetPaymentHistoryAsync(bookingId);

            var result = paymentHistory.Select(p => new
            {
                p.Payment_ID,
                p.Booking_ID,
                p.Amount,
                p.Payment_Method,
                p.Payment_Reference,
                TransactionDate = p.Transaction_Date.ToString("dd/MM/yyyy HH:mm:ss"),
                p.Payment_Status,
                p.Processor_Response
            }).ToList();

            return Ok(result);
        }
    }

    public class CashPaymentRequest
    {
        public int BookingId { get; set; }
        public decimal Amount { get; set; }
        public int ProcessedBy { get; set; }
    }

    public class CreditCardPaymentRequest
    {
        public int BookingId { get; set; }
        public decimal Amount { get; set; }
        public string CardNumber { get; set; }
        public string CardholderName { get; set; }
        public string ExpiryDate { get; set; }
        public string CVV { get; set; }
    }

    public class OnlinePaymentRequest
    {
        public int BookingId { get; set; }
        public decimal Amount { get; set; }
    }

    public class PaymentCallbackRequest
    {
        public string PaymentMethod { get; set; }
        public string OrderId { get; set; }
        public string Status { get; set; }
        public string Signature { get; set; }
    }
}

