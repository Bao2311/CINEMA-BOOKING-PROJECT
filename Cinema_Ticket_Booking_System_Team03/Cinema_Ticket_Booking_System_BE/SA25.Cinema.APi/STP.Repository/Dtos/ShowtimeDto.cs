using System;
using System.ComponentModel.DataAnnotations;
using STP.APIService.Controllers.DTOs;
using STP.Repository.Dtos;

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
        [Required]
        [RegularExpression("^(Hidden|Scheduled)$", ErrorMessage = "Status must be either 'Hidden' or 'Scheduled'")]
        public string Status { get; set; }
    }
    public class ShowtimeInfoDto
    {
        public int ShowtimeId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string MovieName { get; set; }
        public string MoviePoster { get; set; }
        public string CinemaName { get; set; }
        public string RoomName { get; set; }
    }

    /// <summary>
    /// DTO hiển thị thông tin chi tiết của một lịch chiếu phim
    /// </summary>
    public class ShowtimeDetailDTO
    {
        /// <summary>
        /// ID định danh duy nhất của lịch chiếu
        /// </summary>
        public int Showtime_ID { get; set; }

        /// <summary>
        /// Ngày chiếu phim (năm-tháng-ngày)
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Thời gian bắt đầu chiếu phim
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Thời gian kết thúc chiếu phim
        /// </summary>
        public TimeSpan End_Time { get; set; }

        /// <summary>
        /// Cấp độ giá vé (Regular hoặc VIP)
        /// </summary>
        public string Price_Tier { get; set; }

        /// <summary>
        /// Giá vé cơ bản của lịch chiếu
        /// </summary>
        public decimal Base_Price { get; set; }

        /// <summary>
        /// Thông tin chi tiết về bộ phim
        /// </summary>
        public MovieInfoDTO Movie { get; set; }

        /// <summary>
        /// Tổng số ghế trong phòng chiếu
        /// </summary>
        public int TotalSeats { get; set; }

        /// <summary>
        /// Số ghế còn trống
        /// </summary>
        public int AvailableSeats { get; set; }

        /// <summary>
        /// Thông tin về phòng chiếu
        /// </summary>
        public RoomDTO Room { get; set; }
    }


}
