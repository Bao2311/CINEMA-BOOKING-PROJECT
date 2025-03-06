using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Promotions")]
    public class Promotion
    {
        [Key]
        public int Promotion_ID { get; set; }

        public string Title { get; set; }

        public string Promotion_Code { get; set; }

        public DateTime Start_Date { get; set; }

        public DateTime End_Date { get; set; }

        public string Discount_Type { get; set; }

        public decimal Discount_Value { get; set; }

        public decimal Minimum_Purchase { get; set; } = 0;

        public decimal? Maximum_Discount { get; set; }

        public string Applicable_For { get; set; }

        public int? Usage_Limit { get; set; }

        public int Current_Usage { get; set; } = 0;

        public string Status { get; set; } = "Active";

        public string Promotion_Detail { get; set; }

        public int Created_By { get; set; }

        public DateTime Created_At { get; set; } = DateTime.Now;

        // Navigation Properties
        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        [InverseProperty("Promotion")]
        public virtual ICollection<TicketBooking> TicketBookings { get; set; }

        [InverseProperty("Promotion")]
        public virtual ICollection<PromotionUsage> PromotionUsages { get; set; }
    }
}