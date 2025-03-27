using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using STP.Repository.Models;
using STP.Repository.Repositories;
using STP.Repository.Data;
using Microsoft.Extensions.Logging;
using STP.Repository.Dtos;
using Microsoft.EntityFrameworkCore;

namespace STP.Service.Services
{
    /// <summary>
    /// Dịch vụ quản lý lịch chiếu phim
    /// </summary>
    public class ShowtimeService
    {
        private readonly ShowtimeRepository _showtimeRepository; // Repository xử lý dữ liệu lịch chiếu
        private readonly CinemaDbContext _context; // Context database
        private readonly ILogger<ShowtimeService> _logger; // Logger ghi nhật ký

        /// <summary>
        /// Khởi tạo dịch vụ quản lý lịch chiếu
        /// </summary>
        /// <param name="showtimeRepository">Repository xử lý dữ liệu lịch chiếu</param>
        /// <param name="context">Context database</param>
        /// <param name="logger">Logger ghi nhật ký</param>
        public ShowtimeService(ShowtimeRepository showtimeRepository, CinemaDbContext context, ILogger<ShowtimeService> logger)
        {
            _showtimeRepository = showtimeRepository;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả lịch chiếu
        /// </summary>
        /// <returns>Danh sách lịch chiếu</returns>
        public async Task<IEnumerable<ShowtimeDto>> GetAllShowtimesAsync()
        {
            try
            {
                _logger.LogInformation("Getting all showtimes");
                var showtimes = await _showtimeRepository.GetAllAsync();

                // Chuyển đổi từ entity sang DTO
                return showtimes.Select(s => new ShowtimeDto
                {
                    Showtime_ID = s.Showtime_ID,
                    Movie_ID = s.Movie_ID,
                    Cinema_Room_ID = s.Cinema_Room_ID,
                    Room_Name = s.CinemaRoom?.Room_Name,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Price_Tier = s.Price_Tier,
                    Base_Price = s.Base_Price,
                    Status = s.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all showtimes");
                throw;
            }
        }

        /// <summary>
        /// Lấy thông tin lịch chiếu theo ID
        /// </summary>
        /// <param name="id">ID lịch chiếu</param>
        /// <returns>Thông tin lịch chiếu</returns>
        public async Task<ShowtimeDto> GetShowtimeByIdAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Getting showtime with ID: {id}");
                var showtime = await _showtimeRepository.GetByIdAsync(id);
                if (showtime == null)
                {
                    _logger.LogWarning($"Showtime with ID {id} not found");
                    return null;
                }

                // Chuyển đổi từ entity sang DTO
                return new ShowtimeDto
                {
                    Showtime_ID = showtime.Showtime_ID,
                    Movie_ID = showtime.Movie_ID,
                    Cinema_Room_ID = showtime.Cinema_Room_ID,
                    Room_Name = showtime.CinemaRoom?.Room_Name,
                    Show_Date = showtime.Show_Date,
                    Start_Time = showtime.Start_Time,
                    End_Time = showtime.End_Time,
                    Price_Tier = showtime.Price_Tier,
                    Base_Price = showtime.Base_Price,
                    Status = showtime.Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtime with ID: {id}");
                throw;
            }
        }
        /// <summary>
        /// Tạo lịch chiếu mới
        /// </summary>
        /// <param name="showtimeDto">Thông tin lịch chiếu cần tạo</param>
        /// <param name="createdBy">ID người tạo</param>
        /// <returns>ID lịch chiếu mới</returns>
        public async Task<ShowtimeDto> CreateShowtimeAsync(ShowtimeCreateDto model, int userId)
        {
            if (model == null)
                throw new ArgumentException("Dữ liệu không hợp lệ");

            var movie = await _context.Movies.FindAsync(model.Movie_ID);
            if (movie == null)
                throw new ArgumentException($"Không tìm thấy phim có ID {model.Movie_ID}");

            var cinemaRoom = await _context.CinemaRooms.FindAsync(model.Cinema_Room_ID);
            if (cinemaRoom == null)
                throw new ArgumentException($"Không tìm thấy phòng chiếu có ID {model.Cinema_Room_ID}");

            if (cinemaRoom.Status != "Active")
                throw new ArgumentException("Phòng chiếu không hoạt động");

            if (model.Show_Date.Date < DateTime.Today)
                throw new ArgumentException("Ngày chiếu phải từ hôm nay trở đi");

            // Tính toán thời gian kết thúc đề xuất
            TimeSpan suggestedEndTime = model.Start_Time.Add(TimeSpan.FromMinutes(movie.Duration + 15));

            // Ghi log thời gian kết thúc đề xuất để tham khảo
            _logger.LogInformation($"Thời gian kết thúc đề xuất cho suất chiếu: {suggestedEndTime}. " +
                                   $"Dựa trên thời lượng phim {movie.Duration} phút + thêm 15 phút");

            TimeSpan endTime = suggestedEndTime;
            var conflictingShowtimes = await _context.Showtimes
                .Where(s => s.Cinema_Room_ID == model.Cinema_Room_ID &&
                           s.Show_Date.Date == model.Show_Date.Date &&
                           ((s.Start_Time <= model.Start_Time && s.End_Time > model.Start_Time) ||
                            (s.Start_Time < endTime && s.End_Time >= endTime) ||
                            (s.Start_Time >= model.Start_Time && s.End_Time <= endTime)))
                .ToListAsync();

            if (conflictingShowtimes.Any())
                throw new InvalidOperationException("Suất chiếu bị trùng lịch với suất chiếu khác trong cùng phòng");

            var showtime = new Showtime
            {
                Movie_ID = model.Movie_ID,
                Cinema_Room_ID = model.Cinema_Room_ID,
                Show_Date = model.Show_Date,
                Start_Time = model.Start_Time,
                End_Time = endTime,
                Price_Tier = model.Price_Tier,
                Base_Price = model.Base_Price,
                Status = "Scheduled",
                Capacity_Available = cinemaRoom.Seat_Quantity,
                Created_By = userId,
                Created_At = DateTime.Now,
                Updated_At = DateTime.Now
            };

            _context.Showtimes.Add(showtime);
            await _context.SaveChangesAsync();

            if (movie.Status == "Coming Soon" && model.Show_Date.Date <= DateTime.Today)
            {
                movie.Status = "Now Showing";
                await _context.SaveChangesAsync();
            }

            return MapToShowtimeDto(showtime, cinemaRoom.Room_Name);
        }

        /// <summary>
        /// Cập nhật thông tin lịch chiếu bao gồm cả trạng thái
        /// </summary>
        /// <param name="id">ID lịch chiếu</param>
        /// <param name="showtimeDto">Thông tin cập nhật</param>
        /// <param name="updatedBy">ID người cập nhật</param>
        /// <returns>True nếu cập nhật thành công</returns>
        public async Task<bool> UpdateShowtimeAsync(int id, ShowtimeUpdateDto showtimeDto, int updatedBy)
        {
            try
            {
                _logger.LogInformation($"Updating showtime with ID: {id}");

                // Kiểm tra xem lịch chiếu có tồn tại không
                var existingShowtime = await _showtimeRepository.GetByIdAsync(id);
                if (existingShowtime == null)
                {
                    _logger.LogWarning($"Update failed: Showtime with ID {id} not found");
                    return false;
                }

                // Lấy thông tin thời lượng phim từ database
                var movie = await _context.Movies.FindAsync(showtimeDto.Movie_ID);
                if (movie == null)
                {
                    throw new InvalidOperationException("Phim không tồn tại.");
                }

                // Kiểm tra thời gian kết thúc có hợp lệ không
                if (!IsEndTimeValid(showtimeDto.Start_Time, showtimeDto.End_Time, movie.Duration))
                {
                    throw new InvalidOperationException("Thời gian kết thúc không hợp lệ. Vui lòng đảm bảo thời gian chiếu đủ thời lượng phim và thêm 15 phút nghỉ.");
                }

                // Kiểm tra xem khung giờ mới có trùng với lịch chiếu khác trong cùng phòng không
                bool isRoomAvailable = await IsShowtimeAvailableAsync(
                    showtimeDto.Cinema_Room_ID,
                    showtimeDto.Show_Date,
                    showtimeDto.Start_Time,
                    showtimeDto.End_Time,
                    id); // excludeId = id để bỏ qua chính lịch chiếu đang cập nhật

                if (!isRoomAvailable)
                {
                    _logger.LogWarning("Update failed: Time slot is already occupied by another showtime in this room");
                    throw new InvalidOperationException("Thời gian chiếu đã trùng với lịch chiếu khác trong phòng này");
                }

                // Cập nhật dữ liệu
                existingShowtime.Movie_ID = showtimeDto.Movie_ID;
                existingShowtime.Cinema_Room_ID = showtimeDto.Cinema_Room_ID;
                existingShowtime.Show_Date = EnsureSqlDateTimeCompatible(showtimeDto.Show_Date);
                existingShowtime.Start_Time = showtimeDto.Start_Time;
                existingShowtime.End_Time = showtimeDto.End_Time;
                existingShowtime.Price_Tier = showtimeDto.Price_Tier;
                existingShowtime.Base_Price = showtimeDto.Base_Price;
                existingShowtime.Capacity_Available = showtimeDto.Capacity_Available;

                // Lưu thay đổi
                bool result = await _showtimeRepository.UpdateAsync(id, existingShowtime);
                if (result)
                {
                    _logger.LogInformation($"Successfully updated showtime with ID: {id}");
                }
                else
                {
                    _logger.LogWarning($"Failed to update showtime with ID: {id}");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating showtime with ID: {id}");
                throw;
            }
        }
        /// <summary>
        /// Ẩn lịch chiếu bằng cách đổi trạng thái thành Hidden
        /// </summary>
        /// <param name="id">ID lịch chiếu</param>
        /// <param name="userId">ID người thực hiện</param>
        /// <returns>True nếu thành công</returns>
        public async Task<bool> HideShowtimeAsync(int id, int userId)
        {
            try
            {
                _logger.LogInformation($"Hiding showtime with ID: {id} by user ID: {userId}");

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        // 1. Lấy thông tin Showtime
                        var showtime = await _showtimeRepository.GetByIdAsync(id);
                        if (showtime == null)
                        {
                            _logger.LogWarning($"Hide failed: Showtime with ID {id} not found");
                            return false;
                        }

                        // 2. Cập nhật trạng thái của Showtime thành "Hidden"
                        showtime.Status = "Hidden";
                        showtime.Updated_At = DateTime.UtcNow;

                        bool result = await _showtimeRepository.UpdateAsync(id, showtime);
                        if (!result)
                        {
                            _logger.LogWarning($"Failed to update showtime status to Hidden for ID: {id}");
                            await transaction.RollbackAsync();
                            return false;
                        }

                        await transaction.CommitAsync();
                        _logger.LogInformation($"Successfully hidden showtime with ID: {id}");
                        return true;
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, $"Transaction error when hiding showtime with ID: {id}");

                        // Log chi tiết lỗi
                        _logger.LogError($"Error: {ex.Message}");
                        if (ex.InnerException != null)
                            _logger.LogError($"Inner Exception: {ex.InnerException.Message}");
                        _logger.LogError($"Stack Trace: {ex.StackTrace}");

                        return false;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error hiding showtime with ID: {id}");
                throw;
            }
        }

        /// <summary>
        /// Đảm bảo ngày giờ tương thích với SQL Server
        /// </summary>
        /// <param name="date">Ngày cần kiểm tra</param>
        /// <returns>Ngày đã được điều chỉnh</returns>
        private DateTime EnsureSqlDateTimeCompatible(DateTime date)
        {
            // SQL Server datetime có phạm vi từ 1753-01-01 đến 9999-12-31
            DateTime sqlMinDate = new DateTime(1753, 1, 1);
            DateTime sqlMaxDate = new DateTime(9999, 12, 31);

            if (date < sqlMinDate)
                return sqlMinDate;
            if (date > sqlMaxDate)
                return sqlMaxDate;

            return date;
        }
        /// <summary>
        /// Kiểm tra xem khung giờ chiếu có khả dụng không trong phòng chiếu cụ thể
        /// và phải cách nhau tối thiểu 15 phút so với các lịch chiếu khác
        /// </summary>
        /// <param name="cinemaRoomId">ID phòng chiếu</param>
        /// <param name="date">Ngày chiếu</param>
        /// <param name="startTime">Giờ bắt đầu</param>
        /// <param name="endTime">Giờ kết thúc</param>
        /// <param name="excludeId">ID lịch chiếu cần loại trừ (dùng khi cập nhật)</param>
        /// <returns>True nếu khung giờ khả dụng và có khoảng cách 15 phút</returns>
        public async Task<bool> IsShowtimeAvailableAsync(
            int cinemaRoomId,
            DateTime date,
            TimeSpan startTime,
            TimeSpan endTime,
            int? excludeId = null)
        {
            try
            {
                _logger.LogInformation($"Checking availability for room ID: {cinemaRoomId} on {date.ToShortDateString()} from {startTime} to {endTime}");

                // Kiểm tra khung giờ hợp lệ
                if (startTime >= endTime)
                {
                    _logger.LogWarning("Invalid time range: start time must be before end time");
                    return false;
                }

                // Lấy danh sách các lịch chiếu trong cùng ngày, cùng phòng
                var showtimes = await _showtimeRepository
                    .GetAsync(s =>
                        s.Cinema_Room_ID == cinemaRoomId &&
                        s.Show_Date.Date == date.Date &&
                        s.Status != "Hidden" && // Không xét các lịch chiếu đã ẩn
                        (excludeId == null || s.Showtime_ID != excludeId));

                // Thời gian cần cách nhau tối thiểu là 15 phút
                var gap = TimeSpan.FromMinutes(15);

                // Kiểm tra xem có bị trùng khung giờ hoặc không đạt khoảng cách tối thiểu 15 phút không
                foreach (var showtime in showtimes)
                {
                    // Kiểm tra trùng lặp nếu có phần giao nhau
                    if ((startTime >= showtime.Start_Time && startTime < showtime.End_Time) ||
                        (endTime > showtime.Start_Time && endTime <= showtime.End_Time) ||
                        (startTime <= showtime.Start_Time && endTime >= showtime.End_Time))
                    {
                        _logger.LogWarning($"Time slot conflicts with existing showtime ID: {showtime.Showtime_ID} in the same room");
                        return false;
                    }

                    // Nếu lịch chiếu mới bắt đầu sau lịch chiếu cũ
                    if (startTime >= showtime.End_Time)
                    {
                        var diff = startTime - showtime.End_Time;
                        if (diff < gap)
                        {
                            _logger.LogWarning($"New showtime starts too soon after existing showtime ID: {showtime.Showtime_ID}. Gap: {diff.TotalMinutes} minutes");
                            return false;
                        }
                    }
                    // Nếu lịch chiếu mới kết thúc trước lịch chiếu cũ bắt đầu
                    if (endTime <= showtime.Start_Time)
                    {
                        var diff = showtime.Start_Time - endTime;
                        if (diff < gap)
                        {
                            _logger.LogWarning($"New showtime ends too close before existing showtime ID: {showtime.Showtime_ID}. Gap: {diff.TotalMinutes} minutes");
                            return false;
                        }
                    }
                }

                _logger.LogInformation("Time slot is available in this room with the required 15 minute gap");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking showtime availability in room");
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra xem phim có lịch chiếu trùng thời gian ở phòng khác không
        /// </summary>
        /// <param name="movieId">ID phim</param>
        /// <param name="currentRoomId">ID phòng chiếu hiện tại (để loại trừ)</param>
        /// <param name="date">Ngày chiếu</param>
        /// <param name="startTime">Giờ bắt đầu</param>
        /// <param name="endTime">Giờ kết thúc</param>
        /// <param name="excludeId">ID lịch chiếu cần loại trừ (dùng khi cập nhật)</param>
        /// <returns>True nếu phim không có lịch chiếu trùng thời gian ở phòng khác</returns>
        public async Task<bool> IsMovieAvailableAtTimeAsync(
            int movieId,
            int currentRoomId,
            DateTime date,
            TimeSpan startTime,
            TimeSpan endTime,
            int? excludeId = null)
        {
            try
            {
                _logger.LogInformation($"Checking if movie ID: {movieId} has conflicting showtimes in other rooms on {date.ToShortDateString()} from {startTime} to {endTime}");

                // Kiểm tra khung giờ hợp lệ
                if (startTime >= endTime)
                {
                    _logger.LogWarning("Invalid time range: start time must be before end time");
                    return false;
                }

                // Lấy danh sách các lịch chiếu của phim này trong cùng ngày, ở các phòng khác
                var showtimes = await _showtimeRepository
                    .GetAsync(s =>
                        s.Movie_ID == movieId &&
                        s.Cinema_Room_ID != currentRoomId && // Chỉ xét các phòng khác
                        s.Show_Date.Date == date.Date &&
                        s.Status != "Hidden" && // Không xét các lịch chiếu đã ẩn
                        (excludeId == null || s.Showtime_ID != excludeId));

                // Kiểm tra xem có bị trùng khung giờ không
                foreach (var showtime in showtimes)
                {
                    // Trùng lặp nếu thời gian bắt đầu hoặc kết thúc nằm trong khoảng thời gian của lịch chiếu khác
                    if ((startTime >= showtime.Start_Time && startTime < showtime.End_Time) ||
                        (endTime > showtime.Start_Time && endTime <= showtime.End_Time) ||
                        (startTime <= showtime.Start_Time && endTime >= showtime.End_Time))
                    {
                        _logger.LogWarning($"Movie has conflicting showtime ID: {showtime.Showtime_ID} in room ID: {showtime.Cinema_Room_ID}");
                        return false;
                    }
                }

                _logger.LogInformation("Movie does not have conflicting showtimes in other rooms");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking movie availability at time in other rooms");
                throw;
            }
        }

        /// <summary>
        /// Lấy danh sách lịch chiếu theo ID phim
        /// </summary>
        /// <param name="movieId">ID phim</param>
        /// <returns>Danh sách lịch chiếu của phim</returns>
        public async Task<IEnumerable<ShowtimeDto>> GetShowtimesByMovieIdAsync(int movieId)
        {
            try
            {
                _logger.LogInformation($"Getting showtimes for movie ID: {movieId}");

                var showtimes = await _showtimeRepository.GetAsync(s =>
                    s.Movie_ID == movieId &&
                    s.Status != "Hidden" &&
                    s.Show_Date >= DateTime.Today);

                var result = showtimes.Select(s => new ShowtimeDto
                {
                    Showtime_ID = s.Showtime_ID,
                    Movie_ID = s.Movie_ID,
                    Cinema_Room_ID = s.Cinema_Room_ID,
                    Room_Name = s.CinemaRoom?.Room_Name,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Price_Tier = s.Price_Tier,
                    Base_Price = s.Base_Price,
                    Status = s.Status
                }).OrderBy(s => s.Show_Date).ThenBy(s => s.Start_Time);

                _logger.LogInformation($"Found {result.Count()} showtimes for movie ID: {movieId}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting showtimes for movie ID: {movieId}");
                throw;
            }
        }

        /// <summary>
        /// Cập nhật trạng thái lịch chiếu
        /// </summary>
        /// <param name="id">ID lịch chiếu</param>
        /// <param name="status">Trạng thái mới</param>
        /// <param name="updatedBy">ID người cập nhật</param>
        /// <returns>True nếu thành công</returns>
        public async Task<bool> UpdateShowtimeStatusAsync(int id, string status, int updatedBy)
        {
            try
            {
                _logger.LogInformation($"Updating status of showtime ID: {id} to {status} by user ID: {updatedBy}");

                var showtime = await _showtimeRepository.GetByIdAsync(id);
                if (showtime == null)
                {
                    _logger.LogWarning($"Status update failed: Showtime with ID {id} not found");
                    return false;
                }

                // Kiểm tra trạng thái hợp lệ
                string[] validStatuses = { "Scheduled", "Running", "Completed", "Cancelled", "Hidden" };
                if (!validStatuses.Contains(status))
                {
                    _logger.LogWarning($"Invalid status: {status}");
                    throw new ArgumentException($"Trạng thái không hợp lệ: {status}");
                }

                // Cập nhật trạng thái
                showtime.Status = status;
                showtime.Updated_At = DateTime.UtcNow;

                bool result = await _showtimeRepository.UpdateAsync(id, showtime);
                if (result)
                {
                    _logger.LogInformation($"Successfully updated status of showtime ID: {id} to {status}");
                }
                else
                {
                    _logger.LogWarning($"Failed to update status of showtime ID: {id}");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating status of showtime ID: {id}");
                throw;
            }
        }
        /// <summary>
        /// Kiểm tra thời gian kết thúc lịch chiếu có hợp lệ không dựa trên thời lượng phim và thời gian nghỉ 15 phút
        /// </summary>
        /// <param name="startTime">Thời gian bắt đầu</param>
        /// <param name="endTime">Thời gian kết thúc</param>
        /// <param name="movieDuration">Thời lượng phim (phút)</param>
        /// <returns>True nếu hợp lệ, ngược lại trả về False</returns>
        private bool IsEndTimeValid(TimeSpan startTime, TimeSpan endTime, int movieDuration)
        {
            // Tính thời gian kết thúc dựa trên thời gian bắt đầu và thời lượng phim + 15 phút
            TimeSpan expectedEndTime = startTime.Add(TimeSpan.FromMinutes(movieDuration + 15));

            // So sánh thời gian kết thúc thực tế với thời gian kết thúc mong đợi
            if (endTime < expectedEndTime)
            {
                _logger.LogWarning($"Invalid end time: Expected at least {expectedEndTime}, but got {endTime}");
                return false;
            }

            return true;
        }

        public async Task<object> GetShowtimesByMovieAsync(int movieId)
        {
            var movie = await _context.Movies.FindAsync(movieId);
            if (movie == null)
                throw new KeyNotFoundException($"Không tìm thấy phim có ID {movieId}");

            var today = DateTime.Today;
            var showtimes = await _context.Showtimes
                .Where(s => s.Movie_ID == movieId && s.Show_Date.Date >= today && s.Status == "Scheduled")
                .Include(s => s.CinemaRoom)
                .OrderBy(s => s.Show_Date)
                .ThenBy(s => s.Start_Time)
                .ToListAsync();

            var result = showtimes
                .GroupBy(s => s.Show_Date.Date)
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    Show_Date = g.Key,
                    Day_Name = g.Key.ToString("dddd"),
                    Is_Today = g.Key == today,
                    Showtimes = g.Select(s => new
                    {
                        s.Showtime_ID,
                        s.Start_Time,
                        s.End_Time,
                        s.Price_Tier,
                        s.Base_Price,
                        s.Capacity_Available,
                        Room = new { s.CinemaRoom.Cinema_Room_ID, s.CinemaRoom.Room_Name, s.CinemaRoom.Room_Type },
                        Is_Almost_Full = s.Capacity_Available < (s.CinemaRoom.Seat_Quantity * 0.1)
                    }).ToList()
                }).ToList();

            return new
            {
                movie_id = movieId,
                movie_name = movie.Movie_Name,
                duration = movie.Duration,
                rating = movie.Rating,
                dates = result
            };
        }

        public async Task<object> GetShowtimesByRoomAsync(int roomId, DateTime? date = null)
        {
            var room = await _context.CinemaRooms.FindAsync(roomId);
            if (room == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu có ID {roomId}");

            DateTime queryDate = date?.Date ?? DateTime.Today;
            var showtimes = await _context.Showtimes
                .Where(s => s.Cinema_Room_ID == roomId && s.Show_Date.Date == queryDate)
                .Include(s => s.Movie)
                .OrderBy(s => s.Start_Time)
                .Select(s => new
                {
                    s.Showtime_ID,
                    s.Start_Time,
                    s.End_Time,
                    s.Status,
                    Movie = new { s.Movie.Movie_ID, s.Movie.Movie_Name, s.Movie.Duration, s.Movie.Poster_URL },
                    Bookings_Count = s.TicketBookings.Count(b => b.Status != "Cancelled")
                }).ToListAsync();

            var operatingHours = new { Start = TimeSpan.FromHours(9), End = TimeSpan.FromHours(23) };
            var freeSlots = new List<object>();
            TimeSpan currentTime = operatingHours.Start;

            foreach (var showtime in showtimes.OrderBy(s => s.Start_Time))
            {
                if (showtime.Start_Time > currentTime)
                {
                    freeSlots.Add(new
                    {
                        Start_Time = currentTime,
                        End_Time = showtime.Start_Time,
                        Duration = (showtime.Start_Time - currentTime).TotalMinutes
                    });
                }
                currentTime = showtime.End_Time;
            }

            if (currentTime < operatingHours.End)
            {
                freeSlots.Add(new
                {
                    Start_Time = currentTime,
                    End_Time = operatingHours.End,
                    Duration = (operatingHours.End - currentTime).TotalMinutes
                });
            }

            return new
            {
                room_id = roomId,
                room_name = room.Room_Name,
                room_type = room.Room_Type,
                date = queryDate.ToString("yyyy-MM-dd"),
                showtimes_count = showtimes.Count,
                showtimes = showtimes,
                available_slots = freeSlots
            };
        }

        public async Task<IEnumerable<DateTime>> GetShowtimeDatesAsync(int movieId)
        {
            var today = DateTime.Today;
            return await _context.Showtimes
                .Where(s => s.Movie_ID == movieId && s.Show_Date >= today && s.Status == "Scheduled")
                .Select(s => s.Show_Date.Date)
                .Distinct()
                .OrderBy(d => d)
                .ToListAsync();
        }

        public async Task<IEnumerable<ShowtimeDto>> GetShowtimesByDateAsync(int movieId, DateTime date)
        {
            var now = DateTime.Now.TimeOfDay;
            var today = DateTime.Today;
            var query = _context.Showtimes
                .Include(s => s.CinemaRoom)
                .Where(s => s.Movie_ID == movieId && s.Show_Date.Date == date.Date && s.Status == "Scheduled");

            if (date.Date == today)
                query = query.Where(s => s.Start_Time > now);

            var showtimes = await query
                .OrderBy(s => s.Start_Time)
                .Select(s => new ShowtimeDto
                {
                    Showtime_ID = s.Showtime_ID,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Price_Tier = s.Price_Tier,
                    Base_Price = s.Base_Price,
                    Room = new RoomDTO { Cinema_Room_ID = s.CinemaRoom.Cinema_Room_ID, Room_Name = s.CinemaRoom.Room_Name, Room_Type = s.CinemaRoom.Room_Type }
                }).ToListAsync();

            foreach (var showtime in showtimes)
            {
                var totalSeats = await _context.SeatLayouts.CountAsync(sl => sl.Cinema_Room_ID == showtime.Room.Cinema_Room_ID);
                var bookedSeats = await _context.Seats
                    .Include(s => s.TicketBooking)
                    .Where(s => s.TicketBooking != null && s.TicketBooking.Showtime_ID == showtime.Showtime_ID && s.TicketBooking.Status != "Cancelled")
                    .CountAsync();

                showtime.AvailableSeats = totalSeats - bookedSeats;
                showtime.TotalSeats = totalSeats;
            }

            return showtimes;
        }

        public async Task<IEnumerable<ShowtimeDto>> GetShowtimesByRequestAsync(ShowtimeRequestDTO request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request), "Yêu cầu không hợp lệ");

            var query = _context.Showtimes
                .Include(s => s.CinemaRoom)
                .Where(s => s.Movie_ID == request.MovieId && s.Status == "Scheduled");

            if (request.Date.HasValue)
            {
                var requestDate = request.Date.Value.Date;
                query = query.Where(s => s.Show_Date.Date == requestDate);
                if (requestDate == DateTime.Today)
                    query = query.Where(s => s.Start_Time > DateTime.Now.TimeOfDay);
            }
            else
            {
                var today = DateTime.Today;
                var now = DateTime.Now.TimeOfDay;
                query = query.Where(s => s.Show_Date > today || (s.Show_Date == today && s.Start_Time > now));
            }

            var showtimes = await query
                .OrderBy(s => s.Show_Date)
                .ThenBy(s => s.Start_Time)
                .Select(s => new ShowtimeDto
                {
                    Showtime_ID = s.Showtime_ID,
                    Movie_ID = s.Movie_ID,
                    Cinema_Room_ID = s.Cinema_Room_ID,
                    Room_Name = s.CinemaRoom.Room_Name,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Price_Tier = s.Price_Tier,
                    Base_Price = s.Base_Price,
                    Status = s.Status,
                    Room = new RoomDTO { Cinema_Room_ID = s.CinemaRoom.Cinema_Room_ID, Room_Name = s.CinemaRoom.Room_Name, Room_Type = s.CinemaRoom.Room_Type }
                }).ToListAsync();

            foreach (var showtime in showtimes)
            {
                var totalSeats = await _context.SeatLayouts.CountAsync(sl => sl.Cinema_Room_ID == showtime.Cinema_Room_ID);
                var bookedSeats = await _context.Seats
                    .Include(s => s.TicketBooking)
                    .Where(s => s.TicketBooking != null && s.TicketBooking.Showtime_ID == showtime.Showtime_ID && s.TicketBooking.Status != "Cancelled")
                    .CountAsync();

                showtime.AvailableSeats = totalSeats - bookedSeats;
                showtime.TotalSeats = totalSeats;
            }

            return showtimes;
        }

        public async Task<IEnumerable<RoomDTO>> GetRoomsAsync()
        {
            return await _context.CinemaRooms
                .Select(r => new RoomDTO { Cinema_Room_ID = r.Cinema_Room_ID, Room_Name = r.Room_Name, Room_Type = r.Room_Type })
                .ToListAsync();
        }

        public async Task<IEnumerable<ShowtimeDto>> GetShowtimesByRoomAndDateAsync(int roomId, DateTime date)
        {
            var now = DateTime.Now.TimeOfDay;
            var today = DateTime.Today;
            var query = _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Where(s => s.Cinema_Room_ID == roomId && s.Show_Date.Date == date.Date && s.Status == "Scheduled");

            if (date.Date == today)
                query = query.Where(s => s.Start_Time > now);

            var showtimes = await query
                .OrderBy(s => s.Start_Time)
                .Select(s => new ShowtimeDto
                {
                    Showtime_ID = s.Showtime_ID,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Price_Tier = s.Price_Tier,
                    Base_Price = s.Base_Price,
                    Room = new RoomDTO { Cinema_Room_ID = s.CinemaRoom.Cinema_Room_ID, Room_Name = s.CinemaRoom.Room_Name, Room_Type = s.CinemaRoom.Room_Type },
                    Movie = new MovieInfoDTO { Movie_ID = s.Movie.Movie_ID, Movie_Name = s.Movie.Movie_Name, Duration = s.Movie.Duration, Rating = s.Movie.Rating, Poster_URL = s.Movie.Poster_URL }
                }).ToListAsync();

            foreach (var showtime in showtimes)
            {
                var totalSeats = await _context.SeatLayouts.CountAsync(sl => sl.Cinema_Room_ID == roomId);
                var bookedSeats = await _context.Seats
                    .Include(s => s.TicketBooking)
                    .Where(s => s.TicketBooking != null && s.TicketBooking.Showtime_ID == showtime.Showtime_ID && s.TicketBooking.Status != "Cancelled")
                    .CountAsync();

                showtime.AvailableSeats = totalSeats - bookedSeats;
                showtime.TotalSeats = totalSeats;
            }

            return showtimes;
        }

        public async Task<IEnumerable<ShowtimeDto>> GetShowtimesByMovieForAdminAsync(int movieId)
        {
            var showtimes = await _context.Showtimes
                .Include(s => s.CinemaRoom)
                .Where(s => s.Movie_ID == movieId)
                .OrderBy(s => s.Show_Date)
                .ThenBy(s => s.Start_Time)
                .Select(s => new ShowtimeDto
                {
                    Showtime_ID = s.Showtime_ID,
                    Movie_ID = s.Movie_ID,
                    Cinema_Room_ID = s.Cinema_Room_ID,
                    Room_Name = s.CinemaRoom.Room_Name,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Price_Tier = s.Price_Tier,
                    Base_Price = s.Base_Price,
                    Status = s.Status,
                    Room = new RoomDTO { Cinema_Room_ID = s.CinemaRoom.Cinema_Room_ID, Room_Name = s.CinemaRoom.Room_Name, Room_Type = s.CinemaRoom.Room_Type }
                }).ToListAsync();

            foreach (var showtime in showtimes)
            {
                var totalSeats = await _context.SeatLayouts.CountAsync(sl => sl.Cinema_Room_ID == showtime.Cinema_Room_ID);
                var bookedSeats = await _context.Seats
                    .Include(s => s.TicketBooking)
                    .Where(s => s.TicketBooking != null && s.TicketBooking.Showtime_ID == showtime.Showtime_ID && s.TicketBooking.Status != "Cancelled")
                    .CountAsync();

                showtime.AvailableSeats = totalSeats - bookedSeats;
                showtime.TotalSeats = totalSeats;
            }

            return showtimes;
        }

        private ShowtimeDto MapToShowtimeDto(Showtime showtime, string roomName)
        {
            return new ShowtimeDto
            {
                Showtime_ID = showtime.Showtime_ID,
                Movie_ID = showtime.Movie_ID,
                Cinema_Room_ID = showtime.Cinema_Room_ID,
                Room_Name = roomName,
                Show_Date = showtime.Show_Date,
                Start_Time = showtime.Start_Time,
                End_Time = showtime.End_Time,
                Price_Tier = showtime.Price_Tier,
                Base_Price = showtime.Base_Price,
                Status = showtime.Status,
                Room = new RoomDTO { Cinema_Room_ID = showtime.Cinema_Room_ID, Room_Name = roomName, Room_Type = _context.CinemaRooms.First(r => r.Cinema_Room_ID == showtime.Cinema_Room_ID).Room_Type }
            };
        }
    }
}
