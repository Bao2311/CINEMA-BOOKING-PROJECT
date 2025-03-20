using System;

namespace STP.Repository.Dtos
{
    /// <summary>
    /// DTO c? s? ch?a các tr??ng thông tin chung cho h? s? ng??i dùng.
    /// </summary>
    public class BaseUserProfileDTO
    {
        /// <summary>
        /// H? và tên ??y ?? c?a ng??i dùng.
        /// </summary>
        public string Full_Name { get; set; }

        /// <summary>
        /// ??a ch? email c?a ng??i dùng.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// S? ?i?n tho?i c?a ng??i dùng.
        /// </summary>
        public string Phone_Number { get; set; }

        /// <summary>
        /// ??a ch? c?a ng??i dùng.
        /// </summary>
        public string Address { get; set; }

        /// <summary>
        /// Ngày sinh c?a ng??i dùng.
        /// </summary>
        public DateTime? Date_Of_Birth { get; set; }

        /// <summary>
        /// Gi?i tính c?a ng??i dùng.
        /// </summary>
        public string Sex { get; set; }
    }

    /// <summary>
    /// DTO dùng ?? hi?n th? thông tin h? s? c?a khách hàng.
    /// K? th?a t? BaseUserProfileDTO và ch? s? d?ng các thông tin c? b?n.
    /// </summary>
    public class CustomerProfileDTO : BaseUserProfileDTO
    {
        // Ch? s? d?ng thông tin c? b?n cho khách hàng
    }

    /// <summary>
    /// DTO dùng ?? hi?n th? thông tin h? s? c?a qu?n tr? viên.
    /// K? th?a t? BaseUserProfileDTO và b? sung thêm các thông tin qu?n lý.
    /// </summary>
    public class AdminProfileDTO : BaseUserProfileDTO
    {
        /// <summary>
        /// ID c?a ng??i dùng qu?n tr? viên.
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Vai trò c?a qu?n tr? viên trong h? th?ng.
        /// </summary>
        public string Role { get; set; }

        /// <summary>
        /// Phòng ban c?a qu?n tr? viên.
        /// </summary>
        public string Department { get; set; }

        /// <summary>
        /// Ngày tuy?n d?ng c?a qu?n tr? viên.
        /// </summary>
        public DateTime? Hire_Date { get; set; }

        /// <summary>
        /// Th?i ?i?m tài kho?n ???c t?o.
        /// </summary>
        public DateTime Created_At { get; set; }

        /// <summary>
        /// Th?i ?i?m ??ng nh?p g?n nh?t.
        /// </summary>
        public DateTime? Last_Login { get; set; }

        /// <summary>
        /// Tr?ng thái hi?n t?i c?a tài kho?n.
        /// </summary>
        public string Account_Status { get; set; }
    }

    /// <summary>
    /// DTO dùng ?? hi?n th? thông tin h? s? c?a nhân viên.
    /// K? th?a t? BaseUserProfileDTO và b? sung thêm các thông tin qu?n lý.
    /// </summary>
    public class StaffProfileDTO : BaseUserProfileDTO
    {
        /// <summary>
        /// ID c?a ng??i dùng nhân viên.
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Vai trò c?a nhân viên trong h? th?ng.
        /// </summary>
        public string Role { get; set; }

        /// <summary>
        /// Phòng ban c?a nhân viên.
        /// </summary>
        public string Department { get; set; }

        /// <summary>
        /// Ngày tuy?n d?ng c?a nhân viên.
        /// </summary>
        public DateTime? Hire_Date { get; set; }

        /// <summary>
        /// Th?i ?i?m tài kho?n ???c t?o.
        /// </summary>
        public DateTime Created_At { get; set; }

        /// <summary>
        /// Th?i ?i?m ??ng nh?p g?n nh?t.
        /// </summary>
        public DateTime? Last_Login { get; set; }

        /// <summary>
        /// Tr?ng thái hi?n t?i c?a tài kho?n.
        /// </summary>
        public string Account_Status { get; set; }
    }
}
