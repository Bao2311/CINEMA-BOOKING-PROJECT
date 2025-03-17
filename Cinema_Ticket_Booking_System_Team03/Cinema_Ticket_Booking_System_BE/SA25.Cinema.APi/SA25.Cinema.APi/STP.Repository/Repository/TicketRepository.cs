using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu Ticket (vé) trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity Ticket.
    /// </summary>
    public class TicketRepository : GenericRepository<Ticket>
    {
        /// <summary>
        /// Khởi tạo một instance mới của TicketRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public TicketRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một vé trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="ticket">Đối tượng Ticket cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(Ticket ticket)
        {
            _context.Tickets.Add(ticket);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một vé theo ID.
        /// </summary>
        /// <param name="id">ID của vé cần lấy</param>
        /// <returns>Đối tượng Ticket nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<Ticket> GetByIdAsync(int id)
        {
            return await _context.Tickets.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các vé.
        /// </summary>
        /// <returns>Danh sách tất cả các vé</returns>
        public async Task<List<Ticket>> GetAllAsync()
        {
            return await _context.Tickets.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một vé.
        /// </summary>
        /// <param name="ticket">Đối tượng Ticket với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(Ticket ticket)
        {
            var tracker = _context.Attach(ticket);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một vé theo ID.
        /// </summary>
        /// <param name="id">ID của vé cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy vé</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var ticket = await GetByIdAsync(id);
            if (ticket == null)
                return false;

            _context.Tickets.Remove(ticket);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
