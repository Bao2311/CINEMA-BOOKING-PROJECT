// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   Row,
//   Col,
//   Card,
//   Typography,
//   Spin,
//   message,
//   Form,
//   DatePicker,
//   Select,
//   Button,
// } from "antd";
// import { toast, ToastContainer } from "react-toastify";
// import { useNavigate } from "react-router-dom";
// import { Bar, Pie, Line } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Title as ChartTitle,
//   Tooltip,
//   Legend,
//   ArcElement,
// } from "chart.js";
// import moment from "moment"; // For handling dates
// import * as XLSX from "xlsx"; // For Excel export

// // Đăng ký các thành phần cần thiết của Chart.js
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   ChartTitle,
//   Tooltip,
//   Legend,
//   ArcElement
// );

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { RangePicker } = DatePicker;

// // Định nghĩa bảng màu
// const colors = {
//   primary: "#1890ff", // Màu xanh chính
//   success: "#52c41a", // Màu xanh lá
//   danger: "#f5222d", // Màu đỏ
//   warning: "#faad14", // Màu vàng
//   purple: "#722ed1", // Màu tím
//   pink: "#eb2f96", // Màu hồng
//   background: "#f5f7fa", // Màu nền nhạt
//   border: "#d9d9d9", // Màu viền
//   hoverShadow: "0 8px 16px rgba(0, 0, 0, 0.1)", // Bóng đổ khi hover
// };

// const StatisticsPage = () => {
//   const [data, setData] = useState(null);
//   const [salesReportData, setSalesReportData] = useState(null);
//   const [staffPerformanceData, setStaffPerformanceData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [exportLoading, setExportLoading] = useState(false); // For export button loading state
//   const navigate = useNavigate();
//   const [form] = Form.useForm();

//   // Lấy role từ localStorage hoặc sessionStorage
//   const getRole = () => {
//     return localStorage.getItem("role") || sessionStorage.getItem("role");
//   };

//   // Kiểm tra quyền truy cập và gọi API
//   useEffect(() => {
//     const role = getRole();
//     if (role !== "Admin") {
//       toast.error("Bạn không có quyền truy cập trang này.");
//       navigate("/");
//     } else {
//       fetchSalesReport(); // Gọi API SalesReport trước
//     }
//   }, [navigate]);

//   // Hàm gọi API BookingStatistics (dự phòng)
//   const fetchStatistics = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
//       }

//       const response = await axios.get(
//         "https://localhost:7168/api/BookingStatistics",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             accept: "*/*",
//           },
//         }
//       );

//       if (response.data && Object.keys(response.data).length > 0) {
//         const dailyStatsArray = Object.values(
//           response.data.dailyStatistics
//         ).map((stat) => ({
//           day: stat.day,
//           totalBookings: stat.totalBookings,
//           totalTickets: stat.totalTickets,
//           totalRevenue: stat.totalRevenue,
//         }));

//         setData({
//           ...response.data,
//           dailyStatistics: dailyStatsArray,
//         });
//       } else {
//         throw new Error("Không có dữ liệu từ BookingStatistics.");
//       }
//     } catch (error) {
//       console.error("Lỗi khi lấy thống kê BookingStatistics:", error.message);
//       message.error(error.message || "Đã xảy ra lỗi khi lấy dữ liệu thống kê.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Hàm gọi API SalesReport (không cần tham số)
//   const fetchSalesReport = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
//       }

//       const response = await axios.get(
//         "https://localhost:7168/api/SalesReport",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             accept: "*/*",
//           },
//         }
//       );

//       console.log("Phản hồi từ SalesReport:", response.data);

//       if (response.data && Object.keys(response.data).length > 0) {
//         setSalesReportData(response.data);
//         fetchStatistics(); // Gọi BookingStatistics để lấy dữ liệu bổ sung
//         fetchStaffPerformance(); // Gọi StaffPerformance để lấy dữ liệu hiệu suất nhân viên
//       } else {
//         throw new Error("Không có dữ liệu từ SalesReport.");
//       }
//     } catch (error) {
//       console.error("Lỗi khi lấy dữ liệu SalesReport:", error.message);
//       message.error(
//         error.message || "Đã xảy ra lỗi khi lấy dữ liệu SalesReport."
//       );
//       fetchStatistics(); // Nếu SalesReport thất bại, gọi BookingStatistics làm dự phòng
//       fetchStaffPerformance(); // Vẫn gọi StaffPerformance để lấy dữ liệu hiệu suất nhân viên
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Hàm gọi API StaffPerformance (không cần tham số)
//   const fetchStaffPerformance = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
//       }

//       const response = await axios.get(
//         "https://localhost:7168/api/StaffPerformance",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             accept: "*/*",
//           },
//         }
//       );

//       console.log("Phản hồi từ StaffPerformance:", response.data);

//       if (
//         response.data &&
//         response.data.$values &&
//         response.data.$values.length > 0
//       ) {
//         setStaffPerformanceData(response.data.$values);
//       } else {
//         throw new Error("Không có dữ liệu từ StaffPerformance.");
//       }
//     } catch (error) {
//       console.error("Lỗi khi lấy dữ liệu StaffPerformance:", error.message);
//       message.error(
//         error.message || "Đã xảy ra lỗi khi lấy dữ liệu StaffPerformance."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Hàm chuẩn bị dữ liệu để xuất Excel cho Sales Report
//   const prepareSalesReportExportData = () => {
//     if (!salesReportData) {
//       return [];
//     }

//     const exportData = [];

//     // Thêm thông tin tổng quan
//     exportData.push({
//       "Tiêu đề": "Thống kê tổng quan",
//       "Tổng số đơn đặt": salesReportData.totalBookings,
//       "Tổng số vé": Math.round(salesReportData.totalTickets),
//       "Tổng doanh thu (VND)": salesReportData.totalAmount,
//     });

//     // Thêm khoảng trống
//     exportData.push({});

//     // Thêm thông tin theo khoảng thời gian (periodSales)
//     exportData.push({
//       "Tiêu đề": `Thống kê theo ${salesReportData.period || "ngày"}`,
//     });

//     salesReportData.periodSales.$values.forEach((sale) => {
//       const paymentMethods = Object.entries(sale.paymentMethods)
//         .map(([method, amount]) => `${method}: ${amount}`)
//         .join(", ");

//       exportData.push({
//         "Tên khoảng thời gian": sale.periodName,
//         "Tổng số đơn đặt": sale.totalBookings,
//         "Tổng số vé": Math.round(sale.totalTickets),
//         "Tổng doanh thu (VND)": sale.totalAmount,
//         "Phương thức thanh toán": paymentMethods,
//       });
//     });

//     return exportData;
//   };

//   // Hàm chuẩn bị dữ liệu để xuất Excel cho Booking Statistics
//   const prepareBookingStatisticsExportData = () => {
//     if (!data) {
//       return [];
//     }

//     const exportData = [];

//     // Thêm thông tin tổng quan
//     exportData.push({
//       "Tiêu đề": "Thống kê đặt vé tổng quan",
//       "Tổng số đơn đặt": data.totalBookings,
//       "Tổng số đơn xác nhận": data.confirmedBookings,
//       "Tổng số đơn hủy": data.cancelledBookings,
//       "Tổng doanh thu (VND)": data.totalRevenue,
//       "Số vé trung bình mỗi đơn": data.averageTicketsPerBooking,
//     });

//     // Thêm khoảng trống
//     exportData.push({});

//     // Thêm thông tin theo ngày (dailyStatistics)
//     exportData.push({
//       "Tiêu đề": "Thống kê đặt vé theo ngày",
//     });

//     // Convert dailyStatistics object values to array
//     const dailyStatsArray = Object.values(data.dailyStatistics).filter(
//       (stat) => typeof stat === "object" && stat.day // Ensure it's a stat object with a day property
//     );

//     dailyStatsArray.forEach((stat) => {
//       exportData.push({
//         Ngày: stat.day,
//         "Tổng số đơn đặt": stat.totalBookings,
//         "Tổng số vé": Math.round(stat.totalTickets),
//         "Tổng doanh thu (VND)": stat.totalRevenue,
//       });
//     });

//     // Thêm khoảng trống
//     exportData.push({});

//     // Thêm thông tin theo phim (movieStatistics)
//     exportData.push({
//       "Tiêu đề": "Thống kê đặt vé theo phim",
//     });

//     data.movieStatistics.$values.forEach((movie) => {
//       exportData.push({
//         "Tên phim": movie.movieName,
//         "Tổng số đơn đặt": movie.totalBookings,
//         "Tổng số vé": Math.round(movie.totalTickets),
//         "Tổng doanh thu (VND)": movie.totalRevenue,
//       });
//     });

//     // Thêm khoảng trống
//     exportData.push({});

//     // Thêm thông tin theo phòng chiếu (roomStatistics)
//     exportData.push({
//       "Tiêu đề": "Thống kê đặt vé theo phòng chiếu",
//     });

//     data.roomStatistics.$values.forEach((room) => {
//       exportData.push({
//         "Tên phòng chiếu": room.roomName,
//         "Tổng số đơn đặt": room.totalBookings,
//         "Tổng số vé": Math.round(room.totalTickets),
//         "Tổng doanh thu (VND)": room.totalRevenue,
//       });
//     });

//     // Thêm khoảng trống
//     exportData.push({});

//     // Thêm thông tin theo phương thức thanh toán (paymentMethodStatistics)
//     exportData.push({
//       "Tiêu đề": "Thống kê theo phương thức thanh toán",
//     });

//     Object.entries(data.paymentMethodStatistics).forEach(([method, amount]) => {
//       exportData.push({
//         "Phương thức thanh toán": method,
//         "Tổng doanh thu (VND)": amount,
//       });
//     });

