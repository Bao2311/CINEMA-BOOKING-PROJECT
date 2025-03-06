using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Users")]
    public class User
    {
        [Key]
        public int User_ID { get; set; }

        public string? Full_Name { get; set; }

        public string? Email { get; set; }

        public string? Password { get; set; }

        public string? Role { get; set; }

        public string? Department { get; set; }

        public DateTime? Hire_Date { get; set; }

        public DateTime? Date_Of_Birth { get; set; }

        public string? Sex { get; set; }

        public string? Phone_Number { get; set; }

        public string? Address { get; set; }

        public string? Account_Status { get; set; } = "Active";

        public DateTime Created_At { get; set; } = DateTime.Now;

        public DateTime? Last_Login { get; set; }

        // Navigation Properties
        [InverseProperty("User")]
        public virtual ICollection<TicketBooking> TicketBookings { get; set; }

        [InverseProperty("CreatedBy")]
        public virtual ICollection<Movie> Movies { get; set; }

        [InverseProperty("CreatedBy")]
        public virtual ICollection<Promotion> Promotions { get; set; }

        [InverseProperty("User")]
        public virtual ICollection<MovieRating> MovieRatings { get; set; }

        [InverseProperty("User")]
        public virtual ICollection<Score> Scores { get; set; }

        [InverseProperty("User")]
        public virtual ICollection<PointsRedemption> PointsRedemptions { get; set; }

        [InverseProperty("User")]
        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; }

        [InverseProperty("ProcessedBy")]
        public virtual ICollection<Payment> ProcessedPayments { get; set; }
    }
}