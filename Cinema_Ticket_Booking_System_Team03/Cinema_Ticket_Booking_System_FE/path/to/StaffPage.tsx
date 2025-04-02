import React, { useState } from 'react';
import axios from 'axios';
import { message } from 'antd';

const StaffPage: React.FC = () => {
  const [member, setMember] = useState(null);
  const [bookingId, setBookingId] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingSummary, setBookingSummary] = useState({
    pointsDiscount: 0,
    total: 0,
    subtotal: 0
  });

  const getAuthToken = () => {
    // Implement your logic to get the authentication token
    return 'your-auth-token';
  };

  const updateBookingSummary = () => {
    // Implement your logic to update the booking summary
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
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default StaffPage; 