//     return exportData;
//   };

//   // Hàm chuẩn bị dữ liệu để xuất Excel cho Staff Performance
//   const prepareStaffPerformanceExportData = () => {
//     if (!staffPerformanceData) {
//       return [];
//     }

//     const exportData = [];

//     // Thêm thông tin hiệu suất nhân viên
//     exportData.push({
//       "Tiêu đề": "Hiệu suất nhân viên",
//     });

//     staffPerformanceData.forEach((staff) => {
//       exportData.push({
//         "Tên nhân viên": staff.staffName,
//         "Tổng số đơn đặt": staff.totalBookingsHandled,
//         "Đơn tại quầy": staff.counterBookings,
//         "Đơn trực tuyến": staff.onlineBookings,
//         "Tổng doanh thu (VND)": staff.totalRevenue,
//         "Doanh thu trung bình mỗi đơn (VND)": staff.averageRevenuePerBooking,
//       });
//     });

//     return exportData;
//   };

//   // Hàm xuất file Excel cho Sales Report (client-side)
//   const handleExportSalesReportExcel = () => {
//     setExportLoading(true);
//     try {
//       if (!salesReportData) {
//         message.warning("Không có dữ liệu Sales Report để xuất.");
//         return;
//       }

//       const exportData = prepareSalesReportExportData();
//       const worksheet = XLSX.utils.json_to_sheet(exportData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "SalesReport");
//       XLSX.writeFile(
//         workbook,
//         `SalesReport-${moment().format("DD-MM-YYYY")}.xlsx`
//       );
//       message.success("Xuất Excel của Sales Report thành công!");
//     } catch (error) {
//       console.error("Lỗi khi xuất file Excel:", error.message);
//       message.error(error.message || "Đã xảy ra lỗi khi xuất file Excel.");
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   // Hàm xuất file Excel cho Booking Statistics (client-side)
//   const handleExportBookingStatisticsExcel = () => {
//     setExportLoading(true);
//     try {
//       if (!data) {
//         message.warning("Không có dữ liệu Booking Statistics để xuất.");
//         return;
//       }

//       const exportData = prepareBookingStatisticsExportData();
//       const worksheet = XLSX.utils.json_to_sheet(exportData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "BookingStatistics");
//       XLSX.writeFile(
//         workbook,
//         `BookingStatistics-${moment().format("DD-MM-YYYY")}.xlsx`
//       );
//       message.success("Xuất Excel của Booking Statistics thành công!");
//     } catch (error) {
//       console.error("Lỗi khi xuất file Excel:", error.message);
//       message.error(error.message || "Đã xảy ra lỗi khi xuất file Excel.");
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   // Hàm xuất file Excel cho Staff Performance (client-side)
//   const handleExportStaffPerformanceExcel = () => {
//     setExportLoading(true);
//     try {
//       if (!staffPerformanceData) {
//         message.warning("Không có dữ liệu Staff Performance để xuất.");
//         return;
//       }

//       const exportData = prepareStaffPerformanceExportData();
//       const worksheet = XLSX.utils.json_to_sheet(exportData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "StaffPerformance");
//       XLSX.writeFile(
//         workbook,
//         `StaffPerformance-${moment().format("DD-MM-YYYY")}.xlsx`
//       );
//       message.success("Xuất Excel của Staff Performance thành công!");
//     } catch (error) {
//       console.error("Lỗi khi xuất file Excel:", error.message);
//       message.error(error.message || "Đã xảy ra lỗi khi xuất file Excel.");
//     } finally {
//       setExportLoading(false);
//     }
//   };

//   // Hàm reset form
//   const handleClearForm = () => {
//     form.resetFields();
//   };

//   // Tính toán các số liệu tổng hợp
//   const totalBookings = salesReportData
//     ? salesReportData.totalBookings
//     : data
//     ? data.totalBookings
//     : 0;

//   const totalTickets = salesReportData
//     ? Math.round(salesReportData.totalTickets) // Đảm bảo số vé là số nguyên
//     : data
//     ? Math.round(data.totalTickets)
//     : 0;

//   const totalRevenue = salesReportData
//     ? (salesReportData.totalAmount / 1000).toFixed(2)
//     : data
//     ? (data.totalRevenue / 1000).toFixed(2)
//     : 0;

//   const totalStaff = staffPerformanceData ? staffPerformanceData.length : 0;

//   const totalBookingsHandled = staffPerformanceData
//     ? staffPerformanceData.reduce(
//         (total, staff) => total + staff.totalBookingsHandled,
//         0
//       )
//     : 0;

//   // Dữ liệu cho biểu đồ Tổng quan
//   const overviewChartData =
//     salesReportData || data
//       ? {
//           labels: ["Tổng số đơn đặt", "Tổng số vé", "Tổng doanh thu"],
//           datasets: [
//             {
//               label: "Thống kê tổng quan",
//               data: salesReportData
//                 ? [
//                     salesReportData.totalBookings,
//                     Math.round(salesReportData.totalTickets),
//                     salesReportData.totalAmount / 1000,
//                   ]
//                 : [
//                     data.totalBookings,
//                     Math.round(data.totalTickets),
//                     data.totalRevenue / 1000,
//                   ],
//               backgroundColor: [colors.primary, colors.success, colors.warning],
//             },
//           ],
//         }
//       : {};

//   // Dữ liệu cho biểu đồ Thống kê theo khoảng thời gian (Line chart)
//   const periodChartData = salesReportData
//     ? {
//         labels: salesReportData.periodSales.$values.map(
//           (sale) => sale.periodName
//         ),
//         datasets: [
//           {
//             label: "Tổng số đơn đặt",
//             data: salesReportData.periodSales.$values.map(
//               (sale) => sale.totalBookings
//             ),
//             borderColor: colors.primary,
//             backgroundColor: colors.primary,
//             fill: false,
//             type: "line",
//           },
//           {
//             label: "Tổng số vé",
//             data: salesReportData.periodSales.$values.map((sale) =>
//               Math.round(sale.totalTickets)
//             ), // Đảm bảo số vé là số nguyên
//             borderColor: colors.success,
//             backgroundColor: colors.success,
//             fill: false,
//             type: "line",
//           },
//           {
//             label: "Tổng doanh thu",
//             data: salesReportData.periodSales.$values.map(
//               (sale) => sale.totalAmount / 1000
//             ),
//             borderColor: colors.warning,
//             backgroundColor: colors.warning,
//             fill: false,
//             type: "line",
//           },
//         ],
//       }
//     : data
//     ? {
//         labels: data.dailyStatistics.map((stat) => stat.day),
//         datasets: [
//           {
//             label: "Tổng số đơn đặt",
//             data: data.dailyStatistics.map((stat) => stat.totalBookings),
//             borderColor: colors.primary,
//             backgroundColor: colors.primary,
//             fill: false,
//             type: "line",
//           },
//           {
//             label: "Tổng số vé",
//             data: data.dailyStatistics.map((stat) =>
//               Math.round(stat.totalTickets)
//             ), // Đảm bảo số vé là số nguyên
//             borderColor: colors.success,
//             backgroundColor: colors.success,
//             fill: false,
//             type: "line",
//           },
//           {
//             label: "Tổng doanh thu",
//             data: data.dailyStatistics.map((stat) => stat.totalRevenue / 1000),
//             borderColor: colors.warning,
//             backgroundColor: colors.warning,
//             fill: false,
//             type: "line",
//           },
//         ],
//       }
//     : {};

//   // Dữ liệu cho biểu đồ Thống kê theo phương thức thanh toán (Pie chart)
//   const paymentChartData = salesReportData
//     ? {
//         labels: salesReportData.periodSales.$values
//           .flatMap((sale) => Object.keys(sale.paymentMethods))
//           .filter((value, index, self) => self.indexOf(value) === index),
//         datasets: [
//           {
//             label: "Doanh thu theo phương thức thanh toán",
//             data: salesReportData.periodSales.$values
//               .flatMap((sale) => Object.keys(sale.paymentMethods))
//               .filter((value, index, self) => self.indexOf(value) === index)
//               .map((method) => {
//                 return (
//                   salesReportData.periodSales.$values.reduce((total, sale) => {
//                     return total + (sale.paymentMethods[method] || 0);
//                   }, 0) / 1000
//                 );
//               }),
//             backgroundColor: [
//               colors.primary,
//               colors.success,
//               colors.danger,
//               colors.warning,
//             ],
//           },
//         ],
//       }
//     : data
//     ? {
//         labels: Object.keys(data.paymentMethodStatistics),
//         datasets: [
//           {
//             label: "Doanh thu theo phương thức thanh toán",
//             data: Object.values(data.paymentMethodStatistics).map(
//               (value) => value / 1000
//             ),
//             backgroundColor: [
//               colors.primary,
//               colors.success,
//               colors.danger,
//               colors.warning,
//             ],
//           },
//         ],
//       }
//     : {};

//   // Dữ liệu cho biểu đồ Thống kê theo phim (Bar chart)
//   const movieChartData = data
//     ? {
//         labels: data.movieStatistics.$values.map((movie) => movie.movieName),
//         datasets: [
//           {
//             label: "Tổng số đơn đặt",
//             data: data.movieStatistics.$values.map(
//               (movie) => movie.totalBookings
//             ),
//             backgroundColor: colors.primary,
//           },
//           {
//             label: "Tổng số vé",
//             data: data.movieStatistics.$values.map((movie) =>
//               Math.round(movie.totalTickets)
//             ), // Đảm bảo số vé là số nguyên
//             backgroundColor: colors.success,
//           },
//           {
//             label: "Tổng doanh thu",
//             data: data.movieStatistics.$values.map(
//               (movie) => movie.totalRevenue / 1000
//             ),
//             backgroundColor: colors.warning,
//           },
//         ],
//       }
//     : {};

