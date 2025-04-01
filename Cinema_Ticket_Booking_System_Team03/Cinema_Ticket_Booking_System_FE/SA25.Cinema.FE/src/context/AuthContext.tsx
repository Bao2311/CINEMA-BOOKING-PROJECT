import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import api from '../config/axios'; // Import file cấu hình axios API
import { toast } from 'react-toastify';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ requiresPasswordChange?: boolean } | void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: Boolean(localStorage.getItem('token')),
    isLoading: true,
    error: null,
  });

  // Load user from localStorage when the app starts
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      console.log('Initial token from localStorage:', storedToken);
      
      if (storedToken) {
        try {
          console.log('Attempting to load profile with token:', storedToken);
          const userResponse = await api.get('/Auth/profile');
          console.log('Profile response:', userResponse.data);
          
          setAuthState(prevState => ({
            ...prevState,
            user: userResponse.data,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          }));
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Không xóa token ngay lập tức, kiểm tra lỗi trước
          if (error.response && error.response.status === 401) {
            console.log('Token invalid or expired, removing from localStorage');
            localStorage.removeItem('token');
            setAuthState(prevState => ({
              ...prevState,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired. Please login again.',
            }));
          } else {
            // Với các lỗi khác (network, server, etc.), giữ token
            setAuthState(prevState => ({
              ...prevState,
              isAuthenticated: true, // Vẫn coi như đã đăng nhập
              isLoading: false,
              error: 'Could not fetch profile. Please try again later.',
            }));
          }
        }
      } else {
        setAuthState(prevState => ({
          ...prevState,
          isLoading: false,
        }));
      }
    };

    loadUser();
  }, []); // Empty dependency array to run only once on mount

  // Login function
  const login = async (email: string, password: string) => {
    setAuthState(prevState => ({ ...prevState, isLoading: true, error: null }));

    try {
      const response = await api.post('/Auth/login', { email, password });
      const userData = response.data;

      if (!userData.token) {
        throw new Error('Token is null or undefined');
      }

      // Store user information in localStorage
      localStorage.setItem('token', userData.token);
      localStorage.setItem('userId', userData.userId.toString());
      localStorage.setItem('fullName', userData.fullName);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('tokenExpiration', userData.tokenExpiration);
      localStorage.setItem('role', userData.role);

      // Kiểm tra nếu tài khoản yêu cầu đổi mật khẩu
      if (userData.requiresPasswordChange) {
        localStorage.setItem('requiresPasswordChange', 'true');
        
        // Cập nhật state để đánh dấu đã đăng nhập
        setAuthState({
          user: userData,
          token: userData.token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        // Trả về thông tin về yêu cầu đổi mật khẩu để component gọi có thể xử lý
        return { requiresPasswordChange: true };
      }

      // Cập nhật state với thông tin người dùng (trường hợp bình thường)
      setAuthState(prevState => ({
        ...prevState,
        user: userData,
        token: userData.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));

    } catch (error: any) {
      console.error('Login Error:', error);
      setAuthState(prevState => ({
        ...prevState,
        error: error?.response?.data?.message || 'Invalid credentials',
        isLoading: false,
        isAuthenticated: false,
      }));

      // Hiển thị thông báo lỗi cho người dùng
      if (error.response?.data?.message) {
        toast.error(error.response?.data?.message);  // Hiển thị thông báo lỗi trả về từ server
      } else {
        toast.error('Tài khoản hoặc mật khẩu sai. Vui lòng thử lại.');
      }
      throw error; // Re-throw the error to be caught in LoginForm
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    setAuthState(prevState => ({ ...prevState, isLoading: true }));
    try {
      const response = await api.post('/Auth/register', { username, email, password });

      const token = response.data.token;
      const user = response.data;

      if (!token) {
        throw new Error('Token is null or undefined');
      }

      localStorage.setItem('token', token);

      setAuthState(prevState => ({
        ...prevState,
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('Registration Error:', error);
      setAuthState(prevState => ({
        ...prevState,
        error: error?.response?.data?.message || 'Registration failed',
        isLoading: false,
      }));
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('email');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('role');
    localStorage.removeItem('requiresPasswordChange'); // Đảm bảo xóa cả flag này khi đăng xuất
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  // Update user information
  const updateUser = (user: User) => {
    setAuthState(prevState => ({
      ...prevState,
      user,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
