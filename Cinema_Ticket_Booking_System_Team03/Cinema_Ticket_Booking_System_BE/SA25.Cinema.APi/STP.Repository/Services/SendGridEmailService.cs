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
    }
}
