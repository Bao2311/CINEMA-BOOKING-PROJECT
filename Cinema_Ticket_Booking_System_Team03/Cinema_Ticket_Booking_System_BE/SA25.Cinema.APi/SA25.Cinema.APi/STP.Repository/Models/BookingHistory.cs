using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho lịch sử đặt vé trong hệ thống rạp chiếu phim.
    /// Lưu trữ các thay đổi trạng thái của một đơn đặt vé theo thời gian.
    /// </summary>
    [Table("Booking_History")]
    public class BookingHistory
    {
        /// <summary>
        /// ID duy nhất của bản ghi lịch sử đặt vé
        /// </summary>
        [Key]
        public int Booking_History_ID { get; set; }

        /// <summary>
        /// ID của đơn đặt vé mà bản ghi lịch sử này liên quan đến
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Ngày giờ khi trạng thái đặt vé được cập nhật
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Trạng thái của đơn đặt vé tại thời điểm ghi nhận
        /// Ví dụ: "Pending", "Confirmed", "Cancelled", "Completed"
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Thuộc tính điều hướng đến đơn đặt vé liên quan
        /// </summary>
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }
    }
}
