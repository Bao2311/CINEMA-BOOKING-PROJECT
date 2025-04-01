using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu BookingHistory trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity BookingHistory.
    /// </summary>
    public class BookingHistoryRepository : GenericRepository<BookingHistory>
    {
        /// <summary>
        /// Khởi tạo một instance mới của BookingHistoryRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public BookingHistoryRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một bản ghi lịch sử đặt vé trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="bookingHistory">Đối tượng BookingHistory cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(BookingHistory bookingHistory)
        {
            _context.BookingHistories.Add(bookingHistory);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một bản ghi lịch sử đặt vé theo ID.
        /// </summary>
        /// <param name="id">ID của bản ghi lịch sử đặt vé cần lấy</param>
        /// <returns>Đối tượng BookingHistory nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<BookingHistory> GetByIdAsync(int id)
        {
            return await _context.BookingHistories.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các bản ghi lịch sử đặt vé.
        /// </summary>
        /// <returns>Danh sách tất cả các bản ghi lịch sử đặt vé</returns>
        public async Task<List<BookingHistory>> GetAllAsync()
        {
            return await _context.BookingHistories.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một bản ghi lịch sử đặt vé.
        /// </summary>
        /// <param name="bookingHistory">Đối tượng BookingHistory với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(BookingHistory bookingHistory)
        {
            var tracker = _context.Attach(bookingHistory);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một bản ghi lịch sử đặt vé theo ID.
        /// </summary>
        /// <param name="id">ID của bản ghi lịch sử đặt vé cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy bản ghi</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var bookingHistory = await GetByIdAsync(id);
            if (bookingHistory == null)
                return false;

            _context.BookingHistories.Remove(bookingHistory);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
