import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePasswordChange?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePasswordChange = true 
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (requirePasswordChange && user?.requiresPasswordChange) {
      navigate('/settings', {
        state: { 
          passwordChangeRequired: true,
          from: location
        }
      });
      return;
    }
  }, [isAuthenticated, user, navigate, location, requirePasswordChange]);

  return <>{children}</>;
};

export default ProtectedRoute;

