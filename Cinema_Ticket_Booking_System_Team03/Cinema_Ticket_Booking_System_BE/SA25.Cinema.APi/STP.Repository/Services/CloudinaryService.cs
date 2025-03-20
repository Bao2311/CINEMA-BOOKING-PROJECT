using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        _cloudinary = new Cloudinary(new Account(
            configuration["Cloudinary:CloudName"],
            configuration["Cloudinary:ApiKey"],
            configuration["Cloudinary:ApiSecret"]
        ));
    }

    /// <summary>
    /// Tải lên poster phim
    /// </summary>
    /// <param name="file">File hình ảnh cần tải lên</param>
    /// <param name="folder">Thư mục lưu trữ trên Cloudinary, mặc định là "posters"</param>
    /// <returns>URL của hình ảnh đã tải lên</returns>
    public async Task<string> UploadPoster(IFormFile file, string folder = "posters")
    {
        if (file == null || file.Length == 0)
            return null;

        // Kiểm tra định dạng file
        string extension = Path.GetExtension(file.FileName).ToLower();
        string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        if (!Array.Exists(allowedExtensions, ext => ext == extension))
        {
            throw new ArgumentException("Định dạng file không hợp lệ. Chỉ chấp nhận các định dạng: jpg, jpeg, png, gif, webp");
        }

        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            Transformation = new Transformation()
                .Quality("auto")
                .FetchFormat("auto")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        if (uploadResult.Error != null)
        {
            throw new Exception($"Lỗi khi tải poster lên Cloudinary: {uploadResult.Error.Message}");
        }

        return uploadResult.SecureUrl.ToString();
    }
}
