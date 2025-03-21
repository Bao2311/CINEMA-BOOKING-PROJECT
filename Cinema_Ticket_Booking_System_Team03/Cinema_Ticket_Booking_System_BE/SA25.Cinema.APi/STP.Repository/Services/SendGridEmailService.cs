using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    /// <summary>
    /// Dịch vụ xử lý việc gửi email trong hệ thống
    /// </summary>
    public class EmailService
    {
        private readonly IConfiguration _configuration; // Cấu hình ứng dụng
        private readonly ILogger<EmailService> _logger; // Logger ghi nhật ký

        /// <summary>
        /// Khởi tạo dịch vụ email với cấu hình và logger
        /// </summary>
        /// <param name="configuration">Cấu hình ứng dụng</param>
        /// <param name="logger">Logger để ghi nhật ký</param>
        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Gửi email đến người nhận với tiêu đề và nội dung được chỉ định
        /// </summary>
        /// <param name="toEmail">Địa chỉ email người nhận</param>
        /// <param name="subject">Tiêu đề email</param>
        /// <param name="body">Nội dung email (hỗ trợ HTML)</param>
        /// <param name="attachments">Danh sách các tệp đính kèm (tùy chọn)</param>
        /// <returns>True nếu gửi thành công, False nếu có lỗi</returns>
        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body, ICollection<Attachment> attachments = null)
        {
            try
            {
                _logger.LogInformation($"Preparing to send email to {toEmail} with subject: {subject}");

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_configuration["EmailSettings:SenderEmail"], _configuration["EmailSettings:SenderName"] ?? "STP Cinema"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                // Thêm các tệp đính kèm nếu có
                if (attachments != null && attachments.Count > 0)
                {
                    _logger.LogInformation($"Adding {attachments.Count} attachments to email");
                    foreach (var attachment in attachments)
                    {
                        mailMessage.Attachments.Add(attachment);
                    }
                }

                using (var client = new SmtpClient(_configuration["EmailSettings:SmtpServer"], int.Parse(_configuration["EmailSettings:SmtpPort"])))
                {
                    client.EnableSsl = bool.Parse(_configuration["EmailSettings:EnableSsl"]);
                    client.Credentials = new NetworkCredential(
                        _configuration["EmailSettings:SmtpUsername"],
                        _configuration["EmailSettings:SmtpPassword"]
                    );

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation($"Email sent successfully to {toEmail} with {(attachments?.Count ?? 0)} attachments");
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email to {toEmail}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gửi email thông báo tài khoản bị khóa tạm thời
        /// </summary>
        /// <param name="email">Email người nhận</param>
        /// <param name="fullName">Họ tên người nhận</param>
        /// <returns>True nếu gửi thành công, False nếu có lỗi</returns>
        public async Task<bool> SendAccountLockedEmailAsync(string email, string fullName)
        {
            try
            {
                _logger.LogInformation($"Preparing to send account locked notification to {email}");

                // Chuẩn bị tiêu đề và nội dung email
                var subject = "Thông báo tài khoản bị khóa tạm thời";
                var body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; }}
                        .footer {{ background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 5px 5px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Thông báo tài khoản bị khóa tạm thời</h2>
                        </div>
                        <div class='content'>
                            <p>Xin chào <strong>{fullName}</strong>,</p>
                            <p>Chúng tôi phát hiện có nhiều lần đăng nhập không thành công liên tiếp vào tài khoản của bạn.</p>
                            <p>Vì lý do bảo mật, tài khoản của bạn đã bị khóa tạm thời trong vòng 30 phút.</p>
                            <p>Bạn có thể thử đăng nhập lại sau khoảng thời gian này hoặc liên hệ với quản trị viên để được hỗ trợ.</p>
                            <p>Nếu bạn không thực hiện các lần đăng nhập này, vui lòng thay đổi mật khẩu của bạn ngay khi có thể đăng nhập lại.</p>
                            <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
                        </div>
                        <div class='footer'>
                            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                        </div>
                    </div>
                </body>
                </html>
                ";

                // Gửi email
                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi
                _logger.LogError(ex, $"Error sending account locked notification: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gửi email thông báo mật khẩu cho người dùng mới
        /// </summary>
        /// <param name="email">Email người nhận</param>
        /// <param name="fullName">Họ tên người nhận</param>
        /// <param name="password">Mật khẩu tạm thời</param>
        /// <returns>True nếu gửi thành công, False nếu có lỗi</returns>
        public async Task<bool> SendPasswordNotificationEmailAsync(string email, string fullName, string password)
        {
            try
            {
                _logger.LogInformation($"Preparing to send password notification to {email}");

                // Chuẩn bị tiêu đề và nội dung email
                string subject = "Thông tin tài khoản mới của bạn";
                string body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; }}
                        .password {{ font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 3px; border: 1px solid #ddd; }}
                        .footer {{ background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 5px 5px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Thông Tin Tài Khoản Mới</h2>
                        </div>
                        <div class='content'>
                            <p>Xin chào <strong>{fullName}</strong>,</p>
                            <p>Tài khoản của bạn đã được tạo thành công trong hệ thống của chúng tôi.</p>
                            <p>Dưới đây là thông tin đăng nhập của bạn:</p>
                            <ul>
                                <li><strong>Email:</strong> {email}</li>
                                <li><strong>Mật khẩu:</strong> <span class='password'>{password}</span></li>
                            </ul>
                            <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi nhận được email này để đảm bảo an toàn cho tài khoản của bạn.</p>
                            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
                            <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
                        </div>
                        <div class='footer'>
                            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                        </div>
                    </div>
                </body>
                </html>
                ";

                // Gửi email
                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi
                _logger.LogError(ex, $"Error sending password notification email: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gửi email chào mừng cho khách hàng mới đăng ký
        /// </summary>
        /// <param name="email">Email người nhận</param>
        /// <param name="fullName">Họ tên người nhận</param>
        /// <returns>True nếu gửi thành công, False nếu có lỗi</returns>
        public async Task<bool> SendWelcomeEmailAsync(string email, string fullName)
        {
            try
            {
                _logger.LogInformation($"Preparing to send welcome email to {email}");

                // Chuẩn bị tiêu đề và nội dung email
                string subject = "Chào mừng bạn đến với dịch vụ của chúng tôi";
                string body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; }}
                        .button {{ display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }}
                        .footer {{ background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 5px 5px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Chào mừng bạn!</h2>
                        </div>
                        <div class='content'>
                            <p>Xin chào <strong>{fullName}</strong>,</p>
                            <p>Chúng tôi rất vui mừng chào đón bạn đã đăng ký tài khoản thành công trên hệ thống của chúng tôi.</p>
                            <p>Với tài khoản này, bạn có thể:</p>
                            <ul>
                                <li>Đặt vé xem phim một cách nhanh chóng</li>
                                <li>Theo dõi lịch sử giao dịch</li>
                                <li>Nhận thông báo về các ưu đãi đặc biệt</li>
                                <li>Và nhiều tiện ích khác</li>
                            </ul>
                            <p>Hãy khám phá các dịch vụ của chúng tôi ngay bây giờ!</p>
                            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
                            <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
                        </div>
                        <div class='footer'>
                            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                        </div>
                    </div>
                </body>
                </html>
                ";

                // Gửi email
                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi
                _logger.LogError(ex, $"Error sending welcome email: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gửi email xác thực tài khoản cho người dùng mới đăng ký
        /// </summary>
        /// <param name="email">Email người nhận</param>
        /// <param name="fullName">Họ tên người nhận</param>
        /// <param name="token">Token xác thực</param>
        /// <returns>True nếu gửi thành công, False nếu có lỗi</returns>
        public async Task<bool> SendVerificationEmailAsync(string email, string fullName, string token)
        {
            try
            {
                _logger.LogInformation($"Preparing to send verification email to {email}");

                // Lấy URL API từ cấu hình
                var baseUrl = _configuration["AppSettings:ApiBaseUrl"] ?? "https://localhost:5001";
                var verificationUrl = $"{baseUrl}/api/auth/verify-email?token={token}";

                // Chuẩn bị tiêu đề và nội dung email
                string subject = "Xác thực tài khoản STP Cinema";
                string body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; }}
                        .button {{ display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }}
                        .footer {{ background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 5px 5px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Xác thực tài khoản STP Cinema</h2>
                        </div>
                        <div class='content'>
                            <p>Xin chào <strong>{fullName}</strong>,</p>
                            <p>Cảm ơn bạn đã đăng ký tài khoản tại STP Cinema. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn bằng cách nhấp vào nút bên dưới:</p>
                            <p style='text-align: center;'>
                                <a href='{verificationUrl}' class='button' style='color: white;'>Xác thực tài khoản</a>
                            </p>
                            <p>Hoặc bạn có thể sao chép và dán đường dẫn sau vào trình duyệt:</p>
                            <p style='word-break: break-all;'><a href='{verificationUrl}'>{verificationUrl}</a></p>
                            <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
                            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                            <p>Trân trọng,<br>Đội ngũ STP Cinema</p>
                        </div>
                        <div class='footer'>
                            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                        </div>
                    </div>
                </body>
                </html>";

                // Gửi email
                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                // Ghi log lỗi
                _logger.LogError(ex, $"Error sending verification email: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Gửi email vé xem phim kèm file PDF
        /// </summary>
        /// <param name="toEmail">Email người nhận</param>
        /// <param name="customerName">Tên khách hàng</param>
        /// <param name="bookingInfo">Thông tin đặt vé</param>
        /// <param name="pdfTickets">Danh sách các vé dạng PDF</param>
        /// <returns>True nếu gửi thành công, False nếu có lỗi</returns>
        public async Task<bool> SendTicketsEmailAsync(
            string toEmail,
            string customerName,
            Dictionary<string, string> bookingInfo,
            List<(string ticketCode, byte[] pdfContent)> pdfTickets)
        {
            try
            {
                _logger.LogInformation($"Preparing to send tickets email to {toEmail} for booking {bookingInfo["BookingId"]}");

                string subject = "Vé xem phim của bạn tại STP Cinema";
                string body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .header {{ background-color: #f8f9fa; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ padding: 20px; }}
                        .ticket-info {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                        .footer {{ background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 5px 5px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Vé xem phim của bạn</h2>
                        </div>
                        <div class='content'>
                            <p>Xin chào <strong>{customerName}</strong>,</p>
                            <p>Cảm ơn bạn đã đặt vé tại STP Cinema. Dưới đây là thông tin chi tiết về đặt vé của bạn:</p>
                            
                            <div class='ticket-info'>
                                <p><strong>Mã đặt vé:</strong> {bookingInfo["BookingId"]}</p>
                                <p><strong>Phim:</strong> {bookingInfo["MovieName"]}</p>
                                <p><strong>Phòng chiếu:</strong> {bookingInfo["CinemaRoom"]}</p>
                                <p><strong>Ngày chiếu:</strong> {bookingInfo["ShowDate"]}</p>
                                <p><strong>Giờ chiếu:</strong> {bookingInfo["ShowTime"]}</p>
                                <p><strong>Ghế:</strong> {bookingInfo["Seats"]}</p>
                            </div>
                            
                            <p>Vé của bạn được đính kèm dưới dạng file PDF. Vui lòng mang theo vé (bản in hoặc trên điện thoại) khi đến rạp.</p>
                            <p>Lưu ý: Vui lòng đến trước giờ chiếu 15 phút để hoàn tất thủ tục.</p>
                            <p>Chúc bạn có trải nghiệm xem phim thú vị!</p>
                            <p>Trân trọng,<br>Đội ngũ STP Cinema</p>
                        </div>
                        <div class='footer'>
                            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                            <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua hotline: {_configuration["AppSettings:SupportPhone"] ?? "1900 xxxx"}</p>
                        </div>
                    </div>
                </body>
                </html>";

                // Tạo danh sách các tệp đính kèm
                List<Attachment> attachments = new List<Attachment>();

                foreach (var pdfTicket in pdfTickets)
                {
                    try
                    {
                        // Tạo MemoryStream từ mảng byte PDF
                        var ms = new MemoryStream(pdfTicket.pdfContent);

                        // Tạo đối tượng Attachment với tên file có mã vé
                        var attachment = new Attachment(ms, $"Ve_STP_Cinema_{pdfTicket.ticketCode}.pdf", "application/pdf");

                        // Thêm vào danh sách đính kèm
                        attachments.Add(attachment);

                        _logger.LogInformation($"PDF ticket {pdfTicket.ticketCode} prepared for attachment");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error preparing PDF attachment for ticket {pdfTicket.ticketCode}: {ex.Message}");
                        // Tiếp tục với các vé khác nếu có lỗi với một vé
                    }
                }

                // Gọi phương thức gửi email với các tệp đính kèm
                bool result = await SendEmailAsync(toEmail, subject, body, attachments);

                // Giải phóng tài nguyên sau khi gửi email
                foreach (var attachment in attachments)
                {
                    try
                    {
                        attachment.Dispose();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Error disposing attachment: {ex.Message}");
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending tickets email: {ex.Message}");
                return false;
            }
        }
    }
}


