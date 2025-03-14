using System;
using System.ComponentModel.DataAnnotations;

namespace STP.Repository.Dtos
{
    /// <summary>
    /// DTO cơ sở cho việc cập nhật thông tin hồ sơ người dùng.
    /// Chứa các trường thông tin chung cho tất cả các loại người dùng.
    /// </summary>
    public class BaseUpdateProfileDTO
    {
        /// <summary>
        /// Họ và tên đầy đủ của người dùng.
        /// Chỉ chấp nhận chữ cái và khoảng trắng.
        /// </summary>
        [Required(ErrorMessage = "Full name is required")]
        [StringLength(50, ErrorMessage = "Full name must not exceed 50 characters")]
        [RegularExpression(@"^[a-zA-ZÀ-ỹ\s]*$", ErrorMessage = "Full name can only contain letters and spaces")]
        public string Full_Name { get; set; }

        /// <summary>
        /// Số điện thoại của người dùng.
        /// Phải bắt đầu bằng số 0 và có đúng 10 chữ số.
        /// </summary>
        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number")]
        [RegularExpression(@"^(0[0-9]{9})$", ErrorMessage = "Phone number must start with 0 and have 10 digits")]
        public string Phone_Number { get; set; }

        /// <summary>
        /// Địa chỉ của người dùng.
        /// </summary>
        [StringLength(200, ErrorMessage = "Address must not exceed 200 characters")]
        public string Address { get; set; }

        /// <summary>
        /// Ngày sinh của người dùng.
        /// Phải là ngày trong quá khứ.
        /// </summary>
        [DataType(DataType.Date)]
        [PastDate(ErrorMessage = "Date of birth must be a past date")]
        public DateTime? Date_Of_Birth { get; set; }

        /// <summary>
        /// Giới tính của người dùng.
        /// Chỉ chấp nhận giá trị "Male" hoặc "Female".
        /// </summary>
        [StringLength(10)]
        [RegularExpression("^(Male|Female)$", ErrorMessage = "Gender must be Male, Female")]
        public string Sex { get; set; }
    }

    /// <summary>
    /// DTO dùng để cập nhật thông tin hồ sơ của khách hàng.
    /// Kế thừa từ BaseUpdateProfileDTO và chỉ sử dụng các thông tin cơ bản.
    /// </summary>
    public class UpdateCustomerProfileDTO : BaseUpdateProfileDTO
    {
        // Chỉ sử dụng thông tin cơ bản cho khách hàng
    }

    /// <summary>
    /// DTO dùng để cập nhật thông tin hồ sơ của quản trị viên.
    /// Kế thừa từ BaseUpdateProfileDTO và bổ sung thêm thông tin về phòng ban.
    /// </summary>
    public class UpdateAdminProfileDTO : BaseUpdateProfileDTO
    {
        /// <summary>
        /// Phòng ban của quản trị viên.
        /// </summary>
        [Required(ErrorMessage = "Department is required")]
        [StringLength(50, ErrorMessage = "Department must not exceed 50 characters")]
        public string Department { get; set; }
    }

    /// <summary>
    /// DTO dùng để cập nhật thông tin hồ sơ của nhân viên.
    /// Kế thừa từ BaseUpdateProfileDTO và bổ sung thêm thông tin về phòng ban.
    /// </summary>
    public class UpdateStaffProfileDTO : BaseUpdateProfileDTO
    {
        /// <summary>
        /// Phòng ban của nhân viên.
        /// </summary>
        [Required(ErrorMessage = "Department is required")]
        [StringLength(50, ErrorMessage = "Department must not exceed 50 characters")]
        public string Department { get; set; }
    }

    /// <summary>
    /// Thuộc tính xác thực tùy chỉnh để đảm bảo ngày được chọn là ngày trong quá khứ.
    /// </summary>
    public class PastDateAttribute : ValidationAttribute
    {
        /// <summary>
        /// Kiểm tra xem giá trị có phải là một ngày trong quá khứ hay không.
        /// </summary>
        /// <param name="value">Giá trị cần kiểm tra</param>
        /// <returns>true nếu giá trị là một ngày trong quá khứ hoặc null, ngược lại là false</returns>
        public override bool IsValid(object value)
        {
            if (value is DateTime date)
            {
                return date < DateTime.Now;
            }
            return true; // Trả về true nếu null (trường tùy chọn)
        }
    }
}
