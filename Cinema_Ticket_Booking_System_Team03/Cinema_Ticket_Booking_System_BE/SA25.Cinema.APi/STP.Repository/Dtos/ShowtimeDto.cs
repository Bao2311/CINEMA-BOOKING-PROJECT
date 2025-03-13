using System;
using System.ComponentModel.DataAnnotations;

namespace STP.Repository.DTOs
{
    // ShowtimeDto dùng để hiển thị thông tin lịch chiếu
    public class ShowtimeDto
    {
        public int Showtime_ID { get; set; }

        public int Movie_ID { get; set; }


        public int Cinema_Room_ID { get; set; }

        public string? Room_Name { get; set; }

        public DateTime Show_Date { get; set; }

        public TimeSpan Start_Time { get; set; }

        public TimeSpan End_Time { get; set; }

        public string Price_Tier { get; set; }

        public decimal Base_Price { get; set; }

        public string Status { get; set; }


    }

    // ShowtimeCreateDto dùng để tạo lịch chiếu mới
    public class ShowtimeCreateDto
    {
        [Required]
        public int Movie_ID { get; set; }

        [Required]
        public int Cinema_Room_ID { get; set; }

        [Required]
        public DateTime Show_Date { get; set; }

        [Required]
        public TimeSpan Start_Time { get; set; }

        [Required]
        public TimeSpan End_Time { get; set; }

        [Required]
        [RegularExpression("^(Regular|VIP)$",
            ErrorMessage = "Price_Tier phải là 'Regular' hoặc 'VIP'")]
        public string Price_Tier { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Base_Price { get; set; }

        [Range(0, int.MaxValue)]
        public int Capacity_Available { get; set; }

    }

    // ShowtimeUpdateDto dùng để cập nhật lịch chiếu
    public class ShowtimeUpdateDto
    {
        [Required]
        public int Movie_ID { get; set; }

        [Required]
        public int Cinema_Room_ID { get; set; }

        [Required]
        public DateTime Show_Date { get; set; }

        [Required]
        public TimeSpan Start_Time { get; set; }

        [Required]
        public TimeSpan End_Time { get; set; }

        [Required]
        [RegularExpression("^(Regular|VIP)$",
            ErrorMessage = "Price_Tier phải là 'Regular',hoặc 'VIP'")]
        public string Price_Tier { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Base_Price { get; set; }

        [Range(0, int.MaxValue)]
        public int Capacity_Available { get; set; }

    }
}
