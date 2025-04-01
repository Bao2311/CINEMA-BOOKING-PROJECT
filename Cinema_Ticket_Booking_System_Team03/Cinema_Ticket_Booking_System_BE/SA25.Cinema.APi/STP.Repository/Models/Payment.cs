using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một giao dịch thanh toán trong hệ thống rạp chiếu phim.
    /// Lưu trữ thông tin về số tiền thanh toán, phương thức thanh toán, trạng thái giao dịch,
    /// và thông tin hoàn tiền nếu có.
    /// </summary>
    [Table("Payments")]
    public class Payment
    {
        /// <summary>
        /// ID duy nhất của giao dịch thanh toán
        /// </summary>
        [Key]
        public int Payment_ID { get; set; }

        /// <summary>
        /// ID của đơn đặt vé liên quan đến giao dịch thanh toán này
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Số tiền của giao dịch thanh toán
        /// </summary>
        public decimal Amount { get; set; }

        /// <summary>
        /// Phương thức thanh toán được sử dụng (ví dụ: "Credit Card", "PayPal", "Cash", "Banking")
        /// </summary>
        public string Payment_Method { get; set; }

        /// <summary>
        /// Mã tham chiếu giao dịch từ cổng thanh toán hoặc hệ thống bên ngoài
        /// </summary>
        public string Payment_Reference { get; set; }

        /// <summary>
        /// Thời điểm giao dịch được thực hiện
        /// </summary>
        public DateTime Transaction_Date { get; set; }

        /// <summary>
        /// Trạng thái hiện tại của giao dịch thanh toán
        /// (ví dụ: "Pending", "Completed", "Failed", "Refunded", "Partially Refunded")
        /// </summary>
        public string Payment_Status { get; set; }

        /// <summary>
        /// Phản hồi chi tiết từ bộ xử lý thanh toán, có thể chứa mã lỗi hoặc thông tin bổ sung
        /// </summary>
        public string Processor_Response { get; set; }

        /// <summary>
        /// Số tiền đã hoàn lại cho khách hàng, mặc định là 0
        /// </summary>
        public decimal Refund_Amount { get; set; } = 0;

        /// <summary>
        /// Thời điểm hoàn tiền được thực hiện (nếu có)
        /// </summary>
        public DateTime? Refund_Date { get; set; }

        /// <summary>
        /// Lý do hoàn tiền (nếu có)
        /// </summary>
        public string Refund_Reason { get; set; }

        /// <summary>
        /// ID của nhân viên xử lý giao dịch thanh toán hoặc hoàn tiền (nếu có)
        /// </summary>
        public int? Processed_By { get; set; }

        /// <summary>
        /// Đơn đặt vé liên quan đến giao dịch thanh toán này
        /// </summary>
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }

        /// <summary>
        /// Nhân viên xử lý giao dịch thanh toán hoặc hoàn tiền
        /// </summary>
        [ForeignKey("Processed_By")]
        public virtual User ProcessedBy { get; set; }
    }
}
