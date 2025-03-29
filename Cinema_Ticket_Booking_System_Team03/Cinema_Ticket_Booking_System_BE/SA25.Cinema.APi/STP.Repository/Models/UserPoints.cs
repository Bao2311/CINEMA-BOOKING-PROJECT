using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho số điểm thưởng hiện tại của người dùng trong hệ thống rạp chiếu phim.
    /// </summary>
    [Table("User_Points")]
    public class UserPoints
    {
        /// <summary>
        /// ID duy nhất của bản ghi điểm người dùng
        /// </summary>
        [Key]
        public int UserPoints_ID { get; set; }

        /// <summary>
        /// ID của người dùng sở hữu điểm thưởng
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Tổng số điểm thưởng hiện tại của người dùng
        /// </summary>
        public int Total_Points { get; set; }

        /// <summary>
        /// Thời điểm cập nhật điểm gần nhất
        /// </summary>
        public DateTime Last_Updated { get; set; }

        /// <summary>
        /// Người dùng sở hữu điểm thưởng
        /// </summary>
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}

