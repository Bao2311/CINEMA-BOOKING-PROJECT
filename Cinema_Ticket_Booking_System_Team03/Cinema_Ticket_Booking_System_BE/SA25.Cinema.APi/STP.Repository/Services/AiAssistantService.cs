using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;

namespace STP.Repository.Services
{
    public class AiAssistantService
    {
        private readonly CinemaDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AiAssistantService> _logger;
        private readonly HttpClient _httpClient;

        public AiAssistantService(
            CinemaDbContext context,
            IConfiguration configuration,
            ILogger<AiAssistantService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task<AiChatResponse> ProcessChatMessageAsync(AiChatRequest request)
        {
            string rawMessage = request?.Message?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(rawMessage))
            {
                return GetDefaultWelcomeResponse();
            }

            // 1. Kiểm tra xem có cấu hình Gemini API hoặc OpenAI API không
            string geminiKey = _configuration["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (!string.IsNullOrEmpty(geminiKey))
            {
                try
                {
                    var geminiResponse = await CallGeminiApiAsync(rawMessage, request.History, geminiKey);
                    if (geminiResponse != null && !string.IsNullOrWhiteSpace(geminiResponse.Reply))
                    {
                        // Bổ sung thêm movie / showtime cards liên quan từ CSDL nếu câu hỏi nhắc đến tên phim
                        await EnrichResponseWithDatabaseEntities(rawMessage, geminiResponse);
                        return geminiResponse;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Gemini API error, falling back to local NLP engine: {ex.Message}");
                }
            }

            // 2. Chạy Engine Trợ Lý Cinema Thông Minh (Local AI & Context Engine)
            return await ProcessWithLocalCinemaEngineAsync(rawMessage);
        }

        public List<string> GetInitialSuggestions()
        {
            return new List<string>
            {
                "🎬 Phim đang chiếu hot nhất?",
                "🎟️ Tìm suất chiếu hôm nay",
                "🍿 Bảng giá vé & Combo bắp nước",
                "🔥 Gợi ý phim hành động / viễn tưởng",
                "📍 Địa chỉ rạp & Hướng dẫn check-in"
            };
        }

        private AiChatResponse GetDefaultWelcomeResponse()
        {
            return new AiChatResponse
            {
                Reply = "Xin chào! 👋 Tôi là **CinemaBot** - Trợ lý AI đặt vé thông minh của **STP Cinema** 🍿.\n\n" +
                        "Tôi có thể giúp bạn:\n" +
                        "- 🎬 Tra cứu các bộ phim đang chiếu & sắp chiếu\n" +
                        "- 🎟️ Tìm suất chiếu theo khung giờ & phòng chiếu\n" +
                        "- 💡 Tư vấn phim hay theo thể loại hoặc sở thích\n" +
                        "- 💰 Tra cứu bảng giá vé, combo bắp nước & ưu đãi\n\n" +
                        "Hôm nay bạn muốn thưởng thức bộ phim nào?",
                SuggestedActions = GetInitialSuggestions()
            };
        }

        private async Task<AiChatResponse> ProcessWithLocalCinemaEngineAsync(string message)
        {
            string normalized = RemoveDiacritics(message).ToLowerInvariant();
            string originalLower = message.ToLowerInvariant();

            var today = DateTime.Today;
            var activeMovies = await _context.Movies
                .Where(m => m.Status != "Cancelled")
                .OrderByDescending(m => m.Release_Date)
                .ToListAsync();

            var upcomingShowtimes = await _context.Showtimes
                .Include(s => s.Movie)
                .Include(s => s.CinemaRoom)
                .Where(s => s.Show_Date.Date >= today && (s.Status == "Active" || s.Status == "Scheduled"))
                .OrderBy(s => s.Show_Date)
                .ThenBy(s => s.Start_Time)
                .ToListAsync();

            // -------------------------------------------------------------
            // A. TÌM KIẾM THEO TÊN PHIM CỤ THỂ
            // -------------------------------------------------------------
            Movie matchedMovie = null;
            foreach (var movie in activeMovies)
            {
                string normMovie = RemoveDiacritics(movie.Movie_Name).ToLowerInvariant();
                string[] parts = normMovie.Split(new[] { ' ', ':', '-', ',' }, StringSplitOptions.RemoveEmptyEntries);

                if (normalized.Contains(normMovie) || originalLower.Contains(movie.Movie_Name.ToLowerInvariant()))
                {
                    matchedMovie = movie;
                    break;
                }

                // Match cụm từ chính (ví dụ "avengers", "batman", "doraemon", "conan", "godzilla", "mai")
                foreach (var part in parts)
                {
                    if (part.Length >= 4 && normalized.Contains(part))
                    {
                        matchedMovie = movie;
                        break;
                    }
                }
                if (matchedMovie != null) break;
            }

            if (matchedMovie != null)
            {
                var movieShowtimes = upcomingShowtimes
                    .Where(s => s.Movie_ID == matchedMovie.Movie_ID)
                    .Take(4)
                    .ToList();

                var response = new AiChatResponse
                {
                    Movies = new List<AiMovieCardDto> { MapToMovieCard(matchedMovie) }
                };

                var sb = new StringBuilder();
                sb.AppendLine($"🎬 **Thông tin phim: {matchedMovie.Movie_Name.ToUpper()}**\n");
                sb.AppendLine($"- **Thể loại**: {matchedMovie.Genre ?? "Đa dạng"}");
                sb.AppendLine($"- **Thời lượng**: {matchedMovie.Duration} phút • **Độ tuổi**: {matchedMovie.Rating ?? "P"}");
                sb.AppendLine($"- **Ngôn ngữ**: {matchedMovie.Language ?? "Phụ đề"}");
                if (!string.IsNullOrEmpty(matchedMovie.Synopsis))
                {
                    string shortSynopsis = matchedMovie.Synopsis.Length > 180
                        ? matchedMovie.Synopsis.Substring(0, 180) + "..."
                        : matchedMovie.Synopsis;
                    sb.AppendLine($"- **Nội dung**: {shortSynopsis}\n");
                }

                if (movieShowtimes.Any())
                {
                    sb.AppendLine($"🎟️ **Các suất chiếu gần nhất của phim:**\n");
                    foreach (var st in movieShowtimes)
                    {
                        response.Showtimes.Add(MapToShowtimeCard(st));
                        var endTime = st.Start_Time.Add(TimeSpan.FromMinutes(matchedMovie.Duration > 0 ? matchedMovie.Duration : 120));
                        sb.AppendLine($"- 🕒 **{st.Show_Date:dd/MM/yyyy}**: {st.Start_Time:hh\\:mm} ~ {endTime:hh\\:mm} ({st.CinemaRoom?.Room_Name ?? "Phòng chiếu"})");
                    }
                    sb.AppendLine("\n👉 *Bạn có thể bấm trực tiếp vào nút **'Đặt vé ngay'** bên dưới để chọn ghế ngồi nhé!*");
                    response.SuggestedActions = new List<string>
                    {
                        $"Suất chiếu khác của {matchedMovie.Movie_Name}",
                        "Bảng giá vé rạp",
                        "Phim đang chiếu khác"
                    };
                }
                else
                {
                    sb.AppendLine("Hiện tại phim chưa có lịch chiếu mới hôm nay. Bạn có thể theo dõi thêm hoặc chọn phim khác đang chiếu rạp nhé!");
                    response.SuggestedActions = new List<string> { "Xem phim đang chiếu", "Suất chiếu hôm nay", "Bảng giá vé" };
                }

                response.Reply = sb.ToString();
                return response;
            }

            // -------------------------------------------------------------
            // B. CHÀO HỎI / GIỚI THIỆU (Khi không có câu hỏi cụ thể về phim hay vé)
            // -------------------------------------------------------------
            if (MatchesAny(normalized, "chao", "hello", "hi", "xin chao", "alo", "hey", "ban la ai", "ai do", "menu", "bat dau") &&
                !MatchesAny(normalized, "phim", "suat", "chieu", "gia", "rap", "gio", "ve", "goi y", "tu van"))
            {
                return GetDefaultWelcomeResponse();
            }

            // -------------------------------------------------------------
            // C. TRA CỨU SUẤT CHIẾU HÔM NAY / KHUNG GIỜ
            // -------------------------------------------------------------
            if (MatchesAny(normalized, "suat chieu", "xuat chieu", "lich chieu", "may gio", "gio chieu", "hom nay chieu", "toi nay", "chieu hom nay"))
            {
                var todayShowtimes = upcomingShowtimes
                    .Where(s => s.Show_Date.Date == today)
                    .Take(5)
                    .ToList();

                var response = new AiChatResponse();
                var sb = new StringBuilder();

                if (todayShowtimes.Any())
                {
                    sb.AppendLine($"📅 **Lịch chiếu nổi bật hôm nay ({today:dd/MM/yyyy}) tại STP Cinema:**\n");
                    foreach (var st in todayShowtimes)
                    {
                        response.Showtimes.Add(MapToShowtimeCard(st));
                        var endTime = st.Start_Time.Add(TimeSpan.FromMinutes(st.Movie?.Duration > 0 ? st.Movie.Duration : 120));
                        sb.AppendLine($"- 🎬 **{st.Movie?.Movie_Name ?? "Phim chiếu rạp"}**: {st.Start_Time:hh\\:mm} ~ {endTime:hh\\:mm} ({st.CinemaRoom?.Room_Name ?? "Phòng chiếu"})");
                    }
                    sb.AppendLine("\n💡 *Bấm vào nút **'Đặt vé ngay'** trên từng suất bên dưới để chọn ghế ngồi và thanh toán trực tiếp!*");
                    response.SuggestedActions = new List<string> { "Giá vé phòng VIP", "Combo bắp nước", "Gợi ý phim hot" };
                }
                else
                {
                    var upcoming = upcomingShowtimes.Take(4).ToList();
                    sb.AppendLine("📅 **Các suất chiếu sắp tới tại STP Cinema:**\n");
                    foreach (var st in upcoming)
                    {
                        response.Showtimes.Add(MapToShowtimeCard(st));
                        var endTime = st.Start_Time.Add(TimeSpan.FromMinutes(st.Movie?.Duration > 0 ? st.Movie.Duration : 120));
                        sb.AppendLine($"- 🎬 **{st.Movie?.Movie_Name ?? "Phim chiếu rạp"}**: {st.Show_Date:dd/MM} lúc {st.Start_Time:hh\\:mm} ({st.CinemaRoom?.Room_Name ?? "Phòng chiếu"})");
                    }
                    response.SuggestedActions = new List<string> { "Phim đang chiếu", "Bảng giá vé", "Địa chỉ rạp" };
                }

                response.Reply = sb.ToString();
                return response;
            }

            // -------------------------------------------------------------
            // D. TƯ VẤN THEO THỂ LOẠI (Hành động, kinh dị, hoạt hình, hài...)
            // -------------------------------------------------------------
            string matchedGenre = null;
            if (MatchesAny(normalized, "hanh dong", "action")) matchedGenre = "Hành Động";
            else if (MatchesAny(normalized, "kinh di", "horror", "ma")) matchedGenre = "Kinh Dị";
            else if (MatchesAny(normalized, "hoat hinh", "anime", "tre em", "gia dinh")) matchedGenre = "Hoạt Hình";
            else if (MatchesAny(normalized, "hai", "comedy", "vui")) matchedGenre = "Hài Hước";
            else if (MatchesAny(normalized, "tinh cam", "lang man", "tam ly")) matchedGenre = "Tình Cảm";
            else if (MatchesAny(normalized, "vien tuong", "sci-fi", "khoa hoc")) matchedGenre = "Viễn Tưởng";

            if (matchedGenre != null || MatchesAny(normalized, "tu van", "goi y", "phim gi hay", "nen xem phim nao", "phim hot"))
            {
                var filteredMovies = activeMovies.AsEnumerable();
                if (matchedGenre != null)
                {
                    filteredMovies = filteredMovies.Where(m =>
                        (m.Genre != null && RemoveDiacritics(m.Genre).ToLowerInvariant().Contains(RemoveDiacritics(matchedGenre).ToLowerInvariant())) ||
                        (m.Synopsis != null && RemoveDiacritics(m.Synopsis).ToLowerInvariant().Contains(RemoveDiacritics(matchedGenre).ToLowerInvariant())));
                }

                var list = filteredMovies.Take(3).ToList();
                if (!list.Any()) list = activeMovies.Take(3).ToList();

                var response = new AiChatResponse();
                foreach (var m in list)
                {
                    response.Movies.Add(MapToMovieCard(m));
                }

                var sb = new StringBuilder();
                if (matchedGenre != null)
                {
                    sb.AppendLine($"🍿 **Dưới đây là các phim thể loại {matchedGenre} cực hấp dẫn đang có tại rạp:**\n");
                }
                else
                {
                    sb.AppendLine("🔥 **Top các phim chiếu rạp hot & được yêu thích nhất hiện nay:**\n");
                }

                foreach (var m in list)
                {
                    sb.AppendLine($"- 🎬 **{m.Movie_Name}** ({m.Duration} phút | {m.Rating ?? "P"}) - {m.Genre}");
                }
                sb.AppendLine("\n👉 *Bạn muốn xem suất chiếu của phim nào trong số này? Hãy nhắn tên phim cho tôi nhé!*");

                response.Reply = sb.ToString();
                response.SuggestedActions = list.Select(m => $"Suất chiếu {m.Movie_Name}").Take(3).ToList();
                response.SuggestedActions.Add("Bảng giá vé");
                return response;
            }

            // -------------------------------------------------------------
            // E. BẢNG GIÁ VÉ & COMBO BẮP NƯỚC
            // -------------------------------------------------------------
            if (MatchesAny(normalized, "gia ve", "bao nhieu tien", "ve vip", "ve thuong", "bap nuoc", "combo", "bong ngo", "gia ca"))
            {
                return new AiChatResponse
                {
                    Reply = "💰 **BẢNG GIÁ VÉ & COMBO BẮP NƯỚC TẠI STP CINEMA** 🎟️🍿\n\n" +
                            "**1. Giá vé xem phim:**\n" +
                            "- 💺 **Ghế Thường (Standard):** 75.000 VNĐ - 85.000 VNĐ\n" +
                            "- 👑 **Ghế VIP (Vị trí trung tâm đẹp nhất):** 110.000 VNĐ - 120.000 VNĐ\n" +
                            "- 💑 **Ghế Đôi (Couple Sweetbox):** 190.000 VNĐ - 220.000 VNĐ / cặp\n" +
                            "- *Lưu ý: Suất chiếu cuối tuần & phòng đặc biệt có thể chênh lệch từ 10.000 - 20.000 VNĐ.*\n\n" +
                            "**2. Combo Bắp Nước Ưu Đãi:**\n" +
                            "- 🥤 **Combo Solo:** 1 Bắp ngọt lớn + 1 Coke (65.000 VNĐ)\n" +
                            "- 🍿 **Combo Couple:** 1 Bắp ngọt/phô mai khổng lồ + 2 Nước ngọt (85.000 VNĐ)\n" +
                            "- ✨ **Combo VIP Party:** 2 Bắp vị tùy chọn + 3 Nước + 1 Snack (120.000 VNĐ)\n\n" +
                            "Bạn muốn đặt vé cho phim nào ngay bây giờ?",
                    SuggestedActions = new List<string> { "Phim đang chiếu hot", "Suất chiếu hôm nay", "Cách đặt vé" }
                };
            }

            // -------------------------------------------------------------
            // F. ĐỊA CHỈ RẠP & HƯỚNG DẪN CHECK-IN
            // -------------------------------------------------------------
            if (MatchesAny(normalized, "dia chi", "o dau", "rap o dau", "gio mo cua", "hotline", "check-in", "quet ve", "ma qr", "hoan tien", "huy ve"))
            {
                return new AiChatResponse
                {
                    Reply = "📍 **THÔNG TIN RẠP CHIẾU & HƯỚNG DẪN CHECK-IN STP CINEMA** 🎬\n\n" +
                            "- 🏢 **Địa chỉ:** Tầng 3, TTTM STP Cinema Center, 45 Nguyễn Thị Minh Khai, Quận 1, TP.HCM\n" +
                            "- ⏰ **Giờ hoạt động:** 08:00 - 23:30 (Tất cả các ngày trong tuần)\n" +
                            "- 📞 **Hotline hỗ trợ:** 1900 6868 (8:00 - 22:00)\n\n" +
                            "🎫 **Hướng dẫn Check-in khi đến rạp:**\n" +
                            "1. Sau khi thanh toán thành công, bạn nhận được **Vé điện tử PDF kèm mã QR** gửi qua Email hoặc trong trang *Hồ sơ > Lịch sử vé*.\n" +
                            "2. Đến quầy soát vé rạp, chỉ cần mở mã QR trên điện thoại để nhân viên quét mã vào phòng chiếu siêu nhanh!\n" +
                            "3. Không cần in vé giấy - tiện lợi và thân thiện với môi trường.",
                    SuggestedActions = new List<string> { "Phim đang chiếu", "Bảng giá vé", "Tìm suất chiếu hôm nay" }
                };
            }

            // -------------------------------------------------------------
            // G. HƯỚNG DẪN CÁCH ĐẶT VÉ TRỰC TUYẾN
            // -------------------------------------------------------------
            if (MatchesAny(normalized, "cach dat ve", "huong dan dat ve", "dat ve nhu the nao", "lam sao dat ve"))
            {
                return new AiChatResponse
                {
                    Reply = "🎟️ **HƯỚNG DẪN ĐẶT VÉ NHANH CHÓNG TẠI STP CINEMA:**\n\n" +
                            "1️⃣ **Bước 1:** Chọn phim bạn muốn xem và nhấn **Xem suất chiếu**.\n" +
                            "2️⃣ **Bước 2:** Chọn khung giờ và phòng chiếu ưng ý.\n" +
                            "3️⃣ **Bước 3:** Nhấn **'Chọn ghế'** để vào sơ đồ rạp và chọn vị trí ghế VIP / Thường yêu thích.\n" +
                            "4️⃣ **Bước 4:** Kiểm tra thông tin & nhấn **Thanh toán** an toàn qua cổng **PayOS (Quét mã VietQR)**.\n" +
                            "5️⃣ **Bước 5:** Vé điện tử PDF kèm QR code sẽ tự động gửi về Email của bạn ngay lập tức!\n\n" +
                            "Bạn muốn tôi gợi ý phim chiếu hôm nay để bắt đầu không?",
                    SuggestedActions = new List<string> { "Xem suất chiếu hôm nay", "Phim đang chiếu hot", "Bảng giá vé" }
                };
            }

            // -------------------------------------------------------------
            // H. PHẢN HỒI MẶC ĐỊNH (Cung cấp các phim hot hiện tại)
            // -------------------------------------------------------------
            var topMovies = activeMovies.Take(3).ToList();
            var fallbackResponse = new AiChatResponse();
            foreach (var m in topMovies)
            {
                fallbackResponse.Movies.Add(MapToMovieCard(m));
            }

            var fallbackSb = new StringBuilder();
            fallbackSb.AppendLine($"Tôi đã ghi nhận câu hỏi của bạn! Bạn có thể hỏi tôi về **tên phim cụ thể**, **suất chiếu hôm nay**, **giá vé**, hoặc **combo bắp nước**.\n");
            fallbackSb.AppendLine("🍿 **Gợi ý các phim nổi bật bạn không nên bỏ lỡ:**");
            foreach (var m in topMovies)
            {
                fallbackSb.AppendLine($"- 🎬 **{m.Movie_Name}** ({m.Genre})");
            }
            fallbackSb.AppendLine("\n👉 *Hãy thử bấm một trong các gợi ý dưới đây:*");

            fallbackResponse.Reply = fallbackSb.ToString();
            fallbackResponse.SuggestedActions = topMovies.Select(m => $"Suất chiếu {m.Movie_Name}").Take(3).ToList();
            fallbackResponse.SuggestedActions.Add("Bảng giá vé & Combo");

            return fallbackResponse;
        }

        private async Task<AiChatResponse> CallGeminiApiAsync(string userMessage, List<AiChatMessageDto> history, string apiKey)
        {
            var activeMovies = await _context.Movies
                .Where(m => m.Status != "Cancelled")
                .Take(10)
                .Select(m => new { m.Movie_ID, m.Movie_Name, m.Genre, m.Duration, m.Rating })
                .ToListAsync();

            string moviesContext = string.Join("; ", activeMovies.Select(m => $"{m.Movie_Name} ({m.Genre}, {m.Duration}p, {m.Rating})"));

            string systemPrompt = "Bạn là CinemaBot, trợ lý AI thân thiện, chuyên nghiệp của rạp chiếu phim STP Cinema (địa chỉ 45 Nguyễn Thị Minh Khai, Q1, TP.HCM). " +
                $"Các phim hiện đang chiếu gồm: {moviesContext}. Giá vé từ 75k-120k. Hãy trả lời ngắn gọn, nhiệt tình bằng tiếng Việt, dùng emoji sinh động và hướng dẫn người dùng đặt vé thuận tiện.";

            var contents = new List<object>();

            if (history != null && history.Any())
            {
                foreach (var h in history.TakeLast(6))
                {
                    contents.Add(new
                    {
                        role = h.Role == "assistant" ? "model" : "user",
                        parts = new[] { new { text = h.Content } }
                    });
                }
            }

            contents.Add(new
            {
                role = "user",
                parts = new[] { new { text = $"{systemPrompt}\n\nKhách hỏi: {userMessage}" } }
            });

            var payload = new { contents };
            string json = JsonSerializer.Serialize(payload);

            string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
            var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, httpContent);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning($"Gemini API HTTP {(int)response.StatusCode}");
                return null;
            }

            string respJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(respJson);
            var candidates = doc.RootElement.GetProperty("candidates");
            if (candidates.GetArrayLength() > 0)
            {
                var text = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();
                return new AiChatResponse
                {
                    Reply = text,
                    SuggestedActions = GetInitialSuggestions()
                };
            }

            return null;
        }

