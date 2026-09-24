using Microsoft.EntityFrameworkCore;
using STP.Repository.Models;
using Microsoft.Extensions.Configuration;
using System;

namespace STP.Repository.Data
{
    /// <summary>
    /// Lớp DbContext chính của ứng dụng rạp chiếu phim, quản lý kết nối và ánh xạ giữa
    /// các entity và bảng trong cơ sở dữ liệu.
    /// </summary>
    public class CinemaDbContext : DbContext
    {
        static CinemaDbContext()
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        }

        /// <summary>
        /// Khởi tạo một instance mới của CinemaDbContext với các tùy chọn được cung cấp.
        /// </summary>
        /// <param name="options">Các tùy chọn cấu hình cho DbContext</param>
        public CinemaDbContext(DbContextOptions<CinemaDbContext> options)
            : base(options)
        {
        }

        // Các DbSet tương ứng với các bảng trong cơ sở dữ liệu
        public DbSet<User> Users { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<CinemaRoom> CinemaRooms { get; set; }
        public DbSet<SeatLayout> SeatLayouts { get; set; }
        public DbSet<Showtime> Showtimes { get; set; }
        public DbSet<Seat> Seats { get; set; }
        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<TicketBooking> TicketBookings { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Score> Scores { get; set; }
        public DbSet<BookingHistory> BookingHistories { get; set; }
        public DbSet<PromotionUsage> PromotionUsages { get; set; }
        public DbSet<MovieRating> MovieRatings { get; set; }
        public DbSet<PointsRedemption> PointsRedemptions { get; set; }
        public DbSet<FailedLogin> FailedLogins { get; set; }
        public DbSet<TicketPricing> TicketPricings { get; set; }
        public DbSet<UserPoints> UserPoints { get; set; }
        public DbSet<PointsEarning> PointsEarnings { get; set; }

        /// <summary>
        public static string ConvertPostgresConnectionString(string connStr)
        {
            if (string.IsNullOrWhiteSpace(connStr)) return connStr;
            if (connStr.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || 
                connStr.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var uri = new Uri(connStr);
                    var userInfo = uri.UserInfo.Split(':');
                    var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
                    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                    var host = uri.Host;
                    var port = uri.Port > 0 ? uri.Port : 5432;
                    var database = uri.AbsolutePath.TrimStart('/');
                    return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
                }
                catch
                {
                    return connStr;
                }
            }
            return connStr;
        }

        /// <summary>
        /// Lấy chuỗi kết nối từ biến môi trường hoặc tệp cấu hình appsettings.json
        /// </summary>
        /// <param name="connectionStringName">Tên của chuỗi kết nối cần lấy</param>
        /// <returns>Chuỗi kết nối đến cơ sở dữ liệu</returns>
        public static string GetConnectionString(string connectionStringName)
        {
            var envDbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            if (!string.IsNullOrWhiteSpace(envDbUrl))
            {
                return envDbUrl;
            }

            var envConn = Environment.GetEnvironmentVariable($"ConnectionStrings__{connectionStringName}")
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (!string.IsNullOrWhiteSpace(envConn))
            {
                return envConn;
            }

            var config = new ConfigurationBuilder()
                .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            return config.GetConnectionString(connectionStringName) ?? string.Empty;
        }

        /// <summary>
        /// Cấu hình DbContext với chuỗi kết nối nếu chưa được cấu hình
        /// </summary>
        /// <param name="optionsBuilder">Builder để cấu hình options cho DbContext</param>
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                var connectionString = GetConnectionString("DefaultConnection");
                var dbProvider = Environment.GetEnvironmentVariable("DATABASE_PROVIDER");
                if (string.IsNullOrWhiteSpace(dbProvider))
                {
                    var config = new ConfigurationBuilder()
                        .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                        .AddJsonFile("appsettings.json", optional: true)
                        .Build();
                    dbProvider = config["DATABASE_PROVIDER"];
                }
                if (string.IsNullOrWhiteSpace(dbProvider))
                {
                    dbProvider = (!string.IsNullOrWhiteSpace(connectionString) && (connectionString.StartsWith("postgres") || connectionString.Contains("Host=")))
                        ? "PostgreSQL" : "SqlServer";
                }

                if (dbProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
                {
                    optionsBuilder.UseNpgsql(ConvertPostgresConnectionString(connectionString));
                }
                else
                {
                    optionsBuilder.UseSqlServer(connectionString);
                }
                optionsBuilder.UseLazyLoadingProxies(false); // Vô hiệu hóa lazy loading
            }
        }

