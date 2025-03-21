using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using STP.Repository.Data;
using STP.Repository.Models;

namespace STP.Repository.Services
{
    /// <summary>
    /// Service để xử lý các chức năng liên quan đến thành viên
    /// </summary>
    public class MemberService
    {
        private readonly CinemaDbContext _context;

        public MemberService(CinemaDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Tìm kiếm thành viên theo số điện thoại
        /// </summary>
        public async Task<User> FindMemberByPhoneAsync(string phoneNumber)
        {
            return await _context.Users
                .Where(u => u.Phone_Number == phoneNumber && u.Account_Status == "Active")
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Tìm kiếm thành viên theo email
        /// </summary>
        public async Task<User> FindMemberByEmailAsync(string email)
        {
            return await _context.Users
                .Where(u => u.Email == email && u.Account_Status == "Active")
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Tìm kiếm thành viên theo ID
        /// </summary>
        public async Task<User> FindMemberByIdAsync(int userId)
        {
            return await _context.Users
                .Where(u => u.User_ID == userId && u.Account_Status == "Active")
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Lấy tổng điểm tích lũy hiện tại của thành viên
        /// </summary>
        public async Task<int> GetCurrentPointsAsync(int userId)
        {
            var pointsAdded = await _context.Scores
                .Where(s => s.User_ID == userId)
                .SumAsync(s => s.Points_Added);

            var pointsUsed = await _context.Scores
                .Where(s => s.User_ID == userId)
                .SumAsync(s => s.Points_Used);

            return pointsAdded - pointsUsed;
        }

        /// <summary>
        /// Kiểm tra thành viên có phải là VIP hay không
        /// </summary>
        public async Task<bool> IsVipMemberAsync(int userId)
        {
            var totalSpent = await _context.TicketBookings
                .Where(tb => tb.User_ID == userId && tb.Status == "Completed")
                .SumAsync(tb => tb.Total_Amount);

            // VIP member là người dùng đã chi tiêu ít nhất 2,000,000 VND
            return totalSpent >= 2000000;
        }

        /// <summary>
        /// Áp dụng giảm giá VIP (10%)
        /// </summary>
        public decimal ApplyVipDiscount(decimal originalAmount)
        {
            return originalAmount * 0.9M; // Giảm 10%
        }

        /// <summary>
        /// Quy đổi điểm thành tiền (100 điểm = 1 đơn vị tiền tệ)
        /// </summary>
        public decimal ConvertPointsToMoney(int points)
        {
            return points / 100.0M;
        }

        /// <summary>
        /// Sử dụng điểm để giảm giá đơn hàng
        /// </summary>
        public async Task<bool> UsePointsForDiscountAsync(int userId, int pointsToUse, int bookingId)
        {
            var availablePoints = await GetCurrentPointsAsync(userId);

            if (pointsToUse <= 0 || pointsToUse > availablePoints)
                return false;

            // Lưu lại việc sử dụng điểm
            var score = new Score
            {
                User_ID = userId,
                Points_Added = 0,
                Points_Used = pointsToUse,
                Date = DateTime.Now
            };

            // Cập nhật thông tin đặt vé
            var booking = await _context.TicketBookings.FindAsync(bookingId);
            if (booking != null)
            {
                booking.Points_Used += pointsToUse;

                // Cập nhật tổng tiền sau khi áp dụng điểm
                decimal pointsValue = ConvertPointsToMoney(pointsToUse);
                booking.Total_Amount -= pointsValue;
                if (booking.Total_Amount < 0)
                    booking.Total_Amount = 0;
            }

            await _context.Scores.AddAsync(score);
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Áp dụng khuyến mãi vào đơn đặt vé
        /// </summary>
        public async Task<bool> ApplyPromotionAsync(int promotionId, int bookingId, int userId)
        {
            var promotion = await _context.Promotions
                .Where(p => p.Promotion_ID == promotionId && p.Status == "Active")
                .FirstOrDefaultAsync();

            if (promotion == null)
                return false;

            // Kiểm tra thời hạn khuyến mãi
            if (DateTime.Now < promotion.Start_Date || DateTime.Now > promotion.End_Date)
                return false;

            // Kiểm tra giới hạn sử dụng
            if (promotion.Usage_Limit.HasValue && promotion.Current_Usage >= promotion.Usage_Limit.Value)
                return false;

            var booking = await _context.TicketBookings.FindAsync(bookingId);
            if (booking == null)
                return false;

            // Kiểm tra giá trị đơn hàng tối thiểu
            if (booking.Total_Amount < promotion.Minimum_Purchase)
                return false;

            decimal discountAmount = 0;

            // Tính toán giảm giá
            if (promotion.Discount_Type == "Percentage")
            {
                discountAmount = booking.Total_Amount * (promotion.Discount_Value / 100);

                // Áp dụng giảm giá tối đa nếu có
                if (promotion.Maximum_Discount.HasValue && discountAmount > promotion.Maximum_Discount.Value)
                {
                    discountAmount = promotion.Maximum_Discount.Value;
                }
            }
            else if (promotion.Discount_Type == "Fixed Amount")
            {
                discountAmount = promotion.Discount_Value;
            }

            // Cập nhật thông tin đặt vé
            booking.Promotion_ID = promotionId;
            booking.Total_Amount -= discountAmount;
            if (booking.Total_Amount < 0)
                booking.Total_Amount = 0;

            // Ghi nhận việc sử dụng khuyến mãi
            var promotionUsage = new PromotionUsage
            {
                Promotion_ID = promotionId,
                Booking_ID = bookingId,
                User_ID = userId,
                Discount_Amount = discountAmount,
                Applied_Date = DateTime.Now
            };

            // Tăng số lần sử dụng khuyến mãi
            promotion.Current_Usage++;

            await _context.PromotionUsages.AddAsync(promotionUsage);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}

