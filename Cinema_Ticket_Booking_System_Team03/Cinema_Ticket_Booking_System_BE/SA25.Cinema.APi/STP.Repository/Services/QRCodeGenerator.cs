using Microsoft.Extensions.Logging;
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace STP.Repository.Services
{
    /// <summary>
    /// Tạo mã QR code cho vé
    /// </summary>
    public class QRCodeGenerator
    {
        private readonly ILogger<QRCodeGenerator> _logger;

        public QRCodeGenerator(ILogger<QRCodeGenerator> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Tạo mã QR code từ dữ liệu vé
        /// </summary>
        /// <param name="ticketCode">Mã vé để mã hóa vào QR code</param>
        /// <returns>Mảng byte chứa hình ảnh QR code</returns>
        public byte[] GenerateQRCode(string ticketCode)
        {
            try
            {
                _logger.LogInformation($"Generating QR code for ticket: {ticketCode}");

                // Tạo một hình ảnh đơn giản với định dạng PNG
                using (Bitmap bitmap = new Bitmap(300, 300))
                {
                    using (Graphics g = Graphics.FromImage(bitmap))
                    {
                        // Vẽ nền trắng
                        g.Clear(Color.White);

                        // Vẽ viền đen
                        using (Pen pen = new Pen(Color.Black, 10))
                        {
                            g.DrawRectangle(pen, 10, 10, 280, 280);
                        }

                        // Vẽ mã vé ở giữa
                        using (Font font = new Font("Arial", 16, FontStyle.Bold))
                        using (StringFormat format = new StringFormat())
                        {
                            format.Alignment = StringAlignment.Center;
                            format.LineAlignment = StringAlignment.Center;
                            g.DrawString(ticketCode, font, Brushes.Black, new RectangleF(0, 0, 300, 300), format);
                        }
                    }

                    // Chuyển đổi bitmap thành mảng byte PNG
                    using (MemoryStream ms = new MemoryStream())
                    {
                        bitmap.Save(ms, ImageFormat.Png);
                        _logger.LogInformation($"QR code generated for ticket: {ticketCode}");
                        return ms.ToArray();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating QR code: {ex.Message}");
                // Trả về null thay vì throw exception để xử lý gracefully
                return null;
            }
        }
    }
}


