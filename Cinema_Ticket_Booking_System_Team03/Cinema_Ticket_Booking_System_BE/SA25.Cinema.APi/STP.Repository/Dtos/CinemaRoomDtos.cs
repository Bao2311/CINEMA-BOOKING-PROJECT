namespace STP.Repository.Dtos
{
    /// <summary>
    /// DTO hiển thị thông tin cơ bản của phòng chiếu
    /// </summary>
    public class RoomDTO
    {
        /// <summary>
        /// ID của phòng chiếu
        /// </summary>
        public int Cinema_Room_ID { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string Room_Name { get; set; }

        /// <summary>
        /// Loại phòng chiếu (Standard, VIP, IMAX, 4DX)
        /// </summary>
        public string Room_Type { get; set; }

        /// <summary>
        /// Số lượng ghế trong phòng chiếu
        /// </summary>
        public int Seat_Quantity { get; set; }

        /// <summary>
        /// Trạng thái của phòng chiếu (Active, Inactive, etc.)
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Ghi chú về phòng chiếu
        /// </summary>
        public string Notes { get; set; }

        /// <summary>
        /// Phòng có suất chiếu trong tương lai không
        /// </summary>
        public bool HasUpcomingShowtimes { get; set; }
    }

    /// <summary>
    /// DTO hiển thị thông tin chi tiết của phòng chiếu
    /// </summary>
    public class RoomDetailDTO
    {
        /// <summary>
        /// ID của phòng chiếu
        /// </summary>
        public int Cinema_Room_ID { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string Room_Name { get; set; }

        /// <summary>
        /// Loại phòng chiếu (Standard, VIP, IMAX, 4DX)
        /// </summary>
        public string Room_Type { get; set; }

        /// <summary>
        /// Sức chứa của phòng chiếu (dựa trên số ghế thực tế)
        /// </summary>
        public int Capacity { get; set; }

        /// <summary>
        /// Các tính năng đặc biệt của phòng chiếu
        /// </summary>
        public string Features { get; set; }

        /// <summary>
        /// Danh sách phim đang chiếu tại phòng
        /// </summary>
        public List<MovieListItemDTO> NowShowingMovies { get; set; }

        /// <summary>
        /// Số lượng ghế trong phòng chiếu
        /// </summary>
        public int Seat_Quantity { get; set; }

        /// <summary>
        /// Trạng thái của phòng chiếu (Active, Inactive, etc.)
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Ghi chú về phòng chiếu
        /// </summary>
        public string Notes { get; set; }

        /// <summary>
        /// Phòng có sơ đồ ghế không
        /// </summary>
        public bool HasSeats { get; set; }

        /// <summary>
        /// Thống kê số lượng ghế theo loại
        /// </summary>
        public List<SeatTypeCountDTO> SeatTypes { get; set; }

        /// <summary>
        /// Danh sách suất chiếu trong tương lai
        /// </summary>
        public List<ShowtimeDTO> UpcomingShowtimes { get; set; }

        /// <summary>
        /// Phòng có thể xóa không (dựa trên việc có suất chiếu trong tương lai hay không)
        /// </summary>
        public bool CanDelete { get; set; }
    }

    /// <summary>
    /// DTO hiển thị trạng thái hoạt động của phòng chiếu
    /// </summary>
    public class RoomStatusDTO
    {
        /// <summary>
        /// ID của phòng chiếu
        /// </summary>
        public int Cinema_Room_ID { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string Room_Name { get; set; }

        /// <summary>
        /// Loại phòng chiếu (Standard, VIP, IMAX, 4DX)
        /// </summary>
        public string Room_Type { get; set; }

        /// <summary>
        /// Trạng thái của phòng chiếu (Active, Inactive, etc.)
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Số lượng ghế trong phòng chiếu
        /// </summary>
        public int Seat_Quantity { get; set; }

        /// <summary>
        /// Ghi chú về phòng chiếu
        /// </summary>
        public string Notes { get; set; }

        /// <summary>
        /// Danh sách phim đang chiếu tại phòng
        /// </summary>
        public List<MovieListItemDTO> NowShowingMovies { get; set; }

        /// <summary>
        /// Danh sách suất chiếu trong tương lai
        /// </summary>
        public List<ShowtimeListItemDTO> UpcomingShowtimes { get; set; }

        /// <summary>
        /// Thống kê số lượng suất chiếu theo ngày
        /// </summary>
        public List<ShowtimeCountDTO> ShowtimesByDate { get; set; }
    }

    /// <summary>
    /// DTO hiển thị thông tin suất chiếu
    /// </summary>
    public class ShowtimeDTO
    {
        public int Showtime_ID { get; set; }
        public DateTime Show_Date { get; set; }
        public TimeSpan Start_Time { get; set; }
        public TimeSpan End_Time { get; set; }
        public string Movie_Name { get; set; }
    }

    /// <summary>
    /// DTO hiển thị số lượng ghế theo loại
    /// </summary>
    public class SeatTypeCountDTO
    {
        public string SeatType { get; set; }
        public int Count { get; set; }
    }

    /// <summary>
    /// DTO để tạo phòng chiếu mới
    /// </summary>
    public class CinemaRoomCreateDto
    {
        public string Room_Name { get; set; }
        public string Room_Type { get; set; }
        public int Seat_Quantity { get; set; } = 0;
        public string Status { get; set; }
        public string Notes { get; set; }
    }

    /// <summary>
    /// DTO để cập nhật thông tin phòng chiếu
    /// </summary>
    public class CinemaRoomUpdateDto
    {
        public string Room_Name { get; set; }
        public string Room_Type { get; set; }
        public int Seat_Quantity { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
    }
}


