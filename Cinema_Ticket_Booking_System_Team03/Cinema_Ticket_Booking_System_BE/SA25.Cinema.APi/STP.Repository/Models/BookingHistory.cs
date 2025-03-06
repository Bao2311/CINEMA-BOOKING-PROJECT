using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Booking_History")]
    public class BookingHistory
    {
        [Key]
        public int Booking_History_ID { get; set; }

        public int Booking_ID { get; set; }

        public DateTime Date { get; set; }

        public string Status { get; set; }

        // Navigation Properties
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }
    }
}