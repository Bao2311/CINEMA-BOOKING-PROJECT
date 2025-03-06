using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Showtimes")]
    public class Showtime
    {
        [Key]
        public int Showtime_ID { get; set; }

        public int Movie_ID { get; set; }

        public int Cinema_Room_ID { get; set; }

        public DateTime Show_Date { get; set; }

        public TimeSpan Start_Time { get; set; }

        public TimeSpan End_Time { get; set; }

        public string Price_Tier { get; set; }

        public decimal Base_Price { get; set; }

        public string Status { get; set; } = "Scheduled";

        public int Capacity_Available { get; set; }

        public int Created_By { get; set; }

        public DateTime Created_At { get; set; } = DateTime.Now;

        public DateTime Updated_At { get; set; }

        // Navigation Properties
        [ForeignKey("Movie_ID")]
        public virtual Movie Movie { get; set; }

        [ForeignKey("Cinema_Room_ID")]
        public virtual CinemaRoom CinemaRoom { get; set; }

        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        [InverseProperty("Showtime")]
        public virtual ICollection<Seat> Seats { get; set; }

        [InverseProperty("Showtime")]
        public virtual ICollection<TicketBooking> TicketBookings { get; set; }
    }
}
