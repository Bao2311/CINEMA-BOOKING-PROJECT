using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STP.Repository.Data;
using STP.Repository.Models;
using STP.Repositories;
using Microsoft.EntityFrameworkCore.Storage;

namespace sa25.Repository.Data
{
    public class UnitOfWork : IDisposable
    {
        private readonly CinemaDbContext _context;
        private readonly ILogger _logger;
        private IDbContextTransaction _transaction;

        // Khai báo các repository cụ thể
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

        // Constructor
        public UnitOfWork(CinemaDbContext context, ILogger<UnitOfWork> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Repository properties
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

        // Phương thức bắt đầu giao dịch
        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        // Phương thức cam kết giao dịch
        public async Task CommitAsync()
        {
            if (_transaction == null) throw new InvalidOperationException("No transaction started.");
            await _context.SaveChangesAsync();
            await _transaction.CommitAsync();
        }

        // Phương thức rollback giao dịch
        public async Task RollbackAsync()
        {
            if (_transaction == null) return;
            await _transaction.RollbackAsync();
        }

        // Phương thức hủy giao dịch
        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}
