using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace STP.Repository.Dtos
{
    /// <summary>
    /// DTO cho thông tin điểm hiện tại của người dùng
    /// </summary>
    public class UserPointsDTO
    {
        /// <summary>
        /// ID của người dùng
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Tổng số điểm hiện tại
        /// </summary>
        public int Total_Points { get; set; }

        /// <summary>
        /// Thời điểm cập nhật điểm gần nhất
        /// </summary>
        public DateTime Last_Updated { get; set; }
    }

    /// <summary>
    /// DTO cho lịch sử tích điểm
    /// </summary>
    public class PointsEarningDTO
    {
        /// <summary>
        /// ID của giao dịch tích điểm
        /// </summary>
        public int Earning_ID { get; set; }

        /// <summary>
        /// ID của người dùng
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// ID của booking
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Số tiền thực tế
        /// </summary>
        public decimal Actual_Amount { get; set; }

        /// <summary>
        /// Số điểm đã tích
        /// </summary>
        public int Points_Earned { get; set; }

        /// <summary>
        /// Thời điểm tích điểm
        /// </summary>
        public DateTime Date { get; set; }
    }

    /// <summary>
    /// DTO cho lịch sử sử dụng điểm
    /// </summary>
    public class PointsRedemptionDTO
    {
        /// <summary>
        /// ID của giao dịch đổi điểm
        /// </summary>
        public int Redemption_ID { get; set; }

        /// <summary>
        /// ID của người dùng
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Số điểm đã sử dụng
        /// </summary>
        public int Points_Redeemed { get; set; }

        /// <summary>
        /// Thời điểm sử dụng điểm
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Trạng thái giao dịch đổi điểm
        /// </summary>
        public string Status { get; set; }
    }

    /// <summary>
    /// Request DTO cho việc sử dụng điểm khi đặt vé
    /// </summary>
    public class UsePointsRequestDTO
    {
        /// <summary>
        /// ID của booking
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Số điểm muốn sử dụng
        /// </summary>
        public int Points_To_Redeem { get; set; }
    }
}


