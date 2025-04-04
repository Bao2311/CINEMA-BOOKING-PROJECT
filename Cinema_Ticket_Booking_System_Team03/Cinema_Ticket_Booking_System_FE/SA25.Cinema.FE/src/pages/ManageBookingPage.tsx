import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Tag, Button, message, Modal, Tooltip, Select, DatePicker, Form, Row, Col, Divider, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, DeleteOutlined, SearchOutlined, ExportOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from "react-router-dom";
const { Option } = Select;
const { RangePicker } = DatePicker;
const { CheckableTag } = Tag;

interface Movie {
  movie_ID: number;
  movie_Name: string;
}

interface Room {
  cinema_Room_ID: number;
  room_Name: string;
}

interface Showtime {
  showtime_ID: number;
  show_Date: string;
  start_Time: string;
  movie: Movie;
  room: Room;
}

interface Booking {
  booking_ID: number;
  booking_Date: string;
  status: string;
  total_Amount: number;
  showtime: Showtime;
}

const API_BASE_URL = 'https://localhost:7168';

const ManageBooking: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<number[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<any>(null);
  const [bookingIdFilter, setBookingIdFilter] = useState<string>('');
  const { token } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  // Debug useEffect to monitor filter visibility changes
  useEffect(() => {
    console.log("Filter visibility changed:", isFilterVisible);
  }, [isFilterVisible]);

  // Status options for filter tags
  const statusOptions = [
    { value: 'Pending', color: 'gold' },
    { value: 'Confirmed', color: 'green' },
    { value: 'Cancelled', color: 'red' },
    { value: 'Completed', color: 'blue' },
    { value: 'Unused', color: 'purple' },
    { value: 'Used', color: 'cyan' },
    { value: 'Refunded', color: 'volcano' }
  ];

  // Payment method options for filter tags
  const paymentMethodOptions = [
    { value: 'Cash', color: 'default' },
    { value: 'Card', color: 'blue' },
    { value: 'E-Wallet', color: 'orange' }
  ];
// Lấy role từ localStorage
const getRole = () => {
  return localStorage.getItem("role") || sessionStorage.getItem("role");
};

// Kiểm tra quyền truy cập
useEffect(() => {
  const role = getRole();
  if (role !== "Admin") {
    toast.error("Bạn không có quyền truy cập trang này.");
    navigate("/"); // Điều hướng sang trang unauthorized
  }
}, [navigate]);
  useEffect(() => {
    fetchMyBookings();
    fetchMovies();
    fetchRooms();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      console.log("Fetching bookings with token:", token ? "Token exists" : "No token");
      const response = await axios.get(`${API_BASE_URL}/api/Booking`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Bookings API response:", response.data);
      if (response.data.$values) {
        setBookings(response.data.$values);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/Movie`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Movies API response:", response.data);
      if (response.data.$values) {
        setMovies(response.data.$values);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/CinemaRoom`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Rooms API response:", response.data);
      if (response.data.$values) {
        setRooms(response.data.$values);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchBookingDetails = async (bookingId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/Booking/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Booking details API response:", response.data);
      setBookingDetails(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      message.error('Failed to fetch booking details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (booking: Booking) => {
    console.log("Viewing details for booking:", booking.booking_ID);
    setSelectedBooking(booking);
    await fetchBookingDetails(booking.booking_ID);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedBooking(null);
    setBookingDetails(null);
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      console.log("Cancelling booking:", bookingId);
      await axios.put(`${API_BASE_URL}/api/Booking/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('Booking cancelled successfully');
      fetchMyBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      message.error('Failed to cancel booking');
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Pending: 'gold',
      Confirmed: 'green',
      Cancelled: 'red',
      Completed: 'blue',
      Unused: 'purple',
      Used: 'cyan',
      Refunded: 'volcano'
    };
    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      // Add selected filters to params
      if (bookingIdFilter) params.bookingCode = bookingIdFilter;
      if (selectedMovies.length > 0) params.movieIds = selectedMovies.join(',');
      if (selectedRooms.length > 0) params.roomIds = selectedRooms.join(',');
      if (selectedStatuses.length > 0) params.statuses = selectedStatuses.join(',');
      if (selectedPaymentMethods.length > 0) params.paymentMethods = selectedPaymentMethods.join(',');
      
      // Format date range if provided
      if (dateRange && dateRange.length === 2) {
        params.fromDate = dateRange[0].format('YYYY-MM-DD');
        params.toDate = dateRange[1].format('YYYY-MM-DD');
      }

      console.log("Searching with params:", params);
      const response = await axios.get(`${API_BASE_URL}/api/Booking/search`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("Search API response:", response.data);
      if (response.data.$values) {
        setBookings(response.data.$values);
      }
      
      // Close filter panel after search
      setIsFilterVisible(false);
    } catch (error) {
      console.error('Error searching bookings:', error);
      message.error('Failed to search bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    console.log("Clearing filters");
    setSelectedMovies([]);
    setSelectedRooms([]);
    setSelectedStatuses([]);
    setSelectedPaymentMethods([]);
    setDateRange(null);
    setBookingIdFilter('');
    fetchMyBookings();
    setIsFilterVisible(false);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (format === 'excel' || format === 'csv') {
      if (bookings.length === 0) {
        message.warning('No data to export');
        return;
      }

      console.log(`Exporting as ${format}`);
      if (format === 'excel') {
        handleExportExcel();
      }
      // For CSV, we're using the CSVLink component which handles the export
    } else {
      try {
        setLoading(true);
        // Get export criteria from filter selections
        const params: any = {};
        
        if (selectedMovies.length > 0) params.movieIds = selectedMovies.join(',');
        if (selectedRooms.length > 0) params.roomIds = selectedRooms.join(',');
        if (selectedStatuses.length > 0) params.statuses = selectedStatuses.join(',');
        if (selectedPaymentMethods.length > 0) params.paymentMethods = selectedPaymentMethods.join(',');
        
        if (dateRange && dateRange.length === 2) {
          params.fromDate = dateRange[0].format('YYYY-MM-DD');
          params.toDate = dateRange[1].format('YYYY-MM-DD');
        }
        params.format = format;
        
        console.log(`Exporting with params:`, params);
        const response = await axios.get(`${API_BASE_URL}/api/Booking/export`, {
          params,
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bookings-${moment().format('DD-MM-YYYY')}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error(`Error exporting bookings as ${format}:`, error);
        message.error(`Failed to export bookings as ${format}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCSV = () => {
    console.log("Preparing CSV data");
    const csvData = bookings.map(booking => ({
      booking_ID: booking.booking_ID,
      movie_Name: booking.showtime.movie.movie_Name,
      show_Date: moment(booking.showtime.show_Date).format('DD/MM/YYYY'),
      start_Time: moment(booking.showtime.start_Time, 'HH:mm:ss').format('HH:mm'),
      room_Name: booking.showtime.room.room_Name,
      total_Amount: booking.total_Amount,
      status: booking.status,
      booking_Date: moment(booking.booking_Date).format('DD/MM/YYYY HH:mm')
    }));

    return csvData;
  };

  const handleExportExcel = () => {
    console.log("Exporting to Excel");
    const worksheet = XLSX.utils.json_to_sheet(handleExportCSV());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    XLSX.writeFile(workbook, `bookings-${moment().format('DD-MM-YYYY')}.xlsx`);
  };

  // Handler for movie selection
  const handleMovieChange = (movieId: number, checked: boolean) => {
    setSelectedMovies(prevSelected => {
      if (checked) {
        return [...prevSelected, movieId];
      } else {
        return prevSelected.filter(id => id !== movieId);
      }
    });
  };

  // Handler for room selection
  const handleRoomChange = (roomId: number, checked: boolean) => {
    setSelectedRooms(prevSelected => {
      if (checked) {
        return [...prevSelected, roomId];
      } else {
        return prevSelected.filter(id => id !== roomId);
      }
    });
  };

  // Handler for status selection
  const handleStatusChange = (status: string, checked: boolean) => {
    setSelectedStatuses(prevSelected => {
      if (checked) {
        return [...prevSelected, status];
      } else {
        return prevSelected.filter(s => s !== status);
      }
    });
  };

  // Handler for payment method selection
  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    setSelectedPaymentMethods(prevSelected => {
      if (checked) {
        return [...prevSelected, method];
      } else {
        return prevSelected.filter(m => m !== method);
      }
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (bookingIdFilter) count++;
    if (selectedMovies.length > 0) count++;
    if (selectedRooms.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedPaymentMethods.length > 0) count++;
    if (dateRange) count++;
    return count;
  };

  const columns: ColumnsType<Booking> = [
    {
      title: 'Booking ID',
      dataIndex: 'booking_ID',
      key: 'booking_ID',
    },
    {
      title: 'Movie',
      dataIndex: ['showtime', 'movie', 'movie_Name'],
      key: 'movieName',
    },
    {
      title: 'Show Date',
      dataIndex: ['showtime', 'show_Date'],
      key: 'showDate',
      render: (date: string) => moment(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Show Time',
      dataIndex: ['showtime', 'start_Time'],
      key: 'showTime',
      render: (time: string) => moment(time, 'HH:mm:ss').format('HH:mm'),
    },
    {
      title: 'Room',
      dataIndex: ['showtime', 'room', 'room_Name'],
      key: 'roomName',
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_Amount',
      key: 'totalAmount',
      render: (amount: number) => `${amount.toLocaleString()} VND`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          {record.status === 'Pending' && (
            <Tooltip title="Cancel Booking">
              <Button 
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelBooking(record.booking_ID)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Manage Booking" bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Button 
            icon={<FilterOutlined />} 
            onClick={() => {
              console.log("Filter button clicked, current state:", isFilterVisible);
              setIsFilterVisible(!isFilterVisible);
            }}
            type={isFilterVisible ? 'primary' : 'default'}
          >
            Filters {activeFiltersCount > 0 && <Tag color="blue">{activeFiltersCount}</Tag>}
          </Button>
          
          <Space>
            <Button icon={<ExportOutlined />} onClick={() => handleExport('excel')}>
              Export Excel
            </Button>
            <CSVLink 
              data={handleExportCSV()} 
              filename={`bookings-${moment().format('DD-MM-YYYY')}.csv`}
              className="ant-btn"
            >
              <ExportOutlined /> Export CSV
            </CSVLink>
          </Space>
        </div>
        
        {/* Add a debug message to confirm if condition is being evaluated */}
        <div style={{ marginBottom: '10px' }}>
          {console.log("Rendering filter panel, isFilterVisible =", isFilterVisible)}
          {isFilterVisible ? "Filter panel should be visible" : "Filter panel is hidden"}
        </div>
        
        {isFilterVisible && (
          <Card style={{ marginBottom: '16px', backgroundColor: 'rgba(240, 240, 240, 0.5)' }}>
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Booking ID:</strong>
                  </div>
                  <Input 
                    placeholder="Enter Booking ID" 
                    value={bookingIdFilter} 
                    onChange={(e) => setBookingIdFilter(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={16}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Date Range:</strong>
                  </div>
                  <RangePicker 
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates)}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>
            </div>
            
            <Divider orientation="left">Movies</Divider>
            <div style={{ marginBottom: '16px' }}>
              {movies.map(movie => (
                <CheckableTag
                  key={movie.movie_ID}
                  checked={selectedMovies.includes(movie.movie_ID)}
                  onChange={(checked) => handleMovieChange(movie.movie_ID, checked)}
                  style={{ marginBottom: '8px', fontSize: '14px' }}
                >
                  {movie.movie_Name}
                </CheckableTag>
              ))}
            </div>
            
            <Divider orientation="left">Rooms</Divider>
            <div style={{ marginBottom: '16px' }}>
              {rooms.map(room => (
                <CheckableTag
                  key={room.cinema_Room_ID}
                  checked={selectedRooms.includes(room.cinema_Room_ID)}
                  onChange={(checked) => handleRoomChange(room.cinema_Room_ID, checked)}
                  style={{ marginBottom: '8px', fontSize: '14px' }}
                >
                  {room.room_Name}
                </CheckableTag>
              ))}
            </div>
            
            <Divider orientation="left">Status</Divider>
            <div style={{ marginBottom: '16px' }}>
              {statusOptions.map(status => (
                <CheckableTag
                  key={status.value}
                  checked={selectedStatuses.includes(status.value)}
                  onChange={(checked) => handleStatusChange(status.value, checked)}
                  style={{ marginBottom: '8px', fontSize: '14px' }}
                >
                  <Tag color={status.color} style={{ marginRight: 0 }}>{status.value}</Tag>
                </CheckableTag>
              ))}
            </div>
            
            <Divider orientation="left">Payment Method</Divider>
            <div style={{ marginBottom: '16px' }}>
              {paymentMethodOptions.map(method => (
                <CheckableTag
                  key={method.value}
                  checked={selectedPaymentMethods.includes(method.value)}
                  onChange={(checked) => handlePaymentMethodChange(method.value, checked)}
                  style={{ marginBottom: '8px', fontSize: '14px' }}
                >
                  <Tag color={method.color} style={{ marginRight: 0 }}>{method.value}</Tag>
                </CheckableTag>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Space>
                <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  Apply Filters
                </Button>
              </Space>
            </div>
          </Card>
        )}
        
        {/* Display active filters */}
        {activeFiltersCount > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Space wrap>
              {bookingIdFilter && (
                <Tag closable onClose={() => setBookingIdFilter('')}>
                  ID: {bookingIdFilter}
                </Tag>
              )}
              
              {selectedMovies.length > 0 && (
                <Tag closable onClose={() => setSelectedMovies([])}>
                  Movies: {selectedMovies.length}
                </Tag>
              )}
              
              {selectedRooms.length > 0 && (
                <Tag closable onClose={() => setSelectedRooms([])}>
                  Rooms: {selectedRooms.length}
                </Tag>
              )}
              
              {selectedStatuses.map(status => (
                <Tag 
                  key={status} 
                  color={statusOptions.find(s => s.value === status)?.color}
                  closable 
                  onClose={() => handleStatusChange(status, false)}
                >
                  {status}
                </Tag>
              ))}
              
              {selectedPaymentMethods.map(method => (
                <Tag 
                  key={method}
                  closable 
                  onClose={() => handlePaymentMethodChange(method, false)}
                >
                  Payment: {method}
                </Tag>
              ))}
              
              {dateRange && (
                <Tag closable onClose={() => setDateRange(null)}>
                  Date: {dateRange[0].format('DD/MM/YYYY')} - {dateRange[1].format('DD/MM/YYYY')}
                </Tag>
              )}
              
              {activeFiltersCount > 1 && (
                <Button size="small" onClick={handleClearFilters}>
                  Clear All
                </Button>
              )}
            </Space>
          </div>
        )}
        
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="booking_ID"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Booking Details"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedBooking && (
          <div>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <p><strong>Booking ID:</strong> {selectedBooking.booking_ID}</p>
              </Col>
              <Col span={12}>
                <p><strong>Status:</strong> {getStatusTag(selectedBooking.status)}</p>
              </Col>
              <Col span={24}>
                <p><strong>Movie:</strong> {selectedBooking.showtime.movie.movie_Name}</p>
              </Col>
              <Col span={12}>
                <p><strong>Show Date:</strong> {moment(selectedBooking.showtime.show_Date).format('DD/MM/YYYY')}</p>
              </Col>
              <Col span={12}>
                <p><strong>Show Time:</strong> {moment(selectedBooking.showtime.start_Time, 'HH:mm:ss').format('HH:mm')}</p>
              </Col>
              <Col span={12}>
                <p><strong>Room:</strong> {selectedBooking.showtime.room.room_Name}</p>
              </Col>
              <Col span={12}>
                <p><strong>Total Amount:</strong> {selectedBooking.total_Amount.toLocaleString()} VND</p>
              </Col>
              <Col span={24}>
                <p><strong>Booking Date:</strong> {moment(selectedBooking.booking_Date).format('DD/MM/YYYY HH:mm')}</p>
              </Col>
            </Row>
            
            <Divider />
            
            {/* Display additional details fetched from the API if available */}
            {bookingDetails && (
              <div>
                {bookingDetails.customer && (
                  <Row gutter={[16, 8]}>
                    <Col span={24}>
                      <h4>Customer Information</h4>
                    </Col>
                    <Col span={24}>
                      <p><strong>Name:</strong> {bookingDetails.customer.name}</p>
                    </Col>
                    <Col span={12}>
                      <p><strong>Email:</strong> {bookingDetails.customer.email}</p>
                    </Col>
                    <Col span={12}>
                      <p><strong>Phone:</strong> {bookingDetails.customer.phone}</p>
                    </Col>
                  </Row>
                )}
                
                <Divider />
                
                {bookingDetails.tickets && bookingDetails.tickets.$values && (
                  <div>
                    <h4>Tickets</h4>
                    <Table 
                      dataSource={bookingDetails.tickets.$values}
                      rowKey="ticket_ID"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Seat',
                          dataIndex: 'seat',
                          key: 'seat',
                          render: (seat) => seat ? `${seat.row}${seat.number}` : 'N/A'
                        },
                        {
                          title: 'Type',
                          dataIndex: ['ticket_Type', 'type_Name'],
                          key: 'ticketType'
                        },
                        {
                          title: 'Price',
                          dataIndex: 'price',
                          key: 'price',
                          render: (price) => `${price.toLocaleString()} VND`
                        }
                      ]}
                    />
                  </div>
                )}
                
                {bookingDetails.payment && (
                  <div style={{ marginTop: '16px' }}>
                    <Divider />
                    <h4>Payment Information</h4>
                    <p><strong>Method:</strong> {bookingDetails.payment.payment_Method}</p>
                    {bookingDetails.payment.transaction_ID && (
                      <p><strong>Transaction ID:</strong> {bookingDetails.payment.transaction_ID}</p>
                    )}
                    <p><strong>Payment Status:</strong> <Tag color={bookingDetails.payment.is_Paid ? 'green' : 'red'}>
                      {bookingDetails.payment.is_Paid ? 'Paid' : 'Unpaid'}
                    </Tag></p>
                    {bookingDetails.payment.payment_Date && (
                      <p><strong>Payment Date:</strong> {moment(bookingDetails.payment.payment_Date).format('DD/MM/YYYY HH:mm')}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageBooking;