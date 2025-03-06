using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Points_Redemption")]
    public class PointsRedemption
    {
        [Key]
        public int Redemption_ID { get; set; }

        public int User_ID { get; set; }

        public int Points_Redeemed { get; set; }

        public DateTime Date { get; set; }

        public string Status { get; set; }

        // Navigation Properties
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}