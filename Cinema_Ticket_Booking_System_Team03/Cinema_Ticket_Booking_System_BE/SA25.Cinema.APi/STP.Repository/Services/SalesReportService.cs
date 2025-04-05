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
    public class SalesReportService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<SalesReportService> _logger;

        public SalesReportService(CinemaDbContext context, ILogger<SalesReportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Tạo báo cáo doanh thu theo khoảng thời gian
        /// </summary>
        public async Task<SalesReportDTO> GetSalesReportAsync(DateTime startDate, DateTime endDate, string period = "daily")
        {
            try
            {
                if (startDate > endDate)
                {
                    throw new ArgumentException("Ngày bắt đầu phải trước ngày kết thúc");
                }

                // Validate period
                if (!new[] { "daily", "weekly", "monthly" }.Contains(period.ToLower()))
                {
                    throw new ArgumentException("Loại báo cáo phải là 'daily', 'weekly', hoặc 'monthly'");
                }

                var query = _context.TicketBookings
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                    .Include(b => b.Tickets) // Thêm để đếm số lượng vé
                    .Include(b => b.Payments) // Thêm để lấy phương thức thanh toán
                    .Where(b => b.Booking_Date >= startDate && b.Booking_Date <= endDate && b.Status == "Confirmed");

                // Get bookings data
                var bookings = await query.ToListAsync();

                // Group data by the specified period
                var groupedSales = GroupSalesByPeriod(bookings, period, startDate, endDate);

                // Sửa cách tính tổng số vé từ Tickets
                var totalTickets = bookings.Sum(b => b.Tickets != null ? b.Tickets.Count : 0);
                var totalAmount = bookings.Sum(b => b.Total_Amount);
                var totalBookings = bookings.Count;

                return new SalesReportDTO
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    Period = period,
                    TotalTickets = totalTickets,
                    TotalAmount = totalAmount,
                    TotalBookings = totalBookings,
                    PeriodSales = groupedSales
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi tạo báo cáo doanh thu từ {startDate} đến {endDate}");
                throw;
            }
        }

        private List<PeriodSalesDTO> GroupSalesByPeriod(List<TicketBooking> bookings, string period, DateTime startDate, DateTime endDate)
        {
            var result = new List<PeriodSalesDTO>();

            switch (period.ToLower())
            {
                case "daily":
                    var dailyGroups = bookings
                        .GroupBy(b => b.Booking_Date.Date)
                        .OrderBy(g => g.Key);

                    foreach (var group in dailyGroups)
                    {
                        result.Add(new PeriodSalesDTO
                        {
                            PeriodName = group.Key.ToString("dd/MM/yyyy"),
                            TotalBookings = group.Count(),
                            TotalTickets = group.Sum(b => b.Tickets != null ? b.Tickets.Count : 0), // Sửa
                            TotalAmount = group.Sum(b => b.Total_Amount),
                            PaymentMethods = GetPaymentMethodBreakdown(group.ToList())
                        });
                    }
                    break;

                case "weekly":
                    var weeklyGroups = bookings
                        .GroupBy(b => GetWeekOfYear(b.Booking_Date))
                        .OrderBy(g => g.Key);

                    foreach (var group in weeklyGroups)
                    {
                        var firstDay = GetFirstDayOfWeek(group.First().Booking_Date);
                        result.Add(new PeriodSalesDTO
                        {
                            PeriodName = $"Tuần {group.Key}: {firstDay:dd/MM} - {firstDay.AddDays(6):dd/MM/yyyy}",
                            TotalBookings = group.Count(),
                            TotalTickets = group.Sum(b => b.Tickets != null ? b.Tickets.Count : 0), // Sửa
                            TotalAmount = group.Sum(b => b.Total_Amount),
                            PaymentMethods = GetPaymentMethodBreakdown(group.ToList())
                        });
                    }
                    break;

                case "monthly":
                    var monthlyGroups = bookings
                        .GroupBy(b => new { b.Booking_Date.Year, b.Booking_Date.Month })
                        .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month);

                    foreach (var group in monthlyGroups)
                    {
                        result.Add(new PeriodSalesDTO
                        {
                            PeriodName = $"Tháng {group.Key.Month}/{group.Key.Year}",
                            TotalBookings = group.Count(),
                            TotalTickets = group.Sum(b => b.Tickets != null ? b.Tickets.Count : 0), // Sửa
                            TotalAmount = group.Sum(b => b.Total_Amount),
                            PaymentMethods = GetPaymentMethodBreakdown(group.ToList())
                        });
                    }
                    break;
            }

            return result;
        }

        private int GetWeekOfYear(DateTime date)
        {
            return System.Globalization.CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(
                date, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday);
        }

        private DateTime GetFirstDayOfWeek(DateTime date)
        {
            int diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-1 * diff).Date;
        }

        private Dictionary<string, decimal> GetPaymentMethodBreakdown(List<TicketBooking> bookings)
        {
            var result = new Dictionary<string, decimal>();

            foreach (var booking in bookings)
            {
                // Lấy phương thức thanh toán từ bảng Payments
                var payment = booking.Payments?.OrderByDescending(p => p.Transaction_Date).FirstOrDefault();
                string paymentMethod = payment?.Payment_Method ?? "Không xác định";

                if (result.ContainsKey(paymentMethod))
                {
                    result[paymentMethod] += booking.Total_Amount;
                }
                else
                {
                    result[paymentMethod] = booking.Total_Amount;
                }
            }

            return result;
        }

        /// <summary>
        /// Tạo báo cáo doanh thu với tất cả dữ liệu để FE tự filter theo ngày
        /// </summary>
        public async Task<SalesReportDTO> GetAllSalesReportAsync(string period = "daily")
        {
            try
            {
                // Validate period
                if (!new[] { "daily", "weekly", "monthly" }.Contains(period.ToLower()))
                {
                    throw new ArgumentException("Loại báo cáo phải là 'daily', 'weekly', hoặc 'monthly'");
                }

                var query = _context.TicketBookings
                    .Include(b => b.Showtime)
                    .ThenInclude(s => s.Movie)
                    .Include(b => b.Tickets)
                    .Include(b => b.Payments)
                    .Where(b => b.Status == "Confirmed");

                // Get all bookings data
                var bookings = await query.ToListAsync();

                // Use min and max dates from the data if available, otherwise use default values
                var startDate = bookings.Any() ? bookings.Min(b => b.Booking_Date) : DateTime.MinValue;
                var endDate = bookings.Any() ? bookings.Max(b => b.Booking_Date) : DateTime.MaxValue;

                // Group data by the specified period
                var groupedSales = GroupSalesByPeriod(bookings, period, startDate, endDate);

                // Calculate totals
                var totalTickets = bookings.Sum(b => b.Tickets != null ? b.Tickets.Count : 0);
                var totalAmount = bookings.Sum(b => b.Total_Amount);
                var totalBookings = bookings.Count;

                return new SalesReportDTO
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    Period = period,
                    TotalTickets = totalTickets,
                    TotalAmount = totalAmount,
                    TotalBookings = totalBookings,
                    PeriodSales = groupedSales
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo báo cáo doanh thu");
                throw;
            }
        }
    }
}