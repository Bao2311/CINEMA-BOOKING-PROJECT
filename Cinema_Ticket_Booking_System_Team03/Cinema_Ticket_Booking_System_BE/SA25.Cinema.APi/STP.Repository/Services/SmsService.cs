using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace STP.Repository.Services
{
    /// <summary>
    /// Dịch vụ xử lý việc gửi SMS trong hệ thống
    /// </summary>
    public class SmsService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmsService> _logger;
        private readonly HttpClient _httpClient;

        /// <summary>
        /// Khởi tạo dịch vụ SMS với cấu hình và logger
        /// </summary>
        /// <param name="configuration">Cấu hình ứng dụng</param>
        /// <param name="logger">Logger để ghi nhật ký</param>
        /// <param name="httpClient">HTTP client để gọi API SMS</param>
        public SmsService(IConfiguration configuration, ILogger<SmsService> logger, HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        /// <summary>
        /// Gửi tin nhắn SMS đến số điện thoại chỉ định
        /// </summary>
        /// <param name="phoneNumber">Số điện thoại người nhận</param>
        /// <param name="message">Nội dung tin nhắn</param>
        /// <returns>True nếu gửi thành công, False nếu thất bại</returns>
        public async Task<bool> SendSmsAsync(string phoneNumber, string message)
        {
            try
            {
                _logger.LogInformation($"Preparing to send SMS to {phoneNumber}");

                // Lấy thông tin cấu hình SMS từ cài đặt ứng dụng
                var apiUrl = _configuration["SmsSettings:ApiUrl"];
                var apiKey = _configuration["SmsSettings:ApiKey"];
                var senderId = _configuration["SmsSettings:SenderId"];

                // Kiểm tra thông tin cấu hình
                if (string.IsNullOrEmpty(apiUrl) || string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogError("SMS API URL or API Key is missing in configuration");
                    return false;
                }

                // Chuẩn bị dữ liệu gửi đi
                var encodedMessage = HttpUtility.UrlEncode(message);
                var requestUrl = $"{apiUrl}?apikey={apiKey}&sender={senderId}&to={phoneNumber}&message={encodedMessage}";

                // Gửi yêu cầu đến API SMS
                _logger.LogInformation($"Sending SMS request to API: {apiUrl}");
                var response = await _httpClient.GetAsync(requestUrl);

                // Kiểm tra kết quả
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation($"SMS sent successfully. Response: {responseContent}");
                    return true;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to send SMS. Status: {response.StatusCode}, Error: {errorContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending SMS: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gửi tin nhắn SMS thông báo đặt vé thành công
        /// </summary>
        /// <param name="phoneNumber">Số điện thoại người nhận</param>
        /// <param name="bookingId">Mã đặt vé</param>
        /// <param name="movieName">Tên phim</param>
        /// <param name="showDate">Ngày chiếu (dd/MM)</param>
        /// <param name="showTime">Giờ chiếu (HH:mm)</param>
        /// <returns>True nếu gửi thành công, False nếu thất bại</returns>
        public async Task<bool> SendBookingConfirmationSmsAsync(
            string phoneNumber, string bookingId, string movieName, string showDate, string showTime)
        {
            try
            {
                _logger.LogInformation($"Preparing to send booking confirmation SMS to {phoneNumber}");

                // Tạo nội dung tin nhắn
                string message = $"STP Cinema: Don dat ve #{bookingId} cho phim {movieName} ngay {showDate} " +
                                 $"gio {showTime} da duoc xac nhan. Cam on quy khach!";

                // Gửi SMS
                return await SendSmsAsync(phoneNumber, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending booking confirmation SMS: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gửi tin nhắn SMS chứa mã xác thực
        /// </summary>
        /// <param name="phoneNumber">Số điện thoại người nhận</param>
        /// <param name="verificationCode">Mã xác thực</param>
        /// <returns>True nếu gửi thành công, False nếu thất bại</returns>
        public async Task<bool> SendVerificationCodeSmsAsync(string phoneNumber, string verificationCode)
        {
            try
            {
                _logger.LogInformation($"Preparing to send verification code SMS to {phoneNumber}");

                // Tạo nội dung tin nhắn
                string message = $"STP Cinema: Ma xac thuc cua ban la {verificationCode}. " +
                                 $"Ma co hieu luc trong 5 phut. Vui long khong chia se ma nay voi bat ky ai.";

                // Gửi SMS
                return await SendSmsAsync(phoneNumber, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending verification code SMS: {ex.Message}");
                return false;
            }
        }
    }
}

