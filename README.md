# 🎬 Cinema Ticket Booking System

<div align="center">

![Cinema Booking Banner](https://img.shields.io/badge/Cinema-Booking%20System-red?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyek04IDE3di0yaDh2MmgtOHptMC00di0yaDh2Mmgtdjh6bTAtNFY3aDh2MmgtOHoiLz48L3N2Zz4=)
![.NET](https://img.shields.io/badge/.NET-9.0-512BD4?style=for-the-badge&logo=dotnet)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-4169E1?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker)
![Render](https://img.shields.io/badge/Render-Backend_Live-46E3B7?style=for-the-badge&logo=render)
![Vercel](https://img.shields.io/badge/Vercel-Frontend_Live-000000?style=for-the-badge&logo=vercel)

**Hệ thống đặt vé xem phim trực tuyến full-stack** được thực hiện bởi **Lê Quốc Bảo** — Dự án thực tập (Internship) tại **FPT Software**, sinh viên **Đại học FPT**.

⚡ **Backend API (Swagger Docs Live):** [https://cinema-booking-api-gur7.onrender.com](https://cinema-booking-api-gur7.onrender.com)  
🐘 **Database Cloud:** [Neon Serverless PostgreSQL](https://neon.tech)  
🐳 **Backend Host:** Docker Web Service on [Render](https://render.com)  
🚀 **Frontend Host:** SPA on [Vercel](https://vercel.com)  

[📖 Hướng dẫn cài đặt](#-cài-đặt-và-chạy-project) · [📚 API Documentation](#-api-documentation) · [🐛 Báo lỗi](https://github.com/Bao2311/CINEMA-BOOKING-PROJECT/issues)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc triển khai Production](#-kiến-trúc-triển-khai-production)
- [Cấu trúc project](#-cấu-trúc-project)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt và chạy project](#-cài-đặt-và-chạy-project)
- [Tài khoản demo dùng thử](#-tài-khoản-demo-dùng-thử)
- [Cấu hình môi trường](#-cấu-hình-môi-trường)
- [API Documentation](#-api-documentation)
- [Thông tin người thực hiện](#-thông-tin-người-thực-hiện)

---

## 🎯 Giới thiệu

**Cinema Ticket Booking System** là ứng dụng web full-stack cho phép người dùng đặt vé xem phim trực tuyến. Hệ thống bao gồm:

- 🎫 **Đặt vé trực tuyến** với chọn ghế ngồi theo sơ đồ rạp
- 💳 **Thanh toán** qua PayOS (sandbox)
- 📧 **Xác nhận email** tự động kèm vé điện tử và mã QR
- 👤 **Quản lý tài khoản** người dùng, lịch sử đặt vé, tích điểm thành viên
- 🔐 **Phân quyền** Admin / Staff / Customer
- 📊 **Dashboard Admin** với thống kê doanh thu, quản lý phim, suất chiếu

---

## ✨ Tính năng

### Dành cho Khách hàng (Customer)
| Tính năng | Mô tả |
|-----------|-------|
| 🔍 Xem phim | Duyệt danh sách phim đang chiếu, sắp chiếu |
| 🎬 Chi tiết phim | Xem thông tin, trailer, suất chiếu |
| 💺 Chọn ghế | Sơ đồ ghế tương tác theo phòng chiếu |
| 🛒 Đặt vé | Thanh toán trực tuyến qua PayOS |
| 📱 Lịch sử đặt vé | Xem, hủy vé đã đặt |
| 🔔 Thông báo | Nhận thông báo về khuyến mãi, vé đã đặt |
| 👤 Hồ sơ cá nhân | Cập nhật thông tin, đổi mật khẩu |
| ✅ Check-in | Quét mã QR tại quầy |

### Dành cho Staff
| Tính năng | Mô tả |
|-----------|-------|
| 🎟️ Quản lý vé | Xem danh sách, xử lý check-in |
| 🔎 Tra cứu đặt vé | Tìm kiếm theo mã vé, khách hàng |

### Dành cho Admin
| Tính năng | Mô tả |
|-----------|-------|
| 🎥 Quản lý phim | CRUD phim, upload poster lên Cloudinary |
| 🏟️ Quản lý rạp & phòng | Thêm/sửa rạp, cấu hình ghế |
| 📅 Quản lý lịch chiếu | Tạo suất chiếu cho từng phim |
| 👥 Quản lý nhân viên | CRUD tài khoản staff |
| 🎁 Khuyến mãi | Tạo mã giảm giá |
| 📊 Thống kê | Doanh thu, lượt đặt vé theo ngày/tháng |
| 📢 Thông báo | Gửi thông báo toàn hệ thống |

---

## 🛠️ Công nghệ sử dụng

### 🚀 Triển khai & Vận hành (Deployment & Cloud Architecture)
| Nền tảng / Công cụ | Loại hình | Mục đích |
|--------------------|-----------|---------|
| **Vercel** | Cloud PaaS / Edge Network | Hosting ứng dụng Frontend React (Vite SPA), tự động build & CI/CD từ GitHub |
| **Render** | Cloud Container Platform | Hosting Backend API đóng gói bằng Docker Container, hỗ trợ HTTPS tự động |
| **Neon** | Serverless PostgreSQL | Cơ sở dữ liệu đám mây Production, hỗ trợ autoscaling và kết nối SSL an toàn |
| **Docker** | Containerization | Đóng gói môi trường chạy chuẩn hóa cho ASP.NET Core 9.0 Web API |
| **GitHub Actions / Git** | Source Control & CI/CD | Quản lý mã nguồn, tự động kích hoạt deploy khi commit |
| **Cloudinary** | Cloud Media CDN | Lưu trữ và tối ưu hóa hình ảnh poster phim |
| **PayOS Gateway** | Online Payment | Cổng thanh toán trực tuyến QR Code ngân hàng (Sandbox) |
| **Google SMTP** | Mail Service | Gửi email tự động xác nhận đơn hàng, vé điện tử và mã QR qua App Password |

### Backend (.NET 9 Web API)
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| ASP.NET Core | .NET 9.0 | Web API Framework |
| Entity Framework Core | 9.x | ORM - Database access |
| Npgsql EFCore Provider | 9.x | Driver kết nối PostgreSQL (Neon Cloud) |
| SQL Server LocalDB | - | Database cục bộ cho phát triển (Local Development) |
| JWT Bearer Authentication | - | Xác thực & phân quyền người dùng (Role-based Authorization) |
| CloudinaryDotNet | 1.27+ | Upload và quản lý poster phim |
| PayOS SDK | 1.0+ | Tích hợp cổng thanh toán trực tuyến |
| MailKit / MimeKit | 4.x | Gửi email SMTP tự động |
| Swashbuckle / Swagger | 6.x | Tài liệu hóa và giao diện thử nghiệm API trực tiếp (OpenAPI) |
| QRCoder / ZXing | - | Tạo và giải mã QR Code vé xem phim |

### Frontend (React + TypeScript)
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| React | 18.3 | UI Library |
| TypeScript | 5.5 | Ngôn ngữ tĩnh kiểu dữ liệu an toàn |
| Vite | 5.4 | Công cụ build cực nhanh và Dev server |
| React Router DOM | 6.x | Định tuyến trang Single Page Application (SPA) |
| Axios | 1.x | Thư viện gọi HTTP API |
| Tailwind CSS | 3.x | Hệ thống styling tiện ích |
| Ant Design (antd) | 5.x | Thư viện UI Component chuyên nghiệp cho Dashboard |
| Material UI (MUI) | 7.x | Thư viện component phụ trợ |
| Framer Motion | 12.x | Hiệu ứng chuyển động mượt mà |
| Chart.js / React-Chartjs-2 | 4.x / 5.x | Biểu đồ báo cáo doanh thu & thống kê |
| QRCode.react | 4.x | Hiển thị mã QR vé xem phim trực tiếp trên web |
| React Toastify | 11.x | Hệ thống thông báo toast tức thì |

---

## 📁 Cấu trúc project

```
Cinema_Ticket_Booking_System_Team03/
├── Cinema_Ticket_Booking_System_BE/         # 🔧 Backend (ASP.NET Core)
│   └── SA25.Cinema.APi/
│       ├── STP.APIService/                  # Web API - Controllers, Program.cs
│       │   ├── Controllers/                 # API Controllers
│       │   ├── appsettings.example.json     # ⚠️ Template cấu hình (copy → appsettings.json)
│       │   └── Program.cs                   # Entry point, DI config
│       └── STP.Repository/                  # Data Access Layer
│           ├── Models/                      # Entity models
│           ├── Dtos/                        # Data Transfer Objects
│           ├── Repository/                  # Repository pattern
│           ├── Services/                    # Business logic
│           ├── Migrations/                  # EF Core migrations
│           └── UnitOfWork.cs               # Unit of Work pattern
│
└── Cinema_Ticket_Booking_System_FE/         # 🎨 Frontend (React + TypeScript)
    └── SA25.Cinema.FE/
        ├── src/
        │   ├── components/                  # UI Components
        │   │   ├── Admin/                   # Dashboard quản trị
        │   │   ├── Auth/                    # Đăng nhập, đăng ký
        │   │   ├── Booking/                 # Đặt vé, chọn ghế
        │   │   ├── Layout/                  # Navbar, Footer
        │   │   ├── Movies/                  # Danh sách, chi tiết phim
        │   │   └── Profile/                 # Hồ sơ, lịch sử
        │   ├── pages/                       # Route pages
        │   ├── services/                    # API calls (axios)
        │   ├── store/                       # State management
        │   └── App.tsx                      # Root component
        ├── package.json
        ├── vite.config.ts
        └── tailwind.config.js
```

---

## 💻 Yêu cầu hệ thống

Trước khi chạy project, hãy đảm bảo máy bạn đã cài đặt:

| Phần mềm | Phiên bản tối thiểu | Link tải |
|----------|---------------------|---------|
| .NET SDK | 9.0+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| Node.js | 18.0+ | [nodejs.org](https://nodejs.org) |
| SQL Server | LocalDB / Express | [Tải SQL Server LocalDB](https://learn.microsoft.com/sql/database-engine/configure-windows/sql-server-express-localdb) |
| Visual Studio | 2022+ hoặc VS Code | - |
| Git | Bất kỳ | [git-scm.com](https://git-scm.com) |

---

## 🚀 Cài đặt và chạy project

### Bước 1: Clone repository

```bash
git clone https://github.com/Bao2311/CINEMA-BOOKING-PROJECT.git
cd CINEMA-BOOKING-PROJECT
```

---

### Bước 2: Cấu hình Backend

#### 2.1 Tạo file cấu hình

Sao chép file mẫu và điền thông tin của bạn:

```bash
cd Cinema_Ticket_Booking_System_Team03/Cinema_Ticket_Booking_System_BE/SA25.Cinema.APi/STP.APIService

# Copy file mẫu
cp appsettings.example.json appsettings.json
```

Mở `appsettings.json` và cập nhật các giá trị (**xem phần [Cấu hình môi trường](#-cấu-hình-môi-trường) bên dưới**).

#### 2.2 Restore packages & Apply migration

```bash
# Từ thư mục STP.APIService
cd ../..                   # về SA25.Cinema.APi/

# Restore NuGet packages
dotnet restore

# Apply database migrations (tạo database tự động)
dotnet ef database update --project STP.Repository --startup-project STP.APIService
```

> **💡 Lưu ý:** Nếu lệnh `dotnet ef` chưa cài, chạy: `dotnet tool install --global dotnet-ef`

#### 2.3 Chạy Backend API

```bash
cd STP.APIService
dotnet run
```

Backend sẽ khởi động tại:
- **HTTPS:** `https://localhost:7168`
- **HTTP:** `http://localhost:5268`
- **Swagger UI:** `https://localhost:7168/swagger`

---

### Bước 3: Cấu hình Frontend

```bash
# Từ root của project
cd Cinema_Ticket_Booking_System_Team03/Cinema_Ticket_Booking_System_FE/SA25.Cinema.FE

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: **`http://localhost:5173`**

---

### Bước 4: Đăng nhập thử (Tài khoản mẫu)

Hệ thống đã tích hợp sẵn cơ chế **Auto-Seeding (DbSeeder)** tự động nạp dữ liệu mẫu ban đầu:

| Role | Email | Mật khẩu | Quyền hạn |
|------|-------|---------|-----------|
| 👑 **Admin** | `admin@cinema.com` | `Admin@123` | Toàn quyền quản trị hệ thống, phim, rạp, nhân viên, thống kê |
| 💼 **Staff** | `staff@cinema.com` | `Staff@123` | Quản lý vé, quét mã QR Check-in khách vào rạp |
| 👤 **Customer** | `customer@cinema.com` | `User@123` | Khách hàng mẫu (hoặc bấm Đăng ký tài khoản mới) |

---

## ⚙️ Cấu hình môi trường

File `appsettings.json` cần được tạo từ `appsettings.example.json`. Dưới đây là giải thích từng mục:

### 🗄️ Database Connection (Hỗ trợ cả PostgreSQL & SQL Server)

- **Production (Neon Cloud - PostgreSQL):**
```bash
DATABASE_PROVIDER=PostgreSQL
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

- **Local Development (SQL Server LocalDB):**
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=CinemaDB_Local;Trusted_Connection=True;TrustServerCertificate=True"
}
```
- Sử dụng **SQL Server LocalDB** (cài sẵn cùng Visual Studio)
- Thay `CinemaDB_Local` bằng tên database tùy chọn

### ☁️ Cloudinary (Upload hình ảnh phim)

Đăng ký tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com):
```json
"Cloudinary": {
  "CloudName": "your_cloud_name",
  "ApiKey": "your_api_key",
  "ApiSecret": "your_api_secret"
}
```

### 🔐 JWT Authentication

```json
"Jwt": {
  "Key": "YOUR_SECRET_KEY_MIN_32_CHARACTERS",
  "Issuer": "https://localhost:7168",
  "Audience": "https://localhost:7168"
}
```
- Key phải có **ít nhất 32 ký tự**

### 💰 PayOS (Thanh toán)

Đăng ký tại [payos.vn](https://payos.vn) để lấy thông tin sandbox:
```json
"PayOS": {
  "ClientId": "your_client_id",
  "ApiKey": "your_api_key",
  "ChecksumKey": "your_checksum_key",
  "BaseUrl": "https://sandbox.payos.vn"
}
```

### 📧 Email (Gmail SMTP)

1. Bật **2-Factor Authentication** cho Gmail
2. Tạo **App Password** tại [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

```json
"EmailSettings": {
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587,
  "SmtpUsername": "your_email@gmail.com",
  "SmtpPassword": "your_app_password_16_chars",
  "SenderEmail": "your_email@gmail.com",
  "SenderName": "STP Cinema"
}
```

---

## 📚 API Documentation

Sau khi chạy backend, truy cập **Swagger UI** để xem toàn bộ API:

```
https://localhost:7168/swagger
```

### Một số endpoint chính:

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/auth/login` | Đăng nhập |
| `POST` | `/api/auth/register` | Đăng ký |
| `GET` | `/api/movies` | Danh sách phim |
| `GET` | `/api/movies/{id}` | Chi tiết phim |
| `GET` | `/api/showtimes` | Danh sách suất chiếu |
| `GET` | `/api/seats/{showtimeId}` | Sơ đồ ghế |
| `POST` | `/api/bookings` | Tạo đặt vé |
| `POST` | `/api/payments/payos` | Tạo link thanh toán |
| `GET` | `/api/bookings/user` | Lịch sử đặt vé |

---

## 🔧 Scripts hữu ích

### Frontend

```bash
npm run dev          # Chạy development server (hot reload)
npm run build        # Build production bundle
npm run preview      # Preview production build
npm run lint         # Kiểm tra lỗi ESLint
```

### Backend

```bash
dotnet run                         # Chạy API
dotnet watch run                   # Chạy với hot reload
dotnet ef migrations add <Name>    # Tạo migration mới
dotnet ef database update          # Apply migrations
dotnet ef database drop            # Xóa database (cẩn thận!)
dotnet restore                     # Restore packages
dotnet build                       # Build project
```

---

## 👤 Thông tin người thực hiện

| Thông tin | Chi tiết |
|-----------|---------|
| **Họ và tên** | **Lê Quốc Bảo** |
| **Vai trò** | Full-stack Developer |
| **Đơn vị thực tập** | Dự án Thực tập (Internship) tại **FPT Software** |
| **Trường** | **Đại học FPT** (FPT University) |

> Dự án được thực hiện bởi **Lê Quốc Bảo** trong khuôn khổ kỳ thực tập tại **FPT Software** — Sinh viên **Đại học FPT**.

---

## 📄 License

Project này được phát triển cho mục đích học tập. Mọi thông tin API keys trong file cấu hình mẫu đều là placeholder.

---

<div align="center">

Made with ❤️ by **Lê Quốc Bảo** — Đại học FPT (FPT Software Intern)

</div>
