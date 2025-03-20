using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một người dùng trong hệ thống.
    /// Có thể là khách hàng hoặc nhân viên tùy thuộc vào vai trò (Role).
    /// </summary>
    [Table("Users")]
    public class User
    {
        /// <summary>
        /// ID duy nhất của người dùng
        /// </summary>
        [Key]
        public int User_ID { get; set; }

        /// <summary>
        /// Họ và tên đầy đủ của người dùng
        /// </summary>
        public string? Full_Name { get; set; }

        /// <summary>
        /// Địa chỉ email của người dùng, dùng để đăng nhập và liên hệ
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Mật khẩu đã được mã hóa của người dùng
        /// </summary>
        public string? Password { get; set; }

        /// <summary>
        /// Vai trò của người dùng trong hệ thống (ví dụ: "Customer", "Admin", "Staff")
        /// </summary>
        public string? Role { get; set; }

        /// <summary>
        /// Phòng ban làm việc (chỉ áp dụng cho nhân viên)
        /// </summary>
        public string? Department { get; set; }

        /// <summary>
        /// Ngày bắt đầu làm việc (chỉ áp dụng cho nhân viên)
        /// </summary>
        public DateTime? Hire_Date { get; set; }

        /// <summary>
        /// Ngày sinh của người dùng
        /// </summary>
        public DateTime? Date_Of_Birth { get; set; }

        /// <summary>
        /// Giới tính của người dùng
        /// </summary>
        public string? Sex { get; set; }

        /// <summary>
        /// Số điện thoại liên hệ của người dùng
        /// </summary>
        public string? Phone_Number { get; set; }

        /// <summary>
        /// Địa chỉ của người dùng
        /// </summary>
        public string? Address { get; set; }

        /// <summary>
        /// Trạng thái tài khoản (ví dụ: "Active", "Inactive", "Suspended", "Deleted")
        /// </summary>
        public string? Account_Status { get; set; } = "Active";

        /// <summary>
        /// Thời điểm tài khoản được tạo
        /// </summary>
        public DateTime Created_At { get; set; } = DateTime.Now;

        /// <summary>
        /// Thời điểm đăng nhập gần nhất
        /// </summary>
        public DateTime? Last_Login { get; set; }

        /// <summary>
        /// Danh sách các đơn đặt vé của người dùng
        /// </summary>
        [InverseProperty("User")]
        public virtual ICollection<TicketBooking> TicketBookings { get; set; }

        /// <summary>
        /// Danh sách các phim do người dùng tạo (nếu là nhân viên)
        /// </summary>
        [InverseProperty("CreatedBy")]
        public virtual ICollection<Movie> Movies { get; set; }

        /// <summary>
        /// Danh sách các khuyến mãi do người dùng tạo (nếu là nhân viên)
        /// </summary>
        [InverseProperty("CreatedBy")]
        public virtual ICollection<Promotion> Promotions { get; set; }

        /// <summary>
        /// Danh sách các đánh giá phim của người dùng
        /// </summary>
        [InverseProperty("User")]
        public virtual ICollection<MovieRating> MovieRatings { get; set; }

        /// <summary>
        /// Danh sách điểm tích lũy của người dùng
        /// </summary>
        [InverseProperty("User")]
        public virtual ICollection<Score> Scores { get; set; }

        /// <summary>
        /// Danh sách các lần đổi điểm của người dùng
        /// </summary>
        [InverseProperty("User")]
        public virtual ICollection<PointsRedemption> PointsRedemptions { get; set; }

        /// <summary>
        /// Danh sách các khuyến mãi đã sử dụng của người dùng
        /// </summary>
        [InverseProperty("User")]
        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; }

        /// <summary>
        /// Danh sách các giao dịch thanh toán do người dùng xử lý (nếu là nhân viên)
        /// </summary>
        [InverseProperty("ProcessedBy")]
        public virtual ICollection<Payment> ProcessedPayments { get; set; }
    }
}
