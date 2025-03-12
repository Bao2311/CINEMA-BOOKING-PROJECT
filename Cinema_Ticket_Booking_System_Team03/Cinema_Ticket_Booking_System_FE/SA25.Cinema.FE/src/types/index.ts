export interface User {
  id: number; // User_ID từ API
  fullName?: string; // Full_Name từ API
  email?: string; // Email từ API
  password?: string; // Password từ API (Có thể không lưu mật khẩu trong frontend)
  role?: 'Admin' | 'Manager' | 'Staff' | 'Customer'|string; // Role từ API (có thể linh hoạt với string)
  department?: string; // Department từ API
  hireDate?: string; // Hire_Date từ API
  dateOfBirth?: string; // Date_Of_Birth từ API
  sex?: string; // Sex từ API
  phoneNumber?: string; // Phone_Number từ API
  address?: string; // Address từ API
  accountStatus?: string; // Account_Status từ API
  createdAt?: string; // Created_At từ API
  lastLogin?: string; // Last_Login từ API
  ticketBookings?: TicketBooking[]; // Các ticket bookings của user
  movies?: Movie[]; // Movies mà user đã tạo
  promotions?: Promotion[]; // Promotions mà user đã tạo
  movieRatings?: MovieRating[]; // Ratings của user
  scores?: Score[]; // Scores của user
  pointsRedemptions?: PointsRedemption[]; // PointsRedemption của user
  promotionUsages?: PromotionUsage[]; // PromotionUsages của user
  processedPayments?: Payment[]; // Payments mà user đã xử lý
}

export interface TicketBooking {
  bookingId: number; // Booking_ID
  userId: number; // User_ID
  showtimeId: number; // Showtime_ID
  promotionId?: number; // Promotion_ID (nullable)
  bookingDate: string; // Booking_Date (DateTime as string)
  paymentDeadline: string; // Payment_Deadline (DateTime as string)
  totalAmount: number; // Total_Amount
  pointsEarned: number; // Points_Earned
  pointsUsed: number; // Points_Used
  status: 'Pending' | 'Confirmed' | 'Cancelled'; // Status
  createdBy: number; // Created_By (User ID)
  
  // Navigation Properties
  user?: User; // User associated with the booking
  showtime?: Showtime; // Showtime associated with the booking
  promotion?: Promotion; // Promotion associated with the booking
  createdByUser?: User; // User who created the booking
  tickets?: Ticket[]; // List of tickets for this booking
  payments?: Payment[]; // List of payments for this booking
  bookingHistories?: BookingHistory[]; // List of booking histories
  promotionUsages?: PromotionUsage[]; // List of promotion usages
}
export interface BookingHistory {
  bookingHistoryId: number; // Booking_History_ID
  bookingId: number; // Booking_ID
  date: string; // Date (DateTime as string)
  status: string; // Status

  // Navigation Property
  ticketBooking?: TicketBooking; // Associated TicketBooking
}
export interface Movie {
  id: number; // Movie_ID từ API
  name: string; // Movie_Name từ API
  releaseDate: string; // Release_Date từ API (dạng string hoặc Date)
  endDate?: string; // End_Date từ API (dạng string hoặc Date, có thể null)
  productionCompany: string; // Production_Company từ API
  director: string; // Director từ API
  cast: string; // Cast từ API
  duration: number; // Duration từ API (dữ liệu kiểu số nguyên, minutes)
  genre: string; // Genre từ API (một chuỗi)
  rating: string; // Rating từ API (một chuỗi)
  language: string; // Language từ API
  country: string; // Country từ API
  synopsis: string; // Synopsis từ API (tóm tắt nội dung phim)
  posterUrl: string; // Poster_URL từ API (URL của poster phim)
  trailerLink: string; // Trailer_Link từ API (URL của trailer)
  status: string; // Status từ API (mặc định là "Coming Soon")
  createdBy: number; // Created_By từ API (ID của người tạo)
  createdAt: string; // Created_At từ API (Ngày tạo)
  updatedAt: string; // Updated_At từ API (Ngày cập nhật)
  createdByUser?: User; // CreatedBy là một đối tượng User (dữ liệu của người tạo)
  showtimes?: Showtime[]; // Showtimes liên quan đến phim này
  movieRatings?: MovieRating[]; // MovieRatings (đánh giá của phim)
}

export interface Promotion {
  promotionId: number; // Promotion_ID
  title: string; // Title
  promotionCode: string; // Promotion_Code
  startDate: string; // Start_Date (DateTime as string)
  endDate: string; // End_Date (DateTime as string)
  discountType: string; // Discount_Type (e.g., percentage or amount)
  discountValue: number; // Discount_Value
  minimumPurchase: number; // Minimum_Purchase
  maximumDiscount?: number; // Maximum_Discount (optional)
  applicableFor: string; // Applicable_For (e.g., movie tickets, products)
  usageLimit?: number; // Usage_Limit (optional)
  currentUsage: number; // Current_Usage
  status: 'Active' | 'Inactive'; // Status
  promotionDetail: string; // Promotion_Detail
  createdBy: number; // Created_By (User_ID of the creator)
  createdAt: string; // Created_At (DateTime as string)

