using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using STP.Repository;
using STP.Repository.Models;
using STP.Repository.Data;
using PMS.Repository.Base;
using STP.Repository.Services;
using STP.Repositories;
using STP.Repository.Repositories;
using STP.Service.Services;
using sa25.Repository.Data;
using CloudinaryDotNet;


namespace STP.APIService
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Khởi tạo builder cho ứng dụng web
            var builder = WebApplication.CreateBuilder(args);

            // Cấu hình CORS để cho phép các nguồn khác nhau truy cập API
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("CinemaAPIPolicy", builder =>
                {
                    builder.AllowAnyOrigin()  // Cho phép tất cả các nguồn
                           .AllowAnyMethod()  // Cho phép tất cả các phương thức HTTP (GET, POST, PUT, DELETE...)
                           .AllowAnyHeader(); // Cho phép tất cả các header
                });
            });

            // Đăng ký các dịch vụ Controllers và cấu hình chế độ serializing JSON
            // ReferenceHandler.Preserve giúp xử lý các tham chiếu vòng tròn trong JSON
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
                });

            // Đăng ký DbContext với chuỗi kết nối từ cấu hình
            builder.Services.AddDbContext<CinemaDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
            );

            // Cấu hình JWT Authentication
            var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]);
            builder.Services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(x =>
            {
                x.RequireHttpsMetadata = false; // Không yêu cầu HTTPS trong môi trường phát triển
                x.SaveToken = true; // Lưu token trong HttpContext
                x.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true, // Xác thực khóa ký
                    IssuerSigningKey = new SymmetricSecurityKey(key), // Khóa ký
                    ValidateIssuer = true, // Xác thực người phát hành
                    ValidateAudience = true, // Xác thực người nhận
                    ValidIssuer = builder.Configuration["Jwt:Issuer"], // Người phát hành từ cấu hình
                    ValidAudience = builder.Configuration["Jwt:Audience"] // Người nhận từ cấu hình
                };
                // Thêm xử lý sự kiện tùy chỉnh để tự động thêm prefix "Bearer"
                x.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        string authorization = context.Request.Headers["Authorization"];

                        // Nếu header Authorization không bắt đầu với "Bearer ", tự động thêm vào
                        if (!string.IsNullOrEmpty(authorization) && !authorization.StartsWith("Bearer "))
                        {
                            context.Request.Headers["Authorization"] = "Bearer " + authorization;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

            // Đăng ký các Repository và Services theo mô hình Dependency Injection
            // Mỗi request sẽ tạo ra một instance mới của các service này
            builder.Services.AddScoped<UnitOfWork>();
            builder.Services.AddScoped<ShowtimeRepository>();
            builder.Services.AddScoped<ShowtimeService>();
            builder.Services.AddScoped<UserRepository>();
            builder.Services.AddScoped<AuthService>();
            builder.Services.AddScoped<EmailService>();
            builder.Services.AddScoped<IUserProfileService, UserProfileService>();
            builder.Services.AddScoped<MovieRepository>();
            builder.Services.AddScoped<EmailVerificationService>();
            builder.Services.AddScoped<BookingService>();
            builder.Services.AddHostedService<BookingExpirationService>();
            // Đăng ký dịch vụ bộ nhớ cache
            builder.Services.AddMemoryCache();
            builder.Services.AddScoped<AccountLockingService>();
            builder.Services.AddScoped<CloudinaryService>();
            // Cấu hình logging
            builder.Services.AddLogging(logging =>
            {
                logging.ClearProviders(); // Xóa tất cả các provider mặc định
                logging.AddConsole(); // Thêm Console logger
                logging.AddDebug(); // Thêm Debug logger
            });

            // Cấu hình Swagger để tạo tài liệu API
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "STP Cinema API", Version = "v1" });

                // Cấu hình Swagger để hỗ trợ JWT Authentication
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // Xây dựng ứng dụng từ cấu hình
            var app = builder.Build();

            // Cấu hình HTTP request pipeline
            // Bật Swagger UI trong cả môi trường phát triển và sản xuất
            if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
            {
                app.UseSwagger(); // Middleware để tạo JSON Swagger
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "STP Cinema API V1");
                });
            }

            // Áp dụng chính sách CORS đã cấu hình
            app.UseCors("CinemaAPIPolicy");

            // Tự động chuyển hướng HTTP sang HTTPS
            app.UseHttpsRedirection();

            // Thêm middleware xác thực và phân quyền
            app.UseAuthentication(); // Xác thực người dùng
            app.UseAuthorization(); // Phân quyền người dùng

            // Cấu hình routing cho controllers
            app.MapControllers();

            // Khởi động ứng dụng
            app.Run();
        }
    }
}
