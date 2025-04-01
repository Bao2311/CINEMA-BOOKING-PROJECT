using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Extensions.Logging;
using iTextSharp.text.pdf;
// Thêm alias cho các class từ iTextSharp
using Document = iTextSharp.text.Document;
using Font = iTextSharp.text.Font;
using Paragraph = iTextSharp.text.Paragraph;
using Element = iTextSharp.text.Element;
using PageSize = iTextSharp.text.PageSize;
using BaseColor = iTextSharp.text.BaseColor;
using FontFactory = iTextSharp.text.FontFactory;
using Rectangle = iTextSharp.text.Rectangle;
using iTextSharp.text;

namespace STP.Repository.Services
{
    public class PdfGenerator
    {
        private readonly ILogger<PdfGenerator> _logger;

        public PdfGenerator(ILogger<PdfGenerator> logger)
        {
            _logger = logger;
        }

        public byte[] GenerateTicketPdf(Dictionary<string, string> ticketData, byte[] qrCodeImage)
        {
            _logger.LogInformation($"Generating PDF for ticket: {ticketData["TicketCode"]}");

            try
            {
                using (MemoryStream ms = new MemoryStream())
                {
                    // Tạo document với kích thước A5
                    Document document = new Document(PageSize.A5.Rotate());
                    PdfWriter writer = PdfWriter.GetInstance(document, ms);
                    document.Open();

                    _logger.LogInformation($"Creating PDF content for ticket: {ticketData["TicketCode"]}");

                    // Thêm tiêu đề
                    Font titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
                    Paragraph title = new Paragraph("STP CINEMA", titleFont);
                    title.Alignment = Element.ALIGN_CENTER;
                    document.Add(title);

                    // Thêm tiêu đề phụ
                    Font subtitleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.DARK_GRAY);
                    Paragraph subtitle = new Paragraph("VÉ XEM PHIM", subtitleFont);
                    subtitle.Alignment = Element.ALIGN_CENTER;
                    subtitle.SpacingAfter = 20;
                    document.Add(subtitle);

                    // Tạo bảng chứa thông tin vé
                    PdfPTable table = new PdfPTable(2);
                    table.WidthPercentage = 100;
                    table.SpacingBefore = 10f;
                    table.SpacingAfter = 10f;

                    // Thêm các thông tin vé
                    AddRowToTable(table, "Mã vé:", ticketData["TicketCode"]);
                    AddRowToTable(table, "Tên phim:", ticketData["MovieName"]);
                    AddRowToTable(table, "Ngày chiếu:", ticketData["ShowDate"]);
                    AddRowToTable(table, "Giờ chiếu:", ticketData["ShowTime"]);
                    AddRowToTable(table, "Phòng:", ticketData["CinemaRoom"]);
                    AddRowToTable(table, "Ghế:", ticketData["SeatInfo"]);
                    AddRowToTable(table, "Giá vé:", ticketData["TicketPrice"]);
                    AddRowToTable(table, "Khách hàng:", ticketData["CustomerName"]);

                    document.Add(table);

                    // Thêm QR code
                    if (qrCodeImage != null && qrCodeImage.Length > 0)
                    {
                        try
                        {
                            iTextSharp.text.Image qrCode = iTextSharp.text.Image.GetInstance(qrCodeImage);
                            qrCode.ScaleToFit(100f, 100f);
                            qrCode.Alignment = Element.ALIGN_CENTER;
                            document.Add(qrCode);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error adding QR code to PDF: {ex.Message}");

                            // Thêm text thay vì QR code
                            Font qrTextFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
                            Paragraph qrText = new Paragraph($"Mã vé: {ticketData["TicketCode"]}", qrTextFont);
                            qrText.Alignment = Element.ALIGN_CENTER;
                            document.Add(qrText);
                        }
                    }
                    else
                    {
                        // Nếu không có QR code, thêm text
                        Font qrTextFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
                        Paragraph qrText = new Paragraph($"Mã vé: {ticketData["TicketCode"]}", qrTextFont);
                        qrText.Alignment = Element.ALIGN_CENTER;
                        document.Add(qrText);
                    }

                    // Thêm ghi chú
                    Font noteFont = FontFactory.GetFont(FontFactory.HELVETICA_OBLIQUE, 8, BaseColor.GRAY);
                    Paragraph note = new Paragraph("Vui lòng đến trước giờ chiếu 15 phút. Vé điện tử này có giá trị như vé giấy.", noteFont);
                    note.Alignment = Element.ALIGN_CENTER;
                    note.SpacingBefore = 20;
                    document.Add(note);

                    document.Close();
                    writer.Close();

                    _logger.LogInformation($"PDF generated for ticket: {ticketData["TicketCode"]}");
                    return ms.ToArray();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating PDF for ticket: {ticketData["TicketCode"]}");
                throw;
            }
        }

        private void AddRowToTable(PdfPTable table, string label, string value)
        {
            Font labelFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10);
            Font valueFont = FontFactory.GetFont(FontFactory.HELVETICA, 10);

            PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
            labelCell.Border = Rectangle.NO_BORDER;
            labelCell.HorizontalAlignment = Element.ALIGN_RIGHT;
            labelCell.PaddingRight = 5f;
            table.AddCell(labelCell);

            PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
            valueCell.Border = Rectangle.NO_BORDER;
            valueCell.HorizontalAlignment = Element.ALIGN_LEFT;
            table.AddCell(valueCell);
        }
    }
}


    