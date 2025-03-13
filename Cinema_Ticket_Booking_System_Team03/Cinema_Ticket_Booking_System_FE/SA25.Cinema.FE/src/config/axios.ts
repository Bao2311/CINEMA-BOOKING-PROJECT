import axios from "axios";

// Cấu hình axios với base URL của API
const api = axios.create({
  baseURL: "http://localhost:7168/", // URL của server bạn đang sử dụng
});

// Interceptor để thêm token vào header của request
api.interceptors.request.use(
  function (config) {
    // Kiểm tra và lấy token từ localStorage
    const token = localStorage.getItem("token");
    
    // Nếu token có, thêm nó vào header Authorization
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // } else {
    //   // Nếu không có token, bạn có thể redirect về trang đăng nhập hoặc xử lý khác
    //   console.log("No token found, redirecting to login...");
    //   window.location.href = "/login"; // Chuyển hướng người dùng về trang login
    // }

    return config;
  },
  function (error) {
    // Xử lý lỗi nếu có
    return Promise.reject(error);
  }
);

export default api;
