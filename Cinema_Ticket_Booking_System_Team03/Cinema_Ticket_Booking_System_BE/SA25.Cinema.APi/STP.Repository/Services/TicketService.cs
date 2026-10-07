using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using STP.Repository.Data;
using STP.Repository.Models;
using STP.Repository.Services;
using Microsoft.Extensions.Logging;
using iTextSharp.text.pdf;
using iTextSharp.text;
using iTextSharp.text.pdf.draw;
using iTextSharp.text.pdf.qrcode;
using System.Net.NetworkInformation;
using ZXing;
using ZXing.QrCode;
using System.IO;
using System.Net.Http;

namespace STP.Repository.Services
{
    /// <summary>
    /// Service để xử lý các chức năng liên quan đến vé
    /// </summary>
    public class TicketService
    {
        private readonly CinemaDbContext _context;
        private readonly EmailService _emailService;
        private readonly SmsService _smsService;
        private readonly QRCodeGenerator _qrCodeGenerator;
        private readonly PdfGenerator _pdfGenerator;
        private readonly ILogger<TicketService> _logger;

        public TicketService(
            CinemaDbContext context,
            EmailService emailService,
            SmsService smsService,
            QRCodeGenerator qrCodeGenerator,
            PdfGenerator pdfGenerator,
            ILogger<TicketService> logger)
        {
            _context = context;
            _emailService = emailService;
            _smsService = smsService;
            _qrCodeGenerator = qrCodeGenerator;
            _pdfGenerator = pdfGenerator;
            _logger = logger;
        }

