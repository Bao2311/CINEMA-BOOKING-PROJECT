using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một ghế ngồi trong một suất chiếu cụ thể tại rạp phim.
    /// Lưu trữ thông tin về trạng thái ghế (có sẵn, đã đặt, đã bán) và
    /// kết nối với bố cục ghế và suất chiếu.
    /// </summary>
    [Table("Seats")]
    public class Seat
    {
        /// <summary>
        /// ID duy nhất của ghế
        /// </summary>
        [Key]
        public int Seat_ID { get; set; }

        /// <summary>
        /// ID của bố cục ghế mà ghế này thuộc về
        /// </summary>
        public int Layout_ID { get; set; }

        /// <summary>
        /// ID của suất chiếu mà ghế này thuộc về
        /// </summary>
        public int Showtime_ID { get; set; }

        /// <summary>
        /// Trạng thái hiện tại của ghế (ví dụ: "Available", "Reserved", "Sold", "Maintenance")
        /// </summary>
        public string Seat_Status { get; set; } = "Available";

        /// <summary>
        /// Thời điểm cập nhật trạng thái ghế gần nhất
        /// </summary>
        public DateTime Last_Updated { get; set; } = DateTime.Now;

        /// <summary>
        /// Bố cục ghế mà ghế này thuộc về
        /// </summary>
        [ForeignKey("Layout_ID")]
        public virtual SeatLayout SeatLayout { get; set; }

        /// <summary>
        /// Suất chiếu mà ghế này thuộc về
        /// </summary>
        [ForeignKey("Showtime_ID")]
        public virtual Showtime Showtime { get; set; }

        /// <summary>
        /// Danh sách các vé đã được bán cho ghế này
        /// </summary>
        [InverseProperty("Seat")]
        public virtual ICollection<Ticket> Tickets { get; set; }
    }
}
