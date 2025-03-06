using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Tickets")]
    public class Ticket
    {
        [Key]
        public int Ticket_ID { get; set; }

        public int Booking_ID { get; set; }

        public int Seat_ID { get; set; }

        public decimal Base_Price { get; set; }

        public decimal Discount_Amount { get; set; } = 0;

        public decimal Final_Price { get; set; }

        public string Ticket_Code { get; set; }

        public bool Is_Checked_In { get; set; } = false;

        public DateTime? Check_In_Time { get; set; }

        // Navigation Properties
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }

        [ForeignKey("Seat_ID")]
        public virtual Seat Seat { get; set; }
    }
}