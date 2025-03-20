using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repository.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu Showtime (lịch chiếu) trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD và các thao tác đặc biệt cho entity Showtime.
    /// </summary>
    public class ShowtimeRepository
    {
        private readonly CinemaDbContext _context;

        /// <summary>
        /// Khởi tạo một instance mới của ShowtimeRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public ShowtimeRepository(CinemaDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy tất cả các lịch chiếu kèm thông tin phim và phòng chiếu.
        /// </summary>
        /// <returns>Danh sách tất cả các lịch chiếu</returns>
        public async Task<IEnumerable<Showtime>> GetAllAsync()
        {
            return await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy lịch chiếu theo trạng thái cụ thể.
        /// </summary>
        /// <param name="status">Trạng thái của lịch chiếu cần lấy</param>
        /// <returns>Danh sách lịch chiếu có trạng thái tương ứng</returns>
        public async Task<IEnumerable<Showtime>> GetAllByStatusAsync(string status)
        {
            return await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Where(s => s.Status == status)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy tất cả lịch chiếu đang hoạt động (không bị ẩn hoặc xóa).
        /// </summary>
        /// <returns>Danh sách lịch chiếu đang hoạt động</returns>
        public async Task<IEnumerable<Showtime>> GetAllActiveAsync()
        {
            return await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Where(s => s.Status != "Hidden" && s.Status != "Deleted")
                .ToListAsync();
        }

        /// <summary>
        /// Tạo mới một lịch chiếu trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="showtime">Đối tượng Showtime cần thêm vào cơ sở dữ liệu</param>
        /// <returns>ID của lịch chiếu vừa được tạo</returns>
        public async Task<int> CreateAsync(Showtime showtime)
        {
            _context.Showtimes.Add(showtime);
            await _context.SaveChangesAsync();
            return showtime.Showtime_ID;
        }

        /// <summary>
        /// Lấy một lịch chiếu theo ID kèm thông tin phòng chiếu.
        /// </summary>
        /// <param name="id">ID của lịch chiếu cần lấy</param>
        /// <returns>Đối tượng Showtime nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<Showtime> GetByIdAsync(int id)
        {
            return await _context.Showtimes
                .Include(s => s.CinemaRoom)
                .FirstOrDefaultAsync(s => s.Showtime_ID == id);
        }

        /// <summary>
        /// Lấy danh sách lịch chiếu theo điều kiện cụ thể.
        /// </summary>
        /// <param name="predicate">Biểu thức điều kiện để lọc lịch chiếu</param>
        /// <returns>Danh sách lịch chiếu thỏa mãn điều kiện</returns>
        public async Task<List<Showtime>> GetAsync(Expression<Func<Showtime, bool>> predicate)
        {
            return await _context.Showtimes
                .Include(s => s.CinemaRoom)
                .Where(predicate)
                .ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một lịch chiếu.
        /// </summary>
        /// <param name="showtime">Đối tượng Showtime với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(Showtime showtime)
        {
            var tracker = _context.Attach(showtime);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một lịch chiếu theo ID.
        /// </summary>
        /// <param name="id">ID của lịch chiếu cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy lịch chiếu</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var showtime = await GetByIdAsync(id);
            if (showtime == null)
                return false;

            _context.Showtimes.Remove(showtime);
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Cập nhật thông tin của một lịch chiếu theo ID, giữ nguyên một số trường.
        /// </summary>
        /// <param name="id">ID của lịch chiếu cần cập nhật</param>
        /// <param name="showtime">Đối tượng Showtime với thông tin đã được cập nhật</param>
        /// <returns>true nếu cập nhật thành công, false nếu không tìm thấy lịch chiếu hoặc có lỗi</returns>
        public async Task<bool> UpdateAsync(int id, Showtime showtime)
        {
            try
            {
                var existingShowtime = await _context.Showtimes.FindAsync(id);
                if (existingShowtime == null)
                    return false;

                // Giữ nguyên các trường không được cập nhật
                showtime.Showtime_ID = id;
                showtime.Created_At = existingShowtime.Created_At;
                showtime.Created_By = existingShowtime.Created_By;
                showtime.Updated_At = DateTime.Now;

                _context.Entry(existingShowtime).CurrentValues.SetValues(showtime);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Cập nhật trạng thái của một lịch chiếu.
        /// </summary>
        /// <param name="id">ID của lịch chiếu cần cập nhật</param>
        /// <param name="status">Trạng thái mới</param>
        /// <param name="updatedBy">ID của người dùng thực hiện cập nhật</param>
        /// <returns>true nếu cập nhật thành công, false nếu không tìm thấy lịch chiếu hoặc có lỗi</returns>
        public async Task<bool> UpdateStatusAsync(int id, string status, int updatedBy)
        {
            try
            {
                var showtime = await _context.Showtimes.FindAsync(id);
                if (showtime == null)
                    return false;

                showtime.Status = status;
                showtime.Updated_At = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Xóa hoàn toàn một lịch chiếu và các dữ liệu liên quan.
        /// </summary>
        /// <param name="id">ID của lịch chiếu cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy lịch chiếu hoặc có lỗi</returns>
        public async Task<bool> DeleteAsync(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var showtime = await _context.Showtimes.FindAsync(id);
                if (showtime == null)
                    return false;

                // Lấy danh sách ID đơn đặt vé (không đọc toàn bộ đối tượng)
                var bookingIds = await _context.TicketBookings
                    .AsNoTracking()
                    .Where(tb => tb.Showtime_ID == id)
                    .Select(tb => tb.Booking_ID)
                    .ToListAsync();

                // Thực hiện xóa theo thứ tự từ dưới lên
                foreach (var bookingId in bookingIds)
                {
                    // 1. Xóa Payments
                    await _context.Database.ExecuteSqlRawAsync(
                        "DELETE FROM Payments WHERE Booking_ID = {0}", bookingId);

                    // 2. Xóa PromotionUsages
                    await _context.Database.ExecuteSqlRawAsync(
                        "DELETE FROM Promotion_Usage WHERE Booking_ID = {0}", bookingId);

                    // 3. Xóa BookingHistories
                    await _context.Database.ExecuteSqlRawAsync(
                        "DELETE FROM Booking_History WHERE Booking_ID = {0}", bookingId);

                    // 4. Xóa Tickets
                    await _context.Database.ExecuteSqlRawAsync(
                        "DELETE FROM Tickets WHERE Booking_ID = {0}", bookingId);
                }

                // 5. Xóa TicketBookings
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM Ticket_Bookings WHERE Showtime_ID = {0}", id);

                // 6. Xóa Seats
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM Seats WHERE Showtime_ID = {0}", id);

                // 7. Xóa Showtime
                _context.Showtimes.Remove(showtime);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                // Log exception
                return false;
            }
        }

        /// <summary>
        /// Thực hiện "xóa mềm" một lịch chiếu bằng cách thay đổi trạng thái.
        /// </summary>
        /// <param name="id">ID của lịch chiếu cần xóa mềm</param>
        /// <param name="updatedBy">ID của người dùng thực hiện xóa</param>
        /// <returns>true nếu xóa mềm thành công, false nếu không tìm thấy lịch chiếu hoặc có lỗi</returns>
        public async Task<bool> SoftDeleteAsync(int id, int updatedBy)
        {
            try
            {
                var showtime = await _context.Showtimes.FindAsync(id);
                if (showtime == null)
                    return false;

                // Thay đổi trạng thái thành "Hidden"
                showtime.Status = "Hidden";
                showtime.Updated_At = DateTime.Now;

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Kiểm tra xem lịch chiếu đã có vé được đặt chưa.
        /// </summary>
        /// <param name="showtimeId">ID của lịch chiếu cần kiểm tra</param>
        /// <returns>true nếu lịch chiếu đã có vé được đặt, false nếu chưa</returns>
        public async Task<bool> HasBookingsAsync(int showtimeId)
        {
            return await _context.TicketBookings
                .AnyAsync(tb => tb.Showtime_ID == showtimeId);
        }
    }
}
