using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using STP.Repository.Dtos;
using System;
using System.Collections.Generic;

namespace STP.Repository.Dtos
{
    /// <summary>
    /// DTO hiển thị thông tin đơn đặt vé trong lịch sử
    /// </summary>
    public class BookingHistoryItemDTO
    {
        /// <summary>
        /// ID đơn đặt vé
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Tên phim
        /// </summary>
        public string MovieName { get; set; }

        /// <summary>
        /// URL poster phim
        /// </summary>
        public string PosterUrl { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string RoomName { get; set; }

        /// <summary>
        /// Ngày chiếu
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Thời gian bắt đầu
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Tổng số tiền
        /// </summary>
        public decimal Total_Amount { get; set; }

        /// <summary>
        /// Trạng thái đơn đặt vé
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Thời gian đặt vé
        /// </summary>
        public DateTime Booking_Date { get; set; }

        /// <summary>
        /// Số lượng vé
        /// </summary>
        public int TicketCount { get; set; }

        /// <summary>
        /// Có thể hủy vé hay không
        /// </summary>
        public bool CanCancel { get; set; }
    }
    public class BookingResponseDto
    {
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public decimal TotalAmount { get; set; }
        public string BookingStatus { get; set; }
        public DateTime CreatedAt { get; set; }
        public ShowtimeInfoDto ShowtimeInfo { get; set; }
        public List<TicketInfoDto> Tickets { get; set; }
        public BookingSeatListDTO Seats { get; set; }
    }
    public class BookingSeatDTO
    {
        public int Seat_ID { get; set; }
        public string Row_Label { get; set; }
        public int Column_Number { get; set; }
        public string Seat_Type { get; set; }
        public decimal Price { get; set; }
    }
    public class BookingSeatListDTO
    {
        public List<BookingSeatDTO> Values { get; set; }
    }
    public class TicketInfoDto
    {
        public int TicketId { get; set; }
        public string SeatCode { get; set; }
        public string SeatRow { get; set; }
        public int SeatColumn { get; set; }
        public decimal Price { get; set; }
    }
    public class BookingHistoryDTO
    {
        /// <summary>
        /// ID của đơn đặt vé
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Ngày giờ đặt vé
        /// </summary>
        public DateTime Booking_Date { get; set; }

        /// <summary>
        /// Tổng số tiền của đơn đặt vé
        /// </summary>
        public decimal Total_Amount { get; set; }

        /// <summary>
        /// Trạng thái hiện tại của đơn đặt vé
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Phương thức thanh toán
        /// </summary>
        public string Payment_Method { get; set; }

        /// <summary>
        /// Ngày thanh toán
        /// </summary>
        public DateTime? Payment_Date { get; set; }

        /// <summary>
        /// Ngày hủy đơn (nếu có)
        /// </summary>
        public DateTime? Cancellation_Date { get; set; }

        /// <summary>
        /// Thông tin chi tiết về suất chiếu
        /// </summary>
        public ShowtimeInfoDTO Showtime { get; set; }
        public int? User_ID { get; set; }

        public int PointsEarned { get; set; }
    }

    /// <summary>
    /// DTO hiển thị chi tiết đơn đặt vé
    /// </summary>
    public class BookingDetailDto
    {
        /// <summary>
        /// ID đơn đặt vé
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Tên phim
        /// </summary>
        public string MovieName { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string RoomName { get; set; }

        /// <summary>
        /// Ngày chiếu
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Giờ bắt đầu
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Tổng tiền
        /// </summary>
        public decimal Total_Amount { get; set; }

        /// <summary>
        /// Trạng thái đặt vé
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Hạn thanh toán
        /// </summary>
        public DateTime Payment_Deadline { get; set; }

        /// <summary>
        /// Phương thức thanh toán
        /// </summary>
        public string Payment_Method { get; set; }

        /// <summary>
        /// Ngày giao dịch
        /// </summary>
        public DateTime Transaction_Date { get; set; }

        /// <summary>
        /// Ngày đặt vé
        /// </summary>
        public DateTime Booking_Date { get; set; }

        /// <summary>
        /// Ngày hủy vé
        /// </summary>
        public DateTime Cancellation_Date { get; set; }

        /// <summary>
        /// ID người dùng
        /// </summary>
        public int? User_ID { get; set; }

        /// <summary>
        /// Danh sách ghế đã đặt (dạng chuỗi, ví dụ: "A2, B3")
        /// </summary>
        public string Seats { get; set; }

        // Các thuộc tính khác nếu cần
        public ShowtimeDetailDTO Showtime { get; set; }
        public List<TicketDTO> Tickets { get; set; }

        public int PointsEarned { get; set; }
    }


