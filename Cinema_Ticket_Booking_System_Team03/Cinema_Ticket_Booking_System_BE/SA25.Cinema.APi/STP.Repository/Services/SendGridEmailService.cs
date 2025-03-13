using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                _logger.LogInformation($"Preparing to send email to {toEmail}");

                // Lấy cấu hình từ EmailSettings
                var smtpServer = _configuration["EmailSettings:SmtpServer"];
                var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"]);
                var senderEmail = _configuration["EmailSettings:SenderEmail"];
                var senderName = _configuration["EmailSettings:SenderName"];
                var username = _configuration["EmailSettings:SmtpUsername"];
                var password = _configuration["EmailSettings:SmtpPassword"];
                var enableSsl = bool.Parse(_configuration["EmailSettings:EnableSsl"]);

                _logger.LogInformation($"Using SMTP server: {smtpServer}:{smtpPort}");

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    // Cấu hình xác thực SMTP
                    client.EnableSsl = enableSsl;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(username, password);
                    client.DeliveryMethod = SmtpDeliveryMethod.Network;

                    _logger.LogInformation("Sending email with credentials...");
                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("Email sent successfully");
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email: {ex.Message}");
                throw new Exception($"Không thể gửi email: {ex.Message}", ex);
            }
        }
        /// <summary>
        /// Gửi email thông báo tài khoản bị khóa tạm thời
        /// </summary>
        /// <param name="email">Email người nhận</param>
        /// <param name="fullName">Họ tên người nhận</param>
        /// <returns>Task</returns>
        public async Task SendAccountLockedEmailAsync(string email, string fullName)
        {
            try
            {
                _logger.LogInformation($"Preparing to send account locked notification to {email}");

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

                await SendEmailAsync(email, subject, body);
                _logger.LogInformation($"Account locked notification sent to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending account locked notification: {ex.Message}");
                throw;
            }
        }

    }
}
