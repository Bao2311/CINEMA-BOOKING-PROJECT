using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Linq.Expressions;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using STP.Repository.Data;
namespace STP.Repository.Repositories
{
    public class ShowtimeRepository
    {
        private readonly CinemaDbContext _context;

        public ShowtimeRepository(CinemaDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Showtime>> GetAllAsync()
        {
            return await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .ToListAsync();
        }

        // Thêm phương thức mới để lấy lịch chiếu theo trạng thái
        public async Task<IEnumerable<Showtime>> GetAllByStatusAsync(string status)
        {
            return await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Where(s => s.Status == status)
                .ToListAsync();
        }

        // Phương thức lấy tất cả lịch chiếu có trạng thái khác Hidden/Deleted
        public async Task<IEnumerable<Showtime>> GetAllActiveAsync()
        {
            return await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Where(s => s.Status != "Hidden" && s.Status != "Deleted")
                .ToListAsync();
        }
   
        public async Task<int> CreateAsync(Showtime showtime)
        {
            _context.Showtimes.Add(showtime);
            await _context.SaveChangesAsync();
            return showtime.Showtime_ID;
        }

        // Read
        public async Task<Showtime> GetByIdAsync(int id)
        {
            return await _context.Showtimes
                .Include(s => s.CinemaRoom)
                .FirstOrDefaultAsync(s => s.Showtime_ID == id);
        }

        // Get by condition
        public async Task<List<Showtime>> GetAsync(Expression<Func<Showtime, bool>> predicate)
        {
            return await _context.Showtimes
                .Include(s => s.CinemaRoom)
                .Where(predicate)
                .ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(Showtime showtime)
        {
            var tracker = _context.Attach(showtime);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var showtime = await GetByIdAsync(id);
            if (showtime == null)
                return false;

            _context.Showtimes.Remove(showtime);
            await _context.SaveChangesAsync();
            return true;
        }

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

        // Thêm phương thức cập nhật trạng thái
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

        // Giữ nguyên phương thức DeleteAsync hiện tại cho trường hợp cần xóa hoàn toàn
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

        // Thêm phương thức "soft delete" - thay đổi trạng thái thay vì xóa
        public async Task<bool> SoftDeleteAsync(int id, int updatedBy)
        {
            try
            {
                var showtime = await _context.Showtimes.FindAsync(id);
                if (showtime == null)
                    return false;

                // Thay đổi trạng thái thành "Deleted" hoặc "Hidden"
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

        // Kiểm tra xem lịch chiếu đã có vé được đặt chưa
        public async Task<bool> HasBookingsAsync(int showtimeId)
        {
            return await _context.TicketBookings
                .AnyAsync(tb => tb.Showtime_ID == showtimeId);
        }
    }
}