        /// <summary>
        /// Cấu hình chi tiết cho các entity và mối quan hệ giữa chúng
        /// </summary>
        /// <param name="modelBuilder">Builder để xây dựng mô hình dữ liệu</param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Thiết lập tên bảng cho các model
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Movie>().ToTable("Movies");
            modelBuilder.Entity<CinemaRoom>().ToTable("Cinema_Rooms");
            modelBuilder.Entity<SeatLayout>().ToTable("Seat_Layout");
            modelBuilder.Entity<Showtime>().ToTable("Showtimes");
            modelBuilder.Entity<Seat>().ToTable("Seats");
            modelBuilder.Entity<Promotion>().ToTable("Promotions");
            modelBuilder.Entity<TicketBooking>().ToTable("Ticket_Bookings");
            modelBuilder.Entity<Ticket>().ToTable("Tickets");
            modelBuilder.Entity<Payment>().ToTable("Payments");
            modelBuilder.Entity<Score>().ToTable("Scores");
            modelBuilder.Entity<BookingHistory>().ToTable("Booking_History");
            modelBuilder.Entity<PromotionUsage>().ToTable("Promotion_Usage");
            modelBuilder.Entity<MovieRating>().ToTable("Movie_Ratings");
            modelBuilder.Entity<PointsRedemption>().ToTable("Points_Redemption");
            modelBuilder.Entity<TicketPricing>().ToTable("Ticket_Pricing");
            modelBuilder.Entity<UserPoints>().ToTable("User_Points");
            modelBuilder.Entity<PointsEarning>().ToTable("Points_Earning");

            // Cấu hình khóa duy nhất
            modelBuilder.Entity<Ticket>()
                .HasIndex(t => t.Ticket_Code)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Promotion>()
                .HasIndex(p => p.Promotion_Code)
                .IsUnique();

            // 1. User Relationships
            // User - Movie (Created_By)
            modelBuilder.Entity<Movie>()
                .HasOne(m => m.CreatedBy)
                .WithMany(u => u.Movies)
                .HasForeignKey(m => m.Created_By)
                .OnDelete(DeleteBehavior.Restrict);

            // User - Showtime (Created_By) 
            modelBuilder.Entity<Showtime>()
                .HasOne(s => s.CreatedBy)
                .WithMany()
                .HasForeignKey(s => s.Created_By)
                .OnDelete(DeleteBehavior.Restrict);

            // User - Promotion (Created_By)
            modelBuilder.Entity<Promotion>()
                .HasOne(p => p.CreatedBy)
                .WithMany(u => u.Promotions)
                .HasForeignKey(p => p.Created_By)
                .OnDelete(DeleteBehavior.Restrict);

