using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một bản ghi điểm thưởng của người dùng trong hệ thống rạp chiếu phim.
    /// Lưu trữ thông tin về số điểm được thêm, số điểm đã sử dụng và thời điểm ghi nhận.
    /// </summary>
    [Table("Scores")]
    public class Score
    {
        /// <summary>
        /// ID duy nhất của bản ghi điểm thưởng
        /// </summary>
        [Key]
        public int Score_ID { get; set; }

        /// <summary>
        /// ID của người dùng sở hữu điểm thưởng
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Số điểm thưởng được thêm vào tài khoản người dùng
        /// </summary>
        public int Points_Added { get; set; }

        /// <summary>
        /// Số điểm thưởng đã được sử dụng từ tài khoản người dùng
        /// </summary>
        public int Points_Used { get; set; }

        /// <summary>
        /// Thời điểm ghi nhận thay đổi điểm thưởng
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Người dùng sở hữu điểm thưởng
        /// </summary>
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}
