using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using STP.Repositories;
using System;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class EmailVerificationService
    {
        private readonly IMemoryCache _cache;
        private readonly EmailService _emailService;
        private readonly ILogger<EmailVerificationService> _logger;
        private const string CacheKeyPrefix = "EmailVerification_";

        public EmailVerificationService(IMemoryCache cache, EmailService emailService, ILogger<EmailVerificationService> logger)
        {
            _cache = cache;
            _emailService = emailService;
            _logger = logger;
        }

        // Tạo và lưu token xác thực
        public async Task<string> GenerateVerificationTokenAsync(string email, string fullName)
        {
            // Tạo token ngẫu nhiên
            string token = Guid.NewGuid().ToString("N");

            // Lưu token vào cache với thời gian hết hạn 24 giờ
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(24));

            _cache.Set($"{CacheKeyPrefix}{token}", email, cacheEntryOptions);

            // Gửi email xác thực
            await _emailService.SendVerificationEmailAsync(email, fullName, token);

            return token;
        }

        // Xác thực token
        public async Task<bool> VerifyEmailAsync(string token, UserRepository userRepository)
        {
            if (string.IsNullOrEmpty(token))
                return false;

            // Kiểm tra token trong cache
            if (_cache.TryGetValue($"{CacheKeyPrefix}{token}", out string email))
            {
                // Xóa token khỏi cache sau khi xác thực thành công
                _cache.Remove($"{CacheKeyPrefix}{token}");

                // Lưu trạng thái xác thực
                _cache.Set($"Verified_{email}", true, TimeSpan.FromDays(365));

                // Cập nhật trạng thái tài khoản trong DB
                var user = await userRepository.GetByEmailAsync(email);
                if (user != null && user.Account_Status == "Pending")
                {
                    user.Account_Status = "Active";
                    await userRepository.UpdateAsync(user);

                    // Gửi email chào mừng sau khi xác thực thành công
                    try
                    {
                        await _emailService.SendWelcomeEmailAsync(email, user.Full_Name);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Lỗi khi gửi email chào mừng");
                    }
                }

                return true;
            }

            return false;
        }

        // Kiểm tra email đã xác thực chưa
        public bool IsEmailVerified(string email)
        {
            return _cache.TryGetValue($"Verified_{email}", out bool verified) && verified;
        }
    }
}
