// PasswordChangeRequiredGuard.tsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PasswordChangeRequiredGuard = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Kiểm tra nếu người dùng cần đổi mật khẩu và không ở trang settings
    if (user?.requiresPasswordChange && 
        location.pathname !== '/profile/settings') {
      // Chuyển hướng về trang settings
      navigate('/profile/settings', { 
        state: { 
          passwordChangeRequired: true,
          attemptedPath: location.pathname 
        },
        replace: true 
      });
    }
  }, [user, location.pathname, navigate]);

  return children;
};

export default PasswordChangeRequiredGuard;
