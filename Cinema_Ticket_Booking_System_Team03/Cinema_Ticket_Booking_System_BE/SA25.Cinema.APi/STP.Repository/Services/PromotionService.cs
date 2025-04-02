using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class PromotionService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<PromotionService> _logger;

        public PromotionService(CinemaDbContext context, ILogger<PromotionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy TOÀN BỘ danh sách các khuyến mãi (bao gồm active, inactive, expired,...).
        /// Trạng thái thực tế (Is_Active, Is_Expired) được tính toán cho từng khuyến mãi.
        /// </summary>
        /// <returns>Danh sách tất cả các PromotionSummaryDto.</returns>
        public async Task<List<PromotionSummaryDto>> GetAllPromotionsAsync() // Bỏ tham số includeInactive
        {
            _logger.LogInformation("Fetching ALL promotions.");
            var now = DateTime.Now; // Lấy thời gian hiện tại một lần

            try
            {
                // Không còn lọc theo includeInactive nữa, lấy tất cả từ Promotions
                var promotions = await _context.Promotions
                    .Include(p => p.CreatedBy) // Nạp thông tin người tạo (User)
                    .OrderByDescending(p => p.Created_At) // Sắp xếp (ví dụ: mới nhất lên đầu)
                    .Select(p => new PromotionSummaryDto // Ánh xạ sang DTO
                    {
                        Promotion_ID = p.Promotion_ID,
                        Title = p.Title,
                        Promotion_Code = p.Promotion_Code,
                        Start_Date = p.Start_Date,
                        End_Date = p.End_Date,
                        Discount_Type = p.Discount_Type,
                        Discount_Value = p.Discount_Value,
                        Minimum_Purchase = p.Minimum_Purchase,
                        Maximum_Discount = p.Maximum_Discount,
                        Applicable_For = p.Applicable_For,
                        Usage_Limit = p.Usage_Limit,
                        Current_Usage = p.Current_Usage,
                        Status = p.Status, // Giữ nguyên Status gốc từ DB
                        Promotion_Detail = p.Promotion_Detail,
                        Created_At = p.Created_At,
                        Created_By = p.CreatedBy != null ? p.CreatedBy.Full_Name : "Không xác định",
                        // Tính toán trạng thái thực tế dựa trên thời gian hiện tại và Status
                        Is_Expired = p.End_Date < now,
                        Is_Active = p.Status == "Active" && p.Start_Date <= now && p.End_Date >= now
                    })
                    .ToListAsync(); // Lấy danh sách kết quả

                _logger.LogInformation("Successfully fetched {Count} total promotions.", promotions.Count);
                return promotions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all promotions.");
                throw; // Ném lại lỗi
            }
        }

        public async Task<object> GetPromotionAsync(int id)
        {
            var promotion = await _context.Promotions
                .Include(p => p.CreatedBy)
                .Include(p => p.PromotionUsages)
                .FirstOrDefaultAsync(p => p.Promotion_ID == id);

            if (promotion == null)
                throw new KeyNotFoundException($"Không tìm thấy khuyến mãi có ID {id}");

            var usageByDate = await _context.PromotionUsages
                .Where(pu => pu.Promotion_ID == id)
                .GroupBy(pu => pu.Applied_Date.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Count = g.Count(),
                    Total_Discount = g.Sum(pu => pu.Discount_Amount)
                })
                .OrderByDescending(x => x.Date)
                .Take(30)
                .ToListAsync();

            return new
            {
                promotion.Promotion_ID,
                promotion.Title,
                promotion.Promotion_Code,
                promotion.Start_Date,
                promotion.End_Date,
                promotion.Discount_Type,
                promotion.Discount_Value,
                promotion.Minimum_Purchase,
                promotion.Maximum_Discount,
                promotion.Applicable_For,
                promotion.Usage_Limit,
                promotion.Current_Usage,
                promotion.Status,
                promotion.Promotion_Detail,
                promotion.Created_At,
                Created_By = promotion.CreatedBy.Full_Name,
                Is_Expired = promotion.End_Date < DateTime.Now,
                Is_Active = promotion.Status == "Active" && promotion.Start_Date <= DateTime.Now && promotion.End_Date >= DateTime.Now,
                Usage_Statistics = new
                {
                    Total_Usage = promotion.Current_Usage,
                    Total_Discount = promotion.PromotionUsages.Sum(pu => pu.Discount_Amount),
                    Average_Discount = promotion.PromotionUsages.Any()
                        ? promotion.PromotionUsages.Average(pu => pu.Discount_Amount)
                        : 0,
                    Usage_By_Date = usageByDate
                }
            };
        }

        public async Task<object> CreatePromotionAsync(PromotionCreateDto model, int userId)
        {
            if (await _context.Promotions.AnyAsync(p => p.Promotion_Code == model.Promotion_Code))
                throw new ArgumentException($"Mã khuyến mãi '{model.Promotion_Code}' đã tồn tại");

            if (model.Start_Date >= model.End_Date)
                throw new ArgumentException("Ngày bắt đầu phải trước ngày kết thúc");

            var promotion = new Promotion
            {
                Title = model.Title,
                Promotion_Code = model.Promotion_Code,
                Start_Date = model.Start_Date,
                End_Date = model.End_Date,
                Discount_Type = model.Discount_Type,
                Discount_Value = model.Discount_Value,
                Minimum_Purchase = model.Minimum_Purchase,
                Maximum_Discount = model.Maximum_Discount,
                Applicable_For = model.Applicable_For,
                Usage_Limit = model.Usage_Limit,
                Current_Usage = 0,
                Status = model.Status ?? "Active",
                Promotion_Detail = model.Promotion_Detail,
                Created_By = userId,
                Created_At = DateTime.Now
            };

            _context.Promotions.Add(promotion);
            await _context.SaveChangesAsync();

            return new
            {
                promotion.Promotion_ID,
                promotion.Title,
                promotion.Promotion_Code,
                promotion.Start_Date,
                promotion.End_Date,
                promotion.Discount_Type,
                promotion.Discount_Value,
                promotion.Status
            };
        }

        public async Task<object> UpdatePromotionAsync(int id, PromotionUpdateDto model)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null)
                throw new KeyNotFoundException($"Không tìm thấy khuyến mãi có ID {id}");

            if (model.Promotion_Code != promotion.Promotion_Code &&
                await _context.Promotions.AnyAsync(p => p.Promotion_Code == model.Promotion_Code))
            {
                throw new ArgumentException($"Mã khuyến mãi '{model.Promotion_Code}' đã tồn tại");
            }

            var hasBeenUsed = await _context.PromotionUsages.AnyAsync(pu => pu.Promotion_ID == id);

            if (hasBeenUsed)
            {
                promotion.Title = model.Title;
                promotion.End_Date = model.End_Date;
                promotion.Maximum_Discount = model.Maximum_Discount;
                promotion.Status = model.Status;
                promotion.Promotion_Detail = model.Promotion_Detail;
                promotion.Usage_Limit = model.Usage_Limit;

                await _context.SaveChangesAsync();

                return new
                {
                    promotion.Promotion_ID,
                    promotion.Title,
                    promotion.End_Date,
                    promotion.Status,
                    limited_update = true,
                    message = "Khuyến mãi đã được sử dụng, chỉ có thể cập nhật một số thông tin"
                };
            }

            promotion.Title = model.Title;
            promotion.Promotion_Code = model.Promotion_Code;
            promotion.Start_Date = model.Start_Date;
            promotion.End_Date = model.End_Date;
            promotion.Discount_Type = model.Discount_Type;
            promotion.Discount_Value = model.Discount_Value;
            promotion.Minimum_Purchase = model.Minimum_Purchase;
            promotion.Maximum_Discount = model.Maximum_Discount;
            promotion.Applicable_For = model.Applicable_For;
            promotion.Usage_Limit = model.Usage_Limit;
            promotion.Status = model.Status;
            promotion.Promotion_Detail = model.Promotion_Detail;

            await _context.SaveChangesAsync();

            return new
            {
                promotion.Promotion_ID,
                promotion.Title,
                promotion.Promotion_Code,
                promotion.Start_Date,
                promotion.End_Date,
                promotion.Discount_Type,
                promotion.Discount_Value,
                promotion.Status,
                limited_update = false
            };
        }

        public async Task<object> DeletePromotionAsync(int id)
        {
            var promotion = await _context.Promotions.FindAsync(id);
            if (promotion == null)
                throw new KeyNotFoundException($"Không tìm thấy khuyến mãi có ID {id}");

            var hasBeenUsed = await _context.PromotionUsages.AnyAsync(pu => pu.Promotion_ID == id);

            // Đối với tất cả các trường hợp, sử dụng xóa mềm
            if (hasBeenUsed)
            {
                promotion.Status = "Inactive";
            }
            else
            {
                promotion.Status = "Deleted";
            }

            await _context.SaveChangesAsync();

            return new
            {
                status = hasBeenUsed ? "deactivated" : "deleted",
                message = hasBeenUsed
                    ? "Khuyến mãi đã được sử dụng, đã đánh dấu là không hoạt động"
                    : "Khuyến mãi đã được đánh dấu là đã xóa"
            };
        }

        public async Task<PromotionValidationResult> ValidatePromotionAsync(string promotionCode, int userId, decimal totalAmount)
        {
            if (string.IsNullOrEmpty(promotionCode))
                return new PromotionValidationResult { IsValid = false, Message = "Mã khuyến mãi không được để trống" };

            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Promotion_Code == promotionCode);

            if (promotion == null)
                return new PromotionValidationResult { IsValid = false, Message = "Mã khuyến mãi không tồn tại" };

            // Kiểm tra người dùng đã sử dụng mã này chưa
            var userPromotionUsage = await _context.PromotionUsages
                .FirstOrDefaultAsync(u => u.User_ID == userId &&
                                          u.Promotion_ID == promotion.Promotion_ID &&
                                          u.HasUsed);

            if (userPromotionUsage != null)
                return new PromotionValidationResult { IsValid = false, Message = "Bạn đã sử dụng mã khuyến mãi này rồi" };

            // Các kiểm tra khác như cũ...
            if (promotion.Status != "Active")
                return new PromotionValidationResult { IsValid = false, Message = "Mã khuyến mãi không hoạt động" };

            var now = DateTime.Now;
            if (now < promotion.Start_Date)
                return new PromotionValidationResult
                {
                    IsValid = false,
                    Message = $"Mã khuyến mãi chỉ có hiệu lực từ {promotion.Start_Date:dd/MM/yyyy}"
                };

            if (now > promotion.End_Date)
                return new PromotionValidationResult { IsValid = false, Message = "Mã khuyến mãi đã hết hạn" };

            if (promotion.Usage_Limit.HasValue && promotion.Current_Usage >= promotion.Usage_Limit.Value)
                return new PromotionValidationResult { IsValid = false, Message = "Mã khuyến mãi đã hết lượt sử dụng" };

            if (totalAmount < promotion.Minimum_Purchase)
                return new PromotionValidationResult
                {
                    IsValid = false,
                    Message = $"Đơn hàng tối thiểu phải từ {promotion.Minimum_Purchase:N0} VND"
                };

            decimal discountAmount = 0;
            if (promotion.Discount_Type == "Percentage")
            {
                discountAmount = totalAmount * (promotion.Discount_Value / 100);
                if (promotion.Maximum_Discount.HasValue && discountAmount > promotion.Maximum_Discount.Value)
                {
                    discountAmount = promotion.Maximum_Discount.Value;
                }
            }
            else
            {
                discountAmount = promotion.Discount_Value;
                if (discountAmount > totalAmount)
                {
                    discountAmount = totalAmount;
                }
            }

            return new PromotionValidationResult
            {
                IsValid = true,
                PromotionId = promotion.Promotion_ID,
                PromotionCode = promotion.Promotion_Code,
                Title = promotion.Title,
                DiscountType = promotion.Discount_Type,
                DiscountValue = promotion.Discount_Value,
                DiscountAmount = Math.Round(discountAmount, 0),
                FinalAmount = Math.Round(totalAmount - discountAmount, 0),
                ExpiresOn = promotion.End_Date,
                Message = "Mã khuyến mãi hợp lệ"
            };
        }

        public async Task<PromotionApplicationResult> ApplyPromotionAsync(int bookingId, string promotionCode, int currentUserId)
        {
            _logger.LogInformation($"Bắt đầu áp dụng mã khuyến mãi: BookingId={bookingId}, PromotionCode={promotionCode}, RequestedBy={currentUserId}");

            // Kiểm tra đầu vào
            if (string.IsNullOrEmpty(promotionCode) || bookingId <= 0)
            {
                return new PromotionApplicationResult
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ"
                };
            }

            // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Lấy thông tin đơn đặt vé
                var booking = await _context.TicketBookings
                    .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

                if (booking == null)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Không tìm thấy đơn đặt vé"
                    };
                }

                // Xác định userId chính xác
                int userId = booking.User_ID ?? 0;
                if (userId == 0)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Không xác định được người dùng"
                    };
                }

                // Kiểm tra trạng thái đơn đặt vé
                if (booking.Status != "Pending")
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Chỉ có thể áp dụng khuyến mãi cho đơn đặt vé chưa thanh toán"
                    };
                }

                // Kiểm tra đơn đặt vé đã có mã khuyến mãi chưa
                if (booking.Promotion_ID.HasValue)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Đơn đặt vé đã áp dụng khuyến mãi khác"
                    };
                }

                // Kiểm tra mã khuyến mãi
                var promotion = await _context.Promotions
                    .FirstOrDefaultAsync(p => p.Promotion_Code == promotionCode);

                if (promotion == null)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Mã khuyến mãi không tồn tại"
                    };
                }

                // Chi tiết log để debug
                _logger.LogInformation($"Promotion Details: ID={promotion.Promotion_ID}, Status={promotion.Status}, " +
                                       $"Start={promotion.Start_Date}, End={promotion.End_Date}");

                // Kiểm tra trạng thái khuyến mãi
                if (promotion.Status != PromotionConstants.StatusActive)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Mã khuyến mãi không hoạt động"
                    };
                }

                // Kiểm tra thời gian hiệu lực
                var now = DateTime.Now;
                if (now < promotion.Start_Date || now > promotion.End_Date)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Mã khuyến mãi không còn hiệu lực"
                    };
                }

                // Kiểm tra giới hạn sử dụng
                if (promotion.Usage_Limit.HasValue &&
                    promotion.Current_Usage >= promotion.Usage_Limit.Value)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Mã khuyến mãi đã hết lượt sử dụng"
                    };
                }

                // Kiểm tra số tiền tối thiểu
                if (booking.Total_Amount < promotion.Minimum_Purchase)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = $"Đơn hàng tối thiểu phải từ {promotion.Minimum_Purchase:N0} VND"
                    };
                }

                // Kiểm tra chi tiết việc sử dụng khuyến mãi
                var existingActivePromotionUsages = await _context.PromotionUsages
                    .Include(pu => pu.Promotion)
                    .Where(pu =>
                        pu.User_ID == userId &&
                        pu.HasUsed &&
                        pu.Promotion.Status == PromotionConstants.StatusActive)
                    .ToListAsync();

                // Log chi tiết các khuyến mãi đã sử dụng
                foreach (var existingUsage in existingActivePromotionUsages)
                {
                    _logger.LogInformation($"Existing Usage: PromotionID={existingUsage.Promotion_ID}, " +
                                           $"PromotionCode={existingUsage.Promotion.Promotion_Code}");
                }

                // Kiểm tra xem đã sử dụng mã khuyến mãi nào chưa
                var hasActivePromotion = existingActivePromotionUsages.Any(pu =>
                    pu.Promotion.Promotion_Code != promotionCode);

                if (hasActivePromotion)
                {
                    return new PromotionApplicationResult
                    {
                        Success = false,
                        Message = "Bạn đã sử dụng một mã khuyến mãi khác, mỗi người chỉ được sử dụng một mã"
                    };
                }

                // Tính toán giảm giá
                decimal discountAmount = CalculateDiscountAmount(promotion, booking.Total_Amount);

                // Tạo bản ghi sử dụng khuyến mãi
                var promotionUsage = new PromotionUsage
                {
                    User_ID = userId,
                    Promotion_ID = promotion.Promotion_ID,
                    Booking_ID = bookingId,
                    Discount_Amount = discountAmount,
                    Applied_Date = DateTime.Now,
                    HasUsed = true
                };
                _context.PromotionUsages.Add(promotionUsage);

                // Cập nhật đơn đặt vé
                booking.Promotion_ID = promotion.Promotion_ID;
                booking.Total_Amount -= discountAmount;

                // Tăng lượt sử dụng khuyến mãi
                promotion.Current_Usage += 1;

                // Lưu lịch sử
                var bookingHistory = new BookingHistory
                {
                    Booking_ID = bookingId,
                    Date = DateTime.Now,
                    Status = "Promotion Applied",
                    Notes = $"Áp dụng mã khuyến mãi {promotion.Promotion_Code}, giảm {discountAmount:N0} VND"
                };
                _context.BookingHistories.Add(bookingHistory);

                // Lưu thay đổi
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new PromotionApplicationResult
                {
                    Success = true,
                    BookingId = booking.Booking_ID,
                    PromotionId = promotion.Promotion_ID,
                    PromotionCode = promotion.Promotion_Code,
                    DiscountAmount = discountAmount,
                    OriginalTotal = booking.Total_Amount + discountAmount,
                    NewTotal = booking.Total_Amount,
                    Message = "Áp dụng khuyến mãi thành công"
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Lỗi khi áp dụng khuyến mãi: {ex.Message}");
                return new PromotionApplicationResult
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi áp dụng khuyến mãi"
                };
            }
        }

        // Phương thức tính toán giảm giá
        private decimal CalculateDiscountAmount(Promotion promotion, decimal totalAmount)
        {
            decimal discountAmount = 0;
            if (promotion.Discount_Type == PromotionConstants.DiscountTypePercentage)
            {
                discountAmount = totalAmount * (promotion.Discount_Value / 100m);
                if (promotion.Maximum_Discount.HasValue &&
                    discountAmount > promotion.Maximum_Discount.Value)
                {
                    discountAmount = promotion.Maximum_Discount.Value;
                }
            }
            else
            {
                discountAmount = promotion.Discount_Value;
                if (discountAmount > totalAmount)
                {
                    discountAmount = totalAmount;
                }
            }

            return Math.Round(discountAmount, 0);
        }

        public async Task<PromotionRemovalResult> RemovePromotionAsync(int bookingId, int userId)
        {
            var booking = await _context.TicketBookings
                .Include(b => b.PromotionUsages)
                .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

            if (booking == null)
                return new PromotionRemovalResult { Success = false, Message = "Không tìm thấy đơn đặt vé" };

            if (booking.Status != "Pending")
                return new PromotionRemovalResult { Success = false, Message = "Chỉ có thể hủy khuyến mãi cho đơn đặt vé chưa thanh toán" };

            if (!booking.Promotion_ID.HasValue)
                return new PromotionRemovalResult { Success = false, Message = "Đơn đặt vé chưa áp dụng khuyến mãi" };

            var promotionId = booking.Promotion_ID.Value;
            var promotion = await _context.Promotions.FindAsync(promotionId);

            if (promotion == null)
                return new PromotionRemovalResult { Success = false, Message = "Không tìm thấy khuyến mãi đã áp dụng" };

            var promotionUsage = booking.PromotionUsages.FirstOrDefault(pu => pu.Promotion_ID == promotionId);
            if (promotionUsage == null)
                return new PromotionRemovalResult { Success = false, Message = "Không tìm thấy thông tin sử dụng khuyến mãi" };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                decimal discountAmount = promotionUsage.Discount_Amount;
                booking.Total_Amount += discountAmount;
                booking.Promotion_ID = null;

                // Đánh dấu lại HasUsed về false
                promotionUsage.HasUsed = false;

                _context.PromotionUsages.Remove(promotionUsage);

                if (promotion.Current_Usage > 0)
                    promotion.Current_Usage -= 1;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new PromotionRemovalResult
                {
                    Success = true,
                    BookingId = booking.Booking_ID,
                    NewTotal = booking.Total_Amount,
                    Message = "Đã hủy áp dụng khuyến mãi thành công"
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Error removing promotion from booking {bookingId}");
                throw;
            }
        }

        public async Task<object> GetAvailablePromotionsAsync(decimal amount = 0)
        {
            var now = DateTime.Now;
            var promotions = await _context.Promotions
                .Where(p => p.Status == "Active" &&
                          p.Start_Date <= now &&
                          p.End_Date >= now &&
                          (!p.Usage_Limit.HasValue || p.Current_Usage < p.Usage_Limit.Value) &&
                          p.Minimum_Purchase <= amount)
                .OrderBy(p => p.Minimum_Purchase)
                .Select(p => new
                {
                    p.Promotion_ID,
                    p.Title,
                    p.Promotion_Code,
                    p.Discount_Type,
                    p.Discount_Value,
                    p.Minimum_Purchase,
                    p.Maximum_Discount,
                    p.End_Date,
                    Discount_Description = p.Discount_Type == "Percentage" ?
                        $"Giảm {p.Discount_Value}%" :
                        $"Giảm {p.Discount_Value:N0} VND",
                    Usage_Remaining = p.Usage_Limit.HasValue ?
                        p.Usage_Limit.Value - p.Current_Usage :
                        (int?)null
                })
                .ToListAsync();

            return promotions.Select(p =>
            {
                decimal discountAmount = 0;

                if (p.Discount_Type == "Percentage")
                {
                    discountAmount = amount * (p.Discount_Value / 100);
                    if (p.Maximum_Discount.HasValue && discountAmount > p.Maximum_Discount.Value)
                    {
                        discountAmount = p.Maximum_Discount.Value;
                    }
                }
                else
                {
                    discountAmount = p.Discount_Value;
                    if (discountAmount > amount)
                    {
                        discountAmount = amount;
                    }
                }

                return new
                {
                    p.Promotion_ID,
                    p.Title,
                    p.Promotion_Code,
                    p.Discount_Type,
                    p.Discount_Value,
                    p.Discount_Description,
                    p.Minimum_Purchase,
                    p.End_Date,
                    p.Usage_Remaining,
                    Discount_Amount = Math.Round(discountAmount, 0),
                    Final_Amount = Math.Round(amount - discountAmount, 0)
                };
            }).ToList();
        }

        public async Task ExpirePromotionsAsync()
        {
            try
            {
                var now = DateTime.Now;
                var expiredPromotions = await _context.Promotions
                    .Where(p => p.Status == "Active" && p.End_Date < now)
                    .ToListAsync();

                foreach (var promotion in expiredPromotions)
                {
                    promotion.Status = "Expired";
                    _logger.LogInformation($"Expired promotion: {promotion.Promotion_ID} - {promotion.Title}");
                }

                if (expiredPromotions.Any())
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Total {expiredPromotions.Count} promotions expired");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error expiring promotions");
            }
        }

        public static class PromotionConstants
        {
            public const string StatusActive = "Active";
            public const string StatusInactive = "Inactive";
            public const string StatusExpired = "Expired";
            public const string StatusDeleted = "Deleted";

            public const string DiscountTypePercentage = "Percentage";
            public const string DiscountTypeFixed = "Fixed";
        }
    }
}




