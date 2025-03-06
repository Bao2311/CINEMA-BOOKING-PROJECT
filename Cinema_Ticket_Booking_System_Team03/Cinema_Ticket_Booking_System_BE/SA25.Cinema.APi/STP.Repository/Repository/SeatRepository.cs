using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class SeatRepository : GenericRepository<Seat>
    {
        public SeatRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(Seat seat)
        {
            _context.Seats.Add(seat);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<Seat> GetByIdAsync(int id)
        {
            return await _context.Seats.FindAsync(id);
        }

        public async Task<List<Seat>> GetAllAsync()
        {
            return await _context.Seats.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(Seat seat)
        {
            var tracker = _context.Attach(seat);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
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
