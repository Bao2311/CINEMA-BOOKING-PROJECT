using Microsoft.EntityFrameworkCore;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Services
{
    public class MovieService
    {
        private readonly CinemaDbContext _context;
        private readonly CloudinaryService _cloudinaryService;

        public MovieService(CinemaDbContext context, CloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<List<object>> GetAllMoviesAsync(string status = null, string filter = null)
        {
            var query = _context.Movies.AsQueryable();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(m => m.Status == status);

            if (!string.IsNullOrEmpty(filter))
            {
                string lowerFilter = filter.ToLower();
                query = query.Where(m =>
                    m.Movie_Name.ToLower().Contains(lowerFilter) ||
                    m.Director.ToLower().Contains(lowerFilter) ||
                    m.Genre.ToLower().Contains(lowerFilter) ||
                    m.Cast.ToLower().Contains(lowerFilter));
            }

            query = query.OrderByDescending(m => m.Release_Date);

            return await query.Select(m => new
            {
                m.Movie_ID,
                m.Movie_Name,
                m.Release_Date,
                m.End_Date,
                m.Director,
                m.Cast,
                m.Duration,
                m.Genre,
                m.Rating,
                m.Language,
                m.Country,
                m.Synopsis,
                m.Poster_URL,
                m.Trailer_Link,
                m.Status,
                Average_Rating = m.MovieRatings.Any() ? m.MovieRatings.Average(r => r.Rating) : 0,
                Rating_Count = m.MovieRatings.Count,
                Showtimes_Count = m.Showtimes.Count(s => s.Show_Date.Date >= DateTime.Today)
            }).ToListAsync<object>();
        }

        public async Task<object> GetMovieByIdAsync(int id)
        {
            var movie = await _context.Movies
                .Include(m => m.MovieRatings).ThenInclude(mr => mr.User)
                .Include(m => m.Showtimes.Where(s => s.Show_Date.Date >= DateTime.Today))
                .ThenInclude(s => s.CinemaRoom)
                .FirstOrDefaultAsync(m => m.Movie_ID == id);

            if (movie == null)
                throw new KeyNotFoundException($"Không tìm thấy phim có ID {id}");

            var ratings = movie.MovieRatings.Select(r => new
            {
                r.Rating_ID,
                r.User.Full_Name,
                r.Rating,
                r.Comment,
                r.Rating_Date,
                r.Is_Verified
            }).OrderByDescending(r => r.Rating_Date).ToList();

            var showtimesByDate = movie.Showtimes
                .GroupBy(s => s.Show_Date.Date)
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    Show_Date = g.Key,
                    Showtimes = g.OrderBy(s => s.Start_Time).Select(s => new
                    {
                        s.Showtime_ID,
                        s.Start_Time,
                        s.End_Time,
                        s.Price_Tier,
                        s.Base_Price,
                        s.Capacity_Available,
                        Room = new { s.CinemaRoom.Cinema_Room_ID, s.CinemaRoom.Room_Name, s.CinemaRoom.Room_Type }
                    }).ToList()
                }).ToList();

            return new
            {
                movie.Movie_ID,
                movie.Movie_Name,
                movie.Release_Date,
                movie.End_Date,
                movie.Production_Company,
                movie.Director,
                movie.Cast,
                movie.Duration,
                movie.Genre,
                movie.Rating,
                movie.Language,
                movie.Country,
                movie.Synopsis,
                movie.Poster_URL,
                movie.Trailer_Link,
                movie.Status,
                movie.Created_At,
                movie.Updated_At,
                Rating_Summary = new
                {
                    Average_Rating = movie.MovieRatings.Any() ? movie.MovieRatings.Average(r => r.Rating) : 0,
                    Rating_Count = movie.MovieRatings.Count,
                    Rating_Distribution = new[]
                    {
                        movie.MovieRatings.Count(r => r.Rating == 1),
                        movie.MovieRatings.Count(r => r.Rating == 2),
                        movie.MovieRatings.Count(r => r.Rating == 3),
                        movie.MovieRatings.Count(r => r.Rating == 4),
                        movie.MovieRatings.Count(r => r.Rating == 5)
                    }
                },
                Ratings = ratings,
                Showtimes = showtimesByDate
            };
        }

        public async Task<MovieResponseDTO> CreateMovieAsync(MovieCreateDto model, int userId)
        {
            if (model == null)
                throw new ArgumentException("Dữ liệu không hợp lệ");

            if (await _context.Movies.AnyAsync(m => m.Movie_Name == model.Movie_Name))
                throw new ArgumentException($"Phim '{model.Movie_Name}' đã tồn tại");

            string posterUrl = null;
            if (model.PosterFile != null && model.PosterFile.Length > 0)
                posterUrl = await _cloudinaryService.UploadPoster(model.PosterFile);

            var movie = new Movie
            {
                Movie_Name = model.Movie_Name,
                Release_Date = model.Release_Date,
                End_Date = model.End_Date,
                Production_Company = model.Production_Company,
                Director = model.Director,
                Cast = model.Cast,
                Duration = model.Duration,
                Genre = model.Genre,
                Rating = model.Rating,
                Language = model.Language,
                Country = model.Country,
                Synopsis = model.Synopsis,
                Poster_URL = posterUrl ?? model.Poster_URL,
                Trailer_Link = model.Trailer_Link,
                Status = model.Status ?? "Coming Soon",
                Created_By = userId,
                Created_At = DateTime.Now,
                Updated_At = DateTime.Now
            };

            _context.Movies.Add(movie);
            await _context.SaveChangesAsync();

            return MapMovieToResponseDTO(movie);
        }

        public async Task<MovieResponseDTO> UpdateMovieAsync(MovieUpdateDto model)
        {
            if (model == null)
                throw new ArgumentException("Dữ liệu không hợp lệ");

            var movie = await _context.Movies.FindAsync(model.Movie_ID);
            if (movie == null)
                throw new KeyNotFoundException($"Không tìm thấy phim có ID {model.Movie_ID}");

            if (model.Movie_Name != movie.Movie_Name &&
                await _context.Movies.AnyAsync(m => m.Movie_Name == model.Movie_Name))
                throw new ArgumentException($"Phim '{model.Movie_Name}' đã tồn tại");

            string posterUrl = movie.Poster_URL;
            if (model.PosterFile != null && model.PosterFile.Length > 0)
                posterUrl = await _cloudinaryService.UploadPoster(model.PosterFile);

            movie.Movie_Name = model.Movie_Name;
            movie.Release_Date = model.Release_Date;
            movie.End_Date = model.End_Date;
            movie.Production_Company = model.Production_Company;
            movie.Director = model.Director;
            movie.Cast = model.Cast;
            movie.Duration = model.Duration;
            movie.Genre = model.Genre;
            movie.Rating = model.Rating;
            movie.Language = model.Language;
            movie.Country = model.Country;
            movie.Synopsis = model.Synopsis;
            movie.Poster_URL = posterUrl ?? model.Poster_URL;
            movie.Trailer_Link = model.Trailer_Link;
            movie.Status = model.Status;
            movie.Updated_At = DateTime.Now;

            await _context.SaveChangesAsync();
            return MapMovieToResponseDTO(movie);
        }

        public async Task<object> DeleteMovieAsync(int id)
        {
            var movie = await _context.Movies.FindAsync(id);
            if (movie == null)
                throw new KeyNotFoundException($"Không tìm thấy phim có ID {id}");

            var hasShowtimes = await _context.Showtimes.AnyAsync(s => s.Movie_ID == id);
            if (hasShowtimes)
            {
                movie.Status = "Cancelled";
                await _context.SaveChangesAsync();
                return new { status = "deactivated", message = "Phim đã có suất chiếu, đã đánh dấu là đã hủy thay vì xóa" };
            }

            var ratings = await _context.MovieRatings.Where(r => r.Movie_ID == id).ToListAsync();
            if (ratings.Any())
                _context.MovieRatings.RemoveRange(ratings);

            _context.Movies.Remove(movie);
            await _context.SaveChangesAsync();
            return new { status = "deleted", message = "Phim đã được xóa hoàn toàn" };
        }

        public async Task<object> RateMovieAsync(int id, int userId, MovieRatingDto model)
        {
            if (model == null || model.Rating < 1 || model.Rating > 5)
                throw new ArgumentException("Dữ liệu không hợp lệ. Đánh giá phải từ 1-5 sao");

            var movie = await _context.Movies.FindAsync(id);
            if (movie == null)
                throw new KeyNotFoundException($"Không tìm thấy phim có ID {id}");

            var existingRating = await _context.MovieRatings
                .FirstOrDefaultAsync(r => r.Movie_ID == id && r.User_ID == userId);

            if (existingRating != null)
            {
                existingRating.Rating = model.Rating;
                existingRating.Comment = model.Comment;
                existingRating.Rating_Date = DateTime.Now;
                await _context.SaveChangesAsync();

                return new
                {
                    rating_id = existingRating.Rating_ID,
                    movie_id = existingRating.Movie_ID,
                    user_id = existingRating.User_ID,
                    rating = existingRating.Rating,
                    comment = existingRating.Comment,
                    rating_date = existingRating.Rating_Date,
                    is_updated = true
                };
            }

            var rating = new MovieRating
            {
                Movie_ID = id,
                User_ID = userId,
                Rating = model.Rating,
                Comment = model.Comment,
                Rating_Date = DateTime.Now,
                Is_Verified = await HasUserBookedMovie(userId, id)
            };

            _context.MovieRatings.Add(rating);
            await _context.SaveChangesAsync();

            return new
            {
                rating_id = rating.Rating_ID,
                movie_id = rating.Movie_ID,
                user_id = rating.User_ID,
                rating = rating.Rating,
                comment = rating.Comment,
                rating_date = rating.Rating_Date,
                is_verified = rating.Is_Verified,
                is_updated = false
            };
        }

        public async Task<List<object>> GetComingSoonMoviesAsync()
        {
            var today = DateTime.Today;
            return await _context.Movies
                .Where(m => m.Status == "Coming Soon" && m.Release_Date > today)
                .OrderBy(m => m.Release_Date)
                .Select(m => new
                {
                    m.Movie_ID,
                    m.Movie_Name,
                    m.Release_Date,
                    m.Director,
                    m.Duration,
                    m.Genre,
                    m.Rating,
                    m.Synopsis,
                    m.Poster_URL,
                    m.Trailer_Link,
                    Days_Until_Release = EF.Functions.DateDiffDay(today, m.Release_Date)
                }).ToListAsync<object>();
        }

        public async Task<List<object>> GetNowShowingMoviesAsync()
        {
            var today = DateTime.Today;
            return await _context.Movies
                .Where(m => m.Status == "Now Showing" && (m.End_Date == null || m.End_Date >= today) && m.Release_Date <= today)
                .OrderByDescending(m => m.Showtimes.Count(s => s.Show_Date >= today))
                .Select(m => new
                {
                    m.Movie_ID,
                    m.Movie_Name,
                    m.Release_Date,
                    m.Director,
                    m.Duration,
                    m.Genre,
                    m.Rating,
                    m.Synopsis,
                    m.Poster_URL,
                    m.Trailer_Link,
                    Average_Rating = m.MovieRatings.Any() ? m.MovieRatings.Average(r => r.Rating) : 0,
                    Rating_Count = m.MovieRatings.Count,
                    Showtimes_Today = m.Showtimes.Count(s => s.Show_Date.Date == today)
                }).ToListAsync<object>();
        }

        public async Task<List<MovieResponseDTO>> GetMoviesByGenreAsync(string genre)
        {
            var today = DateTime.Today;
            var movies = await _context.Movies
                .Where(m => m.Genre.Contains(genre) && m.Status == "Now Showing" && (m.End_Date == null || m.End_Date >= today))
                .ToListAsync();

            if (!movies.Any())
                throw new KeyNotFoundException($"No movies found for genre: {genre}");

            return movies.Select(MapMovieToResponseDTO).ToList();
        }

        public async Task<List<string>> GetMovieGenresAsync()
        {
            var movies = await _context.Movies.Where(m => m.Status == "Now Showing").ToListAsync();
            if (!movies.Any())
                throw new KeyNotFoundException("No movies found");

            var genreList = new HashSet<string>();
            foreach (var movie in movies)
            {
                if (!string.IsNullOrEmpty(movie.Genre))
                {
                    var genreArray = movie.Genre.Split(',').Select(g => g.Trim());
                    foreach (var g in genreArray)
                        if (!string.IsNullOrEmpty(g))
                            genreList.Add(g);
                }
            }
            return genreList.OrderBy(g => g).ToList();
        }

        public async Task<List<MovieResponseDTO>> SearchMoviesAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                throw new ArgumentException("Search keyword cannot be empty");

            var today = DateTime.Today;
            var movies = await _context.Movies
                .Where(m => (m.Movie_Name.ToLower().Contains(keyword.ToLower()) ||
                            m.Director.ToLower().Contains(keyword.ToLower()) ||
                            m.Genre.ToLower().Contains(keyword.ToLower()) ||
                            m.Cast.ToLower().Contains(keyword.ToLower())) &&
                            (m.Status == "Now Showing" || m.Status == "Coming Soon") &&
                            (m.End_Date == null || m.End_Date >= today))
                .ToListAsync();

            if (!movies.Any())
                throw new KeyNotFoundException($"No movies found matching keyword: {keyword}");

            return movies.Select(MapMovieToResponseDTO).ToList();
        }

        private async Task<bool> HasUserBookedMovie(int userId, int movieId)
        {
            return await _context.TicketBookings
                .AnyAsync(b => b.User_ID == userId && b.Status == "Confirmed" && b.Showtime.Movie_ID == movieId);
        }

        private MovieResponseDTO MapMovieToResponseDTO(Movie movie)
        {
            return new MovieResponseDTO
            {
                Movie_ID = movie.Movie_ID,
                Movie_Name = movie.Movie_Name,
                Release_Date = movie.Release_Date,
                End_Date = movie.End_Date,
                Production_Company = movie.Production_Company,
                Director = movie.Director,
                Cast = movie.Cast,
                Duration = movie.Duration,
                Genre = movie.Genre,
                Rating = movie.Rating,
                Language = movie.Language,
                Country = movie.Country,
                Synopsis = movie.Synopsis,
                Poster_URL = movie.Poster_URL,
                Trailer_Link = movie.Trailer_Link,
                Status = movie.Status,
                Created_By = movie.Created_By,
                Created_At = movie.Created_At,
                Updated_At = movie.Updated_At
            };
        }
    }
}