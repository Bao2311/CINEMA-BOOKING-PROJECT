using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho bố cục ghế ngồi trong một phòng chiếu phim.
    /// Lưu trữ thông tin về vị trí ghế, loại ghế và trạng thái hoạt động.
    /// </summary>
    [Table("Seat_Layout")]
    public class SeatLayout
    {
        /// <summary>
        /// ID duy nhất của bố cục ghế
        /// </summary>
        [Key]
        public int Layout_ID { get; set; }

        /// <summary>
        /// ID của phòng chiếu phim mà bố cục ghế này thuộc về
        /// </summary>
        public int Cinema_Room_ID { get; set; }

        /// <summary>
        /// Nhãn hàng của ghế (ví dụ: A, B, C...)
        /// </summary>
        public string Row_Label { get; set; }

        /// <summary>
        /// Số cột/vị trí của ghế trong hàng
        /// </summary>
        public int Column_Number { get; set; }

        /// <summary>
        /// Loại ghế (ví dụ: "Regular", "VIP", "Couple", "Premium")
        /// </summary>
        public string Seat_Type { get; set; } = "Regular";

        /// <summary>
        /// Trạng thái hoạt động của ghế (true: đang hoạt động, false: không hoạt động/bảo trì)
        /// </summary>
        public bool Is_Active { get; set; } = true;

        /// <summary>
        /// Phòng chiếu phim mà bố cục ghế này thuộc về
        /// </summary>
        [ForeignKey("Cinema_Room_ID")]
        public virtual CinemaRoom CinemaRoom { get; set; }

        /// <summary>
        /// Danh sách các ghế cụ thể được tạo dựa trên bố cục này
        /// </summary>
        [InverseProperty("SeatLayout")]
        public virtual ICollection<Seat> Seats { get; set; }
    }
}
