using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using STP.Repository.Models;
using STP.Repository.DTOs;
<<<<<<< HEAD
using STP.Repository.Dtos; 
using STP.Repositories;
=======
using STP.Repository.Repositories;
using STP.Repository.Data;
>>>>>>> ee6f79ee8a6fc14ddf838526ed48ef22d04ca912

namespace STP.Service.Services
{
    public class ShowtimeService
    {
        private readonly ShowtimeRepository _showtimeRepository;
<<<<<<< HEAD

        public ShowtimeService(ShowtimeRepository showtimeRepository)
        {
            _showtimeRepository = showtimeRepository;
=======
        private readonly CinemaDbContext _context;
        public ShowtimeService(ShowtimeRepository showtimeRepository, CinemaDbContext context)
        {
            _showtimeRepository = showtimeRepository;
            _context = context;
>>>>>>> ee6f79ee8a6fc14ddf838526ed48ef22d04ca912
        }

        public async Task<IEnumerable<ShowtimeDto>> GetAllShowtimesAsync()
        {
            var showtimes = await _showtimeRepository.GetAllAsync();
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

        public async Task<ShowtimeDto> GetShowtimeByIdAsync(int id)
        {
            var showtime = await _showtimeRepository.GetByIdAsync(id);
            if (showtime == null) return null;

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

        public async Task<int> CreateShowtimeAsync(ShowtimeCreateDto showtimeDto, int createdBy)
        {
            // Kiểm tra khung giờ
            bool isAvailable = await IsShowtimeAvailableAsync(
                showtimeDto.Cinema_Room_ID,
                showtimeDto.Show_Date,
                showtimeDto.Start_Time,
                showtimeDto.End_Time);

            if (!isAvailable)
            {
                throw new InvalidOperationException("Thời gian chiếu đã trùng với lịch chiếu khác trong phòng này.");
            }

            // Chuyển từ DTO sang entity
            var showtime = new Showtime
            {
                Movie_ID = showtimeDto.Movie_ID,
                Cinema_Room_ID = showtimeDto.Cinema_Room_ID,
                Show_Date = EnsureSqlDateTimeCompatible(showtimeDto.Show_Date),
                Start_Time = showtimeDto.Start_Time,
                End_Time = showtimeDto.End_Time,
                Price_Tier = showtimeDto.Price_Tier,
                Base_Price = showtimeDto.Base_Price,
                Capacity_Available = showtimeDto.Capacity_Available,
                Created_By = createdBy,
                Created_At = EnsureSqlDateTimeCompatible(DateTime.Now),
                Status = "Scheduled",
                Updated_At = EnsureSqlDateTimeCompatible(DateTime.Now)
            };


            return await _showtimeRepository.CreateAsync(showtime);
        }

<<<<<<< HEAD
=======
        public async Task<bool> UpdateShowtimeAsync(int id, ShowtimeUpdateDto showtimeDto, int updatedBy)
        {
            // Kiểm tra xem lịch chiếu có tồn tại không
            var existingShowtime = await _showtimeRepository.GetByIdAsync(id);
            if (existingShowtime == null)
                return false;

            // Kiểm tra xem lịch chiếu đã bắt đầu chưa
            if (existingShowtime.Status == "Running" || existingShowtime.Status == "Completed")
                throw new InvalidOperationException("Không thể chỉnh sửa lịch chiếu đã bắt đầu hoặc đã kết thúc");

            // Kiểm tra xem khung giờ mới có trùng với lịch chiếu khác không
            bool isAvailable = await IsShowtimeAvailableAsync(
                showtimeDto.Cinema_Room_ID,
                showtimeDto.Show_Date,
                showtimeDto.Start_Time,
                showtimeDto.End_Time,
                id); // excludeId = id để bỏ qua chính lịch chiếu đang cập nhật

            if (!isAvailable)
                throw new InvalidOperationException("Thời gian chiếu đã trùng với lịch chiếu khác trong phòng này");

            // Cập nhật dữ liệu
            var showtime = new Showtime
            {
                Movie_ID = showtimeDto.Movie_ID,
                Cinema_Room_ID = showtimeDto.Cinema_Room_ID,
                Show_Date = EnsureSqlDateTimeCompatible(showtimeDto.Show_Date),
                Start_Time = showtimeDto.Start_Time,
                End_Time = showtimeDto.End_Time,
                Price_Tier = showtimeDto.Price_Tier,
                Base_Price = showtimeDto.Base_Price,
                Capacity_Available = showtimeDto.Capacity_Available,
                Status = existingShowtime.Status,
                Updated_At = EnsureSqlDateTimeCompatible(DateTime.Now)
            };


            return await _showtimeRepository.UpdateAsync(id, showtime);
        }

        /// <summary>
        /// Ẩn lịch chiếu bằng cách đổi trạng thái thành Hidden
        /// </summary>
        public async Task<bool> HideShowtimeAsync(int id, int userId)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // 1. Lấy thông tin Showtime
                    var showtime = await _showtimeRepository.GetByIdAsync(id);
                    if (showtime == null)
                        return false;

                    // 2. Cập nhật trạng thái của Showtime thành "Hidden"
                    showtime.Status = "Hidden";  // hoặc bạn có thể dùng "Inactive", "Disabled" tùy theo yêu cầu
                    showtime.Updated_At = DateTime.UtcNow;
                    await _showtimeRepository.UpdateAsync(id, showtime);

                    await transaction.CommitAsync();
                    return true;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();

                    // Log chi tiết lỗi
                    Console.WriteLine($"Error: {ex.Message}");
                    if (ex.InnerException != null)
                        Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                    return false;
                }
            }
        }
>>>>>>> ee6f79ee8a6fc14ddf838526ed48ef22d04ca912

        private DateTime EnsureSqlDateTimeCompatible(DateTime date)
        {
            // SQL Server datetime có phạm vi từ 1753-01-01 đến 9999-12-31
            DateTime sqlMinDate = new DateTime(1753, 1, 1);
            DateTime sqlMaxDate = new DateTime(9999, 12, 31);

            if (date < sqlMinDate)
                return sqlMinDate;
            if (date > sqlMaxDate)
                return sqlMaxDate;

            // Chỉ lấy phần ngày, bỏ qua giờ/phút/giây
            return new DateTime(date.Year, date.Month, date.Day);
        }

        public async Task<bool> IsShowtimeAvailableAsync(
            int cinemaRoomId,
            DateTime date,
            TimeSpan startTime,
            TimeSpan endTime,
            int? excludeId = null)
        {
            // Kiểm tra khung giờ hợp lệ
            if (startTime >= endTime)
                return false;

            // Lấy danh sách các lịch chiếu trong cùng ngày, cùng phòng
            var showtimes = await _showtimeRepository
                .GetAsync(s =>
                    s.Cinema_Room_ID == cinemaRoomId &&
                    s.Show_Date.Date == date.Date &&
                    (excludeId == null || s.Showtime_ID != excludeId));

            // Kiểm tra xem có bị trùng khung giờ không
            foreach (var showtime in showtimes)
            {
                // Trùng lặp nếu thời gian bắt đầu hoặc kết thúc nằm trong khoảng thời gian của lịch chiếu khác
                if ((startTime >= showtime.Start_Time && startTime < showtime.End_Time) ||
                    (endTime > showtime.Start_Time && endTime <= showtime.End_Time) ||
                    (startTime <= showtime.Start_Time && endTime >= showtime.End_Time))
                {
                    return false;
                }
            }

            return true;
        }
    }
}
