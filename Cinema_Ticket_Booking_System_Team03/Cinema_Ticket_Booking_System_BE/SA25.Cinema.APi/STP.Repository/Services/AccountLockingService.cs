using Microsoft.Extensions.Caching.Memory;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
public class AccountLockingService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<AccountLockingService> _logger;
    private const int MAX_FAILED_ATTEMPTS = 5;
    private const int LOCK_DURATION_MINUTES = 30; // Thay đổi thành 30 phút

    public AccountLockingService(IMemoryCache cache, ILogger<AccountLockingService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

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

    public async Task<int> GetFailedAttemptsAsync(string email)
    {
        string attemptsKey = $"attempts_{email}";
        _cache.TryGetValue(attemptsKey, out int attempts);
        return attempts;
    }

    public async Task<int> GetRemainingLockTimeAsync(string email)
    {
        if (!await IsAccountLockedAsync(email))
            return 0;

        _cache.TryGetValue($"lock_expiry_{email}", out DateTime expiryTime);
        int remainingMinutes = (int)Math.Ceiling((expiryTime - DateTime.Now).TotalMinutes);
        return remainingMinutes > 0 ? remainingMinutes : 0;
    }

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

            return true; // Hợp lệ vì phương thức được khai báo là Task<bool>
        }

        return false;
    }


    public async Task ResetFailedAttemptsAsync(string email)
    {
        string attemptsKey = $"attempts_{email}";
        _cache.Remove(attemptsKey);
        _logger.LogInformation($"Đã đặt lại số lần đăng nhập thất bại cho tài khoản {email}");
    }

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
