using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu MovieRating trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity MovieRating.
    /// </summary>
    public class MovieRatingRepository : GenericRepository<MovieRating>
    {
        /// <summary>
        /// Khởi tạo một instance mới của MovieRatingRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public MovieRatingRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một đánh giá phim trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="movieRating">Đối tượng MovieRating cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(MovieRating movieRating)
        {
            _context.MovieRatings.Add(movieRating);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một đánh giá phim theo ID.
        /// </summary>
        /// <param name="id">ID của đánh giá phim cần lấy</param>
        /// <returns>Đối tượng MovieRating nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<MovieRating> GetByIdAsync(int id)
        {
            return await _context.MovieRatings.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các đánh giá phim.
        /// </summary>
        /// <returns>Danh sách tất cả các đánh giá phim</returns>
        public async Task<List<MovieRating>> GetAllAsync()
        {
            return await _context.MovieRatings.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một đánh giá phim.
        /// </summary>
        /// <param name="movieRating">Đối tượng MovieRating với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(MovieRating movieRating)
        {
            var tracker = _context.Attach(movieRating);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một đánh giá phim theo ID.
        /// </summary>
        /// <param name="id">ID của đánh giá phim cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy đánh giá phim</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var movieRating = await GetByIdAsync(id);
            if (movieRating == null)
                return false;

            _context.MovieRatings.Remove(movieRating);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
