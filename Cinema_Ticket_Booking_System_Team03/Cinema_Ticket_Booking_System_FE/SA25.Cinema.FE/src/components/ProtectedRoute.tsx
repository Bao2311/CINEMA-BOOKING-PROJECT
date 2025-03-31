import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePasswordChange?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePasswordChange = true 
}) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const passwordChangeRequired = localStorage.getItem('requiresPasswordChange') === 'true';
  
  useEffect(() => {
    // Hiển thị thông báo nếu cần đổi mật khẩu và không ở trang profile
    if (passwordChangeRequired && location.pathname !== '/profile' && requirePasswordChange) {
      toast.warning('Vui lòng đổi mật khẩu trước khi tiếp tục sử dụng hệ thống', {
        toastId: 'password-change-required',
        autoClose: false
      });
    }
  }, [passwordChangeRequired, location.pathname, requirePasswordChange]);

  // Nếu không có token, chuyển hướng đến trang đăng nhập
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Nếu cần đổi mật khẩu và không ở trang profile, chuyển hướng đến trang profile
  if (passwordChangeRequired && location.pathname !== '/profile' && requirePasswordChange) {
    return <Navigate to="/profile" state={{ from: location, passwordChangeRequired: true }} replace />;
  }
  
  // Nếu không có vấn đề gì, hiển thị nội dung
  return <>{children}</>;
};

export default ProtectedRoute;
