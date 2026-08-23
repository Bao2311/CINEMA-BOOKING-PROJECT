// Định nghĩa kiểu dữ liệu UserProfile
export interface UserProfile {
    full_Name: string;
    email: string;
    phone_Number: string;
    address: string;
    date_Of_Birth: string;
    sex: string;
    memberSince?: string;
    membershipLevel?: string;
    loyaltyPoints?: number;
    profilePicture?: string;
  }
  
  // Định nghĩa kiểu dữ liệu Booking
  export interface Booking {
    id: string;
    movieTitle: string;
    showtime: string;
    cinema: string;
    totalAmount: number;
    bookingDate: string;
    status: 'Pending' | 'Cancelled' | 'Confirmed';
    paymentMethod?: string | null;
    cancellationDate?: string | null;
  }
  
  // Định nghĩa kiểu dữ liệu cho API response
  export interface ApiBooking {
    $id: string;
    booking_ID: number;
    booking_Date: string;
    total_Amount: number;
    status: 'Pending' | 'Cancelled' | 'Confirmed';
    payment_Method: string | null;
    payment_Date: string | null;
    cancellation_Date: string | null;
    showtime: {
      $id: string;
      showtime_ID: number;
      show_Date: string;
      start_Time: string;
      room: {
        $id: string;
        cinema_Room_ID: number;
        room_Name: string;
        room_Type: string;
      };
      movie: {
        $id: string;
        movie_ID: number;
        movie_Name: string;
        duration: number;
        rating: string;
        poster_URL: string;
      };
    };
    user_ID: number;
  }
  
  export interface Notification {
    id: string;
    title: string;
    message: string;
    date: string;
    isRead: boolean;
    type: 'promo' | 'system' | 'booking';
  }
  
  // Thêm các interface mới
  export interface TicketSeatInfo {
    seat_ID: number;
    row_Label: string;
    column_Number: number;
    seat_Type: string;
    seatLabel: string;
  }
  
  export interface TicketMovieInfo {
    movie_ID: number;
    movie_Name: string;
    duration: number;
    rating: string;
  }
  
  export interface TicketShowtimeInfo {
    showtime_ID: number;
    showDate: string;
    startTime: string;
    endTime: string;
  }
  
  export interface TicketCinemaRoomInfo {
    cinema_Room_ID: number;
    room_Name: string;
    room_Type: string;
  }
  
  export interface TicketPriceInfo {
    base_Price: number;
    discount_Amount: number;
    final_Price: number;
  }
  
  export interface TicketDetail {
    ticket_ID: number;
    booking_ID: number;
    ticket_Code: string;
    seatInfo: TicketSeatInfo;
    movieInfo: TicketMovieInfo;
    showtimeInfo: TicketShowtimeInfo;
    cinemaRoomInfo: TicketCinemaRoomInfo;
    priceInfo: TicketPriceInfo;
    is_Checked_In: boolean;
    checkInTime: string | null;
  }
