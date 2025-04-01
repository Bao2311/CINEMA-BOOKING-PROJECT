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
        private readonly UserRepository _userRepository; // Thêm tham chiếu đến UserRepository
        private const string CacheKeyPrefix = "EmailVerification_";

        public EmailVerificationService(
            IMemoryCache cache,
            EmailService emailService,
            ILogger<EmailVerificationService> logger,
            UserRepository userRepository) // Thêm UserRepository vào constructor
        {
            _cache = cache;
            _emailService = emailService;
            _logger = logger;
            _userRepository = userRepository;
        }

        // Tạo và lưu token xác thực
        public async Task<bool> GenerateVerificationTokenAsync(string email, string fullName)
        {
            try
            {
                _logger.LogInformation($"Generating verification token for: {email}");

                // Tạo token ngẫu nhiên
                string token = Guid.NewGuid().ToString("N");

                // Lưu token vào cache với thời gian hết hạn 24 giờ
                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromHours(24));

                _cache.Set($"{CacheKeyPrefix}{token}", email, cacheEntryOptions);

                // Gửi email xác thực
                await _emailService.SendVerificationEmailAsync(email, fullName, token);

                _logger.LogInformation($"Verification email sent to: {email}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating verification token: {ex.Message}");
                return false;
            }
        }

        // Xác thực token - không yêu cầu tham số UserRepository nữa
        public async Task<bool> VerifyEmailAsync(string token)
        {
            try
            {
                _logger.LogInformation($"Verifying token: {token}");

                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("Token is null or empty");
                    return false;
                }

                // Kiểm tra token trong cache
                string cacheKey = $"EmailVerification_{token}";
                if (_cache.TryGetValue(cacheKey, out string email))
                {
                    _logger.LogInformation($"Token found for email: {email}");

                    // Xóa token khỏi cache sau khi xác thực thành công
                    _cache.Remove(cacheKey);

                    // Tìm người dùng với email chính xác
                    var user = await _userRepository.GetByExactEmailAsync(email);

                    if (user != null)
                    {
                        _logger.LogInformation($"User found: {user.Full_Name} (ID: {user.User_ID}), Email: {user.Email}, Status: {user.Account_Status}");

                        // Kiểm tra xem email có khớp chính xác không
                        if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
                        {
                            _logger.LogWarning($"Email mismatch: Token email={email}, User email={user.Email}");
                            return false;
                        }

                        if (user.Account_Status == "Pending")
                        {
                            _logger.LogInformation($"Updating user status to Active for: {email}, ID: {user.User_ID}");

                            user.Account_Status = "Active";
                            await _userRepository.UpdateAsync(user);

                            // Gửi email chào mừng
                            await _emailService.SendWelcomeEmailAsync(email, user.Full_Name);
                            _logger.LogInformation($"Welcome email sent to: {email}");
                        }
                        else
                        {
                            _logger.LogWarning($"User not in Pending status: {email}, ID: {user.User_ID}, Current status: {user.Account_Status}");
                        }

                        return true;
                    }
                    else
                    {
                        _logger.LogWarning($"User not found with exact email: {email}");
                        return false;
                    }
                }
                else
                {
                    _logger.LogWarning($"Token not found in cache: {token}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error verifying email: {ex.Message}");
                return false;
            }
        }

        // Kiểm tra email đã xác thực chưa
        public bool IsEmailVerified(string email)
        {
            return _cache.TryGetValue($"Verified_{email}", out bool verified) && verified;
        }
    }
}



