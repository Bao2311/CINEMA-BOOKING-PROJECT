using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class PromotionRepository : GenericRepository<Promotion>
    {
        public PromotionRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(Promotion promotion)
        {
            _context.Promotions.Add(promotion);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<Promotion> GetByIdAsync(int id)
        {
            return await _context.Promotions.FindAsync(id);
        }

        public async Task<List<Promotion>> GetAllAsync()
        {
            return await _context.Promotions.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(Promotion promotion)
        {
            var tracker = _context.Attach(promotion);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var promotion = await GetByIdAsync(id);
            if (promotion == null)
                return false;

            _context.Promotions.Remove(promotion);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
