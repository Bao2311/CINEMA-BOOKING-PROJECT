using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu PointsRedemption trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity PointsRedemption.
    /// </summary>
    public class PointsRedemptionRepository : GenericRepository<PointsRedemption>
    {
        /// <summary>
        /// Khởi tạo một instance mới của PointsRedemptionRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public PointsRedemptionRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một bản ghi đổi điểm trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="pointsRedemption">Đối tượng PointsRedemption cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(PointsRedemption pointsRedemption)
        {
            _context.PointsRedemptions.Add(pointsRedemption);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một bản ghi đổi điểm theo ID.
        /// </summary>
        /// <param name="id">ID của bản ghi đổi điểm cần lấy</param>
        /// <returns>Đối tượng PointsRedemption nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<PointsRedemption> GetByIdAsync(int id)
        {
            return await _context.PointsRedemptions.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các bản ghi đổi điểm.
        /// </summary>
        /// <returns>Danh sách tất cả các bản ghi đổi điểm</returns>
        public async Task<List<PointsRedemption>> GetAllAsync()
        {
            return await _context.PointsRedemptions.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một bản ghi đổi điểm.
        /// </summary>
        /// <param name="pointsRedemption">Đối tượng PointsRedemption với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(PointsRedemption pointsRedemption)
        {
            var tracker = _context.Attach(pointsRedemption);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một bản ghi đổi điểm theo ID.
        /// </summary>
        /// <param name="id">ID của bản ghi đổi điểm cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy bản ghi đổi điểm</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var pointsRedemption = await GetByIdAsync(id);
            if (pointsRedemption == null)
                return false;

            _context.PointsRedemptions.Remove(pointsRedemption);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
