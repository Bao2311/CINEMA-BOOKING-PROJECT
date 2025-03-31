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
import { useNavigate } from 'react-router-dom';

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
  discount_Value: number;
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
  total: number;
}

interface BookingResponse {
  booking_ID: number;
  seat_IDs: number[];
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
  grid-template-columns: 40px 1fr 40px; /* Row label, seats section, row label */
  gap: 0.5rem;
  width: 100%;
  max-width: 900px;
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #d1d5db;
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
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 6px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #d1d5db;
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

const SeatButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: ${props => props.isSelected ? '3px solid #22c55e' : '1px solid #d1d5db'};
  box-shadow: ${props => props.isSelected ? '0 0 10px rgba(34, 197, 94, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  background-color: ${props => {
    if (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') return '#9ca3af'; // Booked or Reserved seats
    switch (props.seatType) {
      case 'VIP':
        return '#ef4444'; // VIP seats - red
      case 'Regular':
      default:
        return '#3b82f6'; // Regular seats - blue
    }
  }};
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: ${props => (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') ? 'not-allowed' : 'pointer'};
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.15)'};
  }

  // Add seat shape styling
  &:before {
    content: '';
    position: absolute;
    top: -4px;
    left: 10px;
    right: 10px;
    height: 4px;
    background-color: ${props => props.isSelected ? '#22c55e' : props.seatType === 'VIP' ? '#dc2626' : '#2563eb'};
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
  gap: 2rem;
  margin-top: 2.5rem;
  flex-wrap: wrap;
  background: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #4b5563;
  font-weight: 500;
`;

const ColorBox = styled.div`
  width: 20px;
  height: 20px;
  background-color: ${props => props.color};
  border-radius: 4px;
  border: 1px solid #e5e7eb;
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
    total: 0
  });
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [seatIds, setSeatIds] = useState<number[]>([]);

  const [customerForm] = Form.useForm();
  const [membershipForm] = Form.useForm();
  const [newUserForm] = Form.useForm();

  // Reset booking state when component mounts or when route changes
  useEffect(() => {
    fetchNowShowingMovies();
    fetchPromotions();
    
    return () => {
      resetBookingState();
    };
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
      const response = await axios.get('https://localhost:7168/api/Movie/now-showing', {
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
      const response = await axios.get('https://localhost:7168/api/Promotion', {
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
      const response = await axios.get(`https://localhost:7168/api/Showtimes/movie/${movieId}/dates`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data && response.data.$values) {
        setAvailableDates(response.data.$values);
        if (response.data.$values.length > 0) {
          setSelectedDate(moment(response.data.$values[0]));
          fetchShowtimes(movieId, moment(response.data.$values[0]).format('YYYY-MM-DD'));
        }
      } else if (Array.isArray(response.data)) {
        setAvailableDates(response.data);
        if (response.data.length > 0) {
          setSelectedDate(moment(response.data[0]));
          fetchShowtimes(movieId, moment(response.data[0]).format('YYYY-MM-DD'));
        }
      } else {
        setAvailableDates([]);
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
        ? `https://localhost:7168/api/Showtimes/movie/${movieId}/date/${date}` 
        : `https://localhost:7168/api/Showtimes/movie/${movieId}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data && response.data.$values) {
        setShowtimes(response.data.$values);
      } else if (Array.isArray(response.data)) {
        setShowtimes(response.data);
      } else {
        setShowtimes([]);
      }
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
      const response = await axios.get<ShowtimeSeatsResponse>(`https://localhost:7168/api/Seat/showtime/${showtimeId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (response.data && response.data.seats && response.data.seats.$values) {
        const seatsWithIds = response.data.seats.$values.map((seat, index) => ({
          ...seat,
          seat_ID: seat.seat_ID === 0 ? seat.layout_ID : seat.seat_ID
        }));
        
        setSeats(seatsWithIds);
      } else if (response.data && response.data.seats && Array.isArray(response.data.seats)) {
        const seatsWithIds = response.data.seats.map((seat, index) => ({
          ...seat,
          seat_ID: seat.seat_ID === 0 ? seat.layout_ID : seat.seat_ID
        }));
        
        setSeats(seatsWithIds);
      } else {
        setSeats([]);
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      setError('Không thể tải danh sách ghế');
      message.error('Không thể tải danh sách ghế');
    } finally {
      setLoading(false);
    }
  };

  // Lookup member by phone or email
  const lookupMember = async (value: string, type: 'phone' | 'email') => {
    if (!value) return;
    
    try {
      setLookupLoading(true);
      const token = getAuthToken();
      const endpoint = type === 'phone' 
        ? `https://localhost:7168/api/Member/lookup/phone/${encodeURIComponent(value)}`
        : `https://localhost:7168/api/Member/lookup/email/${encodeURIComponent(value)}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data) {
        // Map API response to Member interface
        const memberData: Member = {
          user_ID: response.data.user_ID,
          full_Name: response.data.full_Name,
          email: response.data.email,
          phone_Number: response.data.phone_Number,
          currentPoints: response.data.currentPoints,
          isVip: response.data.isVip,
          membershipStatus: response.data.membershipStatus,
          sex: response.data.sex || 'Other'
        };
        setMember(memberData);
        customerForm.setFieldsValue({
          name: response.data.full_Name,
          phone: response.data.phone_Number,
          email: response.data.email,
          sex: response.data.sex || 'Other'
        });
        setCustomer({
          name: response.data.full_Name,
          phone: response.data.phone_Number,
          email: response.data.email,
          sex: response.data.sex || 'Other'
        });
        
        fetchMemberDiscount(response.data.membershipStatus);
        message.success('Tìm thấy thông tin thành viên!');
      } else {
        setMember(null);
        message.info('Không tìm thấy thành viên với thông tin cung cấp');
      }
    } catch (error) {
      console.error('Error looking up member:', error);
      message.error('Lỗi khi tìm kiếm thành viên');
      setMember(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Apply member info to the form
  const applyMemberInfo = () => {
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
    message.success('Đã áp dụng thông tin thành viên!');
  };

  // Fetch member discount based on membership level
  const fetchMemberDiscount = async (membershipLevel: string) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`https://localhost:7168/api/Member/discount/${membershipLevel.toLowerCase()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data) {
        setMemberDiscountAmount(response.data);
        updateBookingSummary(selectedSeats, response.data, appliedPromotion?.discount_Amount || 0, 0);
      }
    } catch (error) {
      console.error('Error fetching member discount:', error);
      setMemberDiscountAmount(0);
    }
  };

  // Apply promotion code using new API
  const applyPromotionCode = async () => {
    if (!promotionCode || !bookingId) {
      message.warning('Vui lòng nhập mã khuyến mãi và đảm bảo đã tạo đơn đặt vé');
      return;
    }
    
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // Tìm promotion ID từ mã khuyến mãi
      const promotion = promotions.find(p => p.promotion_Code === promotionCode);
      if (!promotion) {
        message.error('Không tìm thấy mã khuyến mãi');
        setLoading(false);
        return;
      }
      
      // Sử dụng API mới để áp dụng khuyến mãi
      const response = await axios.post('https://localhost:7168/api/Member/discount/promotion', {
        userId: member?.user_ID || 0,
        bookingId: bookingId,
        promotionId: promotion.promotion_ID
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.data) {
        // Giả định rằng API trả về thông tin về khuyến mãi đã áp dụng
        const discountAmount = calculateSubtotal() * (promotion.discount_Value / 100);
        
        setAppliedPromotion({
          promotion_ID: promotion.promotion_ID,
          code: promotion.promotion_Code,
          name: promotion.promotion_Detail,
          discount_Value: promotion.discount_Value,
          discount_Amount: discountAmount
        });
        
        message.success('Áp dụng mã khuyến mãi thành công!');
        updateBookingSummary(selectedSeats, memberDiscountAmount, discountAmount, pointsToUse);
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      message.error('Mã khuyến mãi không hợp lệ hoặc không áp dụng được');
    } finally {
      setLoading(false);
    }
  };

  // Apply points discount using new API
  const applyPointsDiscount = async () => {
    if (!member || !bookingId || pointsToUse <= 0) {
      message.warning('Vui lòng nhập số điểm cần sử dụng và đảm bảo đã tạo đơn đặt vé');
      return;
    }
    
    if (pointsToUse > member.currentPoints) {
      message.error('Số điểm sử dụng không thể lớn hơn số điểm hiện có');
      return;
    }
    
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // Sử dụng API mới để áp dụng giảm giá từ điểm
      const response = await axios.post('https://localhost:7168/api/Member/discount/points', {
        userId: member.user_ID,
        bookingId: bookingId,
        pointsToUse: pointsToUse,
        originalAmount: calculateSubtotal()
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.data) {
        // Giả định rằng API trả về số tiền giảm giá từ việc sử dụng điểm
        const pointsDiscountAmount = response.data.discountAmount || pointsToUse * 1000; // Giả sử 1 điểm = 1000 VND
        
        message.success(`Đã sử dụng ${pointsToUse} điểm để giảm giá ${pointsDiscountAmount.toLocaleString()} VND`);
        updateBookingSummary(selectedSeats, memberDiscountAmount, appliedPromotion?.discount_Amount || 0, pointsDiscountAmount);
      }
    } catch (error) {
      console.error('Error applying points discount:', error);
      message.error('Không thể sử dụng điểm tích lũy. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Remove applied promotion
  const removePromotion = () => {
    setAppliedPromotion(null);
    setPromotionCode('');
    updateBookingSummary(selectedSeats, memberDiscountAmount, 0, pointsToUse);
    message.success('Đã xóa mã khuyến mãi');
  };

  // Register new member with updated API
  const registerNewMember = async (values: any) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.post('https://localhost:7168/api/User/staff-register', {
        fullName: values.name,
        email: values.email,
        phoneNumber: values.phone,
        sex: values.sex || "Other" // Thêm giới tính theo yêu cầu
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.data) {
        message.success('Đăng ký thành viên mới thành công!');
        setNewUserModalVisible(false);
        
        // Tìm kiếm thông tin thành viên mới đăng ký
        lookupMember(values.email, 'email');
      }
    } catch (error) {
      console.error('Error registering new user:', error);
      message.error('Lỗi đăng ký thành viên mới');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    if (seat.seat_Status === 'Booked' || seat.seat_Status === 'Reserved') {
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
      const response = await axios.post('https://localhost:7168/api/Booking', bookingPayload, {
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

  // Handle showtime selection
  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    fetchSeats(showtime.showtime_ID);
    setCurrentStep(2);
  };

  // Calculate subtotal based on selected seats
  const calculateSubtotal = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  };

  const updateBookingSummary = (seats: Seat[], memberDiscount: number, promotionDiscount: number, pointsDiscount: number) => {
    const subtotal = seats.reduce((total, seat) => total + seat.price, 0);
    const memberDiscountAmount = (memberDiscount / 100) * subtotal;
    const totalDiscounts = memberDiscountAmount + promotionDiscount + pointsDiscount;
    
    setBookingSummary({
      subtotal,
      discounts: totalDiscounts,
      memberDiscount: memberDiscountAmount,
      promotionDiscount: promotionDiscount,
      total: subtotal - totalDiscounts
    });
  };

  // Handle customer form submission
  const handleCustomerSubmit = async (values: any) => {
    setCustomer({
      name: values.name,
      phone: values.phone,
      email: values.email,
      sex: values.sex || 'Other'
    });
    
    // Booking đã được tạo ở bước trước, chuyển thẳng sang bước thanh toán
    setCurrentStep(4);
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
        const response = await axios.put(`https://localhost:7168/api/Booking/${bookingId}/payment`, {}, {
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
        // Thanh toán QR Code - sử dụng POST /api/payos/create
        const response = await axios.post('https://localhost:7168/api/payos/create', {
          bookingId: bookingId
        }, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          },
        });
        
        if (response.data) {
          // Hiển thị QR code để thanh toán
          setPaymentData(response.data);
          setPaymentQrVisible(true);
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error('Lỗi xử lý thanh toán: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật hàm xử lý khi thanh toán QR thành công
  const handlePaymentSuccess = () => {
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

  // Group seats by row for better display
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row_Name]) {
      acc[seat.row_Name] = [];
    }
    acc[seat.row_Name].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Get unique column numbers for headers
  const getUniqueColumnNumbers = () => {
    const columns = seats.map(seat => seat.seat_Number);
    return [...new Set(columns)].sort((a, b) => a - b);
  };

  // Enhanced Movie Card Component
  const MovieCard = ({ movie, onSelect }) => {
    return (
      <Card 
        key={movie.movie_ID}
        hoverable
        className="movie-card"
        cover={
          <div className="relative">
            <img 
              alt={movie.movie_Name} 
              src={movie.poster_URL} 
              style={{ height: 300, objectFit: 'cover' }} 
            />
            <Tag color={movie.rating === 'P13' ? 'orange' : 'green'} 
                className="absolute top-2 right-2">
              {movie.rating}
            </Tag>
          </div>
        }
        onClick={() => onSelect(movie)}
      >
        <Card.Meta
          title={<span className="text-lg font-bold">{movie.movie_Name}</span>}
          description={
            <>
              <div className="flex items-center mb-1">
                <ClockCircleOutlined className="mr-1" />
                <span>{movie.duration} phút</span>
              </div>
              <div className="flex items-center mb-1">
                <TagOutlined className="mr-1" />
                <span>{movie.genre}</span>
              </div>
              <div className="flex items-center">
                <UserOutlined className="mr-1" />
                <span>Đạo diễn: {movie.director}</span>
              </div>
              <Button 
                type="primary" 
                className="mt-3 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(movie);
                }}
              >
                Đặt vé ngay
              </Button>
            </>
          }
        />
      </Card>
    );
  };

  // Enhanced Showtime Info Header
  const ShowtimeInfoHeader = ({ movie, showtime }) => {
    return (
      <div className="sticky top-0 z-10 bg-white shadow-md p-4 mb-6 rounded-lg">
        <Row gutter={16} align="middle">
          <Col span={4}>
            <img 
              src={movie?.poster_URL} 
              alt={movie?.movie_Name} 
              className="w-full rounded-lg"
              style={{ maxHeight: '80px', objectFit: 'cover' }}
            />
          </Col>
          <Col span={14}>
            <Title level={4} className="m-0">{movie?.movie_Name}</Title>
            <Space className="mt-1">
              <Tag color="blue">{movie?.rating}</Tag>
              <Tag color="purple">{movie?.duration} phút</Tag>
            </Space>
            <div className="mt-2">
              <Text strong>Suất chiếu:</Text> {formatDate(showtime?.show_Date)} {formatTime(showtime?.start_Time)}
            </div>
          </Col>
          <Col span={6} className="text-right">
            <div>
              <Text strong>Phòng:</Text> {showtime?.room_Name}
            </div>
            <div>
              <Text strong>Giá:</Text> {showtime?.base_Price.toLocaleString()} VND
            </div>
            <div className="mt-2">
              <Tag color="green">Còn {seats.filter(s => s.seat_Status !== 'Booked' && s.seat_Status !== 'Reserved').length} ghế trống</Tag>
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
      <div className="member-details bg-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <Avatar 
            size={80} 
            icon={<UserOutlined />} 
            className="mr-6"
            style={{ backgroundColor: member.isVip ? '#f59e0b' : '#3b82f6' }}
          />
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-2">
              <Typography.Text strong className="text-xl">{member.full_Name}</Typography.Text>
              <Tag color={member.isVip ? 'gold' : 'blue'} className="text-sm px-3 py-1">
                {member.membershipStatus}
              </Tag>
            </div>
            
            <Descriptions column={1} size="small" className="mb-3">
              <Descriptions.Item label="Mã thành viên">{member.user_ID}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{member.phone_Number}</Descriptions.Item>
              <Descriptions.Item label="Email">{member.email}</Descriptions.Item>
              <Descriptions.Item label="Giới tính">{member.sex || 'Không xác định'}</Descriptions.Item>
              <Descriptions.Item label="Điểm tích lũy">
                <span className="font-semibold">{member.currentPoints}</span> điểm
              </Descriptions.Item>
            </Descriptions>
            
            {memberDiscountAmount > 0 && (
              <Alert 
                message={`Ưu đãi thành viên: Giảm ${memberDiscountAmount}% tổng hóa đơn`}
                type="success" 
                showIcon 
                className="mt-2"
              />
            )}
            
            {member.currentPoints > 0 && (
              <div className="mt-4 bg-green-50 p-3 rounded-lg">
                <div className="mb-2">
                  <Text strong>Sử dụng điểm tích lũy:</Text>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    placeholder="Nhập số điểm muốn sử dụng" 
                    value={pointsToUse}
                    onChange={(e) => setPointsToUse(parseInt(e.target.value) || 0)}
                    min={0}
                    max={member.currentPoints}
                    style={{ width: '200px' }}
                  />
                  <Button 
                    type="primary" 
                    onClick={applyPointsDiscount}
                    disabled={!bookingId || pointsToUse <= 0}
                  >
                    Áp dụng
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Bạn có thể sử dụng tối đa {member.currentPoints} điểm
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <Button type="primary" onClick={() => applyMemberInfo()}>
                Sử dụng thông tin này
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Promotion Section
  const EnhancedPromotionSection = () => {
    return (
      <div className="promotion-section mb-6">
        <Title level={5}>Mã khuyến mãi</Title>
        
        <div className="flex items-center mb-4">
          <Input
            placeholder="Nhập mã khuyến mãi"
            value={promotionCode}
            onChange={e => setPromotionCode(e.target.value)}
            disabled={!!appliedPromotion}
            className="mr-2 flex-grow"
            prefix={<PercentageOutlined className="text-gray-400" />}
            size="large"
          />
          {appliedPromotion ? (
            <Button 
              danger 
              icon={<CloseCircleOutlined />} 
              onClick={removePromotion}
              size="large"
            >
              Xóa
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />} 
              onClick={applyPromotionCode}
              loading={loading}
              disabled={!bookingId}
              size="large"
            >
              Áp dụng
            </Button>
          )}
        </div>
        
        {/* Display discount amount when promotion is applied */}
        {appliedPromotion && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <Text strong className="text-green-700">Mã khuyến mãi đã áp dụng:</Text>
                <div className="mt-1">
                  <Tag color="green" className="text-sm">{appliedPromotion.code}</Tag>
                  <Text className="ml-2">{appliedPromotion.name}</Text>
                </div>
              </div>
              <div className="text-right">
                <Text type="secondary">Giảm giá:</Text>
                <div className="text-green-600 font-bold text-lg">
                  -{appliedPromotion.discount_Amount.toLocaleString()} VND
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Available promotions list */}
        {promotions.length > 0 && !appliedPromotion && (
          <div className="mt-4">
            <Text strong>Khuyến mãi có sẵn:</Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {promotions.map(promo => (
                <Card 
                  key={promo.promotion_ID} 
                  size="small" 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handlePromotionClick(promo.promotion_Code)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <Text strong>{promo.promotion_Code}</Text>
                      <div className="text-xs text-gray-500">{promo.promotion_Detail}</div>
                    </div>
                    <Button 
                      type="link" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePromotionClick(promo.promotion_Code);
                      }}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Payment methods options
  const paymentMethods: PaymentMethod[] = [
    { id: 'Cash', name: 'Thanh toán tại quầy', icon: <DollarOutlined /> },
    { id: 'Payos', name: 'Thanh toán QR Code', icon: <QrcodeOutlined /> },
  ];

  return (
    <div className="container mx-auto p-4">
      <Title level={2} className="mb-6">Đặt vé xem phim</Title>
      
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
                <Col xs={24} sm={12} md={8} lg={6} key={movie.movie_ID}>
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
            className="mb-4"
          >
            Quay lại chọn phim
          </Button>
          
          <Row gutter={24}>
            <Col span={6}>
              <img 
                src={selectedMovie.poster_URL} 
                alt={selectedMovie.movie_Name} 
                style={{ width: '100%', borderRadius: 8 }} 
              />
            </Col>
            <Col span={18}>
              <Title level={3}>{selectedMovie.movie_Name}</Title>
              <Row>
                <Col span={12}>
                  <p><strong>Đạo diễn:</strong> {selectedMovie.director}</p>
                  <p><strong>Thể loại:</strong> {selectedMovie.genre}</p>
                  <p><strong>Diễn viên:</strong> {selectedMovie.cast}</p>
                </Col>
                <Col span={12}>
                  <p><strong>Thời lượng:</strong> {selectedMovie.duration} phút</p>
                  <p><strong>Phân loại:</strong> <Tag color={selectedMovie.rating === 'P13' ? 'orange' : 'green'}>{selectedMovie.rating}</Tag></p>
                </Col>
              </Row>
            </Col>
          </Row>
          
          <Divider />
          
          <Title level={4}>Chọn ngày chiếu</Title>
          <div className="date-selection mb-6 overflow-auto">
            <Space size="middle">
              {availableDates.map((date, index) => {
                const momentDate = moment(date);
                const isSelected = selectedDate && momentDate.isSame(selectedDate, 'day');
                
                return (
                  <div 
                    key={index} 
                    className={`date-card p-3 rounded-lg cursor-pointer text-center min-w-[100px] ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100'
                    }`}
                    onClick={() => handleDateSelect(momentDate)}
                  >
                    <div className="text-lg font-bold">{momentDate.format('DD')}</div>
                    <div className={isSelected ? 'text-white' : 'text-gray-500'}>
                      {momentDate.format('ddd')}
                    </div>
                    <div className={isSelected ? 'text-white' : 'text-gray-500'}>
                      {momentDate.format('MM/YYYY')}
                    </div>
                  </div>
                );
              })}
            </Space>
          </div>
          
          <Title level={4}>Chọn suất chiếu</Title>
          {loading ? (
            <div className="flex justify-center my-8">
              <Spin size="large" />
            </div>
          ) : showtimes.length > 0 ? (
            <div className="showtimes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showtimes.map(showtime => (
                <Card 
                  key={showtime.showtime_ID} 
                  className={`showtime-card cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => handleShowtimeSelect(showtime)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold">
                        {formatTime(showtime.start_Time)} - {formatTime(showtime.end_Time)}
                      </div>
                      <div className="text-gray-500">
                        Phòng: {showtime.room_Name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-500">
                        {showtime.base_Price.toLocaleString()} VND
                      </div>
                      <Tag color="blue">{showtime.price_Tier}</Tag>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="Không có suất chiếu nào cho ngày này" />
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
            className="mb-4"
          >
            Quay lại chọn suất chiếu
          </Button>
          
          <ShowtimeInfoHeader movie={selectedMovie} showtime={selectedShowtime} />
          
          {loading ? (
            <div className="flex justify-center my-12">
              <Spin size="large" />
            </div>
          ) : (
            <div className="seat-layout-container mt-8">
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
                {Object.keys(seatsByRow).sort().map(rowName => (
                  <RowContainer key={`row-${rowName}`}>
                    <RowLabel>{rowName}</RowLabel>
                    <SeatsSection>
                      {seatsByRow[rowName]
                        .sort((a, b) => a.seat_Number - b.seat_Number)
                        .map(seat => {
                          const isSelected = selectedSeats.some(s => s.seat_ID === seat.seat_ID);
                          const isBooked = seat.seat_Status === 'Booked' || seat.seat_Status === 'Reserved';
                          
                          return (
                            <SeatButtonWrapper key={seat.seat_ID}>
                              <SeatButton
                                seatType={seat.seat_Type}
                                seatStatus={seat.seat_Status}
                                isSelected={isSelected}
                                onClick={() => handleSeatSelect(seat)}
                                whileHover={!isBooked ? { scale: 1.05 } : {}}
                                whileTap={!isBooked ? { scale: 0.95 } : {}}
                                disabled={isBooked}
                              >
                                <SeatNumber>{seat.seat_Number}</SeatNumber>
                              </SeatButton>
                              <SeatTooltip>
                                {seat.row_Name}{seat.seat_Number} - {seat.seat_Type}<br />
                                {seat.price.toLocaleString()} VND
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
                  <span>Đã đặt</span>
                </LegendItem>
                <LegendItem>
                  <ColorBox color="#22c55e" style={{ border: '3px solid #22c55e' }} />
                  <span>Đang chọn</span>
                </LegendItem>
              </SeatLegend>
              
              <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-sm">
                <Row gutter={24}>
                  <Col span={16}>
                    <div className="mb-4">
                      <Text strong className="text-lg">Ghế đã chọn ({selectedSeats.length}):</Text>
                      <div className="mt-2">
                        {selectedSeats.length > 0 ? (
                          <Space wrap>
                            {selectedSeats.map(seat => (
                              <Tag 
                                key={seat.seat_ID} 
                                color={seat.seat_Type === 'VIP' ? 'red' : 'blue'}
                                closable
                                onClose={() => handleSeatSelect(seat)}
                                className="text-base py-1 px-2"
                              >
                                {seat.row_Name}{seat.seat_Number} - {seat.price.toLocaleString()} VND
                              </Tag>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary">Chưa chọn ghế nào</Text>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col span={8} className="text-right">
                    <div>
                      <Text type="secondary">Tổng tiền:</Text>
                      <div className="text-2xl font-bold text-red-600">
                        {calculateSubtotal().toLocaleString()} VND
                      </div>
                    </div>
                    <Button 
                      type="primary" 
                      size="large" 
                      className="mt-4"
                      onClick={handleContinueAfterSeatSelection}
                      disabled={selectedSeats.length === 0}
                      loading={loading}
                    >
                      Tiếp tục
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
            onClick={() => setCurrentStep(2)}
            className="mb-4"
          >
            Quay lại chọn ghế
          </Button>
          
          <Card className="mb-6" title="Thông tin đặt vé">
            <Row gutter={24}>
              <Col span={8}>
                <img 
                  src={selectedMovie.poster_URL} 
                  alt={selectedMovie.movie_Name} 
                  style={{ width: '100%', borderRadius: 8 }} 
                />
              </Col>
              <Col span={16}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Phim">{selectedMovie.movie_Name}</Descriptions.Item>
                  <Descriptions.Item label="Suất chiếu">
                    {formatDate(selectedShowtime.show_Date)} {formatTime(selectedShowtime.start_Time)} - {formatTime(selectedShowtime.end_Time)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phòng">{selectedShowtime.room_Name}</Descriptions.Item>
                  <Descriptions.Item label="Ghế">
                    {selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng tiền">
                    <span className="text-xl font-bold text-red-600">
                      {calculateSubtotal().toLocaleString()} VND
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
          
          <Card title="Tìm kiếm thành viên" className="mb-6">
            <div className="flex items-center gap-4">
              <Select 
                defaultValue="phone" 
                style={{ width: 120 }}
                onChange={(value) => setMemberLookupType(value)}
              >
                <Option value="phone">Số điện thoại</Option>
                <Option value="email">Email</Option>
              </Select>
              <Input 
                placeholder={memberLookupType === 'phone' ? "Nhập số điện thoại" : "Nhập email"}
                value={memberLookupValue}
                onChange={(e) => setMemberLookupValue(e.target.value)}
                style={{ width: 300 }}
              />
              <Button 
                type="primary" 
                onClick={() => lookupMember(memberLookupValue, memberLookupType)}
                loading={lookupLoading}
              >
                Tìm kiếm
              </Button>
              <Button 
                type="default" 
                icon={<PlusOutlined />}
                onClick={() => setNewUserModalVisible(true)}
              >
                Đăng ký thành viên mới
              </Button>
            </div>
            
            {member && <MemberDetailsView member={member} />}
          </Card>
          
          <Card title="Thông tin khách hàng">
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
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                  >
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={24}>
                <Col span={12}>
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
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sex"
                    label="Giới tính"
                  >
                    <Select>
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
                >
                  Gửi thông tin đặt vé qua email
                </Checkbox>
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large">
                  Tiếp tục
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
            className="mb-4"
          >
            Quay lại thông tin khách hàng
          </Button>
          
          <Row gutter={24}>
            <Col span={16}>
              <Card title="Chọn phương thức thanh toán" className="mb-6">
                <div className="payment-methods">
                  {paymentMethods.map(method => (
                    <div 
                      key={method.id}
                      className={`payment-method-item p-4 mb-4 border rounded-lg cursor-pointer ${
                        paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => handlePaymentMethodSelect(method.id)}
                    >
                      <div className="flex items-center">
                        <Radio checked={paymentMethod === method.id} />
                        <div className="ml-4 flex items-center">
                          <div className="payment-icon text-2xl mr-3">
                            {method.icon}
                          </div>
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-gray-500 text-sm">
                              {method.id === 'Cash' 
                                ? 'Thanh toán trực tiếp tại quầy' 
                                : 'Quét mã QR để thanh toán'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card title="Mã khuyến mãi & Ưu đãi">
                <EnhancedPromotionSection />
              </Card>
            </Col>
            
            <Col span={8}>
              <Card 
                title="Thông tin thanh toán" 
                className="sticky-summary"
                style={{ position: 'sticky', top: '20px' }}
              >
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Phim">{selectedMovie.movie_Name}</Descriptions.Item>
                  <Descriptions.Item label="Suất chiếu">
                    {formatDate(selectedShowtime.show_Date)} {formatTime(selectedShowtime.start_Time)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghế">
                    {selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider />
                
                <div className="price-summary">
                  <div className="flex justify-between mb-2">
                    <Text>Tạm tính:</Text>
                    <Text>{bookingSummary.subtotal.toLocaleString()} VND</Text>
                  </div>
                  
                  {memberDiscountAmount > 0 && (
                    <div className="flex justify-between mb-2 text-green-600">
                      <Text>Giảm giá thành viên ({memberDiscountAmount}%):</Text>
                      <Text>-{bookingSummary.memberDiscount.toLocaleString()} VND</Text>
                    </div>
                  )}
                  
                  {appliedPromotion && (
                    <div className="flex justify-between mb-2 text-green-600">
                      <Text>Mã khuyến mãi ({appliedPromotion.code}):</Text>
                      <Text>-{bookingSummary.promotionDiscount.toLocaleString()} VND</Text>
                    </div>
                  )}
                  
                  {pointsToUse > 0 && (
                    <div className="flex justify-between mb-2 text-green-600">
                      <Text>Điểm tích lũy ({pointsToUse} điểm):</Text>
                      <Text>-{(pointsToUse * 1000).toLocaleString()} VND</Text>
                    </div>
                  )}
                  
                  <Divider />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <Text>Tổng cộng:</Text>
                    <Text className="text-red-600">{bookingSummary.total.toLocaleString()} VND</Text>
                  </div>
                </div>
                
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  className="mt-6"
                  onClick={processPayment}
                  loading={loading}
                >
                  Thanh toán
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
        title="Thanh toán QR Code"
        open={paymentQrVisible}
        onCancel={() => setPaymentQrVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPaymentQrVisible(false)}>
            Hủy
          </Button>,
          <Button key="success" type="primary" onClick={handlePaymentSuccess}>
            Đã thanh toán thành công
          </Button>,
        ]}
      >
        {paymentData && (
          <div className="text-center">
            <div className="mb-4">
              <QRCode value={paymentData.qrCodeUrl || paymentData.paymentUrl} size={250} bordered />
            </div>
            <div className="mb-2">
              <Text strong>Mã đơn hàng: {paymentData.orderCode}</Text>
            </div>
            <div className="mb-4">
              <Text strong className="text-red-600 text-lg">
                Số tiền: {paymentData.amount.toLocaleString()} VND
              </Text>
            </div>
            <Paragraph>
              Quét mã QR bằng ứng dụng ngân hàng để thanh toán.<br />
              Sau khi thanh toán thành công, vui lòng nhấn "Đã thanh toán thành công".
            </Paragraph>
            <div className="mt-4">
              <Button type="link" href={paymentData.paymentUrl} target="_blank">
                Mở trang thanh toán
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageBookings;  


// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   Table, Button, Input, Select, DatePicker, Space, 
//   Tag, Modal, Form, Spin, message, Tooltip, Card,
//   Tabs, Typography, Row, Col, Divider, Steps, 
//   Radio, Checkbox, Avatar, Alert, Descriptions,
//   Empty
// } from 'antd';
// import { 
//   CalendarOutlined, LeftOutlined, RightOutlined,
//   UserOutlined, CreditCardOutlined, SearchOutlined,
//   CheckCircleOutlined, CloseCircleOutlined, TeamOutlined,
//   PlusOutlined, ShoppingCartOutlined, BarcodeOutlined,
//   PercentageOutlined, DollarOutlined, QrcodeOutlined,
//   ClockCircleOutlined, TagOutlined, PlayCircleOutlined
// } from '@ant-design/icons';
// import axios from 'axios';
// import moment from 'moment';
// import { useAuth } from '../context/AuthContext';
// import Layout from '../components/Layout/Layout';
// import { QRCode } from 'antd';
// import styled from 'styled-components';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';

// const { Option } = Select;
// const { Title, Text, Paragraph } = Typography;
// const { Step } = Steps;
// const { TabPane } = Tabs;

// // Define interfaces
// interface Movie {
//   movie_ID: number;
//   movie_Name: string;
//   director: string;
//   genre: string;
//   cast: string;
//   poster_URL: string;
//   duration: number;
//   rating: string;
// }

// interface PayosPaymentResponse {
//   success: boolean;
//   message: string;
//   paymentUrl: string;
//   qrCodeUrl: string;
//   orderCode: string;
//   amount: number;
// }

// interface Room {
//   cinema_Room_ID: number;
//   room_Name: string;
//   room_Type: string;
// }

// interface Showtime {
//   showtime_ID: number;
//   movie_ID: number;
//   cinema_Room_ID: number;
//   room_Name: string;
//   show_Date: string;
//   start_Time: string;
//   end_Time: string;
//   price_Tier: string;
//   base_Price: number;
//   status: string;
//   movie?: Movie;
//   room?: Room;
// }

// interface Seat {
//   seat_ID: number;
//   row_Name: string;
//   seat_Number: number;
//   seat_Type: string;
//   price: number;
//   seat_Status: string;
//   layout_ID: number;
// }

// interface ShowtimeSeatsResponse {
//   showtime_ID: number;
//   movie_Title: string;
//   cinema_Room: string;
//   show_Date: string;
//   start_Time: string;
//   end_Time: string;
//   seats: {
//     $values: Seat[];
//   };
// }

// interface Member {
//   user_ID: number;
//   full_Name: string;
//   email: string;
//   phone_Number: string;
//   currentPoints: number;
//   isVip: boolean;
//   membershipStatus: string;
//   sex: string;
// }

// interface Promotion {
//   promotion_ID: number;
//   promotion_Code: string;
//   promotion_Detail: string;
//   discount_Type: string;
//   discount_Value: number;
//   start_Date: string;
//   end_Date: string;
//   status: string;
//   is_Active: boolean;
// }

// interface Customer {
//   name: string;
//   phone: string;
//   email: string;
//   sex: string;
// }

// interface AppliedPromotion {
//   promotion_ID: number;
//   code: string;
//   name: string;
//   discount_Value: number;
//   discount_Amount: number;
// }

// interface PaymentMethod {
//   id: string;
//   name: string;
//   icon: React.ReactNode;
// }

// interface BookingSummary {
//   subtotal: number;
//   discounts: number;
//   memberDiscount: number;
//   promotionDiscount: number;
//   total: number;
// }

// interface BookingResponse {
//   booking_ID: number;
//   seat_IDs: number[];
// }

// interface TicketResponse {
//   ticket_ID: number;
//   booking_ID: number;
//   ticket_Code: string;
//   created_At: string;
// }

// interface UserPoints {
//   userId: number;
//   currentPoints: number;
//   pointsHistory: any[];
// }

// // Styled components for seat layout display
// const Screen = styled.div`
//   width: 90%;
//   height: 50px;
//   background: linear-gradient(to bottom, #e5e7eb, #ffffff);
//   border-radius: 8px;
//   margin: 0 auto 3rem;
//   transform: perspective(500px) rotateX(-20deg);
//   box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   position: relative;
//   border: 2px solid #d1d5db;

//   &:after {
//     content: '';
//     position: absolute;
//     bottom: -25px;
//     left: 5%;
//     width: 90%;
//     height: 25px;
//     background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), transparent);
//     border-radius: 8px;
//   }
// `;

// const ScreenText = styled.div`
//   color: #4b5563;
//   font-weight: 700;
//   font-size: 1rem;
//   letter-spacing: 3px;
//   text-transform: uppercase;
// `;

// const SeatingArea = styled.div`
//   display: grid;
//   grid-template-columns: 40px 1fr 40px; /* Row label, seats section, row label */
//   gap: 0.5rem;
//   width: 100%;
//   max-width: 900px;
//   background: #f9fafb;
//   padding: 1.5rem;
//   border-radius: 12px;
//   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
//   position: relative;
// `;

// const RowContainer = styled(motion.div)`
//   display: contents; /* Use CSS Grid for layout */
// `;

// const RowLabel = styled.div`
//   width: 40px;
//   height: 40px;
//   text-align: center;
//   font-weight: 600;
//   color: #374151;
//   font-size: 1rem;
//   cursor: pointer;
//   padding: 0.75rem;
//   border-radius: 6px;
//   background: #e5e7eb;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   transition: all 0.3s ease;

//   &:hover {
//     background: #d1d5db;
//     transform: scale(1.05);
//   }
// `;

// const ColumnHeader = styled.div`
//   display: flex;
//   gap: 0.5rem;
//   justify-content: center;
//   grid-column: 2 / 3; /* Position in the middle column of the grid */
//   margin-bottom: 0.5rem;
// `;

// const ColumnFooter = styled.div`
//   display: flex;
//   gap: 0.5rem;
//   justify-content: center;
//   grid-column: 2 / 3; /* Position in the middle column of the grid */
//   margin-top: 0.5rem;
// `;

// const ColumnLabel = styled.div`
//   width: 40px;
//   height: 40px;
//   text-align: center;
//   font-weight: 600;
//   color: #374151;
//   font-size: 0.9rem;
//   cursor: pointer;
//   padding: 0.75rem;
//   border-radius: 6px;
//   background: #e5e7eb;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   transition: all 0.3s ease;

//   &:hover {
//     background: #d1d5db;
//     transform: scale(1.05);
//   }
// `;

// const SeatsSection = styled.div`
//   display: flex;
//   gap: 0.5rem;
//   justify-content: center;
//   grid-column: 2 / 3; /* Position in the middle column of the grid */
// `;

// const SeatButtonWrapper = styled.div`
//   position: relative;
//   display: inline-block;
// `;

// const SeatButton = styled(motion.button)`
//   width: 40px;
//   height: 40px;
//   border-radius: 8px;
//   border: ${props => props.isSelected ? '3px solid #22c55e' : '1px solid #d1d5db'};
//   box-shadow: ${props => props.isSelected ? '0 0 10px rgba(34, 197, 94, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
//   background-color: ${props => {
//     if (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') return '#9ca3af'; // Booked or Reserved seats
//     switch (props.seatType) {
//       case 'VIP':
//         return '#ef4444'; // VIP seats - red
//       case 'Regular':
//       default:
//         return '#3b82f6'; // Regular seats - blue
//     }
//   }};
//   color: white;
//   font-weight: 600;
//   font-size: 0.8rem;
//   cursor: ${props => (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') ? 'not-allowed' : 'pointer'};
//   position: relative;
//   transition: all 0.3s ease;

//   &:hover {
//     transform: ${props => (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') ? 'none' : 'translateY(-2px)'};
//     box-shadow: ${props => (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.15)'};
//   }

//   // Add seat shape styling
//   &:before {
//     content: '';
//     position: absolute;
//     top: -4px;
//     left: 10px;
//     right: 10px;
//     height: 4px;
//     background-color: ${props => props.isSelected ? '#22c55e' : props.seatType === 'VIP' ? '#dc2626' : '#2563eb'};
//     border-radius: 4px 4px 0 0;
//   }
// `;

// const SeatNumber = styled.div`
//   font-size: 0.8rem;
//   font-weight: 600;
// `;

// const SeatTooltip = styled.div`
//   visibility: hidden;
//   background-color: #1f2937;
//   color: #ffffff;
//   text-align: center;
//   border-radius: 6px;
//   padding: 6px 10px;
//   position: absolute;
//   z-index: 10;
//   bottom: 125%;
//   left: 50%;
//   transform: translateX(-50%);
//   font-size: 0.75rem;
//   white-space: nowrap;
//   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

//   &:after {
//     content: '';
//     position: absolute;
//     top: 100%;
//     left: 50%;
//     margin-left: -5px;
//     border-width: 5px;
//     border-style: solid;
//     border-color: #1f2937 transparent transparent transparent;
//   }

//   ${SeatButtonWrapper}:hover & {
//     visibility: visible;
//   }
// `;

// const SeatLegend = styled.div`
//   display: flex;
//   justify-content: center;
//   gap: 2rem;
//   margin-top: 2.5rem;
//   flex-wrap: wrap;
//   background: #ffffff;
//   padding: 1rem;
//   border-radius: 8px;
//   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
// `;

// const LegendItem = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 0.75rem;
//   font-size: 0.9rem;
//   color: #4b5563;
//   font-weight: 500;
// `;

// const ColorBox = styled.div`
//   width: 20px;
//   height: 20px;
//   background-color: ${props => props.color};
//   border-radius: 4px;
//   border: 1px solid #e5e7eb;
// `;

// const PromotionList = styled.div`
//   margin-top: 16px;
//   display: flex;
//   flex-wrap: wrap;
//   gap: 8px;
// `;

// const PromotionTag = styled(Tag)`
//   cursor: pointer;
//   padding: 4px 8px;
//   font-size: 14px;
//   border-radius: 4px;
//   background-color: #e6f7ff;
//   border-color: #91d5ff;
//   color: #1890ff;
//   &:hover {
//     background-color: #bae7ff;
//   }
// `;

// // Sticky header for seat selection
// const StickyHeader = styled.div`
//   position: sticky;
//   top: 0;
//   z-index: 10;
//   background-color: white;
//   padding: 16px;
//   border-radius: 8px;
//   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
//   margin-bottom: 24px;
// `;

// const ManageBookings: React.FC = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [currentStep, setCurrentStep] = useState<number>(0);
//   const [movies, setMovies] = useState<Movie[]>([]);
//   const [showtimes, setShowtimes] = useState<Showtime[]>([]);
//   const [availableDates, setAvailableDates] = useState<string[]>([]);
//   const [seats, setSeats] = useState<Seat[]>([]);
//   const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
//   const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
//   const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
//   const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);
//   const [member, setMember] = useState<Member | null>(null);
//   const [memberLookupValue, setMemberLookupValue] = useState<string>('');
//   const [memberLookupType, setMemberLookupType] = useState<'phone' | 'email'>('phone');
//   const [memberDiscountAmount, setMemberDiscountAmount] = useState<number>(0);
//   const [pointsToUse, setPointsToUse] = useState<number>(0);
//   const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
//   const [promotions, setPromotions] = useState<Promotion[]>([]);
//   const [appliedPromotion, setAppliedPromotion] = useState<AppliedPromotion | null>(null);
//   const [promotionCode, setPromotionCode] = useState<string>('');
//   const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', sex: 'Other' });
//   const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
//   const [sendConfirmation, setSendConfirmation] = useState<boolean>(true);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [lookupLoading, setLookupLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string>('');
//   const [searchValue, setSearchValue] = useState<string>('');
//   const [newUserModalVisible, setNewUserModalVisible] = useState<boolean>(false);
//   const [paymentQrVisible, setPaymentQrVisible] = useState<boolean>(false);
//   const [paymentData, setPaymentData] = useState<PayosPaymentResponse | null>(null);
//   const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
//     subtotal: 0,
//     discounts: 0,
//     memberDiscount: 0,
//     promotionDiscount: 0,
//     total: 0
//   });
//   const [bookingId, setBookingId] = useState<number | null>(null);
//   const [ticketId, setTicketId] = useState<number | null>(null);
//   const [seatIds, setSeatIds] = useState<number[]>([]);

//   const [customerForm] = Form.useForm();
//   const [membershipForm] = Form.useForm();
//   const [newUserForm] = Form.useForm();

//   // Reset booking state when component mounts or when route changes
//   useEffect(() => {
//     fetchNowShowingMovies();
//     fetchPromotions();
    
//     return () => {
//       resetBookingState();
//     };
//   }, []);

//   // Reset booking state function
//   const resetBookingState = () => {
//     setSelectedMovie(null);
//     setSelectedShowtime(null);
//     setSelectedSeats([]);
//     setSelectedDate(null);
//     setMember(null);
//     setMemberDiscountAmount(0);
//     setPointsToUse(0);
//     setAppliedPromotion(null);
//     setPromotionCode('');
//     setCustomer({ name: '', phone: '', email: '', sex: 'Other' });
//     customerForm.resetFields();
//     setPaymentMethod('Cash');
//     setCurrentStep(0);
//     setBookingId(null);
//     setTicketId(null);
//     setSeatIds([]);
//   };

//   // Get token from storage
//   const getAuthToken = () => {
//     return localStorage.getItem('token') || sessionStorage.getItem('token');
//   };

//   // Fetch movies that are now showing
//   const fetchNowShowingMovies = async () => {
//     try {
//       setLoading(true);
//       const token = getAuthToken();
//       const response = await axios.get('https://localhost:7168/api/Movie/now-showing', {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//         },
//       });
//       if (response.data && response.data.$values) {
//         setMovies(response.data.$values);
//       } else if (Array.isArray(response.data)) {
//         setMovies(response.data);
//       } else {
//         setMovies([]);
//       }
//     } catch (error) {
//       console.error('Error fetching movies:', error);
//       setError('Không thể tải danh sách phim đang chiếu');
//       message.error('Không thể tải danh sách phim đang chiếu');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch promotions from API
//   const fetchPromotions = async () => {
//     try {
//       const token = getAuthToken();
//       const response = await axios.get('https://localhost:7168/api/Promotion', {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//         },
//       });
//       if (response.data && response.data.$values) {
//         // Filter promotions with status 'active' and is_Active true
//         const activePromotions = response.data.$values.filter(
//           (promo: Promotion) => promo.status.toLowerCase() === 'active' && promo.is_Active
//         );
//         setPromotions(activePromotions);
//       } else if (Array.isArray(response.data)) {
//         const activePromotions = response.data.filter(
//           (promo: Promotion) => promo.status.toLowerCase() === 'active' && promo.is_Active
//         );
//         setPromotions(activePromotions);
//       } else {
//         setPromotions([]);
//       }
//     } catch (error) {
//       console.error('Error fetching promotions:', error);
//       message.error('Không thể tải danh sách mã khuyến mãi');
//     }
//   };

//   // Fetch user points using the new API
//   const fetchUserPoints = async (userId: number) => {
//     try {
//       const token = getAuthToken();
//       const response = await axios.get(`https://localhost:7168/api/Points/my-points?userId=${userId}`, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//         },
//       });
      
//       if (response.data) {
//         setUserPoints(response.data);
//         return response.data.currentPoints;
//       }
//       return 0;
//     } catch (error) {
//       console.error('Error fetching user points:', error);
//       message.error('Không thể tải thông tin điểm tích lũy');
//       return 0;
//     }
//   };

//   // Handle clicking on a promotion code
//   const handlePromotionClick = (code: string) => {
//     if (!appliedPromotion) {
//       setPromotionCode(code);
//     }
//   };

//   // Fetch available dates for a movie
//   const fetchAvailableDates = async (movieId: number) => {
//     try {
//       const token = getAuthToken();
//       const response = await axios.get(`https://localhost:7168/api/Showtimes/movie/${movieId}/dates`, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//         },
//       });
//       if (response.data && response.data.$values) {
//         setAvailableDates(response.data.$values);
//         if (response.data.$values.length > 0) {
//           setSelectedDate(moment(response.data.$values[0]));
//           fetchShowtimes(movieId, moment(response.data.$values[0]).format('YYYY-MM-DD'));
//         }
//       } else if (Array.isArray(response.data)) {
//         setAvailableDates(response.data);
//         if (response.data.length > 0) {
//           setSelectedDate(moment(response.data[0]));
//           fetchShowtimes(movieId, moment(response.data[0]).format('YYYY-MM-DD'));
//         }
//       } else {
//         setAvailableDates([]);
//       }
//     } catch (error) {
//       console.error('Error fetching available dates:', error);
//       message.error('Không thể tải danh sách ngày có suất chiếu');
//     }
//   };

//   const fetchShowtimes = async () => {
//     try {
//       setLoading(true);
//       setRefreshing(true);
  
//       const response = await fetch('https://localhost:7168/api/Showtimes', {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
  
//       if (!response.ok) {
//         throw new Error(`Lỗi khi tải dữ liệu: ${response.status}`);
//       }
  
//       const data = await response.json();
  
//       const now = new Date(); // Lấy thời gian hiện tại
  
//       // Kiểm tra và cập nhật trạng thái của các suất chiếu
//       const updatedShowtimes = data['$values'].map((showtime) => {
//         const showDateTime = new Date(`${showtime.show_Date}T${showtime.end_Time}`);
//         if (showDateTime < now && showtime.status !== 'Hidden') {
//           // Nếu suất chiếu đã kết thúc, cập nhật trạng thái thành "Hidden"
//           return { ...showtime, status: 'Hidden' };
//         }
//         return showtime;
//       });
  
//       setShowtimes(updatedShowtimes);
//       setError('');
//       toast.success('Dữ liệu lịch chiếu đã được cập nhật');
//     } catch (err) {
//       setError('Lỗi khi tải dữ liệu: ' + (err.message || 'Vui lòng thử lại sau.'));
//       console.error(err);
//       toast.error('Không thể tải dữ liệu lịch chiếu');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };
//   const updateShowtimeStatus = async (showtimeId, newStatus) => {
//     try {
//       const response = await fetch(`https://localhost:7168/api/Showtimes/${showtimeId}`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ status: newStatus }),
//       });
  
//       if (!response.ok) {
//         throw new Error(`Lỗi khi cập nhật trạng thái: ${response.status}`);
//       }
  
//       console.log(`Cập nhật trạng thái thành công cho showtime ID: ${showtimeId}`);
//     } catch (err) {
//       console.error(`Lỗi khi cập nhật trạng thái cho showtime ID: ${showtimeId}`, err);
//     }
//   };
//   const updatedShowtimes = await Promise.all(
//     data['$values'].map(async (showtime) => {
//       const showDateTime = new Date(`${showtime.show_Date}T${showtime.end_Time}`);
//       if (showDateTime < now && showtime.status !== 'Hidden') {
//         // Gửi yêu cầu cập nhật trạng thái đến API
//         await updateShowtimeStatus(showtime.showtime_ID, 'Hidden');
//         return { ...showtime, status: 'Hidden' };
//       }
//       return showtime;
//     })
//   );
//   const visibleShowtimes = showtimes.filter(showtime => showtime.status !== 'Hidden');
//   useEffect(() => {
//     const interval = setInterval(() => {
//       fetchShowtimes(); // Gọi lại hàm fetch để kiểm tra và cập nhật trạng thái
//     }, 60 * 60 * 1000); // Kiểm tra mỗi giờ
  
//     return () => clearInterval(interval); // Dọn dẹp interval khi component bị unmount
//   }, []);
//   const fetchSeats = async (showtimeId: number) => {
//     try {
//       setLoading(true);
//       const token = getAuthToken();
//       const response = await axios.get<ShowtimeSeatsResponse>(`https://localhost:7168/api/Seat/showtime/${showtimeId}`, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//         },
//       });
      
//       if (response.data && response.data.seats && response.data.seats.$values) {
//         const seatsWithIds = response.data.seats.$values.map((seat, index) => ({
//           ...seat,
//           seat_ID: seat.seat_ID === 0 ? seat.layout_ID : seat.seat_ID
//         }));
        
//         setSeats(seatsWithIds);
//       } else if (response.data && response.data.seats && Array.isArray(response.data.seats)) {
//         const seatsWithIds = response.data.seats.map((seat, index) => ({
//           ...seat,
//           seat_ID: seat.seat_ID === 0 ? seat.layout_ID : seat.seat_ID
//         }));
        
//         setSeats(seatsWithIds);
//       } else {
//         setSeats([]);
//       }
//     } catch (error) {
//       console.error('Error fetching seats:', error);
//       setError('Không thể tải danh sách ghế');
//       message.error('Không thể tải danh sách ghế');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Lookup member by phone or email
//   const lookupMember = async (value: string, type: 'phone' | 'email') => {
//     if (!value) return;
    
//     try {
//       setLookupLoading(true);
//       const token = getAuthToken();
//       const endpoint = type === 'phone' 
//         ? `https://localhost:7168/api/Member/lookup/phone/${encodeURIComponent(value)}`
//         : `https://localhost:7168/api/Member/lookup/email/${encodeURIComponent(value)}`;
      
//       const response = await axios.get(endpoint, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//         },
//       });
//       if (response.data) {
//         // Map API response to Member interface
//         const memberData: Member = {
//           user_ID: response.data.user_ID,
//           full_Name: response.data.full_Name,
//           email: response.data.email,
//           phone_Number: response.data.phone_Number,
//           currentPoints: response.data.currentPoints,
//           isVip: response.data.isVip,
//           membershipStatus: response.data.membershipStatus,
//           sex: response.data.sex || 'Other'
//         };
//         setMember(memberData);
//         customerForm.setFieldsValue({
//           name: response.data.full_Name,
//           phone: response.data.phone_Number,
//           email: response.data.email,
//           sex: response.data.sex || 'Other'
//         });
//         setCustomer({
//           name: response.data.full_Name,
//           phone: response.data.phone_Number,
//           email: response.data.email,
//           sex: response.data.sex || 'Other'
//         });
        
//         // Fetch member's current points using the new API
//         if (memberData.user_ID) {
//           const points = await fetchUserPoints(memberData.user_ID);
//           memberData.currentPoints = points;
//           setMember({...memberData});
//         }
        
//         fetchMemberDiscount(response.data.membershipStatus);
//         message.success('Tìm thấy thông tin thành viên!');
//       } else {
//         setMember(null);
//         message.info('Không tìm thấy thành viên với thông tin cung cấp');
//       }
//     } catch (error) {
//       console.error('Error looking up member:', error);
//       message.error('Lỗi khi tìm kiếm thành viên');
//       setMember(null);
//     } finally {
//       setLookupLoading(false);
//     }
//   };

//   // Apply member info to the form
//   const applyMemberInfo = () => {
//     if (!member) return;
    
//     customerForm.setFieldsValue({
//       name: member.full_Name,
//       phone: member.phone_Number,
//       email: member.email,
//       sex: member.sex || 'Other'
//     });
//     setCustomer({
//       name: member.full_Name,
//       phone: member.phone_Number,
//       email: member.email,
//       sex: member.sex || 'Other'
//     });
//     message.success('Đã áp dụng thông tin thành viên!');
//   };

//   // Fetch member discount based on membership level
//   const fetchMemberDiscount = async (membershipLevel: string) => {
//     try {
//       const token = getAuthToken();
//       const response = await axios.get(`https://localhost:7168/api/Member/discount/${membershipLevel.toLowerCase()}`, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//         },
//       });
//       if (response.data) {
//         setMemberDiscountAmount(response.data);
//         updateBookingSummary(selectedSeats, response.data, appliedPromotion?.discount_Amount || 0, 0);
//       }
//     } catch (error) {
//       console.error('Error fetching member discount:', error);
//       setMemberDiscountAmount(0);
//     }
//   };

//   // Apply promotion code using new API
//   const applyPromotionCode = async () => {
//     if (!promotionCode || !bookingId) {
//       message.warning('Vui lòng nhập mã khuyến mãi và đảm bảo đã tạo đơn đặt vé');
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const token = getAuthToken();
      
//       // Find promotion ID from promotion code
//       const promotion = promotions.find(p => p.promotion_Code === promotionCode);
//       if (!promotion) {
//         message.error('Không tìm thấy mã khuyến mãi');
//         setLoading(false);
//         return;
//       }
      
//       // Use the new API to apply discount
//       const response = await axios.post(`https://localhost:7168/api/Points/booking/${bookingId}/apply-discount`, {
//         promotionId: promotion.promotion_ID,
//         userId: member?.user_ID || 0
//       }, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//           'Content-Type': 'application/json'
//         },
//       });
      
//       if (response.data) {
//         // Lấy thông tin giảm giá từ response API
//         const discountAmount = response.data.discountAmount || calculateSubtotal() * (promotion.discount_Value / 100);
        
//         setAppliedPromotion({
//           promotion_ID: promotion.promotion_ID,
//           code: promotion.promotion_Code,
//           name: promotion.promotion_Detail,
//           discount_Value: promotion.discount_Value,
//           discount_Amount: discountAmount
//         });
        
//         message.success('Áp dụng mã khuyến mãi thành công!');
//         updateBookingSummary(selectedSeats, memberDiscountAmount, discountAmount, pointsToUse);
//       }
//     } catch (error) {
//       console.error('Error applying promotion:', error);
//       message.error('Mã khuyến mãi không hợp lệ hoặc không áp dụng được');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Apply points discount using new API
//   const applyPointsDiscount = async () => {
//     if (!member || !bookingId || pointsToUse <= 0) {
//       message.warning('Vui lòng nhập số điểm cần sử dụng và đảm bảo đã tạo đơn đặt vé');
//       return;
//     }
    
//     if (pointsToUse > member.currentPoints) {
//       message.error('Số điểm sử dụng không thể lớn hơn số điểm hiện có');
//       return;
//     }
    
//     try {
//       setLoading(true);
//       const token = getAuthToken();
      
//       // Sử dụng API mới để áp dụng giảm giá từ điểm
//       const response = await axios.post(`https://localhost:7168/api/Points/booking/${bookingId}/apply-discount`, {
//         userId: member.user_ID,
//         pointsToUse: pointsToUse
//       }, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//           'Content-Type': 'application/json'
//         },
//       });
      
//       if (response.data) {
//         // Lấy số tiền giảm giá từ API
//         const pointsDiscountAmount = response.data.discountAmount || pointsToUse * 1000; // Giả sử 1 điểm = 1000 VND nếu API không trả về
        
//         message.success(`Đã sử dụng ${pointsToUse} điểm để giảm giá ${pointsDiscountAmount.toLocaleString()} VND`);
//         updateBookingSummary(selectedSeats, memberDiscountAmount, appliedPromotion?.discount_Amount || 0, pointsDiscountAmount);
//       }
//     } catch (error) {
//       console.error('Error applying points discount:', error);
//       message.error('Không thể sử dụng điểm tích lũy. Vui lòng thử lại.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Remove applied promotion
//   const removePromotion = () => {
//     setAppliedPromotion(null);
//     setPromotionCode('');
//     updateBookingSummary(selectedSeats, memberDiscountAmount, 0, pointsToUse);
//     message.success('Đã xóa mã khuyến mãi');
//   };

//   // Register new member with updated API
//   const registerNewMember = async (values: any) => {
//     try {
//       setLoading(true);
//       const token = getAuthToken();
//       const response = await axios.post('https://localhost:7168/api/User/staff-register', {
//         fullName: values.name,
//         email: values.email,
//         phoneNumber: values.phone,
//         sex: values.sex || "Other" // Thêm giới tính theo yêu cầu
//       }, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//           'Content-Type': 'application/json'
//         },
//       });
      
//       if (response.data) {
//         message.success('Đăng ký thành viên mới thành công!');
//         setNewUserModalVisible(false);
        
//         // Tìm kiếm thông tin thành viên mới đăng ký
//         lookupMember(values.email, 'email');
//       }
//     } catch (error) {
//       console.error('Error registering new user:', error);
//       message.error('Lỗi đăng ký thành viên mới');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSeatSelect = (seat: Seat) => {
//     if (seat.seat_Status === 'Booked' || seat.seat_Status === 'Reserved') {
//       return;
//     }
    
//     const isSelected = selectedSeats.some(s => s.seat_ID === seat.seat_ID);
    
//     if (isSelected) {
//       setSelectedSeats(selectedSeats.filter(s => s.seat_ID !== seat.seat_ID));
//     } else {
//       setSelectedSeats([...selectedSeats, seat]);
//     }
//   };

//   // Cập nhật hàm xử lý khi nhấn nút "Tiếp tục" sau khi chọn ghế
//   const handleContinueAfterSeatSelection = async () => {
//     if (selectedSeats.length === 0) {
//       message.error('Vui lòng chọn ít nhất một ghế');
//       return;
//     }
    
//     // Tính toán tổng tiền và cập nhật booking summary
//     const subtotal = calculateSubtotal();
//     setBookingSummary({
//       subtotal,
//       discounts: 0,
//       memberDiscount: 0,
//       promotionDiscount: 0,
//       total: subtotal
//     });
    
//     // Tạo booking và chuyển sang bước tiếp theo
//     const bookingCreated = await createBooking();
//     if (bookingCreated) {
//       setCurrentStep(3); // Chuyển sang bước nhập thông tin khách hàng
//     }
//   };

//   // Cập nhật hàm để tạo booking trực tiếp sau khi chọn ghế
//   const createBooking = async () => {
//     if (!selectedShowtime || selectedSeats.length === 0) {
//       message.error('Vui lòng chọn suất chiếu và ghế ngồi');
//       return false;
//     }
    
//     try {
//       setLoading(true);
//       const token = getAuthToken();
      
//       // Tạo payload theo định dạng API yêu cầu
//       const bookingPayload = {
//         showtime_ID: selectedShowtime.showtime_ID,
//         seat_IDs: selectedSeats.map(seat => seat.seat_ID),
//         payment_Method: "Payos", // Mặc định là Payos theo yêu cầu
//         pointsToUse: 0 // Mặc định là 0, có thể cập nhật nếu cần
//       };
      
//       // Gọi API để tạo booking
//       const response = await axios.post('https://localhost:7168/api/Booking', bookingPayload, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//           'Content-Type': 'application/json'
//         },
//       });
      
//       if (response.data) {
//         setBookingId(response.data.bookingId || response.data.id || response.data.booking_ID);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error creating booking:', error);
//       message.error('Không thể tạo đơn đặt vé. Vui lòng thử lại.');
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle movie selection
//   const handleMovieSelect = (movie: Movie) => {
//     // Reset any previous booking data first
//     resetBookingState();
    
//     // Then set the new selected movie
//     setSelectedMovie(movie);
//     fetchAvailableDates(movie.movie_ID);
//     setCurrentStep(1);
//   };

//   // Handle date selection
//   const handleDateSelect = (date: moment.Moment | null) => {
//     if (date && selectedMovie) {
//       setSelectedDate(date);
//       fetchShowtimes(selectedMovie.movie_ID, date.format('YYYY-MM-DD'));
//     }
//   };

//   // Handle showtime selection
//   const handleShowtimeSelect = (showtime: Showtime) => {
//     setSelectedShowtime(showtime);
//     fetchSeats(showtime.showtime_ID);
//     setCurrentStep(2);
//   };

//   // Calculate subtotal based on selected seats
//   const calculateSubtotal = () => {
//     return selectedSeats.reduce((total, seat) => total + seat.price, 0);
//   };

//   const updateBookingSummary = (seats: Seat[], memberDiscount: number, promotionDiscount: number, pointsDiscount: number) => {
//     const subtotal = seats.reduce((total, seat) => total + seat.price, 0);
//     const memberDiscountAmount = (memberDiscount / 100) * subtotal;
//     const totalDiscounts = memberDiscountAmount + promotionDiscount + pointsDiscount;
    
//     setBookingSummary({
//       subtotal,
//       discounts: totalDiscounts,
//       memberDiscount: memberDiscountAmount,
//       promotionDiscount: promotionDiscount,
//       total: subtotal - totalDiscounts
//     });
//   };

//   // Handle customer form submission
//   const handleCustomerSubmit = async (values: any) => {
//     setCustomer({
//       name: values.name,
//       phone: values.phone,
//       email: values.email,
//       sex: values.sex || 'Other'
//     });
    
//     // Booking đã được tạo ở bước trước, chuyển thẳng sang bước thanh toán
//     setCurrentStep(4);
//   };

//   // Handle payment method selection
//   const handlePaymentMethodSelect = (method: string) => {
//     setPaymentMethod(method);
//   };

//   // Generate ticket after payment
//   const generateTicket = async (bookingId: number) => {
//     try {
//       const token = getAuthToken();
      
//       // 1. Generate ticket
//       const generateResponse = await axios.post(`https://localhost:7168/api/Ticket/generate/${bookingId}`, {}, {
//         headers: {
//           Authorization: token ? `Bearer ${token}` : undefined,
//           'Content-Type': 'application/json'
//         },
//       });
      
//       if (generateResponse.data && generateResponse.data.ticket_ID) {
//         const ticketId = generateResponse.data.ticket_ID;
//         setTicketId(ticketId);
        
//         // 2. Generate PDF
//         await axios.get(`https://localhost:7168/api/Ticket/pdf/${ticketId}`, {
//           headers: {
//             Authorization: token ? `Bearer ${token}` : undefined,
//           },
//         });
        
//         // 3. Send email if requested
//         if (sendConfirmation && customer.email) {
//           await axios.post('https://localhost:7168/api/Ticket/send/mail', {
//             ticketId: ticketId,
//             email: customer.email
//           }, {
//             headers: {
//               Authorization: token ? `Bearer ${token}` : undefined,
//               'Content-Type': 'application/json'
//             },
//           });
          
//           message.success('Đã gửi vé qua email thành công!');
//         }
        
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error generating ticket:', error);
//       message.error('Lỗi khi tạo vé. Vui lòng thử lại.');
//       return false;
//     }
//   };

//   // Cập nhật hàm xử lý thanh toán theo yêu cầu mới
//   const processPayment = async () => {
//     if (!bookingId || !customer.name || !customer.phone || !customer.email) {
//       message.error('Thông tin đặt vé không hợp lệ');
//       return;
//     }

//     try {
//       setLoading(true);
//       const token = getAuthToken();
      
//       if (paymentMethod === 'Cash') {
//         // Thanh toán tại quầy - sử dụng PUT /api/Booking/{id}/payment
//         const response = await axios.put(`https://localhost:7168/api/Booking/${bookingId}/payment`, {}, {
//           headers: {
//             Authorization: token ? `Bearer ${token}` : undefined,
//             'Content-Type': 'application/json'
//           },
//         });
        
//         if (response.status === 200) {
//           message.success('Thanh toán tại quầy thành công!');
          
//           // Tạo và gửi vé
//           await generateTicket(bookingId);
          
//           // Chuyển đến trang xác nhận đặt vé
//           navigate('/booking-success', { 
//             state: { 
//               bookingId: bookingId,
//               movieName: selectedMovie?.movie_Name,
//               showtime: `${formatDate(selectedShowtime?.show_Date)} ${formatTime(selectedShowtime?.start_Time)}`,
//               seats: selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', '),
//               total: bookingSummary.total,
//               paymentMethod: 'Thanh toán tại quầy'
//             } 
//           });
//         }
//       } else if (paymentMethod === 'Payos') {
//         // Thanh toán QR Code - sử dụng POST /api/payos/create
//         const response = await axios.post('https://localhost:7168/api/payos/create', {
//           bookingId: bookingId
//         }, {
//           headers: {
//             Authorization: token ? `Bearer ${token}` : undefined,
//             'Content-Type': 'application/json'
//           },
//         });
        
//         if (response.data) {
//           // Lưu thông tin thanh toán
//           setPaymentData(response.data);
          
//           // Thay đổi: Thay vì hiển thị QR code, chuyển hướng người dùng đến trang thanh toán
//           if (response.data.paymentUrl) {
//             window.location.href = response.data.paymentUrl;
//           } else {
//             // Hiển thị modal QR code nếu không có URL
//             setPaymentQrVisible(true);
//           }
//         }
//       }
//     } catch (error) {
//       console.error('Error processing payment:', error);
//       message.error('Lỗi xử lý thanh toán: ' + (error.response?.data?.message || error.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Cập nhật hàm xử lý khi thanh toán QR thành công
//   const handlePaymentSuccess = async () => {
//     setPaymentQrVisible(false);
//     message.success('Thanh toán thành công!');
    
//     // Tạo và gửi vé
//     await generateTicket(bookingId);
    
//     // Chuyển đến trang xác nhận đặt vé
//     navigate('/booking-success', { 
//       state: { 
//         bookingId: bookingId,
//         movieName: selectedMovie?.movie_Name,
//         showtime: `${formatDate(selectedShowtime?.show_Date)} ${formatTime(selectedShowtime?.start_Time)}`,
//         seats: selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', '),
//         total: bookingSummary.total,
//         paymentMethod: 'Thanh toán QR Code'
//       } 
//     });
//   };

//   // Format date for display
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return '';
//     const date = moment(dateString);
//     return date.format('DD/MM/YYYY');
//   };

//   // Format time for display
//   const formatTime = (timeString?: string) => {
//     if (!timeString) return '';
//     return timeString.substring(0, 5);
//   };

//   // Filter movies based on search value
//   const filteredMovies = movies.filter(movie => 
//     movie.movie_Name.toLowerCase().includes(searchValue.toLowerCase()) ||
//     movie.genre.toLowerCase().includes(searchValue.toLowerCase()) ||
//     movie.director.toLowerCase().includes(searchValue.toLowerCase())
//   );

//   // Group seats by row for better display
//   const seatsByRow = seats.reduce((acc, seat) => {
//     if (!acc[seat.row_Name]) {
//       acc[seat.row_Name] = [];
//     }
//     acc[seat.row_Name].push(seat);
//     return acc;
//   }, {} as Record<string, Seat[]>);

//   // Get unique column numbers for headers
//   const getUniqueColumnNumbers = () => {
//     const columns = seats.map(seat => seat.seat_Number);
//     return [...new Set(columns)].sort((a, b) => a - b);
//   };

//   // Enhanced Movie Card Component
//   const MovieCard = ({ movie, onSelect }) => {
//     return (
//       <Card 
//         key={movie.movie_ID}
//         hoverable
//         className="movie-card"
//         cover={
//           <div className="relative">
//             <img 
//               alt={movie.movie_Name} 
//               src={movie.poster_URL} 
//               style={{ height: 300, objectFit: 'cover' }} 
//             />
//             <Tag color={movie.rating === 'P13' ? 'orange' : 'green'} 
//                 className="absolute top-2 right-2">
//               {movie.rating}
//             </Tag>
//           </div>
//         }
//         onClick={() => onSelect(movie)}
//       >
//         <Card.Meta
//           title={<span className="text-lg font-bold">{movie.movie_Name}</span>}
//           description={
//             <>
//               <div className="flex items-center mb-1">
//                 <ClockCircleOutlined className="mr-1" />
//                 <span>{movie.duration} phút</span>
//               </div>
//               <div className="flex items-center mb-1">
//                 <TagOutlined className="mr-1" />
//                 <span>{movie.genre}</span>
//               </div>
//               <div className="flex items-center">
//                 <UserOutlined className="mr-1" />
//                 <span>Đạo diễn: {movie.director}</span>
//               </div>
//               <Button 
//                 type="primary" 
//                 className="mt-3 w-full"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onSelect(movie);
//                 }}
//               >
//                 Đặt vé ngay
//               </Button>
//             </>
//           }
//         />
//       </Card>
//     );
//   };

//   // Enhanced Showtime Info Header
//   const ShowtimeInfoHeader = ({ movie, showtime }) => {
//     return (
//       <div className="sticky top-0 z-10 bg-white shadow-md p-4 mb-6 rounded-lg">
//         <Row gutter={16} align="middle">
//           <Col span={4}>
//             <img 
//               src={movie?.poster_URL} 
//               alt={movie?.movie_Name} 
//               className="w-full rounded-lg"
//               style={{ maxHeight: '80px', objectFit: 'cover' }}
//             />
//           </Col>
//           <Col span={14}>
//             <Title level={4} className="m-0">{movie?.movie_Name}</Title>
//             <Space className="mt-1">
//               <Tag color="blue">{movie?.rating}</Tag>
//               <Tag color="purple">{movie?.duration} phút</Tag>
//             </Space>
//             <div className="mt-2">
//               <Text strong>Suất chiếu:</Text> {formatDate(showtime?.show_Date)} {formatTime(showtime?.start_Time)}
//             </div>
//           </Col>
//           <Col span={6} className="text-right">
//             <div>
//               <Text strong>Phòng:</Text> {showtime?.room_Name}
//             </div>
//             <div>
//               <Text strong>Giá:</Text> {showtime?.base_Price.toLocaleString()} VND
//             </div>
//             <div className="mt-2">
//               <Tag color="green">Còn {seats.filter(s => s.seat_Status !== 'Booked' && s.seat_Status !== 'Reserved').length} ghế trống</Tag>
//             </div>
//           </Col>
//         </Row>
//       </div>
//     );
//   };

//   // Enhanced Member Details Component
//   const MemberDetailsView = ({ member }) => {
//     if (!member) return null;
    
//     return (
//       <div className="member-details bg-blue-50 rounded-lg p-6 mb-6">
//         <div className="flex items-start">
//           <Avatar 
//             size={80} 
//             icon={<UserOutlined />} 
//             className="mr-6"
//             style={{ backgroundColor: member.isVip ? '#f59e0b' : '#3b82f6' }}
//           />
//           <div className="flex-grow">
//             <div className="flex justify-between items-center mb-2">
//               <Typography.Text strong className="text-xl">{member.full_Name}</Typography.Text>
//               <Tag color={member.isVip ? 'gold' : 'blue'} className="text-sm px-3 py-1">
//                 {member.membershipStatus}
//               </Tag>
//             </div>
            
//             <Descriptions column={1} size="small" className="mb-3">
//               <Descriptions.Item label="Mã thành viên">{member.user_ID}</Descriptions.Item>
//               <Descriptions.Item label="Số điện thoại">{member.phone_Number}</Descriptions.Item>
//               <Descriptions.Item label="Email">{member.email}</Descriptions.Item>
//               <Descriptions.Item label="Giới tính">{member.sex || 'Không xác định'}</Descriptions.Item>
//               <Descriptions.Item label="Điểm tích lũy">
//                 <span className="font-semibold">{member.currentPoints}</span> điểm
//               </Descriptions.Item>
//             </Descriptions>
            
//             {memberDiscountAmount > 0 && (
//               <Alert 
//                 message={`Ưu đãi thành viên: Giảm ${memberDiscountAmount}% tổng hóa đơn`}
//                 type="success" 
//                 showIcon 
//                 className="mt-2"
//               />
//             )}
            
//             {member.currentPoints > 0 && (
//               <div className="mt-4 bg-green-50 p-3 rounded-lg">
//                 <div className="mb-2">
//                   <Text strong>Sử dụng điểm tích lũy:</Text>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Input 
//                     type="number"
//                     placeholder="Nhập số điểm muốn sử dụng" 
//                     value={pointsToUse}
//                     onChange={(e) => setPointsToUse(parseInt(e.target.value) || 0)}
//                     min={0}
//                     max={member.currentPoints}
//                     style={{ width: '200px' }}
//                   />
//                   <Button 
//                     type="primary" 
//                     onClick={applyPointsDiscount}
//                     disabled={!bookingId || pointsToUse <= 0}
//                   >
//                     Áp dụng
//                   </Button>
//                 </div>
//                 <div className="text-xs text-gray-500 mt-1">
//                   Bạn có thể sử dụng tối đa {member.currentPoints} điểm
//                 </div>
//               </div>
//             )}
            
//             <div className="mt-4">
//               <Button type="primary" onClick={() => applyMemberInfo()}>
//                 Sử dụng thông tin này
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Enhanced Promotion Section
//   const EnhancedPromotionSection = () => {
//     return (
//       <div className="promotion-section mb-6">
//         <Title level={5}>Mã khuyến mãi</Title>
        
//         <div className="flex items-center mb-4">
//           <Input
//             placeholder="Nhập mã khuyến mãi"
//             value={promotionCode}
//             onChange={e => setPromotionCode(e.target.value)}
//             disabled={!!appliedPromotion}
//             className="mr-2 flex-grow"
//             prefix={<PercentageOutlined className="text-gray-400" />}
//             size="large"
//           />
//           {appliedPromotion ? (
//             <Button 
//               danger 
//               icon={<CloseCircleOutlined />} 
//               onClick={removePromotion}
//               size="large"
//             >
//               Xóa
//             </Button>
//           ) : (
//             <Button 
//               type="primary" 
//               icon={<CheckCircleOutlined />} 
//               onClick={applyPromotionCode}
//               loading={loading}
//               disabled={!bookingId}
//               size="large"
//             >
//               Áp dụng
//             </Button>
//           )}
//         </div>
        
//         {/* Display discount amount when promotion is applied */}
//         {appliedPromotion && (
//           <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
//             <div className="flex justify-between items-center">
//               <div>
//                 <Text strong className="text-green-700">Mã khuyến mãi đã áp dụng:</Text>
//                 <div className="mt-1">
//                   <Tag color="green" className="text-sm">{appliedPromotion.code}</Tag>
//                   <Text className="ml-2">{appliedPromotion.name}</Text>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <Text type="secondary">Giảm giá:</Text>
//                 <div className="text-green-600 font-bold text-lg">
//                   -{appliedPromotion.discount_Amount.toLocaleString()} VND
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
        
//         {/* Available promotions list */}
//         {promotions.length > 0 && !appliedPromotion && (
//           <div className="mt-4">
//             <Text strong>Khuyến mãi có sẵn:</Text>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
//               {promotions.map(promo => (
//                 <Card 
//                   key={promo.promotion_ID} 
//                   size="small" 
//                   className="cursor-pointer hover:shadow-md transition-shadow"
//                   onClick={() => handlePromotionClick(promo.promotion_Code)}
//                 >
//                   <div className="flex justify-between items-center">
//                     <div>
//                       <Text strong>{promo.promotion_Code}</Text>
//                       <div className="text-xs text-gray-500">{promo.promotion_Detail}</div>
//                     </div>
//                     <Button 
//                       type="link" 
//                       size="small"
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handlePromotionClick(promo.promotion_Code);
//                       }}
//                     >
//                       Áp dụng
//                     </Button>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Payment methods options
//   const paymentMethods: PaymentMethod[] = [
//     { id: 'Cash', name: 'Thanh toán tại quầy', icon: <DollarOutlined /> },
//     { id: 'Payos', name: 'Thanh toán QR Code', icon: <QrcodeOutlined /> },
//   ];

//   return (
//     <div className="container mx-auto p-4">
//       <Title level={2} className="mb-6">Đặt vé xem phim</Title>
      
//       <Steps current={currentStep} className="mb-8">
//         <Step title="Chọn phim" icon={<PlayCircleOutlined />} />
//         <Step title="Chọn suất chiếu" icon={<CalendarOutlined />} />
//         <Step title="Chọn ghế" icon={<TeamOutlined />} />
//         <Step title="Thông tin khách hàng" icon={<UserOutlined />} />
//         <Step title="Thanh toán" icon={<CreditCardOutlined />} />
//       </Steps>
      
//       {/* Step 1: Movie Selection */}
//       {currentStep === 0 && (
//         <div className="movie-selection">
//           <div className="mb-6">
//             <Input 
//               placeholder="Tìm kiếm phim theo tên, thể loại, đạo diễn..." 
//               prefix={<SearchOutlined />} 
//               value={searchValue}
//               onChange={e => setSearchValue(e.target.value)}
//               size="large"
//               className="max-w-lg"
//             />
//           </div>
          
//           {loading ? (
//             <div className="flex justify-center my-8">
//               <Spin size="large" />
//             </div>
//           ) : (
//             <Row gutter={[24, 24]}>
//               {filteredMovies.map(movie => (
//                 <Col xs={24} sm={12} md={8} lg={6} key={movie.movie_ID}>
//                   <MovieCard movie={movie} onSelect={handleMovieSelect} />
//                 </Col>
//               ))}
//             </Row>
//           )}
//         </div>
//       )}
      
//       {/* Step 2: Showtime Selection */}
//       {currentStep === 1 && selectedMovie && (
//         <div className="showtime-selection">
//           <Button 
//             type="link" 
//             icon={<LeftOutlined />} 
//             onClick={() => setCurrentStep(0)}
//             className="mb-4"
//           >
//             Quay lại chọn phim
//           </Button>
          
//           <Row gutter={24}>
//             <Col span={6}>
//               <img 
//                                src={selectedMovie.poster_URL} 
//                                alt={selectedMovie.movie_Name} 
//                                className="w-full rounded-lg shadow-lg"
//                                style={{ maxHeight: '500px', objectFit: 'cover' }}
//                              />
//                            </Col>
                           
//                            <Col span={18}>
//                              <Title level={3}>{selectedMovie.movie_Name}</Title>
//                              <Descriptions column={2}>
//                                <Descriptions.Item label="Thể loại">{selectedMovie.genre}</Descriptions.Item>
//                                <Descriptions.Item label="Đạo diễn">{selectedMovie.director}</Descriptions.Item>
//                                <Descriptions.Item label="Thời lượng">{selectedMovie.duration} phút</Descriptions.Item>
//                                <Descriptions.Item label="Giới hạn tuổi">{selectedMovie.rating}</Descriptions.Item>
//                                <Descriptions.Item label="Diễn viên" span={2}>{selectedMovie.cast}</Descriptions.Item>
//                              </Descriptions>
                             
//                              <Divider />
                             
//                              <Title level={4}>Chọn ngày xem phim</Title>
//                              <div className="date-selection flex overflow-x-auto pb-4 mb-4">
//                                {availableDates.map((dateStr, index) => {
//                                  const date = moment(dateStr);
//                                  const isSelected = selectedDate && date.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
                                 
//                                  return (
//                                    <div 
//                                      key={index} 
//                                      className={`date-item flex-shrink-0 mr-3 p-3 rounded-lg cursor-pointer border ${isSelected ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-50'}`}
//                                      onClick={() => handleDateSelect(date)}
//                                    >
//                                      <div className="text-center">
//                                        <div className="text-xs font-semibold">{date.format('ddd').toUpperCase()}</div>
//                                        <div className="text-lg font-bold">{date.format('DD')}</div>
//                                        <div className="text-xs">{date.format('MM/YYYY')}</div>
//                                      </div>
//                                    </div>
//                                  );
//                                })}
//                              </div>
                             
//                              <Title level={4}>Suất chiếu có sẵn</Title>
//                              {loading ? (
//                                <Spin />
//                              ) : showtimes.length > 0 ? (
//                                <div className="showtime-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                                  {showtimes.map(showtime => (
//                                    <Card 
//                                      key={showtime.showtime_ID}
//                                      hoverable
//                                      className={`showtime-card ${selectedShowtime?.showtime_ID === showtime.showtime_ID ? 'border-2 border-blue-500' : ''}`}
//                                      onClick={() => handleShowtimeSelect(showtime)}
//                                    >
//                                      <div className="text-center">
//                                        <div className="text-lg font-bold">{formatTime(showtime.start_Time)}</div>
//                                        <div className="text-sm text-gray-500">đến {formatTime(showtime.end_Time)}</div>
//                                        <Divider className="my-2" />
//                                        <div className="flex justify-between items-center">
//                                          <Tag color="blue">{showtime.room_Name}</Tag>
//                                          <div className="font-semibold">{showtime.base_Price.toLocaleString()} VND</div>
//                                        </div>
//                                      </div>
//                                    </Card>
//                                  ))}
//                                </div>
//                              ) : (
//                                <Empty description="Không có suất chiếu nào vào ngày này" />
//                              )}
//                            </Col>
//                          </Row>
//                        </div>
//                      )}
                     
//                      {/* Step 3: Seat Selection */}
//                      {currentStep === 2 && selectedMovie && selectedShowtime && (
//                        <div className="seat-selection">
//                          <Button 
//                            type="link" 
//                            icon={<LeftOutlined />} 
//                            onClick={() => setCurrentStep(1)}
//                            className="mb-4"
//                          >
//                            Quay lại chọn suất chiếu
//                          </Button>
                         
//                          <ShowtimeInfoHeader movie={selectedMovie} showtime={selectedShowtime} />
                         
//                          <div className="seating-layout bg-white rounded-lg p-6 mb-6">
//                            <Screen>
//                              <ScreenText>MÀN HÌNH</ScreenText>
//                            </Screen>
                           
//                            <SeatingArea>
//                              {/* Column headers */}
//                              <div></div>
//                              <ColumnHeader>
//                                {getUniqueColumnNumbers().map(colNum => (
//                                  <ColumnLabel key={colNum}>{colNum}</ColumnLabel>
//                                ))}
//                              </ColumnHeader>
//                              <div></div>
                             
//                              {/* Seats by row */}
//                              {Object.entries(seatsByRow).map(([rowName, rowSeats]) => {
//                                const sortedSeats = [...rowSeats].sort((a, b) => a.seat_Number - b.seat_Number);
                               
//                                return (
//                                  <RowContainer key={rowName} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
//                                    <RowLabel>{rowName}</RowLabel>
//                                    <SeatsSection>
//                                      {sortedSeats.map(seat => {
//                                        const isSelected = selectedSeats.some(s => s.seat_ID === seat.seat_ID);
//                                        const isDisabled = seat.seat_Status === 'Booked' || seat.seat_Status === 'Reserved';
                                       
//                                        return (
//                                          <SeatButtonWrapper key={seat.seat_ID}>
//                                            <SeatButton
//                                              isSelected={isSelected}
//                                              seatType={seat.seat_Type}
//                                              seatStatus={seat.seat_Status}
//                                              onClick={() => handleSeatSelect(seat)}
//                                              disabled={isDisabled}
//                                              whileHover={!isDisabled ? { scale: 1.1 } : {}}
//                                              whileTap={!isDisabled ? { scale: 0.95 } : {}}
//                                            >
//                                              <SeatNumber>{seat.seat_Number}</SeatNumber>
//                                            </SeatButton>
//                                            <SeatTooltip>
//                                              {seat.row_Name}{seat.seat_Number} - {seat.seat_Type} - {seat.price.toLocaleString()} VND
//                                            </SeatTooltip>
//                                          </SeatButtonWrapper>
//                                        );
//                                      })}
//                                    </SeatsSection>
//                                    <RowLabel>{rowName}</RowLabel>
//                                  </RowContainer>
//                                );
//                              })}
                             
//                              {/* Column footers */}
//                              <div></div>
//                              <ColumnFooter>
//                                {getUniqueColumnNumbers().map(colNum => (
//                                  <ColumnLabel key={colNum}>{colNum}</ColumnLabel>
//                                ))}
//                              </ColumnFooter>
//                              <div></div>
//                            </SeatingArea>
                           
//                            <SeatLegend>
//                              <LegendItem>
//                                <ColorBox color="#3b82f6" />
//                                <span>Ghế thường</span>
//                              </LegendItem>
//                              <LegendItem>
//                                <ColorBox color="#ef4444" />
//                                <span>Ghế VIP</span>
//                              </LegendItem>
//                              <LegendItem>
//                                <ColorBox color="#9ca3af" />
//                                <span>Đã đặt</span>
//                              </LegendItem>
//                              <LegendItem>
//                                <ColorBox color="#22c55e" style={{ border: '3px solid #22c55e' }} />
//                                <span>Đang chọn</span>
//                              </LegendItem>
//                            </SeatLegend>
//                          </div>
                         
//                          <div className="selected-seats-summary bg-white rounded-lg p-6 mb-6">
//                            <Title level={4}>Ghế đã chọn</Title>
//                            {selectedSeats.length > 0 ? (
//                              <div>
//                                <div className="flex flex-wrap gap-2 mb-4">
//                                  {selectedSeats.map(seat => (
//                                    <Tag 
//                                      key={seat.seat_ID}
//                                      color={seat.seat_Type === 'VIP' ? 'red' : 'blue'}
//                                      closable
//                                      onClose={() => handleSeatSelect(seat)}
//                                    >
//                                      {seat.row_Name}{seat.seat_Number} - {seat.price.toLocaleString()} VND
//                                    </Tag>
//                                  ))}
//                                </div>
//                                <Divider />
//                                <div className="flex justify-between items-center">
//                                  <div>
//                                    <Text strong>Tổng tiền:</Text>
//                                    <div className="text-xl font-bold">
//                                      {calculateSubtotal().toLocaleString()} VND
//                                    </div>
//                                  </div>
//                                  <Button 
//                                    type="primary" 
//                                    size="large"
//                                    onClick={handleContinueAfterSeatSelection}
//                                    disabled={selectedSeats.length === 0}
//                                  >
//                                    Tiếp tục
//                                  </Button>
//                                </div>
//                              </div>
//                            ) : (
//                              <Empty description="Chưa chọn ghế nào" />
//                            )}
//                          </div>
//                        </div>
//                      )}
                     
//                      {/* Step 4: Customer Information */}
//                      {currentStep === 3 && (
//                        <div className="customer-info">
//                          <Button 
//                            type="link" 
//                            icon={<LeftOutlined />} 
//                            onClick={() => setCurrentStep(2)}
//                            className="mb-4"
//                          >
//                            Quay lại chọn ghế
//                          </Button>
                         
//                          <Row gutter={24}>
//                            <Col span={16}>
//                              <Card title="Thông tin khách hàng" className="mb-6">
//                                <div className="mb-4">
//                                  <Title level={5}>Tra cứu thành viên</Title>
//                                  <div className="flex items-center mb-2">
//                                    <Select 
//                                      value={memberLookupType}
//                                      onChange={value => setMemberLookupType(value)}
//                                      style={{ width: 120 }}
//                                      className="mr-2"
//                                    >
//                                      <Option value="phone">Số điện thoại</Option>
//                                      <Option value="email">Email</Option>
//                                    </Select>
//                                    <Input 
//                                      placeholder={memberLookupType === 'phone' ? "Nhập số điện thoại" : "Nhập email"}
//                                      value={memberLookupValue}
//                                      onChange={e => setMemberLookupValue(e.target.value)}
//                                      className="mr-2 flex-grow"
//                                    />
//                                    <Button 
//                                      type="primary" 
//                                      onClick={() => lookupMember(memberLookupValue, memberLookupType)}
//                                      loading={lookupLoading}
//                                    >
//                                      Tra cứu
//                                    </Button>
//                                  </div>
//                                  <div className="text-right">
//                                    <Button 
//                                      type="link" 
//                                      onClick={() => setNewUserModalVisible(true)}
//                                    >
//                                      Đăng ký thành viên mới
//                                    </Button>
//                                  </div>
//                                </div>
                               
//                                {member && <MemberDetailsView member={member} />}
                               
//                                <Form
//                                  form={customerForm}
//                                  layout="vertical"
//                                  initialValues={customer}
//                                  onFinish={handleCustomerSubmit}
//                                >
//                                  <Row gutter={16}>
//                                    <Col span={12}>
//                                      <Form.Item
//                                        name="name"
//                                        label="Họ tên"
//                                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
//                                      >
//                                        <Input placeholder="Nhập họ tên" />
//                                      </Form.Item>
//                                    </Col>
//                                    <Col span={12}>
//                                      <Form.Item
//                                        name="phone"
//                                        label="Số điện thoại"
//                                        rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
//                                      >
//                                        <Input placeholder="Nhập số điện thoại" />
//                                      </Form.Item>
//                                    </Col>
//                                  </Row>
//                                  <Row gutter={16}>
//                                    <Col span={12}>
//                                      <Form.Item
//                                        name="email"
//                                        label="Email"
//                                        rules={[
//                                          { required: true, message: 'Vui lòng nhập email' },
//                                          { type: 'email', message: 'Email không hợp lệ' }
//                                        ]}
//                                      >
//                                        <Input placeholder="Nhập email" />
//                                      </Form.Item>
//                                    </Col>
//                                    <Col span={12}>
//                                      <Form.Item
//                                        name="sex"
//                                        label="Giới tính"
//                                      >
//                                        <Select placeholder="Chọn giới tính">
//                                          <Option value="Male">Nam</Option>
//                                          <Option value="Female">Nữ</Option>
//                                          <Option value="Other">Khác</Option>
//                                        </Select>
//                                      </Form.Item>
//                                    </Col>
//                                  </Row>
                                 
//                                  <Form.Item>
//                                    <Checkbox 
//                                      checked={sendConfirmation} 
//                                      onChange={e => setSendConfirmation(e.target.checked)}
//                                    >
//                                      Gửi xác nhận qua email
//                                    </Checkbox>
//                                  </Form.Item>
                                 
//                                  <Form.Item>
//                                    <Button type="primary" htmlType="submit" size="large">
//                                      Tiếp tục
//                                    </Button>
//                                  </Form.Item>
//                                </Form>
//                              </Card>
//                            </Col>
                           
//                            <Col span={8}>
//                              <Card title="Thông tin đặt vé" className="mb-6">
//                                <div className="mb-4">
//                                  <img 
//                                    src={selectedMovie?.poster_URL} 
//                                    alt={selectedMovie?.movie_Name} 
//                                    className="w-full rounded-lg mb-4"
//                                  />
//                                  <Title level={4}>{selectedMovie?.movie_Name}</Title>
//                                  <Descriptions column={1}>
//                                    <Descriptions.Item label="Suất chiếu">
//                                      {formatDate(selectedShowtime?.show_Date)} {formatTime(selectedShowtime?.start_Time)}
//                                    </Descriptions.Item>
//                                    <Descriptions.Item label="Phòng">
//                                      {selectedShowtime?.room_Name}
//                                    </Descriptions.Item>
//                                    <Descriptions.Item label="Ghế">
//                                      {selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}
//                                    </Descriptions.Item>
//                                  </Descriptions>
//                                </div>
                               
//                                <Divider />
                               
//                                <div>
//                                  <div className="flex justify-between mb-2">
//                                    <Text>Tổng tiền vé:</Text>
//                                    <Text>{bookingSummary.subtotal.toLocaleString()} VND</Text>
//                                  </div>
                                 
//                                  {bookingSummary.memberDiscount > 0 && (
//                                    <div className="flex justify-between mb-2 text-green-600">
//                                      <Text>Giảm giá thành viên ({memberDiscountAmount}%):</Text>
//                                      <Text>-{bookingSummary.memberDiscount.toLocaleString()} VND</Text>
//                                    </div>
//                                  )}
                                 
//                                  {bookingSummary.promotionDiscount > 0 && (
//                                    <div className="flex justify-between mb-2 text-green-600">
//                                      <Text>Giảm giá khuyến mãi:</Text>
//                                      <Text>-{bookingSummary.promotionDiscount.toLocaleString()} VND</Text>
//                                    </div>
//                                  )}
                                 
//                                  <Divider />
                                 
//                                  <div className="flex justify-between font-bold text-lg">
//                                    <Text strong>Thành tiền:</Text>
//                                    <Text strong>{bookingSummary.total.toLocaleString()} VND</Text>
//                                  </div>
//                                </div>
//                              </Card>
                             
//                              <Card title="Mã khuyến mãi">
//                                <div className="flex items-center mb-4">
//                                  <Input
//                                    placeholder="Nhập mã khuyến mãi"
//                                    value={promotionCode}
//                                    onChange={e => setPromotionCode(e.target.value)}
//                                    disabled={!!appliedPromotion}
//                                    className="mr-2"
//                                  />
//                                  {appliedPromotion ? (
//                                    <Button 
//                                      danger 
//                                      onClick={removePromotion}
//                                    >
//                                      Xóa
//                                    </Button>
//                                  ) : (
//                                    <Button 
//                                      type="primary" 
//                                      onClick={applyPromotionCode}
//                                      loading={loading}
//                                      disabled={!bookingId}
//                                    >
//                                      Áp dụng
//                                    </Button>
//                                  )}
//                                </div>
                               
//                                {appliedPromotion && (
//                                  <Alert
//                                    message={`Đã áp dụng mã: ${appliedPromotion.code}`}
//                                    description={`Giảm: ${appliedPromotion.discount_Amount.toLocaleString()} VND`}
//                                    type="success"
//                                    showIcon
//                                  />
//                                )}
                               
//                                <PromotionList>
//                                  {promotions.map(promo => (
//                                    <PromotionTag 
//                                      key={promo.promotion_ID}
//                                      onClick={() => handlePromotionClick(promo.promotion_Code)}
//                                    >
//                                      {promo.promotion_Code}
//                                    </PromotionTag>
//                                  ))}
//                                </PromotionList>
//                              </Card>
//                            </Col>
//                          </Row>
//                        </div>
//                      )}
                     
//                      {/* Step 5: Payment */}
//                      {currentStep === 4 && (
//                        <div className="payment">
//                          <Button 
//                            type="link" 
//                            icon={<LeftOutlined />} 
//                            onClick={() => setCurrentStep(3)}
//                            className="mb-4"
//                          >
//                            Quay lại thông tin khách hàng
//                          </Button>
                         
//                          <Row gutter={24}>
//                            <Col span={16}>
//                              <Card title="Phương thức thanh toán" className="mb-6">
//                                <div className="payment-methods grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                                  {paymentMethods.map(method => (
//                                    <div 
//                                      key={method.id}
//                                      className={`payment-method-card p-4 rounded-lg border-2 cursor-pointer transition-all ${
//                                        paymentMethod === method.id 
//                                          ? 'border-blue-500 bg-blue-50' 
//                                          : 'border-gray-200 hover:border-blue-300'
//                                      }`}
//                                      onClick={() => handlePaymentMethodSelect(method.id)}
//                                    >
//                                      <div className="flex items-center">
//                                        <div className={`text-2xl mr-3 ${paymentMethod === method.id ? 'text-blue-500' : 'text-gray-400'}`}>
//                                          {method.icon}
//                                        </div>
//                                        <div>
//                                          <div className="font-medium">{method.name}</div>
//                                          <div className="text-sm text-gray-500">
//                                            {method.id === 'Cash' 
//                                              ? 'Thanh toán trực tiếp tại quầy' 
//                                              : 'Quét mã QR để thanh toán'}
//                                          </div>
//                                        </div>
//                                      </div>
//                                    </div>
//                                  ))}
//                                </div>
                               
//                                {paymentMethod === 'Payos' && (
//                                  <Alert
//                                    message="Thanh toán QR Code"
//                                    description="Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán để quét mã QR."
//                                    type="info"
//                                    showIcon
//                                    className="mb-6"
//                                  />
//                                )}
                               
//                                <div className="text-right">
//                                  <Button 
//                                    type="primary" 
//                                    size="large" 
//                                    onClick={processPayment}
//                                    loading={loading}
//                                  >
//                                    Xác nhận thanh toán
//                                  </Button>
//                                </div>
//                              </Card>
//                            </Col>
                           
//                            <Col span={8}>
//                              <Card title="Thông tin đặt vé" className="mb-6">
//                                <div className="mb-4">
//                                  <img 
//                                    src={selectedMovie?.poster_URL} 
//                                    alt={selectedMovie?.movie_Name} 
//                                    className="w-full rounded-lg mb-4"
//                                  />
//                                  <Title level={4}>{selectedMovie?.movie_Name}</Title>
//                                  <Descriptions column={1}>
//                                    <Descriptions.Item label="Suất chiếu">
//                                      {formatDate(selectedShowtime?.show_Date)} {formatTime(selectedShowtime?.start_Time)}
//                                    </Descriptions.Item>
//                                    <Descriptions.Item label="Phòng">
//                                      {selectedShowtime?.room_Name}
//                                    </Descriptions.Item>
//                                    <Descriptions.Item label="Ghế">
//                                      {selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}
//                                    </Descriptions.Item>
//                                  </Descriptions>
//                                </div>
                               
//                                <Divider />
                               
//                                <div>
//                                  <div className="flex justify-between mb-2">
//                                    <Text>Tổng tiền vé:</Text>
//                                    <Text>{bookingSummary.subtotal.toLocaleString()} VND</Text>
//                                  </div>
                                 
//                                  {bookingSummary.memberDiscount > 0 && (
//                                    <div className="flex justify-between mb-2 text-green-600">
//                                      <Text>Giảm giá thành viên ({memberDiscountAmount}%):</Text>
//                                      <Text>-{bookingSummary.memberDiscount.toLocaleString()} VND</Text>
//                                    </div>
//                                  )}
                                 
//                                  {bookingSummary.promotionDiscount > 0 && (
//                                    <div className="flex justify-between mb-2 text-green-600">
//                                      <Text>Giảm giá khuyến mãi:</Text>
//                                      <Text>-{bookingSummary.promotionDiscount.toLocaleString()} VND</Text>
//                                    </div>
//                                  )}
                                 
//                                  <Divider />
                                 
//                                  <div className="flex justify-between font-bold text-lg">
//                                    <Text strong>Thành tiền:</Text>
//                                    <Text strong>{bookingSummary.total.toLocaleString()} VND</Text>
//                                  </div>
//                                </div>
//                              </Card>
                             
//                              <Card title="Thông tin khách hàng">
//                                <Descriptions column={1}>
//                                  <Descriptions.Item label="Họ tên">{customer.name}</Descriptions.Item>
//                                  <Descriptions.Item label="Số điện thoại">{customer.phone}</Descriptions.Item>
//                                  <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
//                                  <Descriptions.Item label="Giới tính">
//                                    {customer.sex === 'Male' ? 'Nam' : customer.sex === 'Female' ? 'Nữ' : 'Khác'}
//                                  </Descriptions.Item>
//                                </Descriptions>
                               
//                                {member && (
//                                  <div className="mt-4">
//                                    <Tag color={member.isVip ? 'gold' : 'blue'}>
//                                      Thành viên {member.membershipStatus}
//                                    </Tag>
//                                  </div>
//                                )}
//                              </Card>
//                            </Col>
//                          </Row>
//                        </div>
//                      )}
                     
//                      {/* New User Registration Modal */}
//                      <Modal
//                        title="Đăng ký thành viên mới"
//                        open={newUserModalVisible}
//                        onCancel={() => setNewUserModalVisible(false)}
//                        footer={[
//                          <Button key="back" onClick={() => setNewUserModalVisible(false)}>
//                            Hủy
//                          </Button>,
//                          <Button 
//                            key="submit" 
//                            type="primary" 
//                            loading={loading}
//                            onClick={() => newUserForm.submit()}
//                          >
//                            Đăng ký
//                          </Button>,
//                        ]}
//                      >
//                        <Form
//                          form={newUserForm}
//                          layout="vertical"
//                          onFinish={registerNewMember}
//                        >
//                          <Form.Item
//                            name="name"
//                            label="Họ tên"
//                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
//                          >
//                            <Input placeholder="Nhập họ tên" />
//                          </Form.Item>
                         
//                          <Form.Item
//                            name="phone"
//                            label="Số điện thoại"
//                            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
//                          >
//                            <Input placeholder="Nhập số điện thoại" />
//                          </Form.Item>
                         
//                          <Form.Item
//                            name="email"
//                            label="Email"
//                            rules={[
//                              { required: true, message: 'Vui lòng nhập email' },
//                              { type: 'email', message: 'Email không hợp lệ' }
//                            ]}
//                          >
//                            <Input placeholder="Nhập email" />
//                          </Form.Item>
                         
//                          <Form.Item
//                            name="sex"
//                            label="Giới tính"
//                            initialValue="Other"
//                          >
//                            <Select placeholder="Chọn giới tính">
//                              <Option value="Male">Nam</Option>
//                              <Option value="Female">Nữ</Option>
//                              <Option value="Other">Khác</Option>
//                            </Select>
//                          </Form.Item>
//                        </Form>
//                      </Modal>
                     
//                      {/* Payment QR Code Modal */}
//                      <Modal
//                        title="Thanh toán QR Code"
//                        open={paymentQrVisible}
//                        onCancel={() => setPaymentQrVisible(false)}
//                        footer={[
//                          <Button key="back" onClick={() => setPaymentQrVisible(false)}>
//                            Hủy
//                          </Button>,
//                          <Button 
//                            key="submit" 
//                            type="primary"
//                            onClick={handlePaymentSuccess}
//                          >
//                            Đã thanh toán
//                          </Button>,
//                        ]}
//                      >
//                        {paymentData && (
//                          <div className="text-center">
//                            <div className="mb-4">
//                              <QRCode value={paymentData.qrCodeUrl || 'https://payos.vn'} size={250} />
//                            </div>
//                            <div className="mb-2">
//                              <Text strong>Mã đơn hàng: {paymentData.orderCode}</Text>
//                            </div>
//                            <div className="mb-4">
//                              <Text strong>Số tiền: {paymentData.amount.toLocaleString()} VND</Text>
//                            </div>
//                            <div className="mb-4">
//                              <Text type="secondary">Quét mã QR bằng ứng dụng ngân hàng để thanh toán</Text>
//                            </div>
//                            {paymentData.paymentUrl && (
//                              <Button type="primary" href={paymentData.paymentUrl} target="_blank">
//                                Mở trang thanh toán
//                              </Button>
//                            )}
//                          </div>
//                        )}
//                      </Modal>
//                    </div>
//                  );
//                };
               
//                export default ManageBookings;
                

