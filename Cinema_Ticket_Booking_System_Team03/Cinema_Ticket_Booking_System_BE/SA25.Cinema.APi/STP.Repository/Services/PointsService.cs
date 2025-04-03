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
        /// Áp dụng điểm giảm giá cho booking
        /// </summary>
        public async Task<BookingResponseDTO> ApplyPointsDiscount(int bookingId, int userId, int pointsToUse)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Lấy thông tin booking
                var booking = await _context.TicketBookings
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    throw new KeyNotFoundException($"Không tìm thấy booking với ID {bookingId}");
                }

                // THÊM MỚI: Kiểm tra và sử dụng User_ID từ booking nếu có
                if (booking.User_ID.HasValue && booking.User_ID.Value > 0)
                {
                    // Nếu booking đã liên kết với khách hàng và userId được truyền vào không khớp
                    if (booking.User_ID.Value != userId)
                    {
                        _logger.LogWarning($"Đang sử dụng booking.User_ID ({booking.User_ID.Value}) thay vì userId được truyền vào ({userId})");
                        userId = booking.User_ID.Value; // Sử dụng ID của khách hàng liên kết với booking
                    }
                }
                else
                {
                    throw new InvalidOperationException($"Booking {bookingId} chưa được liên kết với khách hàng");
                }

                // Lưu lại tổng tiền ban đầu
                decimal originalTotalAmount = booking.Total_Amount;

                // Lấy tỷ lệ chuyển đổi điểm sang tiền
                decimal pointConversionRate = 1m;

                // Tính số tiền giảm
                decimal discountAmount = pointsToUse * pointConversionRate;

                // Giới hạn giảm giá tối đa 50% tổng số tiền
                decimal maxDiscountAllowed = originalTotalAmount * 0.5m;
                discountAmount = Math.Min(discountAmount, maxDiscountAllowed);

                // Tính lại số điểm thực tế sẽ sử dụng (dựa trên discountAmount đã giới hạn)
                int actualPointsToUse = (int)Math.Ceiling(discountAmount / pointConversionRate);

                // Cập nhật điểm người dùng
                var userPoints = await _context.UserPoints
                    .FirstOrDefaultAsync(up => up.User_ID == userId);

                if (userPoints == null)
                {
                    throw new InvalidOperationException($"Không tìm thấy thông tin điểm của người dùng {userId}");
                }

                // Kiểm tra số dư điểm
                if (userPoints.Total_Points < actualPointsToUse)
                {
                    throw new InvalidOperationException($"Số dư điểm không đủ. Hiện có: {userPoints.Total_Points}, Yêu cầu: {actualPointsToUse}");
                }

                // Cập nhật tổng số tiền booking
                decimal discountedTotalAmount = originalTotalAmount - discountAmount;
                booking.Total_Amount = discountedTotalAmount;
                booking.Points_Used = actualPointsToUse;

                // Trừ điểm người dùng
                userPoints.Total_Points -= actualPointsToUse;
                userPoints.Last_Updated = DateTime.Now;

                // Tạo bản ghi đổi điểm
                var pointsRedemption = new PointsRedemption
                {
                    User_ID = userId,
                    Points_Redeemed = actualPointsToUse,
                    Date = DateTime.Now,
                    Status = "Completed",
                    Note = $"Áp dụng điểm giảm giá cho booking {bookingId}" // Thêm ghi chú
                };
                _context.PointsRedemptions.Add(pointsRedemption);

                // Thêm lịch sử booking
                var bookingHistory = new BookingHistory
                {
                    Booking_ID = bookingId,
                    Status = "Points Applied",
                    Date = DateTime.Now,
                    Notes = $"Áp dụng {actualPointsToUse} điểm giảm giá ({discountAmount:C0})"
                };
                _context.BookingHistories.Add(bookingHistory);

                // Lưu các thay đổi
                await _context.SaveChangesAsync();

                // Commit transaction
                await transaction.CommitAsync();

                // Tạo response DTO
                var response = new BookingResponseDTO
                {
                    Booking_ID = booking.Booking_ID,
                    OriginalTotalAmount = originalTotalAmount,
                    DiscountedTotalAmount = discountedTotalAmount,
                    PointsUsed = actualPointsToUse,
                    CurrentPoints = userPoints.Total_Points,

                    User_ID = booking.User_ID,
                    Booking_Date = booking.Booking_Date,
                    Status = booking.Status,
                    MovieName = booking.Showtime?.Movie?.Movie_Name,
                    RoomName = booking.Showtime?.CinemaRoom?.Room_Name,
                    Show_Date = booking.Showtime.Show_Date,
                    Start_Time = booking.Showtime.Start_Time
                };

                return response;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Lỗi khi áp dụng điểm giảm giá cho booking {bookingId}");
                throw;
            }
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
                // Kiểm tra trạng thái của booking
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    throw new KeyNotFoundException($"Không tìm thấy booking với ID {bookingId}");
                }

                // Chỉ tích điểm nếu booking ở trạng thái "Confirmed" và không bị hủy
                if (booking.Status != "Confirmed")
                {
                    _logger.LogWarning($"Không thể tích điểm cho booking {bookingId}. Trạng thái booking: {booking.Status}. Yêu cầu trạng thái: Confirmed.");
                    return 0; // Không tích điểm
                }

                // Tính số điểm được cộng (5% của số tiền thanh toán thực tế)
                decimal actualAmount = totalAmount - pointsRedeemed;
                int pointsToAdd = (int)Math.Floor(actualAmount * 0.05m);

                // Kiểm tra xem đã tích điểm cho booking này chưa
                var existingEarning = await _context.PointsEarnings
                    .FirstOrDefaultAsync(pe => pe.Booking_ID == bookingId && pe.User_ID == userId);

                if (existingEarning != null)
                {
                    _logger.LogWarning($"Booking {bookingId} đã được tích điểm trước đó. Không tích điểm lại.");
                    return 0; // Không tích điểm nếu đã tích trước đó
                }

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

        public async Task RefundPointsForExpiredBookingAsync(int bookingId, int userId, int pointsToRefund)
        {
            try
            {
                _logger.LogInformation($"Bắt đầu hoàn trả {pointsToRefund} điểm cho User {userId} từ booking {bookingId}");

                // Kiểm tra tham số đầu vào
                if (pointsToRefund <= 0)
                {
                    _logger.LogWarning($"Số điểm hoàn trả không hợp lệ: {pointsToRefund} cho booking {bookingId}");
                    return; // Không có điểm để hoàn trả
                }

                // Tìm bản ghi điểm người dùng
                var userPoints = await _context.UserPoints
                    .FirstOrDefaultAsync(up => up.User_ID == userId);

                if (userPoints == null)
                {
                    _logger.LogInformation($"Không tìm thấy thông tin điểm cho người dùng {userId}, đang tạo mới...");

                    // Tạo mới bản ghi UserPoints nếu chưa có
                    userPoints = new UserPoints
                    {
                        User_ID = userId,
                        Total_Points = pointsToRefund, // Bắt đầu với số điểm hoàn trả
                        Last_Updated = DateTime.Now
                    };
                    _context.UserPoints.Add(userPoints);
                }
                else
                {
                    _logger.LogInformation($"Cập nhật điểm từ {userPoints.Total_Points} thành {userPoints.Total_Points + pointsToRefund}");

                    // Hoàn trả điểm
                    userPoints.Total_Points += pointsToRefund;
                    userPoints.Last_Updated = DateTime.Now;
                }

                // Tạo bản ghi hoàn trả điểm
                var pointsRefundRecord = new PointsRedemption
                {
                    User_ID = userId,
                    Points_Redeemed = -pointsToRefund, // Giá trị âm để biểu thị hoàn trả
                    Date = DateTime.Now,
                    Status = "Refunded",
                    Note = $"Hoàn trả điểm cho booking {bookingId} bị hủy"
                };

                _context.PointsRedemptions.Add(pointsRefundRecord);

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Đã hoàn trả thành công {pointsToRefund} điểm cho người dùng {userId} từ booking {bookingId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi hoàn trả điểm cho booking {bookingId}: {ex.Message}");
                throw; // Re-throw exception để caller biết và xử lý
            }
        }
    }
}


