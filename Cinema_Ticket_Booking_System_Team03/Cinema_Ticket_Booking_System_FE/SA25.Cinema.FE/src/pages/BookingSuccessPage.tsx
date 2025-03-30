import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Result, Button, Card, Descriptions, Typography, Divider, Space, Tag } from 'antd';
import {
  CheckCircleOutlined,
  PrinterOutlined,
  HomeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DollarOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;

interface BookingSuccessProps {
  bookingId?: number;
  movieName?: string;
  showtime?: string;
  seats?: string;
  total?: number;
  paymentMethod?: string;
}

const StyledCard = styled(Card)`
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const TicketContainer = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  padding: 24px;
  margin-top: 24px;
  border: 1px dashed #d9d9d9;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transform: translateX(-50%);
    border: 1px dashed #d9d9d9;
    z-index: 1;
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transform: translateX(-50%);
    border: 1px dashed #d9d9d9;
    z-index: 1;
  }
`;

const BookingSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BookingSuccessProps;

  // Nếu không có dữ liệu đặt vé, chuyển hướng về trang chủ
  useEffect(() => {
    if (!state || !state.bookingId) {
      navigate('/');
    }
  }, [state, navigate]);

  // Nếu không có dữ liệu, hiển thị thông báo
  if (!state || !state.bookingId) {
    return (
      <Result
        status="warning"
        title="Không tìm thấy thông tin đặt vé"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        }
      />
    );
  }

  // Tạo mã QR giả định
  const qrValue = `BOOKING-${state.bookingId}-${new Date().getTime()}`;

  // Hàm in vé
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Result
        status="success"
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="Đặt vé thành công!"
        subTitle={`Mã đặt vé của bạn là: #${state.bookingId}`}
        extra={[
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            key="print"
          >
            In vé
          </Button>,
          <Button 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/')}
            key="home"
          >
            Về trang chủ
          </Button>,
        ]}
      />

      <StyledCard>
        <Title level={4} className="text-center mb-6">Chi tiết đặt vé</Title>
        
        <TicketContainer>
          <div className="flex justify-between items-center mb-4">
            <div>
              <Title level={3} style={{ margin: 0 }}>{state.movieName}</Title>
              <Text type="secondary">Mã đặt vé: #{state.bookingId}</Text>
            </div>
            <div className="text-right">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrValue}`}
                alt="QR Code" 
                width={80} 
                height={80}
              />
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />
          
          <Descriptions column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item 
              label={<><CalendarOutlined /> Suất chiếu</>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {state.showtime}
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={<><EnvironmentOutlined /> Phòng chiếu</>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {/* Phòng chiếu có thể được trích xuất từ showtime nếu có */}
              Cinema {state.showtime?.split(' ')[0]}
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={<><TeamOutlined /> Ghế</>}
              labelStyle={{ fontWeight: 'bold' }}
              span={2}
            >
              <Space wrap>
                {state.seats?.split(', ').map((seat, index) => (
                  <Tag color="blue" key={index}>{seat}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={<><DollarOutlined /> Tổng tiền</>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              <Text strong>{state.total?.toLocaleString()} VND</Text>
            </Descriptions.Item>
            
            <Descriptions.Item 
              label={<><CreditCardOutlined /> Phương thức thanh toán</>}
              labelStyle={{ fontWeight: 'bold' }}
            >
              {state.paymentMethod}
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-6 text-center">
            <Paragraph type="secondary">
              Vui lòng đến trước giờ chiếu 15 phút để nhận vé và vào rạp.
              <br />
              Vé đã mua không thể đổi hoặc hoàn tiền.
            </Paragraph>
          </div>
        </TicketContainer>
        
        <div className="mt-6">
          <Paragraph>
            <Text strong>Lưu ý:</Text>
            <ul>
              <li>Vui lòng xuất trình mã QR khi đến rạp để nhận vé.</li>
              <li>Mỗi vé chỉ có giá trị sử dụng một lần.</li>
              <li>Không sử dụng thiết bị ghi hình trong rạp chiếu phim.</li>
              <li>Giữ im lặng và tắt điện thoại khi xem phim.</li>
            </ul>
          </Paragraph>
        </div>
      </StyledCard>
    </div>
  );
};

export default BookingSuccessPage;
