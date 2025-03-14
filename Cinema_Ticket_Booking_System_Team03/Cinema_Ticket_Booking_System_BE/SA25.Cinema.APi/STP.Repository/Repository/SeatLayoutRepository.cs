using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu SeatLayout trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity SeatLayout.
    /// </summary>
    public class SeatLayoutRepository : GenericRepository<SeatLayout>
    {
        /// <summary>
        /// Khởi tạo một instance mới của SeatLayoutRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public SeatLayoutRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một bố cục ghế ngồi trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="seatLayout">Đối tượng SeatLayout cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(SeatLayout seatLayout)
        {
            _context.SeatLayouts.Add(seatLayout);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một bố cục ghế ngồi theo ID.
        /// </summary>
        /// <param name="id">ID của bố cục ghế ngồi cần lấy</param>
        /// <returns>Đối tượng SeatLayout nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<SeatLayout> GetByIdAsync(int id)
        {
            return await _context.SeatLayouts.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các bố cục ghế ngồi.
        /// </summary>
        /// <returns>Danh sách tất cả các bố cục ghế ngồi</returns>
        public async Task<List<SeatLayout>> GetAllAsync()
        {
            return await _context.SeatLayouts.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một bố cục ghế ngồi.
        /// </summary>
        /// <param name="seatLayout">Đối tượng SeatLayout với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(SeatLayout seatLayout)
        {
            var tracker = _context.Attach(seatLayout);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một bố cục ghế ngồi theo ID.
        /// </summary>
        /// <param name="id">ID của bố cục ghế ngồi cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy bố cục ghế ngồi</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var seatLayout = await GetByIdAsync(id);
            if (seatLayout == null)
                return false;

            _context.SeatLayouts.Remove(seatLayout);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
