using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một giao dịch tích điểm thưởng của người dùng trong hệ thống rạp chiếu phim.
    /// Lưu trữ thông tin về số điểm đã tích, thời gian tích điểm và booking liên quan.
    /// </summary>
    [Table("Points_Earning")]
    public class PointsEarning
    {
        /// <summary>
        /// ID duy nhất của giao dịch tích điểm
        /// </summary>
        [Key]
        public int Earning_ID { get; set; }

        /// <summary>
        /// ID của người dùng tích điểm
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// ID của booking liên quan đến giao dịch tích điểm
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Số tiền thanh toán thực tế (sau khi trừ điểm đã sử dụng)
        /// </summary>
        public decimal Actual_Amount { get; set; }

        /// <summary>
        /// Số điểm thưởng đã được tích trong giao dịch này
        /// </summary>
        public int Points_Earned { get; set; }

        /// <summary>
        /// Thời điểm giao dịch tích điểm được thực hiện
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Người dùng thực hiện giao dịch tích điểm
        /// </summary>
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }

        /// <summary>
        /// Booking liên quan đến giao dịch tích điểm
        /// </summary>
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }
    }
}

