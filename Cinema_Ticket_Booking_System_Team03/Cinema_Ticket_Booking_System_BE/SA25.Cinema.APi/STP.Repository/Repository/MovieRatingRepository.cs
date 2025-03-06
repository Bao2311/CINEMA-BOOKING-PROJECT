using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    public class MovieRatingRepository : GenericRepository<MovieRating>
    {
        public MovieRatingRepository(CinemaDbContext context) : base(context) { }

        // Create
        public async Task<int> CreateAsync(MovieRating movieRating)
        {
            _context.MovieRatings.Add(movieRating);
            return await _context.SaveChangesAsync();
        }

        // Read
        public async Task<MovieRating> GetByIdAsync(int id)
        {
            return await _context.MovieRatings.FindAsync(id);
        }

        public async Task<List<MovieRating>> GetAllAsync()
        {
            return await _context.MovieRatings.ToListAsync();
        }

        // Update
        public async Task<int> UpdateAsync(MovieRating movieRating)
        {
            var tracker = _context.Attach(movieRating);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        // Delete
        public async Task<bool> RemoveAsync(int id)
        {
            var movieRating = await GetByIdAsync(id);
            if (movieRating == null)
                return false;

            _context.MovieRatings.Remove(movieRating);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
