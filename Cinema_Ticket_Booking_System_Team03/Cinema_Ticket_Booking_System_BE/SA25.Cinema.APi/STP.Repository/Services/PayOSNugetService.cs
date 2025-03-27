using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Net.payOS;
using Net.payOS.Types;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class PayOSNugetService
    {
        private readonly ILogger<PayOSNugetService> _logger;
        private readonly IConfiguration _configuration;
        private readonly PayOS _payOS;

        public PayOSNugetService(ILogger<PayOSNugetService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            // Lấy thông tin từ cấu hình
            string clientId = _configuration["PayOS:ClientId"];
            string apiKey = _configuration["PayOS:ApiKey"];
            string checksumKey = _configuration["PayOS:ChecksumKey"];

            // Khởi tạo PayOS
            _payOS = new PayOS(clientId, apiKey, checksumKey);
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

                // URL trả về sau khi thanh toán
                string returnUrl = _configuration["PayOS:ReturnUrl"] ?? "https://your-website.com/api/payment/payos/return";
                string cancelUrl = _configuration["PayOS:CancelUrl"] ?? "https://your-website.com/api/payment/payos/cancel";

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
}