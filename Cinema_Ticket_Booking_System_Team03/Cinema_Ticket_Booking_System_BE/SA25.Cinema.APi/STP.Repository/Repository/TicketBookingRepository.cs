using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class TicketBookingRepository : GenericRepository<TicketBooking>
    {
        public TicketBookingRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(TicketBooking ticketBooking)
        {
            _context.TicketBookings.Add(ticketBooking);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<TicketBooking> GetByIdAsync(int id)
        {
            return await _context.TicketBookings.FindAsync(id);
        }

        public async Task<List<TicketBooking>> GetAllAsync()
        {
            return await _context.TicketBookings.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(TicketBooking ticketBooking)
        {
            var tracker = _context.Attach(ticketBooking);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var ticketBooking = await GetByIdAsync(id);
            if (ticketBooking == null)
                return false;

            _context.TicketBookings.Remove(ticketBooking);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
