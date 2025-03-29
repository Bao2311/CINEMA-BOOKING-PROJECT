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
using Org.BouncyCastle.Crypto.Generators;
using Microsoft.Extensions.Caching.Memory;

namespace STP.Repository.Services
{
    // Lớp dịch vụ xử lý các chức năng liên quan đến xác thực và quản lý tài khoản người dùng
    public class AuthService
    {
        private readonly CinemaDbContext _context; // Context để tương tác với cơ sở dữ liệu
        private readonly IConfiguration _configuration; // Cấu hình ứng dụng
        private readonly UserRepository _userRepository; // Repository xử lý dữ liệu người dùng
        private readonly EmailService _emailService; // Dịch vụ gửi email
        private readonly AccountLockingService _accountLockingService; // Dịch vụ khóa tài khoản
        private readonly ILogger<AuthService> _logger; // Logger ghi nhật ký
        private readonly EmailVerificationService _emailVerificationService;
        private readonly IMemoryCache _cache; // Thêm cache
        private const string TempPasswordCachePrefix = "TempPassword_"; // Prefix cho cache key
        // Constructor với dependency injection
        public AuthService(CinemaDbContext context, IConfiguration configuration, UserRepository userRepository, EmailService emailService, ILogger<AuthService> logger, AccountLockingService accountLockingService, EmailVerificationService emailVerificationService, IMemoryCache cache)
        {
            _context = context;
            _configuration = configuration;
            _userRepository = userRepository;
            _emailService = emailService;
            _logger = logger;
            _accountLockingService = accountLockingService;
            _emailVerificationService = emailVerificationService;
            _cache = cache;
        }

        // Phương thức băm mật khẩu sử dụng thuật toán SHA256
        private string HashPasswordWithSHA256(string password)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                // Chuyển đổi chuỗi thành mảng byte
                byte[] bytes = System.Text.Encoding.UTF8.GetBytes(password);

                // Tính toán hash
                byte[] hash = sha256.ComputeHash(bytes);

                // Chuyển đổi mảng byte hash thành chuỗi hex
                StringBuilder stringBuilder = new StringBuilder();
                for (int i = 0; i < hash.Length; i++)
                {
                    stringBuilder.Append(hash[i].ToString("x2"));
                }

