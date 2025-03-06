using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Movies")]
    public class Movie
    {
        [Key]
        public int Movie_ID { get; set; }

        public string Movie_Name { get; set; }

        public DateTime Release_Date { get; set; }

        public DateTime? End_Date { get; set; }

        public string Production_Company { get; set; }

        public string Director { get; set; }

        public string Cast { get; set; }

        public int Duration { get; set; }

        public string Genre { get; set; }

        public string Rating { get; set; }

        public string Language { get; set; }

        public string Country { get; set; }

        public string Synopsis { get; set; }

        public string Poster_URL { get; set; }

        public string Trailer_Link { get; set; }

        public string Status { get; set; } = "Coming Soon";

        public int Created_By { get; set; }

        public DateTime Created_At { get; set; } = DateTime.Now;

        public DateTime Updated_At { get; set; }

        // Navigation Properties
        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        [InverseProperty("Movie")]
        public virtual ICollection<Showtime> Showtimes { get; set; }

        [InverseProperty("Movie")]
        public virtual ICollection<MovieRating> MovieRatings { get; set; }
    }
}