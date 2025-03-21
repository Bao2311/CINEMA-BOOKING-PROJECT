using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace STP.Repository.Dtos
{
    // DTO cho yêu cầu hoàn tiền
    public class RefundRequestDTO
    {
        public string Reason { get; set; }
        public string Additional_Info { get; set; }
    }

    // DTO cho kết quả hoàn tiền
    public class RefundResponseDTO
    {
        public int Booking_ID { get; set; }
        public decimal Original_Amount { get; set; }
        public decimal Refund_Amount { get; set; }
        public int Refund_Percentage { get; set; }
        public string Refund_Policy { get; set; }
        public DateTime Refund_Date { get; set; }
        public string Refund_Reason { get; set; }
        public string Status { get; set; }
        public string MovieName { get; set; }
        public DateTime Show_Date { get; set; }
        public TimeSpan Start_Time { get; set; }
        public string RoomName { get; set; }
        public string Seats { get; set; }
    }
    public class BulkPriceUpdateDto
    {
        public List<PriceUpdateItem> PriceUpdates { get; set; }
    }

    public class PriceUpdateItem
    {
        public int Price_ID { get; set; }
        public decimal Base_Price { get; set; }
    }
}
