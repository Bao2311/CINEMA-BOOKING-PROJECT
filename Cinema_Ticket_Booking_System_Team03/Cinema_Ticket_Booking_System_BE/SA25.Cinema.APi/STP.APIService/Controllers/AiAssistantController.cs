using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STP.Repository.Dtos;
using STP.Repository.Services;
using System;
using System.Threading.Tasks;

namespace STP.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class AiAssistantController : ControllerBase
    {
        private readonly AiAssistantService _aiAssistantService;
        private readonly ILogger<AiAssistantController> _logger;

        public AiAssistantController(AiAssistantService aiAssistantService, ILogger<AiAssistantController> logger)
        {
            _aiAssistantService = aiAssistantService;
            _logger = logger;
        }

        /// <summary>
        /// Gửi tin nhắn đến Trợ lý AI đặt vé thông minh
        /// </summary>
        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] AiChatRequest request)
        {
            try
            {
                var response = await _aiAssistantService.ProcessChatMessageAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI chat message: {Message}", ex.Message);
                return StatusCode(500, new
                {
                    Reply = "Xin lỗi bạn, trợ lý AI đang bận trong giây lát. Bạn vui lòng thử lại hoặc chọn phim trực tiếp trên trang chủ nhé!",
                    SuggestedActions = _aiAssistantService.GetInitialSuggestions()
                });
            }
        }

        /// <summary>
        /// Lấy danh sách câu hỏi gợi ý ban đầu
        /// </summary>
        [HttpGet("suggestions")]
        public IActionResult GetSuggestions()
        {
            var suggestions = _aiAssistantService.GetInitialSuggestions();
            return Ok(suggestions);
        }
    }
}
