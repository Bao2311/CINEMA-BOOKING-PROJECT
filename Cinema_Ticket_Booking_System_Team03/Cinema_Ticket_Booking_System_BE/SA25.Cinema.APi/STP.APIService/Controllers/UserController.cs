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
using STP.APIService.Controllers.DTOs;

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
        private readonly IUserProfileService _userProfileService;
        private readonly EmailService _emailService;

        /// <summary>
        /// Khởi tạo controller với các dependency cần thiết
        /// </summary>
        public UserController(UserRepository userRepository, AuthService authService, EmailService emailService, IUserProfileService userProfileService)
        {
            _userRepository = userRepository;
            _authService = authService;
            _emailService = emailService;
            _userProfileService = userProfileService;
        }

        /// <summary>
        /// API lấy danh sách tất cả người dùng (Task 2.4: Implement View Member List)
        /// Trả về danh sách người dùng với thông tin cơ bản, không bao gồm mật khẩu
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                // Lấy tất cả người dùng từ repository
                var users = await _userRepository.GetAllAsync();
                // Chuyển đổi sang DTO để không tiết lộ thông tin nhạy cảm như mật khẩu
                var userDtos = await users.Select(u => new
                {
                    u.User_ID,
                    u.Full_Name,
                    u.Email,
                    u.Role,
                    u.Date_Of_Birth,
                    u.Sex,
                    u.Phone_Number,
                    u.Address,
                    u.Account_Status,
                    u.Created_At,
                    u.Last_Login
                }).ToListAsync();

                return Ok(userDtos);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API lấy thông tin người dùng theo ID (Task 2.4: Get User By ID)
        /// Trả về thông tin chi tiết của một người dùng cụ thể
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                // Lấy thông tin người dùng theo ID
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                // Chuyển đổi sang DTO để không tiết lộ thông tin nhạy cảm như mật khẩu
                var userDto = new
                {
                    user.User_ID,
                    user.Full_Name,
                    user.Email,
                    user.Role,
                    user.Date_Of_Birth,
                    user.Sex,
                    user.Phone_Number,
                    user.Address,
                    user.Account_Status,
                    user.Created_At,
                    user.Last_Login
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API đăng ký người dùng mới bởi admin với mật khẩu tự động
        /// Admin có thể tạo tài khoản cho người dùng mới, hệ thống sẽ tự động tạo mật khẩu
        /// </summary>
        [HttpPost("register-user")]
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
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, AdminUpdateUserDto updateDto)
        {
            try
            {
                // Kiểm tra người dùng tồn tại
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                // Cập nhật thông tin cơ bản
                var profileDto = new AdminUpdateUserDto
                {
                    FullName = updateDto.FullName,
                    DateOfBirth = updateDto.DateOfBirth,
                    Sex = updateDto.Sex,
                    PhoneNumber = updateDto.PhoneNumber,
                    Address = updateDto.Address,
                    Role = updateDto.Role
                };

                // Cập nhật trạng thái tài khoản nếu có thay đổi
                if (!string.IsNullOrEmpty(updateDto.AccountStatus) && user.Account_Status != updateDto.AccountStatus)
                {
                    await _authService.ChangeAccountStatusAsync(id, updateDto.AccountStatus);
                }

                return Ok(profileDto);
            }
            catch (Exception ex)
            {
                // Trả về lỗi nếu có vấn đề
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// API xóa người dùng (Task 2.5: Implement Admin User Management - Delete)
        /// Admin có thể xóa người dùng khỏi hệ thống, nhưng không thể xóa chính mình
        /// </summary>
        [HttpDelete("{id}")]
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

                // Xóa người dùng
                await _userRepository.DeleteAsync(user);
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
    }
}
