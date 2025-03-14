using System;
using System.ComponentModel.DataAnnotations;

namespace STP.APIService.Controllers.DTOs
{
    /// <summary>
    /// DTO dùng cho vi?c t?o m?i m?t b? phim.
    /// Ch?a các thông tin c?n thi?t ?? t?o m?t b? phim m?i trong h? th?ng.
    /// </summary>
    public class CreateMovieDTO
    {
        /// <summary>
        /// Tên c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(255)]
        public string Movie_Name { get; set; }

        /// <summary>
        /// Ngày phát hành c?a b? phim. Ph?i là ngày trong t??ng lai.
        /// </summary>
        [Required]
        [FutureDate(ErrorMessage = "Release date must be in the future")]
        public DateTime Release_Date { get; set; }

        /// <summary>
        /// Ngày k?t thúc chi?u phim (tùy ch?n).
        /// </summary>
        public DateTime? End_Date { get; set; }

        /// <summary>
        /// Công ty s?n xu?t phim.
        /// </summary>
        [Required]
        [StringLength(255)]
        public string Production_Company { get; set; }

        /// <summary>
        /// ??o di?n c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(255)]
        public string Director { get; set; }

        /// <summary>
        /// Danh sách di?n viên tham gia b? phim.
        /// </summary>
        [Required]
        public string Cast { get; set; }

        /// <summary>
        /// Th?i l??ng c?a b? phim (tính b?ng phút).
        /// </summary>
        [Required]
        [Range(1, 1000)]
        public int Duration { get; set; }

        /// <summary>
        /// Th? lo?i c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Genre { get; set; }

        /// <summary>
        /// X?p h?ng ?? tu?i c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(10)]
        public string Rating { get; set; }

        /// <summary>
        /// Ngôn ng? chính c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Language { get; set; }

        /// <summary>
        /// Qu?c gia s?n xu?t b? phim.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Country { get; set; }

        /// <summary>
        /// Tóm t?t n?i dung c?a b? phim.
        /// </summary>
        [Required]
        public string Synopsis { get; set; }

        /// <summary>
        /// URL c?a poster phim.
        /// </summary>
        [Required]
        [Url]
        public string Poster_URL { get; set; }

        /// <summary>
        /// ???ng d?n ??n trailer c?a phim.
        /// </summary>
        [Required]
        [Url]
        public string Trailer_Link { get; set; }

        /// <summary>
        /// Tr?ng thái c?a b? phim. M?c ??nh là "Coming Soon".
        /// </summary>
        public string Status { get; set; } = "Coming Soon";
    }

    /// <summary>
    /// DTO dùng cho vi?c c?p nh?t thông tin c?a m?t b? phim.
    /// </summary>
    public class UpdateMovieDTO
    {
        /// <summary>
        /// ID c?a b? phim c?n c?p nh?t.
        /// </summary>
        [Required]
        public int Movie_ID { get; set; }

        /// <summary>
        /// Tên m?i c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(255)]
        public string Movie_Name { get; set; }

        /// <summary>
        /// Ngày phát hành c?a b? phim. Ph?i là ngày trong t??ng lai.
        /// </summary>
        [Required]
        [CustomValidation(typeof(UpdateMovieDTO), nameof(ValidateReleaseDate))]
        public DateTime Release_Date { get; set; }

        /// <summary>
        /// Ngày k?t thúc chi?u phim (tùy ch?n).
        /// </summary>
        public DateTime? End_Date { get; set; }

        /// <summary>
        /// Công ty s?n xu?t phim.
        /// </summary>
        [Required]
        [StringLength(255)]
        public string Production_Company { get; set; }

        /// <summary>
        /// ??o di?n c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(255)]
        public string Director { get; set; }

        /// <summary>
        /// Danh sách di?n viên tham gia b? phim.
        /// </summary>
        [Required]
        public string Cast { get; set; }

        /// <summary>
        /// Th?i l??ng c?a b? phim (tính b?ng phút).
        /// </summary>
        [Required]
        [Range(1, 1000)]
        public int Duration { get; set; }

        /// <summary>
        /// Th? lo?i c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Genre { get; set; }

        /// <summary>
        /// X?p h?ng ?? tu?i c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(10)]
        public string Rating { get; set; }

        /// <summary>
        /// Ngôn ng? chính c?a b? phim.
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Language { get; set; }

        /// <summary>
        /// Qu?c gia s?n xu?t b? phim.
        /// </summary>
        [Required]
        [StringLength(100)]
        public string Country { get; set; }

        /// <summary>
        /// Tóm t?t n?i dung c?a b? phim.
        /// </summary>
        [Required]
        public string Synopsis { get; set; }

