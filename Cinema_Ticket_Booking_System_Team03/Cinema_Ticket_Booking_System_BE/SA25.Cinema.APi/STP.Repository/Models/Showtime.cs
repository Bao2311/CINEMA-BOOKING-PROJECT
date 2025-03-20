using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một suất chiếu phim cụ thể tại một phòng chiếu phim.
    /// Lưu trữ thông tin về lịch chiếu, giá vé, trạng thái và sức chứa.
    /// </summary>
    [Table("Showtimes")]
    public class Showtime
    {
        /// <summary>
        /// ID duy nhất của suất chiếu
        /// </summary>
        [Key]
        public int Showtime_ID { get; set; }

        /// <summary>
        /// ID của bộ phim được chiếu trong suất này
        /// </summary>
        public int Movie_ID { get; set; }

        /// <summary>
        /// ID của phòng chiếu phim nơi diễn ra suất chiếu
        /// </summary>
        public int Cinema_Room_ID { get; set; }

        /// <summary>
        /// Ngày diễn ra suất chiếu
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Thời gian bắt đầu suất chiếu
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Thời gian kết thúc suất chiếu
        /// </summary>
        public TimeSpan End_Time { get; set; }

        /// <summary>
        /// Phân loại giá vé (ví dụ: "Regular", "VIP")
        /// </summary>
        public string Price_Tier { get; set; }

        /// <summary>
        /// Giá vé cơ bản cho suất chiếu
        /// </summary>
        public decimal Base_Price { get; set; }

        /// <summary>
        /// Trạng thái của suất chiếu (ví dụ: "Scheduled", "Canceled", "Completed")
        /// </summary>
        public string Status { get; set; } = "Scheduled";

        /// <summary>
        /// Số lượng ghế còn trống trong suất chiếu
        /// </summary>
        public int Capacity_Available { get; set; }

        /// <summary>
        /// ID của người dùng tạo suất chiếu
        /// </summary>
        public int Created_By { get; set; }

        /// <summary>
        /// Thời điểm tạo suất chiếu
        /// </summary>
        public DateTime Created_At { get; set; } = DateTime.Now;

        /// <summary>
        /// Thời điểm cập nhật thông tin suất chiếu gần nhất
        /// </summary>
        public DateTime Updated_At { get; set; }

        /// <summary>
        /// Bộ phim được chiếu trong suất này
        /// </summary>
        [ForeignKey("Movie_ID")]
        public virtual Movie Movie { get; set; }

        /// <summary>
        /// Phòng chiếu phim nơi diễn ra suất chiếu
        /// </summary>
        [ForeignKey("Cinema_Room_ID")]
        public virtual CinemaRoom CinemaRoom { get; set; }

        /// <summary>
        /// Người dùng đã tạo suất chiếu
        /// </summary>
        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        /// <summary>
        /// Danh sách các ghế trong suất chiếu này
        /// </summary>
        [InverseProperty("Showtime")]
        public virtual ICollection<Seat> Seats { get; set; }

        /// <summary>
        /// Danh sách các đơn đặt vé cho suất chiếu này
        /// </summary>
        [InverseProperty("Showtime")]
        public virtual ICollection<TicketBooking> TicketBookings { get; set; }
    }
}
