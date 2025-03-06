using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("Payments")]
    public class Payment
    {
        [Key]
        public int Payment_ID { get; set; }

        public int Booking_ID { get; set; }

        public decimal Amount { get; set; }

        public string Payment_Method { get; set; }

        public string Payment_Reference { get; set; }

        public DateTime Transaction_Date { get; set; }

        public string Payment_Status { get; set; }

        public string Processor_Response { get; set; }

        public decimal Refund_Amount { get; set; } = 0;

        public DateTime? Refund_Date { get; set; }

        public string Refund_Reason { get; set; }

        public int? Processed_By { get; set; }

        // Navigation Properties
        [ForeignKey("Booking_ID")]
        public virtual TicketBooking TicketBooking { get; set; }

        [ForeignKey("Processed_By")]
        public virtual User ProcessedBy { get; set; }
    }
}