import axios from "axios";


// Cấu hình axios với base URL của API
const api = axios.create({
  baseURL: "https://localhost:7168/api/",
});


// Interceptor để thêm token vào header của request
api.interceptors.request.use(
  function (config) {
    // Kiểm tra và lấy token từ localStorage
    const token = localStorage.getItem("token");
   
    // Nếu token có, thêm nó vào header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    // Xử lý lỗi nếu có
    return Promise.reject(error);
  }
)


export default api;