    /// <summary>
    /// DTO thông tin phim và suất chiếu trong chi tiết đơn đặt vé
    /// </summary>
    public class MovieShowtimeDTO
    {
        /// <summary>
        /// Tên phim
        /// </summary>
        public string MovieName { get; set; }

        /// <summary>
        /// URL poster phim
        /// </summary>
        public string PosterUrl { get; set; }

        /// <summary>
        /// Thời lượng phim (phút)
        /// </summary>
        public int Duration { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string RoomName { get; set; }

        /// <summary>
        /// Loại phòng chiếu
        /// </summary>
        public string RoomType { get; set; }

        /// <summary>
        /// Ngày chiếu
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Thời gian bắt đầu
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Thời gian kết thúc
        /// </summary>
        public TimeSpan End_Time { get; set; }
    }

    /// <summary>
    /// DTO thông tin đặt vé trong chi tiết đơn đặt vé
    /// </summary>
    public class BookingInfoDTO
    {
        /// <summary>
        /// Thời gian đặt vé
        /// </summary>
        public DateTime Booking_Date { get; set; }

        /// <summary>
        /// Trạng thái đơn đặt vé
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Tổng số tiền
        /// </summary>
        public decimal Total_Amount { get; set; }

        /// <summary>
        /// Điểm thưởng nhận được
        /// </summary>
        public int Points_Earned { get; set; }

        /// <summary>
        /// Điểm thưởng đã sử dụng
        /// </summary>
        public int Points_Used { get; set; }
    }

    /// <summary>
    /// DTO thông tin ghế đã đặt trong chi tiết đơn đặt vé
    /// </summary>
    public class BookedSeatDTO
    {
        /// <summary>
        /// ID ghế
        /// </summary>
        public int Seat_ID { get; set; }

        /// <summary>
        /// Hàng ghế
        /// </summary>
        public string Row_Label { get; set; }

        /// <summary>
        /// Số cột/vị trí trong hàng
        /// </summary>
        public int Column_Number { get; set; }

        /// <summary>
        /// Loại ghế
        /// </summary>
        public string Seat_Type { get; set; }

        /// <summary>
        /// Giá ghế
        /// </summary>
        public decimal Price { get; set; }
    }

    /// <summary>
    /// DTO thông tin thanh toán trong chi tiết đơn đặt vé
    /// </summary>
    public class PaymentDetailDTO
    {
        /// <summary>
        /// Phương thức thanh toán
        /// </summary>
        public string Payment_Method { get; set; }

        /// <summary>
        /// Mã giao dịch
        /// </summary>
        public string Payment_Reference { get; set; }

        /// <summary>
        /// Thời gian giao dịch
        /// </summary>
        public DateTime Transaction_Date { get; set; }

        /// <summary>
        /// Trạng thái thanh toán
        /// </summary>
        public string Payment_Status { get; set; }

        /// <summary>
        /// Số tiền hoàn trả (nếu có)
        /// </summary>
        public decimal? Refund_Amount { get; set; }

        /// <summary>
        /// Thời gian hoàn trả (nếu có)
        /// </summary>
        public DateTime? Refund_Date { get; set; }
    }

    /// <summary>
    /// DTO thông tin khuyến mãi trong chi tiết đơn đặt vé
    /// </summary>
    public class PromotionInfoDTO
    {
        /// <summary>
        /// Tiêu đề khuyến mãi
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Mã khuyến mãi
        /// </summary>
        public string Promotion_Code { get; set; }

        /// <summary>
        /// Loại giảm giá (Percentage, Fixed Amount)
        /// </summary>
        public string Discount_Type { get; set; }

        /// <summary>
        /// Giá trị giảm giá
        /// </summary>
        public decimal Discount_Value { get; set; }

        /// <summary>
        /// Số tiền giảm giá
        /// </summary>
        public decimal Discount_Amount { get; set; }
    }

    /// <summary>
    /// DTO thông tin vé trong chi tiết đơn đặt vé
    /// </summary>
    public class TicketInfoDTO
    {
        /// <summary>
        /// ID vé
        /// </summary>
        public int Ticket_ID { get; set; }

        /// <summary>
        /// Mã vé
        /// </summary>
        public string Ticket_Code { get; set; }

        /// <summary>
        /// Giá vé cơ bản
        /// </summary>
        public decimal Base_Price { get; set; }

        /// <summary>
        /// Số tiền giảm giá
        /// </summary>
        public decimal Discount_Amount { get; set; }

        /// <summary>
        /// Giá cuối cùng
        /// </summary>
        public decimal Final_Price { get; set; }

        /// <summary>
        /// Đã check-in hay chưa
        /// </summary>
        public bool Is_Checked_In { get; set; }

