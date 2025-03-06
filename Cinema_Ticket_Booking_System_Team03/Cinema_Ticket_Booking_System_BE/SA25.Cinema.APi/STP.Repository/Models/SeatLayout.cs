using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Seat_Layout")]
    public class SeatLayout
    {
        [Key]
        public int Layout_ID { get; set; }

        public int Cinema_Room_ID { get; set; }

        public string Row_Label { get; set; }

        public int Column_Number { get; set; }

        public string Seat_Type { get; set; } = "Regular";

        public bool Is_Active { get; set; } = true;

        // Navigation Properties
        [ForeignKey("Cinema_Room_ID")]
        public virtual CinemaRoom CinemaRoom { get; set; }

        [InverseProperty("SeatLayout")]
        public virtual ICollection<Seat> Seats { get; set; }
    }
}