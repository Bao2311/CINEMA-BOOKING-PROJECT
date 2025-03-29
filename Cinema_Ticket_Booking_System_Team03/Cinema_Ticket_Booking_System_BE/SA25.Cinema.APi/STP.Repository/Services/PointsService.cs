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
    public class PointsService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<PointsService> _logger;

        public PointsService(CinemaDbContext context, ILogger<PointsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy thông tin điểm hiện tại của người dùng
        /// </summary>
        public async Task<UserPointsDTO> GetUserPointsAsync(int userId)
        {
            try
            {
                var userPoints = await _context.UserPoints
                    .FirstOrDefaultAsync(up => up.User_ID == userId);

                if (userPoints == null)
                {
                    return new UserPointsDTO
                    {
                        User_ID = userId,
                        Total_Points = 0,
                        Last_Updated = DateTime.MinValue
                    };
                }

                return new UserPointsDTO
                {
                    User_ID = userPoints.User_ID,
                    Total_Points = userPoints.Total_Points,
                    Last_Updated = userPoints.Last_Updated
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy thông tin điểm của người dùng {userId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy tổng số điểm hiện tại của người dùng (chỉ trả về số điểm)
        /// </summary>
        public async Task<int> GetUserPointsTotalAsync(int userId)
        {
            try
            {
                var userPoints = await _context.UserPoints
                    .FirstOrDefaultAsync(up => up.User_ID == userId);

                return userPoints?.Total_Points ?? 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy tổng số điểm của người dùng {userId}");
                throw;
            }
        }

        /// <summary>
        /// Thêm điểm cho người dùng từ booking
        /// </summary>
        public async Task<int> AddPointsFromBookingAsync(int userId, int bookingId, decimal totalAmount, int pointsRedeemed = 0)
        {
            try
            {
                // Tính số điểm được cộng (5% của số tiền thanh toán thực tế)
                decimal actualAmount = totalAmount - pointsRedeemed;
                int pointsToAdd = (int)Math.Floor(actualAmount * 0.05m);

                // Tạo bản ghi lịch sử tích điểm
                var pointsEarning = new PointsEarning
                {
                    User_ID = userId,
                    Booking_ID = bookingId,
                    Actual_Amount = actualAmount,
                    Points_Earned = pointsToAdd,
                    Date = DateTime.Now
                };

                _context.PointsEarnings.Add(pointsEarning);

                // Cập nhật tổng điểm của người dùng
                var userPoints = await _context.UserPoints
                    .FirstOrDefaultAsync(up => up.User_ID == userId);

                if (userPoints == null)
                {
                    // Tạo mới nếu chưa có
                    userPoints = new UserPoints
                    {
                        User_ID = userId,
                        Total_Points = pointsToAdd,
                        Last_Updated = DateTime.Now
                    };
                    _context.UserPoints.Add(userPoints);
                }
                else
                {
                    // Cập nhật nếu đã có
                    userPoints.Total_Points += pointsToAdd;
                    userPoints.Last_Updated = DateTime.Now;
                    _context.UserPoints.Update(userPoints);
                }

                // Lưu thay đổi vào cơ sở dữ liệu
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Đã thêm {pointsToAdd} điểm cho người dùng {userId} từ booking {bookingId}");

                return pointsToAdd;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi thêm điểm từ booking {bookingId} cho người dùng {userId}");
                throw;
            }
        }

        /// <summary>
        /// Sử dụng điểm
        /// </summary>
        public async Task<PointsRedemption> RedeemPointsAsync(int userId, int pointsToRedeem)
        {
            try
            {
                // Kiểm tra số điểm hiện có của người dùng
                var userPoints = await _context.UserPoints
                    .FirstOrDefaultAsync(up => up.User_ID == userId);

                if (userPoints == null || userPoints.Total_Points < pointsToRedeem)
                {
                    throw new InvalidOperationException($"Người dùng không có đủ điểm. Hiện có: {userPoints?.Total_Points ?? 0}, Yêu cầu: {pointsToRedeem}");
                }

                // Tạo bản ghi sử dụng điểm
                var redemption = new PointsRedemption
                {
                    User_ID = userId,
                    Points_Redeemed = pointsToRedeem,
                    Date = DateTime.Now,
                    Status = "Completed"
                };

                _context.PointsRedemptions.Add(redemption);

                // Cập nhật tổng điểm của người dùng
                userPoints.Total_Points -= pointsToRedeem;
                userPoints.Last_Updated = DateTime.Now;
                _context.UserPoints.Update(userPoints);

                // Lưu thay đổi vào cơ sở dữ liệu
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Người dùng {userId} đã sử dụng {pointsToRedeem} điểm");

                return redemption;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi sử dụng {pointsToRedeem} điểm cho người dùng {userId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy lịch sử tích điểm của người dùng
        /// </summary>
        public async Task<List<PointsEarningDTO>> GetPointsEarningHistoryAsync(int userId)
        {
            try
            {
                var history = await _context.PointsEarnings
                    .Where(pe => pe.User_ID == userId)
                    .OrderByDescending(pe => pe.Date)
                    .Select(pe => new PointsEarningDTO
                    {
                        Earning_ID = pe.Earning_ID,
                        User_ID = pe.User_ID,
                        Booking_ID = pe.Booking_ID,
                        Actual_Amount = pe.Actual_Amount,
                        Points_Earned = pe.Points_Earned,
                        Date = pe.Date
                    })
                    .ToListAsync();

                return history;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy lịch sử tích điểm của người dùng {userId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy lịch sử sử dụng điểm của người dùng
        /// </summary>
        public async Task<List<PointsRedemptionDTO>> GetPointsRedemptionHistoryAsync(int userId)
        {
            try
            {
                var history = await _context.PointsRedemptions
                    .Where(pr => pr.User_ID == userId)
                    .OrderByDescending(pr => pr.Date)
                    .Select(pr => new PointsRedemptionDTO
                    {
                        Redemption_ID = pr.Redemption_ID,
                        User_ID = pr.User_ID,
                        Points_Redeemed = pr.Points_Redeemed,
                        Date = pr.Date,
                        Status = pr.Status
                    })
                    .ToListAsync();

                return history;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy lịch sử sử dụng điểm của người dùng {userId}");
                throw;
            }
        }
    }
}

