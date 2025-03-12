using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    [Table("FailedLogins")]
    public class FailedLogin
    {
        [Key]
        public int FailedLogin_ID { get; set; }

        public int User_ID { get; set; }
        public string IP_Address { get; set; }
        public string UserAgent { get; set; }
        public DateTime AttemptTime { get; set; } = DateTime.UtcNow;
    }
}
