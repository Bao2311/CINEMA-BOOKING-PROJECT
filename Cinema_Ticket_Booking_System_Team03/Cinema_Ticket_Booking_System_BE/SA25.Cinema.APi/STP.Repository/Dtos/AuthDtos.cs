using System;
using System.ComponentModel.DataAnnotations;

namespace STP.Repository.Dtos
{
    // DTO dùng cho việc đăng ký tài khoản admin
    public class AdminRegisterDto
    {
        // Email người dùng - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ")]
        public string Email { get; set; }

        // Mật khẩu - bắt buộc và phải có độ dài từ 6-100 ký tự
        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải từ 6-100 ký tự")]
        public string Password { get; set; }

        // Xác nhận mật khẩu - phải trùng khớp với mật khẩu
        [Compare("Password", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; }

        // Họ tên đầy đủ - bắt buộc
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        public string FullName { get; set; }

        // Ngày sinh - bắt buộc
        [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
        public DateTime DateOfBirth { get; set; }

        // Giới tính - bắt buộc, giá trị "Nam" hoặc "Nữ"
        [Required(ErrorMessage = "Giới tính là bắt buộc")]
        public string Sex { get; set; } // "Nam" hoặc "Nữ"

        // Số điện thoại - phải đúng định dạng
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string PhoneNumber { get; set; }

        // Địa chỉ - không bắt buộc
        public string Address { get; set; }

        // Vai trò - bắt buộc, xác định quyền hạn của người dùng
        [Required(ErrorMessage = "Vai trò là bắt buộc")]
        public string Role { get; set; } // "Admin", "Customer", etc.
    }

    // DTO dùng cho việc đăng ký tài khoản thông thường
    public class RegisterDto
    {
        // Email người dùng - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ")]
        public string Email { get; set; }

        // Mật khẩu - bắt buộc và phải có độ dài từ 6-100 ký tự
        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải từ 6-100 ký tự")]
        public string Password { get; set; }

        // Xác nhận mật khẩu - phải trùng khớp với mật khẩu
        [Compare("Password", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; }

        // Họ tên đầy đủ - bắt buộc
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        public string FullName { get; set; }

        // Ngày sinh - bắt buộc
        [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
        public DateTime DateOfBirth { get; set; }

        // Giới tính - bắt buộc, giá trị "Nam" hoặc "Nữ"
        [Required(ErrorMessage = "Giới tính là bắt buộc")]
        public string Sex { get; set; } // "Nam" hoặc "Nữ"

        // Số điện thoại - phải đúng định dạng
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string PhoneNumber { get; set; }

        // Địa chỉ - không bắt buộc
        public string Address { get; set; }
    }

    // DTO dùng cho việc đăng nhập
    public class LoginDto
    {
        // Email người dùng - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ")]
        public string Email { get; set; }

        // Mật khẩu - bắt buộc
        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        public string Password { get; set; }
    }

    // DTO dùng cho việc đổi mật khẩu
    public class ChangePasswordDto
    {
        // Mật khẩu cũ - bắt buộc để xác thực người dùng
        [Required(ErrorMessage = "Mật khẩu cũ là bắt buộc")]
        public string OldPassword { get; set; }

        // Mật khẩu mới - bắt buộc và phải có độ dài từ 6-100 ký tự
        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải từ 6-100 ký tự")]
        public string NewPassword { get; set; }

        // Xác nhận mật khẩu mới - phải trùng khớp với mật khẩu mới
        [Compare("NewPassword", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmNewPassword { get; set; }
    }

    // DTO dùng cho việc cập nhật thông tin cá nhân
    public class UpdateProfileDto
    {
        // Họ tên đầy đủ - có thể cập nhật
        public string FullName { get; set; }

        // Ngày sinh - có thể cập nhật, nullable
        public DateTime? DateOfBirth { get; set; }

        // Giới tính - có thể cập nhật
        public string Sex { get; set; }

        // Số điện thoại - có thể cập nhật
        public string PhoneNumber { get; set; }

        // Địa chỉ - có thể cập nhật
        public string Address { get; set; }
    }

    // DTO dùng để trả về thông tin sau khi xác thực thành công
    public class AuthResponseDto
    {
        // ID của người dùng
        public int UserId { get; set; }

        // Họ tên đầy đủ của người dùng
        public string FullName { get; set; }

        // Email của người dùng
        public string Email { get; set; }

        // JWT token để xác thực các yêu cầu tiếp theo
        public string Token { get; set; }

        // Thời gian hết hạn của token
        public DateTime TokenExpiration { get; set; }

        // Vai trò của người dùng
        public string Role { get; set; }
    }

    // DTO dùng để thay đổi trạng thái tài khoản
    public class UserStatusDto
    {
        // Trạng thái tài khoản - bắt buộc ("Active", "Inactive", "Locked")
        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        public string Status { get; set; } // "Active", "Inactive", "Locked"
    }

    // DTO dùng cho việc yêu cầu đặt lại mật khẩu
    public class ResetPasswordDto
    {
        // Email người dùng - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ")]
        public string Email { get; set; }
    }

    // DTO dùng để trả về kết quả sau khi đặt lại mật khẩu
    public class ResetPasswordResultDto
    {
        // Thông báo kết quả
        public string Message { get; set; }

        // Mật khẩu mới (nếu được tạo tự động)
        public string NewPassword { get; set; }
    }

    // DTO dùng cho admin cập nhật thông tin người dùng
    public class AdminUpdateUserDto
    {
        // Họ tên đầy đủ - có thể cập nhật
        public string FullName { get; set; }

        // Ngày sinh - có thể cập nhật
        public DateTime DateOfBirth { get; set; }

        // Giới tính - có thể cập nhật
        public string Sex { get; set; }

        // Số điện thoại - có thể cập nhật
        public string PhoneNumber { get; set; }

        // Địa chỉ - có thể cập nhật
        public string Address { get; set; }

        // Vai trò - bắt buộc, xác định quyền hạn của người dùng
        [Required(ErrorMessage = "Vai trò là bắt buộc")]
        public string Role { get; set; } // "Admin", "Customer", etc.

        // Trạng thái tài khoản - có thể cập nhật
        public string AccountStatus { get; set; } // "Active", "Inactive", "Locked"
    }

    // DTO dùng cho việc mở khóa tài khoản
    public class UnlockAccountDto
    {
        // Email người dùng - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Địa chỉ email không hợp lệ")]
        public string Email { get; set; }

        // Có thể thêm các thông tin khác nếu cần
        // public string AdminComment { get; set; }
    }

    // DTO dùng cho admin tạo tài khoản người dùng
    public class AdminRegisterUserDto
    {
        // Email người dùng - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; }

        // Họ tên đầy đủ - bắt buộc, tối đa 100 ký tự
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; }

        // Vai trò - bắt buộc, phải là "Staff", "Manager" hoặc "Customer"
        [Required(ErrorMessage = "Vai trò là bắt buộc")]
        [RegularExpression("Staff|Manager|Customer", ErrorMessage = "Vai trò phải là Staff hoặc Manager Hoặc Customer")]
        public string Role { get; set; }

        // Phòng ban - không bắt buộc
        public string? Department { get; set; }

        // Ngày tuyển dụng - không bắt buộc
        [DataType(DataType.Date)]
        public DateTime? Hire_Date { get; set; }

        // Ngày sinh - bắt buộc
        [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
        public DateTime? DateOfBirth { get; set; }

        // Giới tính - bắt buộc
        [Required(ErrorMessage = "Giới tính là bắt buộc")]
        public string Sex { get; set; }

        // Số điện thoại - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string PhoneNumber { get; set; }

        // Địa chỉ - bắt buộc
        [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
        public string Address { get; set; }
    }

    // DTO dùng để trả về kết quả đăng ký
    public class UserRegistrationResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int UserId { get; set; }
        public bool RequiresEmailVerification { get; set; } = false;
    }

    // DTO dùng cho đăng ký tài khoản nhân viên/quản lý
    public class StaffManagerRegistrationDto
    {
        // Họ tên đầy đủ - bắt buộc, tối đa 100 ký tự
        [Required(ErrorMessage = "Họ tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string Full_Name { get; set; }

        // Email - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; }

        // Mật khẩu - bắt buộc, ít nhất 6 ký tự
        [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string Password { get; set; }

        // Vai trò - bắt buộc, phải là "Staff" hoặc "Manager"
        [Required(ErrorMessage = "Vai trò là bắt buộc")]
        [RegularExpression("Staff|Manager", ErrorMessage = "Vai trò phải là Staff hoặc Manager")]
        public string Role { get; set; }

        // Phòng ban - bắt buộc
        [Required(ErrorMessage = "Phòng ban là bắt buộc")]
        public string Department { get; set; }

        // Ngày tuyển dụng - bắt buộc
        [Required(ErrorMessage = "Ngày tuyển dụng là bắt buộc")]
        [DataType(DataType.Date)]
        public DateTime Hire_Date { get; set; }

        // Ngày sinh - bắt buộc
        [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
        [DataType(DataType.Date)]
        public DateTime Date_Of_Birth { get; set; }

        // Giới tính - bắt buộc
        [Required(ErrorMessage = "Giới tính là bắt buộc")]
        public string Sex { get; set; }

        // Số điện thoại - bắt buộc và phải đúng định dạng
        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string Phone_Number { get; set; }

        // Địa chỉ - bắt buộc
        [Required(ErrorMessage = "Địa chỉ là bắt buộc")]
        public string Address { get; set; }
    }
}
