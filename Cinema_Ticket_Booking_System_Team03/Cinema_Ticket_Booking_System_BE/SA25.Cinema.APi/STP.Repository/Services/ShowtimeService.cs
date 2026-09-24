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
    using STP.APIService.Services;
    using Microsoft.EntityFrameworkCore.Storage;

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
            private readonly SeatService _seatService;

            /// <summary>
            /// Khởi tạo dịch vụ quản lý lịch chiếu
            /// </summary>
            /// <param name="showtimeRepository">Repository xử lý dữ liệu lịch chiếu</param>
            /// <param name="context">Context database</param>
            /// <param name="logger">Logger ghi nhật ký</param>
            public ShowtimeService(ShowtimeRepository showtimeRepository, CinemaDbContext context, ILogger<ShowtimeService> logger, SeatService seatService)
            {
                _showtimeRepository = showtimeRepository;
                _context = context;
                _logger = logger;
                _seatService = seatService;
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
            /// Tạo suất chiếu mới và tạo ghế tương ứng
            /// </summary>
            /// <param name="model">Thông tin suất chiếu</param>
            /// <param name="userId">ID người tạo</param>
            /// <param name="existingTransaction">Transaction đã tồn tại (nếu có)</param>
            /// <returns>Thông tin suất chiếu đã tạo</returns>
            public async Task<ShowtimeDto> CreateShowtimeAsync(ShowtimeCreateDto model, int userId, IDbContextTransaction existingTransaction = null)
            {
                // Log thông tin đầu vào
                _logger.LogInformation($"Bắt đầu tạo xuất chiếu - Phim ID: {model.Movie_ID}, Phòng ID: {model.Cinema_Room_ID}, Ngày: {model.Show_Date}, Giờ bắt đầu: {model.Start_Time}");

                if (model == null)
                    throw new ArgumentException("Dữ liệu không hợp lệ");

                // Kiểm tra xuất chiếu đã tồn tại
                var existingShowtime = await _context.Showtimes
                    .FirstOrDefaultAsync(s =>
                        s.Movie_ID == model.Movie_ID &&
                        s.Cinema_Room_ID == model.Cinema_Room_ID &&
                        s.Show_Date.Date == model.Show_Date.Date &&
                        s.Start_Time == model.Start_Time &&
                        s.Status != "Hidden");

                if (existingShowtime != null)
                {
                    _logger.LogWarning($"Xuất chiếu đã tồn tại - Phim ID: {model.Movie_ID}, Phòng ID: {model.Cinema_Room_ID}, Ngày: {model.Show_Date}, Giờ bắt đầu: {model.Start_Time}");
                    throw new InvalidOperationException("Xuất chiếu đã tồn tại trong hệ thống");
                }

                // Kiểm tra phim
                var movie = await _context.Movies.FindAsync(model.Movie_ID);
                if (movie == null)
                {
                    _logger.LogWarning($"Không tìm thấy phim có ID {model.Movie_ID}");
                    throw new ArgumentException($"Không tìm thấy phim có ID {model.Movie_ID}");
                }

                // Kiểm tra phòng chiếu
                var cinemaRoom = await _context.CinemaRooms.FindAsync(model.Cinema_Room_ID);
                if (cinemaRoom == null)
                {
                    _logger.LogWarning($"Không tìm thấy phòng chiếu có ID {model.Cinema_Room_ID}");
                    throw new ArgumentException($"Không tìm thấy phòng chiếu có ID {model.Cinema_Room_ID}");
                }

                // Kiểm tra trạng thái phòng chiếu
                if (cinemaRoom.Status != "Active")
                {
                    _logger.LogWarning($"Phòng chiếu {model.Cinema_Room_ID} không hoạt động");
                    throw new ArgumentException("Phòng chiếu không hoạt động");
                }

                // THÊM MỚI: Kiểm tra kỹ hơn về thời gian chiếu - không được là quá khứ
                var now = DateTime.Now;
                var showDateTime = model.Show_Date.Date.Add(model.Start_Time);

                if (showDateTime < now)
                {
                    _logger.LogWarning($"Thời gian chiếu không hợp lệ: {showDateTime} là thời điểm đã qua ({now})");
                    throw new ArgumentException($"Không thể tạo xuất chiếu trong quá khứ. Thời gian chiếu phải sau thời điểm hiện tại.");
                }

                // Tính toán thời gian kết thúc
                TimeSpan suggestedEndTime = model.Start_Time.Add(TimeSpan.FromMinutes(movie.Duration + 15));

                _logger.LogInformation($"Thời gian kết thúc đề xuất cho suất chiếu: {suggestedEndTime}. " +
                                       $"Dựa trên thời lượng phim {movie.Duration} phút + thêm 15 phút");

                TimeSpan endTime = suggestedEndTime;

                // THÊM MỚI: Kiểm tra thời gian kết thúc không vượt quá giờ đóng cửa (00:00)
                TimeSpan closingTime = new TimeSpan(23, 59, 59); // 23:59:59 - cuối ngày
                if (endTime > closingTime)
                {
                    _logger.LogWarning($"Thời gian kết thúc {endTime} vượt quá giờ đóng cửa {closingTime}");
                    throw new InvalidOperationException($"Không thể tạo xuất chiếu kết thúc sau giờ đóng cửa (00:00). Với thời lượng phim {movie.Duration} phút, giờ bắt đầu muộn nhất có thể là {closingTime.Subtract(TimeSpan.FromMinutes(movie.Duration + 15)).ToString(@"hh\:mm")}.");
                }

                // Kiểm tra trùng lịch
                var conflictingShowtimes = await _context.Showtimes
                    .Where(s => s.Cinema_Room_ID == model.Cinema_Room_ID &&
                           s.Show_Date.Date == model.Show_Date.Date &&
                           s.Status != "Hidden" &&
                           model.Start_Time < s.End_Time && s.Start_Time < endTime) // Công thức kiểm tra giao nhau đơn giản và chính xác hơn
                    .ToListAsync();

                // Log các xuất chiếu trùng lịch
                if (conflictingShowtimes.Any())
                {
                    _logger.LogWarning($"Tìm thấy {conflictingShowtimes.Count} xuất chiếu xung đột:");
                    foreach (var conflict in conflictingShowtimes)
                    {
                        _logger.LogWarning($"Xuất chiếu xung đột - ID: {conflict.Showtime_ID}, " +
                                           $"Trạng thái: {conflict.Status}, " +
                                           $"Giờ bắt đầu: {conflict.Start_Time}, " +
                                           $"Giờ kết thúc: {conflict.End_Time}");
                    }
                    throw new InvalidOperationException("Suất chiếu bị trùng lịch với suất chiếu khác trong cùng phòng");
                }

                // Xác định xem cần tạo transaction mới hay sử dụng transaction được truyền vào
                IDbContextTransaction transaction = null;
                bool ownTransaction = false;

                try
                {
                    // Kiểm tra số lượng layout ghế của phòng
                    var seatLayoutCount = await _context.SeatLayouts
                        .CountAsync(sl => sl.Cinema_Room_ID == model.Cinema_Room_ID && sl.Is_Active);

                    if (seatLayoutCount == 0)
                    {
                        _logger.LogWarning($"Phòng chiếu {model.Cinema_Room_ID} chưa được cấu hình ghế ngồi");
                        throw new InvalidOperationException("Phòng chiếu chưa được cấu hình ghế ngồi");
                    }

                    // Xác định transaction
                    if (existingTransaction == null)
                    {
                        // Nếu không có transaction được truyền vào, tạo mới
                        transaction = await _context.Database.BeginTransactionAsync();
                        ownTransaction = true;
                    }
                    else
                    {
                        // Sử dụng transaction được truyền vào
                        transaction = existingTransaction;
                    }

                    // Tạo xuất chiếu mới
                    var showtime = new Showtime
                    {
                        Movie_ID = model.Movie_ID,
                        Cinema_Room_ID = model.Cinema_Room_ID,
                        Show_Date = model.Show_Date,
                        Start_Time = model.Start_Time,
                        End_Time = endTime,
                        Price_Tier = model.Price_Tier ?? "Normal",
                        Base_Price = model.Base_Price > 0 ? model.Base_Price : 90000,
                        Status = "Scheduled",
                        Capacity_Available = seatLayoutCount,
                        Created_By = userId,
                        Created_At = DateTime.Now,
                        Updated_At = DateTime.Now
                    };

                    _context.Showtimes.Add(showtime);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Tạo xuất chiếu thành công - ID: {showtime.Showtime_ID}");

                    // Tạo ghế cho suất chiếu
                    try
                    {
                        int seatsCreated = await _seatService.CreateSeatsForShowtimeAsync(showtime.Showtime_ID);
                        _logger.LogInformation($"Đã tạo {seatsCreated} ghế cho xuất chiếu ID: {showtime.Showtime_ID}");

                        // Cập nhật lại số ghế khả dụng (nếu cần)
                        if (showtime.Capacity_Available != seatsCreated && seatsCreated > 0)
                        {
                            showtime.Capacity_Available = seatsCreated;
                            await _context.SaveChangesAsync();
                            _logger.LogInformation($"Đã cập nhật số ghế khả dụng cho xuất chiếu: {seatsCreated}");
                        }
                    }
                    catch (Exception ex)
                    {
                        // Ghi log nhưng không ném lỗi, vì không muốn làm gián đoạn quá trình tạo showtime
                        _logger.LogError(ex, $"Lỗi khi tạo ghế cho xuất chiếu ID: {showtime.Showtime_ID}");
                    }

                    // Cập nhật trạng thái phim nếu cần
                    if (movie.Status == "Coming Soon" && model.Show_Date.Date <= DateTime.Today)
                    {
                        movie.Status = "Now Showing";
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Cập nhật trạng thái phim {movie.Movie_Name} thành Now Showing");
                    }

                    // Chỉ commit transaction nếu chúng ta tạo ra nó
                    if (ownTransaction)
                    {
                        await transaction.CommitAsync();
                        _logger.LogInformation($"Hoàn tất tạo xuất chiếu ID: {showtime.Showtime_ID}");
                    }

                    return MapToShowtimeDto(showtime, cinemaRoom.Room_Name);
                }
                catch (Exception ex)
                {
                    // Chỉ rollback transaction nếu chúng ta tạo ra nó
                    if (transaction != null && ownTransaction)
                    {
                        await transaction.RollbackAsync();
                    }
                    _logger.LogError(ex, $"Lỗi khi lưu xuất chiếu - Chi tiết: {ex.Message}");
                    throw new Exception($"Không thể tạo xuất chiếu: {ex.Message}", ex);
                }
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

                // THÊM MỚI: Kiểm tra kỹ hơn về thời gian chiếu - không được là quá khứ
                var now = DateTime.Now;
                var showDateTime = showtimeDto.Show_Date.Date.Add(showtimeDto.Start_Time);

                if (showDateTime < now)
                {
                    _logger.LogWarning($"Thời gian chiếu không hợp lệ: {showDateTime} là thời điểm đã qua ({now})");
                    throw new ArgumentException($"Không thể cập nhật xuất chiếu vào thời điểm trong quá khứ. Thời gian chiếu phải sau thời điểm hiện tại.");
                }

                // Tính toán thời gian kết thúc tự động
                TimeSpan suggestedEndTime = showtimeDto.Start_Time.Add(TimeSpan.FromMinutes(movie.Duration + 15));

                _logger.LogInformation($"Thời gian kết thúc đề xuất cho suất chiếu: {suggestedEndTime}. " +
                                       $"Dựa trên thời lượng phim {movie.Duration} phút + thêm 15 phút");

                TimeSpan endTime = suggestedEndTime;

                // THÊM MỚI: Kiểm tra thời gian kết thúc không vượt quá giờ đóng cửa (00:00)
                TimeSpan closingTime = new TimeSpan(23, 59, 59); // 23:59:59 - cuối ngày
                if (endTime > closingTime)
                {
                    _logger.LogWarning($"Thời gian kết thúc {endTime} vượt quá giờ đóng cửa {closingTime}");
                    throw new InvalidOperationException($"Không thể cập nhật xuất chiếu kết thúc sau giờ đóng cửa (00:00). Với thời lượng phim {movie.Duration} phút, giờ bắt đầu muộn nhất có thể là {closingTime.Subtract(TimeSpan.FromMinutes(movie.Duration + 15)).ToString(@"hh\:mm")}.");
                }

                // Kiểm tra thời gian kết thúc có hợp lệ không
                if (!IsEndTimeValid(showtimeDto.Start_Time, endTime, movie.Duration))
                {
                    throw new InvalidOperationException("Thời gian kết thúc không hợp lệ. Vui lòng đảm bảo thời gian chiếu đủ thời lượng phim và thêm 15 phút nghỉ.");
                }

                // Kiểm tra nếu đang đặt trạng thái thành "Scheduled" 
                if (showtimeDto.Status == "Scheduled")
                {
                    // Tạo DateTime kết hợp ngày chiếu và giờ bắt đầu
                    var showDate = showtimeDto.Show_Date.Date; // Đảm bảo chỉ lấy phần ngày
                    var showTime = DateTime.Today.Add(showtimeDto.Start_Time); // Lấy phần giờ
                    var combinedDateTime = new DateTime(
                        showDate.Year, showDate.Month, showDate.Day,
                        showTime.Hour, showTime.Minute, showTime.Second
                    );

                    var dayNow = DateTime.Now;

                    _logger.LogInformation($"Kiểm tra thời gian chiếu: ShowTime={combinedDateTime}, CurrentTime={dayNow}");

                    if (combinedDateTime <= dayNow)
                    {
                        _logger.LogWarning($"Cannot set status to Scheduled: Showtime ID {id} has show time ({showDateTime}) that has already passed current time ({now})");
                        throw new InvalidOperationException($"Không thể đặt trạng thái 'Scheduled' cho suất chiếu đã qua. Thời gian chiếu: {showDateTime:yyyy-MM-dd HH:mm:ss}, Thời gian hiện tại: {now:yyyy-MM-dd HH:mm:ss}");
                    }
                }

                // Kiểm tra xem khung giờ mới có trùng với lịch chiếu khác trong cùng phòng không
                bool isRoomAvailable = await IsShowtimeAvailableAsync(
                    showtimeDto.Cinema_Room_ID,
                    showtimeDto.Show_Date,
                    showtimeDto.Start_Time,
                    endTime,
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
                existingShowtime.End_Time = endTime; // Sử dụng endTime được tính toán tự động
                existingShowtime.Price_Tier = showtimeDto.Price_Tier;
                existingShowtime.Base_Price = showtimeDto.Base_Price;
                existingShowtime.Capacity_Available = showtimeDto.Capacity_Available;

                // Cập nhật trạng thái nếu có thay đổi
                if (!string.IsNullOrEmpty(showtimeDto.Status))
                {
                    existingShowtime.Status = showtimeDto.Status;
                }

                // Cập nhật thông tin thay đổi
                existingShowtime.Updated_At = DateTime.Now;

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
        /// <summary>
        /// Ẩn lịch chiếu bằng cách đổi trạng thái thành Hidden
        /// </summary>
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

                            // 2. THÊM MỚI: Kiểm tra có booking nào đang pending không
                            var pendingBookings = await _context.TicketBookings
                                .Where(b => b.Showtime_ID == id && b.Status == "Pending")
                                .ToListAsync();

                            if (pendingBookings.Any())
                            {
                                _logger.LogWarning($"Cannot hide showtime ID {id}: There are {pendingBookings.Count} pending bookings");
                                throw new InvalidOperationException($"Không thể ẩn suất chiếu này vì có {pendingBookings.Count} đơn đặt vé đang chờ thanh toán. Vui lòng đợi các đơn đặt vé được hoàn tất hoặc hủy trước.");
                            }

                            // 3. Cập nhật trạng thái của Showtime thành "Hidden"
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

                            throw; // Ném lại ngoại lệ để controller xử lý
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

                    // THÊM MỚI: Kiểm tra thời gian chiếu không ở quá khứ
                    var showDateTime = date.Date.Add(startTime);
                    if (showDateTime < DateTime.Now)
                    {
                        _logger.LogWarning($"Showtime {showDateTime} is in the past");
                        return false;
                    }

                    // THÊM MỚI: Kiểm tra thời gian kết thúc không vượt quá giờ đóng cửa (00:00)
                    TimeSpan closingTime = new TimeSpan(23, 59, 59); // 23:59:59 - cuối ngày
                    if (endTime > closingTime)
                    {
                        _logger.LogWarning($"End time {endTime} exceeds cinema closing time {closingTime}");
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

                    // Kiểm tra xem có bị trùng khung giờ không
                    foreach (var showtime in showtimes)
                    {
                        // Kiểm tra xung đột thời gian - Công thức đơn giản và chính xác hơn
                        if (startTime < showtime.End_Time && showtime.Start_Time < endTime)
                        {
                            _logger.LogWarning($"Time slot conflicts with existing showtime ID: {showtime.Showtime_ID} in the same room");
                            return false;
                        }

                        // Kiểm tra khoảng cách 15 phút giữa các suất chiếu
                        if (startTime >= showtime.End_Time && (startTime - showtime.End_Time) < gap)
                        {
                            _logger.LogWarning($"New showtime starts too soon after existing showtime ID: {showtime.Showtime_ID}. Gap: {(startTime - showtime.End_Time).TotalMinutes} minutes");
                            return false;
                        }

                        if (endTime <= showtime.Start_Time && (showtime.Start_Time - endTime) < gap)
                        {
                            _logger.LogWarning($"New showtime ends too close before existing showtime ID: {showtime.Showtime_ID}. Gap: {(showtime.Start_Time - endTime).TotalMinutes} minutes");
                            return false;
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
            /// <summary>
            /// Kiểm tra xem phim có lịch chiếu trùng thời gian ở phòng khác không
            /// </summary>
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

                    // THÊM MỚI: Kiểm tra thời gian chiếu không ở quá khứ
                    var showDateTime = date.Date.Add(startTime);
                    if (showDateTime < DateTime.Now)
                    {
                        _logger.LogWarning($"Showtime {showDateTime} is in the past");
                        return false;
                    }

                    // THÊM MỚI: Kiểm tra thời gian kết thúc không vượt quá giờ đóng cửa (00:00)
                    TimeSpan closingTime = new TimeSpan(23, 59, 59); // 23:59:59 - cuối ngày
                    if (endTime > closingTime)
                    {
                        _logger.LogWarning($"End time {endTime} exceeds cinema closing time {closingTime}");
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
                        // Sử dụng công thức kiểm tra giao nhau đơn giản hơn
                        if (startTime < showtime.End_Time && showtime.Start_Time < endTime)
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
            /// <summary>
            /// Kiểm tra thời gian kết thúc lịch chiếu có hợp lệ không dựa trên thời lượng phim và thời gian nghỉ 15 phút
            /// </summary>
            private bool IsEndTimeValid(TimeSpan startTime, TimeSpan endTime, int movieDuration)
            {
                // Tính thời gian kết thúc dựa trên thời gian bắt đầu và thời lượng phim + 15 phút
                TimeSpan expectedEndTime = startTime.Add(TimeSpan.FromMinutes(movieDuration + 15));

                // Kiểm tra thời gian kết thúc không quá 23:59:59
                TimeSpan closingTime = new TimeSpan(23, 59, 59);
                if (expectedEndTime > closingTime)
                {
                    _logger.LogWarning($"Expected end time {expectedEndTime} exceeds cinema closing time {closingTime}");
                    return false;
                }

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
                    .Where(s => s.Movie_ID == movieId && s.Show_Date.Date >= today && (s.Status == "Scheduled" || s.Status == "Active"))
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
                            s.Status,
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

            /// <summary>
            /// Tự động ẩn các suất chiếu đã qua thời gian chiếu
            /// </summary>
            /// <returns>Số lượng suất chiếu đã được ẩn</returns>
            public async Task<int> AutoHideExpiredShowtimesAsync()
            {
                try
                {
                    _logger.LogInformation("Bắt đầu tự động ẩn các suất chiếu đã hết hạn");

                    var now = DateTime.Now;
                    var today = DateTime.Today;

                    // Lấy danh sách các suất chiếu đã qua thời gian chiếu nhưng chưa được ẩn
                    var expiredShowtimes = await _context.Showtimes
                        .Where(s =>
                            s.Status != "Hidden" &&
                            s.Status != "Cancelled" &&
                            ((s.Show_Date.Date < today) ||
                            (s.Show_Date.Date == today && s.End_Time < now.TimeOfDay)))
                        .ToListAsync();

                    if (!expiredShowtimes.Any())
                    {
                        _logger.LogInformation("Không có suất chiếu nào đã hết hạn cần ẩn");
                        return 0;
                    }

                    _logger.LogInformation($"Tìm thấy {expiredShowtimes.Count} suất chiếu đã hết hạn cần ẩn");

                    using (var transaction = await _context.Database.BeginTransactionAsync())
                    {
                        try
                        {
                            // Cập nhật trạng thái của tất cả suất chiếu đã qua
                            foreach (var showtime in expiredShowtimes)
                            {
                                showtime.Status = "Hidden";
                                showtime.Updated_At = DateTime.Now;

                                _logger.LogInformation($"Ẩn suất chiếu ID: {showtime.Showtime_ID}, " +
                                    $"Phim: {showtime.Movie_ID}, " +
                                    $"Ngày chiếu: {showtime.Show_Date.ToShortDateString()}, " +
                                    $"Giờ chiếu: {showtime.Start_Time}");
                            }

                            await _context.SaveChangesAsync();
                            await transaction.CommitAsync();

                            _logger.LogInformation($"Đã ẩn thành công {expiredShowtimes.Count} suất chiếu đã hết hạn");
                            return expiredShowtimes.Count;
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync();
                            _logger.LogError(ex, "Lỗi khi ẩn các suất chiếu đã hết hạn");
                            throw;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tự động ẩn các suất chiếu đã hết hạn");
                    throw;
                }
            }

        /// <summary>
        /// Tự động tạo lịch chiếu cho nhiều phim trong một ngày
        /// </summary>
        /// <param name="request">Thông tin yêu cầu lịch chiếu</param>
        /// <param name="userId">ID người dùng tạo lịch</param>
        /// <returns>Danh sách lịch chiếu được tạo</returns>
        public async Task<AutoScheduleResult> AutoScheduleShowtimesAsync(AutoScheduleRequest request, int userId)
        {
            if (request == null || request.Movies == null || !request.Movies.Any())
                throw new ArgumentException("Dữ liệu yêu cầu không hợp lệ");

            if (request.ShowDate.Date < DateTime.Today)
                throw new ArgumentException("Ngày chiếu phải từ hôm nay trở đi");

            var cinemaRoom = await _context.CinemaRooms.FindAsync(request.CinemaRoomId);
            if (cinemaRoom == null)
                throw new ArgumentException($"Không tìm thấy phòng chiếu có ID {request.CinemaRoomId}");

            if (cinemaRoom.Status != "Active")
                throw new ArgumentException("Phòng chiếu không hoạt động");

            // Lấy thông tin phim từ database
            var movieIds = request.Movies.Select(m => m.MovieId).ToList();
            var movies = await _context.Movies
                .Where(m => movieIds.Contains(m.Movie_ID))
                .ToDictionaryAsync(m => m.Movie_ID, m => m);

            if (movies.Count < movieIds.Count)
                throw new ArgumentException("Một số phim không tồn tại trong hệ thống");

            // Kiểm tra các phim đã có trong database
            foreach (var movieInput in request.Movies)
            {
                if (!movies.ContainsKey(movieInput.MovieId))
                    throw new ArgumentException($"Không tìm thấy phim có ID {movieInput.MovieId}");

                if (movieInput.ShowtimeCount <= 0)
                    throw new ArgumentException($"Số lượng suất chiếu của phim {movies[movieInput.MovieId].Movie_Name} phải lớn hơn 0");
            }

            // Lấy danh sách lịch chiếu hiện có của phòng trong ngày
            var existingShowtimes = await _context.Showtimes
                .Where(s => s.Cinema_Room_ID == request.CinemaRoomId &&
                       s.Show_Date.Date == request.ShowDate.Date &&
                       s.Status != "Hidden" && s.Status != "Cancelled")
                .ToListAsync();

            // Tạo danh sách tất cả suất chiếu cần sắp xếp
            var allShowtimesToSchedule = new List<(int MovieId, int Duration, string MovieName)>();
            foreach (var movieInput in request.Movies)
            {
                var movie = movies[movieInput.MovieId];
                for (int i = 0; i < movieInput.ShowtimeCount; i++)
                {
                    allShowtimesToSchedule.Add((movie.Movie_ID, movie.Duration, movie.Movie_Name));
                }
            }

            // Random danh sách suất chiếu
            var random = new Random();
            allShowtimesToSchedule = allShowtimesToSchedule.OrderBy(x => random.Next()).ToList();

            // THAY ĐỔI: Thiết lập khung giờ hoạt động của rạp (9:00 - 00:00)
            TimeSpan defaultOpenTime = new TimeSpan(9, 0, 0); // 9:00 sáng - giờ mở cửa mặc định
            TimeSpan closeTime = new TimeSpan(23, 59, 59); // 23:59:59 - giờ đóng cửa
            TimeSpan cleanupTime = TimeSpan.FromMinutes(15); // Thời gian dọn dẹp giữa các suất chiếu

            // Nếu là ngày hôm nay và giờ hiện tại đã qua 9h, bắt đầu từ giờ hiện tại
            TimeSpan openTime = defaultOpenTime;
            if (request.ShowDate.Date == DateTime.Today)
            {
                var now = DateTime.Now.TimeOfDay;
                if (now > defaultOpenTime)
                {
                    // Làm tròn đến đầu giờ hiện tại
                    int currentHour = now.Hours;
                    // Không cần làm tròn phút vì chúng ta muốn bắt đầu từ giờ hiện tại
                    openTime = new TimeSpan(currentHour, 0, 0);
                    _logger.LogInformation($"Giờ hiện tại đã qua 9h, bắt đầu lịch chiếu từ: {openTime}");
                }
            }

            // Tạo timeline các khung giờ đã bị chiếm
            var occupiedTimeSlots = existingShowtimes
                .Select(s => new { Start = s.Start_Time, End = s.End_Time })
                .OrderBy(s => s.Start)
                .ToList();

            // Kết quả lịch chiếu
            var generatedShowtimes = new List<GeneratedShowtime>();
            TimeSpan currentTime = openTime; // Sử dụng giờ bắt đầu đã điều chỉnh

            foreach (var (movieId, duration, movieName) in allShowtimesToSchedule)
            {
                // Tìm khung giờ phù hợp cho suất chiếu này
                bool foundSlot = false;
                var movieDuration = TimeSpan.FromMinutes(duration);
                var requiredSlotDuration = movieDuration.Add(cleanupTime);

                // Kiểm tra từ thời điểm hiện tại
                TimeSpan slotStart = currentTime;

                while (slotStart.Add(movieDuration) <= closeTime && !foundSlot)
                {
                    TimeSpan slotEnd = slotStart.Add(movieDuration);

                    // Kiểm tra xem slot này có bị trùng với các lịch chiếu hiện có không
                    bool isConflict = occupiedTimeSlots.Any(slot =>
                        (slotStart >= slot.Start && slotStart < slot.End) ||
                        (slotEnd > slot.Start && slotEnd <= slot.End) ||
                        (slotStart <= slot.Start && slotEnd >= slot.End));

                    if (!isConflict)
                    {
                        // Tìm thấy khung giờ phù hợp
                        foundSlot = true;

                        // Tạo lịch chiếu mới
                        var startDateTime = request.ShowDate.Date.Add(slotStart);
                        var endDateTime = request.ShowDate.Date.Add(slotEnd);

                        var newShowtime = new GeneratedShowtime
                        {
                            MovieId = movieId,
                            MovieName = movieName,
                            StartDateTime = startDateTime,
                            EndDateTime = endDateTime,
                            StartTime = slotStart,
                            EndTime = slotEnd,
                            PriceTier = "Normal", // Có thể thay đổi theo logic giá
                            BasePrice = 90000 // Có thể điều chỉnh theo logic giá
                        };

                        generatedShowtimes.Add(newShowtime);

                        // Thêm vào danh sách khung giờ đã chiếm
                        occupiedTimeSlots.Add(new { Start = slotStart, End = slotEnd });
                        occupiedTimeSlots = occupiedTimeSlots.OrderBy(s => s.Start).ToList();

                        // Cập nhật thời gian hiện tại
                        currentTime = slotEnd.Add(cleanupTime);
                        break;
                    }

                    // Nếu không tìm thấy, thử với slot tiếp theo sau slot bị chiếm
                    var nextPossibleSlot = occupiedTimeSlots
                        .Where(slot => slot.Start > slotStart)
                        .OrderBy(slot => slot.Start)
                        .FirstOrDefault();

                    if (nextPossibleSlot != null)
                    {
                        slotStart = nextPossibleSlot.End.Add(cleanupTime);
                    }
                    else
                    {
                        // Không tìm thấy slot nào bị chiếm phía sau, tăng dần thời gian
                        slotStart = slotStart.Add(TimeSpan.FromMinutes(15));
                    }
                }

                if (!foundSlot)
                {
                    _logger.LogWarning($"Không thể sắp xếp suất chiếu cho phim {movieName} (ID: {movieId}) do không đủ thời gian trước giờ đóng cửa");
                }
            }

            // Sắp xếp lại theo thời gian bắt đầu
            generatedShowtimes = generatedShowtimes.OrderBy(s => s.StartTime).ToList();

            return new AutoScheduleResult
            {
                Date = request.ShowDate,
                RoomName = cinemaRoom.Room_Name,
                Showtimes = generatedShowtimes
            };
        }

        /// <summary>
        /// Tạo và lưu lịch chiếu tự động cho một hoặc nhiều ngày
        /// </summary>
        /// <param name="request">Yêu cầu lập lịch tự động</param>
        /// <param name="userId">ID người tạo</param>
        /// <param name="endDate">Ngày kết thúc (nếu tạo cho nhiều ngày, null nếu chỉ tạo cho một ngày)</param>
        /// <param name="selectedDays">Các ngày trong tuần được chọn (null để chọn tất cả)</param>
        /// <returns>Danh sách xuất chiếu được tạo theo ngày</returns>
        public async Task<Dictionary<DateTime, List<ShowtimeDto>>> SaveAutoScheduledShowtimesAsync(
            AutoScheduleRequest request,
            int userId,
            DateTime? endDate = null,
            List<DayOfWeek> selectedDays = null)
        {
            // Log thông tin đầu vào
            if (endDate.HasValue)
            {
                _logger.LogInformation($"Bắt đầu lưu lịch chiếu tự động - Phòng: {request.CinemaRoomId}, " +
                                       $"Từ ngày: {request.ShowDate:yyyy-MM-dd} đến ngày: {endDate.Value:yyyy-MM-dd}");
            }
            else
            {
                _logger.LogInformation($"Bắt đầu lưu lịch chiếu tự động - Phòng: {request.CinemaRoomId}, Ngày: {request.ShowDate:yyyy-MM-dd}");
            }

            if (request == null || request.Movies == null || !request.Movies.Any())
            {
                _logger.LogWarning("Yêu cầu lập lịch tự động không hợp lệ");
                throw new ArgumentException("Yêu cầu lập lịch tự động không hợp lệ");
            }

            // THÊM MỚI: Kiểm tra ngày không ở quá khứ
            if (request.ShowDate.Date < DateTime.Today)
            {
                _logger.LogWarning($"Ngày chiếu không hợp lệ: {request.ShowDate.Date} là ngày đã qua");
                throw new ArgumentException("Ngày chiếu phải từ hôm nay trở đi");
            }

            // Kiểm tra ngày kết thúc nếu có
            if (endDate.HasValue && endDate.Value < request.ShowDate)
            {
                throw new ArgumentException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
            }

            // Nếu không chọn ngày nào, mặc định là tất cả các ngày trong tuần
            if (selectedDays == null || !selectedDays.Any())
            {
                selectedDays = new List<DayOfWeek>
        {
            DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday,
            DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday
        };
            }

            // Kiểm tra phòng chiếu
            var cinemaRoom = await _context.CinemaRooms.FindAsync(request.CinemaRoomId);
            if (cinemaRoom == null)
            {
                _logger.LogWarning($"Không tìm thấy phòng chiếu có ID {request.CinemaRoomId}");
                throw new ArgumentException($"Không tìm thấy phòng chiếu có ID {request.CinemaRoomId}");
            }

            // Kiểm tra xem phòng có layout ghế không
            var hasSeats = await _context.SeatLayouts
                .AnyAsync(sl => sl.Cinema_Room_ID == request.CinemaRoomId && sl.Is_Active);

            if (!hasSeats)
            {
                _logger.LogWarning($"Phòng chiếu {request.CinemaRoomId} chưa được cấu hình ghế ngồi");
                throw new InvalidOperationException("Phòng chiếu chưa được cấu hình ghế ngồi");
            }

            // Kết quả lưu trữ theo ngày
            var results = new Dictionary<DateTime, List<ShowtimeDto>>();

            // Xác định các ngày cần tạo lịch chiếu
            List<DateTime> datesToSchedule = new List<DateTime>();

            if (endDate.HasValue)
            {
                // Nếu có ngày kết thúc, tạo danh sách các ngày từ ngày bắt đầu đến ngày kết thúc
                for (DateTime date = request.ShowDate.Date; date <= endDate.Value.Date; date = date.AddDays(1))
                {
                    // Chỉ thêm vào các ngày được chọn
                    if (selectedDays.Contains(date.DayOfWeek))
                    {
                        datesToSchedule.Add(date);
                    }
                }
            }
            else
            {
                // Nếu không có ngày kết thúc, chỉ tạo lịch cho ngày trong request
                datesToSchedule.Add(request.ShowDate.Date);
            }

            // Lặp qua từng ngày và tạo lịch chiếu
            foreach (var currentDate in datesToSchedule)
            {
                _logger.LogInformation($"Đang tạo lịch chiếu cho ngày {currentDate:yyyy-MM-dd} ({currentDate.DayOfWeek})");

                try
                {
                    // Kiểm tra xem đã có lịch chiếu cho ngày này chưa
                    var existingShowtimesForDate = await _context.Showtimes
                        .Where(s =>
                            s.Cinema_Room_ID == request.CinemaRoomId &&
                            s.Show_Date.Date == currentDate.Date &&
                            s.Status != "Hidden")
                        .ToListAsync();

                    if (existingShowtimesForDate.Any() && !request.OverwriteExisting)
                    {
                        _logger.LogWarning($"Đã tồn tại {existingShowtimesForDate.Count} xuất chiếu trong phòng {request.CinemaRoomId} vào ngày {currentDate.Date}");
                        throw new InvalidOperationException($"Đã có lịch chiếu trong phòng {request.CinemaRoomId} vào ngày {currentDate.Date}. Vui lòng xóa hoặc ẩn các xuất chiếu hiện tại, hoặc thiết lập OverwriteExisting = true để ghi đè.");
                    }

                    // Bắt đầu transaction cho ngày hiện tại
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Nếu yêu cầu ghi đè, ẩn các xuất chiếu hiện có cho ngày này
                        if (existingShowtimesForDate.Any() && request.OverwriteExisting)
                        {
                            _logger.LogInformation($"Đang ẩn {existingShowtimesForDate.Count} xuất chiếu hiện có để ghi đè");
                            foreach (var existingShowtime in existingShowtimesForDate)
                            {
                                existingShowtime.Status = "Hidden";
                                existingShowtime.Updated_At = DateTime.Now;
                            }
                            await _context.SaveChangesAsync();
                            _logger.LogInformation("Đã ẩn các xuất chiếu hiện có");
                        }

                        // Tạo request mới cho ngày hiện tại
                        var dailyRequest = new AutoScheduleRequest
                        {
                            CinemaRoomId = request.CinemaRoomId,
                            ShowDate = currentDate,
                            Movies = request.Movies,
                            OverwriteExisting = request.OverwriteExisting
                        };

                        // Đầu tiên tạo lịch tự động cho ngày hiện tại
                        var scheduledResult = await AutoScheduleShowtimesAsync(dailyRequest, userId);

                        // Log số lượng xuất chiếu được tạo
                        _logger.LogInformation($"Tổng số xuất chiếu được tạo cho ngày {currentDate:yyyy-MM-dd}: {scheduledResult.Showtimes.Count}");

                        // Lưu các lịch chiếu vào database
                        var createdShowtimes = new List<ShowtimeDto>();
                        var failedShowtimes = new List<(GeneratedShowtime Showtime, string ErrorMessage)>();

                        foreach (var showtime in scheduledResult.Showtimes)
                        {
                            try
                            {
                                var createDto = new ShowtimeCreateDto
                                {
                                    Movie_ID = showtime.MovieId,
                                    Cinema_Room_ID = request.CinemaRoomId,
                                    Show_Date = currentDate,
                                    Start_Time = showtime.StartTime,
                                    Price_Tier = showtime.PriceTier ?? "Normal",
                                    Base_Price = showtime.BasePrice > 0 ? showtime.BasePrice : 90000
                                };

                                _logger.LogInformation($"Đang tạo xuất chiếu - Phim: {showtime.MovieName}, Giờ bắt đầu: {showtime.StartTime}");

                                // Truyền transaction hiện tại vào CreateShowtimeAsync
                                var createdShowtime = await CreateShowtimeAsync(createDto, userId, transaction);

                                createdShowtimes.Add(createdShowtime);
                                _logger.LogInformation($"Tạo xuất chiếu thành công - ID: {createdShowtime.Showtime_ID}");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, $"Lỗi khi tạo xuất chiếu cho phim {showtime.MovieName}: {ex.Message}");
                                failedShowtimes.Add((showtime, ex.Message));
                            }
                        }

                        // Kiểm tra và log các xuất chiếu tạo không thành công
                        if (failedShowtimes.Any())
                        {
                            _logger.LogWarning($"Có {failedShowtimes.Count} xuất chiếu không thể tạo:");
                            foreach (var failed in failedShowtimes)
                            {
                                _logger.LogWarning($"Phim: {failed.Showtime.MovieName}, Lỗi: {failed.ErrorMessage}");
                            }

                            // Nếu không tạo được xuất chiếu nào
                            if (createdShowtimes.Count == 0)
                            {
                                await transaction.RollbackAsync();
                                _logger.LogWarning($"Không thể tạo bất kỳ xuất chiếu nào cho ngày {currentDate:yyyy-MM-dd}");
                                continue; // Chuyển sang ngày tiếp theo
                            }
                        }

                        // Commit transaction cho ngày hiện tại
                        await transaction.CommitAsync();
                        _logger.LogInformation($"Hoàn tất lưu lịch chiếu cho ngày {currentDate:yyyy-MM-dd} - Tổng: {createdShowtimes.Count} xuất chiếu");

                        // Thêm thông tin về các xuất chiếu thất bại (nếu có) vào response
                        if (failedShowtimes.Any())
                        {
                            foreach (var createdShowtime in createdShowtimes)
                            {
                                createdShowtime.WarningMessage = $"Có {failedShowtimes.Count} xuất chiếu không thể tạo. Vui lòng kiểm tra logs.";
                            }
                        }

                        // Lưu kết quả cho ngày hiện tại
                        results.Add(currentDate.Date, createdShowtimes);
                    }
                    catch (Exception ex)
                    {
                        // Rollback transaction nếu có lỗi
                        try
                        {
                            await transaction.RollbackAsync();
                        }
                        catch (InvalidOperationException)
                        {
                            // Xử lý trường hợp transaction đã kết thúc
                        }

                        _logger.LogError(ex, $"Lỗi khi lưu lịch chiếu tự động cho ngày {currentDate:yyyy-MM-dd}: {ex.Message}");
                        // Tiếp tục với ngày tiếp theo thay vì dừng lại
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Lỗi khi xử lý ngày {currentDate:yyyy-MM-dd}: {ex.Message}");
                    // Tiếp tục với ngày tiếp theo
                }
            }

            // Trả về từ điển với key là ngày và value là danh sách các suất chiếu đã tạo cho ngày đó
            return results;
        }

        /// <summary>
        /// Ẩn tất cả các xuất chiếu trong một ngày cụ thể của một phòng chiếu
        /// </summary>
        /// <param name="roomId">ID phòng chiếu</param>
        /// <param name="date">Ngày cần ẩn các xuất chiếu</param>
        /// <param name="userId">ID người thực hiện</param>
        /// <returns>Số lượng xuất chiếu đã được ẩn</returns>
        /// <summary>
        /// Ẩn tất cả các xuất chiếu trong một ngày cụ thể của một phòng chiếu
        /// </summary>
        public async Task<int> HideAllShowtimesForDateAsync(int roomId, DateTime date, int userId)
            {
                try
                {
                    _logger.LogInformation($"Bắt đầu ẩn tất cả xuất chiếu trong phòng {roomId} ngày {date.ToShortDateString()}");

                    // Tìm tất cả các xuất chiếu chưa bị ẩn trong ngày và phòng cụ thể
                    var showtimesToHide = await _context.Showtimes
                        .Where(s =>
                            s.Cinema_Room_ID == roomId &&
                            s.Show_Date.Date == date.Date &&
                            s.Status != "Hidden" &&
                            s.Status != "Cancelled")
                        .ToListAsync();

                    if (!showtimesToHide.Any())
                    {
                        _logger.LogInformation($"Không có xuất chiếu nào để ẩn trong phòng {roomId} ngày {date.ToShortDateString()}");
                        return 0;
                    }

                    // THÊM MỚI: Lấy danh sách ID của các xuất chiếu cần ẩn
                    var showtimeIds = showtimesToHide.Select(s => s.Showtime_ID).ToList();

                    // THÊM MỚI: Kiểm tra có booking đang pending nào cho các xuất chiếu này không
                    var pendingBookings = await _context.TicketBookings
                        .Where(b => showtimeIds.Contains(b.Showtime_ID) && b.Status == "Pending")
                        .ToListAsync();

                    if (pendingBookings.Any())
                    {
                        var showtimesWithPendingBookings = pendingBookings
                            .GroupBy(b => b.Showtime_ID)
                            .ToDictionary(g => g.Key, g => g.Count());

                        var errorMessage = "Không thể ẩn tất cả xuất chiếu do các đơn đặt vé đang chờ thanh toán:\n";
                        foreach (var pair in showtimesWithPendingBookings)
                        {
                            var showtimeInfo = showtimesToHide.First(s => s.Showtime_ID == pair.Key);
                            errorMessage += $"- Xuất chiếu ID {pair.Key} ({showtimeInfo.Start_Time}): {pair.Value} đơn đặt vé đang chờ\n";
                            _logger.LogWarning($"Cannot hide showtime ID {pair.Key}: There are {pair.Value} pending bookings");
                        }

                        throw new InvalidOperationException(errorMessage);
                    }

                    // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
                    using (var transaction = await _context.Database.BeginTransactionAsync())
                    {
                        try
                        {
                            int hiddenCount = 0;
                            foreach (var showtime in showtimesToHide)
                            {
                                showtime.Status = "Hidden";
                                showtime.Updated_At = DateTime.UtcNow;
                                hiddenCount++;

                                _logger.LogInformation($"Ẩn xuất chiếu ID: {showtime.Showtime_ID}, " +
                                    $"Phim: {showtime.Movie_ID}, " +
                                    $"Thời gian: {showtime.Start_Time}");
                            }

                            await _context.SaveChangesAsync();
                            await transaction.CommitAsync();

                            _logger.LogInformation($"Đã ẩn thành công {hiddenCount} xuất chiếu trong phòng {roomId} ngày {date.ToShortDateString()}");
                            return hiddenCount;
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync();
                            _logger.LogError(ex, $"Lỗi khi ẩn xuất chiếu trong phòng {roomId} ngày {date.ToShortDateString()}");
                            throw;
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Lỗi hệ thống khi thực hiện ẩn xuất chiếu");
                    throw;
                }
            }
        }
    }


