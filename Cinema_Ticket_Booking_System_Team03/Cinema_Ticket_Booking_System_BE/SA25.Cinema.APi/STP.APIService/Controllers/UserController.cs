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
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                // Lấy thông tin người dùng theo ID
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null || user.Account_Status == "Deleted")
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                // Chuyển đổi sang DTO
                var userDto = new
                {
                    user.User_ID,
                    user.Full_Name,
                    user.Email,
                    user.Role,
                    user.Account_Status
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
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
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateUser(int id, AdminUpdateUserDto updateDto)
        {
            try
            {
                // Kiểm tra người dùng tồn tại
                var user = await _userRepository.GetByIdAsync(id);
                if (user == null)
                    return NotFound(new { message = "Không tìm thấy người dùng" });

                // Kiểm tra số điện thoại đã tồn tại (nếu có thay đổi)
                if (!string.IsNullOrEmpty(updateDto.PhoneNumber) &&
                    updateDto.PhoneNumber != user.Phone_Number)
                {
                    bool phoneExists = await _userRepository.IsPhoneNumberExistAsync(updateDto.PhoneNumber, id);
                    if (phoneExists)
                    {
                        return BadRequest(new { message = "Số điện thoại đã được sử dụng bởi tài khoản khác" });
                    }
                }

                // Cập nhật thông tin người dùng
                if (!string.IsNullOrEmpty(updateDto.FullName))
                    user.Full_Name = updateDto.FullName;

                if (updateDto.DateOfBirth.HasValue)
                    user.Date_Of_Birth = updateDto.DateOfBirth.Value;

                if (!string.IsNullOrEmpty(updateDto.Sex))
                    user.Sex = updateDto.Sex;

                if (!string.IsNullOrEmpty(updateDto.PhoneNumber))
                    user.Phone_Number = updateDto.PhoneNumber;

                if (!string.IsNullOrEmpty(updateDto.Address))
                    user.Address = updateDto.Address;

                if (!string.IsNullOrEmpty(updateDto.Role))
                {
                    // Kiểm tra vai trò hợp lệ
                    string[] validRoles = { "Customer", "Staff", "Manager" };
                    if (Array.Exists(validRoles, r => r.Equals(updateDto.Role, StringComparison.OrdinalIgnoreCase)))
                    {
                        user.Role = updateDto.Role;
                    }
                    else
                    {
                        return BadRequest(new { message = "Vai trò không hợp lệ. Các vai trò hợp lệ: Customer, Staff, Manager" });
                    }
                }

                // Cập nhật trạng thái tài khoản nếu có thay đổi
                if (!string.IsNullOrEmpty(updateDto.AccountStatus) && user.Account_Status != updateDto.AccountStatus)
                {
                    // Kiểm tra trạng thái hợp lệ
                    string[] validStatuses = { "Active", "Inactive", "Locked", "Pending" };
                    if (Array.Exists(validStatuses, s => s.Equals(updateDto.AccountStatus, StringComparison.OrdinalIgnoreCase)))
                    {
                        // Gọi service để thay đổi trạng thái
                        await _authService.ChangeAccountStatusAsync(id, updateDto.AccountStatus);

                        // Cập nhật trạng thái trong đối tượng user (không cần thiết nếu ChangeAccountStatusAsync đã cập nhật)
                        user.Account_Status = updateDto.AccountStatus;
                    }
                    else
                    {
                        return BadRequest(new { message = "Trạng thái tài khoản không hợp lệ. Các trạng thái hợp lệ: Active, Inactive, Locked, Pending" });
                    }
                }

                // Lưu thay đổi vào cơ sở dữ liệu
                await _userRepository.UpdateAsync(user);

                // Trả về thông tin đã cập nhật
                var updatedUserDto = new
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

                return Ok(updatedUserDto);
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
        [Authorize]
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
        [Authorize]
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
        [Authorize(Roles = "Staff")]
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



