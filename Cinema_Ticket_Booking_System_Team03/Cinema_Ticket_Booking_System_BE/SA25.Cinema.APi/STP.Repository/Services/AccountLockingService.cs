using Microsoft.Extensions.Caching.Memory;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

/// <summary>
/// Dịch vụ quản lý việc khóa tài khoản sau nhiều lần đăng nhập thất bại.
/// </summary>
public class AccountLockingService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<AccountLockingService> _logger;
    private const int MAX_FAILED_ATTEMPTS = 5;
    private const int LOCK_DURATION_MINUTES = 30; // Thời gian khóa tài khoản (30 phút)

    /// <summary>
    /// Khởi tạo một instance mới của AccountLockingService.
    /// </summary>
    /// <param name="cache">Cache để lưu trữ thông tin về các lần đăng nhập thất bại và trạng thái khóa</param>
    /// <param name="logger">Logger để ghi lại các sự kiện</param>
    public AccountLockingService(IMemoryCache cache, ILogger<AccountLockingService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Kiểm tra xem tài khoản có đang bị khóa hay không.
    /// </summary>
    /// <param name="email">Email của tài khoản cần kiểm tra</param>
    /// <returns>true nếu tài khoản đang bị khóa, false nếu không</returns>
    public async Task<bool> IsAccountLockedAsync(string email)
    {
        string lockKey = $"lock_{email}";
        if (_cache.TryGetValue(lockKey, out bool isLocked) && isLocked)
        {
            // Kiểm tra thời gian còn lại của khóa
            _cache.TryGetValue($"lock_expiry_{email}", out DateTime expiryTime);
            TimeSpan remainingTime = expiryTime - DateTime.Now;

            _logger.LogWarning($"Tài khoản {email} đang bị khóa. Còn {remainingTime.TotalMinutes:0} phút để mở khóa");
            return true;
        }
        return false;
    }

    /// <summary>
    /// Lấy số lần đăng nhập thất bại của một tài khoản.
    /// </summary>
    /// <param name="email">Email của tài khoản</param>
    /// <returns>Số lần đăng nhập thất bại</returns>
    public async Task<int> GetFailedAttemptsAsync(string email)
    {
        string attemptsKey = $"attempts_{email}";
        _cache.TryGetValue(attemptsKey, out int attempts);
        return attempts;
    }

    /// <summary>
    /// Lấy thời gian còn lại (phút) trước khi tài khoản được mở khóa.
    /// </summary>
    /// <param name="email">Email của tài khoản</param>
    /// <returns>Số phút còn lại trước khi tài khoản được mở khóa, 0 nếu tài khoản không bị khóa</returns>
    public async Task<int> GetRemainingLockTimeAsync(string email)
    {
        if (!await IsAccountLockedAsync(email))
            return 0;

        _cache.TryGetValue($"lock_expiry_{email}", out DateTime expiryTime);
        int remainingMinutes = (int)Math.Ceiling((expiryTime - DateTime.Now).TotalMinutes);
        return remainingMinutes > 0 ? remainingMinutes : 0;
    }

    /// <summary>
    /// Ghi nhận một lần đăng nhập thất bại cho tài khoản.
    /// Nếu số lần thất bại vượt quá ngưỡng, tài khoản sẽ bị khóa.
    /// </summary>
    /// <param name="email">Email của tài khoản</param>
    /// <returns>true nếu tài khoản bị khóa sau lần thất bại này, false nếu chưa bị khóa</returns>
    public async Task<bool> RecordFailedAttemptAsync(string email)
    {
        string attemptsKey = $"attempts_{email}";
        string lockKey = $"lock_{email}";
        string lockExpiryKey = $"lock_expiry_{email}";

        // Tăng số lần đăng nhập thất bại
        int attempts = await GetFailedAttemptsAsync(email) + 1;

        // Lưu số lần đăng nhập thất bại vào cache với thời gian hết hạn 24 giờ
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromHours(24));
        _cache.Set(attemptsKey, attempts, cacheOptions);

        _logger.LogWarning($"Đăng nhập thất bại lần {attempts} cho tài khoản {email}");

        // Nếu đạt đến ngưỡng khóa tài khoản
        if (attempts >= MAX_FAILED_ATTEMPTS)
        {
            // Khóa tài khoản trong 30 phút
            var lockOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(LOCK_DURATION_MINUTES));
            _cache.Set(lockKey, true, lockOptions);

            // Lưu thời điểm hết hạn để tính toán thời gian còn lại
            DateTime expiryTime = DateTime.Now.AddMinutes(LOCK_DURATION_MINUTES);
            _cache.Set(lockExpiryKey, expiryTime, lockOptions);

            _logger.LogWarning($"Tài khoản {email} đã bị khóa trong {LOCK_DURATION_MINUTES} phút do đăng nhập sai {MAX_FAILED_ATTEMPTS} lần");

            return true;
        }

        return false;
    }

    /// <summary>
    /// Đặt lại số lần đăng nhập thất bại về 0 cho tài khoản.
    /// </summary>
    /// <param name="email">Email của tài khoản</param>
    public async Task ResetFailedAttemptsAsync(string email)
    {
        string attemptsKey = $"attempts_{email}";
        _cache.Remove(attemptsKey);
        _logger.LogInformation($"Đã đặt lại số lần đăng nhập thất bại cho tài khoản {email}");
    }

    /// <summary>
    /// Mở khóa tài khoản thủ công.
    /// </summary>
    /// <param name="email">Email của tài khoản cần mở khóa</param>
    public async Task UnlockAccountAsync(string email)
    {
        string attemptsKey = $"attempts_{email}";
        string lockKey = $"lock_{email}";
        string lockExpiryKey = $"lock_expiry_{email}";

        _cache.Remove(attemptsKey);
        _cache.Remove(lockKey);
        _cache.Remove(lockExpiryKey);

        _logger.LogInformation($"Tài khoản {email} đã được mở khóa thủ công");
    }
}
