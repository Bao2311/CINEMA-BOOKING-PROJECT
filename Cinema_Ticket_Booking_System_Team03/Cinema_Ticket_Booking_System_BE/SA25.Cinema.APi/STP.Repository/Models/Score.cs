using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Scores")]
    public class Score
    {
        [Key]
        public int Score_ID { get; set; }

        public int User_ID { get; set; }

        public int Points_Added { get; set; }

        public int Points_Used { get; set; }

        public DateTime Date { get; set; }

        // Navigation Properties
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}