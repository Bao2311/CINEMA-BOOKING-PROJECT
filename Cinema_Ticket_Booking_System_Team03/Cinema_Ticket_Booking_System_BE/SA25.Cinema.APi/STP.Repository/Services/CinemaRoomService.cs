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
    public class CinemaRoomService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<CinemaRoomService> _logger;

        public CinemaRoomService(CinemaDbContext context, ILogger<CinemaRoomService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<RoomDTO>> GetAllCinemaRoomsAsync(string filter = null)
        {
            IQueryable<CinemaRoom> query = _context.CinemaRooms;

            if (!string.IsNullOrEmpty(filter))
            {
                filter = filter.ToLower();
                query = query.Where(r =>
                    r.Room_Name.ToLower().Contains(filter) ||
                    r.Room_Type.ToLower().Contains(filter) ||
                    r.Status.ToLower().Contains(filter));
            }

            query = query.OrderBy(r => r.Room_Name);

            return await query.Select(r => new RoomDTO
            {
                Cinema_Room_ID = r.Cinema_Room_ID,
                Room_Name = r.Room_Name ?? "Unknown Room",
                Room_Type = r.Room_Type ?? "2D",
                Seat_Quantity = r.Seat_Quantity,
                Status = r.Status ?? "Active",
                Notes = r.Notes ?? "",
                HasUpcomingShowtimes = _context.Showtimes
                    .Any(s => s.Cinema_Room_ID == r.Cinema_Room_ID && s.Show_Date.Date >= DateTime.Today)
            }).ToListAsync();
        }

        public async Task<RoomDetailDTO> GetCinemaRoomAsync(int id)
        {
            var room = await _context.CinemaRooms
                .Include(r => r.SeatLayouts)
                .FirstOrDefaultAsync(r => r.Cinema_Room_ID == id);

            if (room == null)
                return null;

            var hasSeats = await _context.SeatLayouts
                .AnyAsync(sl => sl.Cinema_Room_ID == id);

            var upcomingShowtimes = await _context.Showtimes
                .Where(s => s.Cinema_Room_ID == id && s.Show_Date.Date >= DateTime.Today)
                .Select(s => new ShowtimeDTO
                {
                    Showtime_ID = s.Showtime_ID,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Movie_Name = s.Movie.Movie_Name
                })
                .ToListAsync();

            var seatCounts = await _context.SeatLayouts
                .Where(sl => sl.Cinema_Room_ID == id)
                .GroupBy(sl => sl.Seat_Type)
                .Select(g => new SeatTypeCountDTO
                {
                    SeatType = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var capacity = await _context.Seats
                .Where(s => s.SeatLayout.Cinema_Room_ID == id)
                .CountAsync();

            var nowShowingMovies = await GetMoviesByRoomIdAsync(id);

            return new RoomDetailDTO
            {
                Cinema_Room_ID = room.Cinema_Room_ID,
                Room_Name = room.Room_Name,
                Room_Type = room.Room_Type,
                Capacity = capacity,
                Features = room.Room_Type == "VIP" ? "Reclining seats, Premium sound system" : "Standard features",
                NowShowingMovies = nowShowingMovies,
                Seat_Quantity = room.Seat_Quantity,
                Status = room.Status,
                Notes = room.Notes,
                HasSeats = hasSeats,
                SeatTypes = seatCounts,
                UpcomingShowtimes = upcomingShowtimes,
                CanDelete = !upcomingShowtimes.Any()
            };
        }

        public async Task<List<MovieListItemDTO>> GetMoviesByRoomIdAsync(int id)
        {
            var today = DateTime.Today;
            return await _context.Showtimes
                .Include(s => s.Movie)
                .Where(s => s.Cinema_Room_ID == id &&
                           s.Show_Date >= today &&
                           s.Status == "Scheduled")
                .Select(s => s.Movie)
                .Distinct()
                .Select(m => new MovieListItemDTO
                {
                    Movie_ID = m.Movie_ID,
                    Movie_Name = m.Movie_Name,
                    Genre = m.Genre,
                    Duration = m.Duration,
                    Rating = m.Rating,
                    Poster_URL = m.Poster_URL,
                    Synopsis = m.Synopsis
                })
                .ToListAsync();
        }

        public async Task<RoomDTO> CreateCinemaRoomAsync(CinemaRoomCreateDto model)
        {
            if (await _context.CinemaRooms.AnyAsync(r => r.Room_Name == model.Room_Name))
                throw new ArgumentException($"Phòng chiếu với tên '{model.Room_Name}' đã tồn tại");

            var cinemaRoom = new CinemaRoom
            {
                Room_Name = model.Room_Name,
                Room_Type = model.Room_Type,
                Seat_Quantity = model.Seat_Quantity,
                Status = model.Status ?? "Active",
                Notes = model.Notes
            };

            _context.CinemaRooms.Add(cinemaRoom);
            await _context.SaveChangesAsync();

            return new RoomDTO
            {
                Cinema_Room_ID = cinemaRoom.Cinema_Room_ID,
                Room_Name = cinemaRoom.Room_Name,
                Room_Type = cinemaRoom.Room_Type,
                Seat_Quantity = cinemaRoom.Seat_Quantity,
                Status = cinemaRoom.Status,
                Notes = cinemaRoom.Notes,
                HasUpcomingShowtimes = false
            };
        }

        public async Task<RoomDTO> UpdateCinemaRoomAsync(int id, CinemaRoomUpdateDto model)
        {
            var cinemaRoom = await _context.CinemaRooms.FindAsync(id);
            if (cinemaRoom == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu có ID {id}");

            if (model.Room_Name != cinemaRoom.Room_Name &&
                await _context.CinemaRooms.AnyAsync(r => r.Room_Name == model.Room_Name))
            {
                throw new ArgumentException($"Phòng chiếu với tên '{model.Room_Name}' đã tồn tại");
            }

            cinemaRoom.Room_Name = model.Room_Name;
            cinemaRoom.Room_Type = model.Room_Type;
            cinemaRoom.Seat_Quantity = model.Seat_Quantity;
            cinemaRoom.Status = model.Status;
            cinemaRoom.Notes = model.Notes;

            await _context.SaveChangesAsync();

            return new RoomDTO
            {
                Cinema_Room_ID = cinemaRoom.Cinema_Room_ID,
                Room_Name = cinemaRoom.Room_Name,
                Room_Type = cinemaRoom.Room_Type,
                Seat_Quantity = cinemaRoom.Seat_Quantity,
                Status = cinemaRoom.Status,
                Notes = cinemaRoom.Notes,
                HasUpcomingShowtimes = await _context.Showtimes
                    .AnyAsync(s => s.Cinema_Room_ID == id && s.Show_Date.Date >= DateTime.Today)
            };
        }

        public async Task<object> DeleteCinemaRoomAsync(int id)
        {
            var cinemaRoom = await _context.CinemaRooms.FindAsync(id);
            if (cinemaRoom == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu có ID {id}");

            var hasUpcomingShowtimes = await _context.Showtimes
                .AnyAsync(s => s.Cinema_Room_ID == id && s.Show_Date.Date >= DateTime.Today);

            if (hasUpcomingShowtimes)
                throw new InvalidOperationException("Không thể xóa phòng chiếu vì có suất chiếu đã được lên lịch");

            // Luôn dùng cách xóa mềm thay vì xóa cứng
            cinemaRoom.Status = "Inactive";

            // Xóa mềm tất cả các SeatLayouts liên quan
            var seatLayouts = await _context.SeatLayouts
                .Where(sl => sl.Cinema_Room_ID == id)
                .ToListAsync();

            if (seatLayouts.Any())
            {
                foreach (var layout in seatLayouts)
                {
                    layout.Is_Active = false;
                }
            }

            await _context.SaveChangesAsync();

            return new { message = "Phòng chiếu đã được đánh dấu là đã xóa" };
        }

        public async Task<object> CheckCinemaRoomStatusAsync(int id)
        {
            var cinemaRoom = await _context.CinemaRooms.FindAsync(id);
            if (cinemaRoom == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu có ID {id}");

            var upcomingShowtimes = await _context.Showtimes
                .Where(s => s.Cinema_Room_ID == id && s.Show_Date.Date >= DateTime.Today)
                .OrderBy(s => s.Show_Date)
                .ThenBy(s => s.Start_Time)
                .Select(s => new ShowtimeDTO
                {
                    Showtime_ID = s.Showtime_ID,
                    Show_Date = s.Show_Date,
                    Start_Time = s.Start_Time,
                    End_Time = s.End_Time,
                    Movie_Name = s.Movie.Movie_Name
                })
                .ToListAsync();

            var seatLayouts = await _context.SeatLayouts
                .Where(sl => sl.Cinema_Room_ID == id)
                .GroupBy(sl => sl.Seat_Type)
                .Select(g => new SeatTypeCountDTO
                {
                    SeatType = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return new
            {
                cinemaRoom.Cinema_Room_ID,
                cinemaRoom.Room_Name,
                cinemaRoom.Room_Type,
                cinemaRoom.Status,
                IsBusy = upcomingShowtimes.Any(),
                UpcomingShowtimes = upcomingShowtimes,
                HasSeats = seatLayouts.Any(),
                SeatConfiguration = seatLayouts,
                CanModify = !upcomingShowtimes.Any()
            };
        }

        public async Task<object> DeactivateCinemaRoomAsync(int id)
        {
            var cinemaRoom = await _context.CinemaRooms.FindAsync(id);
            if (cinemaRoom == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu có ID {id}");

            // Kiểm tra nếu phòng đã ở trạng thái Inactive rồi
            if (cinemaRoom.Status == "Inactive")
                throw new InvalidOperationException("Phòng chiếu đã ở trạng thái không hoạt động");

            // Cập nhật trạng thái
            cinemaRoom.Status = "Inactive";
            await _context.SaveChangesAsync();

            return new
            {
                Cinema_Room_ID = cinemaRoom.Cinema_Room_ID,
                Room_Name = cinemaRoom.Room_Name,
                Status = cinemaRoom.Status,
                message = "Phòng chiếu đã được đánh dấu là không hoạt động thành công"
            };
        }
    }
}



