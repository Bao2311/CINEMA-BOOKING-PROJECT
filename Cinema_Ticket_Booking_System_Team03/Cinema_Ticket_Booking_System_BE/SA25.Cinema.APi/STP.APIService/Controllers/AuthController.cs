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

        /// <summary>
        /// Khởi tạo controller với các dependency cần thiết
        /// </summary>
        public AuthController(AuthService authService, ILogger<AuthController> logger, EmailService emailService, AccountLockingService accountLockingService)
        {
            _authService = authService;
            _logger = logger;
            _emailService = emailService;
            _accountLockingService = accountLockingService;
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
    }
}
