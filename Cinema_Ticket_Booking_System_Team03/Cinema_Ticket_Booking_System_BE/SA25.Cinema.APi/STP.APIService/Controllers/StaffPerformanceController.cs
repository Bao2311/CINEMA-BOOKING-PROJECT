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
        /// Lấy báo cáo hiệu suất của tất cả nhân viên
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetStaffPerformanceReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
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

                var report = await _staffPerformanceService.GetStaffPerformanceReportAsync(startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo báo cáo hiệu suất nhân viên");
                return StatusCode(500, "Đã xảy ra lỗi khi tạo báo cáo hiệu suất nhân viên.");
            }
        }

        /// <summary>
        /// Lấy chi tiết hiệu suất của một nhân viên cụ thể
        /// </summary>
        [HttpGet("{staffId}")]
        public async Task<IActionResult> GetStaffPerformanceDetails(int staffId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                // Kiểm tra tham số đầu vào
                if (staffId <= 0)
                {
                    return BadRequest("Mã nhân viên không hợp lệ");
                }

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

                var details = await _staffPerformanceService.GetStaffPerformanceDetailsAsync(staffId, startDate, endDate);
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
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate,
            [FromQuery] int? staffId = null,
            [FromQuery] string format = "excel")
        {
            try
            {
                // Kiểm tra tham số
                if (startDate == default || endDate == default || startDate > endDate)
                {
                    return BadRequest("Khoảng thời gian không hợp lệ");
                }

                if (staffId.HasValue && staffId.Value <= 0)
                {
                    return BadRequest("Mã nhân viên không hợp lệ");
                }

                if (!new[] { "excel", "pdf" }.Contains(format.ToLower()))
                {
                    return BadRequest("Định dạng phải là 'excel' hoặc 'pdf'");
                }

                // Lấy dữ liệu báo cáo
                var report = await _staffPerformanceService.GetStaffPerformanceReportAsync(startDate, endDate, staffId);

                // Tạo file theo định dạng được yêu cầu
                string staffInfo = staffId.HasValue ? $"_NhanVien{staffId}" : "_TatCaNhanVien";
                string fileName = $"BaoCaoHieuSuatNhanVien{staffInfo}_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.{(format.ToLower() == "excel" ? "xlsx" : "pdf")}";

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