using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu Promotion trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity Promotion.
    /// </summary>
    public class PromotionRepository : GenericRepository<Promotion>
    {
        /// <summary>
        /// Khởi tạo một instance mới của PromotionRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public PromotionRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một khuyến mãi trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="promotion">Đối tượng Promotion cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(Promotion promotion)
        {
            _context.Promotions.Add(promotion);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một khuyến mãi theo ID.
        /// </summary>
        /// <param name="id">ID của khuyến mãi cần lấy</param>
        /// <returns>Đối tượng Promotion nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<Promotion> GetByIdAsync(int id)
        {
            return await _context.Promotions.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các khuyến mãi.
        /// </summary>
        /// <returns>Danh sách tất cả các khuyến mãi</returns>
        public async Task<List<Promotion>> GetAllAsync()
        {
            return await _context.Promotions.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một khuyến mãi.
        /// </summary>
        /// <param name="promotion">Đối tượng Promotion với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(Promotion promotion)
        {
            var tracker = _context.Attach(promotion);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một khuyến mãi theo ID.
        /// </summary>
        /// <param name="id">ID của khuyến mãi cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy khuyến mãi</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var promotion = await GetByIdAsync(id);
            if (promotion == null)
                return false;

            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
