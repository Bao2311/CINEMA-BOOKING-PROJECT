using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class StaffPerformanceService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<StaffPerformanceService> _logger;

        public StaffPerformanceService(CinemaDbContext context, ILogger<StaffPerformanceService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy báo cáo hiệu suất của nhân viên
        /// </summary>
        public async Task<List<StaffPerformanceDTO>> GetStaffPerformanceReportAsync(DateTime startDate, DateTime endDate, int? staffId = null)
        {
            try
            {
                if (startDate > endDate)
                {
                    throw new ArgumentException("Ngày bắt đầu phải trước ngày kết thúc");
                }

                // Lấy danh sách nhân viên (người dùng có role là "Staff" hoặc "Admin")
                var staffQuery = _context.Users
                    .Where(u => u.Role == "Staff" || u.Role == "Admin");

                if (staffId.HasValue)
                {
                    staffQuery = staffQuery.Where(u => u.User_ID == staffId.Value);
                }

                var staffList = await staffQuery.ToListAsync();

                if (!staffList.Any())
                {
                    return new List<StaffPerformanceDTO>();
                }

                // Lấy danh sách booking đã xác nhận trong khoảng thời gian
                var confirmedBookings = await _context.TicketBookings
                    .Include(b => b.User) // Người dùng (khách hàng)
                    .Where(b => b.Booking_Date >= startDate &&
                                b.Booking_Date <= endDate &&
                                b.Status == "Confirmed")
                    .ToListAsync();

                // Nhóm bookings theo người tạo (Created_By)
                var bookingsByCreator = confirmedBookings
                    .GroupBy(b => b.Created_By)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // Tạo báo cáo hiệu suất cho từng nhân viên
                var result = new List<StaffPerformanceDTO>();

                foreach (var staff in staffList)
                {
                    var staffPerformance = new StaffPerformanceDTO
                    {
                        StaffId = staff.User_ID,
                        StaffName = staff.Full_Name ?? "Không xác định",
                        Department = staff.Department ?? "Không xác định",
                        BookingsData = new List<BookingPerformanceDTO>()
                    };

                    // Lấy các booking mà nhân viên này đã tạo
                    if (bookingsByCreator.TryGetValue(staff.User_ID, out var staffBookings))
                    {
                        staffPerformance.TotalBookingsHandled = staffBookings.Count;
                        staffPerformance.TotalRevenue = staffBookings.Sum(b => b.Total_Amount);

                        // Thêm thông tin booking
                        foreach (var booking in staffBookings)
                        {
                            int ticketCount = booking.Tickets?.Count ?? 0;

                            staffPerformance.BookingsData.Add(new BookingPerformanceDTO
                            {
                                BookingId = booking.Booking_ID,
                                BookingDate = booking.Booking_Date,
                                TicketCount = ticketCount,
                                TotalAmount = booking.Total_Amount,
                                Status = booking.Status,
                                CustomerName = booking.User?.Full_Name ?? "Khách vãng lai" // Tên khách hàng
                            });
                        }

                        // Tính toán số lượng booking cho tại quầy/online
                        staffPerformance.CounterBookings = staffBookings.Count(b => b.User_ID == null || b.User_ID != b.Created_By);
                        staffPerformance.OnlineBookings = staffBookings.Count - staffPerformance.CounterBookings;
                    }

                    // Tính các chỉ số hiệu suất
                    if (staffPerformance.TotalBookingsHandled > 0)
                    {
                        staffPerformance.AverageRevenuePerBooking = staffPerformance.TotalRevenue / staffPerformance.TotalBookingsHandled;
                    }

                    result.Add(staffPerformance);
                }

                return result.OrderByDescending(s => s.TotalRevenue).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi tạo báo cáo hiệu suất nhân viên từ {startDate} đến {endDate}");
                throw;
            }
        }

        /// <summary>
        /// Lấy chi tiết hiệu suất của một nhân viên cụ thể
        /// </summary>
        public async Task<StaffPerformanceDTO> GetStaffPerformanceDetailsAsync(int staffId, DateTime startDate, DateTime endDate)
        {
            try
            {
                // Kiểm tra xem người dùng có tồn tại và có phải là nhân viên không
                var staffUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.User_ID == staffId && (u.Role == "Staff" || u.Role == "Admin"));

                if (staffUser == null)
                {
                    throw new KeyNotFoundException($"Không tìm thấy nhân viên với ID {staffId}");
                }

                var reports = await GetStaffPerformanceReportAsync(startDate, endDate, staffId);
                return reports.FirstOrDefault() ?? new StaffPerformanceDTO
                {
                    StaffId = staffId,
                    StaffName = staffUser.Full_Name ?? "Không xác định",
                    Department = staffUser.Department ?? "Không xác định",
                    TotalBookingsHandled = 0,
                    TotalRevenue = 0,
                    BookingsData = new List<BookingPerformanceDTO>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy chi tiết hiệu suất của nhân viên {staffId}");
                throw;
            }
        }
    }
}