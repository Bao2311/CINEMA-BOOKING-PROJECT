using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một chương trình khuyến mãi trong hệ thống rạp chiếu phim.
    /// Lưu trữ thông tin về mã khuyến mãi, loại giảm giá, giá trị giảm giá, 
    /// thời gian áp dụng và các điều kiện sử dụng.
    /// </summary>
    [Table("Promotions")]
    public class Promotion
    {
        /// <summary>
        /// ID duy nhất của chương trình khuyến mãi
        /// </summary>
        [Key]
        public int Promotion_ID { get; set; }

        /// <summary>
        /// Tiêu đề của chương trình khuyến mãi
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Mã khuyến mãi dùng để áp dụng giảm giá
        /// </summary>
        public string Promotion_Code { get; set; }

        /// <summary>
        /// Ngày bắt đầu chương trình khuyến mãi
        /// </summary>
        public DateTime Start_Date { get; set; }

        /// <summary>
        /// Ngày kết thúc chương trình khuyến mãi
        /// </summary>
        public DateTime End_Date { get; set; }

        /// <summary>
        /// Loại giảm giá (ví dụ: "Percentage", "Fixed Amount")
        /// </summary>
        public string Discount_Type { get; set; }

        /// <summary>
        /// Giá trị giảm giá (phần trăm hoặc số tiền cố định tùy thuộc vào Discount_Type)
        /// </summary>
        public decimal Discount_Value { get; set; }

        /// <summary>
        /// Giá trị đơn hàng tối thiểu để áp dụng khuyến mãi, mặc định là 0
        /// </summary>
        public decimal Minimum_Purchase { get; set; } = 0;

        /// <summary>
        /// Giá trị giảm giá tối đa có thể áp dụng (thường dùng cho giảm giá theo phần trăm)
        /// </summary>
        public decimal? Maximum_Discount { get; set; }

        /// <summary>
        /// Đối tượng áp dụng khuyến mãi (ví dụ: "All", "Tickets", "Concessions", "VIP Members")
        /// </summary>
        public string Applicable_For { get; set; }

        /// <summary>
        /// Giới hạn số lần sử dụng của chương trình khuyến mãi (null nếu không giới hạn)
        /// </summary>
        public int? Usage_Limit { get; set; }

        /// <summary>
        /// Số lần đã sử dụng chương trình khuyến mãi, mặc định là 0
        /// </summary>
        public int Current_Usage { get; set; } = 0;

        /// <summary>
        /// Trạng thái hiện tại của chương trình khuyến mãi (ví dụ: "Active", "Inactive", "Expired")
        /// </summary>
        public string Status { get; set; } = "Active";

        /// <summary>
        /// Mô tả chi tiết về chương trình khuyến mãi
        /// </summary>
        public string Promotion_Detail { get; set; }

        /// <summary>
        /// ID của người tạo chương trình khuyến mãi
        /// </summary>
        public int Created_By { get; set; }

        /// <summary>
        /// Thời điểm chương trình khuyến mãi được tạo, mặc định là thời điểm hiện tại
        /// </summary>
        public DateTime Created_At { get; set; } = DateTime.Now;

        /// <summary>
        /// Người tạo chương trình khuyến mãi
        /// </summary>
        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        /// <summary>
        /// Danh sách các đơn đặt vé đã sử dụng chương trình khuyến mãi này
        /// </summary>
        [InverseProperty("Promotion")]
        public virtual ICollection<TicketBooking> TicketBookings { get; set; }

        /// <summary>
        /// Lịch sử sử dụng của chương trình khuyến mãi
        /// </summary>
        [InverseProperty("Promotion")]
        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; }
    }
}
