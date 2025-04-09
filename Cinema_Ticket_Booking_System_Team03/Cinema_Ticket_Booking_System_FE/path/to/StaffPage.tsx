import React, { useState, useRef } from 'react';
import axios from 'axios';
import { message, Form, Input, Button, Select, Modal } from 'antd';
import './StaffPage.css';

const { Option } = Select;

const StaffPage: React.FC = () => {
  const [member, setMember] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const searchFormRef = useRef(null);
  const [bookingSummary, setBookingSummary] = useState({
    pointsDiscount: 0,
    total: 0,
    subtotal: 0
  });

  const [form] = Form.useForm();

  const getAuthToken = () => {
    // Implement your logic to get the authentication token
    return 'your-auth-token';
  };

  const updateBookingSummary = () => {
    // Implement your logic to update the booking summary
  };

  const handleRegisterStaff = async (values: any) => {
    try {
      setLoading(true);
      const response = await axios.post('https://localhost:7168/api/User/staff-register', values, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        message.success('Đăng ký thành viên thành công!');
        setIsModalVisible(false);
        form.resetFields();
        
        // Automatically search for the newly registered member
        if (searchFormRef.current) {
          searchFormRef.current.setFieldsValue({
            phoneNumber: values.phoneNumber
          });
          handleSearchMember(values.phoneNumber);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMember = async (phoneNumber: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://localhost:7168/api/Member/search/${phoneNumber}`);
      if (response.data) {
        setMember(response.data);
        message.success('Tìm thấy thành viên!');
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Không tìm thấy thành viên.');
    } finally {
      setLoading(false);
    }
  };

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
      
      const response = await axios.post(`https://localhost:7168/api/Points/booking/${bookingId}/apply-discount`, 
        { pointsToUse },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log('Points discount response:', response.data);
      
      if (response.data) {
        const pointDiscountAmount = response.data.pointDiscountAmount || response.data.discountFromPoints || 0;
        message.success(`Đã sử dụng ${pointsToUse} điểm để giảm giá ${pointDiscountAmount.toLocaleString()} VND`);
        
        if (response.data.currentPoints !== undefined) {
          setMember(prev => prev ? {...prev, currentPoints: response.data.currentPoints} : prev);
        }
        
        setBookingSummary(prev => ({
          ...prev,
          pointsDiscount: pointDiscountAmount,
          total: response.data.discountedTotalAmount || (prev.subtotal - pointDiscountAmount)
        }));
        
        updateBookingSummary();
      }
    } catch (error) {
      console.error('Error applying points discount:', error);
      message.error('Không thể sử dụng điểm tích lũy. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-page">
      <div className="staff-page-header">
        <Button type="primary" onClick={() => setIsModalVisible(true)} size="large">
          Đăng Ký Thành Viên Mới
        </Button>
      </div>

      <Modal
        title="Đăng Ký Thành Viên Mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegisterStaff}
          className="register-form"
        >
          <Form.Item
            name="fullName"
            label="Họ và Tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phoneNumber"
            label="Số Điện Thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="sex"
            label="Giới Tính"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
          >
            <Select>
              <Option value="Male">Nam</Option>
              <Option value="Female">Nữ</Option>
              <Option value="Other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Đăng Ký
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <div className="search-member-section">
        <Form ref={searchFormRef}>
          <Form.Item
            name="phoneNumber"
            label="Tìm Kiếm Thành Viên"
          >
            <Input.Search
              placeholder="Nhập số điện thoại"
              enterButton="Tìm Kiếm"
              onSearch={handleSearchMember}
              loading={loading}
              size="large"
            />
          </Form.Item>
        </Form>
      </div>

      {member && (
        <div className="member-info-card">
          <h3>Thông Tin Thành Viên</h3>
          <div className="member-details">
            <p><strong>Họ tên:</strong> {member.fullName}</p>
            <p><strong>Điểm tích lũy:</strong> {member.currentPoints}</p>
            <p><strong>Email:</strong> {member.email}</p>
            <p><strong>Số điện thoại:</strong> {member.phoneNumber}</p>
          </div>
        </div>
      )}

      {/* Rest of your existing component content */}
    </div>
  );
};

export default StaffPage; 