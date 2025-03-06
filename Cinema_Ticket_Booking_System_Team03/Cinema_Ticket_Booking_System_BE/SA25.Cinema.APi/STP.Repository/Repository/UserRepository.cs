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
    public class UserRepository : GenericRepository<User>
    {
        public UserRepository(CinemaDbContext context) : base(context)
        {
        }

        // Thêm phương thức kiểm tra email đã tồn tại
        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        // Nếu cần kiểm tra tên tài khoản
        public async Task<bool> UserNameExistsAsync(string userName)
        {
            return await _context.Users.AnyAsync(u => u.Full_Name == userName);
        }

        // Phương thức lấy người dùng theo email
        public async Task<User> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }
    }
}