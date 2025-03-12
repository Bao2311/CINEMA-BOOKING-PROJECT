using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class CinemaRoomRepository : GenericRepository<CinemaRoom>
    {
        public CinemaRoomRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(CinemaRoom cinemaRoom)
        {
            _context.CinemaRooms.Add(cinemaRoom);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<CinemaRoom> GetByIdAsync(int id)
        {
            return await _context.CinemaRooms.FindAsync(id);
        }

        public async Task<List<CinemaRoom>> GetAllAsync()
        {
            return await _context.CinemaRooms.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(CinemaRoom cinemaRoom)
        {
            var tracker = _context.Attach(cinemaRoom);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }
    }
}

// Delete

