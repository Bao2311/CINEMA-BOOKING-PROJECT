import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'antd';
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
  seat_Status: 'Available' | 'Reserved' | 'Unavailable';
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
    disabled={seat.isBooked}
    aria-label={`Seat ${seat.id}, ${seat.seatType} seat, ${seat.isBooked ? 'booked' : 'available'}`}
    whileHover={!seat.isBooked ? { y: -3, scale: 1.05 } : {}}
    whileTap={!seat.isBooked ? { scale: 0.95 } : {}}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Styles.SeatContent>
      <Styles.SeatNumber>{seat.id}</Styles.SeatNumber>
      {!seat.isBooked && !isSelected && <Styles.SeatPrice>{seat.price}k</Styles.SeatPrice>}
      {isSelected && <Styles.CheckMark>✓</Styles.CheckMark>}
    </Styles.SeatContent>
  </Styles.SeatButton>
);

const CinemaRoomPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const query = new URLSearchParams(useLocation().search);
  const movieId = query.get('movieId');

  const [selectedSeats, setSelectedSeats] = useState<SeatType[]>([]);
  const [seats, setSeats] = useState<SeatType[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [step, setStep] = useState<'select' | 'payment' | 'confirmation'>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [showtimeDetails, setShowtimeDetails] = useState<ShowtimeDetails | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`https://localhost:7168/api/Movie/${movieId}`);
        setMovieDetails(response.data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        alert("Không thể tải thông tin phim. Vui lòng thử lại sau.");
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
        alert("Không thể tải thông tin suất chiếu. Vui lòng thử lại sau.");
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
            const isBooked = !seat.is_Active || (status && (status.seat_Status === 'Reserved' || status.seat_Status === 'Unavailable'));

            return {
              id: seatId,
              row: seat.row_Label,
              number: seat.column_Number,
              price: status ? status.price / 1000 : (seat.seat_Type.toLowerCase() === 'vip' ? 150 : 100),
              isBooked,
              seatType: seat.seat_Type.toLowerCase() === 'vip' ? 'vip' : 'standard',
              section: seat.column_Number <= layoutResponse.data.dimensions.columns / 3 ? 'left' : seat.column_Number > (layoutResponse.data.dimensions.columns * 2) / 3 ? 'right' : 'center',
              seat_ID: status ? status.seat_ID : undefined,
            };
          })
        );

        setSeats(mappedSeats);
      } catch (error) {
        console.error('Error fetching seat layout or status:', error);
        alert('Failed to load seat layout or status.');
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
        alert('Bạn chỉ có thể chọn tối đa 8 ghế mỗi lần');
        return prev;
      }
      return [...prev, seat];
    });
  };

  useEffect(() => {
    const price = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    setTotalPrice(price);
  }, [selectedSeats]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (step === 'payment') {
      if (!name.trim()) newErrors.name = 'Vui lòng nhập họ tên';
      if (!email.trim()) newErrors.email = 'Vui lòng nhập email';
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email không hợp lệ';
      if (!phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
      else if (!/^[0-9]{10}$/.test(phone)) newErrors.phone = 'Số điện thoại phải có 10 chữ số';
      if (!cardNumber.trim()) newErrors.cardNumber = 'Vui lòng nhập số thẻ';
      else if (!/^[0-9]{16}$/.test(cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Số thẻ phải có 16 chữ số';
      if (!expiry.trim()) newErrors.expiry = 'Vui lòng nhập ngày hết hạn';
      else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry)) newErrors.expiry = 'Định dạng MM/YY không hợp lệ';
      if (!cvv.trim()) newErrors.cvv = 'Vui lòng nhập mã CVV';
      else if (!/^[0-9]{3,4}$/.test(cvv)) newErrors.cvv = 'CVV phải có 3-4 chữ số';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendBookingRequest = async () => {
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế');
      return false;
    }

    const seat_IDs = selectedSeats
      .map(seat => seat.seat_ID)
      .filter((id): id is number => id !== undefined);

    if (seat_IDs.length !== selectedSeats.length) {
      console.error('Some selected seats do not have seat_ID');
      alert('Có lỗi xảy ra với thông tin ghế. Vui lòng thử lại.');
      return false;
    }

    const bookingData: BookingRequest = {
      showtime_ID: Number(showtimeId),
      seat_IDs: seat_IDs,
      payment_Method: "PayOS",
    };

    try {
      setIsLoading(true);
      setBookingError(null);
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
      setBookingError(error.response?.data?.message || 'Không thể tạo đặt vé. Vui lòng thử lại sau.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeBooking = async () => {
    if (step === 'select') {
      if (selectedSeats.length === 0) {
        alert('Vui lòng chọn ít nhất một ghế');
        return;
      }
      setShowConfirm(true);
      return;
    }

    if (step === 'payment') {
      try {
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
        setBookingError('Không thể tạo liên kết thanh toán. Vui lòng thử lại.');
        setIsLoading(false);
      }
      return;
    }

    if (step === 'confirmation') {
      setSelectedSeats([]);
      setStep('select');
      setName('');
      setEmail('');
      setPhone('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setErrors({});
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

  return (
    <>
      <Styles.GlobalStyle />
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
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
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
                      {bookingError && (
                        <Styles.ErrorMessage>
                          {bookingError}
                        </Styles.ErrorMessage>
                      )}
                    </>
                  )}
                </Styles.CinemaContainer>
              </motion.div>
            )}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                <Styles.PaymentContainer>
                  <Styles.PaymentHeader>Hoàn tất đặt vé</Styles.PaymentHeader>
                  <Styles.PaymentGrid>
                    <Styles.OrderSummary>
                      <Styles.SummaryTitle>Thông tin đặt vé</Styles.SummaryTitle>
                      <Styles.SummaryItem><span>Phim</span><span>{movieDetails?.movie_Name}</span></Styles.SummaryItem>
                      <Styles.SummaryItem><span>Suất chiếu</span><span>{showtimeDetails?.room_Name} - {showtimeDetails?.start_Time}</span></Styles.SummaryItem>
                      <Styles.SummaryItem><span>Ghế</span><span>{selectedSeats.map(s => s.id).join(', ')}</span></Styles.SummaryItem>
                      <Styles.SummaryDivider />
                      <Styles.SeatTypeSummary>
                        {['standard', 'vip'].map(type => {
                          const seatsOfType = selectedSeats.filter(s => s.seatType === type);
                          if (seatsOfType.length === 0) return null;
                          const subtotal = seatsOfType.reduce((sum, seat) => sum + seat.price, 0);
                          return (
                            <Styles.SummaryItem key={type}>
                              <span>{type === 'standard' ? 'Ghế thường' : 'Ghế VIP'} ({seatsOfType.length})</span>
                              <span>{subtotal}k</span>
                            </Styles.SummaryItem>
                          );
                        })}
                      </Styles.SeatTypeSummary>
                      <Styles.SummaryDivider />
                      <Styles.SummaryItem $total><span>Tổng cộng</span><span>{totalPrice}k</span></Styles.SummaryItem>
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
                      } catch (error) {
                        console.error('Error cancelling booking:', error);
                        alert('Không thể hủy đặt vé. Vui lòng thử lại.');
                      }
                    } else {
                      setStep('select');
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