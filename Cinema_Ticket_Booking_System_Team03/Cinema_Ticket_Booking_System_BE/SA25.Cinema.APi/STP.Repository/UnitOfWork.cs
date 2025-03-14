using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Models;
using STP.Repositories;
using Microsoft.EntityFrameworkCore.Storage;
using STP.Repository.Repositories;

namespace sa25.Repository.Data
{
    // Lớp UnitOfWork triển khai mẫu Unit of Work để quản lý các giao dịch cơ sở dữ liệu
    // và cung cấp quyền truy cập tập trung đến tất cả các repository
    public class UnitOfWork : IDisposable
    {
        // Context cơ sở dữ liệu chính
        private readonly CinemaDbContext _context;
        // Logger để ghi lại các hoạt động
        private readonly ILogger _logger;
        // Đối tượng giao dịch cơ sở dữ liệu
        private IDbContextTransaction _transaction;

        // Khai báo các repository cụ thể - sử dụng lazy loading
        private UserRepository _userRepository;
        private MovieRepository _movieRepository;
        private CinemaRoomRepository _cinemaRoomRepository;
        private SeatLayoutRepository _seatLayoutRepository;
        private ShowtimeRepository _showtimeRepository;
        private SeatRepository _seatRepository;
        private PromotionRepository _promotionRepository;
        private TicketBookingRepository _ticketBookingRepository;
        private TicketRepository _ticketRepository;
        private PaymentRepository _paymentRepository;
        private ScoreRepository _scoreRepository;
        private BookingHistoryRepository _bookingHistoryRepository;
        private PromotionUsageRepository _promotionUsageRepository;
        private MovieRatingRepository _movieRatingRepository;
        private PointsRedemptionRepository _pointsRedemptionRepository;

        // Constructor - nhận database context và logger thông qua dependency injection
        public UnitOfWork(CinemaDbContext context, ILogger<UnitOfWork> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Properties truy cập các repository - sử dụng mẫu singleton cho mỗi repository
        // Mỗi property sử dụng toán tử null-coalescing để khởi tạo repository chỉ khi cần
        public UserRepository UserRepository =>
            _userRepository ??= new UserRepository(_context);

        public MovieRepository MovieRepository =>
            _movieRepository ??= new MovieRepository(_context);

        public CinemaRoomRepository CinemaRoomRepository =>
            _cinemaRoomRepository ??= new CinemaRoomRepository(_context);

        public SeatLayoutRepository SeatLayoutRepository =>
            _seatLayoutRepository ??= new SeatLayoutRepository(_context);

        public ShowtimeRepository ShowtimeRepository =>
            _showtimeRepository ??= new ShowtimeRepository(_context);

        public SeatRepository SeatRepository =>
            _seatRepository ??= new SeatRepository(_context);

        public PromotionRepository PromotionRepository =>
            _promotionRepository ??= new PromotionRepository(_context);

        public TicketBookingRepository TicketBookingRepository =>
            _ticketBookingRepository ??= new TicketBookingRepository(_context);

        public TicketRepository TicketRepository =>
            _ticketRepository ??= new TicketRepository(_context);

        public PaymentRepository PaymentRepository =>
            _paymentRepository ??= new PaymentRepository(_context);

        public ScoreRepository ScoreRepository =>
            _scoreRepository ??= new ScoreRepository(_context);

        public BookingHistoryRepository BookingHistoryRepository =>
            _bookingHistoryRepository ??= new BookingHistoryRepository(_context);

        public PromotionUsageRepository PromotionUsageRepository =>
            _promotionUsageRepository ??= new PromotionUsageRepository(_context);

        public MovieRatingRepository MovieRatingRepository =>
            _movieRatingRepository ??= new MovieRatingRepository(_context);

        public PointsRedemptionRepository PointsRedemptionRepository =>
            _pointsRedemptionRepository ??= new PointsRedemptionRepository(_context);

        // Phương thức bắt đầu giao dịch cơ sở dữ liệu mới
        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        // Phương thức lưu thay đổi và commit giao dịch
        public async Task CommitAsync()
        {
            // Kiểm tra xem giao dịch đã được bắt đầu chưa
            if (_transaction == null) throw new InvalidOperationException("No transaction started.");
            // Lưu các thay đổi vào cơ sở dữ liệu
            await _context.SaveChangesAsync();
            // Commit giao dịch
            await _transaction.CommitAsync();
        }

        // Phương thức rollback giao dịch khi có lỗi
        public async Task RollbackAsync()
        {
            // Chỉ rollback nếu giao dịch đã tồn tại
            if (_transaction == null) return;
            await _transaction.RollbackAsync();
        }

        // Phương thức giải phóng tài nguyên - triển khai từ interface IDisposable
        public void Dispose()
        {
            // Giải phóng giao dịch nếu có
            _transaction?.Dispose();
            // Giải phóng database context
            _context.Dispose();
        }
    }
}
