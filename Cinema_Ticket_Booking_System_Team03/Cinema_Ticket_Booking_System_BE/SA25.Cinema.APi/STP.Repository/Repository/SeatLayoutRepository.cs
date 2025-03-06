using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class SeatLayoutRepository : GenericRepository<SeatLayout>
    {
        public SeatLayoutRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(SeatLayout seatLayout)
        {
            _context.SeatLayouts.Add(seatLayout);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<SeatLayout> GetByIdAsync(int id)
        {
            return await _context.SeatLayouts.FindAsync(id);
        }

        public async Task<List<SeatLayout>> GetAllAsync()
        {
            return await _context.SeatLayouts.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(SeatLayout seatLayout)
        {
            var tracker = _context.Attach(seatLayout);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
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
