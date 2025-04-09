using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STP.Repository.Dtos;
using STP.Repository.Models;
using STP.Repository.Services;
using STP.Repositories;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace STP.APIService.Controllers
{
    /// <summary>
    /// Controller quản lý người dùng trong hệ thống
    /// Cung cấp các API để xem, thêm, sửa, xóa và quản lý tài khoản người dùng
    /// Yêu cầu xác thực cho tất cả các endpoint
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly UserRepository _userRepository;
        private readonly AuthService _authService;
        private readonly UserProfileService _userProfileService;
        private readonly EmailService _emailService;
        private readonly ILogger<UserController> _logger;

        /// <summary>
        /// Khởi tạo controller với các dependency cần thiết
        /// </summary>
        public UserController(UserRepository userRepository, AuthService authService, EmailService emailService, UserProfileService userProfileService, ILogger<UserController> logger)
        {
            _userRepository = userRepository;
            _authService = authService;
            _emailService = emailService;
            _userProfileService = userProfileService;
            _logger = logger;
        }

        /// <summary>
        /// API lấy danh sách tất cả người dùng (Task 2.4: Implement View Member List)
        /// Trả về danh sách người dùng với thông tin cơ bản, không bao gồm mật khẩu
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                // Lấy tất cả người dùng chưa bị xóa mềm
                var users = await _userRepository.GetAllAsync();
                var activeUsers = users.Where(u => u.Account_Status != "Deleted");

                // Chuyển đổi sang DTO để trả về dữ liệu an toàn
                var userDtos = await activeUsers.Select(u => new
                {
                    u.Sex,
                    u.Last_Login,
                    u.Phone_Number,
                    u.Address,
                    u.Date_Of_Birth,
                    u.User_ID,
                    u.Full_Name,
                    u.Email,
                    u.Role,
                    u.Account_Status
                }).ToListAsync();

                return Ok(userDtos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API lấy thông tin người dùng theo ID (Task 2.4: Get User By ID)
        /// Trả về thông tin chi tiết của một người dùng cụ thể
        /// </summary>
        [HttpGet("{userId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            try
            {
                // Kiểm tra quyền truy cập
                int currentUserId = GetCurrentUserId();
                string currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Chỉ cho phép người dùng xem hồ sơ của chính mình hoặc Admin/staff có thể xem hồ sơ người khác
                if (currentUserId != userId && currentUserRole != "Admin" && currentUserRole != "Staff")
                {
                    return Forbid();
                }

                var profile = await _authService.GetUserProfileAsync(userId);
                return Ok(profile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user profile: {ex.Message}");
                return StatusCode(500, "Đã xảy ra lỗi khi lấy thông tin hồ sơ");
            }
        }

        /// <summary>
        /// API khôi phục người dùng đã bị xóa mềm
        /// </summary>
        [HttpPut("{id}/restore")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> RestoreUser(int id)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                if (user.Account_Status != "Deleted")
                    return BadRequest(new { message = "Người dùng chưa bị xóa mềm" });

                user.Account_Status = "Active";
                await _userRepository.UpdateAsync(user);
                return Ok(new { message = "Khôi phục người dùng thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API đăng ký người dùng mới bởi admin với mật khẩu tự động
        /// Admin có thể tạo tài khoản cho người dùng mới, hệ thống sẽ tự động tạo mật khẩu
        /// </summary>
        [HttpPost("register-user")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> RegisterUserWithAutoPassword(AdminRegisterUserDto model)
        {
            try
            {
                // Kiểm tra tính hợp lệ của dữ liệu đầu vào
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Lấy ID của admin đang thực hiện hành động
                var adminIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out int adminId))
                {
                    return Unauthorized("Không thể xác định thông tin admin.");
                }

                // Gọi service để đăng ký người dùng mới
                var result = await _authService.RegisterUserByAdminAsync(model, adminId);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API cập nhật thông tin người dùng (Task 2.5: Implement Admin User Management - Edit)
        /// Admin có thể cập nhật thông tin và vai trò của người dùng
        /// </summary>
        [HttpPut("{userId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateUser(int userId, [FromBody] BaseUpdateProfileDTO updateDto)
        {
            try
            {
                // Xác định admin đang thực hiện thao tác
                int adminId = GetCurrentUserId();

                // Kiểm tra nếu người dùng tự cập nhật thông tin của chính mình
                if (adminId == userId)
                {
                    // Nếu là thông tin của chính admin, không cần xác nhận qua email
                    var updatedProfile = await _authService.UpdateProfileAsync(userId, new UpdateProfileDto
                    {
                        FullName = updateDto.Full_Name,
                        PhoneNumber = updateDto.Phone_Number,
                        Address = updateDto.Address,
                        DateOfBirth = updateDto.Date_Of_Birth,
                        Sex = updateDto.Sex
                    });
                    return Ok(updatedProfile);
                }
                else
                {
                    // Kiểm tra xem đã có yêu cầu đang chờ xử lý không
                    if (_authService.HasPendingProfileRequest(userId))
                    {
                        return BadRequest(new { message = "Đã có yêu cầu thay đổi đang chờ người dùng xác nhận. Vui lòng đợi hoặc hủy yêu cầu cũ." });
                    }

                    // Tạo yêu cầu thay đổi và gửi email xác nhận
                    bool requestCreated = await _authService.CreateProfileChangeRequestAsync(userId, adminId, updateDto);

                    if (requestCreated)
                    {
                        return Ok(new { message = "Yêu cầu thay đổi đã được gửi đến email người dùng. Cần đợi người dùng chấp nhận." });
                    }
                    else
                    {
                        return BadRequest(new { message = "Không thể tạo yêu cầu thay đổi thông tin. Vui lòng thử lại sau." });
                    }
                }
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user profile: {ex.Message}");
                return StatusCode(500, "Đã xảy ra lỗi khi cập nhật hồ sơ");
            }
        }

        /// <summary>
        /// API xóa người dùng (Task 2.5: Implement Admin User Management - Delete)
        /// Admin có thể xóa người dùng khỏi hệ thống, nhưng không thể xóa chính mình
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                // Kiểm tra người dùng tồn tại
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                // Kiểm tra xem người dùng hiện tại có đang xóa chính mình không
                if (int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int currentUserId) && currentUserId == id)
                {
                    return BadRequest(new { message = "Không thể xóa tài khoản của chính mình" });
                }

                // Thực hiện xóa mềm
                user.Account_Status = "Deleted";

                // Cập nhật người dùng với trạng thái đã xóa
                await _userRepository.UpdateAsync(user);

                return Ok(new { message = "Xóa người dùng thành công" });
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API thay đổi trạng thái tài khoản (Task 1.3: Handle Account Lock)
        /// Admin có thể khóa hoặc mở khóa tài khoản người dùng
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> ChangeUserStatus(int id, UserStatusDto statusDto)
        {
            try
            {
                // Gọi service để thay đổi trạng thái tài khoản
                await _authService.ChangeAccountStatusAsync(id, statusDto.Status);
                return Ok(new { message = "Thay đổi trạng thái tài khoản thành công" });
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API đặt lại mật khẩu cho người dùng (Task 2.3: Implement Password Reset by Admin)
        /// Admin có thể đặt lại mật khẩu cho người dùng, hệ thống sẽ gửi mật khẩu mới qua email
        /// </summary>
        [HttpPost("{id}/reset-password")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> ResetPassword(int id)
        {
            try
            {
                // Kiểm tra người dùng tồn tại
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                // Gọi service để đặt lại mật khẩu và gửi email
                var result = await _authService.ResetPasswordAsync(user.Email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API lấy thông tin cá nhân của người dùng hiện tại dựa trên vai trò
        /// Người dùng có thể xem thông tin cá nhân của mình
        /// </summary>
        [HttpGet("profile")]
        [Authorize(Roles = "Admin,Staff,Customer, Manager")]
        public async Task<ActionResult<object>> GetUserProfile()
        {
            try
            {
                // Lấy ID người dùng hiện tại từ claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                int userId = int.Parse(userIdClaim.Value);

                try
                {
                    // Gọi service để lấy thông tin profile
                    var profile = await _userProfileService.GetUserProfileAsync(userId);
                    return Ok(profile);
                }
                catch (KeyNotFoundException)
                {
                    return NotFound(new { message = "User not found" });
                }
                catch (InvalidOperationException ex)
                {
                    return BadRequest(new { message = ex.Message });
                }
            }
            catch (Exception ex)
            {
                // Trả về lỗi hệ thống
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// API cập nhật thông tin cá nhân của người dùng hiện tại
        /// Người dùng có thể cập nhật thông tin cá nhân của mình
        /// </summary>
        [HttpPut("profile")]
        [Authorize(Roles = "Admin,Staff,Customer, Manager")]
        public async Task<IActionResult> UpdateProfile([FromBody] BaseUpdateProfileDTO updateProfileDto)
        {
            // Kiểm tra tính hợp lệ của dữ liệu đầu vào
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Lấy ID người dùng hiện tại
                var userId = GetUserIdFromClaims();
                // Gọi service để cập nhật thông tin profile
                var result = await _userProfileService.UpdateUserProfileAsync(userId, updateProfileDto);

                if (result == null)
                {
                    return BadRequest(new { message = "Failed to update profile" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Trả về lỗi hệ thống
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// API đăng ký người dùng mới bởi nhân viên
        /// Nhân viên có thể tạo tài khoản cho người dùng mới, hệ thống sẽ tự động tạo mật khẩu
        /// </summary>
        [HttpPost("staff-register")]
        [Authorize(Roles = "Staff, Admin, Manager")]
        public async Task<IActionResult> RegisterUserByStaff([FromBody] StaffRegisterUserDto model)
        {
            try
            {
                // Kiểm tra tính hợp lệ của dữ liệu đầu vào
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Lấy ID của nhân viên đang thực hiện hành động
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(staffIdClaim) || !int.TryParse(staffIdClaim, out int staffId))
                {
                    return Unauthorized("Không thể xác định thông tin nhân viên.");
                }

                // Gọi service để đăng ký người dùng mới
                var result = await _authService.RegisterUserByStaffAsync(model, staffId);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API kiểm tra thử tạo yêu cầu thay đổi thông tin
        /// </summary>
        [HttpGet("test-profile-change")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TestProfileChange(int userId)
        {
            try
            {
                int AdminId = GetCurrentUserId();
                _logger.LogInformation($"Admin {AdminId} đang gọi test thay đổi thông tin cho user {userId}");

                var updateDto = new BaseUpdateProfileDTO
                {
                    Phone_Number = "0987654321",
                    Address = "Test Address",
                    Date_Of_Birth = DateTime.Parse("2000-01-01"),
                    Sex = "Male"
                };

                // Gọi trực tiếp AuthService tạo yêu cầu thay đổi
                bool result = await _authService.CreateProfileChangeRequestAsync(userId, AdminId, updateDto);

                return Ok(new { success = result, message = result ? "Đã gửi yêu cầu thành công" : "Gửi yêu cầu thất bại" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Xử lý token phê duyệt thay đổi thông tin
        /// </summary>
        [HttpGet("approve-profile-change")]
        [AllowAnonymous] // Cho phép truy cập mà không cần xác thực
        public async Task<IActionResult> ApproveProfileChange([FromQuery] string token)
        {
            try
            {
                _logger.LogInformation($"Đang xử lý token phê duyệt: {token}");
                var result = await _authService.ProcessProfileApprovalTokenAsync(token);

                if (result.Success)
                {
                    // Trả về HTML trực tiếp thay vì chuyển hướng
                    string htmlResponse = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Cập nhật thông tin thành công</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f5f5f5;
                    }}
                    .container {{
                        max-width: 500px;
                        padding: 30px;
                        background-color: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        text-align: center;
                    }}
                    h1 {{
                        color: #e50914;
                        margin-bottom: 20px;
                    }}
                    p {{
                        font-size: 16px;
                        line-height: 1.5;
                        color: #333;
                        margin-bottom: 20px;
                    }}
                    .success-icon {{
                        font-size: 60px;
                        color: #4CAF50;
                        margin-bottom: 20px;
                    }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='success-icon'>✓</div>
                    <h1>Cập nhật thành công</h1>
                    <p>{result.Message}</p>
                    <p>Bạn có thể đóng trang này và tiếp tục sử dụng dịch vụ của STP Cinema.</p>
                </div>
            </body>
            </html>";

                    return Content(htmlResponse, "text/html");
                }
                else
                {
                    // Trả về HTML thông báo lỗi
                    string errorHtml = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Không thể cập nhật thông tin</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f5f5f5;
                    }}
                    .container {{
                        max-width: 500px;
                        padding: 30px;
                        background-color: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        text-align: center;
                    }}
                    h1 {{
                        color: #e50914;
                        margin-bottom: 20px;
                    }}
                    p {{
                        font-size: 16px;
                        line-height: 1.5;
                        color: #333;
                        margin-bottom: 20px;
                    }}
                    .error-icon {{
                        font-size: 60px;
                        color: #e50914;
                        margin-bottom: 20px;
                    }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='error-icon'>✗</div>
                    <h1>Không thể cập nhật thông tin</h1>
                    <p>{result.Message}</p>
                    <p>Vui lòng liên hệ với quản trị viên để được hỗ trợ.</p>
                </div>
            </body>
            </html>";

                    return Content(errorHtml, "text/html");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi xử lý token phê duyệt: {ex.Message}");
                return BadRequest("Có lỗi xảy ra khi xử lý yêu cầu");
            }
        }

        /// <summary>
        /// Hủy yêu cầu thay đổi thông tin
        /// </summary>
        [HttpDelete("cancel-profile-change/{userId}")]
        [Authorize(Roles = "Admin")]
        public IActionResult CancelProfileChangeRequest(int userId)
        {
            try
            {
                int AdminId = GetCurrentUserId();
                bool cancelled = _authService.CancelProfileChangeRequest(userId, AdminId);

                if (cancelled)
                {
                    return Ok(new { message = "Đã hủy yêu cầu thay đổi thông tin thành công" });
                }
                else
                {
                    return NotFound(new { message = "Không tìm thấy yêu cầu thay đổi thông tin" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi hủy yêu cầu thay đổi thông tin: {ex.Message}");
                return StatusCode(500, "Đã xảy ra lỗi khi hủy yêu cầu thay đổi thông tin");
            }
        }

        /// <summary>
        /// Phương thức hỗ trợ để lấy ID người dùng từ claims
        /// </summary>
        private int GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }

            return int.Parse(userIdClaim.Value);
        }

        /// <summary>
        /// Lấy ID người dùng hiện tại từ token
        /// </summary>
        private int GetCurrentUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }
    }
}



