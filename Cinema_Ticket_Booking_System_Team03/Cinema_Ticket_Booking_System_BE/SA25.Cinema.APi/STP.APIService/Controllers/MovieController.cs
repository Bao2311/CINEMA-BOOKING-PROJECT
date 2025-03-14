using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using sa25.Repository.Data;
using STP.APIService.Controllers.DTOs;
using STP.Repository.Models;
using System.Security.Claims;
using static Org.BouncyCastle.Crypto.Engines.SM2Engine;

namespace STP.APIService.Controllers
{
    /// <summary>
    /// API quản lý thông tin phim, chỉ cho phép Admin và Staff truy cập
    /// Các chức năng: thêm, sửa, xóa, lấy danh sách và chi tiết phim
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class MovieController : ControllerBase
    {
        private readonly UnitOfWork _unitOfWork;

        public MovieController(UnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// API thêm phim mới vào hệ thống
        /// - Xác thực người dùng qua token JWT
        /// - Kiểm tra ngày phát hành phải trong tương lai
        /// - Lưu thông tin phim và trả về kết quả
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<MovieResponseDTO>> CreateMovie([FromBody] CreateMovieDTO createMovieDTO)
        {
            try
            {
                // Lấy ID người dùng từ token JWT
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { message = "User is not authenticated" });
                }

                int userId = int.Parse(userIdClaim.Value);

                // Kiểm tra ngày phát hành phải trong tương lai
                if (createMovieDTO.Release_Date <= DateTime.Now)
                {
                    return BadRequest(new { message = "Release date must be in the future" });
                }

                // Khởi tạo đối tượng Movie từ DTO
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

                // Lưu phim vào database
                await _unitOfWork.MovieRepository.CreateAsync(movie);

                // Chuyển đổi thành DTO để trả về
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

        /// <summary>
        /// API cập nhật thông tin phim
        /// - Nhận thông tin cập nhật từ client
        /// - Cập nhật thời gian sửa đổi
        /// - Lưu vào database và trả về số dòng bị ảnh hưởng
        /// </summary>
        [HttpPut]
        public async Task<ActionResult<MovieResponseDTO>> UpdateMovie([FromBody] UpdateMovieDTO updateMovieDTO)
        {
            try
            {
                // Khởi tạo đối tượng Movie từ DTO để cập nhật
                var movie = new Movie()
                {
                    Movie_ID = updateMovieDTO.Movie_ID,
                    Movie_Name = updateMovieDTO.Movie_Name,
                    Release_Date = updateMovieDTO.Release_Date,
                    End_Date = updateMovieDTO.End_Date,
                    Production_Company = updateMovieDTO.Production_Company,
                    Director = updateMovieDTO.Director,
                    Cast = updateMovieDTO.Cast,
                    Duration = updateMovieDTO.Duration,
                    Genre = updateMovieDTO.Genre,
                    Rating = updateMovieDTO.Rating,
                    Language = updateMovieDTO.Language,
                    Country = updateMovieDTO.Country,
                    Synopsis = updateMovieDTO.Synopsis,
                    Poster_URL = updateMovieDTO.Poster_URL,
                    Trailer_Link = updateMovieDTO.Trailer_Link,
                    Status = updateMovieDTO.Status,
                    Created_By = updateMovieDTO.Created_By,
                    Updated_At = DateTime.Now // Cập nhật thời gian sửa đổi
                };

                // Cập nhật phim trong database
                int rowsAffected = await _unitOfWork.MovieRepository.UpdateAsync(movie);

                return Ok(rowsAffected);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// API xóa phim theo ID
        /// - Kiểm tra phim có tồn tại không
        /// - Kiểm tra phim có liên kết với suất chiếu hoặc đánh giá không
        /// - Xóa phim nếu không có ràng buộc
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteMovie(int id)
        {
            try
            {
                // Kiểm tra phim có tồn tại không
                var movie = await _unitOfWork.MovieRepository.GetMovieWithDetailsAsync(id);
                if (movie == null)
                {
                    return NotFound(new { message = $"Movie with ID {id} not found" });
                }

                // Kiểm tra phim có suất chiếu liên kết không
                if (movie.Showtimes != null && movie.Showtimes.Any())
                {
                    return BadRequest(new { message = "Cannot delete a movie that has associated showtimes" });
                }

                // Kiểm tra phim có đánh giá từ người dùng không
                if (movie.MovieRatings != null && movie.MovieRatings.Any())
                {
                    return BadRequest(new { message = "Cannot delete a movie that has user ratings" });
                }

                // Thực hiện xóa phim
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

        /// <summary>
        /// API lấy danh sách tất cả phim
        /// - Truy vấn tất cả phim từ database
        /// - Chuyển đổi sang DTO để trả về client
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MovieResponseDTO>>> GetAllMovies()
        {
            try
            {
                // Lấy tất cả phim từ database
                var movies = await _unitOfWork.MovieRepository.GetAllMoviesAsync();

                if (movies == null || !movies.Any())
                {
                    return NotFound(new { message = "No movies found" });
                }

                // Chuyển đổi danh sách phim thành DTO để trả về
                var response = movies.Select(movie => new MovieResponseDTO
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
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// API lấy thông tin chi tiết phim theo ID
        /// - Truy vấn phim từ database theo ID
        /// - Chuyển đổi sang DTO để trả về client
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<MovieResponseDTO>> GetMovieById(int id)
        {
            try
            {
                // Lấy thông tin phim từ database theo ID
                var movie = await _unitOfWork.MovieRepository.GetMovieWithDetailsAsync(id);

                if (movie == null)
                {
                    return NotFound(new { message = $"Movie with ID {id} not found" });
                }

                // Chuyển đổi thành DTO để trả về
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

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Internal server error: {ex.Message}" });
            }
        }
    }
}
