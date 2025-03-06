using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class BookingHistoryRepository : GenericRepository<BookingHistory>
    {
        public BookingHistoryRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(BookingHistory bookingHistory)
        {
            _context.BookingHistories.Add(bookingHistory);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<BookingHistory> GetByIdAsync(int id)
        {
            return await _context.BookingHistories.FindAsync(id);
        }

        public async Task<List<BookingHistory>> GetAllAsync()
        {
            return await _context.BookingHistories.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(BookingHistory bookingHistory)
        {
            var tracker = _context.Attach(bookingHistory);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
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
