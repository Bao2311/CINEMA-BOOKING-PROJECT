using System;
using System.ComponentModel.DataAnnotations;

namespace STP.APIService.Controllers.DTOs
{
    public class CreateMovieDTO
    {
        [Required]
        [StringLength(255)]
        public string Movie_Name { get; set; }

        [Required]
        public DateTime Release_Date { get; set; }

        public DateTime? End_Date { get; set; }

        [Required]
        [StringLength(255)]
        public string Production_Company { get; set; }

        [Required]
        [StringLength(255)]
        public string Director { get; set; }

        [Required]
        public string Cast { get; set; }

        [Required]
        [Range(1, 1000)]
        public int Duration { get; set; }

        [Required]
        [StringLength(100)]
        public string Genre { get; set; }

        [Required]
        [StringLength(10)]
        public string Rating { get; set; }

        [Required]
        [StringLength(50)]
        public string Language { get; set; }

        [Required]
        [StringLength(100)]
        public string Country { get; set; }

        [Required]
        public string Synopsis { get; set; }

        [Required]
        [Url]
        public string Poster_URL { get; set; }

        [Required]
        [Url]
        public string Trailer_Link { get; set; }

        public string Status { get; set; } = "Coming Soon";
    }

    public class MovieResponseDTO
    {
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
        public string Status { get; set; }
        public int Created_By { get; set; }
        public DateTime Created_At { get; set; }
        public DateTime Updated_At { get; set; }
    }
}