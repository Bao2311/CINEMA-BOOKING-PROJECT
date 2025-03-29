import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Button, Input, Select, DatePicker, Space, 
  Tag, Modal, Form, Spin, message, Tooltip, Card,
  Tabs, Typography, Row, Col, Divider, Steps, 
  Radio, Checkbox, Avatar, Alert
} from 'antd';
import { 
  CalendarOutlined, LeftOutlined, RightOutlined,
  UserOutlined, CreditCardOutlined, SearchOutlined,
  CheckCircleOutlined, CloseCircleOutlined, TeamOutlined,
  PlusOutlined, ShoppingCartOutlined, BarcodeOutlined,
  PercentageOutlined, DollarOutlined, QrcodeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout/Layout';
import { QRCode } from 'antd';
import styled from 'styled-components';
import { motion } from 'framer-motion';

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

const SeatButton = styled(motion.button)<{ seatType: string; seatStatus: string; isSelected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: ${props => props.isSelected ? '3px solid #22c55e' : '1px solid #d1d5db'};
  box-shadow: ${props => props.isSelected ? '0 0 10px rgba(34, 197, 94, 0.5)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  background-color: ${props => {
    if (props.seatStatus === 'Booked' || props.seatStatus === 'Reserved') return '#9ca3af'; // Booked or Reserved seats
    switch (props.seatType) {
      case 'VIP':
        return '#ef4444'; // VIP seats
      case 'Regular':
      default:
        return '#3b82f6'; // Regular seats
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

const ColorBox = styled.div<{ color: string }>`
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

const ManageBookings: React.FC = () => {
  const { user } = useAuth();
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
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<AppliedPromotion | null>(null);
  const [promotionCode, setPromotionCode] = useState<string>('');
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '' });
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

  const [customerForm] = Form.useForm();
  const [membershipForm] = Form.useForm();
  const [newUserForm] = Form.useForm();

  useEffect(() => {
    fetchNowShowingMovies();
    fetchPromotions();
  }, []);

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
      if (response.data.$values) {
        setMovies(response.data.$values);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Không thể tải danh sách phim đang chiếu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch promotions from API
  const fetchPromotions = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('https://localhost:7168/api/Promotion?includeInactive=false', {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data.$values) {
        // Filter promotions with status 'active' and is_Active true
        const activePromotions = response.data.$values.filter(
          (promo: Promotion) => promo.status.toLowerCase() === 'active' && promo.is_Active
        );
        setPromotions(activePromotions);
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
      if (response.data.$values) {
        setAvailableDates(response.data.$values);
        if (response.data.$values.length > 0) {
          setSelectedDate(moment(response.data.$values[0]));
          fetchShowtimes(movieId, moment(response.data.$values[0]).format('YYYY-MM-DD'));
        }
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
      if (response.data.$values) {
        setShowtimes(response.data.$values);
      } else {
        setShowtimes([]);
      }
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setError('Không thể tải danh sách suất chiếu');
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
      } else {
        setSeats([]);
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      setError('Không thể tải danh sách ghế');
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
        };
        setMember(memberData);
        customerForm.setFieldsValue({
          name: response.data.full_Name,
          phone: response.data.phone_Number,
          email: response.data.email
        });
        setCustomer({
          name: response.data.full_Name,
          phone: response.data.phone_Number,
          email: response.data.email
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
        updateBookingSummary(selectedSeats, response.data, appliedPromotion?.discount_Amount || 0);
      }
    } catch (error) {
      console.error('Error fetching member discount:', error);
      setMemberDiscountAmount(0);
    }
  };

  // Apply promotion code
  const applyPromotionCode = async () => {
    if (!promotionCode) {
      message.warning('Vui lòng nhập mã khuyến mãi');
      return;
    }
    
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.post('https://localhost:7168/api/Promotion/apply', {
        bookingId: 0, // Booking ID chưa có, để 0 theo ví dụ API
        promotionCode: promotionCode, // Mã khuyến mãi từ ô nhập
        totalAmount: calculateSubtotal() // Tổng tiền trước khi áp dụng khuyến mãi
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.data) {
        setAppliedPromotion(response.data);
        message.success('Áp dụng mã khuyến mãi thành công!');
        updateBookingSummary(selectedSeats, memberDiscountAmount, response.data.discount_Amount);
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      message.error('Mã khuyến mãi không hợp lệ hoặc không áp dụng được');
    } finally {
      setLoading(false);
    }
  };

  // Remove applied promotion
  const removePromotion = () => {
    setAppliedPromotion(null);
    setPromotionCode('');
    updateBookingSummary(selectedSeats, memberDiscountAmount, 0);
    message.success('Đã xóa mã khuyến mãi');
  };

  // Register new member
  const registerNewMember = async (values: any) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.post('https://localhost:7168/api/User/register-user', {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (response.data) {
        message.success('Đăng ký thành viên mới thành công!');
        setNewUserModalVisible(false);
        
        customerForm.setFieldsValue({
          name: values.name,
          phone: values.phone,
          email: values.email
        });
        setCustomer({
          name: values.name,
          phone: values.phone,
          email: values.email
        });
        
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
      setSelectedSeats(prev => prev.filter(s => s.seat_ID !== seat.seat_ID));
      updateBookingSummary(
        selectedSeats.filter(s => s.seat_ID !== seat.seat_ID), 
        memberDiscountAmount, 
        appliedPromotion?.discount_Amount || 0
      );
    } else {
      setSelectedSeats(prev => [...prev, seat]);
      updateBookingSummary(
        [...selectedSeats, seat], 
        memberDiscountAmount, 
        appliedPromotion?.discount_Amount || 0
      );
    }
  };

  // Handle movie selection
  const handleMovieSelect = (movie: Movie) => {
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

  const updateBookingSummary = (seats: Seat[], memberDiscount: number, promotionDiscount: number) => {
    const subtotal = seats.reduce((total, seat) => total + seat.price, 0);
    const memberDiscountAmount = (memberDiscount / 100) * subtotal;
    const totalDiscounts = memberDiscountAmount + promotionDiscount;
    
    setBookingSummary({
      subtotal,
      discounts: totalDiscounts,
      memberDiscount: memberDiscountAmount,
      promotionDiscount,
      total: Math.max(0, subtotal - totalDiscounts)
    });
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  const formatTime = (timeString: string) => {
    return moment(timeString, 'HH:mm:ss').format('HH:mm');
  };

  // Render member search component
  const renderMemberLookup = () => {
    return (
      <div className="member-lookup mb-8">
        <div className="flex items-center justify-between mb-4">
          <Title level={5}>Tìm thông tin thành viên</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setNewUserModalVisible(true)}
          >
            Tạo thành viên mới
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select 
            value={memberLookupType} 
            onChange={(value) => setMemberLookupType(value)}
            style={{ width: 120 }}
          >
            <Option value="phone">Điện thoại</Option>
            <Option value="email">Email</Option>
          </Select>
          
          <Input
            placeholder={memberLookupType === 'phone' ? 'Nhập số điện thoại' : 'Nhập email'}
            value={memberLookupValue}
            onChange={(e) => setMemberLookupValue(e.target.value)}
            style={{ width: 250 }}
            suffix={lookupLoading ? <Spin size="small" /> : null}
          />
          
          <Button 
            type="primary"
            onClick={() => lookupMember(memberLookupValue, memberLookupType)}
            loading={lookupLoading}
          >
            Tìm kiếm
          </Button>
        </div>
      </div>
    );
  };

  // Render new user modal
  const renderNewUserModal = () => {
    return (
      <Modal
        title="Đăng ký thành viên mới"
        open={newUserModalVisible}
        onCancel={() => setNewUserModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={newUserForm}
          layout="vertical"
          onFinish={registerNewMember}
        >
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nhập họ tên" />
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
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>
          
          <div className="flex justify-end">
            <Button onClick={() => setNewUserModalVisible(false)} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Đăng ký
            </Button>
          </div>
        </Form>
      </Modal>
    );
  };

  // Render payment QR modal
  const renderPaymentQrModal = () => {
    return (
      <Modal
        title="Thanh toán qua QR"
        open={paymentQrVisible}
        onCancel={() => setPaymentQrVisible(false)}
        footer={[
          <Button key="completed" type="primary" onClick={completeBooking}>
            Đã thanh toán xong
          </Button>,
          <Button key="cancel" onClick={() => setPaymentQrVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        <div className="text-center">
          <p className="mb-4">Quét mã QR để thanh toán</p>
          {paymentData && (
            <>
              <div className="flex justify-center mb-4">
                <QRCode value={paymentData.qrCodeUrl} size={250} />
              </div>
              <p>Mã đơn hàng: <strong>{paymentData.orderCode}</strong></p>
              <p>Số tiền: <strong>{paymentData.amount.toLocaleString()} VND</strong></p>
              <Alert
                className="mt-4"
                type="info"
                message="Vui lòng không đóng cửa sổ này cho đến khi thanh toán hoàn tất."
              />
            </>
          )}
        </div>
      </Modal>
    );
  };

  // Render seat selection
  const renderSeatSelection = () => {
    if (!seats.length) {
      return (
        <div className="text-center p-8">
          <Spin size="large" />
          <div className="mt-4">Đang tải sơ đồ ghế...</div>
        </div>
      );
    }

    const rowsArray = [...new Set(seats.map(seat => seat.row_Name))].sort();
    const maxColumns = Math.max(...seats.map(seat => seat.seat_Number));

    return (
      <div className="screen-container mb-8">
        <Screen>
          <ScreenText>MÀN HÌNH</ScreenText>
        </Screen>
        
        <SeatingArea>
          {/* Column Headers (Top) */}
          <div /> {/* Empty cell for left row label column */}
          <ColumnHeader>
            {Array.from({ length: maxColumns }, (_, i) => (
              <ColumnLabel key={`top-${i}`}>
                {i + 1}
              </ColumnLabel>
            ))}
          </ColumnHeader>
          <div /> {/* Empty cell for right row label column */}

          {/* Seat Rows */}
          {rowsArray.map((row, rowIndex) => (
            <React.Fragment key={row}>
              <RowLabel>{row}</RowLabel>
              <SeatsSection>
                {seats
                  .filter(seat => seat.row_Name === row)
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <SeatNumber>{seat.seat_Number}</SeatNumber>
                        </SeatButton>
                        <SeatTooltip>
                          {`${row}${seat.seat_Number} - ${seat.price.toLocaleString()} VND - ${isBooked ? 'Đã đặt' : isSelected ? 'Đang chọn' : 'Còn trống'}`}
                        </SeatTooltip>
                      </SeatButtonWrapper>
                    );
                  })}
              </SeatsSection>
              <RowLabel>{row}</RowLabel>
            </React.Fragment>
          ))}

          {/* Column Headers (Bottom) */}
          <div /> {/* Empty cell for left row label column */}
          <ColumnFooter>
            {Array.from({ length: maxColumns }, (_, i) => (
              <ColumnLabel key={`bottom-${i}`}>
                {i + 1}
              </ColumnLabel>
            ))}
          </ColumnFooter>
          <div /> {/* Empty cell for right row label column */}
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
            <ColorBox color="#22c55e" />
            <span>Đang chọn</span>
          </LegendItem>
          <LegendItem>
            <ColorBox color="#9ca3af" />
            <span>Đã đặt</span>
          </LegendItem>
        </SeatLegend>
      </div>
    );
  };

  // Render promotion section
  const renderPromotionSection = () => {
    return (
      <div className="promotion-section mb-6">
        <Title level={5}>Mã khuyến mãi</Title>
        <div className="flex items-center">
          <Input
            placeholder="Nhập mã khuyến mãi"
            value={promotionCode}
            onChange={e => setPromotionCode(e.target.value)}
            disabled={!!appliedPromotion}
            className="mr-2"
          />
          {appliedPromotion ? (
            <Button 
              danger 
              icon={<CloseCircleOutlined />} 
              onClick={removePromotion}
            >
              Xóa
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<PercentageOutlined />} 
              onClick={applyPromotionCode}
              loading={loading}
            >
              Áp dụng
            </Button>
          )}
        </div>
        
        {/* Display list of active promotions */}
        {promotions.length > 0 && !appliedPromotion && (
          <PromotionList>
            {promotions.map(promo => (
              <Tooltip key={promo.promotion_ID} title={promo.promotion_Detail || 'Không có mô tả'}>
                <PromotionTag onClick={() => handlePromotionClick(promo.promotion_Code)}>
                  {promo.promotion_Code}
                </PromotionTag>
              </Tooltip>
            ))}
          </PromotionList>
        )}
        
        {appliedPromotion && (
          <Alert
            message={`Mã khuyến mãi: ${appliedPromotion.code}`}
            description={`Giảm ${appliedPromotion.discount_Amount.toLocaleString()} VND`}
            type="success"
            showIcon
            className="mt-3"
          />
        )}
      </div>
    );
  };

  // Render payment methods
  const renderPaymentMethods = () => {
    const paymentMethods = [
      { id: 'Cash', name: 'Tiền mặt', icon: <DollarOutlined /> },
      { id: 'Card', name: 'Thẻ ngân hàng', icon: <CreditCardOutlined /> },
      { id: 'E-Wallet', name: 'Ví điện tử (QR)', icon: <QrcodeOutlined /> }
    ];

    return (
      <div className="payment-methods mb-6">
        <Title level={5}>Phương thức thanh toán</Title>
        <Radio.Group value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <Space direction="vertical" className="w-full">
            {paymentMethods.map(method => (
              <Radio key={method.id} value={method.id} className="w-full py-2">
                <div className="flex items-center">
                  {method.icon}
                  <span className="ml-2">{method.name}</span>
                </div>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
        
        {paymentMethod === 'E-Wallet' && (
          <Alert
            className="mt-4"
            type="info"
            message="Khách hàng sẽ thanh toán bằng cách quét mã QR"
          />
        )}
        {paymentMethod === 'Card' && (
          <Alert
            className="mt-4"
            type="info"
            message="Khách hàng sẽ được chuyển đến trang thanh toán an toàn"
          />
        )}
      </div>
    );
  };

  // Render booking summary
  const renderBookingSummary = () => {
    return (
      <Card title="Chi tiết thanh toán" className="mb-6">
        <div className="price-breakdown">
          <div className="flex justify-between mb-2">
            <span>Tổng tiền vé:</span>
            <span>{bookingSummary.subtotal.toLocaleString()} VND</span>
          </div>
          
          {memberDiscountAmount > 0 && (
            <div className="flex justify-between mb-2 text-green-600">
              <span>Ưu đãi thành viên ({memberDiscountAmount}%):</span>
              <span>-{bookingSummary.memberDiscount.toLocaleString()} VND</span>
            </div>
          )}
          
          {appliedPromotion && (
            <div className="flex justify-between mb-2 text-green-600">
              <span>Khuyến mãi ({appliedPromotion.code}):</span>
              <span>-{bookingSummary.promotionDiscount.toLocaleString()} VND</span>
            </div>
          )}
          
          <Divider />
          
          <div className="flex justify-between font-bold text-lg">
            <span>Thành tiền:</span>
            <span>{bookingSummary.total.toLocaleString()} VND</span>
          </div>
        </div>
      </Card>
    );
  };

  // Create payment
  const createPayment = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const bookingData = {
        showtimeId: selectedShowtime?.showtime_ID,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerName: customer.name,
        seats: selectedSeats.map(seat => ({
          layoutId: seat.layout_ID,
          price: seat.price
        })),
        totalAmount: bookingSummary.total,
        memberDiscount: bookingSummary.memberDiscount,
        promotionDiscount: bookingSummary.promotionDiscount,
        promotionId: appliedPromotion?.promotion_ID,
        memberId: member?.user_ID
      };

      const response = await axios.post<PayosPaymentResponse>('https://localhost:7168/api/payos/create', bookingData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (response.data.success) {
        setPaymentData(response.data);
        
        if (paymentMethod === 'E-Wallet') {
          setPaymentQrVisible(true);
        } else if (paymentMethod === 'Card') {
          window.open(response.data.paymentUrl, '_blank');
          message.success('Đã mở trang thanh toán trong cửa sổ mới');
        } else {
          await completeBooking();
        }
      } else {
        message.error(response.data.message || 'Có lỗi xảy ra khi tạo thanh toán');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      message.error('Không thể tạo thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Complete booking
  const completeBooking = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const bookingData = {
        showtime_ID: selectedShowtime?.showtime_ID,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email
        },
        member_ID: member?.user_ID || null,
        seats: selectedSeats.map(seat => seat.seat_ID),
        promotion_ID: appliedPromotion?.promotion_ID || null,
        payment_Method: paymentMethod,
        total_Amount: bookingSummary.total,
        discount_Amount: bookingSummary.discounts,
        send_Confirmation: sendConfirmation
      };
      
      const response = await axios.post('https://localhost:7168/api/Booking', bookingData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      
      if (response.data) {
        message.success('Đặt vé thành công!');
        resetForm();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      message.error('Lỗi khi đặt vé');
    } finally {
      setLoading(false);
      setPaymentQrVisible(false);
    }
  };

  // Reset form after booking complete
  const resetForm = () => {
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSelectedDate(null);
    setMember(null);
    setAppliedPromotion(null);
    setPromotionCode('');
    setCustomer({ name: '', phone: '', email: '' });
    customerForm.resetFields();
    setPaymentMethod('Cash');
    setCurrentStep(0);
    setPaymentData(null);
  };

  // Render steps content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Chọn phim
        return (
          <div className="movie-selection">
            <div className="mb-4">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Tìm phim..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                className="mb-4"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {movies
                .filter(movie => movie.movie_Name.toLowerCase().includes(searchValue.toLowerCase()))
                .map(movie => (
                  <Card 
                    key={movie.movie_ID}
                    hoverable
                    className="movie-card"
                    cover={<img alt={movie.movie_Name} src={movie.poster_URL} style={{ height: 300, objectFit: 'cover' }} />}
                    onClick={() => handleMovieSelect(movie)}
                  >
                    <Card.Meta
                      title={movie.movie_Name}
                      description={
                        <>
                          <div>Xếp hạng: {movie.rating}</div>
                          <div>Thời lượng: {movie.duration} phút</div>
                        </>
                      }
                    />
                  </Card>
                ))}
            </div>
          </div>
        );
        
      case 1: // Chọn suất chiếu
        return (
          <div className="showtime-selection">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Title level={4}>Chọn suất chiếu: {selectedMovie?.movie_Name}</Title>
                <Button onClick={() => setCurrentStep(0)}>Đổi phim</Button>
              </div>
              
              <div className="date-selector flex flex-wrap items-center gap-2 mb-4">
                {availableDates.map(date => (
                  <Button
                    key={date}
                    type={selectedDate && selectedDate.format('YYYY-MM-DD') === date ? 'primary' : 'default'}
                    onClick={() => handleDateSelect(moment(date))}
                  >
                    {moment(date).format('DD/MM (ddd)')}
                  </Button>
                ))}
              </div>
            </div>
            
            {showtimes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {showtimes.map(showtime => (
                  <Card 
                    key={showtime.showtime_ID}
                    hoverable
                    className="showtime-card"
                    onClick={() => handleShowtimeSelect(showtime)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg font-bold">{formatTime(showtime.start_Time)}</div>
                        <div>Phòng: {showtime.room_Name}</div>
                        <div>Giá: {showtime.base_Price.toLocaleString()} VND</div>
                      </div>
                      <Tag color={showtime.status === 'Available' ? 'green' : 'red'}>
                        {showtime.status === 'Available' ? 'Còn chỗ' : 'Hết chỗ'}
                      </Tag>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <Title level={5}>Không có suất chiếu cho ngày này</Title>
                <Text type="secondary">Vui lòng chọn ngày khác hoặc đổi phim</Text>
              </div>
            )}
          </div>
        );
        
      case 2: // Chọn ghế
        return (
          <div className="seat-selection">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Title level={4}>Chọn ghế</Title>
                <Button onClick={() => setCurrentStep(1)}>Đổi suất chiếu</Button>
              </div>
              
              <div className="showtime-info mb-4 p-4 bg-gray-50 rounded-lg">
                <Row gutter={16}>
                  <Col span={8}>
                    <Text strong>Phim:</Text> {selectedMovie?.movie_Name}
                  </Col>
                  <Col span={8}>
                    <Text strong>Ngày:</Text> {formatDate(selectedShowtime?.show_Date || '')}
                  </Col>
                  <Col span={8}>
                    <Text strong>Giờ:</Text> {formatTime(selectedShowtime?.start_Time || '')}
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Text strong>Phòng:</Text> {selectedShowtime?.room_Name}
                  </Col>
                  <Col span={8}>
                    <Text strong>Giá cơ bản:</Text> {selectedShowtime?.base_Price.toLocaleString()} VND
                  </Col>
                </Row>
              </div>
            </div>
            
            <Row gutter={24}>
              <Col span={16}>
                {renderSeatSelection()}
              </Col>
              
              <Col span={8}>
                <Card title="Ghế đã chọn" className="mb-4">
                  {selectedSeats.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Chưa có ghế nào được chọn
                    </div>
                  ) : (
                    <div>
                      <div className="max-h-60 overflow-auto mb-4">
                        {selectedSeats.map(seat => (
                          <div key={seat.seat_ID} className="flex justify-between items-center mb-2 p-2 bg-gray-50 rounded">
                            <span>Ghế {seat.row_Name}{seat.seat_Number}</span>
                            <div className="flex items-center">
                              <span className="mr-2">{seat.price.toLocaleString()} VND</span>
                              <Button 
                                size="small" 
                                danger 
                                icon={<CloseCircleOutlined />} 
                                onClick={() => handleSeatSelect(seat)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Divider />
                      
                      <div className="flex justify-between mb-2">
                        <span>Số ghế:</span>
                        <span>{selectedSeats.length}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Tổng tiền:</span>
                        <span>{bookingSummary.subtotal.toLocaleString()} VND</span>
                      </div>
                    </div>
                  )}
                </Card>
                
                <Button 
                  type="primary" 
                  block 
                  size="large"
                  disabled={selectedSeats.length === 0}
                  onClick={() => setCurrentStep(3)}
                >
                  Tiếp tục
                </Button>
              </Col>
            </Row>
          </div>
        );
        
      case 3: // Thông tin khách hàng
        return (
          <div className="customer-info">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Title level={4}>Thông tin khách hàng</Title>
                <Button onClick={() => setCurrentStep(2)}>Quay lại chọn ghế</Button>
              </div>
            </div>
            
            <Row gutter={24}>
              <Col span={16}>
                {renderMemberLookup()}
                
                <Divider />
                
                <div className="mb-6">
                  <Title level={5}>Thông tin đặt vé</Title>
                  
                  {/* Display member information as read-only */}
                  {member && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg mb-4">
                      <div className="flex items-center">
                        <Avatar size={64} icon={<UserOutlined />} className="mr-4" />
                        <div>
                          <Typography.Text strong className="text-lg">{member.full_Name}</Typography.Text><br />
                          <Typography.Text>Mã thành viên: {member.user_ID}</Typography.Text><br />
                          <Typography.Text>SĐT: {member.phone_Number}</Typography.Text><br />
                          <Typography.Text>Email: {member.email}</Typography.Text><br />
                          <Typography.Text>Hạng thành viên: {member.membershipStatus}</Typography.Text><br />
                          <Typography.Text>Điểm hiện tại: {member.currentPoints} điểm</Typography.Text><br />
                          <Typography.Text>Trạng thái VIP: {member.isVip ? 'Có' : 'Không'}</Typography.Text>
                        </div>
                      </div>
                      {memberDiscountAmount > 0 && (
                        <Alert 
                          message={`Ưu đãi thành viên: Giảm ${memberDiscountAmount}% tổng hóa đơn`}
                          type="success" 
                          showIcon 
                          className="mt-3"
                        />
                      )}
                    </div>
                  )}
                  
                  <Form
                    form={customerForm}
                    layout="vertical"
                    initialValues={customer}
                    onFinish={(values) => {
                      setCustomer(values);
                      setCurrentStep(4);
                    }}
                  >
                    
                    <Form.Item
                      name="name"
                      label="Họ tên"
                      rules={[{message: 'Vui lòng nhập tên khách hàng' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="Nhập tên khách hàng" />
                    </Form.Item>
                    
                    <Form.Item
                      name="phone"
                      label="Số điện thoại"
                      rules={[{  message: 'Vui lòng nhập số điện thoại khách hàng' }]}
                    >
                      <Input placeholder="Nhập số điện thoại khách hàng" />
                    </Form.Item>
                    
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { type: 'email', message: 'Vui lòng nhập đúng định dạng email' }
                      ]}
                    >
                      <Input placeholder="Nhập email khách hàng (không bắt buộc)" />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        Tiếp tục thanh toán
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              </Col>
              
              <Col span={8}>
                {renderBookingSummary()}
                
                <Card title="Thông tin đặt vé" className="mb-4">
                  <div className="mb-2">
                    <Text strong>Phim:</Text> {selectedMovie?.movie_Name}
                  </div>
                  <div className="mb-2">
                    <Text strong>Suất chiếu:</Text> {formatDate(selectedShowtime?.show_Date || '')} {formatTime(selectedShowtime?.start_Time || '')}
                  </div>
                  <div className="mb-2">
                    <Text strong>Phòng:</Text> {selectedShowtime?.room_Name}
                  </div>
                  <div className="mb-2">
                    <Text strong>Ghế:</Text> {selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}
                  </div>
                </Card>
              </Col>
            </Row>
            
            {renderNewUserModal()}
          </div>
        );
        
      case 4: // Thanh toán
        return (
          <div className="payment">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <Title level={4}>Thanh toán</Title>
                <Button onClick={() => setCurrentStep(3)}>Quay lại</Button>
              </div>
            </div>
            
            <Row gutter={24}>
              <Col span={16}>
                <Card className="mb-6">
                  <div className="booking-summary mb-4">
                    <Title level={5}>Thông tin đơn hàng</Title>
                    <Divider />
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text strong>Phim:</Text> {selectedMovie?.movie_Name}
                      </Col>
                      <Col span={12}>
                        <Text strong>Suất chiếu:</Text> {formatDate(selectedShowtime?.show_Date || '')} {formatTime(selectedShowtime?.start_Time || '')}
                      </Col>
                      <Col span={12}>
                        <Text strong>Phòng:</Text> {selectedShowtime?.room_Name}
                      </Col>
                      <Col span={12}>
                        <Text strong>Ghế:</Text> {selectedSeats.map(seat => `${seat.row_Name}${seat.seat_Number}`).join(', ')}
                      </Col>
                      <Col span={24}>
                        <Text strong>Khách hàng:</Text> {customer.name} - {customer.phone} {customer.email ? `- ${customer.email}` : ''}
                      </Col>
                    </Row>
                  </div>
                </Card>
                
                <Card className="mb-6">
                  {renderPromotionSection()}
                </Card>
                
                <Card className="mb-6">
                  {renderPaymentMethods()}
                </Card>
                
                <div className="confirmation-options mb-6">
                  <Checkbox checked={sendConfirmation} onChange={e => setSendConfirmation(e.target.checked)}>
                    Gửi xác nhận đặt vé qua email cho khách hàng
                  </Checkbox>
                </div>
                
                <div className="actions">
                  <Button 
                    type="primary" 
                    size="large" 
                    onClick={createPayment} 
                    loading={loading}
                  >
                    {paymentMethod === 'Cash' ? 'Hoàn tất đặt vé' : 'Tiến hành thanh toán'}
                  </Button>
                </div>
              </Col>
              
              <Col span={8}>
                {renderBookingSummary()}
                
                {member && (
                  <Card title="Thông tin thành viên" className="mb-4">
                    <div className="flex items-center mb-4">
                      <Avatar size={40} icon={<UserOutlined />} className="mr-2" />
                      <div>
                        <div className="font-medium">{member.full_Name}</div>
                        <div>
                          <Tag color="gold">{member.membershipStatus}</Tag>
                        </div>
                      </div>
                    </div>
                    
                    {memberDiscountAmount > 0 && (
                      <Alert 
                        message={`Ưu đãi: Giảm ${memberDiscountAmount}%`}
                        type="success" 
                        showIcon 
                      />
                    )}
                  </Card>
                )}
                
                {appliedPromotion && (
                  <Card title="Khuyến mãi đã áp dụng" className="mb-4">
                    <Alert
                      message={appliedPromotion.name}
                      description={`Mã: ${appliedPromotion.code} - Giảm ${appliedPromotion.discount_Amount.toLocaleString()} VND`}
                      type="success"
                      showIcon
                    />
                  </Card>
                )}
              </Col>
            </Row>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="ticket-selling-container p-6">
        <div className="header mb-6">
          <Title level={2}>Hệ thống bán vé</Title>
          <Text type="secondary">Bán vé trực tiếp cho khách hàng tại quầy</Text>
        </div>
        
        <div className="booking-process">
          <Steps current={currentStep} className="mb-8">
            <Step title="Chọn phim" icon={<CalendarOutlined />} />
            <Step title="Chọn suất chiếu" />
            <Step title="Chọn ghế" />
            <Step title="Thông tin khách hàng" icon={<UserOutlined />} />
            <Step title="Thanh toán" icon={<CreditCardOutlined />} />
          </Steps>
          
          {loading && currentStep === 0 ? (
            <div className="loading-container text-center p-12">
              <Spin size="large" />
              <div className="mt-4">Đang tải danh sách phim...</div>
            </div>
          ) : error ? (
            <div className="error-container text-center p-12">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={fetchNowShowingMovies}>Thử lại</Button>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>
        {renderPaymentQrModal()}
      </div>
    </div>
  );
};

export default ManageBookings;
