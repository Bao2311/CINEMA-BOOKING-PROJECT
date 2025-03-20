using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu PromotionUsage trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity PromotionUsage.
    /// </summary>
    public class PromotionUsageRepository : GenericRepository<PromotionUsage>
    {
        /// <summary>
        /// Khởi tạo một instance mới của PromotionUsageRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public PromotionUsageRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một bản ghi sử dụng khuyến mãi trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="promotionUsage">Đối tượng PromotionUsage cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(PromotionUsage promotionUsage)
        {
            _context.PromotionUsages.Add(promotionUsage);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một bản ghi sử dụng khuyến mãi theo ID.
        /// </summary>
        /// <param name="id">ID của bản ghi sử dụng khuyến mãi cần lấy</param>
        /// <returns>Đối tượng PromotionUsage nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<PromotionUsage> GetByIdAsync(int id)
        {
            return await _context.PromotionUsages.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các bản ghi sử dụng khuyến mãi.
        /// </summary>
        /// <returns>Danh sách tất cả các bản ghi sử dụng khuyến mãi</returns>
        public async Task<List<PromotionUsage>> GetAllAsync()
        {
            return await _context.PromotionUsages.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một bản ghi sử dụng khuyến mãi.
        /// </summary>
        /// <param name="promotionUsage">Đối tượng PromotionUsage với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(PromotionUsage promotionUsage)
        {
            var tracker = _context.Attach(promotionUsage);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một bản ghi sử dụng khuyến mãi theo ID.
        /// </summary>
        /// <param name="id">ID của bản ghi sử dụng khuyến mãi cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy bản ghi sử dụng khuyến mãi</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var promotionUsage = await GetByIdAsync(id);
            if (promotionUsage == null)
                return false;

            _context.PromotionUsages.Remove(promotionUsage);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
