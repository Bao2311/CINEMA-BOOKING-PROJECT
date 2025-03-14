using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một giao dịch đổi điểm thưởng của người dùng trong hệ thống rạp chiếu phim.
    /// Lưu trữ thông tin về số điểm đã đổi, thời gian đổi điểm và trạng thái của giao dịch.
    /// </summary>
    [Table("Points_Redemption")]
    public class PointsRedemption
    {
        /// <summary>
        /// ID duy nhất của giao dịch đổi điểm
        /// </summary>
        [Key]
        public int Redemption_ID { get; set; }

        /// <summary>
        /// ID của người dùng thực hiện đổi điểm
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Số điểm thưởng đã được đổi trong giao dịch này
        /// </summary>
        public int Points_Redeemed { get; set; }

        /// <summary>
        /// Thời điểm giao dịch đổi điểm được thực hiện
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Trạng thái hiện tại của giao dịch đổi điểm
        /// (ví dụ: "Pending", "Completed", "Cancelled", "Failed")
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Người dùng thực hiện giao dịch đổi điểm
        /// </summary>
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}
