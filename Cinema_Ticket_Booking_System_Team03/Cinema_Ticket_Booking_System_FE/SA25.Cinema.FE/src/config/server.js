const cors = require('cors');  // Import CORS package
const express = require('express');  // Import Express.js
const app = express();  // Khởi tạo ứng dụng Express

// Cấu hình CORS để cho phép frontend từ địa chỉ localhost:3000 truy cập
app.use(cors({
  origin: 'http://localhost:3000',  // URL của ứng dụng frontend (React)
}));

// Các route của API
app.get('/your-endpoint', (req, res) => {
  res.json({ message: 'API is working' });  // Trả về thông điệp JSON
});

// Lắng nghe trên cổng 7168
app.listen(7168, () => {
  console.log('Server is running on port 7168');
});
