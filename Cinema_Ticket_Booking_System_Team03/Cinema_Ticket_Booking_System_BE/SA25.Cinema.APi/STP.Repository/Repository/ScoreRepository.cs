using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class ScoreRepository : GenericRepository<Score>
    {
        public ScoreRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(Score score)
        {
            _context.Scores.Add(score);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<Score> GetByIdAsync(int id)
        {
            return await _context.Scores.FindAsync(id);
        }

        public async Task<List<Score>> GetAllAsync()
        {
            return await _context.Scores.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(Score score)
        {
            var tracker = _context.Attach(score);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var score = await GetByIdAsync(id);
            if (score == null)
                return false;

            _context.Scores.Remove(score);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
