using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Movie_Ratings")]
    public class MovieRating
    {
        [Key]
        public int Rating_ID { get; set; }

        public int Movie_ID { get; set; }

        public int User_ID { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        public string Comment { get; set; }

        public DateTime Rating_Date { get; set; }

        public bool Is_Verified { get; set; } = false;

        // Navigation Properties
        [ForeignKey("Movie_ID")]
        public virtual Movie Movie { get; set; }

        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}