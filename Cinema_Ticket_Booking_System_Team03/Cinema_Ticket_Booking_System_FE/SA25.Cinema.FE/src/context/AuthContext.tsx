// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { User, AuthState } from '../types';
// import api from '../config/axios';  // Import file cấu hình axios API




// interface AuthContextType extends AuthState {
//   login: (email: string, password: string) => Promise<void>;
//   register: (username: string, email: string, password: string) => Promise<void>;
//   logout: () => void;
//   updateUser: (user: User) => void;
// }




// const AuthContext = createContext<AuthContextType | undefined>(undefined);




// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };




// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [authState, setAuthState] = useState<AuthState>({
//     user: null,
//     token: localStorage.getItem('token'),
//     isAuthenticated: false,
//     isLoading: true,
//     error: null,
//   });




//   // Load user from localStorage when the app starts
//   useEffect(() => {
//     const loadUser = async () => {
//       if (authState.token) {
//         try {
//           // In a real app, you would verify the token with your backend
//           const userResponse = await api.get('/Auth/profile', {
//             headers: {
//               Authorization: `Bearer ${authState.token}`,
//             },
//           });
//           setAuthState({
//             ...authState,
//             user: userResponse.data,
//             isAuthenticated: true,
//             isLoading: false,
//           });
//         } catch (error) {
//           localStorage.removeItem('token');
//           setAuthState({
//             ...authState,
//             token: null,
//             isAuthenticated: false,
//             isLoading: false,
//             error: 'Session expired. Please login again.',
//           });
//         }
//       } else {
//         setAuthState({
//           ...authState,
//           isLoading: false,
//         });
//       }
//     };




//     loadUser();
//   }, [authState.token]);  




//   // Login function
//   const login = async (email: string, password: string) => {
//     try {
//       const response = await api.post('/Auth/login', { email, password });




//       const { token, user } = response.data;




//       localStorage.setItem('token', token);  // Store token
//       localStorage.setItem('user', JSON.stringify(user));  // Store user




//       setAuthState({
//         user,
//         token,
//         isAuthenticated: true,
//         isLoading: false,
//         error: null,
//       });
//     } catch (error) {
//       setAuthState({
//         ...authState,
//         error: 'Invalid credentials',
//         isLoading: false,
//       });
//     }
//   };




//   // Register function
//   const register = async (username: string, email: string, password: string) => {
//     try {
//       const response = await api.post('/Auth/register', {
//         username,
//         email,
//         password,
//       });




//       const { token, user } = response.data;




//       localStorage.setItem('token', token);  // Store token
//       localStorage.setItem('user', JSON.stringify(user));  // Store user




//       setAuthState({
//         user,
//         token,
//         isAuthenticated: true,
//         isLoading: false,
//         error: null,
//       });
//     } catch (error) {
//       setAuthState({
//         ...authState,
//         error: 'Registration failed',
//         isLoading: false,
//       });
//     }
//   };




//   // Logout function
//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setAuthState({
//       user: null,
//       token: null,
//       isAuthenticated: false,
//       isLoading: false,
//       error: null,
//     });
//   };




//   // Update user information
//   const updateUser = (user: User) => {
//     setAuthState({
//       ...authState,
//       user,
//     });
//   };




//   return (
//     <AuthContext.Provider
//       value={{
//         ...authState,
//         login,
//         register,
//         logout,
//         updateUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };


import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import api from '../config/axios'; // Import file cấu hình axios API

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
    setAuthState(prevState => ({ ...prevState, isLoading: true }));
    try {
      const response = await api.post('/Auth/login', { email, password });

      console.log('API Login Response:', response.data); // Log phản hồi từ API để kiểm tra token

      // Trích xuất token trực tiếp từ response.data
      const token = response.data.token;
      const user = response.data;  // Toàn bộ response.data là user object

      // Kiểm tra nếu token bị null hoặc không tồn tại
      if (!token) {
        throw new Error('Token is null or undefined');
      }

      // Store token in localStorage
      localStorage.setItem('token', token);
      console.log('Token saved to localStorage:', token);

      setAuthState(prevState => ({
        ...prevState,
        user,
        token,
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
      }));
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    setAuthState(prevState => ({ ...prevState, isLoading: true }));
    try {
      const response = await api.post('/Auth/register', { username, email, password });

      console.log('API Register Response:', response.data);
      
      const token = response.data.token;
      const user = response.data;

      // Kiểm tra nếu token bị null hoặc không tồn tại
      if (!token) {
        throw new Error('Token is null or undefined');
      }

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      console.log('Token saved to localStorage after registration:', token);

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
