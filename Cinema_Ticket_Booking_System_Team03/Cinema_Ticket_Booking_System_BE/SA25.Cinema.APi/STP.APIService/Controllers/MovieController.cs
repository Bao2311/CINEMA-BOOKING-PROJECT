using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using sa25.Repository.Data;
using STP.APIService.Controllers.DTOs;
using STP.Repository.Models;
using System.Security.Claims;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class MovieController : ControllerBase
    {
        private readonly UnitOfWork _unitOfWork;

        public MovieController(UnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // Task 3.1: Add New Movie
        [HttpPost]
        public async Task<ActionResult<MovieResponseDTO>> CreateMovie([FromBody] CreateMovieDTO createMovieDTO)
        {
            try
            {
                // Lấy ID người dùng hiện tại từ claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { message = "User is not authenticated" });
                }

                int userId = int.Parse(userIdClaim.Value);

                // Tạo đối tượng Movie từ dữ liệu đầu vào
                var movie = new Movie
                {
                    Movie_Name = createMovieDTO.Movie_Name,
                    Release_Date = createMovieDTO.Release_Date,
                    End_Date = createMovieDTO.End_Date,
                    Production_Company = createMovieDTO.Production_Company,
                    Director = createMovieDTO.Director,
                    Cast = createMovieDTO.Cast,
                    Duration = createMovieDTO.Duration,
                    Genre = createMovieDTO.Genre,
                    Rating = createMovieDTO.Rating,
                    Language = createMovieDTO.Language,
                    Country = createMovieDTO.Country,
                    Synopsis = createMovieDTO.Synopsis,
                    Poster_URL = createMovieDTO.Poster_URL,
                    Trailer_Link = createMovieDTO.Trailer_Link,
                    Status = createMovieDTO.Status,
                    Created_By = userId,
                    Created_At = DateTime.Now,
                    Updated_At = DateTime.Now
                };

                // Thêm bộ phim vào cơ sở dữ liệu
                await _unitOfWork.MovieRepository.CreateAsync(movie);

                // Chuyển đổi sang DTO để trả về phản hồi
                var response = new MovieResponseDTO
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

                return CreatedAtAction(nameof(CreateMovie), new { id = movie.Movie_ID }, response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        // Task: Delete Movie By ID
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteMovie(int id)
        {
            try
            {
                // Kiểm tra xem bộ phim có tồn tại không
                var movie = await _unitOfWork.MovieRepository.GetMovieWithDetailsAsync(id);
                if (movie == null)
                {
                    return NotFound(new { message = $"Movie with ID {id} not found" });
                }

                // Kiểm tra có suất chiếu không
                if (movie.Showtimes != null && movie.Showtimes.Any())
                {
                    return BadRequest(new { message = "Cannot delete a movie that has associated showtimes" });
                }

                // Kiểm tra xem phim có đánh giá nào từ người dùng không
                if (movie.MovieRatings != null && movie.MovieRatings.Any())
                {
                    return BadRequest(new { message = "Cannot delete a movie that has user ratings" });
                }

                // Xóa bộ phim
                var result = await _unitOfWork.MovieRepository.RemoveAsync(id);
                if (!result)
                {
                    return StatusCode(500, new { message = "Failed to delete the movie" });
                }

                return Ok(new { message = $"Movie with ID {id} was successfully deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
    }
}
