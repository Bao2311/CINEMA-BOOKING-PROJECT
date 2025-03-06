using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Net.Mail;
using System.Net;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly EmailService _emailService;
        public AuthController(AuthService authService, ILogger<AuthController> logger, EmailService emailService)
        {
            _authService = authService;
            _logger = logger;
            _emailService = emailService;
        }

        // Task 1.1: Implement Login Functionality
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            try
            {
                var result = await _authService.LoginAsync(loginDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 1.2: Implement Logout Functionality
        // Logout được xử lý ở phía client bằng cách xóa token, không cần xử lý ở server
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Không cần xử lý gì ở server, client sẽ xóa token
            return Ok(new { message = "Đăng xuất thành công" });
        }

        // Task 2.1: Implement User Registration
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto registerDto)
        {
            try
            {
                var result = await _authService.RegisterAsync(registerDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 2.2: Implement Account Editing (Profile Update)
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto updateProfileDto)
        {
            try
            {
                // Lấy UserId từ claim trong token
                if (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                var result = await _authService.UpdateProfileAsync(userId, updateProfileDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 2.3: Implement Password Change
        [HttpPut("password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            try
            {
                // Lấy UserId từ claim trong token
                if (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                await _authService.ChangePasswordAsync(userId, changePasswordDto);
                return Ok(new { message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 2.3: Implement Password Reset
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            try
            {
                var result = await _authService.ResetPasswordAsync(resetPasswordDto.Email);
                return Ok(new { message = "Mật khẩu mới đã được gửi đến email của bạn", success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message, success = false });
            }
        }
        [HttpGet("test-direct-email")]
        [AllowAnonymous]
        public async Task<IActionResult> TestDirectEmail()
        {
            try
            {
                var toEmail = "Phucnguyen5640@gmail.com"; // Email người nhận
                var subject = "Test Email từ STP Cinema";
                var body = "<h1>Test Email</h1><p>Đây là email kiểm tra từ ứng dụng STP Cinema.</p>";

                // Cấu hình SMTP client trực tiếp
                using (var client = new SmtpClient("smtp.gmail.com", 587))
                {
                    client.EnableSsl = true;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(
                        "phucnvse180213@fpt.edu.vn",
                        "gbqqzmsygjjonygw");

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress("phucnvse180213@fpt.edu.vn", "STP Cinema"),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(toEmail);

                    _logger.LogInformation("Testing direct email send...");
                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("Direct email sent successfully");
                }

                return Ok(new { message = "Direct test email sent successfully", success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send direct test email: {ex.Message}");
                return BadRequest(new { message = $"Lỗi gửi email trực tiếp: {ex.Message}", success = false });
            }
        }

        // Task 2.4: Get Current User Profile
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfile()
        {
            try
            {
                // Lấy UserId từ claim trong token
                if (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                var result = await _authService.GetUserProfileAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}