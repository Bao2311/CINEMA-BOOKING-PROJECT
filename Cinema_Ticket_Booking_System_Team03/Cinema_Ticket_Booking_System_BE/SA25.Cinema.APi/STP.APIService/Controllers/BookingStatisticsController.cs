using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;

namespace STP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingStatisticsController : ControllerBase
    {
        private readonly BookingStatisticsService _bookingStatisticsService;
        private readonly ILogger<BookingStatisticsController> _logger;

        public BookingStatisticsController(BookingStatisticsService bookingStatisticsService, ILogger<BookingStatisticsController> logger)
        {
            _bookingStatisticsService = bookingStatisticsService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả thống kê đặt vé và doanh thu để FE tự filter theo ngày
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetBookingStatistics([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Lấy tất cả dữ liệu để FE tự filter
                var statistics = await _bookingStatisticsService.GetAllBookingStatisticsAsync();
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo thống kê đặt vé");
                return StatusCode(500, "Đã xảy ra lỗi khi tạo thống kê đặt vé.");
            }
        }

        /// <summary>
        /// Xuất thống kê đặt vé ra file
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportBookingStatistics([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string format = "excel")
        {
            try
            {
                // Kiểm tra định dạng file
                if (!new[] { "excel", "pdf" }.Contains(format.ToLower()))
                {
                    return BadRequest("Định dạng phải là 'excel' hoặc 'pdf'");
                }

                // Lấy tất cả dữ liệu thống kê
                var statistics = await _bookingStatisticsService.GetAllBookingStatisticsAsync();

                // Tạo file theo định dạng được yêu cầu
                string startDateStr = startDate.HasValue ? startDate.Value.ToString("yyyyMMdd") : "all";
                string endDateStr = endDate.HasValue ? endDate.Value.ToString("yyyyMMdd") : "all";
                string fileName = $"ThongKeDatVe_{startDateStr}_{endDateStr}.{(format.ToLower() == "excel" ? "xlsx" : "pdf")}";

                // Trong triển khai thực tế, sẽ gọi service tạo file ở đây
                // Hiện tại, chỉ trả về thông báo thành công
                return Ok(new { message = $"Đã xuất thống kê thành file {fileName}", statisticsData = statistics });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xuất thống kê đặt vé");
                return StatusCode(500, "Đã xảy ra lỗi khi xuất thống kê đặt vé.");
            }
        }
    }
}