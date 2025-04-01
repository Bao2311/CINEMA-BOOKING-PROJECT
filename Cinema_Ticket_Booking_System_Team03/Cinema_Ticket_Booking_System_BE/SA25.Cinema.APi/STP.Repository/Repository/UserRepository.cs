using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        // Thêm logger
        private readonly ILogger<UserRepository> _logger;

        /// <summary>
        /// Khởi tạo một instance mới của UserRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        /// <param name="logger">Logger để ghi log</param>
        public UserRepository(CinemaDbContext context, ILogger<UserRepository> logger) : base(context)
        {
            _logger = logger;
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
        public async Task<bool> IsPhoneNumberExistAsync(string phoneNumber, int? excludeUserId = null)
        {
            if (string.IsNullOrEmpty(phoneNumber))
                return false;

            if (excludeUserId.HasValue)
            {
                // Kiểm tra số điện thoại đã tồn tại nhưng loại trừ người dùng hiện tại (dùng khi cập nhật)
                return await _context.Users.AnyAsync(u => u.Phone_Number == phoneNumber && u.User_ID != excludeUserId);
            }
            else
            {
                // Kiểm tra số điện thoại đã tồn tại (dùng khi đăng ký)
                return await _context.Users.AnyAsync(u => u.Phone_Number == phoneNumber);
            }
        }
        public async Task<User> GetByExactEmailAsync(string email)
        {
            _logger.LogInformation($"Searching for user with exact email: {email}");

            // Sử dụng so sánh chính xác với email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                _logger.LogWarning($"No user found with exact email: {email}");

                // Log tất cả email tương tự để debug
                var username = email.Split('@')[0]; // Tách phần username trước khi sử dụng trong LINQ
                var similarEmails = await _context.Users
                    .Where(u => u.Email.Contains(username))
                    .Select(u => new { u.User_ID, u.Email })
                    .ToListAsync();

                if (similarEmails.Any())
                {
                    _logger.LogWarning($"Found {similarEmails.Count} similar emails:");
                    foreach (var item in similarEmails)
                    {
                        _logger.LogWarning($"ID: {item.User_ID}, Email: {item.Email}");
                    }
                }
            }
            else
            {
                _logger.LogInformation($"Found user with ID: {user.User_ID}, Email: {user.Email}");
            }

            return user;
        }

    }
}



