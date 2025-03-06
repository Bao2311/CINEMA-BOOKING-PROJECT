using Microsoft.EntityFrameworkCore; // Tham chiếu đến Entity Framework Core để làm việc với DbContext và các thực thể
using STP.Repository.Data;
using STP.Repository.Models; // Tham chiếu đến các model mới trong dự án
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PMS.Repository.Base
{
    // Lớp GenericRepository<T> cung cấp các thao tác CRUD chung cho mọi thực thể (T)
    // T là kiểu dữ liệu đại diện cho các lớp thực thể khác nhau trong dự án
    public class GenericRepository<T> where T : class
    {
        // DbContext của Entity Framework để truy cập vào cơ sở dữ liệu
        protected CinemaDbContext _context;

        // Constructor nhận đối tượng DbContext từ bên ngoài, hữu ích khi sử dụng với Unit of Work
        public GenericRepository(CinemaDbContext context) => _context = context;

        // Phương thức lấy tất cả các thực thể (T) từ cơ sở dữ liệu
        public List<T> GetAll()
        {
            return _context.Set<T>().ToList(); // Trả về danh sách các thực thể
        }

        // Phương thức thêm một thực thể mới vào cơ sở dữ liệu (đồng bộ)
        public void Create(T entity)
        {
            _context.Add(entity); // Thêm thực thể vào DbContext
            _context.SaveChanges(); // Lưu thay đổi vào cơ sở dữ liệu
        }

        // Phương thức cập nhật một thực thể đã có trong cơ sở dữ liệu (đồng bộ)
        public void Update(T entity)
        {
            var tracker = _context.Attach(entity); // Đính thực thể vào DbContext nếu chưa theo dõi
            tracker.State = EntityState.Modified; // Đánh dấu trạng thái thực thể là đã sửa đổi
            _context.SaveChanges(); // Lưu thay đổi vào cơ sở dữ liệu
        }

        // Phương thức xóa một thực thể từ cơ sở dữ liệu (đồng bộ)
        public bool Remove(T entity)
        {
            _context.Remove(entity); // Xóa thực thể khỏi DbContext
            _context.SaveChanges(); // Lưu thay đổi vào cơ sở dữ liệu
            return true;
        }

        // Phương thức tìm một thực thể theo Id (kiểu int)
        public T GetById(int id)
        {
            return _context.Set<T>().Find(id); // Tìm và trả về thực thể với Id khớp
        }

        // Phương thức tìm một thực thể theo Id (kiểu string)
        public T GetById(string code)
        {
            return _context.Set<T>().Find(code); // Tìm và trả về thực thể với Id kiểu string
        }

        // Phương thức tìm một thực thể theo Id (kiểu Guid)
        public T GetById(Guid code)
        {
            return _context.Set<T>().Find(code); // Tìm và trả về thực thể với Id kiểu Guid
        }

        #region Asynchronous

        // Các phương thức bất đồng bộ (asynchronous) cho các thao tác CRUD

        // Phương thức bất đồng bộ để lấy tất cả các thực thể (T)
        // Phương thức bất đồng bộ để lấy tất cả các thực thể (T)
        public async Task<IQueryable<T>> GetAllAsync()
        {
            return _context.Set<T>().AsQueryable(); // Trả về IQueryable thay vì List
        }

        // Phương thức bất đồng bộ để tạo mới một thực thể (T)
        public async Task<int> CreateAsync(T entity)
        {
            _context.Add(entity); // Thêm thực thể vào DbContext
            return await _context.SaveChangesAsync(); // Lưu thay đổi bất đồng bộ vào cơ sở dữ liệu
        }

        // Phương thức bất đồng bộ để cập nhật một thực thể
        public async Task<int> UpdateAsync(T entity)
        {
            var tracker = _context.Attach(entity); // Đính thực thể vào DbContext nếu chưa theo dõi
            tracker.State = EntityState.Modified; // Đánh dấu thực thể là đã sửa đổi
            return await _context.SaveChangesAsync(); // Lưu thay đổi bất đồng bộ vào cơ sở dữ liệu
        }

        // Phương thức bất đồng bộ để xóa một thực thể
        public async Task<bool> RemoveAsync(T entity)
        {
            _context.Remove(entity); // Xóa thực thể khỏi DbContext
            await _context.SaveChangesAsync(); // Lưu thay đổi bất đồng bộ vào cơ sở dữ liệu
            return true;
        }

        // Phương thức bất đồng bộ để tìm một thực thể theo Id (kiểu int)
        public async Task<T> GetByIdAsync(int id)
        {
            return await _context.Set<T>().FindAsync(id); // Tìm và trả về thực thể với Id khớp
        }

        // Phương thức bất đồng bộ để tìm một thực thể theo Id (kiểu string)
        public async Task<T> GetByIdAsync(string code)
        {
            return await _context.Set<T>().FindAsync(code); // Tìm và trả về thực thể với Id kiểu string
        }

        // Phương thức bất đồng bộ để tìm một thực thể theo Id (kiểu Guid)
        public async Task<T> GetByIdAsync(Guid code)
        {
            return await _context.Set<T>().FindAsync(code); // Tìm và trả về thực thể với Id kiểu Guid
        }

        #endregion

        #region Separating assigned entities and save operators

        // Các phương thức cho phép chuẩn bị thực thể để thêm, sửa, xóa mà không lưu ngay lập tức

        // Chuẩn bị thực thể để thêm vào DbContext mà chưa lưu vào cơ sở dữ liệu
        public void PrepareCreate(T entity)
        {
            _context.Add(entity);
        }

        // Chuẩn bị thực thể để cập nhật trong DbContext mà chưa lưu vào cơ sở dữ liệu
        public void PrepareUpdate(T entity)
        {
            var tracker = _context.Attach(entity);
            tracker.State = EntityState.Modified;
        }

        // Chuẩn bị thực thể để xóa khỏi DbContext mà chưa lưu vào cơ sở dữ liệu
        public void PrepareRemove(T entity)
        {
            _context.Remove(entity);
        }

        // Lưu tất cả các thay đổi đã được chuẩn bị (đồng bộ)
        public int Save()
        {
            return _context.SaveChanges(); // Lưu thay đổi vào cơ sở dữ liệu
        }

        // Lưu tất cả các thay đổi đã được chuẩn bị (bất đồng bộ)
        public async Task<int> SaveAsync()
        {
            return await _context.SaveChangesAsync(); // Lưu thay đổi bất đồng bộ vào cơ sở dữ liệu
        }

        public async Task<int> DeleteAsync(T entity)
        {
            _context.Remove(entity);
            return await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Set<T>().AnyAsync(e => EF.Property<int>(e, "ID") == id); // Kiểm tra sự tồn tại của thực thể
        }

        public async Task<int> AddAsync(T entity)
        {
            _context.Add(entity);
            return await _context.SaveChangesAsync();
        }

        #endregion Separating assign entity and save operators
    }
}
