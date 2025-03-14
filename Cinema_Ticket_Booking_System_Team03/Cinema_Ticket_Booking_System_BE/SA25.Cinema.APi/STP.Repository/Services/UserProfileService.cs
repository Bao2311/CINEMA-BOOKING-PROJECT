using Microsoft.EntityFrameworkCore;
using STP.Repository.Models;
using STP.Repository.Dtos;
using STP.Repositories;
using System;
using System.Threading.Tasks;
using sa25.Repository.Data;

namespace STP.Repository.Services
{
    /// <summary>
    /// Interface định nghĩa các phương thức quản lý hồ sơ người dùng
    /// </summary>
    public interface IUserProfileService
    {
        /// <summary>
        /// Lấy thông tin hồ sơ người dùng dựa trên ID
        /// </summary>
        /// <param name="userId">ID của người dùng</param>
        /// <returns>Thông tin hồ sơ người dùng phù hợp với vai trò</returns>
        Task<object> GetUserProfileAsync(int userId);

        /// <summary>
        /// Cập nhật thông tin hồ sơ người dùng
        /// </summary>
        /// <param name="userId">ID của người dùng</param>
        /// <param name="updateDto">DTO chứa thông tin cập nhật</param>
        /// <returns>Thông tin hồ sơ người dùng sau khi cập nhật</returns>
        Task<object> UpdateUserProfileAsync(int userId, BaseUpdateProfileDTO updateDto);
    }

    /// <summary>
    /// Service quản lý hồ sơ người dùng
    /// Cung cấp các chức năng xem và cập nhật thông tin hồ sơ người dùng
    /// Hỗ trợ các loại hồ sơ khác nhau dựa trên vai trò của người dùng (customer, admin, staff)
    /// </summary>
    public class UserProfileService : IUserProfileService
    {
        // Unit of Work để tương tác với repository
        private readonly UnitOfWork _unitOfWork;

        /// <summary>
        /// Khởi tạo service với Unit of Work
        /// </summary>
        /// <param name="unitOfWork">Unit of Work để quản lý các repository</param>
        public UserProfileService(UnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// Lấy thông tin hồ sơ người dùng dựa trên ID
        /// Trả về loại hồ sơ phù hợp với vai trò của người dùng
        /// </summary>
        /// <param name="userId">ID của người dùng</param>
        /// <returns>Thông tin hồ sơ người dùng theo vai trò</returns>
        /// <exception cref="KeyNotFoundException">Ném ra khi không tìm thấy người dùng</exception>
        /// <exception cref="InvalidOperationException">Ném ra khi vai trò người dùng không hợp lệ</exception>
        public async Task<object> GetUserProfileAsync(int userId)
        {
            // Tìm kiếm người dùng theo ID
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            // Ánh xạ thông tin người dùng vào DTO phù hợp với vai trò
            return user.Role?.ToLower() switch
            {
                "customer" => MapToCustomerProfile(user),
                "admin" => MapToAdminProfile(user),
                "staff" => MapToStaffProfile(user),
                _ => throw new InvalidOperationException("Invalid user role")
            };
        }

        /// <summary>
        /// Cập nhật thông tin hồ sơ người dùng
        /// </summary>
        /// <param name="userId">ID của người dùng</param>
        /// <param name="updateDto">DTO chứa thông tin cập nhật</param>
        /// <returns>Thông tin hồ sơ người dùng sau khi cập nhật</returns>
        /// <exception cref="KeyNotFoundException">Ném ra khi không tìm thấy người dùng</exception>
        /// <exception cref="InvalidOperationException">Ném ra khi số điện thoại đã được sử dụng bởi người dùng khác</exception>
        public async Task<object> UpdateUserProfileAsync(int userId, BaseUpdateProfileDTO updateDto)
        {
            // Tìm kiếm người dùng theo ID
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            // Kiểm tra số điện thoại trùng lặp
            if (updateDto.Phone_Number != user.Phone_Number)
            {
                var existingUserWithPhone = await _unitOfWork.UserRepository.GetByPhoneNumberAsync(updateDto.Phone_Number);
                if (existingUserWithPhone != null && existingUserWithPhone.User_ID != userId)
                {
                    throw new InvalidOperationException("Số điện thoại đã được sử dụng bởi tài khoản khác");
                }
            }

            // Cập nhật các trường thông tin chung
            user.Phone_Number = updateDto.Phone_Number;
            user.Address = updateDto.Address;
            user.Date_Of_Birth = updateDto.Date_Of_Birth;
            user.Sex = updateDto.Sex;

            // Cập nhật người dùng trong cơ sở dữ liệu
            await _unitOfWork.UserRepository.UpdateAsync(user);

            // Trả về hồ sơ đã cập nhật
            return await GetUserProfileAsync(userId);
        }

        /// <summary>
        /// Ánh xạ thông tin người dùng vào DTO hồ sơ khách hàng
        /// </summary>
        /// <param name="user">Đối tượng người dùng</param>
        /// <returns>DTO hồ sơ khách hàng</returns>
        private static CustomerProfileDTO MapToCustomerProfile(User user)
        {
            return new CustomerProfileDTO
            {
                Full_Name = user.Full_Name,
                Email = user.Email,
                Phone_Number = user.Phone_Number,
                Address = user.Address,
                Date_Of_Birth = user.Date_Of_Birth,
                Sex = user.Sex
            };
        }

        /// <summary>
        /// Ánh xạ thông tin người dùng vào DTO hồ sơ quản trị viên
        /// Bao gồm thông tin chi tiết hơn so với hồ sơ khách hàng
        /// </summary>
        /// <param name="user">Đối tượng người dùng</param>
        /// <returns>DTO hồ sơ quản trị viên</returns>
        private static AdminProfileDTO MapToAdminProfile(User user)
        {
            return new AdminProfileDTO
            {
                User_ID = user.User_ID,
                Full_Name = user.Full_Name,
                Email = user.Email,
                Phone_Number = user.Phone_Number,
                Address = user.Address,
                Date_Of_Birth = user.Date_Of_Birth,
                Sex = user.Sex,
                Role = user.Role,
                Department = user.Department,
                Hire_Date = user.Hire_Date,
                Created_At = user.Created_At,
                Last_Login = user.Last_Login,
                Account_Status = user.Account_Status
            };
        }

        /// <summary>
        /// Ánh xạ thông tin người dùng vào DTO hồ sơ nhân viên
        /// Tương tự như hồ sơ quản trị viên nhưng có thể có các trường khác biệt trong tương lai
        /// </summary>
        /// <param name="user">Đối tượng người dùng</param>
        /// <returns>DTO hồ sơ nhân viên</returns>
        private static StaffProfileDTO MapToStaffProfile(User user)
        {
            return new StaffProfileDTO
            {
                User_ID = user.User_ID,
                Full_Name = user.Full_Name,
                Email = user.Email,
                Phone_Number = user.Phone_Number,
                Address = user.Address,
                Date_Of_Birth = user.Date_Of_Birth,
                Sex = user.Sex,
                Role = user.Role,
                Department = user.Department,
                Hire_Date = user.Hire_Date,
                Created_At = user.Created_At,
                Last_Login = user.Last_Login,
                Account_Status = user.Account_Status
            };
        }
    }
}
