import React, { useState ,useEffect} from "react";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Progress,
  Spin,
  Input,
  Button,
  Form,
  message,
} from "antd";
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from "react-router-dom";
const { Title } = Typography;

const Statistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();


// Lấy role từ localStorage
const getRole = () => {
  return localStorage.getItem("role") || sessionStorage.getItem("role");
};

// Kiểm tra quyền truy cập
useEffect(() => {
  const role = getRole();
  if (role !== "Admin") {
    toast.error("Bạn không có quyền truy cập trang này.");
    navigate("/"); // Điều hướng sang trang unauthorized
  }
}, [navigate]);
  // Hàm gọi API
  const fetchStatistics = async (startDate, endDate) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not found. Please log in.");
      }

      // Định dạng ngày
      const formattedStartDate = new Date(startDate)
        .toISOString()
        .split("T")[0];
      const formattedEndDate = new Date(endDate).toISOString().split("T")[0];

      const response = await axios.get("/api/BookingStatistics", {
        params: { startDate: formattedStartDate, endDate: formattedEndDate },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Kiểm tra phản hồi từ API
      if (response.data) {
        setData(response.data);
      } else {
        throw new Error("No data available for the selected date range.");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error.message);
      message.error(
        error.message || "An error occurred while fetching statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi người dùng submit form
  const handleSubmit = (values) => {
    const { startDate, endDate } = values;
    fetchStatistics(startDate, endDate);
  };

  // Cấu hình cột cho bảng Daily Statistics
  const dailyColumns = [
    {
      title: "Day",
      dataIndex: "day",
      key: "day",
    },
    {
      title: "Total Bookings",
      dataIndex: "totalBookings",
      key: "totalBookings",
    },
    {
      title: "Total Tickets",
      dataIndex: "totalTickets",
      key: "totalTickets",
    },
    {
      title: "Total Revenue (VND)",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (value) => (value ? value.toLocaleString() : "N/A"),
    },
  ];

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "80px auto" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: "20px" }}>
        Booking Statistics
      </Title>

      {/* Form nhập ngày */}
      <Card style={{ marginBottom: "20px" }}>
        <Form form={form} layout="inline" onFinish={handleSubmit}>
          <Form.Item
            name="startDate"
            rules={[{ required: true, message: "Please enter start date!" }]}
          >
            <Input placeholder="Start Date (e.g., 2025-04-03)" />
          </Form.Item>
          <Form.Item
            name="endDate"
            rules={[{ required: true, message: "Please enter end date!" }]}
          >
            <Input placeholder="End Date (e.g., 2025-04-04)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Fetch Statistics
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {loading && (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      )}

      {data ? (
        <>
          {/* Tổng quan */}
          <Row gutter={[16, 16]} style={{ marginBottom: "20px" }}>
            <Col span={6}>
              <Card>
                <Title level={4}>Total Bookings</Title>
                <p style={{ fontSize: "24px", color: "#1890ff" }}>
                  {data?.totalBookings || "N/A"}
                </p>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Title level={4}>Confirmed Bookings</Title>
                <p style={{ fontSize: "24px", color: "#52c41a" }}>
                  {data?.confirmedBookings || "N/A"}
                </p>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Title level={4}>Cancelled Bookings</Title>
                <p style={{ fontSize: "24px", color: "#f5222d" }}>
                  {data?.cancelledBookings || "N/A"}
                </p>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Title level={4}>Total Revenue</Title>
                <p style={{ fontSize: "24px", color: "#faad14" }}>
                  {data?.totalRevenue
                    ? data.totalRevenue.toLocaleString()
                    : "N/A"}{" "}
                  VND
                </p>
              </Card>
            </Col>
          </Row>

          {/* Bảng Daily Statistics */}
          <Table
            columns={dailyColumns}
            dataSource={data.dailyStatistics}
            rowKey="day"
            pagination={{ pageSize: 10 }}
          />
        </>
      ) : (
        <p style={{ textAlign: "center", color: "red" }}>
          No data available or an error occurred.
        </p>
      )}
    </div>
  );
};

export default Statistics;
