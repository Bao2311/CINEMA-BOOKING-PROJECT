import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Button, Input, Select, DatePicker, Space, 
  Tag, Modal, Form, Spin, message, Tooltip, Card,
  Tabs, Typography, Row, Col, Divider, Steps, 
  Radio, Checkbox, Avatar, Alert, Descriptions,
  Empty
} from 'antd';
import { 
  CalendarOutlined, LeftOutlined, RightOutlined,
  UserOutlined, CreditCardOutlined, SearchOutlined,
  CheckCircleOutlined, CloseCircleOutlined, TeamOutlined,
  PlusOutlined, ShoppingCartOutlined, BarcodeOutlined,
  PercentageOutlined, DollarOutlined, QrcodeOutlined,
  ClockCircleOutlined, TagOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import { QRCode } from 'antd';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/apiUrl';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TabPane } = Tabs;

// Define interfaces
interface Movie {
  movie_ID: number;
  movie_Name: string;
  director: string;
  genre: string;
  cast: string;
  poster_URL: string;
  duration: number;
  rating: string;
}

interface PayosPaymentResponse {
  success: boolean;
  message: string;
  paymentUrl: string;
  qrCodeUrl: string;
  orderCode: string;
  amount: number;
}

interface Room {
  cinema_Room_ID: number;
  room_Name: string;
  room_Type: string;
}

interface Showtime {
  showtime_ID: number;
  movie_ID: number;
  cinema_Room_ID: number;
  room_Name: string;
  room_Type: string;
  seat_Quantity: number;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  price_Tier: string;
  base_Price: number;
  status: string;
  movie?: Movie;
  room?: Room;
}

interface Seat {
  seat_ID: number;
  row_Name: string;
  seat_Number: number;
  seat_Type: string;
  price: number;
  seat_Status: string;
  layout_ID: number;
}

interface ShowtimeSeatsResponse {
  showtime_ID: number;
  movie_Title: string;
  cinema_Room: string;
  show_Date: string;
  start_Time: string;
  end_Time: string;
  seats: {
    $values: Seat[];
  };
}

interface Member {
  user_ID: number;
  full_Name: string;
  email: string;
  phone_Number: string;
  currentPoints: number;
  isVip: boolean;
  membershipStatus: string;
  sex: string;
}

interface Promotion {
  promotion_ID: number;
  promotion_Code: string;
  promotion_Detail: string;
  discount_Type: string;
  discount_Value: number; // Được định nghĩa là number không có xử lý đặc biệt
  start_Date: string;
  end_Date: string;
  status: string;
  is_Active: boolean;
}


interface Customer {
  name: string;
  phone: string;
  email: string;
  sex: string;
}

interface AppliedPromotion {
  promotion_ID: number;
  code: string;
  name: string;
  discount_Value: number;
  discount_Amount: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface BookingSummary {
  subtotal: number;
  discounts: number;
  memberDiscount: number;
  promotionDiscount: number;
  pointsDiscount: number;
  total: number;
}

interface BookingResponse {
  booking_ID: number;
  seat_IDs: number[];
}

interface SeatButtonProps {
  seatType?: string;
  seatStatus?: string;
  isSelected?: boolean;
}

// Add interfaces for the API response
interface PendingBookingResponse {
  canCreateNewBooking: boolean;
  pendingBooking: {
    booking_ID: number;
    booking_Date: string;
    payment_Deadline: string;
    isExpired: boolean;
    seats: string;
    total_Amount: number;
    movieName: string;
    roomName: string;
    show_Date: string;
    start_Time: string;
    remainingMinutes: number;
  } | null;
  message: string;
}

// Styled components for seat layout display
const Screen = styled.div`
  width: 90%;
  height: 50px;
  background: linear-gradient(to bottom, #e5e7eb, #ffffff);
  border-radius: 8px;
  margin: 0 auto 3rem;
  transform: perspective(500px) rotateX(-20deg);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 2px solid #d1d5db;

  &:after {
    content: '';
    position: absolute;
    bottom: -25px;
    left: 5%;
    width: 90%;
    height: 25px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), transparent);
    border-radius: 8px;
  }
`;

const ScreenText = styled.div`
  color: #4b5563;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 3px;
  text-transform: uppercase;
`;

const SeatingArea = styled.div`
  display: grid;
  grid-template-columns: 40px auto 40px; /* Row label, seats section, row label */
  gap: 0.625rem;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
  background: #111827;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const RowContainer = styled(motion.div)`
  display: contents; /* Use CSS Grid for layout */
`;

const RowLabel = styled.div`
  width: 40px;
  height: 40px;
  text-align: center;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #1E2738;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(229, 9, 20, 0.2);
    border-color: rgba(229, 9, 20, 0.4);
    transform: scale(1.05);
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
  margin-bottom: 0.5rem;
`;

const ColumnFooter = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
  margin-top: 0.5rem;
`;

const ColumnLabel = styled.div`
  width: 40px;
  height: 40px;
  text-align: center;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #1E2738;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(229, 9, 20, 0.2);
    border-color: rgba(229, 9, 20, 0.4);
    transform: scale(1.05);
  }
`;

const SeatsSection = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  grid-column: 2 / 3; /* Position in the middle column of the grid */
`;

const SeatButtonWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const SeatButton = styled(motion.button)<SeatButtonProps>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: ${props => props.isSelected ? '3px solid #22c55e' : '1px solid #d1d5db'};
  box-shadow: ${props => props.isSelected ? '0 0 10px rgba(34, 197, 94, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  background-color: ${props => {
    if (props.seatStatus === 'NotAvailable') return '#e5e7eb'; // Ghế trống
    if (props.seatStatus === 'Sold' || props.seatStatus === 'Reserved') return '#9ca3af';
    if (props.seatStatus === 'Booked') return '#6b7280';
    switch (props.seatType) {
      case 'VIP':
        return '#ef4444';
      case 'Regular':
      default:
        return '#3b82f6';
    }
  }};
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: ${props => (props.seatStatus === 'NotAvailable' || props.seatStatus === 'Sold' || props.seatStatus === 'Reserved' || props.seatStatus === 'Booked') ? 'not-allowed' : 'pointer'};
  position: relative;
  transition: all 0.3s ease;
  opacity: ${props => (props.seatStatus === 'NotAvailable') ? '0.5' : props.seatStatus === 'Sold' || props.seatStatus === 'Reserved' || props.seatStatus === 'Booked' ? '0.7' : '1'};

  &:hover {
    transform: ${props => (props.seatStatus === 'NotAvailable' || props.seatStatus === 'Sold' || props.seatStatus === 'Reserved' || props.seatStatus === 'Booked') ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => (props.seatStatus === 'NotAvailable' || props.seatStatus === 'Sold' || props.seatStatus === 'Reserved' || props.seatStatus === 'Booked') ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.15)'};
  }

  // Add seat shape styling
  &:before {
    content: '';
    position: absolute;
    top: -4px;
    left: 10px;
    right: 10px;
    height: 4px;
    background-color: ${props => {
      if (props.seatStatus === 'Sold' || props.seatStatus === 'Reserved') return '#9ca3af';
      if (props.seatStatus === 'Booked') return '#6b7280';
      return props.isSelected ? '#22c55e' : props.seatType === 'VIP' ? '#dc2626' : '#2563eb';
    }};
    border-radius: 4px 4px 0 0;
  }
`;

const SeatNumber = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
`;

const SeatTooltip = styled.div`
  visibility: hidden;
  background-color: #1f2937;
  color: #ffffff;
  text-align: center;
  border-radius: 6px;
  padding: 6px 10px;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #1f2937 transparent transparent transparent;
  }

  ${SeatButtonWrapper}:hover & {
    visibility: visible;
  }
`;

const SeatLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  background: #1E2738;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #e2e8f0;
  font-weight: 500;
`;

const ColorBox = styled.div`
  width: 18px;
  height: 18px;
  background-color: ${props => props.color};
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const PromotionList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const PromotionTag = styled(Tag)`
  cursor: pointer;
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 4px;
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
  &:hover {
    background-color: #bae7ff;
  }
`;

// Sticky header for seat selection
const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const ManageBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [memberLookupValue, setMemberLookupValue] = useState<string>('');
  const [memberLookupType, setMemberLookupType] = useState<'phone' | 'email'>('phone');
  const [memberDiscountAmount, setMemberDiscountAmount] = useState<number>(0);
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<AppliedPromotion | null>(null);
  const [promotionCode, setPromotionCode] = useState<string>('');
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', sex: 'Other' });
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [sendConfirmation, setSendConfirmation] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');
  const [newUserModalVisible, setNewUserModalVisible] = useState<boolean>(false);
  const [paymentQrVisible, setPaymentQrVisible] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState<PayosPaymentResponse | null>(null);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
    subtotal: 0,
    discounts: 0,
    memberDiscount: 0,
    promotionDiscount: 0,
    pointsDiscount: 0,
    total: 0
  });
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [seatIds, setSeatIds] = useState<number[]>([]);
  const [pendingBooking, setPendingBooking] = useState<PendingBookingResponse['pendingBooking'] | null>(null);
  const [cancelBookingModalVisible, setCancelBookingModalVisible] = useState<boolean>(false);
  const [selectedShowtimeToBook, setSelectedShowtimeToBook] = useState<Showtime | null>(null);

  const [customerForm] = Form.useForm();
  const [membershipForm] = Form.useForm();
  const [newUserForm] = Form.useForm();

  // Fetch initial data when component mounts
  useEffect(() => {
    fetchNowShowingMovies();
    fetchPromotions();
  }, []);

  // Reset booking state function
  const resetBookingState = () => {
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSelectedDate(null);
    setMember(null);
    setMemberDiscountAmount(0);
    setPointsToUse(0);
    setAppliedPromotion(null);
    setPromotionCode('');
    setCustomer({ name: '', phone: '', email: '', sex: 'Other' });
    customerForm.resetFields();
    setPaymentMethod('Cash');
    setCurrentStep(0);
    setBookingId(null);
    setSeatIds([]);
  };

  // Get token from storage
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Fetch movies that are now showing
  const fetchNowShowingMovies = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/Movie/now-showing`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data && response.data.$values) {
        setMovies(response.data.$values);
      } else if (Array.isArray(response.data)) {
        setMovies(response.data);
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Không thể tải danh sách phim đang chiếu');
      message.error('Không thể tải danh sách phim đang chiếu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch promotions from API
  const fetchPromotions = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/Promotion`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data && response.data.$values) {
        // Filter promotions with status 'active' and is_Active true
        const activePromotions = response.data.$values.filter(
          (promo: Promotion) => promo.status.toLowerCase() === 'active' && promo.is_Active
        );
        setPromotions(activePromotions);
      } else if (Array.isArray(response.data)) {
        const activePromotions = response.data.filter(
          (promo: Promotion) => promo.status.toLowerCase() === 'active' && promo.is_Active
        );
        setPromotions(activePromotions);
      } else {
        setPromotions([]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      message.error('Không thể tải danh sách mã khuyến mãi');
    }
  };
  
  
  // Handle clicking on a promotion code
  const handlePromotionClick = (code: string) => {
    if (!appliedPromotion) {
      setPromotionCode(code);
    }
  };

  // Fetch available dates for a movie
  const fetchAvailableDates = async (movieId: number) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/Showtimes/movie/${movieId}/dates`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      let datesList: string[] = [];
      if (response.data && response.data.$values) {
        datesList = response.data.$values;
      } else if (Array.isArray(response.data)) {
        datesList = response.data;
      }

      // Fallback if empty: fetch from /Showtimes/movie/{movieId}
      if (!datesList || datesList.length === 0) {
        try {
          const fallbackRes = await axios.get(`${API_URL}/Showtimes/movie/${movieId}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          });
          const rawDates = fallbackRes.data?.dates?.$values || fallbackRes.data?.dates;
          if (Array.isArray(rawDates)) {
            datesList = rawDates.map((d: any) => d.show_Date || d);
          }
        } catch (e) {
          console.warn('Fallback movie dates fetch failed:', e);
        }
      }

      setAvailableDates(datesList);
      if (datesList.length > 0) {
        setSelectedDate(prev => {
          const dateToUse = prev || moment(datesList[0]);
          fetchShowtimes(movieId, dateToUse.format('YYYY-MM-DD'));
          return dateToUse;
        });
      } else {
        setShowtimes([]);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      message.error('Không thể tải danh sách ngày có suất chiếu');
    }
  };

  const fetchShowtimes = async (movieId: number, date?: string) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      let url = date 
        ? `${API_URL}/Showtimes/movie/${movieId}/date/${date}` 
        : `${API_URL}/Showtimes/movie/${movieId}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      console.log('Showtime response:', response.data);

      let showtimeData: any[] = [];
      if (response.data && response.data.$values) {
        showtimeData = response.data.$values;
      } else if (Array.isArray(response.data)) {
        showtimeData = response.data;
      } else if (response.data && response.data.dates) {
        const dObj = response.data.dates.$values || response.data.dates;
        if (Array.isArray(dObj)) {
          if (date) {
            const matched = dObj.find((d: any) => moment(d.show_Date).format('YYYY-MM-DD') === date);
            showtimeData = matched?.showtimes?.$values || matched?.showtimes || [];
          } else {
            showtimeData = dObj.flatMap((d: any) => d.showtimes?.$values || d.showtimes || []);
          }
        }
      }

      // Xử lý và map dữ liệu showtime
      const processedShowtimes = showtimeData.map(showtime => ({
        ...showtime,
        room_Name: showtime.room?.room_Name || showtime.room_Name || 'N/A',
        room_Type: showtime.room?.room_Type || showtime.room_Type || 'N/A',
        seat_Quantity: showtime.room?.seat_Quantity || showtime.seat_Quantity || 0
      }));

      setShowtimes(processedShowtimes);
      console.log('Processed showtimes:', processedShowtimes);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setError('Không thể tải danh sách suất chiếu');
      message.error('Không thể tải danh sách suất chiếu');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async (showtimeId: number) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get<ShowtimeSeatsResponse>(`${API_URL}/Seat/showtime/${showtimeId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (response.data && response.data.seats && response.data.seats.$values) {
        const allSeats = response.data.seats.$values;
        
        // Lấy số hàng và cột tối đa từ API
        const maxRow = Math.max(...allSeats.map(seat => {
          const rowNumber = seat.row_Name.charCodeAt(0) - 'A'.charCodeAt(0);
          return rowNumber;
        }));
        
        const maxCol = Math.max(...allSeats.map(seat => seat.seat_Number));
        
        // Tạo mảng đầy đủ các hàng từ A đến hàng lớn nhất
        const allRows = Array.from({ length: maxRow + 1 }, (_, i) => 
          String.fromCharCode('A'.charCodeAt(0) + i)
        );
        
        // Tạo mảng đầy đủ các cột từ 1 đến cột lớn nhất
        const allColumns = Array.from({ length: maxCol }, (_, i) => i + 1);
        
        // Tạo ma trận ghế đầy đủ
        const fullSeats = allRows.flatMap(row => 
          allColumns.map(col => {
            const existingSeat = allSeats.find(s => 
              s.row_Name === row && s.seat_Number === col
            );
            
            if (existingSeat) {
              return {
                ...existingSeat,
                seat_ID: existingSeat.seat_ID === 0 ? existingSeat.layout_ID : existingSeat.seat_ID
              };
            }
            
            // Tạo ghế trống cho vị trí không có trong API
            return {
              seat_ID: -1,
              row_Name: row,
              seat_Number: col,
              seat_Type: 'None',
              price: 0,
              seat_Status: 'NotAvailable',
              layout_ID: -1
            };
          })
        );
        
        setSeats(fullSeats);
        
        // Log thông tin chi tiết
        console.log(`Tổng số hàng (A-${String.fromCharCode('A'.charCodeAt(0) + maxRow)}): ${allRows.length}`);
        console.log(`Tổng số cột (1-${maxCol}): ${allColumns.length}`);
        console.log(`Tổng số ghế: ${fullSeats.length}`);
        console.log('Danh sách hàng:', allRows);
        console.log('Danh sách cột:', allColumns);
        
        // Hiển thị thông tin tổng quan
        message.info(
          `Sơ đồ ghế: ${allRows.length} hàng (A-${String.fromCharCode('A'.charCodeAt(0) + maxRow)}) × ${allColumns.length} cột (1-${maxCol})\n` +
          `Tổng số ghế: ${fullSeats.length}\n` +
          `Ghế có sẵn: ${fullSeats.filter(s => s.seat_Status === 'Available').length}\n` +
          `Ghế đã đặt: ${fullSeats.filter(s => s.seat_Status === 'Booked' || s.seat_Status === 'Reserved' || s.seat_Status === 'Sold').length}`
        );
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      setError('Không thể tải danh sách ghế');
      message.error('Không thể tải danh sách ghế');
    } finally {
      setLoading(false);
    }
  };

  // Handle preselected showtime or movie passed via navigation state or query params
  const handleInitialNavigation = async (showtimeId?: number, movieId?: number) => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (showtimeId) {
        // Reset previously selected seats and booking
        setSelectedSeats([]);
        setBookingId(null);

        // 1. Fetch showtime details
        const stRes = await axios.get(`${API_URL}/Showtimes/${showtimeId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined }
        });
        const stData = stRes.data;

        if (stData) {
          const mId = movieId || stData.movie_ID || stData.movie?.movie_ID;

          // 2. Fetch movie details
          let movieObj = movies.find(m => m.movie_ID === mId);
          if (!movieObj && mId) {
            try {
              const mRes = await axios.get(`${API_URL}/Movie/${mId}`, {
                headers: { Authorization: token ? `Bearer ${token}` : undefined }
              });
              movieObj = mRes.data;
            } catch (err) {
              console.error('Failed to fetch movie details:', err);
            }
          }

          if (movieObj) {
            setSelectedMovie(movieObj);
          }

          const processedShowtime: Showtime = {
            ...stData,
            room_Name: stData.room?.room_Name || stData.room_Name || 'Phòng chiếu',
            room_Type: stData.room?.room_Type || stData.room_Type || 'Tiêu chuẩn',
            seat_Quantity: stData.room?.seat_Quantity || stData.seat_Quantity || 0
          };
          setSelectedShowtime(processedShowtime);

          if (stData.show_Date) {
            setSelectedDate(moment(stData.show_Date));
          }

          // 3. Fetch seats
          await fetchSeats(showtimeId);

          // 4. Preload dates for movie in background (in case staff clicks "Quay lại chọn suất chiếu")
          if (mId) {
            fetchAvailableDates(mId);
          }

          // 5. Jump directly to Step 2 (Chọn ghế)
          setCurrentStep(2);
        }
      } else if (movieId) {
        let movieObj = movies.find(m => m.movie_ID === movieId);
        if (!movieObj) {
          const mRes = await axios.get(`${API_URL}/Movie/${movieId}`, {
            headers: { Authorization: token ? `Bearer ${token}` : undefined }
          });
          movieObj = mRes.data;
        }
        if (movieObj) {
          setSelectedMovie(movieObj);
          await fetchAvailableDates(movieId);
          setCurrentStep(1);
        }
      }
    } catch (error) {
      console.error('Error initializing booking from navigation state:', error);
      message.error('Không thể tải thông tin suất chiếu đã chọn');
    } finally {
      setLoading(false);
    }
  };

  // Listen to navigation state or query params changes
  useEffect(() => {
    const stateShowtimeId = location.state?.showtimeId 
      || (searchParams.get('showtimeId') ? parseInt(searchParams.get('showtimeId')!) : undefined);
    const stateMovieId = location.state?.movieId 
      || (searchParams.get('movieId') ? parseInt(searchParams.get('movieId')!) : undefined);

    if (stateShowtimeId || stateMovieId) {
      handleInitialNavigation(stateShowtimeId, stateMovieId);
    }
  }, [location.state, searchParams]);

  // Lookup member by phone or email
  const lookupMember = async (value: string, type: 'phone' | 'email') => {
    if (!value) {
      message.warning('Vui lòng nhập thông tin tìm kiếm');
      return;
    }
    
    try {
      setLookupLoading(true);
      const token = getAuthToken();
      const endpoint = type === 'phone' 
        ? `${API_URL}/Member/lookup/phone/${encodeURIComponent(value)}`
        : `${API_URL}/Member/lookup/email/${encodeURIComponent(value)}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      if (response.data) {
        // Reset any applied promotion when looking up a new member
        if (appliedPromotion) {
          setAppliedPromotion(null);
          setPromotionCode('');
          
          // Recalculate total without promotion discount
          const subtotal = bookingSummary.subtotal;
          const memberDiscount = 0; // Reset member discount
          const pointsDiscount = bookingSummary.pointsDiscount;
          
          // Calculate total without promotion discount
          const totalDiscounts = memberDiscount + pointsDiscount;
          const newTotal = Math.max(0, subtotal - totalDiscounts);
          
          // Update booking summary
          setBookingSummary({
            ...bookingSummary,
            discounts: totalDiscounts,
            promotionDiscount: 0,
            memberDiscount: 0,
            total: newTotal
          });
          
          message.info('Mã khuyến mãi đã bị hủy. Vui lòng áp dụng lại mã khuyến mãi nếu cần.');
        }
        
        // Update member state with API response
        setMember({
          user_ID: response.data.user_ID,
          full_Name: response.data.full_Name,
          email: response.data.email,
          phone_Number: response.data.phone_Number,
          currentPoints: response.data.currentPoints,
          isVip: response.data.isVip,
          membershipStatus: response.data.membershipStatus,
          sex: response.data.sex || 'Other'
        });
        
        // Auto-fill form with member info
        customerForm.setFieldsValue({
          name: response.data.full_Name,
          phone: response.data.phone_Number,
          email: response.data.email,
          sex: response.data.sex || 'Other'
        });
        
        // Update customer state
        setCustomer({
          name: response.data.full_Name,
          phone: response.data.phone_Number,
          email: response.data.email,
          sex: response.data.sex || 'Other'
        });

        // Hiển thị thông báo về số điểm của thành viên
        message.success(`Đã tìm thấy thành viên ${response.data.full_Name} - ${response.data.currentPoints?.toLocaleString() || 0} điểm`);

        // New API call
        const bookingResponse = await axios.post(`${API_URL}/Member/link-member`, {
          bookingId: bookingId, // Replace with actual booking ID
          memberIdentifier: value
        }, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          },
        });

        if (bookingResponse.data) {
          console.log('Booking linked successfully:', bookingResponse.data);
          
          // Cập nhật điểm hiện tại từ response nếu có
          if (bookingResponse.data.currentPoints !== undefined) {
            setMember(prev => {
              if (prev) {
                return {
                  ...prev,
                  currentPoints: bookingResponse.data.currentPoints
                };
              }
              return prev;
            });
            
            message.info(`Số điểm hiện tại: ${bookingResponse.data.currentPoints?.toLocaleString() || 0} điểm`);
          }
        }
        
      } else {
        setMember(null);
        message.info('Không tìm thấy thành viên với thông tin cung cấp');
      }
    } catch (error) {
      console.error('Error looking up member:', error);
      setMember(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Apply member info to the form
  // Apply member info to the form
const applyMemberInfo = async () => {
  if (!member) return;
  
  customerForm.setFieldsValue({
    name: member.full_Name,
    phone: member.phone_Number,
    email: member.email,
    sex: member.sex || 'Other'
  });
  
  setCustomer({
    name: member.full_Name,
    phone: member.phone_Number,
    email: member.email,
    sex: member.sex || 'Other'
  });
  
  // If we have both booking ID and member info, link them using email as identifier
  if (bookingId && member.email) {
    const linked = await linkMemberToBooking(bookingId, member.email);
    if (linked) {
      message.success('Đã áp dụng thông tin thành viên và liên kết với đơn đặt vé!');
    } else {
      message.success('Đã áp dụng thông tin thành viên!');
      message.warning('Không thể liên kết thành viên với đơn đặt vé');
    }
  } else {
    message.success('Đã áp dụng thông tin thành viên!');
    if (!bookingId) {
      message.warning('Chưa có đơn đặt vé để liên kết với thành viên');
    }
  }
};


  // Fetch member discount based on membership level
  const fetchMemberDiscount = async (membershipLevel: string) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/Promotion/member-discount/${membershipLevel}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (response.data) {
        setMemberDiscountAmount(response.data);
        updateBookingSummary();
      }
    } catch (error) {
      console.error('Error fetching member discount:', error);
      message.error('Không thể lấy thông tin khuyến mãi thành viên');
    }
  };
  // Function to link member to booking
const linkMemberToBooking = async (bookingId: number, memberIdentifier: string) => {
  if (!bookingId || !memberIdentifier) {
    message.warning('Cần có thông tin đặt vé và thành viên để liên kết');
    return false;
  }
  
  try {
    setLoading(true);
    const token = getAuthToken();
    
    const response = await axios.post(`${API_URL}/Member/link-member`, {
      bookingId: bookingId,
      memberIdentifier: memberIdentifier
    }, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json'
      },
    });
    
    if (response.data) {
      message.success('Liên kết thành viên với đơn đặt vé thành công!');
      
      // Reset any applied promotion when linking a new member
      if (appliedPromotion) {
        setAppliedPromotion(null);
        setPromotionCode('');
        
        // Recalculate total without promotion discount
        const subtotal = bookingSummary.subtotal;
        const memberDiscount = bookingSummary.memberDiscount;
        const pointsDiscount = bookingSummary.pointsDiscount;
        
        // Calculate total without promotion discount
        const totalDiscounts = memberDiscount + pointsDiscount;
        const newTotal = Math.max(0, subtotal - totalDiscounts);
        
        // Update booking summary
        setBookingSummary({
          ...bookingSummary,
          discounts: totalDiscounts,
          promotionDiscount: 0,
          total: newTotal
        });
        
        message.info('Mã khuyến mãi đã bị hủy. Vui lòng áp dụng lại mã khuyến mãi nếu cần.');
      }
      
      // Cập nhật số điểm hiện tại của thành viên và hiển thị thông báo
      if (response.data.currentPoints !== undefined && member) {
        setMember(prev => {
          if (prev) {
            return {
              ...prev,
              currentPoints: response.data.currentPoints
            };
          }
          return prev;
        });
        
        message.info(`Số điểm hiện tại của thành viên: ${response.data.currentPoints?.toLocaleString() || 0} điểm`);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error linking member to booking:', error);
    message.error('Không thể liên kết thành viên với đơn đặt vé');
    return false;
  } finally {
    setLoading(false);
  }
};


  // Apply promotion code using new API
  // Hàm áp dụng mã khuyến mãi
  const applyPromotionCode = async () => {
    if (!promotionCode) {
      message.error('Vui lòng nhập mã khuyến mãi');
      return;
    }
  
    if (!bookingId) {
      message.error('Không tìm thấy thông tin đặt vé');
      return;
    }
  
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/Promotion/apply`,
        {
          bookingId: bookingId,
          promotionCode: promotionCode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );
  
      console.log('Promotion API response:', response.data);
      
      // Guard against undefined response data
      if (response && response.data && response.data.success) {
        // Extract discount amount from the response
        // If discountAmount is 0 or not provided in the response, use the discount_amount property or calculate from original_total and new_total
        let discountAmount = response.data.discountAmount || response.data.discount_amount || 0;
        
        // If discount amount is still 0, calculate from original_total and new_total if both are provided
        if (discountAmount === 0 && response.data.original_total && response.data.new_total) {
          discountAmount = response.data.original_total - response.data.new_total;
        }
        
        // Handle different property names that might be in the response
        const discountValue = response.data.discount_value || 0;
        const promoCode = response.data.promotion_code || promotionCode;
        const promotionDetail = response.data.promotion_detail || 'Khuyến mãi';
        const promotionId = response.data.promotion_id || 0;
        
        // If server provides new_total, use it directly
        const newTotalFromServer = response.data.new_total;
        
        // Đã tìm được promotion, lưu vào state 
        setAppliedPromotion({
          promotion_ID: promotionId,
          code: promoCode,
          name: promotionDetail,
          discount_Value: discountValue,
          discount_Amount: discountAmount
        });
        
        // Calculate booking summary with the new discount
        const subtotal = bookingSummary.subtotal;
        
        // Calculate member discount if applicable
        let memberDiscount = bookingSummary.memberDiscount || 0;
        if (member && memberDiscountAmount > 0 && memberDiscount === 0) {
          memberDiscount = (memberDiscountAmount / 100) * subtotal;
        }
        
        // Calculate points discount
        const pointsDiscount = bookingSummary.pointsDiscount || 0;
        
        // Calculate total discount (member + promotion + points)
        const totalDiscounts = memberDiscount + discountAmount + pointsDiscount;
        
        // Calculate new total after discounts
        // If server provided new_total, use it, otherwise calculate
        const newTotal = newTotalFromServer !== undefined 
          ? newTotalFromServer 
          : Math.max(0, subtotal - totalDiscounts);
        
        console.log('Discount calculation:', {
          subtotal,
          memberDiscount,
          discountAmount,
          pointsDiscount,
          totalDiscounts,
          newTotal,
          newTotalFromServer
        });
        
        // Update the booking summary
        setBookingSummary({
          subtotal,
          discounts: totalDiscounts,
          memberDiscount,
          promotionDiscount: discountAmount,
          pointsDiscount,
          total: newTotal
        });
        
        message.success(`Áp dụng mã khuyến mãi thành công! Giảm ${discountAmount.toLocaleString()} VND`);
        setPromotionCode(''); // Xóa mã khuyến mãi sau khi áp dụng thành công
      } else {
        message.error((response && response.data && response.data.message) || 'Mã khuyến mãi không hợp lệ');
      }
    } catch (error) {
      console.error('Error applying promotion code:', error);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      if (error.response) {
        // Lỗi từ server với response
        message.error(error.response.data?.message || 'Mã khuyến mãi không hợp lệ hoặc không áp dụng được');
      } else if (error.request) {
        // Không nhận được response
        message.error('Không thể kết nối đến máy chủ');
      } else {
        // Lỗi khác
        message.error('Có lỗi xảy ra khi áp dụng mã khuyến mãi');
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  
  

// Hàm tính toán giá trị khuyến mãi dựa trên loại khuyến mãi
const calculateDiscountAmount = (value: number, type: string, subtotal: number): number => {
  // Đảm bảo value là số
  const discountValue = parseFloat(value.toString());
  
  if (type.toLowerCase() === 'percentage') {
    // Nếu là phần trăm, tính % của tổng tiền
    return (discountValue / 100) * subtotal;
  } else {
    // Nếu là giá trị cố định, trả về giá trị đó
    return discountValue;
  }
};

  // Apply points discount using new API
  const applyPointsDiscount = async () => {
    if (!member || !bookingId || pointsToUse <= 0) {
      message.warning('Vui lòng nhập số điểm cần sử dụng và đảm bảo đã tạo đơn đặt vé');
      return;
    }
    
    // Validate points is a multiple of 1000
    if (pointsToUse % 1000 !== 0) {
      message.warning('Số điểm sử dụng phải là bội của 1000');
      return;
    }
    
    if (pointsToUse > member.currentPoints) {
      message.error('Số điểm sử dụng không thể lớn hơn số điểm hiện có');
      return;
    }
    
    // Calculate maximum points allowed (50% of total bill)
    const maxAllowedPoints = Math.floor(bookingSummary.subtotal * 0.5);
    if (pointsToUse > maxAllowedPoints) {
      message.warning(`Bạn chỉ có thể sử dụng tối đa ${maxAllowedPoints.toLocaleString()} điểm (50% tổng hóa đơn)`);
      return;
    }
    
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // Send the points as a direct value, not as a JSON object
      const response = await axios.post(
        `${API_URL}/Points/booking/${bookingId}/apply-discount`,
        pointsToUse,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.data) {
        console.log('Point discount response:', response.data);
        
        // Update member points from the response
        if (response.data.currentPoints !== undefined) {
          setMember(prev => prev ? {...prev, currentPoints: response.data.currentPoints} : prev);
        }
        
        // Use the discountedTotalAmount from the response
        const discountedTotal = response.data.discountedTotalAmount;
        
        // Calculate the discount amount (this is the VND value, which is the same as points used 1:1)
        const discountAmount = pointsToUse; // In this system, 1 point = 1 VND discount
        
        message.success(`Đã sử dụng ${pointsToUse.toLocaleString()} điểm để giảm giá ${discountAmount.toLocaleString()} VND`);
        
        // Update booking summary with the new total from the response
        setBookingSummary(prev => ({
          ...prev,
          pointsDiscount: discountAmount,
          discounts: (prev.memberDiscount + prev.promotionDiscount + discountAmount),
          total: discountedTotal || (prev.subtotal - prev.memberDiscount - prev.promotionDiscount - discountAmount)
        }));
        
        // Don't reset points input field to show how many points are being used
        // setPointsToUse(0);
      }
    } catch (error) {
      console.error('Error applying points discount:', error);
      message.error('Không thể sử dụng điểm tích lũy. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Remove applied promotion
  const removePromotion = async () => {
    try {
      const token = getAuthToken();
      if (!bookingResponse) {
        message.error('Không tìm thấy thông tin đặt vé');
        return;
      }

      await axios.delete(
        `${API_URL}/Promotion/remove/${bookingResponse.booking_ID}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Reset promotion states
      setAppliedPromotion(null);
      setPromotionCode('');
      
      // Update booking summary
      const subtotal = bookingSummary.subtotal;
      const memberDiscount = bookingSummary.memberDiscount;
      const pointsDiscount = bookingSummary.pointsDiscount;
      
      // Calculate new total without promotion discount
      const totalDiscounts = memberDiscount + pointsDiscount;
      const newTotal = Math.max(0, subtotal - totalDiscounts);
      
      // Update booking summary
      setBookingSummary({
        ...bookingSummary,
        discounts: totalDiscounts,
        promotionDiscount: 0,
        total: newTotal
      });
      
      message.success('Đã hủy mã khuyến mãi thành công');
    } catch (error) {
      console.error('Error removing promotion:', error);
      message.error('Không thể hủy mã khuyến mãi. Vui lòng thử lại.');
    }
  };

  // Register new member with updated API
  const registerNewMember = async (values: any) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.post(`${API_URL}/User/staff-register`, {
        fullName: values.name,
        email: values.email,
        phoneNumber: values.phone,
        sex: values.sex || "Other"
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.data.success) {
        message.success('Đăng ký thành viên mới thành công!');
        setNewUserModalVisible(false);
        
        // Automatically set the phone number in the member lookup
        setMemberLookupType('phone');
        setMemberLookupValue(values.phone);
        
        // Trigger the lookup
        await lookupMember(values.phone, 'phone');
      }
    } catch (error) {
      console.error('Error registering new user:', error);
      message.error('Lỗi đăng ký thành viên mới');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    if (seat.seat_Status === 'Sold' || seat.seat_Status === 'Reserved' || seat.seat_Status === 'Booked' || seat.seat_Type === 'None') {
      message.warning('Ghế này không khả dụng');
      return;
    }
    
    const isSelected = selectedSeats.some(s => s.seat_ID === seat.seat_ID);
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seat_ID !== seat.seat_ID));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Cập nhật hàm xử lý khi nhấn nút "Tiếp tục" sau khi chọn ghế
  const handleContinueAfterSeatSelection = async () => {
    if (selectedSeats.length === 0) {
      message.error('Vui lòng chọn ít nhất một ghế');
      return;
    }
    
    // Tính toán tổng tiền và cập nhật booking summary
    const subtotal = calculateSubtotal();
    setBookingSummary({
      subtotal,
      discounts: 0,
      memberDiscount: 0,
      promotionDiscount: 0,
      pointsDiscount: 0,
      total: subtotal
    });
    
    // Tạo booking và chuyển sang bước tiếp theo
    const bookingCreated = await createBooking();
    if (bookingCreated) {
      setCurrentStep(3); // Chuyển sang bước nhập thông tin khách hàng
    }
  };

  // Cập nhật hàm để tạo booking trực tiếp sau khi chọn ghế
  const createBooking = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      message.error('Vui lòng chọn suất chiếu và ghế ngồi');
      return false;
    }
    
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // Tạo payload theo định dạng API yêu cầu
      const bookingPayload = {
        showtime_ID: selectedShowtime.showtime_ID,
        seat_IDs: selectedSeats.map(seat => seat.seat_ID),
        payment_Method: "Payos", // Mặc định là Payos theo yêu cầu
        pointsToUse: 0 // Mặc định là 0, có thể cập nhật nếu cần
      };
      
      // Gọi API để tạo booking
      const response = await axios.post(`${API_URL}/Booking`, bookingPayload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.data) {
        setBookingId(response.data.bookingId || response.data.id || response.data.booking_ID);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating booking:', error);
      message.error('Không thể tạo đơn đặt vé. Vui lòng thử lại.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle movie selection
  const handleMovieSelect = (movie: Movie) => {
    // Reset any previous booking data first
    resetBookingState();
    
    // Then set the new selected movie
    setSelectedMovie(movie);
    fetchAvailableDates(movie.movie_ID);
    setCurrentStep(1);
  };

  // Handle date selection
  const handleDateSelect = (date: moment.Moment | null) => {
    if (date && selectedMovie) {
      setSelectedDate(date);
      fetchShowtimes(selectedMovie.movie_ID, date.format('YYYY-MM-DD'));
    }
  };

  // Update the checkPendingBooking function
  const checkPendingBooking = async (): Promise<boolean> => {
    try {
      const token = getAuthToken();
      const response = await axios.get<PendingBookingResponse>(
        `${API_URL}/Booking/staff/check-pending`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );
      
      if (response.data) {
        setPendingBooking(response.data.pendingBooking);
        if (!response.data.canCreateNewBooking) {
          message.warning(response.data.message);
        }
        return response.data.canCreateNewBooking;
      }
      return true;
    } catch (error: unknown) {
      console.error('Error checking pending booking:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Không thể kiểm tra trạng thái đặt vé');
      }
      return false;
    }
  };

  // Update the cancelPendingBooking function
  const cancelPendingBooking = async (): Promise<boolean> => {
    if (!pendingBooking) return false;
    
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.put(
        `${API_URL}/Booking/${pendingBooking.booking_ID}/cancel`,
        {},
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          },
        }
      );
      
      if (response.status === 200) {
        message.success('Đã hủy đơn đặt vé trước đó');
        setPendingBooking(null);
        setCancelBookingModalVisible(false);
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error('Error canceling pending booking:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Không thể hủy đơn đặt vé');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update the handleShowtimeSelect function
  const handleShowtimeSelect = async (showtime: Showtime) => {
    const canCreateNewBooking = await checkPendingBooking();
    
    if (!canCreateNewBooking) {
      setSelectedShowtimeToBook(showtime);
      setCancelBookingModalVisible(true);
      return;
    }
    
    setSelectedShowtime(showtime);
    fetchSeats(showtime.showtime_ID);
    setCurrentStep(2);
  };

  // Update the handleCancelConfirmation function
  const handleCancelConfirmation = async () => {
    const cancelled = await cancelPendingBooking();
    if (cancelled && selectedShowtimeToBook) {
      setSelectedShowtime(selectedShowtimeToBook);
      fetchSeats(selectedShowtimeToBook.showtime_ID);
      setCurrentStep(2);
      setSelectedShowtimeToBook(null);
    }
  };

  // Calculate subtotal based on selected seats
  const calculateSubtotal = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  };

  const updateBookingSummary = () => {
    try {
      const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
      
      // Tính khuyến mãi thành viên
      let memberDiscount = 0;
      if (member && memberDiscountAmount > 0) {
        memberDiscount = (memberDiscountAmount / 100) * subtotal;
      }
      
      // Tính khuyến mãi từ mã giảm giá
      let promotionDiscount = 0;
      if (appliedPromotion && typeof appliedPromotion.discount_Amount === 'number') {
        promotionDiscount = appliedPromotion.discount_Amount;
      }
      
      // Tính điểm tích lũy sử dụng - đơn giản là 1:1
      const pointsDiscount = pointsToUse;
      
      // Tổng giảm giá
      const totalDiscounts = memberDiscount + promotionDiscount + pointsDiscount;
      
      // Tổng tiền sau giảm giá
      const total = Math.max(0, subtotal - totalDiscounts);
      
      console.log('Update booking summary:', {
        subtotal,
        memberDiscount,
        promotionDiscount,
        pointsDiscount,
        totalDiscounts,
        total,
        appliedPromotion
      });
      
      setBookingSummary({
        subtotal,
        discounts: totalDiscounts,
        memberDiscount,
        promotionDiscount,
        pointsDiscount,
        total
      });
    } catch (error) {
      console.error('Error updating booking summary:', error);
      message.error('Có lỗi xảy ra khi cập nhật thông tin đặt vé');
    }
  };
  

  // Handle customer form submission
  const handleCustomerSubmit = async (values: any) => {
    try {
      const customerInfo: Customer = {
        name: values.name || '', // Cho phép rỗng
        phone: values.phone || '', // Cho phép rỗng
        email: values.email || '', // Cho phép rỗng
        sex: values.sex || '', // Cho phép rỗng
      };
      setCustomer(customerInfo);
    setCurrentStep(4);
    } catch (error) {
      message.error('Có lỗi xảy ra khi lưu thông tin khách hàng');
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  // Cập nhật hàm xử lý thanh toán theo yêu cầu mới
  const processPayment = async () => {
    if (!bookingId || !customer.name || !customer.phone || !customer.email) {
      message.error('Thông tin đặt vé không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (paymentMethod === 'Cash') {
        // Thanh toán tại quầy - sử dụng PUT /api/Booking/{id}/payment
        const response = await axios.put(`${API_URL}/Booking/${bookingId}/payment`, {}, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          },
        });
        
        if (response.status === 200) {
          message.success('Thanh toán tại quầy thành công!');
          // Chuyển đến trang xác nhận đặt vé
          navigate('/booking-success', { 
            state: { 
              bookingId: bookingId,
              movieName: selectedMovie?.movie_Name,
              showtime: `${formatDate(selectedShowtime?.show_Date)} ${formatTime(selectedShowtime?.start_Time)}`,
              seats: selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', '),
              total: bookingSummary.total,
              paymentMethod: 'Thanh toán tại quầy'
            } 
          });
        }
      } else if (paymentMethod === 'Payos') {
        // Thanh toán QR Code - sử dụng /api/mock-payment/payment-url/${bookingId} hoặc fallback payos
        let payUrl = '';
        let ordCode = `MOCK_${bookingId}`;
        let amt = bookingSummary.total;

        try {
          const res = await axios.get(`${API_URL}/mock-payment/payment-url/${bookingId}`, {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          });
          if (res.data?.paymentUrl) {
            payUrl = res.data.paymentUrl;
            amt = res.data.amount || bookingSummary.total;
          }
        } catch {
          // Fallback if needed
          payUrl = `http://localhost:5173/mock-payment?bookingId=${bookingId}&amount=${bookingSummary.total}`;
        }

        setPaymentData({
          success: true,
          message: 'Tạo mã QR thanh toán thành công',
          paymentUrl: payUrl,
          qrCodeUrl: payUrl,
          orderCode: ordCode,
          amount: amt
        });
        setPaymentQrVisible(true);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      message.error('Lỗi xử lý thanh toán: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật hàm xử lý khi thanh toán QR thành công
  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      // Xác nhận thanh toán thành công cho đơn đặt vé
      await axios.put(`${API_URL}/Booking/${bookingId}/payment`, {}, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
      });

      setPaymentQrVisible(false);
      message.success('Thanh toán thành công!');
      
      // Chuyển đến trang xác nhận đặt vé
      navigate('/booking-success', { 
        state: { 
          bookingId: bookingId,
          movieName: selectedMovie?.movie_Name,
          showtime: `${formatDate(selectedShowtime?.show_Date)} ${formatTime(selectedShowtime?.start_Time)}`,
          seats: selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', '),
          total: bookingSummary.total,
          paymentMethod: 'Thanh toán QR Code'
        } 
      });
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      message.error('Lỗi khi xác nhận thanh toán: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = moment(dateString);
    return date.format('DD/MM/YYYY');
  };

  // Format time for display
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  // Filter movies based on search value
  const filteredMovies = movies.filter(movie => 
    movie.movie_Name.toLowerCase().includes(searchValue.toLowerCase()) ||
    movie.genre.toLowerCase().includes(searchValue.toLowerCase()) ||
    movie.director.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Get unique column numbers for headers
  const getUniqueColumnNumbers = () => {
    if (!seats || seats.length === 0) return [];
    const maxCol = Math.max(...seats.map(seat => seat.seat_Number));
    return Array.from({ length: maxCol }, (_, i) => i + 1);
  };

  // Get unique row names
  const getUniqueRowNames = () => {
    if (!seats || seats.length === 0) return [];
    return [...new Set(seats.map(seat => seat.row_Name))].sort();
  };

  // Group seats by row for better display
  const seatsByRow = () => {
    if (!seats || seats.length === 0) return {};
    
    const result: Record<string, Seat[]> = {};
    const rowNames = getUniqueRowNames();
    const columnNumbers = getUniqueColumnNumbers();
    
    rowNames.forEach(rowName => {
      result[rowName] = columnNumbers.map(colNum => {
        const seat = seats.find(s => s.row_Name === rowName && s.seat_Number === colNum);
        return seat || {
          seat_ID: -1,
          row_Name: rowName,
          seat_Number: colNum,
          seat_Type: 'None',
          price: 0,
          seat_Status: 'NotAvailable',
          layout_ID: -1
        };
      });
    });
    
    return result;
  };

  const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

  // Enhanced Movie Card Component
  const MovieCard = ({ movie, onSelect }) => {
    return (
      <Card 
        key={movie.movie_ID}
        hoverable
        className="movie-card w-full h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#161D2F] text-white shadow-lg transition-all duration-300 hover:border-red-500/50 hover:shadow-red-500/10"
        bodyStyle={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          padding: '16px',
          backgroundColor: '#161D2F' 
        }}
        styles={{ 
          body: { 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            padding: '16px',
            backgroundColor: '#161D2F' 
          } 
        }}
        cover={
          <div className="relative w-full overflow-hidden bg-slate-900" style={{ aspectRatio: '2/3' }}>
            <img 
              alt={movie.movie_Name} 
              src={movie.poster_URL || fallbackPoster} 
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => { e.currentTarget.src = fallbackPoster; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161D2F] via-transparent to-transparent opacity-60 pointer-events-none" />
            <Tag color={movie.rating === 'P13' ? 'orange' : movie.rating === 'C18' ? 'red' : 'green'} 
                className="absolute top-2.5 right-2.5 font-bold shadow-md">
              {movie.rating}
            </Tag>
          </div>
        }
        onClick={() => onSelect(movie)}
      >
        <Card.Meta
          title={<span className="text-base font-bold text-white truncate block" title={movie.movie_Name}>{movie.movie_Name}</span>}
          description={
            <div className="flex flex-col justify-between flex-1 mt-2">
              <div className="space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center text-gray-300">
                  <ClockCircleOutlined className="mr-1.5 text-red-400" />
                  <span>{movie.duration} phút</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <TagOutlined className="mr-1.5 text-red-400" />
                  <span className="truncate">{movie.genre}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <UserOutlined className="mr-1.5 text-red-400" />
                  <span className="truncate">Đạo diễn: {movie.director}</span>
                </div>
              </div>
              <Button 
                type="primary" 
                danger
                className="mt-3.5 w-full font-semibold rounded-lg h-9 bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30 border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(movie);
                }}
              >
                Đặt vé ngay
              </Button>
            </div>
          }
        />
      </Card>
    );
  };

  // Enhanced Showtime Info Header
  const ShowtimeInfoHeader = ({ movie, showtime }) => {
    return (
      <div className="sticky top-0 z-10 bg-[#161D2F] border border-white/10 shadow-lg p-4 mb-6 rounded-xl text-white">
        <Row gutter={16} align="middle">
          <Col span={4}>
            <div className="w-full overflow-hidden rounded-lg shadow-sm border border-white/10" style={{ aspectRatio: '2/3', maxHeight: '100px' }}>
              <img 
                src={movie?.poster_URL || fallbackPoster} 
                alt={movie?.movie_Name} 
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => { e.currentTarget.src = fallbackPoster; }}
              />
            </div>
          </Col>
          <Col span={14}>
            <Title level={4} className="m-0 text-white">{movie?.movie_Name}</Title>
            <Space className="mt-1">
              <Tag color="blue">{movie?.rating}</Tag>
              <Tag color="purple">{movie?.duration} phút</Tag>
            </Space>
            <div className="mt-2 text-gray-300">
              <Text strong className="text-white">Suất chiếu:</Text> {formatDate(showtime?.show_Date)} {formatTime(showtime?.start_Time)}
            </div>
          </Col>
          <Col span={6} className="text-right text-gray-300">
            <div>
              <Text strong className="text-white">Phòng:</Text> {showtime?.room_Name}
            </div>
            <div>
              <Text strong className="text-white">Giá:</Text> {showtime?.base_Price?.toLocaleString()} VND
            </div>
            <div className="mt-2">
              <Tag color="green">Còn {seats.filter(s => s.seat_Status !== 'Booked' && s.seat_Status !== 'Reserved' && s.seat_Status !== 'Sold').length} ghế trống</Tag>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

// Enhanced Member Details Component
const MemberDetailsView = ({ member }) => {
  if (!member) return null;
  
  return (
    <div className="member-details bg-[#0B0F19]/80 border border-white/10 p-5 mt-4 rounded-xl text-white">
      <div className="text-base font-bold text-white mb-3 flex items-center justify-between">
        <span>Thông tin thành viên</span>
        <Tag color={member.membershipStatus === 'VIP' ? 'gold' : 'blue'} className="px-2.5 py-0.5 text-xs font-bold">
          {member.membershipStatus}
        </Tag>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-400">Họ và tên:</span>{' '}
          <span className="text-white font-medium">{member.full_Name}</span>
        </div>
        <div>
          <span className="text-gray-400">Số điện thoại:</span>{' '}
          <span className="text-white font-medium">{member.phone_Number}</span>
        </div>
        <div>
          <span className="text-gray-400">Email:</span>{' '}
          <span className="text-white font-medium">{member.email}</span>
        </div>
        <div>
          <span className="text-gray-400">Điểm tích lũy:</span>{' '}
          <Tag color="green" className="font-bold">{member.currentPoints?.toLocaleString() || 0} điểm</Tag>
        </div>
      </div>
      
      {!appliedPromotion && (
        <Alert
          message="Lưu ý khuyến mãi"
          description="Mã khuyến mãi trước đó đã bị hủy khi chọn thành viên. Vui lòng áp dụng lại mã nếu cần."
          type="info"
          showIcon
          className="mt-4 bg-sky-950/40 border border-sky-500/30 text-sky-200"
        />
      )}
    </div>
  );
};

// Enhanced Promotion Section
const EnhancedPromotionSection = () => {
  return (
    <>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Nhập mã khuyến mãi"
          value={promotionCode}
          onChange={(e) => setPromotionCode(e.target.value)}
          disabled={loading || appliedPromotion}
          className="flex-1 bg-[#0B0F19] border-white/10 text-white rounded-xl h-11"
        />
        {appliedPromotion ? (
          <Button
            type="default"
            danger
            onClick={() => {
              setAppliedPromotion(null);
              setPromotionCode('');
              const subtotal = bookingSummary.subtotal;
              const memberDiscount = bookingSummary.memberDiscount;
              const pointsDiscount = bookingSummary.pointsDiscount;
              const totalDiscounts = memberDiscount + pointsDiscount;
              const newTotal = Math.max(0, subtotal - totalDiscounts);
              setBookingSummary({
                ...bookingSummary,
                discounts: totalDiscounts,
                promotionDiscount: 0,
                total: newTotal
              });
              message.success('Đã xóa mã khuyến mãi');
            }}
            loading={loading}
            className="rounded-xl h-11 px-5 border-red-500/50 text-red-400 hover:text-red-300"
          >
            Hủy
          </Button>
        ) : (
          <Button
            type="primary"
            danger
            onClick={applyPromotionCode}
            loading={loading}
            className="rounded-xl h-11 px-6 bg-red-600 hover:bg-red-500 font-bold shadow-md shadow-red-600/20"
          >
            Áp dụng
          </Button>
        )}
      </div>
      
      {appliedPromotion && (
        <Alert
          message="Mã khuyến mãi đã được áp dụng"
          description={
            `Mã: ${appliedPromotion.code} - Giảm: ${
              appliedPromotion.discount_Amount > 0 
                ? appliedPromotion.discount_Amount.toLocaleString() 
                : bookingSummary.promotionDiscount > 0 
                  ? bookingSummary.promotionDiscount.toLocaleString()
                  : '0'
            } VND`
          }
          type="success"
          showIcon
          className="mb-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200"
        />
      )}
    </>
  );
};


  // Payment methods options
  const paymentMethods: PaymentMethod[] = [
    { id: 'Cash', name: 'Thanh toán tại quầy', icon: <DollarOutlined /> },
    { id: 'Payos', name: 'Thanh toán QR Code', icon: <QrcodeOutlined /> },
  ];

  return (
    <div className="container mx-auto p-4 text-white">
      <Title level={2} className="mb-6 text-white">Bán vé xem phim (Nhân viên)</Title>
      
      <Steps current={currentStep} className="mb-8">
        <Step title="Chọn phim" icon={<PlayCircleOutlined />} />
        <Step title="Chọn suất chiếu" icon={<CalendarOutlined />} />
        <Step title="Chọn ghế" icon={<TeamOutlined />} />
        <Step title="Thông tin khách hàng" icon={<UserOutlined />} />
        <Step title="Thanh toán" icon={<CreditCardOutlined />} />
      </Steps>
      
      {/* Step 1: Movie Selection */}
      {currentStep === 0 && (
        <div className="movie-selection">
          <div className="mb-6">
            <Input 
              placeholder="Tìm kiếm phim theo tên, thể loại, đạo diễn..." 
              prefix={<SearchOutlined />} 
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              size="large"
              className="max-w-lg"
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center my-8">
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredMovies.map(movie => (
                <Col xs={24} sm={12} md={8} lg={6} key={movie.movie_ID} className="flex">
                  <MovieCard movie={movie} onSelect={handleMovieSelect} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}
      
      {/* Step 2: Showtime Selection */}
      {currentStep === 1 && selectedMovie && (
        <div className="showtime-selection">
          <Button 
            type="link" 
            icon={<LeftOutlined />} 
            onClick={() => setCurrentStep(0)}
            className="mb-4 text-red-400 hover:text-red-300 p-0"
          >
            Quay lại chọn phim
          </Button>
          
          <Row gutter={24} className="bg-[#161D2F] border border-white/10 p-6 rounded-2xl mb-6 shadow-lg">
            <Col span={6}>
              <div className="w-full overflow-hidden rounded-xl shadow-md bg-slate-900 border border-white/10" style={{ aspectRatio: '2/3' }}>
                <img 
                  src={selectedMovie.poster_URL || fallbackPoster} 
                  alt={selectedMovie.movie_Name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.src = fallbackPoster; }}
                />
              </div>
            </Col>
            <Col span={18} className="flex flex-col justify-center">
              <Title level={3} className="text-white m-0 mb-4">{selectedMovie.movie_Name}</Title>
              <Row gutter={[24, 12]} className="text-gray-300">
                <Col span={12} className="space-y-2">
                  <p><strong className="text-white">Đạo diễn:</strong> {selectedMovie.director}</p>
                  <p><strong className="text-white">Thể loại:</strong> {selectedMovie.genre}</p>
                  <p><strong className="text-white">Diễn viên:</strong> {selectedMovie.cast}</p>
                </Col>
                <Col span={12} className="space-y-2">
                  <p><strong className="text-white">Thời lượng:</strong> {selectedMovie.duration} phút</p>
                  <p><strong className="text-white">Phân loại:</strong> <Tag color={selectedMovie.rating === 'P13' ? 'orange' : 'green'}>{selectedMovie.rating}</Tag></p>
                </Col>
              </Row>
            </Col>
          </Row>
          
          <Divider className="border-white/10" />
          
          <Title level={4} className="text-white">Chọn ngày chiếu</Title>
          <div className="date-selection mb-6 overflow-auto pb-2">
            <Space size="middle">
              {availableDates.map((date, index) => {
                const momentDate = moment(date);
                const isSelected = selectedDate && momentDate.isSame(selectedDate, 'day');
                
                return (
                  <div 
                    key={index} 
                    className={`date-card p-3 rounded-xl cursor-pointer text-center min-w-[100px] border transition-all ${
                      isSelected 
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30 font-bold' 
                        : 'bg-[#161D2F] border-white/10 text-gray-300 hover:border-red-500/50 hover:bg-white/5'
                    }`}
                    onClick={() => handleDateSelect(momentDate)}
                  >
                    <div className="text-xl font-bold">{momentDate.format('DD')}</div>
                    <div className={isSelected ? 'text-white' : 'text-gray-400 text-xs mt-0.5'}>
                      {momentDate.format('ddd')}
                    </div>
                    <div className={isSelected ? 'text-white/80' : 'text-gray-400 text-xs'}>
                      {momentDate.format('MM/YYYY')}
                    </div>
                  </div>
                );
              })}
            </Space>
          </div>
          
          <Title level={4} className="text-white">Chọn suất chiếu</Title>
          {loading ? (
            <div className="flex justify-center my-8">
              <Spin size="large" />
            </div>
          ) : showtimes.length > 0 ? (
            <div className="showtimes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showtimes.map(showtime => (
                <Card 
                  key={showtime.showtime_ID} 
                  className="showtime-card cursor-pointer bg-[#161D2F] border border-white/10 rounded-xl hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10 transition-all text-white"
                  styles={{ body: { padding: '16px', backgroundColor: '#161D2F' } }}
                  onClick={() => handleShowtimeSelect(showtime)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {formatTime(showtime.start_Time)} - {formatTime(showtime.end_Time)}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Phòng: {showtime.room_Name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-500 text-base">
                        {showtime.base_Price.toLocaleString()} VND
                      </div>
                      <Tag color="blue" className="mt-1">{showtime.price_Tier}</Tag>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 bg-[#161D2F] border border-white/10 rounded-xl text-center">
              <Empty description={<span className="text-gray-400">Không có suất chiếu nào cho ngày này</span>} />
            </div>
          )}
        </div>
      )}
      
      {/* Step 3: Seat Selection */}
      {currentStep === 2 && selectedMovie && selectedShowtime && (
        <div className="seat-selection">
          <Button 
            type="link" 
            icon={<LeftOutlined />} 
            onClick={() => setCurrentStep(1)}
            className="mb-4 text-red-400 hover:text-red-300 p-0"
          >
            Quay lại chọn suất chiếu
          </Button>
          
          <ShowtimeInfoHeader movie={selectedMovie} showtime={selectedShowtime} />
          
          {loading ? (
            <div className="flex justify-center my-12">
              <Spin size="large" />
            </div>
          ) : (
            <div className="seat-layout-container mt-8 flex flex-col items-center">
              <Screen>
                <ScreenText>Màn hình</ScreenText>
              </Screen>
              
              <SeatingArea>
                {/* Column headers */}
                <div></div> {/* Empty cell for alignment */}
                <ColumnHeader>
                  {getUniqueColumnNumbers().map(colNum => (
                    <ColumnLabel key={`col-${colNum}`}>{colNum}</ColumnLabel>
                  ))}
                </ColumnHeader>
                <div></div> {/* Empty cell for alignment */}
                
                {/* Seat rows */}
                {Object.entries(seatsByRow()).map(([rowName, rowSeats]) => (
                  <RowContainer key={`row-${rowName}`}>
                    <RowLabel>{rowName}</RowLabel>
                    <SeatsSection>
                      {rowSeats
                        .sort((a, b) => a.seat_Number - b.seat_Number)
                        .map(seat => {
                          const isSelected = selectedSeats.some(s => s.seat_ID === seat.seat_ID);
                          const isUnavailable = seat.seat_Status === 'Sold' || seat.seat_Status === 'Reserved' || seat.seat_Status === 'Booked';
                          
                          return (
                            <SeatButtonWrapper key={seat.seat_ID}>
                              <SeatButton
                                seatType={seat.seat_Type}
                                seatStatus={seat.seat_Status}
                                isSelected={isSelected}
                                onClick={() => handleSeatSelect(seat)}
                                whileHover={!isUnavailable ? { scale: 1.05 } : {}}
                                whileTap={!isUnavailable ? { scale: 0.95 } : {}}
                                disabled={isUnavailable}
                              >
                                <SeatNumber>{seat.seat_Number}</SeatNumber>
                              </SeatButton>
                              <SeatTooltip>
                                {seat.row_Name}{seat.seat_Number} - {seat.seat_Type}<br />
                                {seat.price.toLocaleString()} VND<br />
                                {isUnavailable && <span style={{ color: '#ef4444' }}>Ghế không khả dụng</span>}
                              </SeatTooltip>
                            </SeatButtonWrapper>
                          );
                        })}
                    </SeatsSection>
                    <RowLabel>{rowName}</RowLabel>
                  </RowContainer>
                ))}
                
                {/* Column footers */}
                <div></div> {/* Empty cell for alignment */}
                <ColumnFooter>
                  {getUniqueColumnNumbers().map(colNum => (
                    <ColumnLabel key={`col-footer-${colNum}`}>{colNum}</ColumnLabel>
                  ))}
                </ColumnFooter>
                <div></div> {/* Empty cell for alignment */}
              </SeatingArea>
              
              <SeatLegend>
                <LegendItem>
                  <ColorBox color="#3b82f6" />
                  <span>Ghế thường</span>
                </LegendItem>
                <LegendItem>
                  <ColorBox color="#ef4444" />
                  <span>Ghế VIP</span>
                </LegendItem>
                <LegendItem>
                  <ColorBox color="#9ca3af" />
                  <span>Đã bán/Đặt trước</span>
                </LegendItem>
                <LegendItem>
                  <ColorBox color="#e5e7eb" />
                  <span>Không có ghế</span>
                </LegendItem>
                <LegendItem>
                  <ColorBox color="#22c55e" style={{ border: '3px solid #22c55e' }} />
                  <span>Đang chọn</span>
                </LegendItem>
              </SeatLegend>
              
              <div className="mt-8 bg-[#161D2F] border border-white/10 p-6 rounded-2xl shadow-xl mx-auto max-w-4xl text-white w-full">
                <Row gutter={24} align="middle">
                  <Col span={16}>
                    <div className="mb-2">
                      <Text strong className="text-lg text-white">Ghế đã chọn ({selectedSeats.length}):</Text>
                      <div className="mt-2">
                        {selectedSeats.length > 0 ? (
                          <Space wrap>
                            {selectedSeats.map(seat => (
                              <Tag 
                                key={seat.seat_ID} 
                                color={seat.seat_Type === 'VIP' ? 'red' : 'blue'}
                                closable
                                onClose={() => handleSeatSelect(seat)}
                                className="text-base py-1 px-2.5 rounded-lg font-medium"
                              >
                                {seat.row_Name}{seat.seat_Number} - {seat.price.toLocaleString()} VND
                              </Tag>
                            ))}
                          </Space>
                        ) : (
                          <Text className="text-gray-400">Chưa chọn ghế nào</Text>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col span={8} className="text-right">
                    <div>
                      <Text className="text-gray-400">Tổng tiền:</Text>
                      <div className="text-2xl font-black text-red-500">
                        {calculateSubtotal().toLocaleString()} VND
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      danger
                      size="large" 
                      className="mt-4 w-full h-11 font-bold rounded-xl bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30"
                      onClick={handleContinueAfterSeatSelection}
                      disabled={selectedSeats.length === 0}
                      loading={loading}
                    >
                      Tiếp tục ({selectedSeats.length} ghế)
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Step 4: Customer Information */}
      {currentStep === 3 && selectedMovie && selectedShowtime && (
        <div className="customer-info">
          <Button 
            type="link" 
            icon={<LeftOutlined />} 
            onClick={async () => {
              try {
                const token = getAuthToken();
                const response = await axios.put(`${API_URL}/Booking/${bookingId}/cancel`, {}, {
                  headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    'Content-Type': 'application/json'
                  },
                });

                if (response.status === 200) {
                  setCurrentStep(2);
                }
              } catch (error) {
                console.error('Error canceling booking:', error);
                message.error('Không thể hủy đặt vé');
              }
            }}
            className="mb-4 text-red-400 hover:text-red-300 p-0"
          >
            Quay lại chọn ghế
          </Button>
          
          <Card className="mb-6 bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl" title={<span className="text-white font-bold text-lg">Thông tin đặt vé</span>}>
            <Row gutter={24}>
              <Col span={8}>
                <div className="w-full overflow-hidden rounded-xl shadow-md bg-slate-900 border border-white/10" style={{ aspectRatio: '2/3' }}>
                  <img 
                    src={selectedMovie.poster_URL || fallbackPoster} 
                    alt={selectedMovie.movie_Name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.src = fallbackPoster; }}
                  />
                </div>
              </Col>
              <Col span={16}>
                <div className="space-y-3 bg-[#0B0F19]/60 border border-white/10 p-5 rounded-xl text-sm">
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-gray-400">Phim:</span>
                    <span className="text-white font-bold">{selectedMovie.movie_Name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-gray-400">Suất chiếu:</span>
                    <span className="text-white font-medium">{formatDate(selectedShowtime.show_Date)} {formatTime(selectedShowtime.start_Time)} - {formatTime(selectedShowtime.end_Time)}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-gray-400">Phòng chiếu:</span>
                    <span className="text-white font-medium">{selectedShowtime.room_Name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-gray-400">Ghế đã chọn:</span>
                    <span className="text-red-400 font-bold">{selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-400 font-medium">Tổng tiền vé:</span>
                    <span className="text-xl font-black text-red-500">{calculateSubtotal().toLocaleString()} VND</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
          
          <Card title={<span className="text-white font-bold text-lg">Tìm kiếm thành viên</span>} className="mb-6 bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              <Select 
                defaultValue="phone" 
                style={{ width: 140 }}
                onChange={(value) => setMemberLookupType(value)}
              >
                <Option value="phone">Số điện thoại</Option>
                <Option value="email">Email</Option>
              </Select>
              <Input 
                placeholder={memberLookupType === 'phone' ? "Nhập số điện thoại..." : "Nhập email..."}
                value={memberLookupValue}
                onChange={(e) => setMemberLookupValue(e.target.value)}
                className="bg-[#0B0F19] border-white/10 text-white rounded-xl h-10 max-w-sm"
              />
              <Button 
                type="primary" 
                danger
                onClick={() => lookupMember(memberLookupValue, memberLookupType)}
                loading={lookupLoading}
                className="rounded-xl h-10 px-5 bg-red-600 hover:bg-red-500 font-bold shadow-md shadow-red-600/20"
              >
                Tìm kiếm
              </Button>
              <Button 
                type="default"
                icon={<PlusOutlined />}
                onClick={() => setNewUserModalVisible(true)}
                className="rounded-xl h-10 border-white/20 text-gray-200 hover:border-white/40 hover:text-white"
              >
                Đăng ký thành viên mới
              </Button>
            </div>
            
            {member && <MemberDetailsView member={member} />}
          </Card>
          
          <Card title={<span className="text-white font-bold text-lg">Thông tin khách hàng</span>} className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl">
            <Form
              form={customerForm}
              layout="vertical"
              onFinish={handleCustomerSubmit}
              initialValues={{
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                sex: customer.sex || 'Other'
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label={<span className="text-gray-300">Họ và tên</span>}
                  >
                    <Input placeholder="Nhập họ và tên" className="bg-[#0B0F19] border-white/10 text-white rounded-xl h-10" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label={<span className="text-gray-300">Số điện thoại</span>}
                  >
                    <Input placeholder="Nhập số điện thoại" className="bg-[#0B0F19] border-white/10 text-white rounded-xl h-10" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label={<span className="text-gray-300">Email</span>}
                    rules={[
                      { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                  >
                    <Input placeholder="Nhập email" className="bg-[#0B0F19] border-white/10 text-white rounded-xl h-10" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sex"
                    label={<span className="text-gray-300">Giới tính</span>}
                  >
                    <Select className="rounded-xl">
                      <Option value="Male">Nam</Option>
                      <Option value="Female">Nữ</Option>
                      <Option value="Other">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Checkbox 
                  checked={sendConfirmation} 
                  onChange={(e) => setSendConfirmation(e.target.checked)}
                  className="text-gray-300"
                >
                  Gửi thông tin đặt vé qua email
                </Checkbox>
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  danger
                  htmlType="submit" 
                  size="large"
                  className="h-12 px-8 font-bold text-base rounded-xl bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30"
                >
                  Tiếp tục đến thanh toán
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )}
      
      {/* Step 5: Payment */}
      {currentStep === 4 && selectedMovie && selectedShowtime && (
        <div className="payment">
          <Button 
            type="link" 
            icon={<LeftOutlined />} 
            onClick={() => setCurrentStep(3)}
            className="mb-4 text-red-400 hover:text-red-300 p-0"
          >
            Quay lại thông tin khách hàng
          </Button>
          
          <Row gutter={24}>
            <Col span={16}>
              <Card title={<span className="text-white font-bold text-lg">Chọn phương thức thanh toán</span>} className="mb-6 bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl">
                <div className="payment-methods space-y-3">
                  {paymentMethods.map(method => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <div 
                        key={method.id}
                        className={`payment-method-item p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/10' 
                            : 'border-white/10 bg-[#0B0F19]/60 hover:border-white/20 hover:bg-white/5'
                        }`}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            isSelected ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'bg-white/5 text-gray-400'
                          }`}>
                            {method.icon}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base">{method.name}</div>
                            <div className="text-gray-400 text-xs mt-0.5">
                              {method.id === 'Cash' 
                                ? 'Thanh toán trực tiếp tại quầy bằng tiền mặt' 
                                : 'Quét mã QR qua ứng dụng ngân hàng / ví điện tử'}
                            </div>
                          </div>
                        </div>

                        {/* Custom Radio Indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-red-500 bg-red-600' : 'border-gray-500 bg-transparent'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              
              <Card title={<span className="text-white font-bold text-lg">Mã khuyến mãi & Ưu đãi</span>} className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl">
                <EnhancedPromotionSection />
                
                {member && (
                  <div className="mt-4 p-4 bg-[#0B0F19]/60 border border-white/10 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <Text className="text-gray-300 font-medium">Điểm tích lũy của thành viên:</Text>
                      <Tag color="green" className="text-base px-2 py-0.5 font-bold">{member.currentPoints?.toLocaleString() || 0} điểm</Tag>
                    </div>
                    
                    {member.currentPoints > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Input
                          type="number"
                          placeholder="Số điểm muốn sử dụng"
                          value={pointsToUse}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            // Round to nearest multiple of 1000
                            const roundedValue = Math.floor(value / 1000) * 1000;
                            // Ensure not exceeding member points or 50% of total bill
                            const maxAllowedPoints = Math.floor(bookingSummary.subtotal * 0.5);
                            setPointsToUse(Math.min(roundedValue, member.currentPoints, maxAllowedPoints));
                          }}
                          step="1000"
                          min="0"
                          max={Math.min(member.currentPoints, Math.floor(bookingSummary.subtotal * 0.5))}
                          className="bg-[#0B0F19] border-white/10 text-white rounded-xl h-11 flex-1"
                        />
                        <Button 
                          type="primary" 
                          danger
                          onClick={applyPointsDiscount}
                          disabled={pointsToUse <= 0}
                          className="rounded-xl h-11 px-5 bg-red-600 hover:bg-red-500 font-bold"
                        >
                          Sử dụng điểm
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Col>
            
            <Col span={8}>
              <Card 
                title={<span className="text-white font-bold text-lg">Thông tin thanh toán</span>} 
                className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl sticky-summary text-white"
                style={{ position: 'sticky', top: '20px' }}
              >
                <div className="space-y-3 bg-[#0B0F19]/60 border border-white/10 p-4 rounded-xl mb-4 text-sm">
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-gray-400">Phim:</span>
                    <span className="text-white font-bold text-right max-w-[65%]">{selectedMovie.movie_Name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-gray-400">Suất chiếu:</span>
                    <span className="text-white font-medium">{formatDate(selectedShowtime.show_Date)} {formatTime(selectedShowtime.start_Time)}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-gray-400">Phòng chiếu:</span>
                    <span className="text-white font-medium">{selectedShowtime.room_Name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ghế:</span>
                    <span className="text-red-400 font-bold">{selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}</span>
                  </div>
                </div>
                
                <Divider className="border-white/10 my-4" />
                
                <div className="price-summary space-y-2 text-sm">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Tạm tính:</span>
                    <span className="font-semibold text-white">{bookingSummary.subtotal.toLocaleString()} VND</span>
                  </div>
                  
                  {memberDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-400">
                      <span>Giảm giá thành viên ({memberDiscountAmount}%):</span>
                      <span className="font-semibold">-{bookingSummary.memberDiscount.toLocaleString()} VND</span>
                    </div>
                  )}
                  
                  {appliedPromotion && (
                    <div className="flex justify-between items-center text-emerald-400">
                      <span>Mã khuyến mãi ({appliedPromotion.code}):</span>
                      <span className="font-semibold">-{appliedPromotion.discount_Amount.toLocaleString()} VND</span>
                    </div>
                  )}
                  
                  {bookingSummary.pointsDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-400">
                      <span>Điểm tích lũy sử dụng:</span>
                      <span className="font-semibold">-{bookingSummary.pointsDiscount.toLocaleString()} VND</span>
                    </div>
                  )}
                  
                  <Divider className="border-white/10 my-3" />
                  
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold text-white">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-red-500" id="total-amount">
                      {bookingSummary.total.toLocaleString()} VND
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="primary" 
                  danger
                  size="large" 
                  block 
                  className="mt-6 h-12 font-bold text-base rounded-xl bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30"
                  onClick={processPayment}
                  loading={loading}
                >
                  {paymentMethod === 'Cash' ? 'Xác nhận thanh toán tại quầy' : 'Tạo mã QR thanh toán'}
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      )}
      
      {/* New User Registration Modal */}
      <Modal
        title="Đăng ký thành viên mới"
        open={newUserModalVisible}
        onCancel={() => setNewUserModalVisible(false)}
        footer={null}
      >
        <Form
          form={newUserForm}
          layout="vertical"
          onFinish={registerNewMember}
        >
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>
          
          <Form.Item
            name="sex"
            label="Giới tính"
            initialValue="Other"
          >
            <Select>
              <Option value="Male">Nam</Option>
              <Option value="Female">Nữ</Option>
              <Option value="Other">Khác</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Đăng ký
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* QR Payment Modal */}
      <Modal
        title={<span className="text-white font-bold">Thanh toán QR Code</span>}
        open={paymentQrVisible}
        onCancel={() => setPaymentQrVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPaymentQrVisible(false)} className="rounded-lg">
            Hủy / Đóng
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            loading={loading}
            onClick={handlePaymentSuccess}
            className="bg-emerald-600 hover:bg-emerald-500 border-none font-bold rounded-lg px-5 text-white"
          >
            Đã thanh toán thành công
          </Button>
        ]}
      >
        {paymentData && (
          <div className="text-center py-2">
            <div className="mb-4">
              <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
                <QRCode value={paymentData.qrCodeUrl || paymentData.paymentUrl} size={220} bordered={false} />
              </div>
            </div>
            <div className="mb-1.5">
              <Text className="text-gray-300">Mã đơn hàng: <strong className="text-white">{paymentData.orderCode}</strong></Text>
            </div>
            <div className="mb-4">
              <Text className="text-red-500 text-2xl font-black">
                {paymentData.amount.toLocaleString()} VND
              </Text>
            </div>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để thanh toán.<br />
              Sau khi khách hàng chuyển khoản thành công, nhấn <strong className="text-emerald-400">"Đã thanh toán thành công"</strong>.
            </p>
            <div className="mt-4">
              <Button type="link" href={paymentData.paymentUrl} target="_blank" className="text-red-400 hover:text-red-300">
                Mở liên kết thanh toán bên ngoài →
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        title="Đơn đặt vé chưa hoàn tất"
        open={cancelBookingModalVisible}
        onCancel={() => setCancelBookingModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCancelBookingModalVisible(false)}>
            Không hủy
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            danger 
            onClick={handleCancelConfirmation}
            loading={loading}
          >
            Hủy đơn đặt vé
          </Button>,
        ]}
      >
        {pendingBooking && (
          <div>
            <Alert
              type="warning"
              message="Thông báo"
              description={
                <div>
                  <p>Bạn đang có đơn đặt vé chưa hoàn tất:</p>
                  <ul className="mt-2">
                    <li>Phim: {pendingBooking.movieName}</li>
                    <li>Suất chiếu: {moment(pendingBooking.show_Date).format('DD/MM/YYYY')} {pendingBooking.start_Time}</li>
                    <li>Phòng: {pendingBooking.roomName}</li>
                    <li>Ghế: {pendingBooking.seats}</li>
                    <li>Tổng tiền: {pendingBooking.total_Amount.toLocaleString()} VND</li>
                    <li>Thời gian còn lại: {pendingBooking.remainingMinutes} phút</li>
                  </ul>
                  <p className="mt-2">Bạn có muốn hủy đơn đặt vé này để tiếp tục đặt vé mới không?</p>
                </div>
              }
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageBookings;  

