using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Promotion_Usage")]
    public class PromotionUsage
    {
        [Key]
        public int Usage_ID { get; set; }

        public int Promotion_ID { get; set; }

        public int Booking_ID { get; set; }

        public int User_ID { get; set; }

        public decimal Discount_Amount { get; set; }

        public DateTime Applied_Date { get; set; }

        // Navigation Properties
        [ForeignKey("Promotion_ID")]
        public virtual Promotion Promotion { get; set; }

        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }

        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}