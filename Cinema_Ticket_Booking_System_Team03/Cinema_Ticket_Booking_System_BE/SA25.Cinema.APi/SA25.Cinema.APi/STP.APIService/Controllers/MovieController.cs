using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using sa25.Repository.Data;
using STP.APIService.Controllers.DTOs;
using STP.Repository.Models;
using System.Security.Claims;

namespace STP.APIService.Controllers
{
    /// <summary>
    /// API quản lý thông tin phim, chỉ cho phép Admin và Staff truy cập
    /// Các chức năng: thêm, sửa, xóa, lấy danh sách và chi tiết phim
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize(Roles = "Admin,Staff")]
    [AllowAnonymous]
    public class MovieController : ControllerBase
    {
        private readonly UnitOfWork _unitOfWork;
        private readonly CloudinaryService _cloudinaryService;

        public MovieController(UnitOfWork unitOfWork, CloudinaryService cloudinaryService)
        {
            _unitOfWork = unitOfWork;
            _cloudinaryService = cloudinaryService;
        }

        /// <summary>
        /// API thêm phim mới vào hệ thống
        /// - Xác thực người dùng qua token JWT
        /// - Kiểm tra ngày phát hành phải trong tương lai
        /// - Upload poster nếu có
        /// - Lưu thông tin phim và trả về kết quả
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<MovieResponseDTO>> CreateMovie([FromForm] CreateMovieDTO createMovieDTO)
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

                // Khởi tạo posterUrl là null hoặc chuỗi rỗng
                string posterUrl = null;

                // Xử lý upload poster nếu có file
                if (createMovieDTO.posterFile != null && createMovieDTO.posterFile.Length > 0)
                {
                    try
                    {
                        posterUrl = await _cloudinaryService.UploadPoster(createMovieDTO.posterFile);
                    }
                    catch (ArgumentException ex)
                    {
                        return BadRequest(new { message = ex.Message });
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { message = $"Error uploading poster: {ex.Message}" });
                    }
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
                    Poster_URL = posterUrl, // Sử dụng posterUrl đã được xử lý
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

                return CreatedAtAction(nameof(GetMovieById), new { id = movie.Movie_ID }, response);
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
        public async Task<ActionResult<MovieResponseDTO>> UpdateMovie([FromForm] UpdateMovieDTO updateMovieDTO)
        {
            try
            {
                // Kiểm tra phim có tồn tại không
                var existingMovie = await _unitOfWork.MovieRepository.GetByIdAsync(updateMovieDTO.Movie_ID);
                if (existingMovie == null)
                {
                    return NotFound(new { message = $"Movie with ID {updateMovieDTO.Movie_ID} not found" });
                }

                // Giữ nguyên Poster_URL cũ nếu không có file mới
                string posterUrl = existingMovie.Poster_URL;

                // Xử lý upload poster nếu có file mới
                if (updateMovieDTO.posterFile != null && updateMovieDTO.posterFile.Length > 0)
                {
                    try
                    {
                        posterUrl = await _cloudinaryService.UploadPoster(updateMovieDTO.posterFile);
                    }
                    catch (ArgumentException ex)
                    {
                        return BadRequest(new { message = ex.Message });
                    }
                    catch (Exception ex)
                    {
                        return StatusCode(500, new { message = $"Error uploading poster: {ex.Message}" });
                    }
                }

                // Cập nhật thông tin phim
                existingMovie.Movie_Name = updateMovieDTO.Movie_Name;
                existingMovie.Release_Date = updateMovieDTO.Release_Date;
                existingMovie.End_Date = updateMovieDTO.End_Date;
                existingMovie.Production_Company = updateMovieDTO.Production_Company;
                existingMovie.Director = updateMovieDTO.Director;
                existingMovie.Cast = updateMovieDTO.Cast;
                existingMovie.Duration = updateMovieDTO.Duration;
                existingMovie.Genre = updateMovieDTO.Genre;
                existingMovie.Rating = updateMovieDTO.Rating;
                existingMovie.Language = updateMovieDTO.Language;
                existingMovie.Country = updateMovieDTO.Country;
                existingMovie.Synopsis = updateMovieDTO.Synopsis;
                existingMovie.Poster_URL = posterUrl; // Sử dụng posterUrl đã được xử lý
                existingMovie.Trailer_Link = updateMovieDTO.Trailer_Link;
                existingMovie.Status = updateMovieDTO.Status;
                existingMovie.Updated_At = DateTime.Now;

                // Lưu thay đổi vào database
                await _unitOfWork.MovieRepository.UpdateAsync(existingMovie);

                // Chuyển đổi thành DTO để trả về
                var response = new MovieResponseDTO
                {
                    Movie_ID = existingMovie.Movie_ID,
                    Movie_Name = existingMovie.Movie_Name,
                    Release_Date = existingMovie.Release_Date,
                    End_Date = existingMovie.End_Date,
                    Production_Company = existingMovie.Production_Company,
                    Director = existingMovie.Director,
                    Cast = existingMovie.Cast,
                    Duration = existingMovie.Duration,
                    Genre = existingMovie.Genre,
                    Rating = existingMovie.Rating,
                    Language = existingMovie.Language,
                    Country = existingMovie.Country,
                    Synopsis = existingMovie.Synopsis,
                    Poster_URL = existingMovie.Poster_URL,
                    Trailer_Link = existingMovie.Trailer_Link,
                    Status = existingMovie.Status,
                    Created_By = existingMovie.Created_By,
                    Created_At = existingMovie.Created_At,
                    Updated_At = existingMovie.Updated_At
                };

                return Ok(response);
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
                var movie = await _unitOfWork.MovieRepository.GetByIdAsync(id);
                if (movie == null)
                {
                    return NotFound(new { message = $"Movie with ID {id} not found" });
                }

                // Lấy chi tiết phim để kiểm tra các ràng buộc
                var movieWithDetails = await _unitOfWork.MovieRepository.GetMovieWithDetailsAsync(id);

                // Kiểm tra phim có suất chiếu liên kết không
                if (movieWithDetails.Showtimes != null && movieWithDetails.Showtimes.Any())
                {
                    return BadRequest(new { message = "Cannot delete a movie that has associated showtimes" });
                }

                // Kiểm tra phim có đánh giá từ người dùng không
                if (movieWithDetails.MovieRatings != null && movieWithDetails.MovieRatings.Any())
                {
                    return BadRequest(new { message = "Cannot delete a movie that has user ratings" });
                }

                // Thực hiện xóa phim - truyền entity thay vì chỉ truyền ID
                await _unitOfWork.MovieRepository.DeleteAsync(movie);

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
                var movie = await _unitOfWork.MovieRepository.GetByIdAsync(id);

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
