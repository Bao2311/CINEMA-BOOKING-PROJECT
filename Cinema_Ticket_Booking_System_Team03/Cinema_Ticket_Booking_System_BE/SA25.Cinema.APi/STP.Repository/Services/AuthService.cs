using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using STP.Repository.Data;
using STP.Repository.Dtos;
using STP.Repository.Models;
using STP.Repositories;
using System.Threading.Tasks;
using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace STP.Repository.Services
{
    public class AuthService
    {
        private readonly CinemaDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly UserRepository _userRepository;
        private readonly EmailService _emailService; // Thêm EmailService
        private readonly AccountLockingService _accountLockingService;
        private readonly ILogger<AuthService> _logger;
        public AuthService(CinemaDbContext context, IConfiguration configuration, UserRepository userRepository, EmailService emailService, ILogger<AuthService> logger, AccountLockingService accountLockingService)
        {
            _context = context;
            _configuration = configuration;
            _userRepository = userRepository;
            _emailService = emailService; // Khởi tạo EmailService
            _logger = logger;
            _accountLockingService = accountLockingService;
        }

        // HashPassword sử dụng SHA256
        public string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var passwordHash = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(passwordHash);
            }
        }

        // Xác minh mật khẩu - kiểm tra cả mật khẩu thường và mật khẩu đã hash
        private bool VerifyPassword(string password, string storedPassword)
        {
            // Trường hợp 1: So sánh trực tiếp (nếu mật khẩu được lưu dưới dạng plain text)
            if (password == storedPassword)
                return true;

            // Trường hợp 2: So sánh hash (nếu mật khẩu đã được hash)
            using (var sha256 = SHA256.Create())
            {
                var passwordHash = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                var passwordHashString = Convert.ToBase64String(passwordHash);
                return passwordHashString == storedPassword;
            }
        }

        // Đăng ký người dùng mới
        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            // Kiểm tra xem email đã tồn tại chưa
            if (await _userRepository.EmailExistsAsync(registerDto.Email))
                throw new Exception("Email đã tồn tại");

            // Tạo mới người dùng - lưu mật khẩu trực tiếp để phù hợp với dữ liệu hiện tại
            var user = new User
            {
                Full_Name = registerDto.FullName,
                Email = registerDto.Email,
                Password = registerDto.Password, // Lưu mật khẩu trực tiếp không hash
                Role = "Customer", // Mặc định là khách hàng
                Date_Of_Birth = registerDto.DateOfBirth,
                Sex = registerDto.Sex,
                Phone_Number = registerDto.PhoneNumber,
                Address = registerDto.Address,
                Account_Status = "Active",
                Created_At = DateTime.Now
            };

            await _userRepository.CreateAsync(user);

            // Tạo token
            return new AuthResponseDto
            {
                UserId = user.User_ID,
                FullName = user.Full_Name,
                Email = user.Email,
                Token = GenerateJwtToken(user),
                TokenExpiration = DateTime.UtcNow.AddDays(1),
                Role = user.Role
            };
        }

        // Đăng nhập
        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            if (loginDto == null)
                throw new ArgumentNullException(nameof(loginDto), "Dữ liệu đăng nhập không thể trống");

            Console.WriteLine($"Đang thử đăng nhập với email: {loginDto.Email}");

            // Kiểm tra xem tài khoản có bị khóa không
            if (await _accountLockingService.IsAccountLockedAsync(loginDto.Email))
            {
                int remainingMinutes = await _accountLockingService.GetRemainingLockTimeAsync(loginDto.Email);
                throw new Exception($"Tài khoản của bạn đã bị tạm khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau {remainingMinutes} phút.");
            }

            // Sử dụng UserRepository để tìm người dùng theo email
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);

            // Kiểm tra xem người dùng có tồn tại không
            if (user == null)
            {
                Console.WriteLine("Không tìm thấy người dùng");
                _logger.LogWarning($"Đăng nhập thất bại với email không tồn tại: {loginDto.Email}");
                throw new Exception("Tài khoản hoặc mật khẩu sai");
            }

            Console.WriteLine($"Đã tìm thấy người dùng với ID: {user.User_ID}, Email: {user.Email}");

            Console.WriteLine($"Mật khẩu từ DB: {user.Password?.Length ?? 0} ký tự");
            Console.WriteLine($"Mật khẩu nhập vào: {loginDto.Password?.Length ?? 0} ký tự");

            // Xác thực mật khẩu
            if (!VerifyPassword(loginDto.Password, user.Password))
            {
                Console.WriteLine("Xác thực mật khẩu thất bại");

                // Ghi nhận đăng nhập thất bại và kiểm tra xem tài khoản có bị khóa không
                bool isLocked = await _accountLockingService.RecordFailedAttemptAsync(loginDto.Email);

                if (isLocked)
                {
                    // Gửi email thông báo nếu tài khoản bị khóa
                    try
                    {
                        await _emailService.SendAccountLockedEmailAsync(user.Email, user.Full_Name);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Không thể gửi email thông báo khóa tài khoản: {ex.Message}");
                    }

                    throw new Exception("Tài khoản của bạn đã bị tạm khóa do đăng nhập sai 5 lần liên tiếp. Vui lòng thử lại sau 30 phút.");
                }

                // Hiển thị số lần đăng nhập sai còn lại trước khi bị khóa
                int attemptsCount = await _accountLockingService.GetFailedAttemptsAsync(loginDto.Email);
                int remainingAttempts = 5 - attemptsCount;
                throw new Exception($"Tài khoản hoặc mật khẩu sai. Bạn còn {remainingAttempts} lần thử trước khi tài khoản bị khóa.");
            }

            Console.WriteLine("Xác thực mật khẩu thành công");

            // Đặt lại số lần đăng nhập sai khi đăng nhập thành công
            await _accountLockingService.ResetFailedAttemptsAsync(loginDto.Email);

            // Cập nhật thời gian đăng nhập cuối cùng
            user.Last_Login = DateTime.Now;
            await _userRepository.UpdateAsync(user);

            // Tạo và trả về token
            Console.WriteLine("Đang tạo JWT token");
            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                UserId = user.User_ID,
                FullName = user.Full_Name,
                Email = user.Email,
                Token = token,
                TokenExpiration = DateTime.UtcNow.AddDays(1),
                Role = user.Role
            };
        }

        // Thêm phương thức mở khóa tài khoản
        public async Task<bool> UnlockAccountAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
                return false;

            await _accountLockingService.UnlockAccountAsync(email);
            return true;
        }

        // Đổi mật khẩu
        public async Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy thông tin người dùng");

            // Xác minh mật khẩu cũ với phương thức mới
            if (!VerifyPassword(changePasswordDto.OldPassword, user.Password))
                throw new Exception("Mật khẩu cũ không chính xác");

            // Bằng dòng này để mã hóa mật khẩu:
            user.Password = HashPassword(changePasswordDto.NewPassword);
            await _userRepository.UpdateAsync(user);
        }

        // Cập nhật thông tin cá nhân
        public async Task<object> UpdateProfileAsync(int userId, UpdateProfileDto updateProfileDto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy thông tin người dùng");

            // Cập nhật thông tin
            if (!string.IsNullOrEmpty(updateProfileDto.FullName))
                user.Full_Name = updateProfileDto.FullName;

            if (updateProfileDto.DateOfBirth.HasValue)
                user.Date_Of_Birth = updateProfileDto.DateOfBirth.Value;

            if (!string.IsNullOrEmpty(updateProfileDto.Sex))
                user.Sex = updateProfileDto.Sex;


            if (!string.IsNullOrEmpty(updateProfileDto.PhoneNumber))
                user.Phone_Number = updateProfileDto.PhoneNumber;

            if (!string.IsNullOrEmpty(updateProfileDto.Address))
                user.Address = updateProfileDto.Address;

            await _userRepository.UpdateAsync(user);

            return new
            {
                UserId = user.User_ID,
                FullName = user.Full_Name,
                Email = user.Email,
                PhoneNumber = user.Phone_Number,
                DateOfBirth = user.Date_Of_Birth,
                Sex = user.Sex,
                Address = user.Address,
                Role = user.Role
            };
        }

        // Tạo JWT Token
        private string GenerateJwtToken(User user)
        {
            var keyValue = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(keyValue))
            {
                Console.WriteLine("JWT Key is missing in configuration");
                throw new InvalidOperationException("JWT Key is missing in configuration");
            }

            var key = Encoding.ASCII.GetBytes(keyValue);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.User_ID.ToString()),
                    new Claim(ClaimTypes.Name, user.Full_Name ?? ""),
                    new Claim(ClaimTypes.Email, user.Email ?? ""),
                    new Claim(ClaimTypes.Role, user.Role ?? "Customer")
                }),
                Expires = DateTime.UtcNow.AddDays(1),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // Lấy thông tin người dùng
        public async Task<AuthResponseDto> GetUserProfileAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng");

            return new AuthResponseDto
            {
                UserId = user.User_ID,
                FullName = user.Full_Name,
                Email = user.Email,
                Role = user.Role
            };
        }

        // Thay đổi trạng thái tài khoản
        public async Task<bool> ChangeAccountStatusAsync(int userId, string status)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng");

            if (status != "Active" && status != "Inactive" && status != "Locked")
                throw new Exception("Trạng thái tài khoản không hợp lệ");

            user.Account_Status = status;
            await _userRepository.UpdateAsync(user);
            return true;
        }

        // Đặt lại mật khẩu
        public async Task<ResetPasswordResultDto> ResetPasswordAsync(string email)
        {
            _logger.LogInformation($"Resetting password for email: {email}");

            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning($"User not found with email: {email}");
                throw new Exception("Không tìm thấy tài khoản với email này");
            }

            // Tạo mật khẩu mới ngẫu nhiên
            string newPassword = GenerateRandomPassword();
            _logger.LogInformation($"Generated new password for user: {user.User_ID}");

            // Lưu mật khẩu mới và mã hóa pass 
            user.Password = HashPassword(newPassword);
            await _userRepository.UpdateAsync(user);
            _logger.LogInformation($"Updated password for user: {user.User_ID}");


            try
            {
                // Tạo nội dung email
                string subject = "Đặt lại mật khẩu - STP Cinema";
                string body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>
                        <h2 style='color: #e50914;'>Đặt lại mật khẩu tại STP Cinema</h2>
                        <p>Xin chào {user.Full_Name},</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p>Mật khẩu mới của bạn là: <strong>{newPassword}</strong></p>
                        <p>Vui lòng đổi mật khẩu này ngay sau khi đăng nhập để đảm bảo an toàn cho tài khoản.</p>
                        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi.</p>
                        <p>Trân trọng,<br>Đội ngũ STP Cinema</p>
                    </div>
                </body>
                </html>";

                // Gửi email
                _logger.LogInformation($"Attempting to send password reset email to: {email}");
                await _emailService.SendEmailAsync(email, subject, body);
                _logger.LogInformation($"Password reset email sent successfully to: {email}");

                // Trả về kết quả
                return new ResetPasswordResultDto
                {
                    Message = "Đặt lại mật khẩu thành công, vui lòng kiểm tra email của bạn",
                    NewPassword = newPassword // Trong production, nên bỏ dòng này
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send password reset email: {ex.Message}");
                throw new Exception($"Đã đặt lại mật khẩu nhưng không thể gửi email: {ex.Message}");
            }
        }

        // Tạo mật khẩu ngẫu nhiên
        private string GenerateRandomPassword(int length = 10)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var random = new Random();
            var result = new char[length];
            for (int i = 0; i < length; i++)
            {
                result[i] = chars[random.Next(chars.Length)];
            }
            return new string(result);
        }
    }


}