  // Navigation Properties
  createdByUser?: User; // User who created the promotion
  ticketBookings?: TicketBooking[]; // List of TicketBookings that used this promotion
  promotionUsages?: PromotionUsage[]; // List of PromotionUsages
}

export interface MovieRating {
  ratingId: number; // Rating_ID
  movieId: number; // Movie_ID
  userId: number; // User_ID
  rating: number; // Rating (1 to 5)
  comment: string; // Comment
  ratingDate: string; // Rating_Date (DateTime as string)
  isVerified: boolean; // Is_Verified (true or false)

  // Navigation Properties
  movie: Movie; // The movie that is being rated
  user: User; // The user who gave the rating
}

export interface Score {
  scoreId: number; // Score_ID
  userId: number; // User_ID
  pointsAdded: number; // Points_Added
  pointsUsed: number; // Points_Used
  date: string; // Date (DateTime as string)

  // Navigation Property
  user: User; // The user associated with the score
}

export interface PointsRedemption {
  // Thêm các thuộc tính của PointsRedemption nếu cần
}

export interface PromotionUsage {
  // Thêm các thuộc tính của PromotionUsage nếu cần
}

export interface Payment {
  // Thêm các thuộc tính của Payment nếu cần
}




export interface Showtime {
  id: number; // Showtime_ID
  movieId: number; // Movie_ID
  cinemaRoomId: number; // Cinema_Room_ID
  showDate: string; // Show_Date (DateTime as string)
  startTime: string; // Start_Time (TimeSpan as string)
  endTime: string; // End_Time (TimeSpan as string)
  priceTier: string; // Price_Tier
  basePrice: number; // Base_Price
  status: 'Scheduled' | 'Completed' | 'Cancelled'; // Status
  capacityAvailable: number; // Capacity_Available
  createdBy: number; // Created_By (User ID)
  createdAt: string; // Created_At (DateTime as string)
  updatedAt: string; // Updated_At (DateTime as string)

  // Navigation Properties
  movie?: Movie; // Movie associated with the Showtime
  cinemaRoom?: CinemaRoom; // Cinema Room where the Showtime is scheduled
  createdByUser?: User; // User who created the Showtime
  seats?: Seat[]; // List of seats for this Showtime
  ticketBookings?: TicketBooking[]; // List of bookings for this Showtime
}

export interface CinemaRoom {
  id: number; // Cinema_Room_ID từ API
  roomName: string; // Room_Name từ API
  seatQuantity: number; // Seat_Quantity từ API
  roomType: string; // Room_Type từ API
  status: string; // Status từ API (mặc định là "Active")
  notes?: string; // Notes từ API (có thể null hoặc không có)
  seatLayouts?: SeatLayout[]; // SeatLayouts liên quan đến CinemaRoom
  showtimes?: Showtime[]; // Showtimes liên quan đến CinemaRoom
}
export interface SeatLayout {
  id: number; // Layout_ID từ API
  cinemaRoomId: number; // Cinema_Room_ID từ API
  rowLabel: string; // Row_Label từ API
  columnNumber: number; // Column_Number từ API
  seatType: string; // Seat_Type từ API (mặc định là "Regular")
  isActive: boolean; // Is_Active từ API (mặc định là true)
  cinemaRoom?: CinemaRoom; // CinemaRoom liên quan đến SeatLayout
  seats?: Seat[]; // Mảng các Seat liên quan đến SeatLayout
}
export interface Seat {
  id: number; // Seat_ID từ API
  layoutId: number; // Layout_ID từ API
  showtimeId: number; // Showtime_ID từ API
  seatStatus: 'Available' | 'Booked' | 'Selected' | 'Reserved'; // Seat_Status từ API, với các trạng thái khác nhau
  lastUpdated: string; // Last_Updated từ API (dưới dạng DateTime, có thể chuyển thành string)
  seatLayout?: SeatLayout; // Mối quan hệ với SeatLayout
  showtime?: Showtime; // Mối quan hệ với Showtime
  tickets?: Ticket[]; // Mảng Ticket, có thể chứa nhiều vé liên quan đến Seat này
}
export interface Ticket {
  id: number; // Ticket_ID
  bookingId: number; // Booking_ID
  seatId: number; // Seat_ID
  basePrice: number; // Base_Price
  discountAmount: number; // Discount_Amount
  finalPrice: number; // Final_Price
  ticketCode: string; // Ticket_Code
  isCheckedIn: boolean; // Is_Checked_In
  checkInTime: string | null; // Check_In_Time (dưới dạng DateTime, có thể chuyển thành string ISO hoặc null)
  
  // Navigation Properties
  ticketBooking?: TicketBooking; // Mối quan hệ với TicketBooking
  seat?: Seat; // Mối quan hệ với Seat
}
export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  seats: string[]; // array of seat IDs
  totalPrice: number;
  bookingDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  promotionId?: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  code: string;
  isActive: boolean;
}


export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}