using STP.Repository.Dtos;
using System;
using System.Collections.Generic;

namespace STP.Repository.Dtos
{
    /// <summary>
    /// DTO hiển thị thông tin ghế ngồi
    /// </summary>
    public class SeatDto
    {
        /// <summary>
        /// ID của ghế
        /// </summary>
        public int Seat_ID { get; set; }
        public string Seat { get; set; }

        /// <summary>
        /// Tên hàng ghế (A, B, C...)
        /// </summary>
        public string Row_Name { get; set; }

        /// <summary>
        /// Số ghế trong hàng
        /// </summary>
        public int Seat_Number { get; set; }

        /// <summary>
        /// Loại ghế (Standard, VIP, Couple)
        /// </summary>
        public string Seat_Type { get; set; }

        /// <summary>
        /// Giá ghế
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Trạng thái ghế (true: còn trống, false: đã đặt)
        /// </summary>
        public String Seat_Status { get; set; }
        public int Layout_ID { get; set; }
    }

    /// <summary>
    /// DTO hiển thị sơ đồ ghế ngồi của suất chiếu
    /// </summary>
    public class SeatMapDTO
    {
        /// <summary>
        /// ID của suất chiếu
        /// </summary>
        public int Showtime_ID { get; set; }

        /// <summary>
        /// Thông tin phim
        /// </summary>
        public MovieInfoDTO Movie { get; set; }

        /// <summary>
        /// Thông tin phòng chiếu
        /// </summary>
        public RoomDTO Room { get; set; }

        /// <summary>
        /// Ngày chiếu phim
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Thời gian bắt đầu chiếu
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Danh sách các hàng ghế
        /// </summary>
        public List<string> Rows { get; set; }
        public string Movie_Title { get; set; }
        public string Cinema_Room { get; set; }
        public TimeSpan End_Time { get; set; }
        /// <summary>
        /// Danh sách ghế ngồi
        /// </summary>
        public List<SeatDto> Seats { get; set; }
    }
    public class SeatTypeCreateDto
    {
        public string Room_Type { get; set; }
        public string Seat_Type { get; set; }
        public decimal Base_Price { get; set; }
    }
    public class SeatTypeResponseDto
    {
        public int Price_ID { get; set; }
        public string Room_Type { get; set; }
        public string Seat_Type { get; set; }
        public decimal Base_Price { get; set; }
        public string Status { get; set; }
        public DateTime Created_Date { get; set; }
    }
    public class SeatTypeUpdateDto
    {
        public string Room_Type { get; set; }
        public string Seat_Type { get; set; }
        public decimal Base_Price { get; set; }
        public string Status { get; set; }
    }
    public class SeatMapConfigurationDto
    {
        public List<RowConfigurationDto> Rows { get; set; }
        public int ColumnsPerRow { get; set; }
    }

    public class RowConfigurationDto
    {
        public string RowLabel { get; set; }
        public string SeatType { get; set; } = "Regular";
        public List<int> EmptyColumns { get; set; } = new List<int>();
    }

    public class UpdateSeatTypeDto
    {
        public string SeatType { get; set; }
        public bool? IsActive { get; set; }
    }

    public class BulkUpdateSeatsDto
    {
        public List<int> LayoutIds { get; set; }
        public string SeatType { get; set; }
        public bool? IsActive { get; set; }
    }
    public class BulkUpdateResultDto
    {
        public int UpdatedCount { get; set; }
        public string SeatType { get; set; }
        public bool? IsActive { get; set; }
        public List<int> UsedSeats { get; set; }
        public string Message { get; set; }
    }
    public class BulkRowConfigurationDto
    {
        public string RowsInput { get; set; }  // Chuỗi chứa các hàng, ví dụ: "A,B,C" hoặc "A-Z"
        public int ColumnsPerRow { get; set; }
        public string SeatType { get; set; }
        public List<int> EmptyColumns { get; set; }
    }

    public class RowConfigDto
    {
        public string RowLabel { get; set; }
        public string SeatType { get; set; }
        public List<int> EmptyColumns { get; set; } = new List<int>();
    }

}


