using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu TicketBooking (đặt vé) trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity TicketBooking.
    /// </summary>
    public class TicketBookingRepository : GenericRepository<TicketBooking>
    {
        /// <summary>
        /// Khởi tạo một instance mới của TicketBookingRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public TicketBookingRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một đơn đặt vé trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="ticketBooking">Đối tượng TicketBooking cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(TicketBooking ticketBooking)
        {
            _context.TicketBookings.Add(ticketBooking);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một đơn đặt vé theo ID.
        /// </summary>
        /// <param name="id">ID của đơn đặt vé cần lấy</param>
        /// <returns>Đối tượng TicketBooking nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<TicketBooking> GetByIdAsync(int id)
        {
            return await _context.TicketBookings.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các đơn đặt vé.
        /// </summary>
        /// <returns>Danh sách tất cả các đơn đặt vé</returns>
        public async Task<List<TicketBooking>> GetAllAsync()
        {
            return await _context.TicketBookings.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một đơn đặt vé.
        /// </summary>
        /// <param name="ticketBooking">Đối tượng TicketBooking với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(TicketBooking ticketBooking)
        {
            var tracker = _context.Attach(ticketBooking);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một đơn đặt vé theo ID.
        /// </summary>
        /// <param name="id">ID của đơn đặt vé cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy đơn đặt vé</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var ticketBooking = await GetByIdAsync(id);
            if (ticketBooking == null)
                return false;

            _context.TicketBookings.Remove(ticketBooking);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