                return stringBuilder.ToString();
            }
        }

        // Phương thức xác minh mật khẩu - hỗ trợ cả plain text và hash
        private bool VerifyPassword(string password, string storedPassword)
        {
            // Trường hợp 1: So sánh trực tiếp (nếu mật khẩu được lưu dưới dạng plain text)
            if (password == storedPassword)
                return true;

            // Trường hợp 2: So sánh hash (nếu mật khẩu đã được hash)
            string hashedPassword = HashPasswordWithSHA256(password);
            return hashedPassword == storedPassword;
        }


        // Phương thức đăng ký người dùng mới
        public async Task<UserRegistrationResponseDto> RegisterAsync(RegisterDto model)
        {
            try
            {
                // Kiểm tra email đã tồn tại chưa
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
                if (existingUser != null)
                {
                    return new UserRegistrationResponseDto
                    {
                        Success = false,
                        Message = "Email đã được sử dụng"
                    };
                }

                // Kiểm tra số điện thoại đã tồn tại chưa (nếu có)
                if (!string.IsNullOrEmpty(model.PhoneNumber))
                {
                    bool phoneExists = await _userRepository.IsPhoneNumberExistAsync(model.PhoneNumber);
                    if (phoneExists)
                    {
                        return new UserRegistrationResponseDto
                        {
                            Success = false,
                            Message = "Số điện thoại đã được sử dụng"
                        };
                    }
                }
                // Băm mật khẩu trước khi lưu vào DB
                string passwordHash = HashPasswordWithSHA256(model.Password);

                // Tạo đối tượng người dùng mới, gán đầy đủ các thuộc tính từ DTO
                var newUser = new User
                {
                    Email = model.Email,
                    Password = passwordHash,
                    Full_Name = model.FullName,
                    Date_Of_Birth = model.DateOfBirth,   // Gán ngày sinh từ DTO
                    Sex = model.Sex,                     // Gán giới tính
                    Phone_Number = model.PhoneNumber,    // Gán số điện thoại
                    Address = model.Address,             // Gán địa chỉ
                    Role = "Customer",                   // Mặc định là Customer
                    Account_Status = "Pending",          // Đặt trạng thái là Pending cho đến khi xác thực
                    Created_At = DateTime.UtcNow
                };

                // Thêm đối tượng vào DB và lưu thay đổi
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // Tạo và gửi token xác thực email
                try
                {
                    if (_emailVerificationService == null)
                    {
                        _logger.LogError("EmailVerificationService is null");
                        throw new InvalidOperationException("EmailVerificationService is not properly initialized");
                    }

                    bool emailSent = await _emailVerificationService.GenerateVerificationTokenAsync(newUser.Email, newUser.Full_Name);

                    if (!emailSent)
                    {
                        _logger.LogWarning($"Failed to send verification email to {newUser.Email}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error during email verification process: {ex.Message}");
                    // Không throw exception để tiếp tục xử lý
                }

                // Trả về kết quả thành công
                return new UserRegistrationResponseDto
                {
                    Success = true,
                    Message = "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
                    UserId = newUser.User_ID,
                    RequiresEmailVerification = true
                };
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về thông báo thất bại
                _logger.LogError(ex, $"Lỗi khi đăng ký người dùng: {ex.Message}");
                return new UserRegistrationResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau."
                };
            }
        }

        // Phương thức đăng nhập
        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            if (loginDto == null)
                throw new ArgumentNullException(nameof(loginDto), "Dữ liệu đăng nhập không thể trống");

            _logger.LogInformation($"Đang thử đăng nhập với email: {loginDto.Email}");

            // Kiểm tra xem tài khoản có bị khóa không
            if (await _accountLockingService.IsAccountLockedAsync(loginDto.Email))
            {
                int remainingMinutes = await _accountLockingService.GetRemainingLockTimeAsync(loginDto.Email);
                throw new Exception($"Tài khoản của bạn đã bị tạm khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau {remainingMinutes} phút.");
            }

            // Tìm người dùng theo email
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);

            // Kiểm tra người dùng tồn tại
            if (user == null)
            {
                _logger.LogWarning($"Đăng nhập thất bại với email không tồn tại: {loginDto.Email}");
                throw new Exception("Tài khoản hoặc mật khẩu sai");
            }

            _logger.LogInformation($"Đã tìm thấy người dùng với ID: {user.User_ID}, Email: {user.Email}");

            // Kiểm tra xem đây có phải là mật khẩu tạm thời không
            string cacheKey = $"{TempPasswordCachePrefix}{loginDto.Email}";
            bool isTempPassword = false;
            bool isPasswordValid = false;

            // Kiểm tra trong cache trước
            if (_cache.TryGetValue(cacheKey, out string cachedHashedPassword))
            {
                string hashedInputPassword = HashPasswordWithSHA256(loginDto.Password);
                isTempPassword = (hashedInputPassword == cachedHashedPassword);
                _logger.LogInformation($"Kiểm tra mật khẩu tạm thời: {isTempPassword}");

                if (isTempPassword)
                {
                    isPasswordValid = true;
                    _logger.LogInformation("Đăng nhập bằng mật khẩu tạm thời thành công");

                    // Nếu tài khoản đang ở trạng thái Pending, kích hoạt nó
                    if (user.Account_Status == "Pending")
                    {
                        user.Account_Status = "Active";
                        _logger.LogInformation($"Tự động kích hoạt tài khoản {user.Email} khi đăng nhập bằng mật khẩu tạm thời");
                        await _userRepository.UpdateAsync(user);
                    }
                }
            }

            // Nếu không phải mật khẩu tạm thời, kiểm tra trạng thái tài khoản
            if (!isTempPassword && user.Account_Status == "Pending")
            {
                throw new Exception("Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.");
            }

            // Nếu không phải mật khẩu tạm thời, kiểm tra mật khẩu thông thường
            if (!isPasswordValid && !VerifyPassword(loginDto.Password, user.Password))
            {
                _logger.LogWarning("Xác thực mật khẩu thất bại");

                // Ghi nhận đăng nhập thất bại và kiểm tra khóa tài khoản
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

                // Hiển thị số lần đăng nhập sai còn lại
                int attemptsCount = await _accountLockingService.GetFailedAttemptsAsync(loginDto.Email);
                int remainingAttempts = 5 - attemptsCount;
                throw new Exception($"Tài khoản hoặc mật khẩu sai. Bạn còn {remainingAttempts} lần thử trước khi tài khoản bị khóa.");
            }

            _logger.LogInformation("Xác thực mật khẩu thành công");

            // Đặt lại số lần đăng nhập sai khi đăng nhập thành công
            await _accountLockingService.ResetFailedAttemptsAsync(loginDto.Email);

            // Cập nhật thời gian đăng nhập cuối cùng
            user.Last_Login = DateTime.Now;
            await _userRepository.UpdateAsync(user);

            // Tạo và trả về token
            _logger.LogInformation("Đang tạo JWT token");
            var token = GenerateJwtToken(user);

            // Tạo response
            var response = new AuthResponseDto
            {
                UserId = user.User_ID,
                FullName = user.Full_Name,
                Email = user.Email,
                Token = token,
                TokenExpiration = DateTime.UtcNow.AddDays(1),
                Role = user.Role,
                RequiresPasswordChange = isTempPassword // Đặt dựa trên kết quả kiểm tra mật khẩu tạm thời
            };

            _logger.LogInformation($"Login response RequiresPasswordChange: {response.RequiresPasswordChange}");

            return response;
        }

        // Phương thức mở khóa tài khoản
        public async Task<bool> UnlockAccountAsync(string email)
        {
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
                return false;

            await _accountLockingService.UnlockAccountAsync(email);
            return true;
        }

        // Phương thức đổi mật khẩu
        public async Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy thông tin người dùng");

            // Xác minh mật khẩu cũ
            if (!VerifyPassword(changePasswordDto.OldPassword, user.Password))
                throw new Exception("Mật khẩu cũ không chính xác");

            // Băm và lưu mật khẩu mới
            user.Password = HashPasswordWithSHA256(changePasswordDto.NewPassword);
            await _userRepository.UpdateAsync(user);
            _logger.LogInformation($"Người dùng {userId} đã đổi mật khẩu thành công");

            // Xóa cache nếu tồn tại
            _cache.Remove($"{TempPasswordCachePrefix}{user.Email}");
            _logger.LogInformation($"Đã xóa cache mật khẩu tạm thời cho người dùng: {user.Email}");
        }

        // Phương thức cập nhật thông tin cá nhân
        public async Task<object> UpdateProfileAsync(int userId, UpdateProfileDto updateProfileDto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy thông tin người dùng");

            // Kiểm tra số điện thoại đã tồn tại (nếu có thay đổi)
            if (!string.IsNullOrEmpty(updateProfileDto.PhoneNumber) &&
                updateProfileDto.PhoneNumber != user.Phone_Number)
            {
                bool phoneExists = await _userRepository.IsPhoneNumberExistAsync(updateProfileDto.PhoneNumber, userId);
                if (phoneExists)
                {
                    throw new Exception("Số điện thoại đã được sử dụng bởi tài khoản khác");
                }
            }
            // Cập nhật các thông tin nếu có
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

            // Lưu thay đổi vào DB
            await _userRepository.UpdateAsync(user);

            // Trả về thông tin đã cập nhật
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

        // Phương thức tạo JWT Token cho xác thực
        private string GenerateJwtToken(User user)
        {
            var keyValue = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(keyValue))
            {
                Console.WriteLine("JWT Key is missing in configuration");
                throw new InvalidOperationException("JWT Key is missing in configuration");
            }

            // Tạo key từ chuỗi bí mật
            var key = Encoding.ASCII.GetBytes(keyValue);

            // Cấu hình token
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                // Thêm claims chứa thông tin người dùng
                Subject = new ClaimsIdentity(new Claim[]
                {
                        new Claim(ClaimTypes.NameIdentifier, user.User_ID.ToString()),
                        new Claim(ClaimTypes.Name, user.Full_Name ?? ""),
                        new Claim(ClaimTypes.Email, user.Email ?? ""),
                        new Claim(ClaimTypes.Role, user.Role ?? "Customer")
                }),
                Expires = DateTime.UtcNow.AddDays(1), // Token hết hạn sau 1 ngày
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            // Tạo token từ mô tả
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // Phương thức lấy thông tin người dùng
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

        // Phương thức thay đổi trạng thái tài khoản
        public async Task<bool> ChangeAccountStatusAsync(int userId, string status)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng");

            // Kiểm tra trạng thái hợp lệ
            if (status != "Active" && status != "Inactive" && status != "Locked")
                throw new Exception("Trạng thái tài khoản không hợp lệ");

            // Cập nhật trạng thái
            user.Account_Status = status;
            await _userRepository.UpdateAsync(user);
            return true;
        }

        // Phương thức đặt lại mật khẩu
        public async Task<ResetPasswordResultDto> ResetPasswordAsync(string email)
        {
            _logger.LogInformation($"Đang đặt lại mật khẩu cho email: {email}");

            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning($"Không tìm thấy người dùng với email: {email}");
                throw new Exception("Không tìm thấy tài khoản với email này");
            }

            // Tạo mật khẩu mới ngẫu nhiên
            string newPassword = GenerateRandomPassword();
            _logger.LogInformation($"Đã tạo mật khẩu mới cho người dùng: {user.User_ID}");

            // Băm mật khẩu mới
            string hashedPassword = HashPasswordWithSHA256(newPassword);

            // Lưu mật khẩu mới đã băm vào DB
            user.Password = hashedPassword;
            await _userRepository.UpdateAsync(user);

            // Lưu mật khẩu vào cache với thời hạn 24 giờ
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(24));

            _cache.Set($"{TempPasswordCachePrefix}{email}", hashedPassword, cacheEntryOptions);
            _logger.LogInformation($"Đã lưu mật khẩu tạm thời vào cache cho: {email}");

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
                <p>Lưu ý:</p>
                <ul>
                    <li>Mật khẩu này chỉ có hiệu lực trong vòng 24 giờ.</li>
                    <li>Hệ thống sẽ yêu cầu bạn đổi mật khẩu ngay khi đăng nhập thành công.</li>
                </ul>
                <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi.</p>
                <p>Trân trọng,<br>Đội ngũ STP Cinema</p>
            </div>
        </body>
        </html>";

                // Gửi email chứa mật khẩu mới
                _logger.LogInformation($"Đang gửi email đặt lại mật khẩu đến: {email}");
                await _emailService.SendEmailAsync(email, subject, body);
                _logger.LogInformation($"Đã gửi email đặt lại mật khẩu thành công đến: {email}");

                // Trả về kết quả thành công
                return new ResetPasswordResultDto
                {
                    Message = "Đặt lại mật khẩu thành công, vui lòng kiểm tra email của bạn. Mật khẩu này chỉ có hiệu lực trong vòng 24 giờ.",
                    NewPassword = newPassword, // Trong production, nên bỏ dòng này
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };
            }
            catch (Exception ex)
            {
                // Ghi log lỗi nếu không gửi được email
                _logger.LogError(ex, $"Không thể gửi email đặt lại mật khẩu: {ex.Message}");
                throw new Exception($"Đã đặt lại mật khẩu nhưng không thể gửi email: {ex.Message}");
            }
        }

        // Phương thức đăng ký người dùng bởi admin
        public async Task<UserRegistrationResponseDto> RegisterUserByAdminAsync(AdminRegisterUserDto model, int adminId)
        {
            try
            {
                // Kiểm tra email đã tồn tại
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
                if (existingUser != null)
                {
                    return new UserRegistrationResponseDto
                    {
                        Success = false,
                        Message = "Email đã được sử dụng"
                    };
                }

                // Kiểm tra số điện thoại đã tồn tại
                if (!string.IsNullOrEmpty(model.PhoneNumber))
                {
                    bool phoneExists = await _userRepository.IsPhoneNumberExistAsync(model.PhoneNumber);
                    if (phoneExists)
                    {
                        return new UserRegistrationResponseDto
                        {
                            Success = false,
                            Message = "Số điện thoại đã được sử dụng"
                        };
                    }
                }
                // Kiểm tra role hợp lệ
                if (!IsValidRole(model.Role))
                {
                    return new UserRegistrationResponseDto
                    {
                        Success = false,
                        Message = "Vai trò không hợp lệ. Các vai trò hợp lệ: Customer, Staff, Manager"
                    };
                }

                // Tạo mật khẩu ngẫu nhiên và băm
                string randomPassword = GenerateRandomPassword();
                string passwordHash = HashPasswordWithSHA256(randomPassword);

                // Tạo đối tượng người dùng mới
                var newUser = new User
                {
                    Email = model.Email,
                    Password = passwordHash,
                    Full_Name = model.FullName,
                    Role = model.Role,
                    Department = model.Department,
                    Hire_Date = model.Hire_Date,
                    Date_Of_Birth = model.DateOfBirth,
                    Sex = model.Sex,
                    Phone_Number = model.PhoneNumber,
                    Address = model.Address,
                    Created_At = DateTime.UtcNow
                };

                // Thêm vào DB và lưu thay đổi
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // Gửi email thông báo mật khẩu cho người dùng mới
                await _emailService.SendPasswordNotificationEmailAsync(newUser.Email, newUser.Full_Name, randomPassword);

                // Ghi log hành động của admin
                _logger.LogInformation($"Admin ID {adminId} đã tạo tài khoản cho {model.Email} với vai trò {model.Role}");

                // Trả về kết quả thành công
                return new UserRegistrationResponseDto
                {
                    Success = true,
                    Message = $"Đã tạo tài khoản thành công cho {model.Email}. Mật khẩu đã được gửi qua email.",
                    UserId = newUser.User_ID
                };
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về thông báo thất bại
                _logger.LogError($"Lỗi khi đăng ký người dùng: {ex.Message}");
                return new UserRegistrationResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau."
                };
            }
        }

        // Kiểm tra vai trò hợp lệ
        private bool IsValidRole(string role)
        {
            string[] validRoles = { "Customer", "Staff", "Manager" };
            return Array.Exists(validRoles, r => r.Equals(role, StringComparison.OrdinalIgnoreCase));
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

        public async Task<UserRegistrationResponseDto> RegisterUserByStaffAsync(StaffRegisterUserDto model, int staffId)
        {
            try
            {
                // Kiểm tra email đã tồn tại chưa
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
                if (existingUser != null)
                {
                    return new UserRegistrationResponseDto
                    {
                        Success = false,
                        Message = "Email đã được sử dụng"
                    };
                }

                // Kiểm tra số điện thoại đã tồn tại (nếu có)
                if (!string.IsNullOrEmpty(model.PhoneNumber))
                {
                    bool phoneExists = await _userRepository.IsPhoneNumberExistAsync(model.PhoneNumber);
                    if (phoneExists)
                    {
                        return new UserRegistrationResponseDto
                        {
                            Success = false,
                            Message = "Số điện thoại đã được sử dụng"
                        };
                    }
                }

                // Tạo mật khẩu ngẫu nhiên và băm
                string randomPassword = GenerateRandomPassword();
                string passwordHash = HashPasswordWithSHA256(randomPassword);

                // Tạo đối tượng người dùng mới
                var newUser = new User
                {
                    Email = model.Email,
                    Password = passwordHash,
                    Full_Name = model.FullName,
                    Role = "Customer", // Mặc định là Customer
                    Sex = model.Sex,
                    Phone_Number = model.PhoneNumber,
                    Account_Status = "Pending", // Trạng thái ban đầu là Pending
                    Created_At = DateTime.UtcNow
                };

                // Thêm vào DB và lưu thay đổi
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // Gửi email thông báo mật khẩu cho người dùng mới
                await _emailService.SendPasswordNotificationEmailAsync(newUser.Email, newUser.Full_Name, randomPassword);

                // Ghi log hành động của nhân viên
                _logger.LogInformation($"Staff ID {staffId} đã tạo tài khoản cho {model.Email}");

                // Trả về kết quả thành công
                return new UserRegistrationResponseDto
                {
                    Success = true,
                    Message = $"Đã tạo tài khoản thành công cho {model.Email}. Mật khẩu đã được gửi qua email.",
                    UserId = newUser.User_ID,
                    RequiresEmailVerification = true
                };
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về thông báo thất bại
                _logger.LogError($"Lỗi khi đăng ký người dùng bởi nhân viên: {ex.Message}");
                return new UserRegistrationResponseDto
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau."
                };
            }
        }
    }
}




