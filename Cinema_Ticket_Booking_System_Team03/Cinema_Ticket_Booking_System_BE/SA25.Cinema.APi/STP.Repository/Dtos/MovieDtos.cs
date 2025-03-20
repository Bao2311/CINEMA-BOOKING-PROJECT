using Microsoft.AspNetCore.Http;
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
        [Required]
        public string Movie_Name { get; set; }

        [Required]
        public DateTime Release_Date { get; set; }

        public DateTime? End_Date { get; set; }

        [Required]
        public string Production_Company { get; set; }

        [Required]
        public string Director { get; set; }

        [Required]
        public string Cast { get; set; }

        [Required]
        public int Duration { get; set; }

        [Required]
        public string Genre { get; set; }

        [Required]
        public string Rating { get; set; }

        [Required]
        public string Language { get; set; }

        [Required]
        public string Country { get; set; }

        [Required]
        public string Synopsis { get; set; }

        public string Trailer_Link { get; set; }

        public string Status { get; set; }

        public IFormFile posterFile { get; set; }
    }

    public class UpdateMovieDTO
    {
        [Required]
        public int Movie_ID { get; set; }

        [Required]
        public string Movie_Name { get; set; }

        [Required]
        public DateTime Release_Date { get; set; }

        public DateTime? End_Date { get; set; }

        [Required]
        public string Production_Company { get; set; }

        [Required]
        public string Director { get; set; }

        [Required]
        public string Cast { get; set; }

        [Required]
        public int Duration { get; set; }

        [Required]
        public string Genre { get; set; }

        [Required]
        public string Rating { get; set; }

        [Required]
        public string Language { get; set; }

        [Required]
        public string Country { get; set; }

        [Required]
        public string Synopsis { get; set; }


        public string Trailer_Link { get; set; }

        public string Status { get; set; }

        public IFormFile posterFile { get; set; }
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
    public class MovieInfoDTO
    {
        public int Movie_ID { get; set; }
        public string Movie_Name { get; set; }
        public int Duration { get; set; }
        public string Rating { get; set; }
        public string Poster_URL { get; set; }
    }


}
