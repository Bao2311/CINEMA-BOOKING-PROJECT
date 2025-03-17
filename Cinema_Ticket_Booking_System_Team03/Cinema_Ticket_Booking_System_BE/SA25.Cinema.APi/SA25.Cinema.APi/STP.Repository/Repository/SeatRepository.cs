using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu Seat trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity Seat.
    /// </summary>
    public class SeatRepository : GenericRepository<Seat>
    {
        /// <summary>
        /// Khởi tạo một instance mới của SeatRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public SeatRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một ghế ngồi trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="seat">Đối tượng Seat cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(Seat seat)
        {
            _context.Seats.Add(seat);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một ghế ngồi theo ID.
        /// </summary>
        /// <param name="id">ID của ghế ngồi cần lấy</param>
        /// <returns>Đối tượng Seat nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<Seat> GetByIdAsync(int id)
        {
            return await _context.Seats.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các ghế ngồi.
        /// </summary>
        /// <returns>Danh sách tất cả các ghế ngồi</returns>
        public async Task<List<Seat>> GetAllAsync()
        {
            return await _context.Seats.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một ghế ngồi.
        /// </summary>
        /// <param name="seat">Đối tượng Seat với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(Seat seat)
        {
            var tracker = _context.Attach(seat);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một ghế ngồi theo ID.
        /// </summary>
        /// <param name="id">ID của ghế ngồi cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy ghế ngồi</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var seat = await GetByIdAsync(id);
            if (seat == null)
                return false;

            _context.Seats.Remove(seat);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
