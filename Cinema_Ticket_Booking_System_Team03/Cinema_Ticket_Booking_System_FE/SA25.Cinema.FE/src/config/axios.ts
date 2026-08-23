import axios from "axios";

// Cấu hình axios với base URL của API
const api = axios.create({
  baseURL: "http://localhost:5204/api/",
});

// Interceptor để thêm token vào header của request
api.interceptors.request.use(
  function (config) {
    // Kiểm tra và lấy token từ localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
      // Tránh in toàn bộ token vào console để bảo mật
      console.log('Token exists and is being added to request header');
    } else {
      console.log('No token found for request:', config.url);
    }

    return config;
  },
  function (error) {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Thêm interceptor cho response để debug và xử lý lỗi
api.interceptors.response.use(
  function (response) {
    console.log('Response received for:', response.config.url);
    return response;
  },
  function (error) {
    console.error('Response error for:', error.config?.url);
    console.error('Status:', error.response?.status);
    
    // Kiểm tra nếu lỗi là 401 (Unauthorized) và không phải là đường dẫn đăng nhập/đăng ký
    if (error.response?.status === 401 && 
        !error.config.url.includes('/Auth/login') && 
        !error.config.url.includes('/Auth/register')) {
      console.error('Unauthorized error - token may be invalid');
      // Có thể thêm logic để refresh token ở đây, nếu cần
    }
    
    return Promise.reject(error);
  }
);

export default api;
