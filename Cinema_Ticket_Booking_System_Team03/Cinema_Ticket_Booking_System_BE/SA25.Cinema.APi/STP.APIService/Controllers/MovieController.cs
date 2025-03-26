using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Dtos;
using STP.Repository.Services;
using STP.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MovieController : ControllerBase
    {
        private readonly MovieService _movieService;
        private readonly ILogger<MovieController> _logger;

        public MovieController(MovieService movieService, ILogger<MovieController> logger)
        {
            _movieService = movieService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllMovies([FromQuery] string status = null, [FromQuery] string filter = null)
        {
            try
            {
                var movies = await _movieService.GetAllMoviesAsync(status, filter);
                return Ok(movies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting movies");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách phim" });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMovieById(int id)
        {
            try
            {
                var movie = await _movieService.GetMovieByIdAsync(id);
                return Ok(movie);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting movie {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin phim" });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CreateMovie([FromForm] MovieCreateDto createMovieDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId <= 0)
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                var movie = await _movieService.CreateMovieAsync(createMovieDto, userId);
                return CreatedAtAction(nameof(GetMovieById), new { id = movie.Movie_ID }, movie);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating movie");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo phim mới" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateMovie(int id, [FromForm] MovieUpdateDto updateMovieDto)
        {
            try
            {
                updateMovieDto.Movie_ID = id;
                var movie = await _movieService.UpdateMovieAsync(updateMovieDto);
                return Ok(movie);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating movie {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật phim" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> DeleteMovie(int id)
        {
            try
            {
                var result = await _movieService.DeleteMovieAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting movie {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa phim" });
            }
        }

        [HttpPost("{id}/rate")]
        [Authorize]
        public async Task<IActionResult> RateMovie(int id, [FromBody] MovieRatingDto ratingDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId <= 0)
                    return Unauthorized(new { message = "Không thể xác định người dùng" });

                var rating = await _movieService.RateMovieAsync(id, userId, ratingDto);
                return Ok(rating);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rating movie {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đánh giá phim" });
            }
        }

        [HttpGet("coming-soon")]
        [AllowAnonymous]
        public async Task<IActionResult> GetComingSoonMovies()
        {
            try
            {
                var movies = await _movieService.GetComingSoonMoviesAsync();
                return Ok(movies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting coming soon movies");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách phim sắp chiếu" });
            }
        }

        [HttpGet("now-showing")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNowShowingMovies()
        {
            try
            {
                var movies = await _movieService.GetNowShowingMoviesAsync();
                return Ok(movies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting now showing movies");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách phim đang chiếu" });
            }
        }

        [HttpGet("by-genre/{genre}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMoviesByGenre(string genre)
        {
            try
            {
                var movies = await _movieService.GetMoviesByGenreAsync(genre);
                return Ok(movies);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("genres")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMovieGenres()
        {
            try
            {
                var genres = await _movieService.GetMovieGenresAsync();
                return Ok(genres);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchMovies([FromQuery] string keyword)
        {
            try
            {
                var movies = await _movieService.SearchMoviesAsync(keyword);
                return Ok(movies);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("nameid")?.Value ??
                User.FindFirst("UserId")?.Value ??
                User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                return -1;

            return userId;
        }
    }
}