using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Seats")]
    public class Seat
    {
        [Key]
        public int Seat_ID { get; set; }

        public int Layout_ID { get; set; }

        public int Showtime_ID { get; set; }

        public string Seat_Status { get; set; } = "Available";

        public DateTime Last_Updated { get; set; } = DateTime.Now;

        // Navigation Properties
        [ForeignKey("Layout_ID")]
        public virtual SeatLayout SeatLayout { get; set; }

        [ForeignKey("Showtime_ID")]
        public virtual Showtime Showtime { get; set; }

        [InverseProperty("Seat")]
        public virtual ICollection<Ticket> Tickets { get; set; }
    }
}