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
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly UserRepository _userRepository;
        private readonly AuthService _authService;
        private readonly IUserProfileService _userProfileService;
        private readonly EmailService _emailService;

        public UserController(UserRepository userRepository, AuthService authService, EmailService emailService,IUserProfileService userProfileService)
        {
            _userRepository = userRepository;
            _authService = authService;
            _emailService = emailService;
            _userProfileService = userProfileService;
        }

        // Task 2.4: Implement View Member List
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
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
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 2.4: Get User By ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
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
                return BadRequest(new { message = ex.Message });
            }
        }

        // Thêm endpoint mới để admin đăng ký người dùng với mật khẩu tự động
        [HttpPost("register-user")]
        public async Task<IActionResult> RegisterUserWithAutoPassword(AdminRegisterUserDto model)
        {
            try
            {
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
                return BadRequest(new { message = ex.Message });
            }
        }
         

        // Task 2.5: Implement Admin User Management (Edit)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, AdminUpdateUserDto updateDto)
        {
            try
            {
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
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 2.5: Implement Admin User Management (Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                // Kiểm tra xem người dùng hiện tại có đang xóa chính mình không
                if (int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out int currentUserId) && currentUserId == id)
                {
                    return BadRequest(new { message = "Không thể xóa tài khoản của chính mình" });
                }

                await _userRepository.DeleteAsync(user);
                return Ok(new { message = "Xóa người dùng thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 1.3: Handle Account Lock
        [HttpPut("{id}/status")]
        public async Task<IActionResult> ChangeUserStatus(int id, UserStatusDto statusDto)
        {
            try
            {
                await _authService.ChangeAccountStatusAsync(id, statusDto.Status);
                return Ok(new { message = "Thay đổi trạng thái tài khoản thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Task 2.3: Implement Password Reset (by Admin)
        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                var result = await _authService.ResetPasswordAsync(user.Email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get user profile based on role
        /// </summary>
        [HttpGet("profile")]
        public async Task<ActionResult<object>> GetUserProfile()
        {
            try
            {
                // Get current user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                int userId = int.Parse(userIdClaim.Value);

                try
                {
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
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] BaseUpdateProfileDTO updateProfileDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetUserIdFromClaims();
                var result = await _userProfileService.UpdateUserProfileAsync(userId, updateProfileDto);

                if (result == null)
                {
                    return BadRequest(new { message = "Failed to update profile" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

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
