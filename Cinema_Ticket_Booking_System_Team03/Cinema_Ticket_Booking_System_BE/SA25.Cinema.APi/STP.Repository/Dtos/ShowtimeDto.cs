using System;
using System.ComponentModel.DataAnnotations;

namespace STP.Repository.DTOs
{
    // DTO hiển thị thông tin chi tiết của một lịch chiếu phim
    public class ShowtimeDto
    {
        // ID định danh duy nhất của lịch chiếu
        public int Showtime_ID { get; set; }

        // ID của bộ phim được chiếu trong lịch chiếu này
        public int Movie_ID { get; set; }

        // ID của phòng chiếu phim
        public int Cinema_Room_ID { get; set; }

        // Tên phòng chiếu, có thể null
        public string? Room_Name { get; set; }

        // Ngày chiếu phim (năm-tháng-ngày)
        public DateTime Show_Date { get; set; }

        // Thời gian bắt đầu chiếu phim (giờ:phút:giây)
        public TimeSpan Start_Time { get; set; }

        // Thời gian kết thúc chiếu phim (giờ:phút:giây)
        public TimeSpan End_Time { get; set; }

        // Cấp độ giá vé (Regular hoặc VIP)
        public string Price_Tier { get; set; }

        // Giá vé cơ bản của lịch chiếu
        public decimal Base_Price { get; set; }

        // Trạng thái của lịch chiếu (Active, Canceled, Completed, etc.)
        public string Status { get; set; }
    }

    // DTO dùng để tạo mới một lịch chiếu phim
    public class ShowtimeCreateDto
    {
        // ID của bộ phim - bắt buộc
        [Required]
        public int Movie_ID { get; set; }

        // ID của phòng chiếu - bắt buộc
        [Required]
        public int Cinema_Room_ID { get; set; }

        // Ngày chiếu phim - bắt buộc
        [Required]
        public DateTime Show_Date { get; set; }

        // Thời gian bắt đầu chiếu phim - bắt buộc
        [Required]
        public TimeSpan Start_Time { get; set; }

        // Thời gian kết thúc chiếu phim - bắt buộc
        [Required]
        public TimeSpan End_Time { get; set; }

        // Cấp độ giá vé - bắt buộc, chỉ chấp nhận "Regular" hoặc "VIP"
        [Required]
        [RegularExpression("^(Regular|VIP)$",
            ErrorMessage = "Price_Tier phải là 'Regular' hoặc 'VIP'")]
        public string Price_Tier { get; set; }

        // Giá vé cơ bản - phải là số dương
        [Range(0, double.MaxValue)]
        public decimal Base_Price { get; set; }

        // Số lượng ghế còn trống - phải là số nguyên dương
        [Range(0, int.MaxValue)]
        public int Capacity_Available { get; set; }
    }

    // DTO dùng để cập nhật thông tin của một lịch chiếu phim đã tồn tại
    public class ShowtimeUpdateDto
    {
        // ID của bộ phim - bắt buộc
        [Required]
        public int Movie_ID { get; set; }

        // ID của phòng chiếu - bắt buộc
        [Required]
        public int Cinema_Room_ID { get; set; }

        // Ngày chiếu phim - bắt buộc
        [Required]
        public DateTime Show_Date { get; set; }

        // Thời gian bắt đầu chiếu phim - bắt buộc
        [Required]
        public TimeSpan Start_Time { get; set; }

        // Thời gian kết thúc chiếu phim - bắt buộc
        [Required]
        public TimeSpan End_Time { get; set; }

        // Cấp độ giá vé - bắt buộc, chỉ chấp nhận "Regular" hoặc "VIP"
        [Required]
        [RegularExpression("^(Regular|VIP)$",
            ErrorMessage = "Price_Tier phải là 'Regular',hoặc 'VIP'")]
        public string Price_Tier { get; set; }

        // Giá vé cơ bản - phải là số dương
        [Range(0, double.MaxValue)]
        public decimal Base_Price { get; set; }

        // Số lượng ghế còn trống - phải là số nguyên dương
        [Range(0, int.MaxValue)]
        public int Capacity_Available { get; set; }
    }
}
