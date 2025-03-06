using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class PaymentRepository : GenericRepository<Payment>
    {
        public PaymentRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<Payment> GetByIdAsync(int id)
        {
            return await _context.Payments.FindAsync(id);
        }

        public async Task<List<Payment>> GetAllAsync()
        {
            return await _context.Payments.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(Payment payment)
        {
            var tracker = _context.Attach(payment);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var payment = await GetByIdAsync(id);
            if (payment == null)
                return false;

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
