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
    public class SeatLayoutService
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger<SeatLayoutService> _logger;

        public SeatLayoutService(CinemaDbContext context, ILogger<SeatLayoutService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<object> GetSeatLayoutAsync(int roomId)
        {
            var cinemaRoom = await _context.CinemaRooms.FindAsync(roomId);
            if (cinemaRoom == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu có ID {roomId}");

            var seatLayouts = await _context.SeatLayouts
                .Where(sl => sl.Cinema_Room_ID == roomId)
                .OrderBy(sl => sl.Row_Label)
                .ThenBy(sl => sl.Column_Number)
                .ToListAsync();

            var rowGroups = seatLayouts
                .GroupBy(sl => sl.Row_Label)
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    Row = g.Key,
                    Seats = g.OrderBy(sl => sl.Column_Number)
                        .Select(sl => new
                        {
                            sl.Layout_ID,
                            sl.Row_Label,
                            sl.Column_Number,
                            sl.Seat_Type,
                            sl.Is_Active
                        }).ToList()
                }).ToList();

            var usedLayoutIds = await _context.Seats
                .Where(s => s.SeatLayout.Cinema_Room_ID == roomId && s.Booking_ID != null)
                .Select(s => s.Layout_ID)
                .Distinct()
                .ToListAsync();

            var seatCountByType = seatLayouts
                .GroupBy(sl => sl.Seat_Type)
                .Select(g => new
                {
                    SeatType = g.Key,
                    Count = g.Count()
                }).ToList();

            int maxRow = rowGroups.Count();
            int maxColumn = rowGroups.Any() ? rowGroups.Max(r => r.Seats.Count) : 0;

            return new
            {
                cinema_room = new
                {
                    cinemaRoom.Cinema_Room_ID,
                    cinemaRoom.Room_Name,
                    cinemaRoom.Room_Type
                },
                rows = rowGroups,
                dimensions = new { rows = maxRow, columns = maxColumn },
                stats = new
                {
                    total_seats = seatLayouts.Count,
                    seat_types = seatCountByType
                },
                can_modify = !usedLayoutIds.Any()
            };
        }

        public async Task<object> ConfigureSeatLayoutAsync(int roomId, SeatMapConfigurationDto model)
        {
            var cinemaRoom = await _context.CinemaRooms.FindAsync(roomId);
            if (cinemaRoom == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu có ID {roomId}");

            var hasBookedSeats = await _context.Seats
                .AnyAsync(s => s.SeatLayout.Cinema_Room_ID == roomId && s.Booking_ID != null);

            if (hasBookedSeats)
                throw new InvalidOperationException("Không thể thay đổi sơ đồ ghế vì có ghế đang được sử dụng trong đặt vé");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Lấy danh sách các hàng ghế từ input model
                var newRowLabels = model.Rows.Select(r => r.RowLabel).ToList();

                // Chỉ xóa các hàng ghế đang được cấu hình lại (nếu đã tồn tại)
                var layoutsToRemove = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == roomId && newRowLabels.Contains(sl.Row_Label))
                    .ToListAsync();

                // Xóa tất cả Seats liên kết với các SeatLayout sẽ bị xóa
                var layoutIdsToRemove = layoutsToRemove.Select(l => l.Layout_ID).ToList();
                var seatsToRemove = await _context.Seats
                    .Where(s => layoutIdsToRemove.Contains(s.Layout_ID))
                    .ToListAsync();

                if (seatsToRemove.Any())
                    _context.Seats.RemoveRange(seatsToRemove);

                if (layoutsToRemove.Any())
                    _context.SeatLayouts.RemoveRange(layoutsToRemove);

                await _context.SaveChangesAsync();

                // Thêm các layout mới từ model
                List<SeatLayout> newLayouts = new List<SeatLayout>();
                foreach (var rowConfig in model.Rows)
                {
                    for (int col = 1; col <= model.ColumnsPerRow; col++)
                    {
                        if (!rowConfig.EmptyColumns.Contains(col))
                        {
                            var seatLayout = new SeatLayout
                            {
                                Cinema_Room_ID = roomId,
                                Row_Label = rowConfig.RowLabel,
                                Column_Number = col,
                                Seat_Type = rowConfig.SeatType,
                                Is_Active = true
                            };
                            newLayouts.Add(seatLayout);
                        }
                    }
                }

                await _context.SeatLayouts.AddRangeAsync(newLayouts);
                await _context.SaveChangesAsync(); // Lưu để có Layout_ID

                // Tạo bản ghi Seats cho mỗi SeatLayout mới
                List<Seat> newSeats = new List<Seat>();
                foreach (var layout in newLayouts)
                {
                    newSeats.Add(new Seat
                    {
                        Layout_ID = layout.Layout_ID,
                        Seat_Status = "Available",
                        Last_Updated = DateTime.Now,
                        Booking_ID = null
                    });
                }

                await _context.Seats.AddRangeAsync(newSeats);

                // Cập nhật tổng số ghế trong phòng
                var totalSeats = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == roomId)
                    .CountAsync();

                cinemaRoom.Seat_Quantity = totalSeats;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new
                {
                    id = Guid.NewGuid().ToString(), // Tạo một ID duy nhất cho response
                    cinema_room_id = roomId,
                    total_rows = await _context.SeatLayouts
                        .Where(sl => sl.Cinema_Room_ID == roomId)
                        .Select(sl => sl.Row_Label)
                        .Distinct()
                        .CountAsync(),
                    total_seats = totalSeats,
                    seat_types = await _context.SeatLayouts
                        .Where(sl => sl.Cinema_Room_ID == roomId)
                        .GroupBy(l => l.Seat_Type)
                        .Select(g => new { type = g.Key, count = g.Count() })
                        .ToListAsync()
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi cấu hình sơ đồ ghế cho phòng {RoomId}: {Message}", roomId, ex.Message);
                throw;
            }
        }

        public async Task<object> BulkConfigureSeatLayoutAsync(int roomId, BulkRowConfigurationDto model)
        {
            var rowLabels = new List<string>();

            // Xử lý định dạng phạm vi (range) như "A-Z"
            if (model.RowsInput.Contains("-"))
            {
                var range = model.RowsInput.Split('-');
                if (range.Length == 2 && range[0].Length == 1 && range[1].Length == 1)
                {
                    char start = range[0][0];
                    char end = range[1][0];

                    for (char c = start; c <= end; c++)
                    {
                        rowLabels.Add(c.ToString());
                    }
                }
            }
            else // Xử lý danh sách được phân tách bằng dấu phẩy
            {
                rowLabels = model.RowsInput.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                 .Select(r => r.Trim()).ToList();
            }

            // Tạo SeatMapConfigurationDto từ các hàng được chỉ định
            var configDto = new SeatMapConfigurationDto
            {
                ColumnsPerRow = model.ColumnsPerRow,
                Rows = rowLabels.Select(label => new RowConfigurationDto  // Thay vì RowConfigDto
                {
                    RowLabel = label,
                    SeatType = model.SeatType,
                    EmptyColumns = model.EmptyColumns ?? new List<int>()
                }).ToList()
            };

            // Gọi phương thức cấu hình hiện có
            return await ConfigureSeatLayoutAsync(roomId, configDto);
        }
        public async Task<object> UpdateSeatTypeAsync(int layoutId, UpdateSeatTypeDto model)
        {
            var seatLayout = await _context.SeatLayouts.FindAsync(layoutId);
            if (seatLayout == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy ghế có ID {layoutId}");
            }

            var isUsed = await _context.Seats
                .AnyAsync(s => s.Layout_ID == layoutId && s.Booking_ID != null);

            if (isUsed)
            {
                throw new InvalidOperationException("Không thể thay đổi loại ghế vì ghế đã được sử dụng trong đặt vé");
            }

            seatLayout.Seat_Type = model.SeatType;
            if (model.IsActive.HasValue)
            {
                seatLayout.Is_Active = model.IsActive.Value;

                // Thêm phần này: Cập nhật trạng thái ghế nếu Is_Active thay đổi
                if (!model.IsActive.Value)  // Nếu Is_Active được đặt thành false
                {
                    var seats = await _context.Seats
                        .Where(s => s.Layout_ID == layoutId)
                        .ToListAsync();

                    foreach (var seat in seats)
                    {
                        seat.Seat_Status = "Unavailable";
                        seat.Last_Updated = DateTime.Now; // Cập nhật thời gian (tùy chọn)
                    }
                }
            }

            await _context.SaveChangesAsync();

            return new
            {
                layout_id = seatLayout.Layout_ID,
                row_label = seatLayout.Row_Label,
                column_number = seatLayout.Column_Number,
                seat_type = seatLayout.Seat_Type,
                is_active = seatLayout.Is_Active
            };
        }

        public async Task<BulkUpdateResultDto> BulkUpdateSeatTypesAsync(BulkUpdateSeatsDto model)
        {
            if (model.LayoutIds == null || !model.LayoutIds.Any())
                throw new ArgumentException("Danh sách ghế cần cập nhật không được trống");

            var usedLayoutIds = await _context.Seats
                .Where(s => model.LayoutIds.Contains(s.Layout_ID) && s.Booking_ID != null)
                .Select(s => s.Layout_ID)
                .ToListAsync();

            if (usedLayoutIds.Any())
                return new BulkUpdateResultDto
                {
                    Message = "Một số ghế đã được sử dụng trong đặt vé và không thể thay đổi",
                    UsedSeats = usedLayoutIds
                };

            var seatLayouts = await _context.SeatLayouts
                .Where(sl => model.LayoutIds.Contains(sl.Layout_ID))
                .ToListAsync();

            if (!seatLayouts.Any())
                throw new KeyNotFoundException("Không tìm thấy ghế nào cần cập nhật");

            foreach (var layout in seatLayouts)
            {
                layout.Seat_Type = model.SeatType;
                if (model.IsActive.HasValue)
                    layout.Is_Active = model.IsActive.Value;
            }

            await _context.SaveChangesAsync();

            return new BulkUpdateResultDto
            {
                UpdatedCount = seatLayouts.Count,
                SeatType = model.SeatType,
                IsActive = model.IsActive
            };
        }

        public async Task<object> GetSeatTypesAsync()
        {
            var seatTypes = await _context.TicketPricings
                .Where(tp => tp.Status == "Active")
                .GroupBy(tp => new { tp.Room_Type, tp.Seat_Type })
                .Select(g => new
                {
                    room_type = g.Key.Room_Type,
                    seat_type = g.Key.Seat_Type,
                    base_price = g.First().Base_Price
                })
                .OrderBy(st => st.room_type)
                .ThenBy(st => st.seat_type)
                .ToListAsync();

            return new
            {
                seat_types = seatTypes
            };
        }

        /// <summary>
        /// Thực hiện xóa mềm một hoặc nhiều ghế trong sơ đồ
        /// </summary>
        /// <param name="model">Danh sách các Layout ID cần xóa</param>
        /// <returns>Kết quả xóa mềm</returns>
        public async Task<object> SoftDeleteSeatLayoutsAsync(BulkDeleteSeatsDto model)
        {
            if (model.LayoutIds == null || !model.LayoutIds.Any())
                throw new ArgumentException("Danh sách ghế cần xóa không được trống");

            // Kiểm tra xem có ghế nào đang được sử dụng trong đặt vé không
            var usedLayoutIds = await _context.Seats
                .Where(s => model.LayoutIds.Contains(s.Layout_ID) && s.Booking_ID != null)
                .Select(s => s.Layout_ID)
                .ToListAsync();

            if (usedLayoutIds.Any())
                return new
                {
                    success = false,
                    message = "Một số ghế đã được sử dụng trong đặt vé và không thể xóa",
                    used_seats = usedLayoutIds
                };

            // Lấy các SeatLayout cần xóa mềm
            var seatLayouts = await _context.SeatLayouts
                .Where(sl => model.LayoutIds.Contains(sl.Layout_ID))
                .ToListAsync();

            if (!seatLayouts.Any())
                throw new KeyNotFoundException("Không tìm thấy ghế nào cần xóa");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Cập nhật is_active = false thay vì xóa cứng
                foreach (var layout in seatLayouts)
                {
                    layout.Is_Active = false;
                }

                // Cập nhật trạng thái seat tương ứng thành Unavailable
                var layoutIds = seatLayouts.Select(sl => sl.Layout_ID).ToList();
                var seats = await _context.Seats
                    .Where(s => layoutIds.Contains(s.Layout_ID))
                    .ToListAsync();

                foreach (var seat in seats)
                {
                    seat.Seat_Status = "Unavailable";
                    seat.Last_Updated = DateTime.Now;
                }

                // Cập nhật tổng số ghế trong phòng nếu xóa hết ghế một hàng
                if (seatLayouts.Any())
                {
                    var roomId = seatLayouts.First().Cinema_Room_ID;
                    var activeSeatsCount = await _context.SeatLayouts
                        .Where(sl => sl.Cinema_Room_ID == roomId && sl.Is_Active)
                        .CountAsync();

                    var cinemaRoom = await _context.CinemaRooms.FindAsync(roomId);
                    if (cinemaRoom != null)
                    {
                        cinemaRoom.Seat_Quantity = activeSeatsCount;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new
                {
                    success = true,
                    message = $"Đã xóa mềm {seatLayouts.Count} ghế thành công",
                    deleted_count = seatLayouts.Count,
                    deleted_seats = seatLayouts.Select(sl => new
                    {
                        layout_id = sl.Layout_ID,
                        row_label = sl.Row_Label,
                        column_number = sl.Column_Number
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi xóa mềm ghế: {Message}", ex.Message);
                throw;
            }
        }

        /// <summary>
        /// Thực hiện xóa cứng một hoặc nhiều ghế trong sơ đồ
        /// </summary>
        /// <param name="model">Danh sách các Layout ID cần xóa</param>
        /// <returns>Kết quả xóa cứng</returns>
        public async Task<object> HardDeleteSeatLayoutsAsync(BulkDeleteSeatsDto model)
        {
            if (model.LayoutIds == null || !model.LayoutIds.Any())
                throw new ArgumentException("Danh sách ghế cần xóa không được trống");

            // Kiểm tra xem có ghế nào đang được sử dụng trong đặt vé không
            var usedLayoutIds = await _context.Seats
                .Where(s => model.LayoutIds.Contains(s.Layout_ID) && s.Booking_ID != null)
                .Select(s => s.Layout_ID)
                .ToListAsync();

            if (usedLayoutIds.Any())
                return new
                {
                    success = false,
                    message = "Một số ghế đã được sử dụng trong đặt vé và không thể xóa",
                    used_seats = usedLayoutIds
                };

            // Lấy các SeatLayout cần xóa cứng
            var seatLayouts = await _context.SeatLayouts
                .Where(sl => model.LayoutIds.Contains(sl.Layout_ID))
                .ToListAsync();

            if (!seatLayouts.Any())
                throw new KeyNotFoundException("Không tìm thấy ghế nào cần xóa");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Lấy ID của các layout cần xóa
                var layoutIds = seatLayouts.Select(sl => sl.Layout_ID).ToList();

                // Lấy tất cả các seats liên quan
                var seats = await _context.Seats
                    .Where(s => layoutIds.Contains(s.Layout_ID))
                    .ToListAsync();

                // Xóa cứng tất cả seats liên quan
                if (seats.Any())
                {
                    _context.Seats.RemoveRange(seats);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Đã xóa {seats.Count} bản ghi Seats liên quan đến {layoutIds.Count} SeatLayouts");
                }

                // Xóa cứng tất cả SeatLayouts
                _context.SeatLayouts.RemoveRange(seatLayouts);

                // Cập nhật tổng số ghế trong phòng
                if (seatLayouts.Any())
                {
                    var roomId = seatLayouts.First().Cinema_Room_ID;
                    var remainingSeatsCount = await _context.SeatLayouts
                        .Where(sl => sl.Cinema_Room_ID == roomId && !layoutIds.Contains(sl.Layout_ID))
                        .CountAsync();

                    var cinemaRoom = await _context.CinemaRooms.FindAsync(roomId);
                    if (cinemaRoom != null)
                    {
                        cinemaRoom.Seat_Quantity = remainingSeatsCount;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new
                {
                    success = true,
                    message = $"Đã xóa cứng {seatLayouts.Count} ghế thành công",
                    deleted_count = seatLayouts.Count,
                    deleted_seats = seatLayouts.Select(sl => new
                    {
                        layout_id = sl.Layout_ID,
                        row_label = sl.Row_Label,
                        column_number = sl.Column_Number
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi xóa cứng ghế: {Message}", ex.Message);
                throw;
            }
        }
    }
}