using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một phòng chiếu phim trong hệ thống rạp.
    /// Chứa thông tin về phòng chiếu, số lượng ghế, loại phòng và trạng thái hoạt động.
    /// </summary>
    [Table("Cinema_Rooms")]
    public class CinemaRoom
    {
        /// <summary>
        /// ID duy nhất của phòng chiếu
        /// </summary>
        [Key]
        public int Cinema_Room_ID { get; set; }

        /// <summary>
        /// Tên của phòng chiếu (ví dụ: "Phòng 1", "Phòng VIP 2")
        /// </summary>
        public string? Room_Name { get; set; }

        /// <summary>
        /// Tổng số ghế trong phòng chiếu
        /// </summary>
        public int Seat_Quantity { get; set; }

        /// <summary>
        /// Loại phòng chiếu (ví dụ: "Standard", "VIP", "IMAX", "4DX")
        /// </summary>
        public string? Room_Type { get; set; }

        /// <summary>
        /// Trạng thái hiện tại của phòng chiếu
        /// Giá trị mặc định là "Active"
        /// Các giá trị khác có thể là: "Maintenance", "Closed", "Renovating"
        /// </summary>
        public string? Status { get; set; } = "Active";

        /// <summary>
        /// Ghi chú bổ sung về phòng chiếu
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Danh sách các sơ đồ ghế được thiết lập cho phòng chiếu này
        /// </summary>
        [InverseProperty("CinemaRoom")]
        public virtual ICollection<SeatLayout> SeatLayouts { get; set; }

        /// <summary>
        /// Danh sách các suất chiếu được lên lịch trong phòng chiếu này
        /// </summary>
        [InverseProperty("CinemaRoom")]
        public virtual ICollection<Showtime> Showtimes { get; set; }
    }
}
