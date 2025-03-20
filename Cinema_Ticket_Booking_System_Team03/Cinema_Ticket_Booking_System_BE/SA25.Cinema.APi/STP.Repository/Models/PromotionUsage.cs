using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một lần sử dụng chương trình khuyến mãi trong hệ thống rạp chiếu phim.
    /// Lưu trữ thông tin về việc áp dụng khuyến mãi cho một đơn đặt vé cụ thể,
    /// bao gồm số tiền giảm giá và thời điểm áp dụng.
    /// </summary>
    [Table("Promotion_Usage")]
    public class PromotionUsage
    {
        /// <summary>
        /// ID duy nhất của lần sử dụng khuyến mãi
        /// </summary>
        [Key]
        public int Usage_ID { get; set; }

        /// <summary>
        /// ID của chương trình khuyến mãi được sử dụng
        /// </summary>
        public int Promotion_ID { get; set; }

        /// <summary>
        /// ID của đơn đặt vé áp dụng khuyến mãi
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// ID của người dùng sử dụng khuyến mãi
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Số tiền giảm giá được áp dụng cho đơn đặt vé
        /// </summary>
        public decimal Discount_Amount { get; set; }

        /// <summary>
        /// Thời điểm khuyến mãi được áp dụng
        /// </summary>
        public DateTime Applied_Date { get; set; }

        /// <summary>
        /// Chương trình khuyến mãi được sử dụng
        /// </summary>
        [ForeignKey("Promotion_ID")]
        public virtual Promotion Promotion { get; set; }

        /// <summary>
        /// Đơn đặt vé áp dụng khuyến mãi
        /// </summary>
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }

        /// <summary>
        /// Người dùng sử dụng khuyến mãi
        /// </summary>
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}
