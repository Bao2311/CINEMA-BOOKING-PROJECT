using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một đơn đặt vé xem phim.
    /// Lưu trữ thông tin về người đặt, suất chiếu, thanh toán và trạng thái đơn.
    /// </summary>
    [Table("Ticket_Bookings")]
    public class TicketBooking
    {
        /// <summary>
        /// ID duy nhất của đơn đặt vé
        /// </summary>
        [Key]
        public int Booking_ID { get; set; }

        /// <summary>
        /// ID của người dùng đặt vé
        /// </summary>
        public int? User_ID { get; set; }

        /// <summary>
        /// ID của suất chiếu được đặt vé
        /// </summary>
        public int Showtime_ID { get; set; }

        /// <summary>
        /// ID của khuyến mãi được áp dụng cho đơn đặt vé (nếu có)
        /// </summary>
        public int? Promotion_ID { get; set; }

        /// <summary>
        /// Thời điểm đặt vé
        /// </summary>
        public DateTime Booking_Date { get; set; } = DateTime.Now;

        /// <summary>
        /// Thời hạn thanh toán cho đơn đặt vé
        /// </summary>
        public DateTime Payment_Deadline { get; set; }

        /// <summary>
        /// Tổng số tiền của đơn đặt vé
        /// </summary>
        public decimal Total_Amount { get; set; }

        /// <summary>
        /// Số điểm tích lũy được nhận từ đơn đặt vé này
        /// </summary>
        public int Points_Earned { get; set; } = 0;

        /// <summary>
        /// Số điểm tích lũy đã sử dụng cho đơn đặt vé này
        /// </summary>
        public int Points_Used { get; set; } = 0;

        /// <summary>
        /// Trạng thái của đơn đặt vé (ví dụ: "Pending", "Confirmed", "Canceled", "Completed")
        /// </summary>
        public string Status { get; set; } = "Pending";

        /// <summary>
        /// ID của người dùng tạo đơn đặt vé (có thể là người dùng hoặc nhân viên)
        /// </summary>
        public int Created_By { get; set; }

        /// <summary>
        /// Người dùng đặt vé
        /// </summary>
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }

        /// <summary>
        /// Suất chiếu được đặt vé
        /// </summary>
        [ForeignKey("Showtime_ID")]
        public virtual Showtime Showtime { get; set; }

        /// <summary>
        /// Khuyến mãi được áp dụng cho đơn đặt vé (nếu có)
        /// </summary>
        [ForeignKey("Promotion_ID")]
        public virtual Promotion Promotion { get; set; }

        /// <summary>
        /// Người dùng tạo đơn đặt vé
        /// </summary>
        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        /// <summary>
        /// Danh sách các vé thuộc đơn đặt vé này
        /// </summary>
        [InverseProperty("TicketBooking")]
        public virtual ICollection<Ticket> Tickets { get; set; }

        /// <summary>
        /// Danh sách các giao dịch thanh toán cho đơn đặt vé này
        /// </summary>
        [InverseProperty("TicketBooking")]
        public virtual ICollection<Payment> Payments { get; set; }

        /// <summary>
        /// Lịch sử thay đổi trạng thái của đơn đặt vé
        /// </summary>
        [InverseProperty("TicketBooking")]
        public virtual ICollection<BookingHistory> BookingHistories { get; set; }

        /// <summary>
        /// Danh sách các khuyến mãi đã sử dụng cho đơn đặt vé này
        /// </summary>
        [InverseProperty("TicketBooking")]
        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; }
        [InverseProperty("TicketBooking")]
        public virtual ICollection<Seat> Seats { get; set; }
    }
}
