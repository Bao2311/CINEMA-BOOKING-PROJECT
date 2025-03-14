using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Net.Mail;
using System.Net;
using STP.Repositories;

namespace STP.APIService.Controllers
{
    /// <summary>
    /// Controller quản lý xác thực và tài khoản người dùng
    /// Cung cấp các API để đăng nhập, đăng ký, đổi mật khẩu và quản lý tài khoản
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly EmailService _emailService;
        private readonly AccountLockingService _accountLockingService;
        private readonly EmailVerificationService _emailVerificationService;
        private readonly UserRepository _userRepository;
        /// <summary>
        /// Khởi tạo controller với các dependency cần thiết
        /// </summary>
        public AuthController(AuthService authService, ILogger<AuthController> logger, EmailService emailService, AccountLockingService accountLockingService, EmailVerificationService emailVerificationService, UserRepository userRepository)
        {
            _authService = authService;
            _logger = logger;
            _emailService = emailService;
            _accountLockingService = accountLockingService;
            _emailVerificationService = emailVerificationService;
            _userRepository = userRepository;
        }

        /// <summary>
        /// API đăng nhập - không yêu cầu xác thực
        /// Nhận thông tin đăng nhập và trả về token JWT nếu thành công
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            try
            {
                // Gọi service xác thực để đăng nhập
                var result = await _authService.LoginAsync(loginDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu đăng nhập thất bại
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API đăng xuất - yêu cầu người dùng đã xác thực
        /// Chú ý: Đăng xuất chủ yếu xử lý ở client bằng cách xóa token
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // Không cần xử lý gì ở server, client sẽ xóa token
            return Ok(new { message = "Đăng xuất thành công" });
        }

        /// <summary>
        /// API đăng ký tài khoản mới - không yêu cầu xác thực
        /// Nhận thông tin đăng ký và tạo tài khoản mới trong hệ thống
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto registerDto)
        {
            try
            {
                // Gọi service để đăng ký tài khoản mới
                var result = await _authService.RegisterAsync(registerDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu đăng ký thất bại
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API cập nhật thông tin cá nhân - yêu cầu người dùng đã xác thực
        /// Nhận thông tin cập nhật và lưu vào hệ thống
        /// </summary>
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto updateProfileDto)
        {
            try
            {
                // Lấy ID người dùng từ token JWT
                if (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                // Gọi service để cập nhật thông tin
                var result = await _authService.UpdateProfileAsync(userId, updateProfileDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu cập nhật thất bại
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API đổi mật khẩu - yêu cầu người dùng đã xác thực
        /// Nhận mật khẩu cũ và mới, thực hiện đổi mật khẩu nếu hợp lệ
        /// </summary>
        [HttpPut("password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            try
            {
                // Lấy ID người dùng từ token JWT
                if (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                // Gọi service để đổi mật khẩu
                await _authService.ChangePasswordAsync(userId, changePasswordDto);
                return Ok(new { message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu đổi mật khẩu thất bại
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API khôi phục mật khẩu - không yêu cầu xác thực
        /// Nhận email và gửi mật khẩu mới qua email nếu tài khoản tồn tại
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            try
            {
                // Gọi service để reset mật khẩu và gửi mật khẩu mới qua email
                var result = await _authService.ResetPasswordAsync(resetPasswordDto.Email);
                return Ok(new { message = "Mật khẩu mới đã được gửi đến email của bạn", success = true });
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu reset mật khẩu thất bại
                return BadRequest(new { message = ex.Message, success = false });
            }
        }

        /// <summary>
        /// API lấy thông tin cá nhân của người dùng hiện tại - yêu cầu đã xác thực
        /// Trả về thông tin chi tiết của người dùng đang đăng nhập
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfile()
        {
            try
            {
                // Lấy ID người dùng từ token JWT
                if (!int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int userId))
                {
                    return Unauthorized(new { message = "Không tìm thấy thông tin người dùng" });
                }

                // Gọi service để lấy thông tin người dùng
                var result = await _authService.GetUserProfileAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu không lấy được thông tin
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API kiểm tra trạng thái khóa của tài khoản - không yêu cầu xác thực
        /// Trả về thông tin về trạng thái khóa và thời gian còn lại nếu tài khoản bị khóa
        /// </summary>
        [HttpGet("check-account-status")]
        public async Task<IActionResult> CheckAccountStatus([FromQuery] string email)
        {
            try
            {
                // Kiểm tra xem tài khoản có bị khóa không
                bool isLocked = await _accountLockingService.IsAccountLockedAsync(email);
                if (isLocked)
                {
                    // Nếu bị khóa, trả về thời gian còn lại
                    int remainingMinutes = await _accountLockingService.GetRemainingLockTimeAsync(email);
                    return Ok(new
                    {
                        isLocked = true,
                        remainingMinutes = remainingMinutes,
                        message = $"Tài khoản đang bị khóa. Còn {remainingMinutes} phút để mở khóa."
                    });
                }
                else
                {
                    // Nếu không bị khóa, trả về thông báo bình thường
                    return Ok(new
                    {
                        isLocked = false,
                        message = "Tài khoản đang hoạt động bình thường."
                    });
                }
            }
            catch (Exception ex)
            {
                // Ghi log và trả về lỗi
                _logger.LogError($"Lỗi khi kiểm tra trạng thái tài khoản: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API mở khóa tài khoản - chỉ dành cho quản trị viên
        /// Admin có thể mở khóa tài khoản bị khóa trước thời hạn
        /// </summary>
        [HttpPost("unlock-account")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnlockAccount([FromBody] UnlockAccountDto unlockDto)
        {
            try
            {
                // Gọi service để mở khóa tài khoản
                var result = await _authService.UnlockAccountAsync(unlockDto.Email);
                if (result)
                {
                    return Ok(new { message = "Tài khoản đã được mở khóa thành công" });
                }
                else
                {
                    return NotFound(new { message = "Không tìm thấy tài khoản" });
                }
            }
            catch (Exception ex)
            {
                // Ghi log và trả về lỗi
                _logger.LogError($"Lỗi khi mở khóa tài khoản: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API xác thực email - không yêu cầu xác thực
        /// </summary>
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(new { success = false, message = "Token không hợp lệ" });
                }

                bool verified = await _emailVerificationService.VerifyEmailAsync(token, _userRepository);

                if (verified)
                {
                    // Trả về trang HTML thông báo thành công
                    string htmlResponse = @"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Xác thực email thành công</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        text-align: center;
                    }
                    .success-container {
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        padding: 20px;
                        margin-top: 30px;
                    }
                    .success-icon {
                        color: #28a745;
                        font-size: 48px;
                    }
                    h1 {
                        color: #28a745;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #007bff;
                        color: white;
                        padding: 10px 20px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class='success-container'>
                    <div class='success-icon'>✓</div>
                    <h1>Xác thực email thành công!</h1>
                    <p>Cảm ơn bạn đã xác thực email. Tài khoản của bạn đã được kích hoạt.</p>
                    <p>Bạn có thể đăng nhập và bắt đầu sử dụng dịch vụ của chúng tôi.</p>
                </div>
            </body>
            </html>";

                    return Content(htmlResponse, "text/html");
                }
                else
                {
                    // Trả về trang HTML thông báo thất bại
                    string htmlResponse = @"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Xác thực email thất bại</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        text-align: center;
                    }
                    .error-container {
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        padding: 20px;
                        margin-top: 30px;
                    }
                    .error-icon {
                        color: #dc3545;
                        font-size: 48px;
                    }
                    h1 {
                        color: #dc3545;
                    }
                </style>
            </head>
            <body>
                <div class='error-container'>
                    <div class='error-icon'>✗</div>
                    <h1>Xác thực email thất bại</h1>
                    <p>Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.</p>
                    <p>Vui lòng thử lại hoặc yêu cầu gửi lại email xác thực.</p>
                </div>
            </body>
            </html>";

                    return Content(htmlResponse, "text/html");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi xác thực email: {ex.Message}");
                return BadRequest(new { success = false, message = "Đã xảy ra lỗi khi xác thực email" });
            }
        }

        /// <summary>
        /// API gửi lại email xác thực - không yêu cầu xác thực
        /// </summary>
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationDto model)
        {
            try
            {
                var user = await _userRepository.GetByEmailAsync(model.Email);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy tài khoản với email này" });
                }

                // Kiểm tra trạng thái tài khoản
                if (user.Account_Status != "Pending")
                {
                    return BadRequest(new { success = false, message = "Tài khoản đã được xác thực hoặc không ở trạng thái chờ xác thực" });
                }

                // Tạo và gửi token xác thực mới
                await _emailVerificationService.GenerateVerificationTokenAsync(user.Email, user.Full_Name);

                return Ok(new { success = true, message = "Email xác thực đã được gửi lại" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi gửi lại email xác thực: {ex.Message}");
                return BadRequest(new { success = false, message = "Đã xảy ra lỗi khi gửi lại email xác thực" });
            }
        }
    }
}
