import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'antd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Styles from './Styles';

// Define interfaces with proper typing
interface SeatType {
  id: string;
  row: string;
  number: number;
  price: number;
  isBooked: boolean;
  seatType: 'standard' | 'premium' | 'vip';
  section: 'left' | 'center' | 'right';
  seat_ID?: number;
  isActive: boolean;
}

interface MovieDetails {
  movie_ID: number;
  movie_Name: string;
  release_Date: string;
  end_Date: string;
  production_Company: string;
  director: string;
  cast: string;
  duration: number;
  genre: string;
  rating: string;
  language: string;
  country: string;
  synopsis: string;
  poster_URL: string;
  trailer_Link: string;
  status: string;
  created_By: number;
  created_At: string;
  updated_At: string;
}

interface ShowtimeDetails {
  showtime_ID: number;
  movie_ID: number;
  cinema_Room_ID: number;
  room_Name: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
}

interface Seat {
  layout_ID: number;
  row_Label: string;
  column_Number: number;
  seat_Type: string;
  is_Active: boolean;
}

interface Row {
  row: string;
  seats: { $values: Seat[] };
}

interface SeatStatus {
  seat_ID: number;
  seat: null;
  row_Name: string;
  seat_Number: number;
  seat_Type: string;
  price: number;
  seat_Status: 'Available' | 'Reserved' | 'Unavailable' | 'Sold';
  layout_ID: number;
}

interface SeatProps {
  seat: SeatType;
  isSelected: boolean;
  onSelect: (seat: SeatType) => void;
  seatSize?: 'small' | 'medium' | 'large';
}

interface BookingRequest {
  showtime_ID: number;
  seat_IDs: number[];
  payment_Method: string;
}

const Seat: React.FC<SeatProps> = ({ seat, isSelected, onSelect, seatSize = 'medium' }) => (
  <Styles.SeatButton
    $isBooked={seat.isBooked}
    $isSelected={isSelected}
    $seatType={seat.seatType}
    $seatSize={seatSize}
    onClick={() => onSelect(seat)}
    disabled={seat.isBooked || !seat.isActive}
    aria-label={`Seat ${seat.id}, ${seat.seatType} seat, ${seat.isBooked ? 'booked' : seat.isActive ? 'available' : 'inactive'}`}
    whileHover={!seat.isBooked && seat.isActive ? { y: -3, scale: 1.05 } : {}}
    whileTap={!seat.isBooked && seat.isActive ? { scale: 0.95 } : {}}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{ visibility: seat.isActive ? 'visible' : 'hidden' }}
  >
    <Styles.SeatContent>
      <Styles.SeatNumber>{seat.id}</Styles.SeatNumber>
      {!seat.isBooked && !isSelected && seat.isActive && <Styles.SeatPrice>{seat.price}k</Styles.SeatPrice>}
      {isSelected && <Styles.CheckMark>✓</Styles.CheckMark>}
    </Styles.SeatContent>
  </Styles.SeatButton>
);

const CinemaRoomPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const query = new URLSearchParams(useLocation().search);
  const movieId = query.get('movieId');
  const navigate = useNavigate();

  const [selectedSeats, setSelectedSeats] = useState<SeatType[]>([]);
  const [seats, setSeats] = useState<SeatType[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [step, setStep] = useState<'select' | 'payment' | 'confirmation'>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [showtimeDetails, setShowtimeDetails] = useState<ShowtimeDetails | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [pointsToUse, setPointsToUse] = useState<string>('');
  const [discountedTotal, setDiscountedTotal] = useState<number | null>(null);
  const [totalPointsUsed, setTotalPointsUsed] = useState<number>(0);
  const [promotionCode, setPromotionCode] = useState<string>('');
  const [newTotal, setNewTotal] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://localhost:7168/api/Movie/${movieId}`);
        setMovieDetails(response.data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        toast.error("Không thể tải thông tin phim. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId) fetchMovieDetails();
  }, [movieId]);

  useEffect(() => {
    const fetchShowtimeDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://localhost:7168/api/Showtimes/${showtimeId}`);
        setShowtimeDetails(response.data);
      } catch (error) {
        console.error("Error fetching showtime details:", error);
        toast.error("Không thể tải thông tin suất chiếu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    if (showtimeId) fetchShowtimeDetails();
  }, [showtimeId]);

  useEffect(() => {
    const fetchSeatLayoutAndStatus = async () => {
      if (!showtimeDetails?.cinema_Room_ID || !showtimeId) return;
      setIsLoading(true);
      const token = localStorage.getItem('token');

      try {
        const layoutResponse = await axios.get(`https://localhost:7168/api/SeatLayout/room/${showtimeDetails.cinema_Room_ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusResponse = await axios.get(`https://localhost:7168/api/Seat/showtime/${showtimeId}`);

        const seatStatusMap: Record<string, SeatStatus> = {};
        statusResponse.data.seats.$values.forEach((seat: SeatStatus) => {
          const seatId = `${seat.row_Name}${seat.seat_Number}`;
          seatStatusMap[seatId] = seat;
        });

        const mappedSeats: SeatType[] = layoutResponse.data.rows.$values.flatMap((row: Row) =>
          row.seats.$values.map((seat: Seat) => {
            const seatId = `${seat.row_Label}${seat.column_Number}`;
            const status = seatStatusMap[seatId];
            const isBooked = (status && (status.seat_Status === 'Reserved' || status.seat_Status === 'Unavailable' || status.seat_Status === 'Sold'));

            return {
              id: seatId,
              row: seat.row_Label,
              number: seat.column_Number,
              price: status ? status.price / 1000 : (seat.seat_Type.toLowerCase() === 'vip' ? 150 : 100),
              isBooked,
              seatType: seat.seat_Type.toLowerCase() === 'vip' ? 'vip' : 'standard',
              section: seat.column_Number <= layoutResponse.data.dimensions.columns / 3 ? 'left' : seat.column_Number > (layoutResponse.data.dimensions.columns * 2) / 3 ? 'right' : 'center',
              seat_ID: status ? status.seat_ID : undefined,
              isActive: seat.is_Active
            };
          })
        );

        setSeats(mappedSeats);
      } catch (error) {
        console.error('Error fetching seat layout or status:', error);
        toast.error('Không thể tải sơ đồ ghế. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    if (showtimeDetails) fetchSeatLayoutAndStatus();
  }, [showtimeDetails, showtimeId]);

  const handleSeatSelect = (seat: SeatType) => {
    if (seat.isBooked) return;
    setSelectedSeats(prev => {
      const isAlreadySelected = prev.some(s => s.id === seat.id);
      if (isAlreadySelected) return prev.filter(s => s.id !== seat.id);
      if (prev.length >= 8) {
        toast.warning('Bạn chỉ có thể chọn tối đa 8 ghế mỗi lần');
        return prev;
      }
      return [...prev, seat];
    });
  };

  useEffect(() => {
    const price = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    setTotalPrice(price);
  }, [selectedSeats]);

  useEffect(() => {
    if (step === 'payment' && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            handlePaymentTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [step, countdown]);

  const handlePaymentTimeout = async () => {
    if (bookingId) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `https://localhost:7168/api/Booking/${bookingId}/cancel`,
          { id: bookingId },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        toast.info('Đã hết thời gian thanh toán. Vé của bạn đã bị hủy.');
        navigate('/showtimes');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        toast.error('Có lỗi xảy ra khi hủy vé. Vui lòng thử lại.');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const sendBookingRequest = async () => {
    if (selectedSeats.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một ghế');
      return false;
    }

    const seat_IDs = selectedSeats
      .map(seat => seat.seat_ID)
      .filter((id): id is number => id !== undefined);

    if (seat_IDs.length !== selectedSeats.length) {
      console.error('Some selected seats do not have seat_ID');
      toast.error('Có lỗi xảy ra với thông tin ghế. Vui lòng thử lại.');
      window.location.reload(); // Reload the page on error
      return false;
    }

    const bookingData: BookingRequest = {
      showtime_ID: Number(showtimeId),
      seat_IDs: seat_IDs,
      payment_Method: "PayOS",
    };

    try {
      setIsLoading(true);
      setTotalPointsUsed(0); // Reset total points used when creating a new booking
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'https://localhost:7168/api/Booking/',
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const bookingIdFromResponse = response.data.booking_ID;
      setBookingId(bookingIdFromResponse);
      console.log('Booking successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      const errorMessage = error.response?.data?.message || 'Không thể tạo đặt vé. Vui lòng thử lại sau.';
      toast.error(errorMessage);
      setTimeout(() => window.location.reload(), 2000); // Reload the page after showing error message
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeBooking = async () => {
    if (step === 'select') {
      if (selectedSeats.length === 0) {
        toast.warning('Vui lòng chọn ít nhất một ghế');
        return;
      }
      setShowConfirm(true);
      return;
    }

    if (step === 'payment') {
      try {
        setIsLoading(true);
        const payosResponse = await axios.post(
          'https://localhost:7168/api/payos/create',
          { bookingId: bookingId },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const { paymentUrl } = payosResponse.data;
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          throw new Error('Không nhận được paymentUrl từ API');
        }
      } catch (error) {
        console.error('Error creating payment link:', error);
        toast.error('Không thể tạo liên kết thanh toán. Vui lòng thử lại.');
        setTimeout(() => window.location.reload(), 2000); // Reload the page after showing error message
        setIsLoading(false);
      }
      return;
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    setShowConfirm(false);
    if (confirmed) {
      const success = await sendBookingRequest();
      if (success) {
        setStep('payment');
      }
    }
  };

  const seatsByRowAndSection = useMemo(() => {
    const groupedSeats: Record<string, Record<string, SeatType[]>> = {};
    seats.forEach(seat => {
      if (!groupedSeats[seat.row]) groupedSeats[seat.row] = { left: [], center: [], right: [] };
      groupedSeats[seat.row][seat.section].push(seat);
    });
    return groupedSeats;
  }, [seats]);

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!userId || !token) {
        console.error('User ID or token not found');
        return;
      }

      const response = await axios.get(`https://localhost:7168/api/Points/my-points`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data && typeof response.data.total_Points === 'number') {
        setUserPoints(response.data.total_Points);
        console.log('Points fetched:', response.data.total_Points);
      } else {
        console.error('Invalid points data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  useEffect(() => {
    if (step === 'payment') {
      fetchUserPoints();
    }
  }, [step]);

  const handleApplyPoints = async () => {
    try {
      const points = parseInt(pointsToUse);
      if (isNaN(points)) {
        toast.warning('Vui lòng nhập số điểm hợp lệ');
        return;
      }
      
      if (points % 1000 !== 0) {
        toast.warning('Số điểm sử dụng phải là bội của 1000');
        return;
      }

      if (points < 0 || points > userPoints) {
        toast.error('Số điểm không hợp lệ');
        return;
      }

      // Calculate maximum points allowed (50% of total bill)
      const maxAllowedPoints = Math.floor(totalPrice * 1000 * 0.5);
      const remainingAllowedPoints = maxAllowedPoints - totalPointsUsed;
      
      if (points > remainingAllowedPoints) {
        toast.warning(`Bạn chỉ có thể sử dụng tối đa ${remainingAllowedPoints.toLocaleString('vi-VN')} điểm (50% tổng hóa đơn)`);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://localhost:7168/api/Points/booking/${bookingId}/apply-discount`,
        points,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setDiscountedTotal(response.data.discountedTotalAmount / 1000);
      setUserPoints(response.data.currentPoints);
      setTotalPointsUsed(prev => prev + points); // Track total points used
      setPointsToUse('');
      toast.success(`Áp dụng ${points.toLocaleString('vi-VN')} điểm thành công!`);
    } catch (error) {
      console.error('Error applying points:', error);
      toast.error('Không thể áp dụng điểm. Vui lòng thử lại.');
    }
  };

  const handleApplyPromotion = async () => {
    try {
      if (!promotionCode.trim()) {
        toast.warning('Vui lòng nhập mã khuyến mãi');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'https://localhost:7168/api/Promotion/apply',
        {
          bookingId: bookingId,
          promotionCode: promotionCode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setNewTotal(response.data.new_total / 1000); // Chuyển đổi sang đơn vị k
        toast.success('Áp dụng mã khuyến mãi thành công!');
      } else {
        toast.error(response.data.message || 'Mã khuyến mãi không hợp lệ');
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      toast.error('Không thể áp dụng mã khuyến mãi. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <Styles.GlobalStyle />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <Styles.PageContainer>
        <Styles.BookingSection>
          <Styles.StepsIndicator>
            <Styles.Step $active={step === 'select'}>
              <Styles.StepNumber $active={step === 'select'}>1</Styles.StepNumber>
              <Styles.StepLabel>Chọn ghế</Styles.StepLabel>
            </Styles.Step>
            <Styles.StepConnector />
            <Styles.Step $active={step === 'payment'}>
              <Styles.StepNumber $active={step === 'payment'}>2</Styles.StepNumber>
              <Styles.StepLabel>Thanh toán</Styles.StepLabel>
            </Styles.Step>
          </Styles.StepsIndicator>
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Styles.MovieInfoCard>
                  <Styles.MovieInfoContent>
                    {isLoading ? (
                      <Styles.LoadingContainer>
                        <Styles.LoadingSpinner />
                        <Styles.LoadingText>Đang tải thông tin phim...</Styles.LoadingText>
                      </Styles.LoadingContainer>
                    ) : (
                      <>
                        <Styles.MoviePoster src={movieDetails?.poster_URL} alt={movieDetails?.movie_Name} />
                        <Styles.MovieDetails>
                          <h2>{movieDetails?.movie_Name}</h2>
                          <Styles.MovieMetaInfo>
                            <Styles.MetaItem><Styles.MetaLabel>Thể loại:</Styles.MetaLabel> {movieDetails?.genre}</Styles.MetaItem>
                            <Styles.MetaItem><Styles.MetaLabel>Thời gian:</Styles.MetaLabel> {movieDetails?.duration} phút</Styles.MetaItem>
                            <Styles.MetaItem><Styles.MetaLabel>Ngôn ngữ:</Styles.MetaLabel> {movieDetails?.language}</Styles.MetaItem>
                            <Styles.MetaItem><Styles.MetaLabel>Xếp hạng:</Styles.MetaLabel> {movieDetails?.rating}</Styles.MetaItem>
                            <Styles.MetaItem><Styles.MetaLabel>Suất chiếu:</Styles.MetaLabel> {showtimeDetails?.room_Name} - {showtimeDetails?.start_Time}</Styles.MetaItem>
                          </Styles.MovieMetaInfo>
                        </Styles.MovieDetails>
                      </>
                    )}
                  </Styles.MovieInfoContent>
                </Styles.MovieInfoCard>
                <Styles.CinemaContainer ref={screenRef}>
                  {isLoading ? (
                    <Styles.LoadingContainer>
                      <Styles.LoadingSpinner />
                      <Styles.LoadingText>Đang tải sơ đồ phòng chiếu...</Styles.LoadingText>
                    </Styles.LoadingContainer>
                  ) : (
                    <>
                      <Styles.Screen><Styles.ScreenText>MÀN HÌNH</Styles.ScreenText></Styles.Screen>
                      <Styles.SeatingArea>
                        {Object.entries(seatsByRowAndSection).map(([rowName, sections], rowIndex) => (
                          <Styles.RowContainer key={rowName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: rowIndex * 0.05 }}>
                            <Styles.RowLabel>{rowName}</Styles.RowLabel>
                            <Styles.SectionContainer>
                              <Styles.SeatsSection>
                                {sections.left.map(seat => (
                                  <Seat key={seat.id} seat={seat} isSelected={selectedSeats.some(s => s.id === seat.id)} onSelect={handleSeatSelect} seatSize={seat.seatType === 'vip' ? 'large' : 'medium'} />
                                ))}
                              </Styles.SeatsSection>
                              <Styles.Aisle />
                              <Styles.SeatsSection>
                                {sections.center.map(seat => (
                                  <Seat key={seat.id} seat={seat} isSelected={selectedSeats.some(s => s.id === seat.id)} onSelect={handleSeatSelect} seatSize={seat.seatType === 'vip' ? 'large' : 'medium'} />
                                ))}
                              </Styles.SeatsSection>
                              <Styles.Aisle />
                              <Styles.SeatsSection>
                                {sections.right.map(seat => (
                                  <Seat key={seat.id} seat={seat} isSelected={selectedSeats.some(s => s.id === seat.id)} onSelect={handleSeatSelect} seatSize={seat.seatType === 'vip' ? 'large' : 'medium'} />
                                ))}
                              </Styles.SeatsSection>
                            </Styles.SectionContainer>
                            <Styles.RowLabel>{rowName}</Styles.RowLabel>
                          </Styles.RowContainer>
                        ))}
                      </Styles.SeatingArea>
                      <Styles.SeatLegend>
                        <Styles.LegendItem><Styles.ColorBox $color="#3b82f6" /><span>Ghế thường</span></Styles.LegendItem>
                        <Styles.LegendItem><Styles.ColorBox $color="#ef4444" /><span>Ghế VIP</span></Styles.LegendItem>
                        <Styles.LegendItem><Styles.ColorBox $color="#28a745" /><span>Đã chọn</span></Styles.LegendItem>
                        <Styles.LegendItem><Styles.ColorBox $color="#6c757d" /><span>Đã đặt</span></Styles.LegendItem>
                      </Styles.SeatLegend>
                    </>
                  )}
                </Styles.CinemaContainer>
              </motion.div>
            )}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                <Styles.PaymentContainer>
                  <Styles.PaymentHeader>
                    Hoàn tất đặt vé
                    <Styles.CountdownTimer $warning={countdown <= 60}>
                      Thời gian còn lại: {formatTime(countdown)}
                    </Styles.CountdownTimer>
                  </Styles.PaymentHeader>
                  <Styles.PaymentGrid>
                    <Styles.OrderSummary>
                      <Styles.SummaryTitle>Thông tin đặt vé</Styles.SummaryTitle>
                      <Styles.SummaryItem><span>Phim</span><span>{movieDetails?.movie_Name}</span></Styles.SummaryItem>
                      <Styles.SummaryItem><span>Suất chiếu</span><span>{showtimeDetails?.room_Name} - {showtimeDetails?.start_Time}</span></Styles.SummaryItem>
                      <Styles.SummaryItem><span>Ghế</span><span>{selectedSeats.map(s => s.id).join(', ')}</span></Styles.SummaryItem>
                      <Styles.SummaryItem>
                        <span>Điểm tích lũy của bạn</span>
                        <span>{userPoints.toLocaleString('vi-VN')} điểm</span>
                      </Styles.SummaryItem>
                      <Styles.PointsInputContainer>
                        <Styles.PointsInput
                          type="number"
                          value={pointsToUse}
                          onChange={(e) => setPointsToUse(e.target.value)}
                          placeholder="Nhập số điểm muốn sử dụng"
                          min="0"
                          max={Math.min(userPoints, Math.floor(totalPrice * 1000 * 0.5) - totalPointsUsed)}
                          step="1000"
                        />
                        <Styles.ApplyPointsButton
                          onClick={handleApplyPoints}
                          disabled={!pointsToUse || parseInt(pointsToUse) > userPoints}
                        >
                          Xác nhận dùng
                        </Styles.ApplyPointsButton>
                      </Styles.PointsInputContainer>
                      <Styles.SummaryItem>
                        <span>Đã sử dụng</span>
                        <span>{totalPointsUsed.toLocaleString('vi-VN')} / {Math.floor(totalPrice * 1000 * 0.5).toLocaleString('vi-VN')} điểm (50% hóa đơn)</span>
                      </Styles.SummaryItem>
                      <Styles.PromotionContainer>
                        <Styles.PromotionInput
                          type="text"
                          value={promotionCode}
                          onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                          placeholder="Nhập mã khuyến mãi"
                        />
                        <Styles.ApplyPromotionButton
                          onClick={handleApplyPromotion}
                          disabled={!promotionCode.trim()}
                        >
                          Áp dụng
                        </Styles.ApplyPromotionButton>
                      </Styles.PromotionContainer>
                      <Styles.SummaryDivider />
                      <Styles.SeatTypeSummary>
                        {['standard', 'vip'].map(type => {
                          const seatsOfType = selectedSeats.filter(s => s.seatType === type);
                          if (seatsOfType.length === 0) return null;
                          const subtotal = seatsOfType.reduce((sum, seat) => sum + seat.price, 0);
                          return (
                            <Styles.SummaryItem key={type}>
                              <span>{type === 'standard' ? 'Ghế thường' : 'Ghế VIP'} ({seatsOfType.length})</span>
                              <span>{(subtotal * 1000).toLocaleString('vi-VN')} VNĐ</span>
                            </Styles.SummaryItem>
                          );
                        })}
                      </Styles.SeatTypeSummary>
                      <Styles.SummaryDivider />
                      <Styles.PriceCalculation>
                        <Styles.CalculationItem>
                          <span>Giá gốc:</span>
                          <span>{(totalPrice * 1000).toLocaleString('vi-VN')} VNĐ</span>
                        </Styles.CalculationItem>
                        
                        {discountedTotal && discountedTotal < totalPrice && (
                          <Styles.CalculationItem>
                            <span>Giảm giá từ điểm:</span>
                            <span>-{((totalPrice - discountedTotal) * 1000).toLocaleString('vi-VN')} VNĐ</span>
                          </Styles.CalculationItem>
                        )}
                        
                        {newTotal && newTotal < (discountedTotal || totalPrice) && (
                          <Styles.CalculationItem>
                            <span>Giảm giá từ mã khuyến mãi:</span>
                            <span>-{(((discountedTotal || totalPrice) - newTotal) * 1000).toLocaleString('vi-VN')} VNĐ</span>
                          </Styles.CalculationItem>
                        )}
                        
                        <Styles.SummaryDivider />
                        
                        <Styles.SummaryItem $total>
                          <span>Tổng cộng:</span>
                          <span>{((newTotal || discountedTotal || totalPrice) * 1000).toLocaleString('vi-VN')} VNĐ</span>
                        </Styles.SummaryItem>
                      </Styles.PriceCalculation>
                    </Styles.OrderSummary>
                  </Styles.PaymentGrid>
                </Styles.PaymentContainer>
              </motion.div>
            )}
            {step === 'confirmation' && (
              <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <Styles.ConfirmationContainer>
                  <Styles.SuccessIcon>✓</Styles.SuccessIcon>
                  <Styles.ConfirmationTitle>Đặt vé thành công!</Styles.ConfirmationTitle>
                  <Styles.ConfirmationText>Vé của bạn đã được đặt thành công. Mã xác nhận đã được gửi đến email của bạn.</Styles.ConfirmationText>
                  <Styles.TicketContainer>
                    <Styles.TicketHeader>
                      <Styles.Logo $small>CinemaPlus</Styles.Logo>
                      <Styles.QRCode><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=CINEMAPLUS12345" alt="QR Code" /></Styles.QRCode>
                    </Styles.TicketHeader>
                    <Styles.TicketBody>
                      <Styles.TicketMovie>{movieDetails?.movie_Name}</Styles.TicketMovie>
                      <Styles.TicketDetails>
                        <Styles.TicketDetail><Styles.TicketDetailLabel>Suất chiếu</Styles.TicketDetailLabel><Styles.TicketDetailValue>{showtimeDetails?.room_Name} - {showtimeDetails?.start_Time}</Styles.TicketDetailValue></Styles.TicketDetail>
                        <Styles.TicketDetail><Styles.TicketDetailLabel>Ghế</Styles.TicketDetailLabel><Styles.TicketDetailValue>{selectedSeats.map(s => s.id).join(', ')}</Styles.TicketDetailValue></Styles.TicketDetail>
                        <Styles.TicketDetail><Styles.TicketDetailLabel>Phòng chiếu</Styles.TicketDetailLabel><Styles.TicketDetailValue>Phòng 3</Styles.TicketDetailValue></Styles.TicketDetail>
                      </Styles.TicketDetails>
                    </Styles.TicketBody>
                    <Styles.TicketFooter><Styles.TicketId>Mã đặt vé: CPLUS-2025-03185492</Styles.TicketId></Styles.TicketFooter>
                  </Styles.TicketContainer>
                  <Styles.ActionButtons>
                    <Styles.DownloadButton>Tải vé xuống <Styles.DownloadIcon>↓</Styles.DownloadIcon></Styles.DownloadButton>
                    <Styles.AddToWalletButton>Thêm vào ví điện tử <Styles.WalletIcon>+</Styles.WalletIcon></Styles.AddToWalletButton>
                  </Styles.ActionButtons>
                </Styles.ConfirmationContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </Styles.BookingSection>
        <Styles.BookingPanel>
          <Styles.BookingPanelContent>
            <Styles.ActionContainer>
              {step === 'payment' && (
                <Styles.BackButton
                  onClick={async () => {
                    if (bookingId) {
                      try {
                        const token = localStorage.getItem('token');
                        await axios.put(
                          `https://localhost:7168/api/Booking/${bookingId}/cancel`,
                          { id: bookingId },
                          {
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                          }
                        );
                        setStep('select');
                        setSelectedSeats([]);
                        setBookingId(null);
                        setTotalPointsUsed(0); // Reset total points used
                        setDiscountedTotal(null);
                      } catch (error) {
                        console.error('Error cancelling booking:', error);
                        toast.error('Không thể hủy đặt vé. Vui lòng thử lại.');
                      }
                    } else {
                      setStep('select');
                      setTotalPointsUsed(0); // Reset total points used
                      setDiscountedTotal(null);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Quay lại
                </Styles.BackButton>
              )}
              <Styles.BookButton
                onClick={completeBooking}
                $disabled={step === 'select' && selectedSeats.length === 0}
                whileHover={selectedSeats.length > 0 ? { scale: 1.05 } : {}}
                whileTap={selectedSeats.length > 0 ? { scale: 0.95 } : {}}
              >
                {isLoading && <Styles.ButtonSpinner />}
                {step === 'select' && 'Tiếp tục'}
                {step === 'payment' && 'Thanh toán'}
                {step === 'confirmation' && 'Đặt vé mới'}
              </Styles.BookButton>
            </Styles.ActionContainer>
          </Styles.BookingPanelContent>
        </Styles.BookingPanel>

        <Modal
          title="Xác nhận chọn ghế"
          open={showConfirm}
          onOk={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
          okText="Đồng ý"
          cancelText="Hủy"
          okButtonProps={{ style: { backgroundColor: '#52c41a', borderColor: '#52c41a' } }}
          cancelButtonProps={{ style: { backgroundColor: '#fa8c16', borderColor: '#fa8c16' } }}
        >
          <p>Bạn có chắc chắn muốn chọn ghế {selectedSeats.map(s => s.id).join(', ')}?</p>
        </Modal>
      </Styles.PageContainer>
    </>
  );
};

export default CinemaRoomPage;
