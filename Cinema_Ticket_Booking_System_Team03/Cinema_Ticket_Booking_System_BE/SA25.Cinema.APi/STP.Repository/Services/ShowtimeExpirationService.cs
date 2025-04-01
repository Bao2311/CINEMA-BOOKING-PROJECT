using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using STP.Service.Services;

namespace STP.Repository.Services
{
    public class ShowtimeExpirationService : BackgroundService
    {
        private readonly ILogger<ShowtimeExpirationService> _logger;
        private readonly IServiceProvider _serviceProvider;

        // Khoảng thời gian chạy (mặc định là 1 giờ một lần)
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

        public ShowtimeExpirationService(
            ILogger<ShowtimeExpirationService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ShowtimeExpirationService đã bắt đầu.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation($"Đang kiểm tra các suất chiếu đã hết hạn tại {DateTime.Now}");

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var showtimeService = scope.ServiceProvider.GetRequiredService<ShowtimeService>();

                        int hiddenCount = await showtimeService.AutoHideExpiredShowtimesAsync();

                        if (hiddenCount > 0)
                        {
                            _logger.LogInformation($"Đã ẩn {hiddenCount} suất chiếu đã hết hạn");
                        }
                    }

                    // Đợi đến khi check lần tiếp theo
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong ShowtimeExpirationService");

                    // Đợi một khoảng thời gian ngắn trước khi thử lại nếu có lỗi
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
            }
        }
    }
}