using Microsoft.EntityFrameworkCore;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace STP.Repository.Services
{
    public class SeatTypeService
    {
        private readonly CinemaDbContext _context;

        public SeatTypeService(CinemaDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetAllSeatTypesAsync()
        {
            var pricings = await _context.TicketPricings
                .Where(tp => tp.Status == "Active")
                .OrderBy(tp => tp.Room_Type)
                .ThenBy(tp => tp.Seat_Type)
                .ToListAsync();

            return pricings
                .GroupBy(tp => tp.Room_Type)
                .Select(group => new
                {
                    room_type = group.Key,
                    seat_types = group.Select(tp => new
                    {
                        tp.Price_ID,
                        tp.Seat_Type,
                        tp.Base_Price,
                        tp.Status,
                        tp.Created_Date,
                        tp.Last_Updated
                    }).ToList()
                })
                .ToList();
        }

        public async Task<object> GetSeatTypeAsync(int id)
        {
            var pricing = await _context.TicketPricings.FindAsync(id);
            if (pricing == null)
                throw new KeyNotFoundException($"Không tìm thấy loại ghế có ID {id}");

            var seatCount = await _context.SeatLayouts
                .CountAsync(sl => sl.Seat_Type == pricing.Seat_Type);

            var usedInRooms = await _context.SeatLayouts
                .Where(sl => sl.Seat_Type == pricing.Seat_Type)
                .GroupBy(sl => sl.CinemaRoom.Room_Name)
                .Select(g => new
                {
                    room_name = g.Key,
                    seat_count = g.Count()
                })
                .ToListAsync();

            return new
            {
                pricing.Price_ID,
                pricing.Room_Type,
                pricing.Seat_Type,
                pricing.Base_Price,
                pricing.Status,
                pricing.Created_Date,
                pricing.Last_Updated,
                total_seats = seatCount,
                used_in_rooms = usedInRooms
            };
        }

        public async Task<SeatTypeResponseDto> CreateSeatTypeAsync(SeatTypeCreateDto model)
        {
            if (await _context.TicketPricings.AnyAsync(tp =>
                tp.Room_Type == model.Room_Type && tp.Seat_Type == model.Seat_Type))
            {
                throw new ArgumentException($"Loại ghế '{model.Seat_Type}' cho loại phòng '{model.Room_Type}' đã tồn tại");
            }

            var pricing = new TicketPricing
            {
                Room_Type = model.Room_Type,
                Seat_Type = model.Seat_Type,
                Base_Price = model.Base_Price,
                Status = "Active",
                Created_Date = DateTime.Now
            };

            _context.TicketPricings.Add(pricing);
            await _context.SaveChangesAsync();

            return new SeatTypeResponseDto
            {
                Price_ID = pricing.Price_ID,
                Room_Type = pricing.Room_Type,
                Seat_Type = pricing.Seat_Type,
                Base_Price = pricing.Base_Price,
                Status = pricing.Status,
                Created_Date = pricing.Created_Date
            };
        }

        public async Task<object> UpdateSeatTypeAsync(int id, SeatTypeUpdateDto model)
        {
            var pricing = await _context.TicketPricings.FindAsync(id);
            if (pricing == null)
                throw new KeyNotFoundException($"Không tìm thấy loại ghế có ID {id}");

            if ((model.Room_Type != pricing.Room_Type || model.Seat_Type != pricing.Seat_Type) &&
                await _context.TicketPricings.AnyAsync(tp =>
                    tp.Price_ID != id &&
                    tp.Room_Type == model.Room_Type &&
                    tp.Seat_Type == model.Seat_Type))
            {
                throw new ArgumentException($"Loại ghế '{model.Seat_Type}' cho loại phòng '{model.Room_Type}' đã tồn tại");
            }

            bool isInUse = false;
            if (model.Seat_Type != pricing.Seat_Type)
            {
                isInUse = await _context.SeatLayouts.AnyAsync(sl => sl.Seat_Type == pricing.Seat_Type);
            }

            pricing.Base_Price = model.Base_Price;
            pricing.Status = model.Status;
            pricing.Last_Updated = DateTime.Now;

            if (!isInUse)
            {
                pricing.Room_Type = model.Room_Type;
                pricing.Seat_Type = model.Seat_Type;
            }

            await _context.SaveChangesAsync();

            var response = new
            {
                pricing.Price_ID,
                pricing.Room_Type,
                pricing.Seat_Type,
                pricing.Base_Price,
                pricing.Status,
                pricing.Last_Updated,
                limited_update = isInUse
            };

            if (isInUse)
            {
                return new
                {
                    data = response,
                    message = "Chỉ cập nhật giá vé, không thể thay đổi loại ghế/phòng vì đang được sử dụng"
                };
            }

            return response;
        }

        public async Task<object> DeleteSeatTypeAsync(int id)
        {
            var pricing = await _context.TicketPricings.FindAsync(id);
            if (pricing == null)
                throw new KeyNotFoundException($"Không tìm thấy loại ghế có ID {id}");

            bool isInUse = await _context.SeatLayouts.AnyAsync(sl => sl.Seat_Type == pricing.Seat_Type);

            // Chuyển đổi sang xóa mềm cho tất cả các trường hợp
            pricing.Status = isInUse ? "Inactive" : "Deleted";
            pricing.Last_Updated = DateTime.Now;
            await _context.SaveChangesAsync();

            return new
            {
                status = isInUse ? "deactivated" : "deleted",
                message = isInUse
                    ? "Loại ghế đang được sử dụng, đã đánh dấu là không hoạt động"
                    : "Loại ghế đã được đánh dấu là đã xóa"
            };
        }

        public async Task<object> BulkUpdatePricesAsync(BulkPriceUpdateDto model)
        {
            var priceIds = model.PriceUpdates.Select(p => p.Price_ID).ToList();
            var pricings = await _context.TicketPricings
                .Where(tp => priceIds.Contains(tp.Price_ID))
                .ToListAsync();

            if (pricings.Count != priceIds.Count)
                throw new ArgumentException("Một số ID không tồn tại");

            foreach (var pricing in pricings)
            {
                var update = model.PriceUpdates.First(p => p.Price_ID == pricing.Price_ID);
                pricing.Base_Price = update.Base_Price;
                pricing.Last_Updated = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return new
            {
                updated_count = pricings.Count,
                message = "Cập nhật giá vé thành công"
            };
        }

        public async Task<object> GetAvailableSeatTypesAsync()
        {
            var seatTypes = await _context.TicketPricings
                .Where(tp => tp.Status == "Active")
                .GroupBy(tp => tp.Seat_Type)
                .Select(g => g.First().Seat_Type)
                .ToListAsync();

            var usageCount = await _context.SeatLayouts
                .GroupBy(sl => sl.Seat_Type)
                .Select(g => new
                {
                    seat_type = g.Key,
                    count = g.Count()
                })
                .ToListAsync();

            var avgPrices = await _context.TicketPricings
                .Where(tp => tp.Status == "Active")
                .GroupBy(tp => tp.Seat_Type)
                .Select(g => new
                {
                    seat_type = g.Key,
                    avg_price = g.Average(tp => tp.Base_Price)
                })
                .ToListAsync();

            return seatTypes.Select(st =>
            {
                var usage = usageCount.FirstOrDefault(u => u.seat_type == st);
                var avgPrice = avgPrices.FirstOrDefault(p => p.seat_type == st);

                return new
                {
                    seat_type = st,
                    usage_count = usage?.count ?? 0,
                    average_price = avgPrice?.avg_price ?? 0
                };
            }).ToList();
        }
    }
}


