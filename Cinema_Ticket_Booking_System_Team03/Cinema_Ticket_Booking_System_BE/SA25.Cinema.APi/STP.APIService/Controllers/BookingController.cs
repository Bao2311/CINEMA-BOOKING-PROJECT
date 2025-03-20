using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _bookingService;
        private readonly ILogger<BookingController> _logger;
        private readonly CinemaDbContext _context;

        public BookingController(BookingService bookingService, ILogger<BookingController> logger, CinemaDbContext context)
        {
            _bookingService = bookingService;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách đơn đặt vé của người dùng hiện tại
        /// </summary>
        [HttpGet("my-bookings")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BookingHistoryDTO>>> GetMyBookings()
        {
            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }
            try
            {
                // Lấy thông tin người dùng từ token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                    User.FindFirst("nameid")?.Value ??
                    User.FindFirst("UserId")?.Value ??
                    User.FindFirst("userId")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var bookings = await _bookingService.GetUserBookings(int.Parse(userId));
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách đơn đặt vé" });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của đơn đặt vé
        /// </summary>
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<BookingResponseDTO>> GetBookingDetails(int id)
        {
            _logger.LogInformation("Danh sách claims trong token:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
            }
            try
            {
                // Lấy thông tin người dùng từ token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                    User.FindFirst("nameid")?.Value ??
                    User.FindFirst("UserId")?.Value ??
                    User.FindFirst("userId")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Không thể xác định người dùng" });
                }

                var booking = await _bookingService.GetBookingDetail(id);
                return Ok(booking);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting booking details for ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin chi tiết đơn đặt vé" });
            }
        }
    }
}


