using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class PointsRedemptionRepository : GenericRepository<PointsRedemption>
    {
        public PointsRedemptionRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(PointsRedemption pointsRedemption)
        {
            _context.PointsRedemptions.Add(pointsRedemption);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<PointsRedemption> GetByIdAsync(int id)
        {
            return await _context.PointsRedemptions.FindAsync(id);
        }

        public async Task<List<PointsRedemption>> GetAllAsync()
        {
            return await _context.PointsRedemptions.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(PointsRedemption pointsRedemption)
        {
            var tracker = _context.Attach(pointsRedemption);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var pointsRedemption = await GetByIdAsync(id);
            if (pointsRedemption == null)
                return false;

            _context.PointsRedemptions.Remove(pointsRedemption);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