        /// <summary>
        /// Thời gian check-in (nếu đã check-in)
        /// </summary>
        public DateTime? Check_In_Time { get; set; }
    }
    /// <summary>
    /// DTO yêu cầu tạo đơn đặt vé mới
    /// </summary>
    public class CreateBookingRequestDTO
    {
        /// <summary>
        /// ID suất chiếu
        /// </summary>
        public int ShowtimeId { get; set; }

        /// <summary>
        /// Danh sách ID ghế được chọn
        /// </summary>
        public List<int> SeatIds { get; set; }

        /// <summary>
        /// Mã khuyến mãi (nếu có)
        /// </summary>
        public string PromotionCode { get; set; }
    }

    /// <summary>
    /// DTO phản hồi sau khi tạo đơn đặt vé
    /// </summary>
    public class BookingResponseDTO
    {         /// <summary>
              /// ID đơn đặt vé
              /// ID đơn đặt vé
              /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Tên phim
        /// </summary>
        public string MovieName { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string RoomName { get; set; }

        /// <summary>
        /// Ngày chiếu
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Thời gian bắt đầu
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Tổng số tiền
        /// </summary>
        public decimal Total_Amount { get; set; }

        /// <summary>
        /// Trạng thái đơn đặt vé
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Thời hạn thanh toán
        /// </summary>
        public DateTime Payment_Deadline { get; set; }

        /// <summary>
        /// Danh sách ghế đã chọn
        /// </summary>
        public string Seats { get; set; }

        /// <summary>
        /// Danh sách phương thức thanh toán có sẵn
        /// </summary>
        public string Payment_Method { get; set; }

        public DateTime Transaction_Date { get; set; }

        public ShowtimeInfoDTO Showtime { get; set; }

        public List<TicketDTO> Tickets { get; set; }

        public DateTime Booking_Date { get; set; }

        public DateTime Cancellation_Date { get; set; }

        public int? User_ID { get; set; }

        public int PointsUsed { get; set; } = 0;

        public decimal DiscountFromPoints { get; set; } = 0;

        public int PointsEarned { get; set; } = 0;

        public int CurrentPoints { get; set; } = 0;

        public decimal PointDiscountAmount { get; set; }

        public decimal OriginalTotalAmount { get; set; } 
        
        public decimal DiscountedTotalAmount { get; set; }

        public int? PointsRefunded { get; set; }

        public bool IsStaffBooking { get; set; }

        public MemberInfoDTO MemberInfo { get; set; }
    }

    public class MemberInfoDTO
    {
        public int User_ID { get; set; }
        public string Full_Name { get; set; }
        public string Phone_Number { get; set; }
        public string Email { get; set; }
    }

    public class ShowtimeInfoDTO
    {
        public int Showtime_ID { get; set; }
        public DateTime Show_Date { get; set; }
        public TimeSpan Start_Time { get; set; }
        public RoomDTO Room { get; set; }
        public MovieInfoDTO Movie { get; set; }

    }

    /// <summary>
    /// DTO yêu cầu xử lý thanh toán
    /// </summary>
    public class PaymentRequestDTO
    {
        /// <summary>
        /// Phương thức thanh toán
        /// </summary>
        public string PaymentMethod { get; set; }

        /// <summary>
        /// Mã giao dịch
        /// </summary>
        public string TransactionId { get; set; }
    }

    /// <summary>
    /// DTO phản hồi sau khi thanh toán
    /// </summary>
    public class PaymentResponseDTO
    {
        /// <summary>
        /// ID đơn đặt vé
        /// </summary>
        public int Booking_ID { get; set; }

        /// <summary>
        /// Tên phim
        /// </summary>
        public string MovieName { get; set; }

        /// <summary>
        /// Tên phòng chiếu
        /// </summary>
        public string RoomName { get; set; }

        /// <summary>
        /// Ngày chiếu
        /// </summary>
        public DateTime Show_Date { get; set; }

        /// <summary>
        /// Thời gian bắt đầu
        /// </summary>
        public TimeSpan Start_Time { get; set; }

        /// <summary>
        /// Tổng số tiền
        /// </summary>
        public decimal Total_Amount { get; set; }

        /// <summary>
        /// Trạng thái đơn đặt vé
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Điểm thưởng nhận được
        /// </summary>
        public int PointsEarned { get; set; }

        /// <summary>
        /// Danh sách vé
        /// </summary>
        public List<TicketDTO> Tickets { get; set; }

        /// <summary>
        /// Thông tin thanh toán
        /// </summary>
        public PaymentInfoDTO Payment { get; set; }
        public DateTime Booking_Date { get; set; }
    }

