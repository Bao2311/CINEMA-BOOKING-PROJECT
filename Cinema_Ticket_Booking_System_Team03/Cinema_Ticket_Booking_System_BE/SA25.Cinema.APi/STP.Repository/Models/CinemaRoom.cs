using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Cinema_Rooms")]
    public class CinemaRoom
    {
        [Key]
        public int Cinema_Room_ID { get; set; }

        public string Room_Name { get; set; }

        public int Seat_Quantity { get; set; }

        public string Room_Type { get; set; }

        public string Status { get; set; } = "Active";

        public string Notes { get; set; }

        // Navigation Properties
        [InverseProperty("CinemaRoom")]
        public virtual ICollection<SeatLayout> SeatLayouts { get; set; }

        [InverseProperty("CinemaRoom")]
        public virtual ICollection<Showtime> Showtimes { get; set; }
    }
}