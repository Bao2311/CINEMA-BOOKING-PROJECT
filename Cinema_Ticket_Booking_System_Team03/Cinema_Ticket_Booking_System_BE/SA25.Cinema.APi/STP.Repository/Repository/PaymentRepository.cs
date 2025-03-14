using Microsoft.EntityFrameworkCore;
using PMS.Repository.Base;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repositories
{
    /// <summary>
    /// Repository để thao tác với dữ liệu Payment trong cơ sở dữ liệu.
    /// Cung cấp các phương thức CRUD cơ bản cho entity Payment.
    /// </summary>
    public class PaymentRepository : GenericRepository<Payment>
    {
        /// <summary>
        /// Khởi tạo một instance mới của PaymentRepository.
        /// </summary>
        /// <param name="context">Database context để thao tác với cơ sở dữ liệu</param>
        public PaymentRepository(CinemaDbContext context) : base(context) { }

        /// <summary>
        /// Tạo mới một thanh toán trong cơ sở dữ liệu.
        /// </summary>
        /// <param name="payment">Đối tượng Payment cần thêm vào cơ sở dữ liệu</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> CreateAsync(Payment payment)
        {
            _context.Payments.Add(payment);
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Lấy một thanh toán theo ID.
        /// </summary>
        /// <param name="id">ID của thanh toán cần lấy</param>
        /// <returns>Đối tượng Payment nếu tìm thấy, null nếu không tìm thấy</returns>
        public async Task<Payment> GetByIdAsync(int id)
        {
            return await _context.Payments.FindAsync(id);
        }

        /// <summary>
        /// Lấy tất cả các thanh toán.
        /// </summary>
        /// <returns>Danh sách tất cả các thanh toán</returns>
        public async Task<List<Payment>> GetAllAsync()
        {
            return await _context.Payments.ToListAsync();
        }

        /// <summary>
        /// Cập nhật thông tin của một thanh toán.
        /// </summary>
        /// <param name="payment">Đối tượng Payment với thông tin đã được cập nhật</param>
        /// <returns>Số bản ghi bị ảnh hưởng</returns>
        public async Task<int> UpdateAsync(Payment payment)
        {
            var tracker = _context.Attach(payment);
            tracker.State = EntityState.Modified;
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa một thanh toán theo ID.
        /// </summary>
        /// <param name="id">ID của thanh toán cần xóa</param>
        /// <returns>true nếu xóa thành công, false nếu không tìm thấy thanh toán</returns>
        public async Task<bool> RemoveAsync(int id)
        {
            var payment = await GetByIdAsync(id);
            if (payment == null)
                return false;

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
