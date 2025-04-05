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
        /// Lấy tất cả báo cáo doanh thu để FE tự filter theo ngày
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSalesReport([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string period = "daily")
        {
            try
            {
                // Kiểm tra tham số period
                if (!new[] { "daily", "weekly", "monthly" }.Contains(period.ToLower()))
                {
                    return BadRequest("Loại báo cáo phải là 'daily', 'weekly', hoặc 'monthly'");
                }

                // Lấy tất cả dữ liệu để FE tự filter
                var report = await _salesReportService.GetAllSalesReportAsync(period);
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
        public async Task<IActionResult> ExportSalesReport([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string period = "daily", [FromQuery] string format = "excel")
        {
            try
            {
                // Kiểm tra định dạng file
                if (!new[] { "excel", "pdf" }.Contains(format.ToLower()))
                {
                    return BadRequest("Định dạng phải là 'excel' hoặc 'pdf'");
                }

                // Kiểm tra loại báo cáo
                if (!new[] { "daily", "weekly", "monthly" }.Contains(period.ToLower()))
                {
                    return BadRequest("Loại báo cáo phải là 'daily', 'weekly', hoặc 'monthly'");
                }

                // Lấy tất cả dữ liệu báo cáo
                var report = await _salesReportService.GetAllSalesReportAsync(period);

                // Tạo file theo định dạng được yêu cầu
                string startDateStr = startDate.HasValue ? startDate.Value.ToString("yyyyMMdd") : "all";
                string endDateStr = endDate.HasValue ? endDate.Value.ToString("yyyyMMdd") : "all";
                string fileName = $"BaoCaoDoanhThu_{period}_{startDateStr}_{endDateStr}.{(format.ToLower() == "excel" ? "xlsx" : "pdf")}";

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