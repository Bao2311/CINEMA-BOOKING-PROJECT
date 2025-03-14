using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho một bộ phim trong hệ thống rạp chiếu phim.
    /// Chứa thông tin chi tiết về bộ phim, bao gồm tên, ngày phát hành, đạo diễn,
    /// diễn viên, thời lượng, thể loại, và các thông tin khác.
    /// </summary>
    [Table("Movies")]
    public class Movie
    {
        /// <summary>
        /// ID duy nhất của bộ phim
        /// </summary>
        [Key]
        public int Movie_ID { get; set; }

        /// <summary>
        /// Tên của bộ phim
        /// </summary>
        public string Movie_Name { get; set; }

        /// <summary>
        /// Ngày phát hành của bộ phim
        /// </summary>
        public DateTime Release_Date { get; set; }

        /// <summary>
        /// Ngày kết thúc chiếu phim (có thể null nếu chưa xác định)
        /// </summary>
        public DateTime? End_Date { get; set; }

        /// <summary>
        /// Công ty sản xuất phim
        /// </summary>
        public string Production_Company { get; set; }

        /// <summary>
        /// Đạo diễn của bộ phim
        /// </summary>
        public string Director { get; set; }

        /// <summary>
        /// Danh sách diễn viên chính của bộ phim
        /// </summary>
        public string Cast { get; set; }

        /// <summary>
        /// Thời lượng của phim tính bằng phút
        /// </summary>
        public int Duration { get; set; }

        /// <summary>
        /// Thể loại của bộ phim (có thể chứa nhiều thể loại phân cách bằng dấu phẩy)
        /// </summary>
           public string Genre { get; set; }

        /// <summary>
        /// Xếp hạng độ tuổi của phim (ví dụ: "G", "PG", "PG-13", "R", "NC-17")
        /// </summary>
        public string Rating { get; set; }

        /// <summary>
        /// Ngôn ngữ chính của bộ phim
        /// </summary>
        public string Language { get; set; }

        /// <summary>
        /// Quốc gia sản xuất phim
        /// </summary>
        public string Country { get; set; }

        /// <summary>
        /// Tóm tắt nội dung của bộ phim
        /// </summary>
        public string Synopsis { get; set; }

        /// <summary>
        /// URL đến hình ảnh poster của phim
        /// </summary>
        public string Poster_URL { get; set; }

        /// <summary>
        /// Liên kết đến trailer của phim
        /// </summary>
        public string Trailer_Link { get; set; }

        /// <summary>
        /// Trạng thái hiện tại của phim
        /// Giá trị mặc định là "Coming Soon"
        /// Các giá trị khác có thể là: "Now Showing", "Ended", "Cancelled"
        /// </summary>
        public string Status { get; set; } = "Coming Soon";

        /// <summary>
        /// ID của người dùng đã tạo bản ghi phim này
        /// </summary>
        public int Created_By { get; set; }

        /// <summary>
        /// Thời điểm bản ghi phim được tạo
        /// </summary>
        public DateTime Created_At { get; set; } = DateTime.Now;

        /// <summary>
        /// Thời điểm bản ghi phim được cập nhật lần cuối
        /// </summary>
        public DateTime Updated_At { get; set; }

        /// <summary>
        /// Người dùng đã tạo bản ghi phim này
        /// </summary>
        [ForeignKey("Created_By")]
        public virtual User CreatedBy { get; set; }

        /// <summary>
        /// Danh sách các suất chiếu của bộ phim này
        /// </summary>
        [InverseProperty("Movie")]
        public virtual ICollection<Showtime> Showtimes { get; set; }

        /// <summary>
        /// Danh sách các đánh giá của người dùng về bộ phim này
        /// </summary>
        [InverseProperty("Movie")]
        public virtual ICollection<MovieRating> MovieRatings { get; set; }
    }
}
