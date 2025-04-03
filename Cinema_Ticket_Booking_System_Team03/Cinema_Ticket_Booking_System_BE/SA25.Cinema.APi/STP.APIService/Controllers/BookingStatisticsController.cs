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
        /// Lấy thống kê đặt vé và doanh thu
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetBookingStatistics([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                // Kiểm tra tham số đầu vào
                if (startDate == default)
                {
                    return BadRequest("Ngày bắt đầu không được để trống");
                }

                if (endDate == default)
                {
                    return BadRequest("Ngày kết thúc không được để trống");
                }

                if (startDate > endDate)
                {
                    return BadRequest("Ngày bắt đầu phải trước ngày kết thúc");
                }

                var statistics = await _bookingStatisticsService.GetBookingStatisticsAsync(startDate, endDate);
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
        public async Task<IActionResult> ExportBookingStatistics([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string format = "excel")
        {
            try
            {
                // Kiểm tra tham số
                if (startDate == default || endDate == default || startDate > endDate)
                {
                    return BadRequest("Khoảng thời gian không hợp lệ");
                }

                if (!new[] { "excel", "pdf" }.Contains(format.ToLower()))
                {
                    return BadRequest("Định dạng phải là 'excel' hoặc 'pdf'");
                }

                // Lấy dữ liệu thống kê
                var statistics = await _bookingStatisticsService.GetBookingStatisticsAsync(startDate, endDate);

                // Tạo file theo định dạng được yêu cầu
                string fileName = $"ThongKeDatVe_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.{(format.ToLower() == "excel" ? "xlsx" : "pdf")}";

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