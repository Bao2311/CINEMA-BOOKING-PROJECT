using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Ticket_Bookings")]
    public class TicketBooking
    {
        [Key]
        public int Booking_ID { get; set; }

        public int User_ID { get; set; }

        public int Showtime_ID { get; set; }

        public int? Promotion_ID { get; set; }

        public DateTime Booking_Date { get; set; } = DateTime.Now;

        public DateTime Payment_Deadline { get; set; }

        public decimal Total_Amount { get; set; }

        public int Points_Earned { get; set; } = 0;

        public int Points_Used { get; set; } = 0;

        public string Status { get; set; } = "Pending";

        public int Created_By { get; set; }

        // Navigation Properties
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }

        [ForeignKey("Showtime_ID")]
        public virtual Showtime Showtime { get; set; }

        [ForeignKey("Promotion_ID")]
        public virtual Promotion Promotion { get; set; }

        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        [InverseProperty("TicketBooking")]
        public virtual ICollection<Ticket> Tickets { get; set; }

        [InverseProperty("TicketBooking")]
        public virtual ICollection<Payment> Payments { get; set; }

        [InverseProperty("TicketBooking")]
        public virtual ICollection<BookingHistory> BookingHistories { get; set; }

        [InverseProperty("TicketBooking")]
        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; }
    }
}
