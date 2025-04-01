using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho bảng giá vé trong hệ thống rạp chiếu phim
    /// </summary>
    public class TicketPricing
    {
        /// <summary>
        /// ID của mức giá
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Price_ID { get; set; }

        /// <summary>
        /// Loại phòng chiếu (2D, 3D, IMAX, 4DX, v.v.)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Room_Type { get; set; }

        /// <summary>
        /// Loại ghế (Standard, VIP, Couple, Deluxe, v.v.)
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Seat_Type { get; set; }

        /// <summary>
        /// Giá cơ bản của vé
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal Base_Price { get; set; }

        /// <summary>
        /// Trạng thái kích hoạt của mức giá
        /// </summary>
        [Required]
        public String Status { get; set; }

        /// <summary>
        /// Ngày tạo mức giá
        /// </summary>
        [Required]
        public DateTime Created_Date { get; set; } = DateTime.Now;

        /// <summary>
        /// Ngày cập nhật mức giá gần nhất
        /// </summary>
        public DateTime? Last_Updated { get; set; }
    }
}
