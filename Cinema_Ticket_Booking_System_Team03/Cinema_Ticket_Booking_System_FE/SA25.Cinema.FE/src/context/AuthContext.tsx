import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../config/axios'; // Import file cấu hình axios API
import { toast } from 'react-toastify';

// Define AuthState interface if not imported
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresPasswordChange: boolean;
}

// Define AuthContextType interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresPasswordChange: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Create the context with undefined as default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state INSIDE the component
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: true,
    error: null,
    requiresPasswordChange: localStorage.getItem('requiresPasswordChange') === 'true'
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
        } catch (error: any) {
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
    try {
      const response = await api.post('/Auth/login', { email, password });
      const userData = response.data;

      if (!userData.token) {
        throw new Error('Token is null or undefined');
      }

      // Lưu thông tin vào localStorage
      localStorage.setItem('token', userData.token);
      localStorage.setItem('requiresPasswordChange', userData.requiresPasswordChange.toString());

      setAuthState({
        user: userData,
        token: userData.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requiresPasswordChange: userData.requiresPasswordChange
      });

      return { requiresPasswordChange: userData.requiresPasswordChange };
    } catch (error: any) {
      console.error('Login Error:', error);
      setAuthState(prevState => ({
        ...prevState,
        error: error?.response?.data?.message || 'Login failed',
        isLoading: false,
      }));
      // Show error toast
      toast.error(error?.response?.data?.message || 'Đăng nhập thất bại');
      throw error;
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
      // Show error toast
      toast.error(error?.response?.data?.message || 'Đăng ký thất bại');
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('requiresPasswordChange');

    // Reset state
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresPasswordChange: false,
    });
  };

  // Update user information
  const updateUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        error: authState.error,
        requiresPasswordChange: authState.requiresPasswordChange,
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

export default AuthContext;
