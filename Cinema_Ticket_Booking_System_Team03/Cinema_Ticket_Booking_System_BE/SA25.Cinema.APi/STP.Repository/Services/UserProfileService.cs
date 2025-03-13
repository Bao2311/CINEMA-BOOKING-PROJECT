using Microsoft.EntityFrameworkCore;
using STP.Repository.Models;
using STP.Repository.Dtos;
using STP.Repositories;
using System;
using System.Threading.Tasks;
using sa25.Repository.Data;

namespace STP.Repository.Services
{
    public interface IUserProfileService
    {
        Task<object> GetUserProfileAsync(int userId);
        Task<object> UpdateUserProfileAsync(int userId, BaseUpdateProfileDTO updateDto);
    }

    public class UserProfileService : IUserProfileService
    {
        private readonly UnitOfWork _unitOfWork;

        public UserProfileService(UnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<object> GetUserProfileAsync(int userId)
        {
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            return user.Role?.ToLower() switch
            {
                "customer" => MapToCustomerProfile(user),
                "admin" => MapToAdminProfile(user),
                "staff" => MapToStaffProfile(user),
                _ => throw new InvalidOperationException("Invalid user role")
            };
        }

        public async Task<object> UpdateUserProfileAsync(int userId, BaseUpdateProfileDTO updateDto)
        {
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