using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class TicketRepository : GenericRepository<Ticket>
    {
        public TicketRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(Ticket ticket)
        {
            _context.Tickets.Add(ticket);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<Ticket> GetByIdAsync(int id)
        {
            return await _context.Tickets.FindAsync(id);
        }

        public async Task<List<Ticket>> GetAllAsync()
        {
            return await _context.Tickets.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(Ticket ticket)
        {
            var tracker = _context.Attach(ticket);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var ticket = await GetByIdAsync(id);
            if (ticket == null)
                return false;

            _context.Tickets.Remove(ticket);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
