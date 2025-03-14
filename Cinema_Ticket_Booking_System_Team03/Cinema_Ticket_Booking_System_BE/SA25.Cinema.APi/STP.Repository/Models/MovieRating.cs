using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace STP.Repository.Models
{
    /// <summary>
    /// Đại diện cho đánh giá của người dùng về một bộ phim.
    /// Lưu trữ thông tin về điểm đánh giá, bình luận và thời gian đánh giá.
    /// </summary>
    [Table("Movie_Ratings")]
    public class MovieRating
    {
        /// <summary>
        /// ID duy nhất của đánh giá
        /// </summary>
        [Key]
        public int Rating_ID { get; set; }

        /// <summary>
        /// ID của bộ phim được đánh giá
        /// </summary>
        public int Movie_ID { get; set; }

        /// <summary>
        /// ID của người dùng thực hiện đánh giá
        /// </summary>
        public int User_ID { get; set; }

        /// <summary>
        /// Điểm đánh giá của người dùng cho bộ phim
        /// Giá trị từ 1 đến 5 (1 là thấp nhất, 5 là cao nhất)
        /// </summary>
        [Range(1, 5)]
        public int Rating { get; set; }

        /// <summary>
        /// Bình luận của người dùng về bộ phim
        /// </summary>
        public string Comment { get; set; }

        /// <summary>
        /// Thời điểm người dùng thực hiện đánh giá
        /// </summary>
        public DateTime Rating_Date { get; set; }

        /// <summary>
        /// Chỉ ra liệu đánh giá đã được xác minh hay chưa
        /// Có thể được sử dụng để xác nhận rằng người dùng đã thực sự xem phim
        /// </summary>
        public bool Is_Verified { get; set; } = false;

        /// <summary>
        /// Bộ phim được đánh giá
        /// </summary>
        [ForeignKey("Movie_ID")]
        public virtual Movie Movie { get; set; }

        /// <summary>
        /// Người dùng thực hiện đánh giá
        /// </summary>
        [ForeignKey("User_ID")]
        public virtual User User { get; set; }
    }
}
