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

namespace STP.APIService
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            
            // Cấu hình CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("CinemaAPIPolicy", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });

            // Đăng ký các dịch vụ Controllers và cấu hình chế độ serializing JSON
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
                });

            // Đăng ký DbContext
            builder.Services.AddDbContext<CinemaDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
            );
            // new function 
            

            // Cấu hình JWT Authentication
            var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Key"]);
            builder.Services.AddAuthentication(x =>
            {
                x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(x =>
            {
                x.RequireHttpsMetadata = false;
                x.SaveToken = true;
                x.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"]
                };
            });

            // Đăng ký các Repository và Services
            // Trong phần đăng ký các Repository và Services
            builder.Services.AddScoped<UnitOfWork>();
            builder.Services.AddScoped<ShowtimeRepository>();
            builder.Services.AddScoped<ShowtimeService>();
            builder.Services.AddScoped<UserRepository>();
            builder.Services.AddScoped<AuthService>();
            builder.Services.AddScoped<EmailService>();

            builder.Services.AddScoped<UnitOfWork>();
            builder.Services.AddScoped<IUserProfileService, UserProfileService>();

            builder.Services.AddScoped<MovieRepository>();
            //builder.Services.AddScoped<TicketSellingRepository>();
            //builder.Services.AddScoped<TicketSellingService>();
            builder.Services.AddMemoryCache();
            builder.Services.AddScoped<AccountLockingService>();

            builder.Services.AddLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddConsole();
                logging.AddDebug();
            });
            // Cấu hình Swagger
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

            // Xây dựng ứng dụng
            var app = builder.Build();

            // Cấu hình HTTP request pipeline
            if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "STP Cinema API V1");
                });
            }

            // Sử dụng CORS
            app.UseCors("CinemaAPIPolicy");
            
            app.UseHttpsRedirection();

            // Thêm Authentication và Authorization
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Chạy ứng dụng
            app.Run();
        }
    }
}