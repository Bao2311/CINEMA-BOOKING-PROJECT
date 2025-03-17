using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu Score trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity Score.
    /// </summary>
    public class ScoreRepository : GenericRepository<Score>
    {
        /// <summary>
        /// Khởi tạo một instance mới của ScoreRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public ScoreRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một điểm số trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="score">Đối tượng Score cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(Score score)
        {
            _context.Scores.Add(score);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một điểm số theo ID.
        /// </summary>
        /// <param name="id">ID của điểm số cần lấy</param>
        /// <returns>Đối tượng Score nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<Score> GetByIdAsync(int id)
        {
            return await _context.Scores.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các điểm số.
        /// </summary>
        /// <returns>Danh sách tất cả các điểm số</returns>
        public async Task<List<Score>> GetAllAsync()
        {
            return await _context.Scores.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một điểm số.
        /// </summary>
        /// <param name="score">Đối tượng Score với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(Score score)
        {
            var tracker = _context.Attach(score);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một điểm số theo ID.
        /// </summary>
        /// <param name="id">ID của điểm số cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy điểm số</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var score = await GetByIdAsync(id);
            if (score == null)
                return false;

            _context.Scores.Remove(score);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
