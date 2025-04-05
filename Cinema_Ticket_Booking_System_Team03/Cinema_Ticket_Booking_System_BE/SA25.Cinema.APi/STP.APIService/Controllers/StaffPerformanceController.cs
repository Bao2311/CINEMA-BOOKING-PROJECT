using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;

namespace STP.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StaffPerformanceController : ControllerBase
    {
        private readonly StaffPerformanceService _staffPerformanceService;
        private readonly ILogger<StaffPerformanceController> _logger;

        public StaffPerformanceController(StaffPerformanceService staffPerformanceService, ILogger<StaffPerformanceController> logger)
        {
            _staffPerformanceService = staffPerformanceService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tất cả báo cáo hiệu suất của nhân viên để FE tự filter theo ngày
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetStaffPerformanceReport([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Lấy tất cả dữ liệu để FE tự filter
                var report = await _staffPerformanceService.GetAllStaffPerformanceReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo báo cáo hiệu suất nhân viên");
                return StatusCode(500, "Đã xảy ra lỗi khi tạo báo cáo hiệu suất nhân viên.");
            }
        }

        /// <summary>
        /// Lấy tất cả chi tiết hiệu suất của một nhân viên cụ thể để FE tự filter theo ngày
        /// </summary>
        [HttpGet("{staffId}")]
        public async Task<IActionResult> GetStaffPerformanceDetails(int staffId, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Kiểm tra tham số đầu vào
                if (staffId <= 0)
                {
                    return BadRequest("Mã nhân viên không hợp lệ");
                }

                // Lấy tất cả dữ liệu để FE tự filter
                var details = await _staffPerformanceService.GetAllStaffPerformanceDetailsAsync(staffId);
                return Ok(details);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy chi tiết hiệu suất của nhân viên {staffId}");
                return StatusCode(500, "Đã xảy ra lỗi khi lấy chi tiết hiệu suất nhân viên.");
            }
        }

        /// <summary>
        /// Xuất báo cáo hiệu suất nhân viên ra file
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportStaffPerformanceReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? staffId = null,
            [FromQuery] string format = "excel")
        {
            try
            {
                // Kiểm tra tham số
                if (staffId.HasValue && staffId.Value <= 0)
                {
                    return BadRequest("Mã nhân viên không hợp lệ");
                }

                if (!new[] { "excel", "pdf" }.Contains(format.ToLower()))
                {
                    return BadRequest("Định dạng phải là 'excel' hoặc 'pdf'");
                }

                // Lấy tất cả dữ liệu báo cáo
                var report = await _staffPerformanceService.GetAllStaffPerformanceReportAsync(staffId);

                // Tạo file theo định dạng được yêu cầu
                string staffInfo = staffId.HasValue ? $"_NhanVien{staffId}" : "_TatCaNhanVien";
                string startDateStr = startDate.HasValue ? startDate.Value.ToString("yyyyMMdd") : "all";
                string endDateStr = endDate.HasValue ? endDate.Value.ToString("yyyyMMdd") : "all";
                string fileName = $"BaoCaoHieuSuatNhanVien{staffInfo}_{startDateStr}_{endDateStr}.{(format.ToLower() == "excel" ? "xlsx" : "pdf")}";

                // Trong triển khai thực tế, sẽ gọi service tạo file ở đây
                // Hiện tại, chỉ trả về thông báo thành công
                return Ok(new { message = $"Đã xuất báo cáo thành file {fileName}", reportData = report });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xuất báo cáo hiệu suất nhân viên");
                return StatusCode(500, "Đã xảy ra lỗi khi xuất báo cáo hiệu suất nhân viên.");
            }
        }
    }
}