//   // Dữ liệu cho biểu đồ Thống kê theo phòng chiếu (Bar chart)
//   const roomChartData = data
//     ? {
//         labels: data.roomStatistics.$values.map((room) => room.roomName),
//         datasets: [
//           {
//             label: "Tổng số đơn đặt",
//             data: data.roomStatistics.$values.map((room) => room.totalBookings),
//             backgroundColor: colors.primary,
//           },
//           {
//             label: "Tổng số vé",
//             data: data.roomStatistics.$values.map((room) =>
//               Math.round(room.totalTickets)
//             ), // Đảm bảo số vé là số nguyên
//             backgroundColor: colors.success,
//           },
//           {
//             label: "Tổng doanh thu",
//             data: data.roomStatistics.$values.map(
//               (room) => room.totalRevenue / 1000
//             ),
//             backgroundColor: colors.warning,
//           },
//         ],
//       }
//     : {};

//   // Dữ liệu cho biểu đồ Hiệu suất nhân viên - Số lượng đơn đặt (Bar chart)
//   const staffBookingsChartData = staffPerformanceData
//     ? {
//         labels: staffPerformanceData.map((staff) => staff.staffName),
//         datasets: [
//           {
//             label: "Tổng số đơn đặt",
//             data: staffPerformanceData.map(
//               (staff) => staff.totalBookingsHandled
//             ),
//             backgroundColor: colors.primary,
//           },
//           {
//             label: "Đơn tại quầy",
//             data: staffPerformanceData.map((staff) => staff.counterBookings),
//             backgroundColor: colors.success,
//           },
//           {
//             label: "Đơn trực tuyến",
//             data: staffPerformanceData.map((staff) => staff.onlineBookings),
//             backgroundColor: colors.danger,
//           },
//         ],
//       }
//     : {};

//   // Dữ liệu cho biểu đồ Hiệu suất nhân viên - Doanh thu (Combo chart: Bar + Line)
//   const staffRevenueChartData = staffPerformanceData
//     ? {
//         labels: staffPerformanceData.map((staff) => staff.staffName),
//         datasets: [
//           {
//             label: "Tổng doanh thu",
//             data: staffPerformanceData.map(
//               (staff) => staff.totalRevenue / 1000
//             ),
//             backgroundColor: colors.warning,
//             type: "bar",
//           },
//           {
//             label: "Doanh thu trung bình mỗi đơn",
//             data: staffPerformanceData.map(
//               (staff) => staff.averageRevenuePerBooking / 1000
//             ),
//             borderColor: colors.success,
//             backgroundColor: colors.success,
//             type: "line",
//             fill: false,
//           },
//         ],
//       }
//     : {};

//   // Dữ liệu cho biểu đồ Xu hướng đơn đặt theo thời gian của nhân viên (Line chart)
//   const staffBookingTrendData = staffPerformanceData
//     ? {
//         labels: salesReportData
//           ? salesReportData.periodSales.$values.map((sale) => sale.periodName)
//           : data
//           ? data.dailyStatistics.map((stat) => stat.day)
//           : [],
//         datasets: staffPerformanceData.map((staff) => {
//           const bookingsByDate = salesReportData
//             ? salesReportData.periodSales.$values.map((sale) => {
//                 const bookingsInPeriod = staff.bookingsData.$values.filter(
//                   (booking) => {
//                     const bookingDate = new Date(
//                       booking.bookingDate
//                     ).toLocaleDateString();
//                     return bookingDate === sale.periodName;
//                   }
//                 );
//                 return bookingsInPeriod.length;
//               })
//             : data
//             ? data.dailyStatistics.map((stat) => {
//                 const bookingsInDay = staff.bookingsData.$values.filter(
//                   (booking) => {
//                     const bookingDate = new Date(
//                       booking.bookingDate
//                     ).toLocaleDateString();
//                     return bookingDate === stat.day;
//                   }
//                 );
//                 return bookingsInDay.length;
//               })
//             : [];
//           return {
//             label: staff.staffName,
//             data: bookingsByDate,
//             borderColor: [
//               colors.primary,
//               colors.success,
//               colors.danger,
//               colors.warning,
//               colors.purple,
//               colors.pink,
//             ][staffPerformanceData.indexOf(staff) % 6],
//             backgroundColor: [
//               colors.primary,
//               colors.success,
//               colors.danger,
//               colors.warning,
//               colors.purple,
//               colors.pink,
//             ][staffPerformanceData.indexOf(staff) % 6],
//             fill: false,
//             type: "line",
//           };
//         }),
//       }
//     : {};

//   // Dữ liệu cho biểu đồ kết hợp Doanh thu và Số vé theo phim (Combo chart: Bar + Line)
//   const movieComboChartData = data
//     ? {
//         labels: data.movieStatistics.$values.map((movie) => movie.movieName),
//         datasets: [
//           {
//             label: "Tổng doanh thu",
//             data: data.movieStatistics.$values.map(
//               (movie) => movie.totalRevenue / 1000
//             ),
//             backgroundColor: colors.warning,
//             type: "bar",
//           },
//           {
//             label: "Tổng số vé",
//             data: data.movieStatistics.$values.map((movie) =>
//               Math.round(movie.totalTickets)
//             ), // Đảm bảo số vé là số nguyên
//             borderColor: colors.success,
//             backgroundColor: colors.success,
//             fill: false,
//             type: "line",
//           },
//         ],
//       }
//     : {};

//   // Tùy chọn chung cho biểu đồ
//   const chartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top",
//         labels: {
//           font: {
//             size: 14,
//             family: "'Roboto', sans-serif",
//           },
//           padding: 10,
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: "Giá trị",
//           font: {
//             size: 14,
//             family: "'Roboto', sans-serif",
//           },
//         },
//         ticks: {
//           font: {
//             size: 12,
//             family: "'Roboto', sans-serif",
//           },
//         },
//       },
//       x: {
//         ticks: {
//           font: {
//             size: 12,
//             family: "'Roboto', sans-serif",
//           },
//         },
//       },
//     },
//   };

//   // Tùy chọn cho biểu đồ tròn (Pie chart)
//   const pieChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: "top",
//         labels: {
//           font: {
//             size: 14,
//             family: "'Roboto', sans-serif",
//           },
//           padding: 10,
//         },
//       },
//     },
//   };

//   // Style cho Card chứa số liệu tổng hợp
//   const summaryCardStyle = {
//     textAlign: "center",
//     borderRadius: "8px",
//     border: "none",
//     backgroundColor: "#fff",
//     padding: "10px",
//   };

//   // Style cho Card chứa biểu đồ
//   const chartCardStyle = {
//     borderRadius: "10px",
//     border: `1px solid ${colors.border}`,
//     backgroundColor: "#fff",
//   };

//   return (
//     <div
//       style={{
//         padding: "30px",
//         maxWidth: "1200px",
//         margin: "80px auto",
//         backgroundColor: colors.background,
//       }}
//     >
//       <Title
//         level={2}
//         style={{
//           textAlign: "center",
//           marginBottom: "30px",
//           color: "#1f1f1f",
//           fontFamily: "'Roboto', sans-serif",
//           fontWeight: 600,
//         }}
//       >
//         Thống kê đặt chỗ
//       </Title>

//       {/* Form để xuất file Excel */}
//       <Form
//         form={form}
//         layout="inline"
//         style={{ marginBottom: "30px", justifyContent: "center" }}
//       >
//         <Form.Item name="dateRange" label="Chọn khoảng thời gian">
//           <RangePicker
//             format="YYYY-MM-DD"
//             placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
//           />
//         </Form.Item>
//         <Form.Item name="period" label="Chu kỳ" initialValue="daily">
//           <Select style={{ width: 120 }}>
//             <Option value="daily">Hàng ngày</Option>
//             <Option value="weekly">Hàng tuần</Option>
//             <Option value="monthly">Hàng tháng</Option>
//           </Select>
//         </Form.Item>
//         <Form.Item name="format" label="Định dạng" initialValue="excel">
//           <Select style={{ width: 120 }}>
//             <Option value="excel">Excel</Option>
//           </Select>
//         </Form.Item>
//         <Form.Item name="staffId" label="Nhân viên">
//           <Select style={{ width: 150 }} allowClear>
//             {staffPerformanceData &&
//               staffPerformanceData.map((staff) => (
//                 <Option key={staff.staffId} value={staff.staffId}>
//                   {staff.staffName}
//                 </Option>
//               ))}
//           </Select>
//         </Form.Item>
//         <Form.Item>
//           <Button
//             type="primary"
//             onClick={() => handleExportSalesReportExcel()}
//             loading={exportLoading}
//             style={{ marginRight: 8 }}
//           >
//             Xuất Excel của Sales Report
//           </Button>
//           <Button
//             type="primary"
//             onClick={() => handleExportBookingStatisticsExcel()}
//             loading={exportLoading}
//             style={{ marginRight: 8 }}
//           >
//             Xuất Excel của Booking Statistics
//           </Button>
//           <Button
//             type="primary"
//             onClick={() => handleExportStaffPerformanceExcel()}
//             loading={exportLoading}
//             style={{ marginRight: 8 }}
//           >
//             Xuất Excel của Staff Performance
//           </Button>
//           <Button onClick={handleClearForm}>Xóa</Button>
//         </Form.Item>
//       </Form>