    /// <summary>
    /// DTO thông tin vé
    /// </summary>
    public class TicketDTO
    {
        /// <summary>
        /// ID vé
        /// </summary>
        public int Ticket_ID { get; set; }

        /// <summary>
        /// Mã vé
        /// </summary>
        public string Ticket_Code { get; set; }

        public int Seat_ID { get; set; }
        public String Seat_Status { get; set; }
        public decimal Price { get; set; }
    }

    /// <summary>
    /// DTO thông tin thanh toán
    /// </summary>
    public class PaymentInfoDTO
    {
        /// <summary>
        /// Phương thức thanh toán
        /// </summary>
        public string Payment_Method { get; set; }

        /// <summary>
        /// Thời gian giao dịch
        /// </summary>
        public DateTime Transaction_Date { get; set; }

        /// <summary>
        /// Trạng thái thanh toán
        /// </summary>
        public string Payment_Status { get; set; }
    }
    public class BookingRequestDTO
    {
        /// <summary>
        /// ID suất chiếu
        /// </summary>
        public int Showtime_ID { get; set; }

        /// <summary>BookingResponseDTO
        /// Danh sách ID ghế được chọn
        /// </summary>
        public List<int> Seat_IDs { get; set; }

        /// <summary>
        /// Phương thức thanh toán
        /// </summary>
        public string Payment_Method { get; set; }

    }
    public class BookingSearchResponseDTO
    {
        public int Booking_ID { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public string CustomerPhone { get; set; }
        public string MovieName { get; set; }
        public DateTime ShowDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public string RoomName { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; }
        public DateTime BookingDate { get; set; }
        public string PaymentMethod { get; set; }
        public string Seats { get; set; }
    }

    public class PendingBookingCheckDTO
    {
        public int Booking_ID { get; set; }
        public DateTime Booking_Date { get; set; }
        public DateTime Payment_Deadline { get; set; }
        public bool IsExpired { get; set; }
        public string Seats { get; set; }
        public decimal Total_Amount { get; set; }
        public string MovieName { get; set; }
        public string RoomName { get; set; }
        public DateTime Show_Date { get; set; }
        public TimeSpan Start_Time { get; set; }
        public int RemainingMinutes { get; set; }
    }

    public class SalesReportDTO
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Period { get; set; } // daily, weekly, monthly
        public int TotalBookings { get; set; }
        public int TotalTickets { get; set; }
        public decimal TotalAmount { get; set; }
        public List<PeriodSalesDTO> PeriodSales { get; set; }
    }

    public class PeriodSalesDTO
    {
        public string PeriodName { get; set; } // Tên kỳ (ngày, tuần, tháng)
        public int TotalBookings { get; set; }
        public int TotalTickets { get; set; }
        public decimal TotalAmount { get; set; }
        public Dictionary<string, decimal> PaymentMethods { get; set; } // Phương thức -> Số tiền
    }

    // DTOs for Booking Statistics
    public class BookingStatisticsDTO
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageTicketsPerBooking { get; set; }
        public List<MovieStatisticsDTO> MovieStatistics { get; set; }
        public List<RoomStatisticsDTO> RoomStatistics { get; set; }
        public Dictionary<string, DailyStatisticsDTO> DailyStatistics { get; set; }
        public Dictionary<string, decimal> PaymentMethodStatistics { get; set; }
    }

    public class MovieStatisticsDTO
    {
        public int MovieId { get; set; }
        public string MovieName { get; set; }
        public int TotalBookings { get; set; }
        public int TotalTickets { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class RoomStatisticsDTO
    {
        public int RoomId { get; set; }
        public string RoomName { get; set; }
        public int TotalBookings { get; set; }
        public int TotalTickets { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class DailyStatisticsDTO
    {
        public string Day { get; set; }
        public int TotalBookings { get; set; }
        public int TotalTickets { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    // DTOs for Staff Performance Reports
    public class StaffPerformanceDTO
    {
        public int StaffId { get; set; }
        public string StaffName { get; set; }
        public string Department { get; set; }
        public int TotalBookingsHandled { get; set; }
        public int CounterBookings { get; set; } // Số lượng đặt tại quầy
        public int OnlineBookings { get; set; } // Số lượng hỗ trợ đặt online
        public decimal TotalRevenue { get; set; }
        public decimal AverageRevenuePerBooking { get; set; }
        public List<BookingPerformanceDTO> BookingsData { get; set; }
    }

    public class BookingPerformanceDTO
    {
        public int BookingId { get; set; }
        public DateTime BookingDate { get; set; }
        public int TicketCount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string CustomerName { get; set; } // Tên khách hàng
    }
}



