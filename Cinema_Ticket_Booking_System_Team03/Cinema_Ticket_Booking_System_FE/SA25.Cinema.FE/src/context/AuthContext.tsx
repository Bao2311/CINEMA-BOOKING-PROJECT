import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import api from '../config/axios';  // Import file cấu hình axios API

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
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
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load user from localStorage when the app starts
  useEffect(() => {
    const loadUser = async () => {
      if (authState.token) {
        try {
          // In a real app, you would verify the token with your backend
          const userResponse = await api.get('/Auth/profile', {
            headers: {
              Authorization: `Bearer ${authState.token}`,
            },
          });

          setAuthState({
            ...authState,
            user: userResponse.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('token');
          setAuthState({
            ...authState,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Session expired. Please login again.',
          });
        }
      } else {
        setAuthState({
          ...authState,
          isLoading: false,
        });
      }
    };

    loadUser();
  }, [authState.token]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/Auth/login', { email, password });

      const { token, user } = response.data;

      localStorage.setItem('token', token);  // Store token
      localStorage.setItem('user', JSON.stringify(user));  // Store user

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        ...authState,
        error: 'Invalid credentials',
        isLoading: false,
      });
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await api.post('/Auth/register', {
        username,
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);  // Store token
      localStorage.setItem('user', JSON.stringify(user));  // Store user

      setAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        ...authState,
        error: 'Registration failed',
        isLoading: false,
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    setAuthState({
      ...authState,
      user,
    });
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
