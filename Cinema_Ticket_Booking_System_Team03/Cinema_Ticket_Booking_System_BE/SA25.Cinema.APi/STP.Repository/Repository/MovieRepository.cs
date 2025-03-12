using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repositories
{
    public class MovieRepository : GenericRepository<Movie>
    {
        public MovieRepository(CinemaDbContext context) : base(context) { }

        // Get movies by name
        public async Task<List<Movie>> GetByNameAsync(string name)
        {
            return await _context.Movies
                .Where(m => m.Movie_Name.Contains(name))
                .ToListAsync();
        }

        // Get movies by genre
        public async Task<List<Movie>> GetByGenreAsync(string genre)
        {
            return await _context.Movies
                .Where(m => m.Genre.Contains(genre))
                .ToListAsync();
        }

        // Get upcoming movies
        public async Task<List<Movie>> GetUpcomingMoviesAsync()
        {
            var today = DateTime.Now;
            return await _context.Movies
                .Where(m => m.Status == "Coming Soon" || (m.Release_Date > today))
                .OrderBy(m => m.Release_Date)
                .ToListAsync();
        }

        // Get now showing movies
        public async Task<List<Movie>> GetNowShowingMoviesAsync()
        {
            var today = DateTime.Now;
            return await _context.Movies
                .Where(m => m.Status == "Now Showing" && (m.End_Date == null || m.End_Date >= today))
                .OrderBy(m => m.Movie_Name)
                .ToListAsync();
        }

        // Get movies with ratings
        public async Task<List<Movie>> GetMoviesWithRatingsAsync()
        {
            return await _context.Movies
                .Include(m => m.MovieRatings)
                .ToListAsync();
        }

        // Get movie with all details including showtimes and ratings
        public async Task<Movie> GetMovieWithDetailsAsync(int id)
        {
            return await _context.Movies
                .Include(m => m.Showtimes)
                .Include(m => m.MovieRatings)
                .Include(m => m.CreatedBy)
                .FirstOrDefaultAsync(m => m.Movie_ID == id);
        }

        // Update movie status
        public async Task<bool> UpdateMovieStatusAsync(int id, string status)
        {
            var movie = await GetByIdAsync(id);
            if (movie == null)
                return false;

            movie.Status = status;
            movie.Updated_At = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        // Search movies by multiple criteria
        public async Task<List<Movie>> SearchMoviesAsync(string term, string genre = null, string language = null)
        {
            var query = _context.Movies.AsQueryable();

            if (!string.IsNullOrEmpty(term))
            {
                query = query.Where(m => m.Movie_Name.Contains(term) ||
                                          m.Synopsis.Contains(term) ||
                                          m.Cast.Contains(term) ||
                                          m.Director.Contains(term));
            }

            if (!string.IsNullOrEmpty(genre))
            {
                query = query.Where(m => m.Genre.Contains(genre));
            }

            if (!string.IsNullOrEmpty(language))
            {
                query = query.Where(m => m.Language.Contains(language));
            }

            return await query.ToListAsync();
        }

        // Get latest movies
        public async Task<List<Movie>> GetLatestMoviesAsync(int count = 10)
        {
            return await _context.Movies
                .OrderByDescending(m => m.Release_Date)
                .Take(count)
                .ToListAsync();
        }
        
    }
}