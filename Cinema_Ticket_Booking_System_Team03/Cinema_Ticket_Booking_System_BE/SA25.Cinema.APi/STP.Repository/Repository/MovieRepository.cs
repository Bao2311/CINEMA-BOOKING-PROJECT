using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu Movie trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản và các phương thức tìm kiếm nâng cao cho entity Movie.
    /// </summary>
    public class MovieRepository : GenericRepository<Movie>
    {
        /// <summary>
        /// Khởi tạo một instance mới của MovieRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public MovieRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Lấy danh sách phim theo tên.
        /// </summary>
        /// <param name="name">Tên phim cần tìm</param>
        /// <returns>Danh sách phim có tên chứa chuỗi tìm kiếm</returns>
        public async Task<List<Movie>> GetByNameAsync(string name)
        {
            return await _context.Movies
                .Where(m => m.Movie_Name.Contains(name))
                .ToListAsync();
        }

        /// <summary>
        /// Lấy danh sách phim theo thể loại.
        /// </summary>
        /// <param name="genre">Thể loại phim cần tìm</param>
        /// <returns>Danh sách phim thuộc thể loại cần tìm</returns>
        public async Task<List<Movie>> GetByGenreAsync(string genre)
        {
            return await _context.Movies
                .Where(m => m.Genre.Contains(genre))
                .ToListAsync();
        }

        /// <summary>
        /// Lấy danh sách phim sắp chiếu.
        /// </summary>
        /// <returns>Danh sách phim sắp chiếu, sắp xếp theo ngày phát hành</returns>
        public async Task<List<Movie>> GetUpcomingMoviesAsync()
        {
            var today = DateTime.Now;
            return await _context.Movies
                .Where(m => m.Status == "Coming Soon" || (m.Release_Date > today))
                .OrderBy(m => m.Release_Date)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy danh sách phim đang chiếu.
        /// </summary>
        /// <returns>Danh sách phim đang chiếu, sắp xếp theo tên phim</returns>
        public async Task<List<Movie>> GetNowShowingMoviesAsync()
        {
            var today = DateTime.Now;
            return await _context.Movies
                .Where(m => m.Status == "Now Showing" && (m.End_Date == null || m.End_Date >= today))
                .OrderBy(m => m.Movie_Name)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy danh sách phim kèm theo đánh giá.
        /// </summary>
        /// <returns>Danh sách phim bao gồm thông tin đánh giá</returns>
        public async Task<List<Movie>> GetMoviesWithRatingsAsync()
        {
            return await _context.Movies
                .Include(m => m.MovieRatings)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một phim bao gồm lịch chiếu, đánh giá và thông tin người tạo.
        /// </summary>
        /// <param name="id">ID của phim cần lấy thông tin</param>
        /// <returns>Thông tin chi tiết của phim</returns>
        public async Task<Movie> GetMovieWithDetailsAsync(int id)
        {
            return await _context.Movies
                .Include(m => m.Showtimes)
                .Include(m => m.MovieRatings)
                .Include(m => m.CreatedBy)
                .FirstOrDefaultAsync(m => m.Movie_ID == id);
        }
        public async Task<bool> RemoveAsyncid(int id)
        {
            var movie = await _context.Movies.FindAsync(id); // Tìm đối tượng movie theo ID
            if (movie == null)
            {
                return false; // Nếu không tìm thấy phim, trả về false
            }

            _context.Movies.Remove(movie); // Xóa đối tượng movie
            await _context.SaveChangesAsync(); // Lưu thay đổi vào cơ sở dữ liệu

            return true; // Trả về true nếu xóa thành công
        }

        /// <summary>
        /// Cập nhật trạng thái của phim.
        /// </summary>
        /// <param name="id">ID của phim cần cập nhật</param>
        /// <param name="status">Trạng thái mới của phim</param>
        /// <returns>true nếu cập nhật thành công, false nếu không tìm thấy phim</returns>
        public async Task<bool> UpdateMovieStatusAsync(int id, string status)
        {
            var movie = await GetByIdAsync(id);
            if (movie == null)
                return false;

            movie.Status = status;
            movie.Updated_At = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Tìm kiếm phim theo nhiều tiêu chí.
        /// </summary>
        /// <param name="term">Từ khóa tìm kiếm (tên phim, nội dung, diễn viên, đạo diễn)</param>
        /// <param name="genre">Thể loại phim</param>
        /// <param name="language">Ngôn ngữ của phim</param>
        /// <returns>Danh sách phim thỏa mãn các tiêu chí tìm kiếm</returns>
        public async Task<List<Movie>> SearchMoviesAsync(string term, string genre = null, string language = null)
        {
            var query = _context.Movies.AsQueryable();

            if (!string.IsNullOrEmpty(term))
            {
                query = query.Where(m => m.Movie_Name.Contains(term) ||
                                          m.Synopsis.Contains(term) ||
                                          m.Cast.Contains(term) ||
                                          m.Director.Contains(term));
            }

            if (!string.IsNullOrEmpty(genre))
            {
                query = query.Where(m => m.Genre.Contains(genre));
            }

            if (!string.IsNullOrEmpty(language))
            {
                query = query.Where(m => m.Language.Contains(language));
            }

            return await query.ToListAsync();
        }

        /// <summary>
        /// Lấy danh sách phim mới nhất.
        /// </summary>
        /// <param name="count">Số lượng phim cần lấy</param>
        /// <returns>Danh sách phim mới nhất theo ngày phát hành</returns>
        public async Task<List<Movie>> GetLatestMoviesAsync(int count = 10)
        {
            return await _context.Movies
                .OrderByDescending(m => m.Release_Date)
                .Take(count)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy tất cả các phim.
        /// </summary>
        /// <returns>Danh sách tất cả các phim</returns>
        public async Task<IEnumerable<Movie>> GetAllMoviesAsync()
        {
            return await _context.Movies.ToListAsync();
        }
    }
}