        private async Task EnrichResponseWithDatabaseEntities(string message, AiChatResponse response)
        {
            string normalized = RemoveDiacritics(message).ToLowerInvariant();
            var movies = await _context.Movies
                .Where(m => m.Status != "Cancelled")
                .ToListAsync();

            foreach (var m in movies)
            {
                string normName = RemoveDiacritics(m.Movie_Name).ToLowerInvariant();
                if (normalized.Contains(normName))
                {
                    response.Movies.Add(MapToMovieCard(m));
                    var showtimes = await _context.Showtimes
                        .Include(s => s.CinemaRoom)
                        .Where(s => s.Movie_ID == m.Movie_ID && s.Show_Date.Date >= DateTime.Today && (s.Status == "Active" || s.Status == "Scheduled"))
                        .Take(3)
                        .ToListAsync();

                    foreach (var st in showtimes)
                    {
                        response.Showtimes.Add(MapToShowtimeCard(st));
                    }
                    break;
                }
            }
        }

        private static AiMovieCardDto MapToMovieCard(Movie m)
        {
            return new AiMovieCardDto
            {
                Movie_ID = m.Movie_ID,
                Movie_Name = m.Movie_Name,
                Poster_URL = m.Poster_URL,
                Duration = m.Duration,
                Rating = m.Rating,
                Genre = m.Genre,
                Status = m.Status,
                Synopsis = m.Synopsis
            };
        }

