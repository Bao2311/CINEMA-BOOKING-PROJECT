using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class ShowtimeService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<ShowtimeService> _logger;

        public ShowtimeService(CinemaDbContext context, ILogger<ShowtimeService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<object> GetShowtimesAsync(DateTime? date = null, int? movieId = null, int? roomId = null)
        {
            DateTime queryDate = date?.Date ?? DateTime.Today;
            var query = _context.Showtimes.AsQueryable();

            query = query.Where(s => s.Show_Date.Date == queryDate);
            if (movieId.HasValue)
                query = query.Where(s => s.Movie_ID == movieId.Value);
            if (roomId.HasValue)
                query = query.Where(s => s.Cinema_Room_ID == roomId.Value);

            query = query.OrderBy(s => s.Start_Time);

            var showtimes = await query
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Select(s => new
                {
                    s.Showtime_ID,
                    s.Show_Date,
                    s.Start_Time,
                    s.End_Time,
                    s.Price_Tier,
                    s.Base_Price,
                    s.Status,
                    s.Capacity_Available,
                    Movie = new { s.Movie.Movie_ID, s.Movie.Movie_Name, s.Movie.Duration, s.Movie.Rating, s.Movie.Poster_URL, s.Movie.Genre },
                    Room = new { s.CinemaRoom.Cinema_Room_ID, s.CinemaRoom.Room_Name, s.CinemaRoom.Room_Type }
                }).ToListAsync();

            return new
            {
                date = queryDate.ToString("yyyy-MM-dd"),
                showtimes_count = showtimes.Count,
                showtimes = showtimes
            };
        }

        public async Task<object> GetShowtimeAsync(int id)
        {
            var showtime = await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Include(s => s.CreatedBy)
                .FirstOrDefaultAsync(s => s.Showtime_ID == id);

            if (showtime == null)
                throw new KeyNotFoundException($"Không tìm thấy suất chiếu có ID {id}");

            var seats = await _context.Seats
                .Where(seat => seat.SeatLayout.Cinema_Room_ID == showtime.Cinema_Room_ID)
                .GroupBy(seat => seat.Booking_ID.HasValue)
                .Select(group => new { IsBooked = group.Key, Count = group.Count() })
                .ToListAsync();

            var bookedSeats = seats.FirstOrDefault(s => s.IsBooked)?.Count ?? 0;
            var availableSeats = seats.FirstOrDefault(s => !s.IsBooked)?.Count ?? 0;
            bool canModify = showtime.Show_Date > DateTime.Today || (showtime.Show_Date == DateTime.Today && showtime.Start_Time > DateTime.Now.TimeOfDay);

            return new
            {
                showtime.Showtime_ID,
                showtime.Show_Date,
                showtime.Start_Time,
                showtime.End_Time,
                showtime.Price_Tier,
                showtime.Base_Price,
                showtime.Status,
                showtime.Capacity_Available,
                showtime.Created_At,
                showtime.Updated_At,
                Created_By = showtime.CreatedBy?.Full_Name,
                Movie = new { showtime.Movie.Movie_ID, showtime.Movie.Movie_Name, showtime.Movie.Duration, showtime.Movie.Rating, showtime.Movie.Poster_URL, showtime.Movie.Genre },
                Room = new { showtime.CinemaRoom.Cinema_Room_ID, showtime.CinemaRoom.Room_Name, showtime.CinemaRoom.Room_Type, showtime.CinemaRoom.Seat_Quantity },
                Booking_Stats = new
                {
                    Total_Capacity = showtime.CinemaRoom.Seat_Quantity,
                    Booked_Seats = bookedSeats,
                    Available_Seats = availableSeats,
                    Occupancy_Rate = showtime.CinemaRoom.Seat_Quantity > 0 ? (double)bookedSeats / showtime.CinemaRoom.Seat_Quantity * 100 : 0
                },
                Can_Modify = canModify
            };
        }

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

        public async Task<object> UpdateShowtimeAsync(int id, ShowtimeUpdateDto model)
        {
            if (model == null)
                throw new ArgumentException("Dữ liệu không hợp lệ");

            var showtime = await _context.Showtimes.Include(s => s.Movie).FirstOrDefaultAsync(s => s.Showtime_ID == id);
            if (showtime == null)
                throw new KeyNotFoundException($"Không tìm thấy suất chiếu có ID {id}");

            var showDateTime = showtime.Show_Date.Add(showtime.Start_Time);
            if (showDateTime <= DateTime.Now)
                throw new ArgumentException("Không thể cập nhật suất chiếu đã diễn ra");

            bool hasBookings = await _context.TicketBookings.AnyAsync(b => b.Showtime_ID == id && b.Status != "Cancelled");
            if (hasBookings)
            {
                showtime.Status = model.Status;
                showtime.Updated_At = DateTime.Now;
                await _context.SaveChangesAsync();

                return new
                {
                    showtime.Showtime_ID,
                    showtime.Status,
                    showtime.Updated_At,
                    limited_update = true,
                    message = "Suất chiếu đã có đặt vé, chỉ có thể cập nhật trạng thái"
                };
            }

            var cinemaRoom = await _context.CinemaRooms.FindAsync(model.Cinema_Room_ID);
            if (cinemaRoom == null)
                throw new ArgumentException($"Không tìm thấy phòng chiếu có ID {model.Cinema_Room_ID}");

            TimeSpan endTime = model.Start_Time.Add(TimeSpan.FromMinutes(showtime.Movie.Duration + 15));
            var conflictingShowtimes = await _context.Showtimes
                .Where(s => s.Cinema_Room_ID == model.Cinema_Room_ID &&
                           s.Showtime_ID != id &&
                           s.Show_Date.Date == model.Show_Date.Date &&
                           ((s.Start_Time <= model.Start_Time && s.End_Time > model.Start_Time) ||
                            (s.Start_Time < endTime && s.End_Time >= endTime) ||
                            (s.Start_Time >= model.Start_Time && s.End_Time <= endTime)))
                .ToListAsync();

            if (conflictingShowtimes.Any())
                throw new InvalidOperationException("Suất chiếu bị trùng lịch với suất chiếu khác trong cùng phòng");

            showtime.Cinema_Room_ID = model.Cinema_Room_ID;
            showtime.Show_Date = model.Show_Date;
            showtime.Start_Time = model.Start_Time;
            showtime.End_Time = endTime;
            showtime.Price_Tier = model.Price_Tier;
            showtime.Base_Price = model.Base_Price;
            showtime.Status = model.Status;
            showtime.Capacity_Available = cinemaRoom.Seat_Quantity;
            showtime.Updated_At = DateTime.Now;

            await _context.SaveChangesAsync();

            return new
            {
                showtime.Showtime_ID,
                showtime.Cinema_Room_ID,
                showtime.Show_Date,
                showtime.Start_Time,
                showtime.End_Time,
                showtime.Price_Tier,
                showtime.Base_Price,
                showtime.Status,
                showtime.Updated_At,
                limited_update = false
            };
        }

        public async Task<object> CancelShowtimeAsync(int id)
        {
            var showtime = await _context.Showtimes.FindAsync(id);
            if (showtime == null)
                throw new KeyNotFoundException($"Không tìm thấy suất chiếu có ID {id}");

            var showDateTime = showtime.Show_Date.Add(showtime.Start_Time);
            if (showDateTime <= DateTime.Now)
                throw new ArgumentException("Không thể hủy suất chiếu đã diễn ra");

            var bookings = await _context.TicketBookings
                .Where(b => b.Showtime_ID == id && b.Status != "Cancelled")
                .ToListAsync();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (bookings.Any())
                {
                    foreach (var booking in bookings)
                    {
                        booking.Status = "Cancelled";
                        _context.BookingHistories.Add(new BookingHistory
                        {
                            Booking_ID = booking.Booking_ID,
                            Status = "Cancelled",
                            Date = DateTime.Now
                        });

                        var seats = await _context.Seats
                            .Where(s => s.Booking_ID == booking.Booking_ID)
                            .ToListAsync();
                        foreach (var seat in seats)
                        {
                            seat.Booking_ID = null;
                            seat.Seat_Status = "Available";
                            seat.Last_Updated = DateTime.Now;
                        }

                        var payment = await _context.Payments
                            .Where(p => p.Booking_ID == booking.Booking_ID && p.Payment_Status == "Completed")
                            .FirstOrDefaultAsync();
                        if (payment != null)
                        {
                            payment.Payment_Status = "Refunded";
                            payment.Refund_Amount = payment.Amount;
                            payment.Refund_Date = DateTime.Now;
                            payment.Refund_Reason = "Suất chiếu bị hủy";
                        }
                    }
                }

                showtime.Status = "Canceled";
                showtime.Updated_At = DateTime.Now;
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new
                {
                    showtime_id = showtime.Showtime_ID,
                    status = "canceled",
                    affected_bookings = bookings.Count,
                    message = bookings.Any()
                        ? $"Suất chiếu đã bị hủy và {bookings.Count} đơn đặt vé đã được hoàn tiền"
                        : "Suất chiếu đã bị hủy"
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error cancelling showtime {id}");
                throw;
            }
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