//       {/* Phần thông tin tổng hợp */}
//       <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
//         <Col span={4}>
//           <Card
//             style={summaryCardStyle}
//             bodyStyle={{
//               backgroundColor: "#e6f7ff",
//               borderRadius: "8px",
//               padding: "10px",
//             }}
//           >
//             <Title
//               level={5}
//               style={{
//                 marginBottom: "5px",
//                 color: colors.primary,
//                 fontSize: "14px",
//               }}
//             >
//               Tổng số đơn đặt
//             </Title>
//             <Text strong style={{ fontSize: "20px", color: colors.primary }}>
//               {totalBookings}
//             </Text>
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card
//             style={summaryCardStyle}
//             bodyStyle={{
//               backgroundColor: "#f6ffed",
//               borderRadius: "8px",
//               padding: "10px",
//             }}
//           >
//             <Title
//               level={5}
//               style={{
//                 marginBottom: "5px",
//                 color: colors.success,
//                 fontSize: "14px",
//               }}
//             >
//               Tổng số vé
//             </Title>
//             <Text strong style={{ fontSize: "20px", color: colors.success }}>
//               {totalTickets}
//             </Text>
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card
//             style={summaryCardStyle}
//             bodyStyle={{
//               backgroundColor: "#fffbe6",
//               borderRadius: "8px",
//               padding: "10px",
//             }}
//           >
//             <Title
//               level={5}
//               style={{
//                 marginBottom: "5px",
//                 color: colors.warning,
//                 fontSize: "14px",
//               }}
//             >
//               Tổng doanh thu
//             </Title>
//             <Text
//               strong
//               style={{
//                 fontSize: "18px",
//                 color: colors.warning,
//                 whiteSpace: "nowrap", // Ngăn tràn xuống dòng
//               }}
//             >
//               {totalRevenue} (x1000 VND)
//             </Text>
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card
//             style={summaryCardStyle}
//             bodyStyle={{
//               backgroundColor: "#f9f0ff",
//               borderRadius: "8px",
//               padding: "10px",
//             }}
//           >
//             <Title
//               level={5}
//               style={{
//                 marginBottom: "5px",
//                 color: colors.purple,
//                 fontSize: "14px",
//               }}
//             >
//               Số lượng nhân viên
//             </Title>
//             <Text strong style={{ fontSize: "20px", color: colors.purple }}>
//               {totalStaff}
//             </Text>
//           </Card>
//         </Col>
//         <Col span={4}>
//           <Card
//             style={summaryCardStyle}
//             bodyStyle={{
//               backgroundColor: "#fff0f6",
//               borderRadius: "8px",
//               padding: "10px",
//             }}
//           >
//             <Title
//               level={5}
//               style={{
//                 marginBottom: "5px",
//                 color: colors.pink,
//                 fontSize: "14px",
//               }}
//             >
//               Đơn đặt được xử lý
//             </Title>
//             <Text strong style={{ fontSize: "20px", color: colors.pink }}>
//               {totalBookingsHandled}
//             </Text>
//           </Card>
//         </Col>
//       </Row>

//       {loading && (
//         <div style={{ textAlign: "center", padding: "50px" }}>
//           <Spin size="large" />
//         </div>
//       )}

//       {salesReportData || data || staffPerformanceData ? (
//         <>
//           {/* Biểu đồ Hiệu suất nhân viên - Số lượng đơn đặt và Doanh thu trong cùng một Row */}
//           {staffPerformanceData && (
//             <Row gutter={[16, 16]} style={{ marginBottom: "40px" }}>
//               <Col span={12}>
//                 <Title
//                   level={3}
//                   style={{
//                     marginBottom: "20px",
//                     color: "#1f1f1f",
//                     fontWeight: 500,
//                   }}
//                 >
//                   Hiệu suất nhân viên - Số lượng đơn đặt
//                 </Title>
//                 <Card style={chartCardStyle}>
//                   <Bar data={staffBookingsChartData} options={chartOptions} />
//                 </Card>
//               </Col>
//               <Col span={12}>
//                 <Title
//                   level={3}
//                   style={{
//                     marginBottom: "20px",
//                     color: "#1f1f1f",
//                     fontWeight: 500,
//                   }}
//                 >
//                   Hiệu suất nhân viên - Doanh thu
//                 </Title>
//                 <Card style={chartCardStyle}>
//                   <Bar data={staffRevenueChartData} options={chartOptions} />
//                 </Card>
//               </Col>
//             </Row>
//           )}

//           {/* Biểu đồ Xu hướng đơn đặt theo thời gian của nhân viên và Doanh thu + Số vé theo phim trong cùng một Row */}
//           {(staffPerformanceData || data) && (
//             <Row gutter={[16, 16]} style={{ marginBottom: "40px" }}>
//               {staffPerformanceData && (
//                 <Col span={12}>
//                   <Title
//                     level={3}
//                     style={{
//                       marginBottom: "20px",
//                       color: "#1f1f1f",
//                       fontWeight: 500,
//                     }}
//                   >
//                     Xu hướng đơn đặt theo thời gian của nhân viên
//                   </Title>
//                   <Card style={chartCardStyle}>
//                     <Line data={staffBookingTrendData} options={chartOptions} />
//                   </Card>
//                 </Col>
//               )}
//               {data && (
//                 <Col span={12}>
//                   <Title
//                     level={3}
//                     style={{
//                       marginBottom: "20px",
//                       color: "#1f1f1f",
//                       fontWeight: 500,
//                     }}
//                   >
//                     Doanh thu và số vé theo phim
//                   </Title>
//                   <Card style={chartCardStyle}>
//                     <Bar data={movieComboChartData} options={chartOptions} />
//                   </Card>
//                 </Col>
//               )}
//             </Row>
//           )}

//           {/* Biểu đồ Thống kê theo phim và Thống kê theo phòng chiếu trong cùng một Row */}
//           {data && (
//             <Row gutter={[16, 16]} style={{ marginBottom: "40px" }}>
//               <Col span={12}>
//                 <Title
//                   level={3}
//                   style={{
//                     marginBottom: "20px",
//                     color: "#1f1f1f",
//                     fontWeight: 500,
//                   }}
//                 >
//                   Thống kê theo phim
//                 </Title>
//                 <Card style={chartCardStyle}>
//                   <Bar data={movieChartData} options={chartOptions} />
//                 </Card>
//               </Col>
//               <Col span={12}>
//                 <Title
//                   level={3}
//                   style={{
//                     marginBottom: "20px",
//                     color: "#1f1f1f",
//                     fontWeight: 500,
//                   }}
//                 >
//                   Thống kê theo phòng chiếu
//                 </Title>
//                 <Card style={chartCardStyle}>
//                   <Bar data={roomChartData} options={chartOptions} />
//                 </Card>
//               </Col>
//             </Row>
//           )}

//           {/* Biểu đồ Tổng quan và Thống kê theo khoảng thời gian trong cùng một Row */}
//           <Row gutter={[16, 16]} style={{ marginBottom: "40px" }}>
//             <Col span={12}>
//               <Title
//                 level={3}
//                 style={{
//                   marginBottom: "20px",
//                   color: "#1f1f1f",
//                   fontWeight: 500,
//                 }}
//               >
//                 Thống kê tổng quan
//               </Title>
//               <Card style={chartCardStyle}>
//                 <Bar data={overviewChartData} options={chartOptions} />
//               </Card>
//             </Col>
//             <Col span={12}>
//               <Title
//                 level={3}
//                 style={{
//                   marginBottom: "20px",
//                   color: "#1f1f1f",
//                   fontWeight: 500,
//                 }}
//               >
//                 Thống kê theo{" "}
//                 {salesReportData ? salesReportData.period : "ngày"}
//               </Title>
//               <Card style={chartCardStyle}>
//                 <Line data={periodChartData} options={chartOptions} />
//               </Card>
//             </Col>
//           </Row>

//           {/* Biểu đồ Thống kê theo phương thức thanh toán */}
//           <Row gutter={[16, 16]} style={{ marginBottom: "40px" }}>
//             <Col
//               span={24}
//               style={{ display: "flex", justifyContent: "center" }}
//             >
//               <div style={{ width: "600px" }}>
//                 <Title
//                   level={3}
//                   style={{
//                     marginBottom: "20px",
//                     textAlign: "center",
//                     color: "#1f1f1f",
//                     fontWeight: 500,
//                   }}
//                 >
//                   Thống kê theo phương thức thanh toán
//                 </Title>
//                 <Card style={chartCardStyle}>
//                   <Pie data={paymentChartData} options={pieChartOptions} />
//                 </Card>
//               </div>
//             </Col>
//           </Row>
//         </>
//       ) : (
//         !loading && (
//           <p style={{ textAlign: "center", color: "red" }}>
//             Không có dữ liệu hoặc đã xảy ra lỗi.
//           </p>
//         )
//       )}
//       <ToastContainer />
//     </div>
//   );
// };