            // User - Payment (Processed_By)
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.ProcessedBy)
                .WithMany(u => u.ProcessedPayments)
                .HasForeignKey(p => p.Processed_By)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // User - TicketBooking
            modelBuilder.Entity<TicketBooking>()
                .HasOne(tb => tb.User)
                .WithMany(u => u.TicketBookings)
                .HasForeignKey(tb => tb.User_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // User - TicketBooking (Created_By)
            modelBuilder.Entity<TicketBooking>()
                .HasOne(tb => tb.CreatedBy)
                .WithMany()
                .HasForeignKey(tb => tb.Created_By)
                .OnDelete(DeleteBehavior.Restrict);

            // User - Score
            modelBuilder.Entity<Score>()
                .HasOne(s => s.User)
                .WithMany(u => u.Scores)
                .HasForeignKey(s => s.User_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // User - PointsRedemption
            modelBuilder.Entity<PointsRedemption>()
                .HasOne(pr => pr.User)
                .WithMany(u => u.PointsRedemptions)
                .HasForeignKey(pr => pr.User_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // User - MovieRating
            modelBuilder.Entity<MovieRating>()
                .HasOne(mr => mr.User)
                .WithMany(u => u.MovieRatings)
                .HasForeignKey(mr => mr.User_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // User - PromotionUsage
            modelBuilder.Entity<PromotionUsage>()
                .HasOne(pu => pu.User)
                .WithMany(u => u.PromotionUsages)
                .HasForeignKey(pu => pu.User_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // 2. Movie Relationships
            // Movie - Showtime
            modelBuilder.Entity<Showtime>()
                .HasOne(s => s.Movie)
                .WithMany(m => m.Showtimes)
                .HasForeignKey(s => s.Movie_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // Movie - MovieRating
            modelBuilder.Entity<MovieRating>()
                .HasOne(mr => mr.Movie)
                .WithMany(m => m.MovieRatings)
                .HasForeignKey(mr => mr.Movie_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // 3. CinemaRoom Relationships
            // CinemaRoom - SeatLayout
            modelBuilder.Entity<SeatLayout>()
                .HasOne(sl => sl.CinemaRoom)
                .WithMany(cr => cr.SeatLayouts)
                .HasForeignKey(sl => sl.Cinema_Room_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // CinemaRoom - Showtime
            modelBuilder.Entity<Showtime>()
                .HasOne(s => s.CinemaRoom)
                .WithMany(cr => cr.Showtimes)
                .HasForeignKey(s => s.Cinema_Room_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // 4. SeatLayout Relationships
            // SeatLayout - Seat
            modelBuilder.Entity<Seat>()
                .HasOne(s => s.SeatLayout)
                .WithMany(sl => sl.Seats)
                .HasForeignKey(s => s.Layout_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // 5. TicketBooking - Seat Relationship (MỚI)
            modelBuilder.Entity<Seat>()
                .HasOne(s => s.TicketBooking)
                .WithMany(tb => tb.Seats)
                .HasForeignKey(s => s.Booking_ID)
                .IsRequired(false)  // Cho phép null vì ghế có thể chưa được đặt
                .OnDelete(DeleteBehavior.Restrict);

            // Showtime - TicketBooking
            modelBuilder.Entity<TicketBooking>()
                .HasOne(tb => tb.Showtime)
                .WithMany(s => s.TicketBookings)
                .HasForeignKey(tb => tb.Showtime_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // 6. Seat Relationships
            // Seat - Ticket
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.Seat)
                .WithMany(s => s.Tickets)
                .HasForeignKey(t => t.Seat_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // 7. Promotion Relationships
            // Promotion - TicketBooking
            modelBuilder.Entity<TicketBooking>()
                .HasOne(tb => tb.Promotion)
                .WithMany(p => p.TicketBookings)
                .HasForeignKey(tb => tb.Promotion_ID)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Promotion - PromotionUsage
            modelBuilder.Entity<PromotionUsage>()
                .HasOne(pu => pu.Promotion)
                .WithMany(p => p.PromotionUsages)
                .HasForeignKey(pu => pu.Promotion_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // 8. TicketBooking Relationships
            // TicketBooking - Ticket
            modelBuilder.Entity<Ticket>()
                .HasOne(t => t.TicketBooking)
                .WithMany(tb => tb.Tickets)
                .HasForeignKey(t => t.Booking_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // TicketBooking - Payment
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.TicketBooking)
                .WithMany(tb => tb.Payments)
                .HasForeignKey(p => p.Booking_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // TicketBooking - BookingHistory
            modelBuilder.Entity<BookingHistory>()
                .HasOne(bh => bh.TicketBooking)
                .WithMany(tb => tb.BookingHistories)
                .HasForeignKey(bh => bh.Booking_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // TicketBooking - PromotionUsage
            modelBuilder.Entity<PromotionUsage>()
                .HasOne(pu => pu.TicketBooking)
                .WithMany(tb => tb.PromotionUsages)
                .HasForeignKey(pu => pu.Booking_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // Cấu hình index cho FailedLogin để tối ưu truy vấn
            modelBuilder.Entity<FailedLogin>()
                .HasIndex(fl => fl.User_ID);

            modelBuilder.Entity<FailedLogin>()
                .HasIndex(fl => fl.AttemptTime);

            modelBuilder.Entity<TicketPricing>()
                .HasIndex(p => new { p.Room_Type, p.Seat_Type })
                .IsUnique();

            // Cấu hình quan hệ cho UserPoints
            modelBuilder.Entity<UserPoints>()
                .HasOne(up => up.User)
                .WithMany()
                .HasForeignKey(up => up.User_ID)
                .OnDelete(DeleteBehavior.Cascade);

            // Cấu hình quan hệ cho PointsEarning
            modelBuilder.Entity<PointsEarning>()
                .HasOne(pe => pe.User)
                .WithMany()
                .HasForeignKey(pe => pe.User_ID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PointsEarning>()
                .HasOne(pe => pe.TicketBooking)
                .WithMany()
                .HasForeignKey(pe => pe.Booking_ID)
                .OnDelete(DeleteBehavior.Restrict);

            // Thêm index cho tối ưu truy vấn
            modelBuilder.Entity<UserPoints>()
                .HasIndex(up => up.User_ID)
                .IsUnique();  // Mỗi người dùng chỉ có một bản ghi tổng điểm

            modelBuilder.Entity<PointsEarning>()
                .HasIndex(pe => pe.User_ID);

            modelBuilder.Entity<PointsEarning>()
                .HasIndex(pe => pe.Booking_ID);

            modelBuilder.Entity<Seat>()
       .HasOne(s => s.Showtime)
       .WithMany(st => st.Seats)
       .HasForeignKey(s => s.Showtime_ID)
       .OnDelete(DeleteBehavior.Restrict);

            // Bổ sung navigation property trong Showtime
            modelBuilder.Entity<Showtime>()
                .HasMany(st => st.Seats)
                .WithOne(s => s.Showtime)
                .HasForeignKey(s => s.Showtime_ID);
        }
    }
}