        /// <summary>
        /// Tạo vé cho đơn đặt vé đã được xác nhận
        /// </summary>
        /// <summary>
        /// Tạo vé cho đơn đặt vé đã được xác nhận
        /// </summary>
        public async Task<List<Ticket>> GenerateTicketsAsync(int bookingId)
        {
            try
            {
                _logger.LogInformation($"Bắt đầu tạo vé cho booking ID {bookingId}");

                var booking = await _context.TicketBookings
                    .Include(tb => tb.Showtime)
                    .FirstOrDefaultAsync(tb => tb.Booking_ID == bookingId && tb.Status == "Confirmed");

                if (booking == null)
                {
                    _logger.LogWarning($"Không tìm thấy booking ID {bookingId} với trạng thái Confirmed");
                    return null;
                }

                // Lấy danh sách ghế theo booking ID và showtime ID
                var seats = await _context.Seats
                    .Where(s => s.Booking_ID == bookingId && s.Showtime_ID == booking.Showtime_ID)
                    .ToListAsync();

                if (!seats.Any())
                {
                    _logger.LogWarning($"Không tìm thấy ghế nào cho booking ID {bookingId}");
                    return null;
                }

                _logger.LogInformation($"Tìm thấy {seats.Count} ghế cho booking ID {bookingId}");

                var tickets = new List<Ticket>();

                foreach (var seat in seats)
                {
                    // Kiểm tra xem vé đã được tạo cho ghế này chưa
                    var existingTicket = await _context.Tickets
                        .FirstOrDefaultAsync(t => t.Booking_ID == bookingId && t.Seat_ID == seat.Seat_ID);

                    if (existingTicket != null)
                    {
                        _logger.LogInformation($"Vé đã tồn tại cho ghế {seat.Seat_ID}, cập nhật trạng thái");

                        // Cập nhật trạng thái nếu vé đã tồn tại
                        if (existingTicket.Status != "Active")
                        {
                            existingTicket.Status = "Active";
                            _context.Tickets.Update(existingTicket);
                        }

                        tickets.Add(existingTicket);
                        continue;
                    }

                    // Tạo mã vé duy nhất
                    string ticketCode = GenerateUniqueTicketCode();

                    // Lấy thông tin về layout ghế
                    var seatLayout = await _context.SeatLayouts.FindAsync(seat.Layout_ID);

                    if (seatLayout == null)
                    {
                        _logger.LogWarning($"Không tìm thấy layout cho ghế {seat.Seat_ID}");
                        continue;
                    }

                    var cinemaRoom = await _context.CinemaRooms
                        .FirstOrDefaultAsync(cr => cr.Cinema_Room_ID == booking.Showtime.Cinema_Room_ID);

                    if (cinemaRoom == null)
                    {
                        _logger.LogWarning($"Không tìm thấy thông tin phòng chiếu cho showtime {booking.Showtime_ID}");
                        continue;
                    }

                    // Lấy giá vé dựa trên loại phòng và loại ghế
                    var ticketPricing = await _context.TicketPricings
                        .FirstOrDefaultAsync(tp =>
                            tp.Room_Type == cinemaRoom.Room_Type &&
                            tp.Seat_Type == seatLayout.Seat_Type &&
                            tp.Status == "Active");

                    decimal basePrice = ticketPricing?.Base_Price ?? booking.Showtime.Base_Price;
                    _logger.LogInformation($"Giá vé cho ghế {seat.Seat_ID}: {basePrice}");

                    // Tính giảm giá cho vé
                    decimal discountAmount = 0;
                    if (booking.Promotion_ID.HasValue)
                    {
                        var promotionUsage = await _context.PromotionUsages
                            .FirstOrDefaultAsync(pu => pu.Booking_ID == bookingId);

                        if (promotionUsage != null)
                        {
                            // Phân bổ số tiền giảm giá cho từng vé
                            decimal totalDiscount = promotionUsage.Discount_Amount;
                            int totalSeats = seats.Count;
                            discountAmount = totalDiscount / totalSeats;
                            _logger.LogInformation($"Giảm giá: {discountAmount} cho mỗi vé từ KM {booking.Promotion_ID}");
                        }
                    }

                    // Tính giá cuối cùng
                    decimal finalPrice = basePrice - discountAmount;
                    if (finalPrice < 0)
                        finalPrice = 0;

                    var ticket = new Ticket
                    {
                        Booking_ID = bookingId,
                        Seat_ID = seat.Seat_ID,
                        Base_Price = basePrice,
                        Discount_Amount = discountAmount,
                        Final_Price = finalPrice,
                        Ticket_Code = ticketCode,
                        Is_Checked_In = false,
                        Status = "Active"
                    };

                    tickets.Add(ticket);
                    _logger.LogInformation($"Đã tạo vé mã {ticketCode} cho ghế {seat.Seat_ID}");
                }

                if (tickets.Any())
                {
                    // Lọc ra chỉ những vé mới chưa có trong DB
                    var existingTicketSeats = await _context.Tickets
                        .Where(t => t.Booking_ID == bookingId)
                        .Select(t => t.Seat_ID)
                        .ToListAsync();

                    var newTickets = tickets.Where(t => !existingTicketSeats.Contains(t.Seat_ID)).ToList();

                    if (newTickets.Any())
                    {
                        await _context.Tickets.AddRangeAsync(newTickets);
                        _logger.LogInformation($"Thêm {newTickets.Count} vé mới vào database");
                    }

                    // Cập nhật trạng thái đặt vé
                    booking.Status = "Confirmed";

                    // Tạo lịch sử đặt vé
                    var bookingHistory = new BookingHistory
                    {
                        Booking_ID = bookingId,
                        Date = DateTime.Now,
                        Status = "Confirmed",
                        Notes = $"Thanh toán hoàn tất {tickets.Count} vé"
                    };

                    await _context.BookingHistories.AddAsync(bookingHistory);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Đã tạo thành công {tickets.Count} vé cho booking {bookingId}");
                }

                return tickets;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi tạo vé cho booking {bookingId}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Lấy thông tin vé dựa trên mã đặt vé
        /// </summary>
        public async Task<List<Ticket>> GetTicketsByBookingIdAsync(int bookingId)
        {
            // Kiểm tra trạng thái đơn đặt chỗ
            var booking = await _context.TicketBookings
                .FirstOrDefaultAsync(b => b.Booking_ID == bookingId);

            if (booking == null || booking.Status != "Confirmed")
                return new List<Ticket>(); // Trả về danh sách rỗng

            return await _context.Tickets
                .Include(t => t.Seat)
                    .ThenInclude(s => s.SeatLayout)
                .Include(t => t.TicketBooking)
                    .ThenInclude(tb => tb.Showtime)
                        .ThenInclude(s => s.Movie)
                .Include(t => t.TicketBooking)
                    .ThenInclude(tb => tb.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                .Where(t => t.Booking_ID == bookingId)
                .ToListAsync();
        }

        /// <summary>
        /// Lấy thông tin vé dựa trên mã vé
        /// </summary>
        public async Task<Ticket> GetTicketByCodeAsync(string ticketCode)
        {
            return await _context.Tickets
                .Include(t => t.Seat)
                    .ThenInclude(s => s.SeatLayout)
                .Include(t => t.TicketBooking)
                    .ThenInclude(tb => tb.Showtime)
                        .ThenInclude(s => s.Movie)
                .Include(t => t.TicketBooking)
                    .ThenInclude(tb => tb.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                .Include(t => t.TicketBooking)
                    .ThenInclude(tb => tb.User)
                .FirstOrDefaultAsync(t => t.Ticket_Code == ticketCode && t.Status != "Cancelled"); // Thêm điều kiện lọc
        }

        /// <summary>
        /// Kiểm tra vé vào khi khách hàng đến rạp
        /// </summary>
        public async Task<bool> CheckInTicketAsync(string ticketCode)
        {
            var ticket = await _context.Tickets
                .Include(t => t.TicketBooking)
                .FirstOrDefaultAsync(t => t.Ticket_Code == ticketCode);

            if (ticket == null || ticket.Is_Checked_In || ticket.Status == "Cancelled")
                return false;

            // Kiểm tra thời gian suất chiếu
            var showtime = await _context.Showtimes
                .Include(s => s.Movie)
                .FirstOrDefaultAsync(s => s.Showtime_ID == ticket.TicketBooking.Showtime_ID);

            if (showtime == null)
                return false;

            // Kiểm tra xem vé còn hợp lệ không (suất chiếu chưa kết thúc)
            DateTime showtimeDateTime = showtime.Show_Date.Add(showtime.Start_Time);
            if (DateTime.Now > showtimeDateTime.AddMinutes(showtime.Movie.Duration))
                return false;

            // Cập nhật trạng thái check-in
            ticket.Is_Checked_In = true;
            ticket.Check_In_Time = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Tạo vé điện tử PDF định dạng Cinema VIP Pass hiện đại
        /// </summary>
        public async Task<byte[]> GenerateModernTicketPdfAsync(int ticketId)
        {
            try
            {
                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                _logger.LogInformation($"Generating Modern VIP PDF ticket for ticket ID: {ticketId}");

                var ticket = await _context.Tickets
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.User)
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.Movie)
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.CinemaRoom)
                    .Include(t => t.Seat)
                        .ThenInclude(s => s.SeatLayout)
                    .FirstOrDefaultAsync(t => t.Ticket_ID == ticketId);

                if (ticket == null)
                {
                    _logger.LogWarning($"Ticket with ID {ticketId} not found");
                    return null;
                }

                // Chuẩn bị thông tin vé
                string ticketCode = ticket.Ticket_Code ?? $"TKT{ticket.Ticket_ID:D6}";
                string movieName = ticket.TicketBooking?.Showtime?.Movie?.Movie_Name ?? "Phim Chiếu Rạp";
                string posterUrl = ticket.TicketBooking?.Showtime?.Movie?.Poster_URL;
                int duration = ticket.TicketBooking?.Showtime?.Movie?.Duration ?? 120;
                string rating = ticket.TicketBooking?.Showtime?.Movie?.Rating ?? "P";
                string language = ticket.TicketBooking?.Showtime?.Movie?.Language ?? "Phụ đề";
                string roomName = ticket.TicketBooking?.Showtime?.CinemaRoom?.Room_Name ?? "Phòng 1";
                string roomType = ticket.TicketBooking?.Showtime?.CinemaRoom?.Room_Type ?? "Standard";
                DateTime showDate = ticket.TicketBooking?.Showtime?.Show_Date ?? DateTime.Today;
                TimeSpan startTime = ticket.TicketBooking?.Showtime?.Start_Time ?? TimeSpan.Zero;
                string seatLabel = (ticket.Seat?.SeatLayout != null)
                    ? $"{ticket.Seat.SeatLayout.Row_Label}{ticket.Seat.SeatLayout.Column_Number}"
                    : "A1";
                string seatType = ticket.Seat?.SeatLayout?.Seat_Type ?? "VIP";
                decimal price = ticket.Final_Price > 0 ? ticket.Final_Price : ticket.Base_Price;
                string customerName = ticket.TicketBooking?.User?.Full_Name ?? "Khách Hàng";
                int bookingId = ticket.TicketBooking?.Booking_ID ?? 0;

                using (MemoryStream ms = new MemoryStream())
                {
                    // Kích thước vé: Boarding Pass chuẩn ngang (760 x 330)
                    float width = 760f;
                    float height = 330f;
                    iTextSharp.text.Rectangle pageSize = new iTextSharp.text.Rectangle(width, height);
                    Document doc = new Document(pageSize, 0, 0, 0, 0);
                    PdfWriter writer = PdfWriter.GetInstance(doc, ms);
                    doc.Open();

                    PdfContentByte cb = writer.DirectContent;

                    // Tải font Arial hỗ trợ đầy đủ tiếng Việt Unicode có dấu
                    string fontPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), "arial.ttf");
                    string boldFontPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), "arialbd.ttf");
                    if (!File.Exists(fontPath)) fontPath = "c:/windows/fonts/arial.ttf";
                    if (!File.Exists(boldFontPath)) boldFontPath = fontPath;

                    BaseFont bfRegular = BaseFont.CreateFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                    BaseFont bfBold = BaseFont.CreateFont(boldFontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

                    // --- 1. Background (Khung nền ngoài canvas: #0B0F19) ---
                    cb.SaveState();
                    cb.SetColorFill(new BaseColor(11, 15, 25)); // #0B0F19
                    cb.Rectangle(0, 0, width, height);
                    cb.Fill();
                    cb.RestoreState();

                    // --- 2. Khung thẻ vé chính (x=15, y=15, w=730, h=300, radius=12) ---
                    float cardX = 15f;
                    float cardY = 15f;
                    float cardW = 730f;
                    float cardH = 300f;
                    float stubX = 520f; // Vị trí đường đứt khúc xé cuống vé

                    cb.SaveState();
                    // Nền thẻ: #151D30 (Deep Slate Blue)
                    cb.SetColorFill(new BaseColor(21, 29, 48));
                    cb.SetColorStroke(new BaseColor(40, 53, 84));
                    cb.SetLineWidth(1.5f);
                    cb.RoundRectangle(cardX, cardY, cardW, cardH, 12f);
                    cb.FillStroke();
                    cb.RestoreState();

                    // --- 3. Đường răng cưa rãnh xé cuống vé tại stubX ---
                    cb.SaveState();
                    // Đường nét đứt dọc
                    cb.SetColorStroke(new BaseColor(62, 79, 116));
                    cb.SetLineWidth(1.2f);
                    cb.SetLineDash(4f, 4f, 0f);
                    cb.MoveTo(stubX, cardY + 18f);
                    cb.LineTo(stubX, cardY + cardH - 18f);
                    cb.Stroke();

                    // Vết khuyết trên (semicircle)
                    cb.SetColorFill(new BaseColor(11, 15, 25));
                    cb.SetColorStroke(new BaseColor(40, 53, 84));
                    cb.SetLineWidth(1.5f);
                    cb.Circle(stubX, cardY + cardH, 12f);
                    cb.FillStroke();

                    // Vết khuyết dưới (semicircle)
                    cb.Circle(stubX, cardY, 12f);
                    cb.FillStroke();
                    cb.RestoreState();

                    // --- 4. PHẦN TRÁI: Header Branding ---
                    // Pill Đỏ Logo: "CINEMAPLUS"
                    float pillX = cardX + 20f;
                    float pillY = cardY + cardH - 38f;
                    cb.SaveState();
                    cb.SetColorFill(new BaseColor(220, 38, 38)); // #DC2626
                    cb.RoundRectangle(pillX, pillY, 105f, 22f, 6f);
                    cb.Fill();
                    cb.RestoreState();

                    cb.BeginText();
                    cb.SetFontAndSize(bfBold, 11f);
                    cb.SetColorFill(BaseColor.WHITE);
                    cb.SetTextMatrix(pillX + 10f, pillY + 6f);
                    cb.ShowText("CINEMAPLUS");

                    // Subtitle E-Ticket
                    cb.SetFontAndSize(bfBold, 9f);
                    cb.SetColorFill(new BaseColor(148, 163, 184)); // #94A3B8
                    cb.SetTextMatrix(pillX + 115f, pillY + 6f);
                    cb.ShowText("•  VÉ XEM PHIM ĐIỆN TỬ  (E-TICKET)");

                    // Mã đơn hàng ở góc phải phần thân chính
                    cb.SetFontAndSize(bfBold, 9f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    string bookingStr = $"ĐƠN HÀNG: #{bookingId}";
                    cb.SetTextMatrix(stubX - 25f - bfBold.GetWidthPoint(bookingStr, 9f), pillY + 6f);
                    cb.ShowText(bookingStr);
                    cb.EndText();

                    // Đường kẻ phân cách Header
                    cb.SaveState();
                    cb.SetColorStroke(new BaseColor(35, 47, 75));
                    cb.SetLineWidth(1f);
                    cb.MoveTo(cardX + 20f, pillY - 8f);
                    cb.LineTo(stubX - 20f, pillY - 8f);
                    cb.Stroke();
                    cb.RestoreState();

                    // --- 5. POSTER PHIM (Trái: x = 35, y = 80, w = 110, h = 160) ---
                    float posterX = cardX + 20f;
                    float posterY = cardY + 70f;
                    float posterW = 110f;
                    float posterH = 160f;

                    bool posterDrawn = false;
                    if (!string.IsNullOrEmpty(posterUrl))
                    {
                        try
                        {
                            using (var handler = new HttpClientHandler { ServerCertificateCustomValidationCallback = (m, c, ch, e) => true })
                            using (var httpClient = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(3) })
                            {
                                httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
                                byte[] imgData = await httpClient.GetByteArrayAsync(posterUrl);
                                if (imgData != null && imgData.Length > 0)
                                {
                                    iTextSharp.text.Image posterImg = iTextSharp.text.Image.GetInstance(imgData);
                                    posterImg.ScaleAbsolute(posterW, posterH);
                                    posterImg.SetAbsolutePosition(posterX, posterY);
                                    cb.AddImage(posterImg);
                                    posterDrawn = true;
                                }
                            }
                        }
                        catch (Exception exPoster)
                        {
                            _logger.LogWarning($"Could not load poster image from {posterUrl}: {exPoster.Message}");
                        }
                    }

                    if (!posterDrawn)
                    {
                        // Khung dự phòng khi không tải được ảnh
                        cb.SaveState();
                        cb.SetColorFill(new BaseColor(30, 41, 65));
                        cb.SetColorStroke(new BaseColor(51, 65, 95));
                        cb.SetLineWidth(1f);
                        cb.RoundRectangle(posterX, posterY, posterW, posterH, 6f);
                        cb.FillStroke();
                        cb.RestoreState();

                        cb.BeginText();
                        cb.SetFontAndSize(bfBold, 16f);
                        cb.SetColorFill(new BaseColor(148, 163, 184));
                        cb.SetTextMatrix(posterX + 15f, posterY + 80f);
                        cb.ShowText("CINEMA+");
                        cb.EndText();
                    }

                    // Viền khung poster
                    cb.SaveState();
                    cb.SetColorStroke(new BaseColor(60, 75, 105));
                    cb.SetLineWidth(1f);
                    cb.Rectangle(posterX, posterY, posterW, posterH);
                    cb.Stroke();
                    cb.RestoreState();

                    // --- 6. TÊN PHIM & METADATA (Bên phải poster, x = 175) ---
                    float infoX = posterX + posterW + 18f;

                    // Tên phim (Tự động co kích cỡ font theo độ dài)
                    cb.BeginText();
                    float titleFontSize = 17f;
                    if (movieName.Length > 20) titleFontSize = 14f;
                    if (movieName.Length > 28) titleFontSize = 12f;
                    if (movieName.Length > 36) titleFontSize = 11f;
                    cb.SetFontAndSize(bfBold, titleFontSize);
                    cb.SetColorFill(BaseColor.WHITE);
                    cb.SetTextMatrix(infoX, cardY + cardH - 72f);
                    cb.ShowText(movieName.ToUpper());

                    // Metadata Chips
                    float badgeY = cardY + cardH - 96f;
                    cb.EndText();

                    // Chip 1: Độ tuổi (Vàng cam #F59E0B)
                    string ratingText = string.IsNullOrEmpty(rating) ? "P" : rating;
                    float rWidth = bfBold.GetWidthPoint(ratingText, 8.5f) + 12f;
                    cb.SaveState();
                    cb.SetColorFill(new BaseColor(245, 158, 11, 40));
                    cb.SetColorStroke(new BaseColor(245, 158, 11));
                    cb.SetLineWidth(1f);
                    cb.RoundRectangle(infoX, badgeY, rWidth, 16f, 4f);
                    cb.FillStroke();
                    cb.RestoreState();

                    cb.BeginText();
                    cb.SetFontAndSize(bfBold, 8.5f);
                    cb.SetColorFill(new BaseColor(245, 158, 11));
                    cb.SetTextMatrix(infoX + 6f, badgeY + 4f);
                    cb.ShowText(ratingText);

                    // Chip 2: Định dạng / Ngôn ngữ (Xanh dương)
                    float fX = infoX + rWidth + 8f;
                    string fmtText = $"2D • {language ?? "Lồng tiếng"}";
                    float fWidth = bfBold.GetWidthPoint(fmtText, 8.5f) + 12f;
                    cb.EndText();

                    cb.SaveState();
                    cb.SetColorFill(new BaseColor(30, 58, 138, 40));
                    cb.SetColorStroke(new BaseColor(59, 130, 246));
                    cb.SetLineWidth(1f);
                    cb.RoundRectangle(fX, badgeY, fWidth, 16f, 4f);
                    cb.FillStroke();
                    cb.RestoreState();

                    cb.BeginText();
                    cb.SetFontAndSize(bfBold, 8.5f);
                    cb.SetColorFill(new BaseColor(96, 165, 250));
                    cb.SetTextMatrix(fX + 6f, badgeY + 4f);
                    cb.ShowText(fmtText);

                    // Chip 3: Thời lượng phim
                    float dX = fX + fWidth + 8f;
                    string durText = $"{duration} phút";
                    cb.SetFontAndSize(bfRegular, 8.5f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    cb.SetTextMatrix(dX, badgeY + 4f);
                    cb.ShowText($"⏱ {durText}");
                    cb.EndText();

                    // --- 7. 4 KHỐI THÔNG TIN SUẤT CHIẾU (2 dòng x 2 cột) ---
                    float gridY = cardY + 80f;
                    float col1X = infoX;
                    float col2X = infoX + 175f;

                    // DÒNG 1: NGÀY CHIẾU & GIỜ CHIẾU
                    cb.BeginText();
                    cb.SetFontAndSize(bfRegular, 8f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    cb.SetTextMatrix(col1X, gridY + 85f);
                    cb.ShowText("NGÀY CHIẾU / DATE");

                    cb.SetFontAndSize(bfBold, 11.5f);
                    cb.SetColorFill(BaseColor.WHITE);
                    cb.SetTextMatrix(col1X, gridY + 68f);
                    cb.ShowText(showDate.ToString("dd/MM/yyyy"));

                    cb.SetFontAndSize(bfRegular, 8f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    cb.SetTextMatrix(col2X, gridY + 85f);
                    cb.ShowText("GIỜ CHIẾU / TIME");

                    TimeSpan endTime = startTime.Add(TimeSpan.FromMinutes(duration > 0 ? duration : 120));
                    string timeStr = $"{startTime:hh\\:mm} ~ {endTime:hh\\:mm}";
                    cb.SetFontAndSize(bfBold, 11.5f);
                    cb.SetColorFill(new BaseColor(248, 113, 113));
                    cb.SetTextMatrix(col2X, gridY + 68f);
                    cb.ShowText(timeStr);

                    // DÒNG 2: PHÒNG CHIẾU & GHẾ NGỒI
                    cb.SetFontAndSize(bfRegular, 8f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    cb.SetTextMatrix(col1X, gridY + 40f);
                    cb.ShowText("PHÒNG CHIẾU / AUDITORIUM");

                    cb.SetFontAndSize(bfBold, 11.5f);
                    cb.SetColorFill(BaseColor.WHITE);
                    cb.SetTextMatrix(col1X, gridY + 23f);
                    cb.ShowText($"{roomName} ({roomType})");

                    cb.SetFontAndSize(bfRegular, 8f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    cb.SetTextMatrix(col2X, gridY + 40f);
                    cb.ShowText("GHẾ NGỒI / SEAT");
                    cb.EndText();

                    // Pill đỏ nổi bật số ghế
                    float seatBoxW = 75f;
                    float seatBoxH = 26f;
                    cb.SaveState();
                    cb.SetColorFill(new BaseColor(220, 38, 38));
                    cb.RoundRectangle(col2X, gridY + 14f, seatBoxW, seatBoxH, 6f);
                    cb.Fill();
                    cb.RestoreState();

                    cb.BeginText();
                    cb.SetFontAndSize(bfBold, 13f);
                    cb.SetColorFill(BaseColor.WHITE);
                    float seatTextW = bfBold.GetWidthPoint(seatLabel, 13f);
                    cb.SetTextMatrix(col2X + (seatBoxW - seatTextW) / 2f, gridY + 21f);
                    cb.ShowText(seatLabel);

                    cb.SetFontAndSize(bfRegular, 8.5f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    cb.SetTextMatrix(col2X + seatBoxW + 8f, gridY + 21f);
                    cb.ShowText($"({seatType})");
                    cb.EndText();

                    // --- 8. FOOTER: Khách hàng, Giá vé, Địa chỉ rạp ---
                    cb.SaveState();
                    cb.SetColorStroke(new BaseColor(35, 47, 75));
                    cb.SetLineWidth(1f);
                    cb.MoveTo(cardX + 20f, cardY + 54f);
                    cb.LineTo(stubX - 20f, cardY + 54f);
                    cb.Stroke();
                    cb.RestoreState();

                    cb.BeginText();
                    // Khách hàng
                    cb.SetFontAndSize(bfRegular, 7.5f);
                    cb.SetColorFill(new BaseColor(100, 116, 139));
                    cb.SetTextMatrix(cardX + 20f, cardY + 38f);
                    cb.ShowText("KHÁCH HÀNG / GUEST");

                    cb.SetFontAndSize(bfBold, 9.5f);
                    cb.SetColorFill(new BaseColor(226, 232, 240));
                    cb.SetTextMatrix(cardX + 20f, cardY + 25f);
                    cb.ShowText(string.IsNullOrEmpty(customerName) ? "Khách Hàng" : customerName);

                    // Giá vé
                    cb.SetFontAndSize(bfRegular, 7.5f);
                    cb.SetColorFill(new BaseColor(100, 116, 139));
                    cb.SetTextMatrix(cardX + 160f, cardY + 38f);
                    cb.ShowText("GIÁ VÉ / PRICE");

                    cb.SetFontAndSize(bfBold, 10f);
                    cb.SetColorFill(new BaseColor(251, 191, 36));
                    cb.SetTextMatrix(cardX + 160f, cardY + 25f);
                    cb.ShowText($"{price:N0} VNĐ");

                    // Địa chỉ rạp
                    cb.SetFontAndSize(bfRegular, 7.5f);
                    cb.SetColorFill(new BaseColor(100, 116, 139));
                    cb.SetTextMatrix(cardX + 270f, cardY + 38f);
                    cb.ShowText("ĐỊA ĐIỂM RẠP / VENUE");

                    cb.SetFontAndSize(bfBold, 8.5f);
                    cb.SetColorFill(new BaseColor(203, 213, 225));
                    cb.SetTextMatrix(cardX + 270f, cardY + 26f);
                    cb.ShowText("STP Cinema Center");

                    cb.SetFontAndSize(bfRegular, 7.5f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    cb.SetTextMatrix(cardX + 270f, cardY + 15f);
                    cb.ShowText("Tầng 3, 45 Nguyễn Thị Minh Khai, Q.1, TP.HCM");
                    cb.EndText();

                    // =========================================================================
                    // --- 9. PHẦN PHẢI: CUỐNG VÉ & QR CODE CHECK-IN (x = 520 to 745) ---
                    // =========================================================================
                    float rightCenterX = (stubX + cardX + cardW) / 2f; // ~ 632.5

                    // Tiêu đề cuống vé
                    cb.BeginText();
                    cb.SetFontAndSize(bfBold, 11f);
                    cb.SetColorFill(BaseColor.WHITE);
                    string stubTitle = "CỔNG SOÁT VÉ";
                    float stWidth = bfBold.GetWidthPoint(stubTitle, 11f);
                    cb.SetTextMatrix(rightCenterX - stWidth / 2f, cardY + cardH - 35f);
                    cb.ShowText(stubTitle);

                    cb.SetFontAndSize(bfRegular, 8f);
                    cb.SetColorFill(new BaseColor(148, 163, 184));
                    string stubSub = "CHECK-IN GATE PASS";
                    float ssWidth = bfRegular.GetWidthPoint(stubSub, 8f);
                    cb.SetTextMatrix(rightCenterX - ssWidth / 2f, cardY + cardH - 48f);
                    cb.ShowText(stubSub);
                    cb.EndText();

                    // Container thẻ trắng chứa QR Code để máy quét đọc dễ dàng
                    float qrCardW = 148f;
                    float qrCardH = 148f;
                    float qrCardX = rightCenterX - qrCardW / 2f;
                    float qrCardY = cardY + 98f;

                    cb.SaveState();
                    cb.SetColorFill(BaseColor.WHITE);
                    cb.RoundRectangle(qrCardX, qrCardY, qrCardW, qrCardH, 8f);
                    cb.Fill();
                    cb.RestoreState();

                    // Sinh và gắn QR Code (kích thước 132 x 132 bên trong thẻ trắng)
                    byte[] qrBytes = GenerateQRCode(ticketCode);
                    if (qrBytes != null && qrBytes.Length > 0)
                    {
                        iTextSharp.text.Image qrImage = iTextSharp.text.Image.GetInstance(qrBytes);
                        qrImage.ScaleAbsolute(132f, 132f);
                        qrImage.SetAbsolutePosition(qrCardX + 8f, qrCardY + 8f);
                        cb.AddImage(qrImage);
                    }

                    // TICKET CODE (Chữ vàng nổi bật dưới QR)
                    cb.BeginText();
                    cb.SetFontAndSize(bfBold, 12f);
                    cb.SetColorFill(new BaseColor(245, 158, 11)); // Amber/Gold #F59E0B
                    string codeText = $"MÃ VÉ: {ticketCode}";
                    float codeW = bfBold.GetWidthPoint(codeText, 12f);
                    cb.SetTextMatrix(rightCenterX - codeW / 2f, qrCardY - 18f);
                    cb.ShowText(codeText);

                    // Tóm tắt nhanh số ghế & phòng
                    cb.SetFontAndSize(bfBold, 9f);
                    cb.SetColorFill(new BaseColor(226, 232, 240));
                    string seatQuick = $"GHẾ: {seatLabel}  •  {roomName}";
                    float sqW = bfBold.GetWidthPoint(seatQuick, 9f);
                    cb.SetTextMatrix(rightCenterX - sqW / 2f, qrCardY - 33f);
                    cb.ShowText(seatQuick);

                    // Hướng dẫn & Lưu ý
                    cb.SetFontAndSize(bfRegular, 7f);
                    cb.SetColorFill(new BaseColor(100, 116, 139));
                    string note1 = "Quét mã QR tại cổng soát vé.";
                    string note2 = "Vé đã mua không hỗ trợ hoàn tiền.";
                    float n1W = bfRegular.GetWidthPoint(note1, 7f);
                    float n2W = bfRegular.GetWidthPoint(note2, 7f);
                    cb.SetTextMatrix(rightCenterX - n1W / 2f, cardY + 28f);
                    cb.ShowText(note1);
                    cb.SetTextMatrix(rightCenterX - n2W / 2f, cardY + 18f);
                    cb.ShowText(note2);
                    cb.EndText();

                    doc.Close();
                    byte[] resultBytes = ms.ToArray();
                    _logger.LogInformation($"Modern VIP PDF ticket generated successfully for ticket {ticketId}, size: {resultBytes.Length} bytes");
                    return resultBytes;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating modern ticket PDF for ticket {ticketId}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Tạo PDF vé xem phim hiện đại từ template VIP Boarding Pass
        /// </summary>
        public async Task<byte[]> GenerateTicketFromTemplateAsync(int ticketId)
        {
            return await GenerateModernTicketPdfAsync(ticketId);
        }


        /// <summary>
        /// Phương thức giúp điều chỉnh vị trí điểm bắt đầu vẽ text dựa vào độ dài chuỗi và chiều rộng tối đa
        /// </summary>
        private float AdjustXPositionForCentering(string text, float defaultX, float maxWidth, float fontSize)
        {
            float approximateTextWidth = text.Length * fontSize * 0.6f; // Ước tính theo kinh nghiệm
            if (approximateTextWidth < maxWidth)
            {
                return defaultX + (maxWidth - approximateTextWidth) / 2;
            }
            return defaultX;
        }

        /// <summary>
        /// Tạo QR code từ chuỗi dữ liệu
        /// </summary>
        private byte[] GenerateQRCode(string data)
        {
            try
            {
                // Sử dụng ZXing.Net để tạo QR code
                var qrCodeWriter = new ZXing.BarcodeWriterPixelData
                {
                    Format = ZXing.BarcodeFormat.QR_CODE,
                    Options = new ZXing.QrCode.QrCodeEncodingOptions
                    {
                        Height = 300,
                        Width = 300,
                        Margin = 1,
                        ErrorCorrection = ZXing.QrCode.Internal.ErrorCorrectionLevel.H
                    }
                };

                var pixelData = qrCodeWriter.Write(data);

                // Chuyển pixel data thành bitmap
                using (var bitmap = new System.Drawing.Bitmap(pixelData.Width, pixelData.Height, System.Drawing.Imaging.PixelFormat.Format32bppRgb))
                {
                    using (var ms = new MemoryStream())
                    {
                        // Sao chép dữ liệu từ pixel data sang bitmap
                        var bitmapData = bitmap.LockBits(new System.Drawing.Rectangle(0, 0, pixelData.Width, pixelData.Height),
                            System.Drawing.Imaging.ImageLockMode.WriteOnly, System.Drawing.Imaging.PixelFormat.Format32bppRgb);
                        try
                        {
                            // Sao chép dữ liệu từ pixel data sang bitmap
                            System.Runtime.InteropServices.Marshal.Copy(pixelData.Pixels, 0, bitmapData.Scan0, pixelData.Pixels.Length);
                        }
                        finally
                        {
                            bitmap.UnlockBits(bitmapData);
                        }

                        // Lưu bitmap thành file PNG
                        bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                        return ms.ToArray();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating QR code: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Phiên bản mở rộng cho SendTicketByEmailAsync để hỗ trợ template
        /// </summary>
        public async Task<bool> SendTicketFromTemplateByEmailAsync(int bookingId, string email = null)
        {
            try
            {
                _logger.LogInformation($"Preparing to send ticket from template by email for booking {bookingId}");

                var booking = await _context.TicketBookings
                    .Include(tb => tb.User)
                    .Include(tb => tb.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(tb => tb.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(tb => tb.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogWarning($"Booking {bookingId} not found when trying to send ticket email");
                    return false;
                }

                // Sử dụng email được cung cấp hoặc email của người dùng
                string recipientEmail = email ?? booking.User?.Email;
                if (string.IsNullOrEmpty(recipientEmail))
                {
                    _logger.LogWarning($"No recipient email found for booking {bookingId}");
                    return false;
                }

                // Lấy danh sách vé (chỉ vé không bị hủy)
                var tickets = await _context.Tickets
                    .Include(t => t.Seat)
                        .ThenInclude(s => s.SeatLayout)
                    .Where(t => t.Booking_ID == bookingId && t.Status != "Cancelled")
                    .ToListAsync();

                if (!tickets.Any())
                {
                    _logger.LogWarning($"No active tickets found for booking {bookingId}");
                    return false;
                }

                // Chuẩn bị thông tin để gửi email
                Dictionary<string, string> bookingInfo = new Dictionary<string, string>()
                    {
                        { "BookingId", booking.Booking_ID.ToString() },
                        { "MovieName", booking.Showtime?.Movie?.Movie_Name ?? "Phim" },
                        { "CinemaRoom", booking.Showtime?.CinemaRoom?.Room_Name ?? "Phòng chiếu" },
                        { "ShowDate", booking.Showtime?.Show_Date.ToString("dd/MM/yyyy") ?? DateTime.Now.ToString("dd/MM/yyyy") },
                        { "ShowTime", booking.Showtime != null ? (DateTime.Today + booking.Showtime.Start_Time).ToString("HH:mm") : "00:00" },
                        { "Seats", string.Join(", ", tickets.Select(t => $"{t.Seat?.SeatLayout?.Row_Label}{t.Seat?.SeatLayout?.Column_Number}")) }
                    };

                // Tạo các file PDF cho vé sử dụng template
                List<(string ticketCode, byte[] pdfContent)> pdfTickets = new List<(string, byte[])>();

                foreach (var ticket in tickets)
                {
                    try
                    {
                        _logger.LogInformation($"Generating PDF from template for ticket {ticket.Ticket_ID} (Code: {ticket.Ticket_Code})");
                        byte[] pdfContent = await GenerateTicketFromTemplateAsync(ticket.Ticket_ID);

                        if (pdfContent != null && pdfContent.Length > 0)
                        {
                            pdfTickets.Add((ticket.Ticket_Code, pdfContent));
                            _logger.LogInformation($"PDF generated successfully for ticket {ticket.Ticket_Code}, size: {pdfContent.Length} bytes");
                        }
                        else
                        {
                            _logger.LogWarning($"Generated PDF for ticket {ticket.Ticket_Code} is empty or null");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error generating PDF for ticket {ticket.Ticket_Code}: {ex.Message}");
                        // Tiếp tục với vé tiếp theo
                    }
                }

                if (pdfTickets.Count == 0)
                {
                    _logger.LogWarning($"No PDF tickets were successfully generated for booking {bookingId}");
                    // Vẫn gửi email nhưng không có đính kèm
                }

                // Gửi email với vé đính kèm
                bool emailSent = await _emailService.SendTicketsEmailAsync(
                    recipientEmail,
                    booking.User?.Full_Name ?? "Quý khách",
                    bookingInfo,
                    pdfTickets);

                if (emailSent)
                {
                    _logger.LogInformation($"Email with tickets sent successfully to {recipientEmail} for booking {bookingId}");
                }
                else
                {
                    _logger.LogWarning($"Failed to send email with tickets to {recipientEmail} for booking {bookingId}");
                }

                return emailSent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending ticket by email for booking {bookingId}: {ex.Message}");
                return false;
            }
        }
        /// <summary>
        /// Tạo PDF vé xem phim hiện đại
        /// </summary>
        public async Task<byte[]> GenerateTicketPdfAsync(int ticketId)
        {
            return await GenerateModernTicketPdfAsync(ticketId);
        }



        /// <summary>
        /// Tạo PDF dự phòng khi có lỗi
        /// </summary>
        private byte[] GenerateFallbackPdf(Dictionary<string, string> ticketData)
        {
            try
            {
                using (MemoryStream ms = new MemoryStream())
                {
                    Document document = new Document(PageSize.A5.Rotate());
                    PdfWriter writer = PdfWriter.GetInstance(document, ms);
                    document.Open();

                    // Thêm tiêu đề
                    Font titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18);
                    Paragraph title = new Paragraph("STP CINEMA - VÉ XEM PHIM", titleFont);
                    title.Alignment = Element.ALIGN_CENTER;
                    title.SpacingAfter = 20;
                    document.Add(title);

                    // Thêm thông tin vé
                    foreach (var item in ticketData)
                    {
                        Font textFont = FontFactory.GetFont(FontFactory.HELVETICA, 12);
                        Paragraph paragraph = new Paragraph($"{item.Key}: {item.Value}", textFont);
                        paragraph.SpacingAfter = 5;
                        document.Add(paragraph);
                    }

                    document.Close();
                    writer.Close();
                    return ms.ToArray();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating fallback PDF");
                return null;
            }
        }

        /// <summary>
        /// Gửi vé qua email
        /// </summary>
        public async Task<bool> SendTicketByEmailAsync(int bookingId, string email = null)
        {
            try
            {
                _logger.LogInformation($"Preparing to send ticket by email for booking {bookingId}");

                var booking = await _context.TicketBookings
                    .Include(tb => tb.User)
                    .Include(tb => tb.Showtime)
                        .ThenInclude(s => s.Movie)
                    .Include(tb => tb.Showtime)
                        .ThenInclude(s => s.CinemaRoom)
                    .FirstOrDefaultAsync(tb => tb.Booking_ID == bookingId);

                if (booking == null)
                {
                    _logger.LogWarning($"Booking {bookingId} not found when trying to send ticket email");
                    return false;
                }

                // Sử dụng email được cung cấp hoặc email của người dùng
                string recipientEmail = email ?? booking.User?.Email;
                if (string.IsNullOrEmpty(recipientEmail))
                {
                    _logger.LogWarning($"No recipient email found for booking {bookingId}");
                    return false;
                }

                // Lấy danh sách vé (chỉ vé không bị hủy)
                var tickets = await _context.Tickets
                    .Include(t => t.Seat)
                        .ThenInclude(s => s.SeatLayout)
                    .Where(t => t.Booking_ID == bookingId && t.Status != "Cancelled")
                    .ToListAsync();

                if (!tickets.Any())
                {
                    _logger.LogWarning($"No active tickets found for booking {bookingId}");
                    return false;
                }

                // Chuẩn bị thông tin để gửi email
                Dictionary<string, string> bookingInfo = new Dictionary<string, string>()
            {
                { "BookingId", booking.Booking_ID.ToString() },
                { "MovieName", booking.Showtime.Movie.Movie_Name },
                { "CinemaRoom", booking.Showtime.CinemaRoom.Room_Name },
                { "ShowDate", booking.Showtime.Show_Date.ToString("dd/MM/yyyy") },
                { "ShowTime", (DateTime.Today + booking.Showtime.Start_Time).ToString("HH:mm") }, // Định dạng 24 giờ
                { "Seats", string.Join(", ", tickets.Select(t => $"{t.Seat.SeatLayout.Row_Label}{t.Seat.SeatLayout.Column_Number}")) }
            };

                // Tạo các file PDF cho vé
                List<(string ticketCode, byte[] pdfContent)> pdfTickets = new List<(string, byte[])>();

                foreach (var ticket in tickets)
                {
                    try
                    {
                        _logger.LogInformation($"Generating PDF for ticket {ticket.Ticket_ID} (Code: {ticket.Ticket_Code})");
                        byte[] pdfContent = await GenerateTicketPdfAsync(ticket.Ticket_ID);

                        if (pdfContent != null && pdfContent.Length > 0)
                        {
                            pdfTickets.Add((ticket.Ticket_Code, pdfContent));
                            _logger.LogInformation($"PDF generated successfully for ticket {ticket.Ticket_Code}, size: {pdfContent.Length} bytes");
                        }
                        else
                        {
                            _logger.LogWarning($"Generated PDF for ticket {ticket.Ticket_Code} is empty or null");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error generating PDF for ticket {ticket.Ticket_Code}: {ex.Message}");
                        // Tiếp tục với vé tiếp theo
                    }
                }

                if (pdfTickets.Count == 0)
                {
                    _logger.LogWarning($"No PDF tickets were successfully generated for booking {bookingId}");
                    // Vẫn gửi email nhưng không có đính kèm
                }

                // Gửi email với vé đính kèm
                bool emailSent = await _emailService.SendTicketsEmailAsync(
                    recipientEmail,
                    booking.User?.Full_Name ?? "Quý khách",
                    bookingInfo,
                    pdfTickets);

                if (emailSent)
                {
                    _logger.LogInformation($"Email with tickets sent successfully to {recipientEmail} for booking {bookingId}");
                }
                else
                {
                    _logger.LogWarning($"Failed to send email with tickets to {recipientEmail} for booking {bookingId}");
                }

                return emailSent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending ticket by email for booking {bookingId}: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Xử lý thay đổi trạng thái đơn đặt chỗ
        /// </summary>
        public async Task HandleBookingStatusChangeAsync(int bookingId, string newStatus)
        {
            _logger.LogInformation($"Xử lý thay đổi trạng thái đơn đặt chỗ {bookingId} thành {newStatus}");

            // Nếu trạng thái mới là "Confirmed", tạo vé
            if (newStatus == "Confirmed")
            {
                var tickets = await GenerateTicketsAsync(bookingId);
                if (tickets != null && tickets.Any())
                {
                    _logger.LogInformation($"Đã tạo {tickets.Count} vé cho đơn đặt chỗ {bookingId}");
                }
                else
                {
                    _logger.LogWarning($"Không thể tạo vé cho đơn đặt chỗ {bookingId}");
                }
            }
            // Nếu trạng thái thay đổi từ "Confirmed" sang trạng thái khác, xóa vé
            else
            {
                // Kiểm tra xem đơn có vé hay không trước khi xóa
                var existingTickets = await _context.Tickets
                    .Where(t => t.Booking_ID == bookingId)
                    .ToListAsync();

                if (existingTickets.Any())
                {
                    _context.Tickets.RemoveRange(existingTickets);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Đã xóa {existingTickets.Count} vé cho đơn đặt chỗ {bookingId} do trạng thái chuyển thành {newStatus}");
                }
            }
        }

        /// <summary>
        /// Dọn dẹp vé không hợp lệ - xóa tất cả vé liên kết với đơn đặt chỗ chưa xác nhận
        /// </summary>
        /// <returns>Số lượng vé đã xóa</returns>
        public async Task<int> CleanupExistingTicketsAsync()
        {
            // Lấy tất cả vé của đơn đặt chỗ chưa được xác nhận
            var ticketsToRemove = await _context.Tickets
                .Include(t => t.TicketBooking)
                .Where(t => t.TicketBooking.Status != "Confirmed")
                .ToListAsync();

            int removedCount = 0;

            if (ticketsToRemove.Any())
            {
                removedCount = ticketsToRemove.Count;
                _context.Tickets.RemoveRange(ticketsToRemove);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Đã xóa {removedCount} vé cho các đơn đặt chỗ chưa xác nhận");
            }

            return removedCount;
        }

        /// <summary>
        /// Cập nhật trạng thái vé cho các đơn đặt chỗ đã xác nhận
        /// </summary>
        /// <returns>Số lượng vé đã cập nhật</returns>
        public async Task<int> UpdateTicketStatusForConfirmedBookingsAsync()
        {
            try
            {
                _logger.LogInformation("Bắt đầu cập nhật trạng thái vé cho các đơn đặt chỗ đã xác nhận");

                // Lấy tất cả vé có trạng thái NULL hoặc rỗng nhưng thuộc đơn đặt chỗ đã xác nhận
                var ticketsToUpdate = await _context.Tickets
                    .Include(t => t.TicketBooking)
                    .Where(t => (t.Status == null || t.Status == string.Empty) &&
                           t.TicketBooking.Status == "Confirmed")
                    .ToListAsync();

                if (!ticketsToUpdate.Any())
                {
                    _logger.LogInformation("Không tìm thấy vé nào cần cập nhật");
                    return 0;
                }

                int updatedCount = ticketsToUpdate.Count;
                _logger.LogInformation($"Tìm thấy {updatedCount} vé cần cập nhật trạng thái");

                // Cập nhật trạng thái vé thành "Active"
                foreach (var ticket in ticketsToUpdate)
                {
                    ticket.Status = "Active";
                    _logger.LogInformation($"Cập nhật vé ID: {ticket.Ticket_ID}, Code: {ticket.Ticket_Code} thành Active");
                }

                // Lưu thay đổi vào database
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Đã cập nhật thành công {updatedCount} vé");

                return updatedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật trạng thái vé cho đơn đặt chỗ đã xác nhận");
                throw;
            }
        }

        /// <summary>
        /// Lấy tất cả vé của một user
        /// </summary>
        public async Task<List<Ticket>> GetUserTicketsAsync(int userId, string status = null)
        {
            try
            {
                _logger.LogInformation($"Lấy danh sách vé của user ID: {userId}");

                var query = _context.Tickets
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.User)
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.Movie)
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.CinemaRoom)
                    .Include(t => t.Seat)
                        .ThenInclude(s => s.SeatLayout)
                    .Where(t => t.TicketBooking.User_ID == userId);

                // Lọc theo trạng thái nếu có
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(t => t.Status == status);
                }

                // Sắp xếp theo thứ tự thời gian suất chiếu gần nhất
                return await query.OrderByDescending(t => t.TicketBooking.Showtime.Show_Date)
                                 .ThenByDescending(t => t.TicketBooking.Showtime.Start_Time)
                                 .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Lỗi khi lấy danh sách vé của user ID: {userId}");
                throw;
            }
        }

        /// <summary>
        /// Lấy tất cả vé trong hệ thống (dành cho admin)
        /// </summary>
        public async Task<(List<Ticket> Tickets, int TotalCount)> GetAllTicketsAsync(
            DateTime? fromDate = null,
            DateTime? toDate = null,
            string searchTerm = null,
            string status = null,
            int page = 1,
            int pageSize = 20)
        {
            try
            {
                _logger.LogInformation("Lấy tất cả vé trong hệ thống theo điều kiện lọc");

                var query = _context.Tickets
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.User)
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.Movie)
                    .Include(t => t.TicketBooking)
                        .ThenInclude(tb => tb.Showtime)
                            .ThenInclude(s => s.CinemaRoom)
                    .Include(t => t.Seat)
                        .ThenInclude(s => s.SeatLayout)
                    .AsQueryable();

                // Lọc theo ngày từ
                if (fromDate.HasValue)
                {
                    query = query.Where(t => t.TicketBooking.Showtime.Show_Date >= fromDate.Value.Date);
                }

                // Lọc theo ngày đến
                if (toDate.HasValue)
                {
                    query = query.Where(t => t.TicketBooking.Showtime.Show_Date <= toDate.Value.Date);
                }

                // Lọc theo từ khóa tìm kiếm (mã vé, tên phim, tên người dùng)
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    searchTerm = searchTerm.ToLower();
                    query = query.Where(t =>
                        t.Ticket_Code.ToLower().Contains(searchTerm) ||
                        t.TicketBooking.Showtime.Movie.Movie_Name.ToLower().Contains(searchTerm) ||
                        t.TicketBooking.User.Full_Name.ToLower().Contains(searchTerm) ||
                        t.TicketBooking.User.Email.ToLower().Contains(searchTerm));
                }

                // Lọc theo trạng thái vé
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(t => t.Status == status);
                }

                // Đếm tổng số lượng vé thỏa điều kiện
                int totalCount = await query.CountAsync();

                // Phân trang kết quả
                var tickets = await query
                    .OrderByDescending(t => t.TicketBooking.Showtime.Show_Date)
                    .ThenByDescending(t => t.TicketBooking.Showtime.Start_Time)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return (tickets, totalCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy tất cả vé trong hệ thống");
                throw;
            }
        }
        #region Helper Methods

        /// <summary>
        /// Tạo mã vé duy nhất
        /// </summary>
        private string GenerateUniqueTicketCode()
        {
            // Tạo mã vé duy nhất kết hợp giữa ngày hiện tại và một mã ngẫu nhiên
            return $"TK{DateTime.Now:yyMMdd}{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}";
        }

        #endregion
    }
}