// export default StatisticsPage;

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  message,
  Form,
  DatePicker,
  Select,
  Button,
} from "antd";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
} from "chart.js";
import moment from "moment";
import * as XLSX from "xlsx";
import {
  FileExcelOutlined,
  BarChartOutlined,
  TeamOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Enhanced color palette
const colors = {
  primary: "#2a6ac9", // Richer blue
  secondary: "#5a8dee", // Lighter blue
  success: "#28c76f", // Vibrant green
  danger: "#ea5455", // Bright red
  warning: "#ff9f43", // Warm orange
  purple: "#7367f0", // Bright purple
  pink: "#f66d9b", // Soft pink
  teal: "#00cfe8", // Teal accent
  dark: "#1e2830", // Near black
  light: "#f8f8f8", // Off-white
  background: "#f8fbff", // Light blue background
  cardBg: "#ffffff", // Card background
  border: "#e8e8e8", // Subtle border
  text: "#4a4a4a", // Dark text
  textLight: "#8a8a8a", // Light text
  hoverShadow: "0 8px 25px rgba(42, 106, 201, 0.15)", // Enhanced shadow
};

// Chart gradient helpers
const getGradient = (ctx, chartArea, startColor, endColor) => {
  if (!ctx || !chartArea) return startColor;
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
};

const StatisticsPage = () => {
  const [data, setData] = useState(null);
  const [salesReportData, setSalesReportData] = useState(null);
  const [staffPerformanceData, setStaffPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const getRole = () => {
    return localStorage.getItem("role") || sessionStorage.getItem("role");
  };

  useEffect(() => {
    const role = getRole();
    if (role !== "Admin") {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate("/");
    } else {
      fetchSalesReport();
    }
  }, [navigate]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
      }

      const response = await axios.get(
        "https://localhost:7168/api/BookingStatistics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
          },
        }
      );

      if (response.data && Object.keys(response.data).length > 0) {
        const dailyStatsArray = Object.values(
          response.data.dailyStatistics
        ).map((stat) => ({
          day: stat.day,
          totalBookings: stat.totalBookings,
          totalTickets: stat.totalTickets,
          totalRevenue: stat.totalRevenue,
        }));

        setData({
          ...response.data,
          dailyStatistics: dailyStatsArray,
        });
      } else {
        throw new Error("Không có dữ liệu từ BookingStatistics.");
      }
    } catch (error) {
      console.error("Lỗi khi lấy thống kê BookingStatistics:", error.message);
      message.error(error.message || "Đã xảy ra lỗi khi lấy dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
      }

      const response = await axios.get(
        "https://localhost:7168/api/SalesReport",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
          },
        }
      );

      console.log("Phản hồi từ SalesReport:", response.data);

      if (response.data && Object.keys(response.data).length > 0) {
        setSalesReportData(response.data);
        fetchStatistics();
        fetchStaffPerformance();
      } else {
        throw new Error("Không có dữ liệu từ SalesReport.");
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu SalesReport:", error.message);
      message.error(
        error.message || "Đã xảy ra lỗi khi lấy dữ liệu SalesReport."
      );
      fetchStatistics();
      fetchStaffPerformance();
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffPerformance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
      }

      const response = await axios.get(
        "https://localhost:7168/api/StaffPerformance",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "*/*",
          },
        }
      );

      console.log("Phản hồi từ StaffPerformance:", response.data);

      if (
        response.data &&
        response.data.$values &&
        response.data.$values.length > 0
      ) {
        setStaffPerformanceData(response.data.$values);
      } else {
        throw new Error("Không có dữ liệu từ StaffPerformance.");
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu StaffPerformance:", error.message);
      message.error(
        error.message || "Đã xảy ra lỗi khi lấy dữ liệu StaffPerformance."
      );
    } finally {
      setLoading(false);
    }
  };

  // Data preparation functions for Excel export
  const prepareSalesReportExportData = () => {
    // ... existing code ...
    if (!salesReportData) {
      return [];
    }

    const exportData = [];

    // Thêm thông tin tổng quan
    exportData.push({
      "Tiêu đề": "Thống kê tổng quan",
      "Tổng số đơn đặt": salesReportData.totalBookings,
      "Tổng số vé": Math.round(salesReportData.totalTickets),
      "Tổng doanh thu (VND)": salesReportData.totalAmount,
    });

    // Thêm khoảng trống
    exportData.push({});

    // Thêm thông tin theo khoảng thời gian (periodSales)
    exportData.push({
      "Tiêu đề": `Thống kê theo ${salesReportData.period || "ngày"}`,
    });

    salesReportData.periodSales.$values.forEach((sale) => {
      const paymentMethods = Object.entries(sale.paymentMethods)
        .map(([method, amount]) => `${method}: ${amount}`)
        .join(", ");

      exportData.push({
        "Tên khoảng thời gian": sale.periodName,
        "Tổng số đơn đặt": sale.totalBookings,
        "Tổng số vé": Math.round(sale.totalTickets),
        "Tổng doanh thu (VND)": sale.totalAmount,
        "Phương thức thanh toán": paymentMethods,
      });
    });

    return exportData;
  };

  const prepareBookingStatisticsExportData = () => {
    // ... existing code ...
    if (!data) {
      return [];
    }

    const exportData = [];

    // Thêm thông tin tổng quan
    exportData.push({
      "Tiêu đề": "Thống kê đặt vé tổng quan",
      "Tổng số đơn đặt": data.totalBookings,
      "Tổng số đơn xác nhận": data.confirmedBookings,
      "Tổng số đơn hủy": data.cancelledBookings,
      "Tổng doanh thu (VND)": data.totalRevenue,
      "Số vé trung bình mỗi đơn": data.averageTicketsPerBooking,
    });

    // Thêm khoảng trống
    exportData.push({});

    // Thêm thông tin theo ngày (dailyStatistics)
    exportData.push({
      "Tiêu đề": "Thống kê đặt vé theo ngày",
    });

    // Convert dailyStatistics object values to array
    const dailyStatsArray = Object.values(data.dailyStatistics).filter(
      (stat) => typeof stat === "object" && stat.day // Ensure it's a stat object with a day property
    );

    dailyStatsArray.forEach((stat) => {
      exportData.push({
        Ngày: stat.day,
        "Tổng số đơn đặt": stat.totalBookings,
        "Tổng số vé": Math.round(stat.totalTickets),
        "Tổng doanh thu (VND)": stat.totalRevenue,
      });
    });

    // Thêm khoảng trống
    exportData.push({});

    // Thêm thông tin theo phim (movieStatistics)
    exportData.push({
      "Tiêu đề": "Thống kê đặt vé theo phim",
    });

    data.movieStatistics.$values.forEach((movie) => {
      exportData.push({
        "Tên phim": movie.movieName,
        "Tổng số đơn đặt": movie.totalBookings,
        "Tổng số vé": Math.round(movie.totalTickets),
        "Tổng doanh thu (VND)": movie.totalRevenue,
      });
    });

    // Thêm khoảng trống
    exportData.push({});

    // Thêm thông tin theo phòng chiếu (roomStatistics)
    exportData.push({
      "Tiêu đề": "Thống kê đặt vé theo phòng chiếu",
    });

    data.roomStatistics.$values.forEach((room) => {
      exportData.push({
        "Tên phòng chiếu": room.roomName,
        "Tổng số đơn đặt": room.totalBookings,
        "Tổng số vé": Math.round(room.totalTickets),
        "Tổng doanh thu (VND)": room.totalRevenue,
      });
    });

    // Thêm khoảng trống
    exportData.push({});

    // Thêm thông tin theo phương thức thanh toán (paymentMethodStatistics)
    exportData.push({
      "Tiêu đề": "Thống kê theo phương thức thanh toán",
    });

    Object.entries(data.paymentMethodStatistics).forEach(([method, amount]) => {
      exportData.push({
        "Phương thức thanh toán": method,
        "Tổng doanh thu (VND)": amount,
      });
    });

    return exportData;
  };

  const prepareStaffPerformanceExportData = () => {
    // ... existing code ...
    if (!staffPerformanceData) {
      return [];
    }

    const exportData = [];

    // Thêm thông tin hiệu suất nhân viên
    exportData.push({
      "Tiêu đề": "Hiệu suất nhân viên",
    });

    staffPerformanceData.forEach((staff) => {
      exportData.push({
        "Tên nhân viên": staff.staffName,
        "Tổng số đơn đặt": staff.totalBookingsHandled,
        "Đơn tại quầy": staff.counterBookings,
        "Đơn trực tuyến": staff.onlineBookings,
        "Tổng doanh thu (VND)": staff.totalRevenue,
        "Doanh thu trung bình mỗi đơn (VND)": staff.averageRevenuePerBooking,
      });
    });

    return exportData;
  };

  // Excel export handlers
  const handleExportSalesReportExcel = () => {
    setExportLoading(true);
    try {
      if (!salesReportData) {
        message.warning("Không có dữ liệu Sales Report để xuất.");
        return;
      }

      const exportData = prepareSalesReportExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SalesReport");
      XLSX.writeFile(
        workbook,
        `SalesReport-${moment().format("DD-MM-YYYY")}.xlsx`
      );
      message.success("Xuất Excel của Sales Report thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error.message);
      message.error(error.message || "Đã xảy ra lỗi khi xuất file Excel.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportBookingStatisticsExcel = () => {
    setExportLoading(true);
    try {
      if (!data) {
        message.warning("Không có dữ liệu Booking Statistics để xuất.");
        return;
      }

      const exportData = prepareBookingStatisticsExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "BookingStatistics");
      XLSX.writeFile(
        workbook,
        `BookingStatistics-${moment().format("DD-MM-YYYY")}.xlsx`
      );
      message.success("Xuất Excel của Booking Statistics thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error.message);
      message.error(error.message || "Đã xảy ra lỗi khi xuất file Excel.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportStaffPerformanceExcel = () => {
    setExportLoading(true);
    try {
      if (!staffPerformanceData) {
        message.warning("Không có dữ liệu Staff Performance để xuất.");
        return;
      }

      const exportData = prepareStaffPerformanceExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "StaffPerformance");
      XLSX.writeFile(
        workbook,
        `StaffPerformance-${moment().format("DD-MM-YYYY")}.xlsx`
      );
      message.success("Xuất Excel của Staff Performance thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error.message);
      message.error(error.message || "Đã xảy ra lỗi khi xuất file Excel.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearForm = () => {
    form.resetFields();
  };

  // Calculate summary data
  const totalBookings = salesReportData
    ? salesReportData.totalBookings
    : data
    ? data.totalBookings
    : 0;

  const totalTickets = salesReportData
    ? Math.round(salesReportData.totalTickets)
    : data
    ? Math.round(data.totalTickets)
    : 0;

  const totalRevenue = salesReportData
    ? (salesReportData.totalAmount / 1000).toFixed(2)
    : data
    ? (data.totalRevenue / 1000).toFixed(2)
    : 0;

  const totalStaff = staffPerformanceData ? staffPerformanceData.length : 0;

  const totalBookingsHandled = staffPerformanceData
    ? staffPerformanceData.reduce(
        (total, staff) => total + staff.totalBookingsHandled,
        0
      )
    : 0;

  // Enhanced chart data with gradients and animations
  const chartPlugin = {
    id: 'chartGradient',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      
      chart.data.datasets.forEach((dataset, i) => {
        if (dataset.type === 'bar' && dataset.backgroundColor && !Array.isArray(dataset.backgroundColor)) {
          const gradient = getGradient(
            ctx, 
            chartArea, 
            dataset.backgroundColor,
            dataset.backgroundColor + '60' // Add transparency
          );
          dataset.backgroundColor = gradient;
        }
      });
    }
  };

  // Base chart data configurations with enhanced styling
  const overviewChartData =
    salesReportData || data
      ? {
          labels: ["Tổng số đơn đặt", "Tổng số vé", "Tổng doanh thu"],
          datasets: [
            {
              label: "Thống kê tổng quan",
              data: salesReportData
                ? [
                    salesReportData.totalBookings,
                    Math.round(salesReportData.totalTickets),
                    salesReportData.totalAmount / 1000,
                  ]
                : [
                    data.totalBookings,
                    Math.round(data.totalTickets),
                    data.totalRevenue / 1000,
                  ],
              backgroundColor: [colors.primary, colors.success, colors.warning],
              borderRadius: 6,
              barThickness: 40,
            },
          ],
        }
      : {};

  const periodChartData = salesReportData
    ? {
        labels: salesReportData.periodSales.$values.map(
          (sale) => sale.periodName
        ),
        datasets: [
          {
            label: "Tổng số đơn đặt",
            data: salesReportData.periodSales.$values.map(
              (sale) => sale.totalBookings
            ),
            borderColor: colors.primary,
            backgroundColor: colors.primary + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.cardBg,
            pointBorderColor: colors.primary,
            pointBorderWidth: 2,
          },
          {
            label: "Tổng số vé",
            data: salesReportData.periodSales.$values.map((sale) =>
              Math.round(sale.totalTickets)
            ),
            borderColor: colors.success,
            backgroundColor: colors.success + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.cardBg,
            pointBorderColor: colors.success,
            pointBorderWidth: 2,
          },
          {
            label: "Tổng doanh thu",
            data: salesReportData.periodSales.$values.map(
              (sale) => sale.totalAmount / 1000
            ),
            borderColor: colors.warning,
            backgroundColor: colors.warning + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.cardBg,
            pointBorderColor: colors.warning,
            pointBorderWidth: 2,
          },
        ],
      }
    : data
    ? {
        labels: data.dailyStatistics.map((stat) => stat.day),
        datasets: [
          {
            label: "Tổng số đơn đặt",
            data: data.dailyStatistics.map((stat) => stat.totalBookings),
            borderColor: colors.primary,
            backgroundColor: colors.primary + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.cardBg,
            pointBorderColor: colors.primary,
            pointBorderWidth: 2,
          },
          {
            label: "Tổng số vé",
            data: data.dailyStatistics.map((stat) =>
              Math.round(stat.totalTickets)
            ),
            borderColor: colors.success,
            backgroundColor: colors.success + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.cardBg,
            pointBorderColor: colors.success,
            pointBorderWidth: 2,
          },
          {
            label: "Tổng doanh thu",
            data: data.dailyStatistics.map((stat) => stat.totalRevenue / 1000),
            borderColor: colors.warning,
            backgroundColor: colors.warning + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.cardBg,
            pointBorderColor: colors.warning,
            pointBorderWidth: 2,
          },
        ],
      }
    : {};

  const paymentChartData = salesReportData
    ? {
        labels: salesReportData.periodSales.$values
          .flatMap((sale) => Object.keys(sale.paymentMethods))
          .filter((value, index, self) => self.indexOf(value) === index),
        datasets: [
          {
            label: "Doanh thu theo phương thức thanh toán",
            data: salesReportData.periodSales.$values
              .flatMap((sale) => Object.keys(sale.paymentMethods))
              .filter((value, index, self) => self.indexOf(value) === index)
              .map((method) => {
                return (
                  salesReportData.periodSales.$values.reduce((total, sale) => {
                    return total + (sale.paymentMethods[method] || 0);
                  }, 0) / 1000
                );
              }),
            backgroundColor: [
              colors.primary,
              colors.success,
              colors.danger,
              colors.warning,
              colors.purple,
              colors.teal,
            ],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      }
    : data
    ? {
        labels: Object.keys(data.paymentMethodStatistics),
        datasets: [
          {
            label: "Doanh thu theo phương thức thanh toán",
            data: Object.values(data.paymentMethodStatistics).map(
              (value) => value / 1000
            ),
            backgroundColor: [
              colors.primary,
              colors.success,
              colors.danger,
              colors.warning,
              colors.purple,
              colors.teal,
            ],
            borderWidth: 0,
            hoverOffset: 10,
          },
        ],
      }
    : {};

  const movieChartData = data
    ? {
        labels: data.movieStatistics.$values.map((movie) => movie.movieName),
        datasets: [
          {
            label: "Tổng số đơn đặt",
            data: data.movieStatistics.$values.map(
              (movie) => movie.totalBookings
            ),
            backgroundColor: colors.primary,
            borderRadius: 6,
            barThickness: 20,
          },
          {
            label: "Tổng số vé",
            data: data.movieStatistics.$values.map((movie) =>
              Math.round(movie.totalTickets)
            ),
            backgroundColor: colors.success,
            borderRadius: 6,
            barThickness: 20,
          },
          {
            label: "Tổng doanh thu",
            data: data.movieStatistics.$values.map(
              (movie) => movie.totalRevenue / 1000
            ),
            backgroundColor: colors.warning,
            borderRadius: 6,
            barThickness: 20,
          },
        ],
      }
    : {};

  const roomChartData = data
    ? {
        labels: data.roomStatistics.$values.map((room) => room.roomName),
        datasets: [
          {
            label: "Tổng số đơn đặt",
            data: data.roomStatistics.$values.map((room) => room.totalBookings),
            backgroundColor: colors.primary,
            borderRadius: 6,
            barThickness: 20,
          },
          {
            label: "Tổng số vé",
            data: data.roomStatistics.$values.map((room) =>
              Math.round(room.totalTickets)
            ),
            backgroundColor: colors.success,
            borderRadius: 6,
            barThickness: 20,
          },
          {
            label: "Tổng doanh thu",
            data: data.roomStatistics.$values.map(
              (room) => room.totalRevenue / 1000
            ),
            backgroundColor: colors.warning,
            borderRadius: 6,
            barThickness: 20,
          },
        ],
      }
    : {};

  const staffBookingsChartData = staffPerformanceData
    ? {
        labels: staffPerformanceData.map((staff) => staff.staffName),
        datasets: [
          {
            label: "Tổng số đơn đặt",
            data: staffPerformanceData.map(
              (staff) => staff.totalBookingsHandled
            ),
            backgroundColor: colors.primary,
            borderRadius: 6,
            barThickness: 16,
          },
          {
            label: "Đơn tại quầy",
            data: staffPerformanceData.map((staff) => staff.counterBookings),
            backgroundColor: colors.success,
            borderRadius: 6,
            barThickness: 16,
          },
          {
            label: "Đơn trực tuyến",
            data: staffPerformanceData.map((staff) => staff.onlineBookings),
            backgroundColor: colors.danger,
            borderRadius: 6,
            barThickness: 16,
          },
        ],
      }
    : {};

  const staffRevenueChartData = staffPerformanceData
    ? {
        labels: staffPerformanceData.map((staff) => staff.staffName),
        datasets: [
          {
            label: "Tổng doanh thu",
            data: staffPerformanceData.map(
              (staff) => staff.totalRevenue / 1000
            ),
            backgroundColor: colors.warning,
            borderRadius: 6,
            barThickness: 30,
            type: "bar",
          },
          {
            label: "Doanh thu trung bình mỗi đơn",
            data: staffPerformanceData.map(
              (staff) => staff.averageRevenuePerBooking / 1000
            ),
            borderColor: colors.teal,
            backgroundColor: colors.teal,
            borderWidth: 2,
            pointStyle: 'rectRounded',
            pointRadius: 5,
            pointHoverRadius: 8,
            tension: 0.4,
            type: "line",
          },
        ],
      }
    : {};

  // Additional enhanced chart: Staff Booking Trend with smooth lines
  const staffBookingTrendData = staffPerformanceData
    ? {
        labels: salesReportData
          ? salesReportData.periodSales.$values.map((sale) => sale.periodName)
          : data
          ? data.dailyStatistics.map((stat) => stat.day)
          : [],
        datasets: staffPerformanceData.map((staff, index) => {
          const bookingsByDate = salesReportData
            ? salesReportData.periodSales.$values.map((sale) => {
                const bookingsInPeriod = staff.bookingsData.$values.filter(
                  (booking) => {
                    const bookingDate = new Date(
                      booking.bookingDate
                    ).toLocaleDateString();
                    return bookingDate === sale.periodName;
                  }
                );
                return bookingsInPeriod.length;
              })
            : data
            ? data.dailyStatistics.map((stat) => {
                const bookingsInDay = staff.bookingsData.$values.filter(
                  (booking) => {
                    const bookingDate = new Date(
                      booking.bookingDate
                    ).toLocaleDateString();
                    return bookingDate === stat.day;
                  }
                );
                return bookingsInDay.length;
              })
            : [];
            
          // Color array for staff lines
          const colorArray = [
            colors.primary,
            colors.success,
            colors.danger,
            colors.warning,
            colors.purple,
            colors.teal
          ];
          const staffColor = colorArray[index % colorArray.length];
            
          return {
            label: staff.staffName,
            data: bookingsByDate,
            borderColor: staffColor,
            backgroundColor: staffColor + '20',
            fill: false,
            tension: 0.4, // For smooth curves
            pointStyle: 'circle',
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.light,
            pointBorderColor: staffColor,
            pointBorderWidth: 2,
          };
        }),
      }
    : {};

  // Enhanced combined chart for movies: revenue and tickets
  const movieComboChartData = data
    ? {
        labels: data.movieStatistics.$values.map((movie) => movie.movieName),
        datasets: [
          {
            label: "Tổng doanh thu",
            data: data.movieStatistics.$values.map(
              (movie) => movie.totalRevenue / 1000
            ),
            backgroundColor: colors.warning,
            borderRadius: 6,
            barThickness: 40,
            type: "bar",
            yAxisID: 'y',
          },
          {
            label: "Tổng số vé",
            data: data.movieStatistics.$values.map((movie) =>
              Math.round(movie.totalTickets)
            ),
            borderColor: colors.teal,
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointStyle: 'rectRot',
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: colors.light,
            pointBorderColor: colors.teal,
            pointBorderWidth: 2,
            tension: 0.3,
            type: "line",
            yAxisID: 'y1',
          },
        ],
      }
    : {};

  // Enhanced chart options with modern styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "start",
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 13,
            family: "'Roboto', 'Segoe UI', sans-serif",
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: colors.dark + 'f0',
        titleFont: {
          size: 14,
          family: "'Roboto', sans-serif",
          weight: '600',
        },
        bodyFont: {
          size: 13,
          family: "'Roboto', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 3,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: colors.border + '40',
        },
        ticks: {
          font: {
            size: 12,
            family: "'Roboto', 'Segoe UI', sans-serif",
          },
          color: colors.textLight,
          padding: 10,
        },
        border: {
          dash: [4, 4],
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Roboto', 'Segoe UI', sans-serif",
          },
          color: colors.textLight,
          padding: 10,
        },
        border: {
          dash: [4, 4],
        }
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  // Special options for pie charts
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        align: "center",
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 13,
            family: "'Roboto', 'Segoe UI', sans-serif",
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: colors.dark + 'f0',
        titleFont: {
          size: 14,
          family: "'Roboto', sans-serif",
          weight: '600',
        },
        bodyFont: {
          size: 13,
          family: "'Roboto', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart',
    },
    cutout: '65%',
  };

  // Special options for combined charts with dual axis
  const comboChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        position: 'left',
        title: {
          display: true,
          text: 'Doanh thu (x1000 VND)',
          font: {
            size: 13,
            family: "'Roboto', 'Segoe UI', sans-serif",
          },
          color: colors.warning,
        },
        grid: {
          drawBorder: false,
          color: colors.border + '40',
        },
        ticks: {
          font: {
            size: 12,
            family: "'Roboto', 'Segoe UI', sans-serif",
          },
          color: colors.textLight,
          padding: 10,
        },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: 'Số lượng vé',
          font: {
            size: 13,
            family: "'Roboto', 'Segoe UI', sans-serif",
          },
          color: colors.teal,
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Roboto', 'Segoe UI', sans-serif",
          },
          color: colors.teal,
          padding: 10,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
            family: "'Roboto', 'Segoe UI', sans-serif",
          },
          color: colors.textLight,
          padding: 10,
        },
      },
    },
  };

  // Enhanced modern styling for components
  const pageStyle = {
    padding: "40px",
    maxWidth: "1400px",
    margin: "80px auto",
    backgroundColor: colors.background,
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
  };

  const titleStyle = {
    textAlign: "center",
    marginBottom: "30px",
    color: colors.dark,
    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
    fontWeight: 600,
    position: "relative",
    display: "inline-block",
    left: "50%",
    transform: "translateX(-50%)",
  };

  const formStyle = {
    marginBottom: "40px",
    padding: "20px",
    backgroundColor: colors.cardBg,
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
  };

  // Card styles with modern design
  const summaryCardStyle = {
    textAlign: "center",
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
    transition: "transform 0.3s, box-shadow 0.3s",
    height: "100%",
    cursor: "pointer",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: colors.hoverShadow,
    },
  };

  const chartCardStyle = {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
    backgroundColor: colors.cardBg,
    marginBottom: "20px",
    overflow: "hidden",
    height: "100%",
    transition: "transform 0.3s, box-shadow 0.3s",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: colors.hoverShadow,
    },
  };

  const chartContainerStyle = {
    padding: "10px",
    height: "350px",
  };

  // Custom button styles for a modern look
  const primaryButtonStyle = {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: "8px",
    fontWeight: 500,
    height: "40px",
    paddingLeft: "16px",
    paddingRight: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(42, 106, 201, 0.15)",
    transition: "all 0.3s",
    ":hover": {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
      transform: "translateY(-2px)",
      boxShadow: "0 6px 15px rgba(42, 106, 201, 0.25)",
    },
  };

  return (
    <div style={pageStyle}>
      <div style={{ position: "relative", textAlign: "center" }}>
        <Title
          level={2}
          style={titleStyle}
        >
          <BarChartOutlined style={{ marginRight: "10px", color: colors.primary }} />
          Thống kê đặt chỗ
        </Title>
        <Paragraph style={{ 
          textAlign: "center", 
          color: colors.textLight, 
          marginTop: "-15px", 
          marginBottom: "30px",
          fontFamily: "'Roboto', 'Segoe UI', sans-serif",
        }}>
          Báo cáo tổng hợp về tình hình đặt vé và doanh thu
        </Paragraph>
      </div>

      {/* Enhanced Form with better styling */}
      <Form
        form={form}
        layout="horizontal"
        style={formStyle}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={24} md={6} lg={6}>
            <Form.Item name="dateRange" label="Khoảng thời gian" labelCol={{ span: 24 }}>
              <RangePicker
                format="YYYY-MM-DD"
                placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                style={{ width: "100%" }}
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={4} lg={4}>
            <Form.Item name="period" label="Chu kỳ" initialValue="daily" labelCol={{ span: 24 }}>
              <Select size="large" style={{ width: "100%" }}>
                <Option value="daily">Hàng ngày</Option>
                <Option value="weekly">Hàng tuần</Option>
                <Option value="monthly">Hàng tháng</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={4} lg={4}>
            <Form.Item name="format" label="Định dạng" initialValue="excel" labelCol={{ span: 24 }}>
              <Select size="large" style={{ width: "100%" }}>
                <Option value="excel">Excel</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={5} lg={5}>
            <Form.Item name="staffId" label="Nhân viên" labelCol={{ span: 24 }}>
              <Select size="large" style={{ width: "100%" }} allowClear>
                {staffPerformanceData &&
                  staffPerformanceData.map((staff) => (
                    <Option key={staff.staffId} value={staff.staffId}>
                      {staff.staffName}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={5} lg={5} style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleClearForm}
              style={{ marginRight: "10px", borderRadius: "8px", height: "40px" }}
              size="large"
            >
              Đặt lại
            </Button>
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={() => handleExportSalesReportExcel()}
              loading={exportLoading}
              style={primaryButtonStyle}
              size="large"
            >
              Xuất Excel
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Enhanced Summary Cards with animations and icons */}
      <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{
              ...summaryCardStyle,
              borderTop: `4px solid ${colors.primary}`,
            }}
            bodyStyle={{
              padding: "20px 15px",
              height: "100%",
            }}
          >
            <div style={{ color: colors.primary, fontSize: "28px", marginBottom: "10px" }}>
              <ShoppingCartOutlined />
            </div>
            <Title
              level={5}
              style={{
                margin: "0 0 10px 0",
                color: colors.textLight,
                fontSize: "14px",
                fontWeight: "normal",
              }}
            >
              Tổng số đơn đặt
            </Title>
            <Text
              strong
              style={{
                fontSize: "26px",
                color: colors.text,
                display: "block",
                marginBottom: "8px",
              }}
            >
              {totalBookings.toLocaleString()}
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{
              ...summaryCardStyle,
              borderTop: `4px solid ${colors.success}`,
            }}
            bodyStyle={{
              padding: "20px 15px",
              height: "100%",
            }}
          >
            <div style={{ color: colors.success, fontSize: "28px", marginBottom: "10px" }}>
              <TagOutlined />
            </div>
            <Title
              level={5}
              style={{
                margin: "0 0 10px 0",
                color: colors.textLight,
                fontSize: "14px",
                fontWeight: "normal",
              }}
            >
              Tổng số vé
            </Title>
            <Text
              strong
              style={{
                fontSize: "26px",
                color: colors.text,
                display: "block",
                marginBottom: "8px",
              }}
            >
              {totalTickets.toLocaleString()}
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{
              ...summaryCardStyle,
              borderTop: `4px solid ${colors.warning}`,
            }}
            bodyStyle={{
              padding: "20px 15px",
              height: "100%",
            }}
          >
            <div style={{ color: colors.warning, fontSize: "28px", marginBottom: "10px" }}>
              <DollarOutlined />
            </div>
            <Title
              level={5}
              style={{
                margin: "0 0 10px 0",
                color: colors.textLight,
                fontSize: "14px",
                fontWeight: "normal",
              }}
            >
              Tổng doanh thu
            </Title>
            <Text
              strong
              style={{
                fontSize: "22px",
                color: colors.text,
                display: "block",
                marginBottom: "8px",
              }}
            >
              {Number(totalRevenue).toLocaleString()} (x1000)
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card
            style={{
              ...summaryCardStyle,
              borderTop: `4px solid ${colors.purple}`,
            }}
            bodyStyle={{
              padding: "20px 15px",
              height: "100%",
            }}
          >
            <div style={{ color: colors.purple, fontSize: "28px", marginBottom: "10px" }}>
              <TeamOutlined />
            </div>
            <Title
              level={5}
              style={{
                margin: "0 0 10px 0",
                color: colors.textLight,
                fontSize: "14px",
                fontWeight: "normal",
              }}
            >
              Số lượng nhân viên
            </Title>
            <Text
              strong
              style={{
                fontSize: "26px",
                color: colors.text,
                display: "block",
                marginBottom: "8px",
              }}
            >
              {totalStaff.toLocaleString()}
            </Text>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={8}>
          <Card
            style={{
              ...summaryCardStyle,
              borderTop: `4px solid ${colors.teal}`,
            }}
            bodyStyle={{
              padding: "20px 15px",
              height: "100%",
            }}
          >
            <div style={{ color: colors.teal, fontSize: "28px", marginBottom: "10px" }}>
              <BarChartOutlined />
            </div>
            <Title
              level={5}
              style={{
                margin: "0 0 10px 0",
                color: colors.textLight,
                fontSize: "14px",
                fontWeight: "normal",
              }}
            >
              Tỷ lệ đơn đặt xử lý
            </Title>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Text
                strong
                style={{
                  fontSize: "26px",
                  color: colors.text,
                  marginRight: "10px",
                }}
              >
                {totalBookingsHandled.toLocaleString()}
              </Text>
              <Text
                style={{
                  fontSize: "16px",
                  color: colors.success,
                }}
              >
                {totalBookings > 0 ? `(${((totalBookingsHandled / totalBookings) * 100).toFixed(1)}%)` : '(0%)'}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: "20px", color: colors.textLight }}>
            Đang tải dữ liệu thống kê...
          </Text>
        </div>
      )}

      {salesReportData || data || staffPerformanceData ? (
        <>
          {/* Staff Performance Charts */}
          {staffPerformanceData && (
            <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
              <Col xs={24} md={12}>
                <Card 
                  title={
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <TeamOutlined style={{ color: colors.primary, marginRight: "10px" }} />
                      <span>Hiệu suất nhân viên - Số lượng đơn đặt</span>
                    </div>
                  }
                  style={chartCardStyle}
                  headStyle={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "16px 20px",
                    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <div style={chartContainerStyle}>
                    <Bar 
                      data={staffBookingsChartData} 
                      options={chartOptions}
                      plugins={[chartPlugin]}
                    />
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  title={
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <DollarOutlined style={{ color: colors.warning, marginRight: "10px" }} />
                      <span>Hiệu suất nhân viên - Doanh thu</span>
                    </div>
                  }
                  style={chartCardStyle}
                  headStyle={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "16px 20px",
                    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <div style={chartContainerStyle}>
                    <Bar 
                      data={staffRevenueChartData} 
                      options={chartOptions}
                      plugins={[chartPlugin]}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          {/* Staff Trend and Movie Revenue Charts */}
          {(staffPerformanceData || data) && (
            <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
              {staffPerformanceData && (
                <Col xs={24} md={12}>
                  <Card 
                    title={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <BarChartOutlined style={{ color: colors.primary, marginRight: "10px" }} />
                        <span>Xu hướng đơn đặt theo thời gian</span>
                      </div>
                    }
                    style={chartCardStyle}
                    headStyle={{ 
                      borderBottom: `1px solid ${colors.border}`,
                      padding: "16px 20px",
                      fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    <div style={chartContainerStyle}>
                      <Line 
                        data={staffBookingTrendData} 
                        options={chartOptions}
                      />
                    </div>
                  </Card>
                </Col>
              )}
              {data && (
                <Col xs={24} md={12}>
                  <Card 
                    title={
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <BarChartOutlined style={{ color: colors.teal, marginRight: "10px" }} />
                        <span>Doanh thu và số vé theo phim</span>
                      </div>
                    }
                    style={chartCardStyle}
                    headStyle={{ 
                      borderBottom: `1px solid ${colors.border}`,
                      padding: "16px 20px",
                      fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    <div style={chartContainerStyle}>
                      <Bar 
                        data={movieComboChartData} 
                        options={comboChartOptions}
                        plugins={[chartPlugin]}
                      />
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          )}

          {/* Movie and Room Statistics Charts */}
          {data && (
            <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
              <Col xs={24} md={12}>
                <Card 
                  title={
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <TagOutlined style={{ color: colors.primary, marginRight: "10px" }} />
                      <span>Thống kê theo phim</span>
                    </div>
                  }
                  style={chartCardStyle}
                  headStyle={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "16px 20px",
                    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <div style={chartContainerStyle}>
                    <Bar 
                      data={movieChartData} 
                      options={chartOptions}
                      plugins={[chartPlugin]}
                    />
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  title={
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <TagOutlined style={{ color: colors.primary, marginRight: "10px" }} />
                      <span>Thống kê theo phòng chiếu</span>
                    </div>
                  }
                  style={chartCardStyle}
                  headStyle={{ 
                    borderBottom: `1px solid ${colors.border}`,
                    padding: "16px 20px",
                    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  <div style={chartContainerStyle}>
                    <Bar 
                      data={roomChartData} 
                      options={chartOptions}
                      plugins={[chartPlugin]}
                    />
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          {/* Overview and Period Charts */}
          <Row gutter={[24, 24]} style={{ marginBottom: "40px" }}>
            <Col xs={24} md={12}>
              <Card 
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <BarChartOutlined style={{ color: colors.primary, marginRight: "10px" }} />
                    <span>Thống kê tổng quan</span>
                  </div>
                }
                style={chartCardStyle}
                headStyle={{ 
                  borderBottom: `1px solid ${colors.border}`,
                  padding: "16px 20px",
                  fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                  fontWeight: 500,
                }}
              >
                <div style={chartContainerStyle}>
                  <Bar 
                    data={overviewChartData} 
                    options={chartOptions}
                    plugins={[chartPlugin]}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card 
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <BarChartOutlined style={{ color: colors.primary, marginRight: "10px" }} />
                    <span>Thống kê theo {salesReportData ? salesReportData.period : "ngày"}</span>
                  </div>
                }
                style={chartCardStyle}
                headStyle={{ 
                  borderBottom: `1px solid ${colors.border}`,
                  padding: "16px 20px",
                  fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                  fontWeight: 500,
                }}
              >
                <div style={chartContainerStyle}>
                  <Line 
                    data={periodChartData} 
                    options={chartOptions}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Payment Method Chart */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={{ span: 12, offset: 6 }}>
              <Card 
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <DollarOutlined style={{ color: colors.primary, marginRight: "10px" }} />
                    <span>Thống kê theo phương thức thanh toán</span>
                  </div>
                }
                style={chartCardStyle}
                headStyle={{ 
                  borderBottom: `1px solid ${colors.border}`,
                  padding: "16px 20px",
                  fontFamily: "'Roboto', 'Segoe UI', sans-serif",
                  fontWeight: 500,
                }}
              >
                <div style={{ ...chartContainerStyle, height: "400px" }}>
                  <Pie 
                    data={paymentChartData} 
                    options={pieChartOptions}
                  />                </div>
                  </Card>
                </Col>
              </Row>
    
              {/* Export Buttons Row */}
              <Row gutter={[16, 16]} style={{ marginTop: "40px", textAlign: "center" }}>
                <Col span={8}>
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportSalesReportExcel}
                    loading={exportLoading}
                    style={{
                      ...primaryButtonStyle,
                      width: "100%",
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    }}
                    size="large"
                  >
                    Xuất báo cáo doanh thu
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportBookingStatisticsExcel}
                    loading={exportLoading}
                    style={{
                      ...primaryButtonStyle,
                      width: "100%",
                      backgroundColor: colors.success,
                      borderColor: colors.success,
                    }}
                    size="large"
                  >
                    Xuất báo cáo đặt vé
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleExportStaffPerformanceExcel}
                    loading={exportLoading}
                    style={{
                      ...primaryButtonStyle,
                      width: "100%",
                      backgroundColor: colors.teal,
                      borderColor: colors.teal,
                    }}
                    size="large"
                  >
                    Xuất báo cáo hiệu suất
                  </Button>
                </Col>
              </Row>
            </>
          ) : (
            !loading && (
              <div style={{ 
                textAlign: "center", 
                padding: "60px 0", 
                backgroundColor: colors.light, 
                borderRadius: "12px",
                border: `1px dashed ${colors.border}`,
              }}>
                <BarChartOutlined style={{ fontSize: "48px", color: colors.textLight, marginBottom: "15px" }} />
                <Title level={4} style={{ color: colors.text, margin: "10px 0" }}>
                  Không có dữ liệu thống kê
                </Title>
                <Text style={{ color: colors.textLight }}>
                  Vui lòng chọn khoảng thời gian và nhấn Tìm kiếm để xem thống kê.
                </Text>
              </div>
            )
          )}
    
          <ToastContainer position="top-right" autoClose={5000} />
        </div>
      );
    };
    
    export default StatisticsPage;