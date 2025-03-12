using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace STP.Repositories
{
    public class ShowtimeRepository : GenericRepository<Showtime>
    {
        public ShowtimeRepository(CinemaDbContext context) : base(context) { }

        // Create
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

        public async Task<List<Showtime>> GetAllAsync()
        {
            return await _context.Showtimes
                .Include(s => s.CinemaRoom)
                .ToListAsync();
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
    }
}