using System;

namespace STP.Repository.Dtos
{
    // Base DTO with common fields
    public class BaseUserProfileDTO
    {
        public string Full_Name { get; set; }
        public string Email { get; set; }
        public string Phone_Number { get; set; }
        public string Address { get; set; }
        public DateTime? Date_Of_Birth { get; set; }
        public string Sex { get; set; }
    }

    // DTO for Customer profile
    public class CustomerProfileDTO : BaseUserProfileDTO
    {
        // Only basic information for customers
    }

    // DTO for Admin profile
    public class AdminProfileDTO : BaseUserProfileDTO
    {
        public int User_ID { get; set; }
        public string Role { get; set; }
        public string Department { get; set; }
        public DateTime? Hire_Date { get; set; }
        public DateTime Created_At { get; set; }
        public DateTime? Last_Login { get; set; }
        public string Account_Status { get; set; }
    }

    // DTO for Staff profile
    public class StaffProfileDTO : BaseUserProfileDTO
    {
        public int User_ID { get; set; }
        public string Role { get; set; }
        public string Department { get; set; }
        public DateTime? Hire_Date { get; set; }
        public DateTime Created_At { get; set; }
        public DateTime? Last_Login { get; set; }
        public string Account_Status { get; set; }
    }
}