using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một vé xem phim đã được bán.
    /// Lưu trữ thông tin về giá vé, ghế ngồi, mã vé và trạng thái check-in.
    /// </summary>
    [Table("Tickets")]
    public class Ticket
    {
        /// <summary>
        /// ID duy nhất của vé
        /// </summary>
        [Key]
        public int Ticket_ID { get; set; }

        /// <summary>
        /// ID của đơn đặt vé mà vé này thuộc về
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// ID của ghế ngồi được chỉ định cho vé này
        /// </summary>
        public int Seat_ID { get; set; }

        /// <summary>
        /// Giá cơ bản của vé (trước khi áp dụng giảm giá)
        /// </summary>
        public decimal Base_Price { get; set; }

        /// <summary>
        /// Số tiền giảm giá được áp dụng cho vé
        /// </summary>
        public decimal Discount_Amount { get; set; } = 0;

        /// <summary>
        /// Giá cuối cùng của vé sau khi áp dụng giảm giá
        /// </summary>
        public decimal Final_Price { get; set; }

        /// <summary>
        /// Mã vé duy nhất dùng để xác minh khi check-in
        /// </summary>
        public string Ticket_Code { get; set; }

        /// <summary>
        /// Trạng thái check-in của vé (true: đã check-in, false: chưa check-in)
        /// </summary>
        public bool Is_Checked_In { get; set; } = false;

        /// <summary>
        /// Thời điểm khách hàng check-in với vé này (null nếu chưa check-in)
        /// </summary>
        public DateTime? Check_In_Time { get; set; }

        /// <summary>
        /// Đơn đặt vé mà vé này thuộc về
        /// </summary>
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }

        /// <summary>
        /// Ghế ngồi được chỉ định cho vé này
        /// </summary>
        [ForeignKey("Seat_ID")]
        public virtual Seat Seat { get; set; }
    }
}
