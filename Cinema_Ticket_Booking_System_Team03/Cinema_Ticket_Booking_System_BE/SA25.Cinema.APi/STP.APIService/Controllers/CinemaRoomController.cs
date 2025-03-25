using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.APIService.Services;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;

namespace STP.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CinemaRoomController : ControllerBase
    {
        private readonly CinemaRoomService _roomService;
        private readonly ILogger<CinemaRoomController> _logger;

        public CinemaRoomController(CinemaRoomService roomService, ILogger<CinemaRoomController> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả phòng chiếu
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllCinemaRooms([FromQuery] string filter = null)
        {
            try
            {
                var rooms = await _roomService.GetAllCinemaRoomsAsync(filter);
                return Ok(rooms);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all rooms");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách phòng chiếu" });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết của một phòng chiếu
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCinemaRoom(int id)
        {
            try
            {
                var room = await _roomService.GetCinemaRoomAsync(id);
                if (room == null)
                    return NotFound(new { message = "Không tìm thấy phòng chiếu" });

                return Ok(room);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting room details for ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy thông tin chi tiết phòng chiếu" });
            }
        }

        /// <summary>
        /// Lấy danh sách phim đang chiếu tại phòng chiếu
        /// </summary>
        [HttpGet("{id}/movies")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMoviesByRoom(int id)
        {
            try
            {
                var movies = await _roomService.GetMoviesByRoomIdAsync(id);
                return Ok(movies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting movies by room ID: {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi lấy danh sách phim theo phòng chiếu" });
            }
        }

        /// <summary>
        /// Thêm phòng chiếu mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> CreateCinemaRoom([FromBody] CinemaRoomCreateDto model)
        {
            try
            {
                if (model == null)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ" });

                var room = await _roomService.CreateCinemaRoomAsync(model);
                return CreatedAtAction(nameof(GetCinemaRoom), new { id = room.Cinema_Room_ID }, room);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating cinema room");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi tạo phòng chiếu mới" });
            }
        }

        /// <summary>
        /// Cập nhật thông tin phòng chiếu
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> UpdateCinemaRoom(int id, [FromBody] CinemaRoomUpdateDto model)
        {
            try
            {
                if (model == null)
                    return BadRequest(new { message = "Dữ liệu không hợp lệ" });

                var room = await _roomService.UpdateCinemaRoomAsync(id, model);
                return Ok(room);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error while updating cinema room {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi cập nhật phòng chiếu" });
            }
        }

        /// <summary>
        /// Xóa phòng chiếu
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> DeleteCinemaRoom(int id)
        {
            try
            {
                var result = await _roomService.DeleteCinemaRoomAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error while deleting cinema room {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi xóa phòng chiếu" });
            }
        }

        /// <summary>
        /// Kiểm tra tình trạng hoạt động của phòng chiếu
        /// </summary>
        [HttpGet("check-status/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckCinemaRoomStatus(int id)
        {
            try
            {
                var result = await _roomService.CheckCinemaRoomStatusAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking cinema room status {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi kiểm tra tình trạng phòng chiếu" });
            }
        }

        /// <summary>
        /// Đánh dấu phòng chiếu là không hoạt động
        /// </summary>
        [HttpPost("{id}/deactivate")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> DeactivateCinemaRoom(int id)
        {
            try
            {
                var result = await _roomService.DeactivateCinemaRoomAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error while deactivating cinema room {id}");
                return StatusCode(500, new { message = "Có lỗi xảy ra khi đánh dấu phòng chiếu không hoạt động" });
            }
        }
    }
}


