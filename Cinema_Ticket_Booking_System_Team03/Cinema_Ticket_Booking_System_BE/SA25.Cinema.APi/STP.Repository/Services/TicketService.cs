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
        public async Task<List<Ticket>> GenerateTicketsAsync(int bookingId)
        {
            var booking = await _context.TicketBookings
                .Include(tb => tb.Showtime)
                .Include(tb => tb.Seats)
                .FirstOrDefaultAsync(tb => tb.Booking_ID == bookingId && tb.Status == "Confirmed");

            if (booking == null)
                return null;

            var tickets = new List<Ticket>();

            foreach (var seat in booking.Seats)
            {
                // Kiểm tra xem vé đã được tạo cho ghế này chưa
                var existingTicket = await _context.Tickets
                    .FirstOrDefaultAsync(t => t.Booking_ID == bookingId && t.Seat_ID == seat.Seat_ID);

                if (existingTicket != null)
                    continue;

                // Tạo mã vé duy nhất
                string ticketCode = GenerateUniqueTicketCode();

                // Trả về giá tiền của ghế này dựa vào loại ghế
                var seatLayout = await _context.SeatLayouts.FindAsync(seat.Layout_ID);
                var cinemaRoom = await _context.CinemaRooms
                    .FirstOrDefaultAsync(cr => cr.Cinema_Room_ID == booking.Showtime.Cinema_Room_ID);

                // Lấy giá vé dựa trên loại phòng và loại ghế
                var ticketPricing = await _context.TicketPricings
                    .FirstOrDefaultAsync(tp =>
                        tp.Room_Type == cinemaRoom.Room_Type &&
                        tp.Seat_Type == seatLayout.Seat_Type &&
                        tp.Status == "Active");

                decimal basePrice = ticketPricing?.Base_Price ?? booking.Showtime.Base_Price;

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
                        int totalSeats = booking.Seats.Count;
                        discountAmount = totalDiscount / totalSeats;
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
                    Is_Checked_In = false
                };

                tickets.Add(ticket);
            }

            if (tickets.Any())
            {
                await _context.Tickets.AddRangeAsync(tickets);

                // Cập nhật trạng thái đặt vé
                booking.Status = "Completed";

                // Tạo lịch sử đặt vé
                var bookingHistory = new BookingHistory
                {
                    Booking_ID = bookingId,
                    Date = DateTime.Now,
                    Status = "Completed"
                };

                await _context.BookingHistories.AddAsync(bookingHistory);
                await _context.SaveChangesAsync();
            }

            return tickets;
        }

        /// <summary>
        /// Lấy thông tin vé dựa trên mã đặt vé
        /// </summary>
        public async Task<List<Ticket>> GetTicketsByBookingIdAsync(int bookingId)
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
                .FirstOrDefaultAsync(t => t.Ticket_Code == ticketCode);
        }

        /// <summary>
        /// Kiểm tra vé vào khi khách hàng đến rạp
        /// </summary>
        public async Task<bool> CheckInTicketAsync(string ticketCode)
        {
            var ticket = await _context.Tickets
                .Include(t => t.TicketBooking)
                .FirstOrDefaultAsync(t => t.Ticket_Code == ticketCode);

            if (ticket == null || ticket.Is_Checked_In)
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
        public async Task<byte[]> GenerateTicketPdfAsync(int ticketId)
        {
            try
            {
                _logger.LogInformation($"Generating PDF for ticket ID: {ticketId}");

                // Lấy thông tin vé từ database
                var ticket = await _context.Tickets
                    .Include(t => t.TicketBooking)
                    .Include(t => t.TicketBooking.Showtime)
                    .Include(t => t.TicketBooking.Showtime.Movie)
                    .Include(t => t.TicketBooking.Showtime.CinemaRoom)
                    .Include(t => t.TicketBooking.User)
                    .Include(t => t.Seat)
                    .Include(t => t.Seat.SeatLayout)
                    .FirstOrDefaultAsync(t => t.Ticket_ID == ticketId);

                if (ticket == null)
                {
                    _logger.LogWarning($"Ticket with ID {ticketId} not found");
                    return null;
                }

                // Tạo một document PDF mới
                MemoryStream ms = new MemoryStream();
                try
                {
                    // Thiết lập kích thước trang vé (dạng thẻ dọc)
                    Rectangle pageSize = new Rectangle(350, 600);
                    Document document = new Document(pageSize, 10, 10, 10, 10);
                    PdfWriter writer = PdfWriter.GetInstance(document, ms);
                    document.Open();

                    // Thiết lập font chữ hỗ trợ tiếng Việt
                    BaseFont baseFont = BaseFont.CreateFont("c:/windows/fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                    Font regularFont = new Font(baseFont, 9, Font.NORMAL, BaseColor.BLACK);
                    Font boldFont = new Font(baseFont, 9, Font.BOLD, BaseColor.BLACK);
                    Font headerFont = new Font(baseFont, 12, Font.BOLD, BaseColor.BLACK);
                    Font titleFont = new Font(baseFont, 14, Font.BOLD, BaseColor.BLACK);
                    Font smallFont = new Font(baseFont, 8, Font.NORMAL, BaseColor.BLACK);
                    Font movieTitleFont = new Font(baseFont, 16, Font.BOLD, BaseColor.BLACK);

                    PdfContentByte canvas = writer.DirectContent;

                    // Vẽ background màu hồng nhạt
                    canvas.SaveState();
                    canvas.SetColorFill(new BaseColor(255, 235, 238)); // Light pink
                    canvas.Rectangle(0, 0, pageSize.Width, pageSize.Height);
                    canvas.Fill();
                    canvas.RestoreState();

                    // Header - logo và tên rạp
                    PdfPTable headerTable = new PdfPTable(2);
                    headerTable.WidthPercentage = 100;
                    headerTable.SetWidths(new float[] { 1f, 3f });
                    headerTable.DefaultCell.Border = Rectangle.NO_BORDER;
                    headerTable.DefaultCell.BackgroundColor = new BaseColor(244, 143, 177); // Pink
                    headerTable.DefaultCell.Padding = 5;

                    // Logo rạp (placeholder)
                    PdfPCell logoCell = new PdfPCell();
                    logoCell.Border = Rectangle.NO_BORDER;
                    logoCell.BackgroundColor = new BaseColor(244, 143, 177);
                    logoCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    logoCell.VerticalAlignment = Element.ALIGN_MIDDLE;

                    try
                    {
                        // Vẽ logo đơn giản
                        PdfTemplate template = canvas.CreateTemplate(40, 40);
                        template.SetColorFill(BaseColor.WHITE);
                        template.Circle(20, 20, 15);
                        template.Fill();

                        template.SetColorStroke(BaseColor.WHITE);
                        template.SetLineWidth(2);
                        template.MoveTo(15, 15);
                        template.LineTo(25, 25);
                        template.LineTo(15, 25);
                        template.LineTo(25, 15);
                        template.Stroke();

                        iTextSharp.text.Image logoImage = iTextSharp.text.Image.GetInstance(template);
                        logoCell.AddElement(logoImage);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Could not create logo: {ex.Message}");
                        logoCell.AddElement(new Phrase("STP", new Font(baseFont, 20, Font.BOLD, BaseColor.WHITE)));
                    }

                    headerTable.AddCell(logoCell);

                    // Tên rạp
                    PdfPCell cinemaCell = new PdfPCell(new Phrase("STP Cinema", new Font(baseFont, 16, Font.BOLD, BaseColor.WHITE)));
                    cinemaCell.Border = Rectangle.NO_BORDER;
                    cinemaCell.BackgroundColor = new BaseColor(244, 143, 177);
                    cinemaCell.HorizontalAlignment = Element.ALIGN_LEFT;
                    cinemaCell.VerticalAlignment = Element.ALIGN_MIDDLE;
                    headerTable.AddCell(cinemaCell);

                    document.Add(headerTable);

                    // Địa chỉ rạp và ngày giờ
                    PdfPTable addressTable = new PdfPTable(1);
                    addressTable.WidthPercentage = 100;
                    addressTable.DefaultCell.Border = Rectangle.NO_BORDER;

                    PdfPCell addressCell = new PdfPCell(new Phrase("Tầng 3, TTTM STP Center\n45 Nguyễn Thị Minh Khai, Quận 1, TP HCM", smallFont));
                    addressCell.Border = Rectangle.NO_BORDER;
                    addressCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    addressCell.PaddingTop = 5;
                    addressTable.AddCell(addressCell);

                    PdfPCell dateCell = new PdfPCell(new Phrase($"{DateTime.Now:dd/MM/yyyy HH:mm}", boldFont));
                    dateCell.Border = Rectangle.NO_BORDER;
                    dateCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    dateCell.PaddingBottom = 5;
                    addressTable.AddCell(dateCell);

                    document.Add(addressTable);

                    // Thêm poster phim nếu có
                    try
                    {
                        if (!string.IsNullOrEmpty(ticket.TicketBooking.Showtime.Movie.Poster_URL))
                        {
                            // Tải ảnh từ URL
                            System.Net.WebClient webClient = new System.Net.WebClient();
                            byte[] imageBytes = webClient.DownloadData(ticket.TicketBooking.Showtime.Movie.Poster_URL);

                            if (imageBytes != null && imageBytes.Length > 0)
                            {
                                iTextSharp.text.Image posterImage = iTextSharp.text.Image.GetInstance(imageBytes);
                                posterImage.ScaleToFit(200, 150);
                                posterImage.Alignment = Element.ALIGN_CENTER;
                                document.Add(posterImage);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Could not add movie poster: {ex.Message}");
                        // Tiếp tục tạo PDF mà không có poster
                    }

                    // Thông tin phim
                    PdfPTable movieTable = new PdfPTable(1);
                    movieTable.WidthPercentage = 100;
                    movieTable.DefaultCell.Border = Rectangle.NO_BORDER;
                    movieTable.SpacingBefore = 10;

                    // Tên phim
                    PdfPCell movieTitleCell = new PdfPCell(new Phrase(ticket.TicketBooking.Showtime.Movie.Movie_Name, movieTitleFont));
                    movieTitleCell.Border = Rectangle.NO_BORDER;
                    movieTitleCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    movieTitleCell.PaddingBottom = 5;
                    movieTable.AddCell(movieTitleCell);

                    // Loại phim và ngôn ngữ
                    string language = ticket.TicketBooking.Showtime.Movie.Language ?? "Lồng tiếng";
                    PdfPCell movieTypeCell = new PdfPCell(new Phrase($"2D {language}", regularFont));
                    movieTypeCell.Border = Rectangle.NO_BORDER;
                    movieTypeCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    movieTable.AddCell(movieTypeCell);

                    document.Add(movieTable);

                    // Thời gian chiếu
                    PdfPTable timeTable = new PdfPTable(1);
                    timeTable.WidthPercentage = 100;
                    timeTable.DefaultCell.Border = Rectangle.NO_BORDER;
                    timeTable.SpacingBefore = 10;

                    DateTime showDate = ticket.TicketBooking.Showtime.Show_Date;
                    TimeSpan startTime = ticket.TicketBooking.Showtime.Start_Time;

                    // Sửa lỗi: Chuyển TimeSpan thành DateTime để định dạng
                    DateTime baseDate = DateTime.Today;
                    DateTime startDateTime = baseDate.Add(startTime);
                    DateTime endDateTime = baseDate.Add(startTime).AddMinutes(ticket.TicketBooking.Showtime.Movie.Duration);

                    string showTimeText = $"{startDateTime:HH:mm} - {endDateTime:HH:mm}";
                    PdfPCell timeCell = new PdfPCell(new Phrase(showTimeText, boldFont));
                    timeCell.Border = Rectangle.NO_BORDER;
                    timeCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    timeTable.AddCell(timeCell);

                    string dateText = $"{showDate:ddd, dd/MM/yyyy}";
                    PdfPCell dateTextCell = new PdfPCell(new Phrase(dateText, boldFont));
                    dateTextCell.Border = Rectangle.NO_BORDER;
                    dateTextCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    timeTable.AddCell(dateTextCell);

                    document.Add(timeTable);

                    // Đường kẻ
                    LineSeparator line = new LineSeparator(1, 100, BaseColor.BLACK, Element.ALIGN_CENTER, -5);
                    document.Add(new Paragraph(" "));
                    document.Add(line);

                    // Thông tin ghế và phòng
                    PdfPTable seatTable = new PdfPTable(3);
                    seatTable.WidthPercentage = 100;
                    seatTable.SetWidths(new float[] { 1f, 1f, 1f });
                    seatTable.DefaultCell.Border = Rectangle.NO_BORDER;
                    seatTable.SpacingBefore = 10;

                    // Phòng chiếu
                    PdfPCell roomLabelCell = new PdfPCell(new Phrase("Phòng chiếu", boldFont));
                    roomLabelCell.Border = Rectangle.NO_BORDER;
                    roomLabelCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    seatTable.AddCell(roomLabelCell);

                    // Số vé
                    PdfPCell ticketLabelCell = new PdfPCell(new Phrase("Số vé", boldFont));
                    ticketLabelCell.Border = Rectangle.NO_BORDER;
                    ticketLabelCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    seatTable.AddCell(ticketLabelCell);

                    // Số ghế
                    PdfPCell seatLabelCell = new PdfPCell(new Phrase("Số ghế", boldFont));
                    seatLabelCell.Border = Rectangle.NO_BORDER;
                    seatLabelCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    seatTable.AddCell(seatLabelCell);

                    // Giá trị phòng chiếu
                    PdfPCell roomValueCell = new PdfPCell(new Phrase(ticket.TicketBooking.Showtime.CinemaRoom.Room_Name, regularFont));
                    roomValueCell.Border = Rectangle.NO_BORDER;
                    roomValueCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    seatTable.AddCell(roomValueCell);

                    // Giá trị số vé
                    PdfPCell ticketValueCell = new PdfPCell(new Phrase("01", regularFont));
                    ticketValueCell.Border = Rectangle.NO_BORDER;
                    ticketValueCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    seatTable.AddCell(ticketValueCell);

                    // Giá trị số ghế
                    PdfPCell seatValueCell = new PdfPCell(new Phrase($"{ticket.Seat.SeatLayout.Row_Label}{ticket.Seat.SeatLayout.Column_Number}", regularFont));
                    seatValueCell.Border = Rectangle.NO_BORDER;
                    seatValueCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    seatTable.AddCell(seatValueCell);

                    document.Add(seatTable);

                    // Thức ăn kèm
                    PdfPTable foodTable = new PdfPTable(1);
                    foodTable.WidthPercentage = 100;
                    foodTable.DefaultCell.Border = Rectangle.NO_BORDER;
                    foodTable.SpacingBefore = 5;

                    PdfPCell foodLabelCell = new PdfPCell(new Phrase("Thức ăn kèm", boldFont));
                    foodLabelCell.Border = Rectangle.NO_BORDER;
                    foodLabelCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    foodTable.AddCell(foodLabelCell);

                    PdfPCell foodValueCell = new PdfPCell(new Phrase("1 x Coke 32oz", regularFont));
                    foodValueCell.Border = Rectangle.NO_BORDER;
                    foodValueCell.HorizontalAlignment = Element.ALIGN_CENTER;
                    foodTable.AddCell(foodValueCell);

                    document.Add(foodTable);

                    // [Phần code còn lại giữ nguyên]

                    // Đóng tài liệu
                    document.Close();
                    writer.Close();

                    byte[] pdfBytes = ms.ToArray();
                    _logger.LogInformation($"PDF generated successfully for ticket ID: {ticketId}, size: {pdfBytes.Length} bytes");
                    return pdfBytes;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error while creating PDF document for ticket {ticketId}: {ex.Message}");
                    throw;
                }
                finally
                {
                    ms.Dispose();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating PDF for ticket {ticketId}: {ex.Message}");
                throw;
            }
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

                // Lấy danh sách vé
                var tickets = await GetTicketsByBookingIdAsync(bookingId);
                if (!tickets.Any())
                {
                    _logger.LogWarning($"No tickets found for booking {bookingId}");
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
        /// Gửi thông tin vé qua SMS
        /// </summary>
        public async Task<bool> SendTicketBySmsAsync(int bookingId, string phoneNumber = null)
        {
            try
            {
                var booking = await _context.TicketBookings
                    .Include(tb => tb.User)
                    .Include(tb => tb.Showtime)
                        .ThenInclude(s => s.Movie)
                    .FirstOrDefaultAsync(tb => tb.Booking_ID == bookingId);

                if (booking == null)
                    return false;

                // Sử dụng số điện thoại được cung cấp hoặc số điện thoại của người dùng
                string recipientPhone = phoneNumber ?? booking.User?.Phone_Number;
                if (string.IsNullOrEmpty(recipientPhone))
                    return false;

                // Lấy danh sách vé
                var tickets = await GetTicketsByBookingIdAsync(bookingId);
                if (!tickets.Any())
                    return false;

                // Chuẩn bị nội dung SMS
                string message = $"STP Cinema: Ma dat ve {booking.Booking_ID} cho phim " +
                                $"{booking.Showtime.Movie.Movie_Name} ngay " +
                                $"{booking.Showtime.Show_Date.ToString("dd/MM")}, " +
                                $"gio {booking.Showtime.Start_Time.ToString(@"HH\:mm")}. " + // Sửa thành HH:mm cho định dạng 24h
                                $"Ma ve: {string.Join(", ", tickets.Select(t => t.Ticket_Code))}";

                // Gửi SMS
                return await _smsService.SendSmsAsync(recipientPhone, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in SendTicketBySmsAsync for booking {bookingId}");
                return false;
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
