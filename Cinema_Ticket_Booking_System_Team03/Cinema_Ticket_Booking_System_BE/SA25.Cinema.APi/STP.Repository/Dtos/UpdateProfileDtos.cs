using System;
using System.ComponentModel.DataAnnotations;

namespace STP.Repository.Dtos
{
    // Base DTO for updating common fields
    public class BaseUpdateProfileDTO
    {
        [Required(ErrorMessage = "Full name is required")]
        [StringLength(50, ErrorMessage = "Full name must not exceed 50 characters")]
        [RegularExpression(@"^[a-zA-ZÀ-ỹ\s]*$", ErrorMessage = "Full name can only contain letters and spaces")]
        public string Full_Name { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number")]
        [RegularExpression(@"^(0[0-9]{9})$", ErrorMessage = "Phone number must start with 0 and have 10 digits")]
        public string Phone_Number { get; set; }

        [StringLength(200, ErrorMessage = "Address must not exceed 200 characters")]
        public string Address { get; set; }

        [DataType(DataType.Date)]
        [PastDate(ErrorMessage = "Date of birth must be a past date")]
        public DateTime? Date_Of_Birth { get; set; }

        [StringLength(10)]
        [RegularExpression("^(Male|Female)$", ErrorMessage = "Gender must be Male, Female")]
        public string Sex { get; set; }
    }

    // DTO for updating Customer profile
    public class UpdateCustomerProfileDTO : BaseUpdateProfileDTO
    {
        // Only basic information for customers
    }

    // DTO for updating Admin profile
    public class UpdateAdminProfileDTO : BaseUpdateProfileDTO
    {
        [Required(ErrorMessage = "Department is required")]
        [StringLength(50, ErrorMessage = "Department must not exceed 50 characters")]
        public string Department { get; set; }
    }

    // DTO for updating Staff profile
    public class UpdateStaffProfileDTO : BaseUpdateProfileDTO
    {
        [Required(ErrorMessage = "Department is required")]
        [StringLength(50, ErrorMessage = "Department must not exceed 50 characters")]
        public string Department { get; set; }
    }

    public class PastDateAttribute : ValidationAttribute
    {
        public override bool IsValid(object value)
        {
            if (value is DateTime date)
            {
                return date < DateTime.Now;
            }
            return true; // Return true if null (optional field)
        }
    }
}