        private static AiShowtimeCardDto MapToShowtimeCard(Showtime st)
        {
            TimeSpan endTime = st.Start_Time.Add(TimeSpan.FromMinutes(st.Movie?.Duration > 0 ? st.Movie.Duration : 120));
            return new AiShowtimeCardDto
            {
                Showtime_ID = st.Showtime_ID,
                Movie_ID = st.Movie_ID,
                Movie_Name = st.Movie?.Movie_Name ?? "Phim chiếu rạp",
                Poster_URL = st.Movie?.Poster_URL,
                Room_Name = st.CinemaRoom?.Room_Name ?? "Phòng chiếu",
                Room_Type = st.CinemaRoom?.Room_Type ?? "Standard",
                Show_Date = st.Show_Date.ToString("dd/MM/yyyy"),
                Start_Time = st.Start_Time.ToString(@"hh\:mm"),
                End_Time = endTime.ToString(@"hh\:mm"),
                Base_Price = st.Base_Price,
                Capacity_Available = st.Capacity_Available
            };
        }

        private static bool MatchesAny(string text, params string[] keywords)
        {
            foreach (var kw in keywords)
            {
                if (kw.Length <= 3)
                {
                    if (Regex.IsMatch(text, $@"\b{Regex.Escape(kw)}\b", RegexOptions.IgnoreCase)) return true;
                }
                else if (text.Contains(kw, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }

        private static string RemoveDiacritics(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            string normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (char c in normalized)
            {
                var uc = CharUnicodeInfo.GetUnicodeCategory(c);
                if (uc != UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(c);
                }
            }
            return sb.ToString().Normalize(NormalizationForm.FormC).Replace('đ', 'd').Replace('Đ', 'D');
        }
    }
}