        /// <summary>
        /// URL c?a poster phim.
        /// </summary>
        [Required]
        [Url]
        public string Poster_URL { get; set; }

        /// <summary>
        /// ???ng d?n ??n trailer c?a phim.
        /// </summary>
        [Required]
        [Url]
        public string Trailer_Link { get; set; }

        /// <summary>
        /// Tr?ng thái c?a b? phim. M?c ??nh là "Coming Soon".
        /// </summary>
        public string Status { get; set; } = "Coming Soon";

        /// <summary>
        /// ID c?a ng??i dùng th?c hi?n c?p nh?t.
        /// </summary>
        [Required]
        public int Created_By { get; set; }

        /// <summary>
        /// Ph??ng th?c ki?m tra tính h?p l? c?a ngày phát hành.
        /// Ngày phát hành không ???c n?m trong quá kh?.
        /// </summary>
        /// <param name="releaseDate">Ngày phát hành c?n ki?m tra</param>
        /// <param name="context">Ng? c?nh ki?m tra</param>
        /// <returns>K?t qu? ki?m tra tính h?p l?</returns>
        public static ValidationResult ValidateReleaseDate(DateTime releaseDate, ValidationContext context)
        {
            if (releaseDate < DateTime.Today)
            {
                return new ValidationResult("Release Date can't be in the past");
            }
            return ValidationResult.Success;
        }
    }

    /// <summary>
    /// DTO dùng ?? tr? v? thông tin c?a m?t b? phim.
    /// </summary>
    public class MovieResponseDTO
    {
        /// <summary>
        /// ID c?a b? phim.
        /// </summary>
        public int Movie_ID { get; set; }

        /// <summary>
        /// Tên c?a b? phim.
        /// </summary>
        public string Movie_Name { get; set; }

        /// <summary>
        /// Ngày phát hành c?a b? phim.
        /// </summary>
        public DateTime Release_Date { get; set; }

        /// <summary>
        /// Ngày k?t thúc chi?u phim (n?u có).
        /// </summary>
        public DateTime? End_Date { get; set; }

        /// <summary>
        /// Công ty s?n xu?t phim.
        /// </summary>
        public string Production_Company { get; set; }

        /// <summary>
        /// ??o di?n c?a b? phim.
        /// </summary>
        public string Director { get; set; }

        /// <summary>
        /// Danh sách di?n viên tham gia b? phim.
        /// </summary>
        public string Cast { get; set; }

        /// <summary>
        /// Th?i l??ng c?a b? phim (tính b?ng phút).
        /// </summary>
        public int Duration { get; set; }

        /// <summary>
        /// Th? lo?i c?a b? phim.
        /// </summary>
        public string Genre { get; set; }

        /// <summary>
        /// X?p h?ng ?? tu?i c?a b? phim.
        /// </summary>
        public string Rating { get; set; }

        /// <summary>
        /// Ngôn ng? chính c?a b? phim.
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Qu?c gia s?n xu?t b? phim.
        /// </summary>
        public string Country { get; set; }

        /// <summary>
        /// Tóm t?t n?i dung c?a b? phim.
        /// </summary>
        public string Synopsis { get; set; }

        /// <summary>
        /// URL c?a poster phim.
        /// </summary>
        public string Poster_URL { get; set; }

        /// <summary>
        /// ???ng d?n ??n trailer c?a phim.
        /// </summary>
        public string Trailer_Link { get; set; }

        /// <summary>
        /// Tr?ng thái hi?n t?i c?a b? phim.
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// ID c?a ng??i dùng ?ã t?o b? phim.
        /// </summary>
        public int Created_By { get; set; }

        /// <summary>
        /// Th?i ?i?m b? phim ???c t?o.
        /// </summary>
        public DateTime Created_At { get; set; }

        /// <summary>
        /// Th?i ?i?m b? phim ???c c?p nh?t l?n cu?i.
        /// </summary>
        public DateTime Updated_At { get; set; }
    }

    /// <summary>
    /// Thu?c tính xác th?c tùy ch?nh ?? ??m b?o ngày ???c ch?n là ngày trong t??ng lai.
    /// </summary>
    public class FutureDateAttribute : ValidationAttribute
    {
        /// <summary>
        /// Ki?m tra xem giá tr? có ph?i là m?t ngày trong t??ng lai hay không.
        /// </summary>
        /// <param name="value">Giá tr? c?n ki?m tra</param>
        /// <returns>true n?u giá tr? là m?t ngày trong t??ng lai, ng??c l?i là false</returns>
        public override bool IsValid(object value)
        {
            if (value is DateTime date)
            {
                return date > DateTime.Now;
            }
            return false;
        }
    }
}
