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

            // THÊM MỚI: Kiểm tra số lượng ghế hợp lệ
            int totalSeats = 0;
            foreach (var row in model.Rows)
            {
                totalSeats += model.ColumnsPerRow - (row.EmptyColumns?.Count ?? 0);
            }

            if (totalSeats < 20 || totalSeats > 150)
            {
                throw new InvalidOperationException($"Số lượng ghế phải từ 20 đến 150 (hiện tại: {totalSeats})");
            }

            // THÊM MỚI: Kiểm tra có booking pending không
            if (await HasPendingBookingsForRoomAsync(roomId))
            {
                throw new InvalidOperationException("Không thể cập nhật layout ghế vì có đơn đặt vé đang chờ thanh toán. Vui lòng đợi các đơn này được hoàn tất hoặc hủy trước.");
            }

            // Kiểm tra xem phòng có showtime không
            var hasShowtimes = await _context.Showtimes
                .AnyAsync(s => s.Cinema_Room_ID == roomId && s.Show_Date >= DateTime.Today && s.Status != "Hidden");

            if (hasShowtimes)
                throw new InvalidOperationException("Không thể thay đổi sơ đồ ghế vì phòng đã có lịch chiếu");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Lấy danh sách các hàng ghế từ input model
                var newRowLabels = model.Rows.Select(r => r.RowLabel).ToList();

                // Chỉ xóa các hàng ghế đang được cấu hình lại (nếu đã tồn tại)
                var layoutsToRemove = await _context.SeatLayouts
                    .Where(sl => sl.Cinema_Room_ID == roomId && newRowLabels.Contains(sl.Row_Label))
                    .ToListAsync();

                // Xóa tất cả các layout đã chọn
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

                // Cập nhật tổng số ghế trong phòng
                var totalSeatsCount = newLayouts.Count;
                cinemaRoom.Seat_Quantity = totalSeatsCount;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // LƯU Ý: Không tạo Seat ở đây nữa - sẽ tạo khi tạo Showtime

                return new
                {
                    id = Guid.NewGuid().ToString(),
                    cinema_room_id = roomId,
                    total_rows = await _context.SeatLayouts
                        .Where(sl => sl.Cinema_Room_ID == roomId)
                        .Select(sl => sl.Row_Label)
                        .Distinct()
                        .CountAsync(),
                    total_seats = totalSeatsCount,
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
            try
            {
                _logger.LogInformation($"Bắt đầu cấu hình ghế cho phòng ID: {roomId} với input: {System.Text.Json.JsonSerializer.Serialize(model)}");

                // Kiểm tra phòng chiếu
                var cinemaRoom = await _context.CinemaRooms.FindAsync(roomId);
                if (cinemaRoom == null)
                {
                    var errorMsg = $"Không tìm thấy phòng chiếu có ID {roomId}";
                    _logger.LogWarning(errorMsg);
                    return new
                    {
                        success = false,
                        message = errorMsg,
                        error_code = "ROOM_NOT_FOUND"
                    };
                }

                // THÊM MỚI: Kiểm tra có booking pending không
                if (await HasPendingBookingsForRoomAsync(roomId))
                {
                    var errorMsg = "Không thể cập nhật layout ghế vì có đơn đặt vé đang chờ thanh toán";
                    _logger.LogWarning(errorMsg);
                    return new
                    {
                        success = false,
                        message = errorMsg,
                        error_code = "PENDING_BOOKINGS",
                        suggestion = "Vui lòng đợi các đơn đặt vé được hoàn tất hoặc hủy trước"
                    };
                }

                // Kiểm tra loại ghế hợp lệ - PHẢI là "Regular" hoặc "VIP", không chấp nhận giá trị khác
                string[] validSeatTypes = { "Regular", "VIP" };
                if (!validSeatTypes.Contains(model.SeatType, StringComparer.OrdinalIgnoreCase))
                {
                    var errorMsg = $"Loại ghế '{model.SeatType}' không hợp lệ";
                    _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}");
                    return new
                    {
                        success = false,
                        message = errorMsg,
                        error_code = "INVALID_SEAT_TYPE",
                        valid_values = validSeatTypes,
                        suggestion = "Loại ghế phải là một trong các giá trị: " + string.Join(", ", validSeatTypes)
                    };
                }

                // Kiểm tra dữ liệu đầu vào
                if (string.IsNullOrWhiteSpace(model.RowsInput))
                {
                    var errorMsg = "Danh sách hàng ghế không được bỏ trống";
                    _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}");
                    return new
                    {
                        success = false,
                        message = errorMsg,
                        error_code = "INVALID_ROWS_INPUT",
                        suggestion = "Vui lòng nhập danh sách hàng (ví dụ: A-E hoặc A,B,C)"
                    };
                }

                if (model.ColumnsPerRow <= 0)
                {
                    var errorMsg = "Số cột mỗi hàng phải lớn hơn 0";
                    _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}");
                    return new
                    {
                        success = false,
                        message = errorMsg,
                        error_code = "INVALID_COLUMNS_COUNT",
                        suggestion = "Vui lòng nhập số cột lớn hơn 0"
                    };
                }

                var rowLabels = new List<string>();

                // Xử lý định dạng phạm vi (range) như "A-Z"
                if (model.RowsInput.Contains("-"))
                {
                    var range = model.RowsInput.Split('-');
                    if (range.Length == 2 && range[0].Length == 1 && range[1].Length == 1)
                    {
                        char start = range[0][0];
                        char end = range[1][0];

                        if (start > end)
                        {
                            var errorMsg = $"Phạm vi hàng không hợp lệ: {start}-{end}. Ký tự bắt đầu phải nhỏ hơn ký tự kết thúc trong bảng chữ cái A-Z";
                            var suggestionMsg = $"Ví dụ hợp lệ: {end}-{start}, không phải {start}-{end}";
                            _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}");
                            return new
                            {
                                success = false,
                                message = errorMsg,
                                error_code = "INVALID_ROW_RANGE",
                                suggestion = suggestionMsg
                            };
                        }

                        for (char c = start; c <= end; c++)
                        {
                            rowLabels.Add(c.ToString());
                        }
                    }
                    else
                    {
                        var errorMsg = "Định dạng phạm vi hàng không hợp lệ";
                        _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}. Input: {model.RowsInput}");
                        return new
                        {
                            success = false,
                            message = errorMsg,
                            error_code = "INVALID_ROW_RANGE_FORMAT",
                            suggestion = "Định dạng hợp lệ: A-E (một ký tự đơn đến một ký tự đơn)"
                        };
                    }
                }
                else // Xử lý danh sách được phân tách bằng dấu phẩy
                {
                    rowLabels = model.RowsInput.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                     .Select(r => r.Trim()).ToList();

                    if (rowLabels.Count == 0)
                    {
                        var errorMsg = "Không thể phân tích danh sách hàng";
                        _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}. Input: {model.RowsInput}");
                        return new
                        {
                            success = false,
                            message = errorMsg,
                            error_code = "EMPTY_ROW_LIST",
                            suggestion = "Ví dụ hợp lệ: A,B,C hoặc A-E"
                        };
                    }
                }

                _logger.LogInformation($"Đã xử lý input thành {rowLabels.Count} hàng: {string.Join(", ", rowLabels)}");

                // Tính toán tổng số ghế dự kiến
                int totalColumns = model.ColumnsPerRow;
                int emptyColumnsPerRow = model.EmptyColumns?.Count ?? 0;
                int seatsPerRow = totalColumns - emptyColumnsPerRow;
                int totalSeats = rowLabels.Count * seatsPerRow;

                // THÊM MỚI: Kiểm tra số lượng ghế hợp lệ
                if (totalSeats < 20 || totalSeats > 150)
                {
                    var errorMsg = $"Số lượng ghế phải từ 20 đến 150 (hiện tại: {totalSeats})";
                    _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}");
                    return new
                    {
                        success = false,
                        message = errorMsg,
                        error_code = "INVALID_SEAT_COUNT",
                        details = new
                        {
                            total_seats = totalSeats,
                            rows = rowLabels.Count,
                            columns_per_row = model.ColumnsPerRow,
                            empty_columns = model.EmptyColumns?.Count ?? 0,
                            seats_per_row = seatsPerRow
                        },
                        suggestion = "Vui lòng điều chỉnh số lượng hàng hoặc cột để có số lượng ghế từ 20 đến 150"
                    };
                }

                var existingRows = await _context.SeatLayouts
                .Where(sl => sl.Cinema_Room_ID == roomId && rowLabels.Contains(sl.Row_Label))
                .Select(sl => sl.Row_Label)
                .Distinct()
                .ToListAsync();

                if (existingRows.Any())
                {
                    // Nếu không có tham số xác nhận ghi đè, thì trả về thông báo cảnh báo
                    if (!model.OverwriteExisting.GetValueOrDefault(false))
                    {
                        var errorMsg = $"Các hàng ghế sau đã tồn tại: {string.Join(", ", existingRows)}";
                        _logger.LogWarning($"Cảnh báo cấu hình ghế: {errorMsg}");
                        return new
                        {
                            success = false,
                            message = errorMsg,
                            error_code = "ROWS_ALREADY_EXIST",
                            existing_rows = existingRows,
                            suggestion = "Nếu bạn muốn ghi đè cấu hình ghế hiện có, hãy thêm tham số 'overwriteExisting': true"
                        };
                    }
                    else
                    {
                        _logger.LogWarning($"Ghi đè cấu hình cho các hàng ghế đã tồn tại: {string.Join(", ", existingRows)}");
                    }
                }

                // Kiểm tra phòng đã có ghế được đặt chưa
                var hasBookedSeats = await _context.Seats
                    .AnyAsync(s => s.SeatLayout.Cinema_Room_ID == roomId && s.Booking_ID != null);

                if (hasBookedSeats)
                {
                    var errorMsg = "Không thể thay đổi sơ đồ ghế vì phòng này đã có ghế được đặt trong hệ thống";
                    _logger.LogWarning($"Lỗi cấu hình ghế: {errorMsg}");
                    return new
                    {
                        success = false,
                        message = errorMsg,
                        error_code = "ROOM_HAS_BOOKINGS",
                        suggestion = "Vui lòng chọn phòng khác hoặc xóa tất cả đặt vé hiện tại trước khi cấu hình lại"
                    };
                }

                // Tạo SeatMapConfigurationDto từ các hàng được chỉ định
                var configDto = new SeatMapConfigurationDto
                {
                    ColumnsPerRow = model.ColumnsPerRow,
                    Rows = rowLabels.Select(label => new RowConfigurationDto
                    {
                        RowLabel = label,
                        SeatType = model.SeatType,
                        EmptyColumns = model.EmptyColumns ?? new List<int>()
                    }).ToList()
                };

                // Gọi phương thức cấu hình hiện có
                var result = await ConfigureSeatLayoutAsync(roomId, configDto);

                // Kiểm tra kết quả để ghi log
                if (result != null)
                {
                    _logger.LogInformation($"Đã cấu hình thành công sơ đồ ghế cho phòng {roomId}: " +
                        $"{(result.GetType().GetProperty("total_seats")?.GetValue(result) ?? 0)} ghế trong " +
                        $"{(result.GetType().GetProperty("total_rows")?.GetValue(result) ?? 0)} hàng");

                    // Thêm thông báo thành công vào kết quả
                    var successResult = new
                    {
                        success = true,
                        message = $"Đã cấu hình thành công sơ đồ ghế cho phòng {roomId}",
                        result
                    };

                    return successResult;
                }

                // Nếu kết quả null nhưng không có exception, có thể là lỗi khác
                _logger.LogWarning($"Cấu hình ghế không thành công nhưng không có lỗi cụ thể");
                return new
                {
                    success = false,
                    message = "Cấu hình ghế không thành công",
                    error_code = "UNKNOWN_ERROR",
                    suggestion = "Vui lòng kiểm tra lại tham số đầu vào và thử lại"
                };
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogError(ex, $"Lỗi cấu hình ghế cho phòng {roomId}: Không tìm thấy dữ liệu");
                return new
                {
                    success = false,
                    message = ex.Message,
                    error_code = "NOT_FOUND",
                    suggestion = "Vui lòng kiểm tra lại ID phòng chiếu"
                };
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"Lỗi cấu hình ghế cho phòng {roomId}: Không thể thực hiện thao tác");
                return new
                {
                    success = false,
                    message = ex.Message,
                    error_code = "INVALID_OPERATION",
                    suggestion = "Phòng có thể đã có đặt vé hoặc đang được sử dụng"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi không xác định khi cấu hình ghế cho phòng {roomId}");
                return new
                {
                    success = false,
                    message = $"Lỗi khi cấu hình ghế: {ex.Message}",
                    error_code = "INTERNAL_ERROR",
                    stack_trace = ex.StackTrace, // Chỉ hiển thị trong môi trường phát triển
                    suggestion = "Vui lòng liên hệ quản trị viên hệ thống"
                };
            }
        }

        public async Task<object> UpdateSeatTypeAsync(int layoutId, UpdateSeatTypeDto model)
        {
            var seatLayout = await _context.SeatLayouts.FindAsync(layoutId);
            if (seatLayout == null)
            {
                throw new KeyNotFoundException($"Không tìm thấy ghế có ID {layoutId}");
            }

            // THÊM MỚI: Kiểm tra có booking pending không
            if (await HasPendingBookingsForLayoutsAsync(new List<int> { layoutId }))
            {
                throw new InvalidOperationException("Không thể cập nhật loại ghế vì có đơn đặt vé đang chờ thanh toán. Vui lòng đợi các đơn này được hoàn tất hoặc hủy trước.");
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

            // THÊM MỚI: Kiểm tra có booking pending không
            if (await HasPendingBookingsForLayoutsAsync(model.LayoutIds))
            {
                throw new InvalidOperationException("Không thể cập nhật loại ghế vì có đơn đặt vé đang chờ thanh toán. Vui lòng đợi các đơn này được hoàn tất hoặc hủy trước.");
            }

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

            // THÊM MỚI: Kiểm tra có booking pending không
            if (await HasPendingBookingsForLayoutsAsync(model.LayoutIds))
            {
                return new
                {
                    success = false,
                    message = "Không thể xóa ghế vì có đơn đặt vé đang chờ thanh toán. Vui lòng đợi các đơn này được hoàn tất hoặc hủy trước.",
                    error_code = "PENDING_BOOKINGS"
                };
            }

            // Kiểm tra xem có SeatLayout nào đang được sử dụng trong Showtime không
            var usedLayoutIds = await _context.Seats
                .Where(s => model.LayoutIds.Contains(s.Layout_ID) && s.Booking_ID != null)
                .Select(s => s.Layout_ID)
                .Distinct()
                .ToListAsync();

            if (usedLayoutIds.Any())
                return new
                {
                    success = false,
                    message = "Một số layout ghế đã được sử dụng trong đặt vé và không thể xóa",
                    used_layouts = usedLayoutIds
                };

            // Lấy các SeatLayout cần xóa mềm
            var seatLayouts = await _context.SeatLayouts
                .Where(sl => model.LayoutIds.Contains(sl.Layout_ID))
                .ToListAsync();

            if (!seatLayouts.Any())
                throw new KeyNotFoundException("Không tìm thấy layout ghế nào cần xóa");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Cập nhật is_active = false thay vì xóa cứng
                foreach (var layout in seatLayouts)
                {
                    layout.Is_Active = false;
                }

                // Không cần cập nhật trạng thái Seat vì Seat sẽ được tạo theo Showtime,
                // và khi tạo Seat mới sẽ dựa vào SeatLayout.Is_Active

                // Cập nhật tổng số ghế trong phòng
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
                    message = $"Đã xóa mềm {seatLayouts.Count} layout ghế thành công",
                    deleted_count = seatLayouts.Count,
                    deleted_layouts = seatLayouts.Select(sl => new
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
                _logger.LogError(ex, "Lỗi khi xóa mềm layout ghế: {Message}", ex.Message);
                throw;
            }
        }

        public async Task<object> CreateRoomWithExistingLayoutAsync(CreateRoomWithLayoutDto model)
        {
            // Kiểm tra phòng chiếu mẫu có tồn tại không
            var templateRoom = await _context.CinemaRooms.FindAsync(model.TemplateRoomId);
            if (templateRoom == null)
                throw new KeyNotFoundException($"Không tìm thấy phòng chiếu mẫu có ID {model.TemplateRoomId}");

            // Kiểm tra xem phòng chiếu mẫu có layout ghế không
            var templateLayouts = await _context.SeatLayouts
                .Where(sl => sl.Cinema_Room_ID == model.TemplateRoomId && sl.Is_Active)
                .ToListAsync();
            if (!templateLayouts.Any())
                throw new InvalidOperationException("Phòng chiếu mẫu không có layout ghế active để sao chép");

            // THÊM MỚI: Kiểm tra số lượng ghế hợp lệ
            int activeSeatsCount = templateLayouts.Count;
            if (activeSeatsCount < 20 || activeSeatsCount > 150)
            {
                throw new InvalidOperationException($"Số lượng ghế trong phòng mẫu phải từ 20 đến 150 (hiện tại: {activeSeatsCount})");
            }

            // Bắt đầu giao dịch để đảm bảo toàn vẹn dữ liệu
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Tạo phòng chiếu mới
                var newRoom = new CinemaRoom
                {
                    Room_Name = model.RoomName,
                    Room_Type = model.RoomType,
                    Seat_Quantity = activeSeatsCount, // Chỉ tính số lượng ghế active
                    Status = "Active"
                };
                _context.CinemaRooms.Add(newRoom);
                await _context.SaveChangesAsync(); // Lưu để lấy Cinema_Room_ID

                // Sao chép layout ghế từ phòng chiếu mẫu
                var newLayouts = new List<SeatLayout>();
                foreach (var templateLayout in templateLayouts)
                {
                    var newLayout = new SeatLayout
                    {
                        Cinema_Room_ID = newRoom.Cinema_Room_ID,
                        Row_Label = templateLayout.Row_Label,
                        Column_Number = templateLayout.Column_Number,
                        Seat_Type = templateLayout.Seat_Type,
                        Is_Active = templateLayout.Is_Active
                    };
                    newLayouts.Add(newLayout);
                }
                await _context.SeatLayouts.AddRangeAsync(newLayouts);
                await _context.SaveChangesAsync();

                // Xác nhận giao dịch
                await transaction.CommitAsync();

                // Trả về kết quả
                return new
                {
                    cinema_room = new
                    {
                        newRoom.Cinema_Room_ID,
                        newRoom.Room_Name,
                        newRoom.Room_Type,
                        seat_quantity = newRoom.Seat_Quantity
                    },
                    message = "Đã tạo phòng chiếu mới và sao chép layout ghế thành công"
                };
            }
            catch (Exception ex)
            {
                // Hủy giao dịch nếu có lỗi
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi khi tạo phòng chiếu mới với layout có sẵn: {Message}", ex.Message);
                throw;
            }
        }

        /// <summary>
        /// Kiểm tra xem có booking nào đang ở trạng thái Pending liên quan đến ghế trong phòng
        /// </summary>
        private async Task<bool> HasPendingBookingsForRoomAsync(int roomId)
        {
            // Lấy danh sách tất cả các showtime của phòng
            var showtimes = await _context.Showtimes
                .Where(s => s.Cinema_Room_ID == roomId && s.Status != "Hidden" && s.Status != "Cancelled")
                .Select(s => s.Showtime_ID)
                .ToListAsync();

            if (!showtimes.Any())
            {
                return false;
            }

            // Kiểm tra xem có booking nào đang ở trạng thái Pending cho các showtime này không
            var hasPendingBookings = await _context.TicketBookings
                .AnyAsync(b => showtimes.Contains(b.Showtime_ID) && b.Status == "Pending");

            return hasPendingBookings;
        }

        /// <summary>
        /// Kiểm tra xem có booking nào đang ở trạng thái Pending liên quan đến ghế cụ thể
        /// </summary>
        private async Task<bool> HasPendingBookingsForLayoutsAsync(List<int> layoutIds)
        {
            // Lấy thông tin phòng từ các layoutIds
            var roomIds = await _context.SeatLayouts
                .Where(sl => layoutIds.Contains(sl.Layout_ID))
                .Select(sl => sl.Cinema_Room_ID)
                .Distinct()
                .ToListAsync();

            foreach (var roomId in roomIds)
            {
                if (await HasPendingBookingsForRoomAsync(roomId))
                {
                    return true;
                }
            }

            return false;
        }
    }
}


