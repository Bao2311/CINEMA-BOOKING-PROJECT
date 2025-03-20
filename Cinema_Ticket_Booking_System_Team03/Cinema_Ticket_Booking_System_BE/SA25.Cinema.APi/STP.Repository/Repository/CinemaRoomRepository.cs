using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu CinemaRoom trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity CinemaRoom.
    /// </summary>
    public class CinemaRoomRepository : GenericRepository<CinemaRoom>
    {
        /// <summary>
        /// Khởi tạo một instance mới của CinemaRoomRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public CinemaRoomRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một phòng chiếu trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="cinemaRoom">Đối tượng CinemaRoom cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(CinemaRoom cinemaRoom)
        {
            _context.CinemaRooms.Add(cinemaRoom);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một phòng chiếu theo ID.
        /// </summary>
        /// <param name="id">ID của phòng chiếu cần lấy</param>
        /// <returns>Đối tượng CinemaRoom nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<CinemaRoom> GetByIdAsync(int id)
        {
            return await _context.CinemaRooms.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các phòng chiếu.
        /// </summary>
        /// <returns>Danh sách tất cả các phòng chiếu</returns>
        public async Task<List<CinemaRoom>> GetAllAsync()
        {
            return await _context.CinemaRooms.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một phòng chiếu.
        /// </summary>
        /// <param name="cinemaRoom">Đối tượng CinemaRoom với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(CinemaRoom cinemaRoom)
        {
            var tracker = _context.Attach(cinemaRoom);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một phòng chiếu theo ID.
        /// </summary>
        /// <param name="id">ID của phòng chiếu cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy phòng chiếu</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var cinemaRoom = await GetByIdAsync(id);
            if (cinemaRoom == null)
                return false;

            _context.CinemaRooms.Remove(cinemaRoom);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
