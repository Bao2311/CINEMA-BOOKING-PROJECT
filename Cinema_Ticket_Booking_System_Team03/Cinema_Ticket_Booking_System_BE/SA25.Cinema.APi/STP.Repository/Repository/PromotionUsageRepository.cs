using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class PromotionUsageRepository : GenericRepository<PromotionUsage>
    {
        public PromotionUsageRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(PromotionUsage promotionUsage)
        {
            _context.PromotionUsages.Add(promotionUsage);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<PromotionUsage> GetByIdAsync(int id)
        {
            return await _context.PromotionUsages.FindAsync(id);
        }

        public async Task<List<PromotionUsage>> GetAllAsync()
        {
            return await _context.PromotionUsages.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(PromotionUsage promotionUsage)
        {
            var tracker = _context.Attach(promotionUsage);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var promotionUsage = await GetByIdAsync(id);
            if (promotionUsage == null)
                return false;

            _context.PromotionUsages.Remove(promotionUsage);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
