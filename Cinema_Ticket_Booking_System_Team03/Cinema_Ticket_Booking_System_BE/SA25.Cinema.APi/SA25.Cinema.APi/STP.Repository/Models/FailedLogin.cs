using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho các lần đăng nhập thất bại vào hệ thống.
    /// Lưu trữ thông tin về người dùng, địa chỉ IP, trình duyệt và thời gian thử đăng nhập.
    /// Được sử dụng để theo dõi và ngăn chặn các nỗ lực truy cập trái phép.
    /// </summary>
    [Table("FailedLogins")]
    public class FailedLogin
    {
        /// <summary>
        /// ID duy nhất của bản ghi đăng nhập thất bại
        /// </summary>
        [Key]
        public int FailedLogin_ID { get; set; }

        /// <summary>
        /// ID của người dùng có lần đăng nhập thất bại
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Địa chỉ IP của thiết bị thực hiện đăng nhập thất bại
        /// </summary>
        public string IP_Address { get; set; }

        /// <summary>
        /// Thông tin về trình duyệt và hệ điều hành của người dùng (User-Agent)
        /// </summary>
        public string UserAgent { get; set; }

        /// <summary>
        /// Thời gian xảy ra lần đăng nhập thất bại
        /// Mặc định là thời gian hiện tại theo UTC
        /// </summary>
        public DateTime AttemptTime { get; set; } = DateTime.UtcNow;
    }
}
