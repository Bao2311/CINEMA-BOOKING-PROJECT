using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;

namespace STP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesReportController : ControllerBase
    {
        private readonly SalesReportService _salesReportService;
        private readonly ILogger<SalesReportController> _logger;

        public SalesReportController(SalesReportService salesReportService, ILogger<SalesReportController> logger)
        {
            _salesReportService = salesReportService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy báo cáo doanh thu theo khoảng thời gian
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSalesReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string period = "daily")
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

                if (!new[] { "daily", "weekly", "monthly" }.Contains(period.ToLower()))
                {
                    return BadRequest("Loại báo cáo phải là 'daily', 'weekly', hoặc 'monthly'");
                }

                var report = await _salesReportService.GetSalesReportAsync(startDate, endDate, period);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo báo cáo doanh thu");
                return StatusCode(500, "Đã xảy ra lỗi khi tạo báo cáo doanh thu.");
            }
        }

        /// <summary>
        /// Xuất báo cáo doanh thu ra file
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportSalesReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string period = "daily", [FromQuery] string format = "excel")
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

                // Lấy dữ liệu báo cáo
                var report = await _salesReportService.GetSalesReportAsync(startDate, endDate, period);

                // Tạo file theo định dạng được yêu cầu
                string fileName = $"BaoCaoDoanhThu_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.{(format.ToLower() == "excel" ? "xlsx" : "pdf")}";

                // Trong triển khai thực tế, sẽ gọi service tạo file ở đây
                // Hiện tại, chỉ trả về thông báo thành công
                return Ok(new { message = $"Đã xuất báo cáo thành file {fileName}", reportData = report });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xuất báo cáo doanh thu");
                return StatusCode(500, "Đã xảy ra lỗi khi xuất báo cáo doanh thu.");
            }
        }
    }
}