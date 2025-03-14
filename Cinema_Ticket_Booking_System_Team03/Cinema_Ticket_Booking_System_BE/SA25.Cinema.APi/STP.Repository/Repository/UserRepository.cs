using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu User (người dùng) trong cơ sở dữ liệu.
    /// Cung cấp các phương thức để truy vấn và kiểm tra thông tin người dùng.
    /// </summary>
    public class UserRepository : GenericRepository<User>
    {
        /// <summary>
        /// Khởi tạo một instance mới của UserRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public UserRepository(CinemaDbContext context) : base(context)
        {
        }

        /// <summary>
        /// Kiểm tra xem email đã tồn tại trong hệ thống hay chưa.
        /// </summary>
        /// <param name="email">Email cần kiểm tra</param>
        /// <returns>true nếu email đã tồn tại, false nếu chưa tồn tại</returns>
        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        /// <summary>
        /// Kiểm tra xem tên người dùng đã tồn tại trong hệ thống hay chưa.
        /// </summary>
        /// <param name="userName">Tên người dùng cần kiểm tra</param>
        /// <returns>true nếu tên người dùng đã tồn tại, false nếu chưa tồn tại</returns>
        public async Task<bool> UserNameExistsAsync(string userName)
        {
            return await _context.Users.AnyAsync(u => u.Full_Name == userName);
        }

        /// <summary>
        /// Lấy thông tin người dùng theo email.
        /// </summary>
        /// <param name="email">Email của người dùng cần tìm</param>
        /// <returns>Đối tượng User nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        /// <summary>
        /// Lấy thông tin người dùng theo số điện thoại.
        /// </summary>
        /// <param name="phoneNumber">Số điện thoại của người dùng cần tìm</param>
        /// <returns>Đối tượng User nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<User> GetByPhoneNumberAsync(string phoneNumber)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Phone_Number == phoneNumber);
        }
    }
}
