import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import jsQR from "jsqr";
import { useAuth } from "../context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

// Theme colors
const theme = {
  primary: "#0B0F19",
  secondary: "#161D2F",
  accent: "#E50914",
  light: "#FFFFFF",
  dark: "#0B0F19",
  success: "#10B981",
  error: "#EF4444",
  cardBg: "#161D2F",
  gradient: "linear-gradient(135deg, #0B0F19 0%, #161D2F 100%)",
};

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${theme.gradient};
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("/images/luxury-pattern.png");
    opacity: 0.03;
    pointer-events: none;
  }

  @keyframes gradientBG {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const ScannerContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const PageHeader = styled(motion.div)`
  display: flex;
  align-items: center;
  margin-bottom: 3rem;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -15px;
    left: 0;
    width: 80px;
    height: 4px;
    background: ${theme.accent};
    border-radius: 2px;
  }
`;

const HeaderTitle = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: ${theme.light};
    margin: 0;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0.5rem 0 0;
    font-size: 1rem;
  }
`;

const HeaderIcon = styled.div`
  margin-right: 1.5rem;
  width: 60px;
  height: 60px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);

  i {
    color: ${theme.accent};
    font-size: 1.8rem;
  }
`;

const ContentGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: ${theme.cardBg};
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.2);
  }
`;

const CardHeader = styled.div`
  padding: 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  background: rgba(10, 17, 40, 0.02);
`;

const CardTitle = styled.div`
  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${theme.dark};
    margin: 0;
    display: flex;
    align-items: center;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: ${theme.primary};
    margin-right: 1rem;

    i {
      color: ${theme.accent};
      font-size: 1.2rem;
    }
  }
`;

const CardBody = styled.div`
  padding: 2rem;
`;

const CameraContainer = styled.div`
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background-color: ${theme.dark};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 215, 0, 0.5),
      transparent
    );
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 215, 0, 0.5),
      transparent
    );
  }

  video {
    width: 100%;
    height: auto;
    transform: ${(props) => (props.$mirror ? "scaleX(-1)" : "none")};
    display: block;
  }

  canvas {
    display: none;
  }
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  .scanner-frame {
    width: 260px;
    height: 260px;
    position: relative;

    .corner {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 3px solid ${theme.accent};
    }

    .corner-top-left {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
      border-radius: 12px 0 0 0;
    }
    .corner-top-right {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
      border-radius: 0 12px 0 0;
    }
    .corner-bottom-left {
      bottom: 0;
      left: 0;
      border-right: none;
      border-top: none;
      border-radius: 0 0 0 12px;
    }
    .corner-bottom-right {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
      border-radius: 0 0 12px 0;
    }

    .scanner-line {
      position: absolute;
      height: 2px;
      width: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        ${theme.accent} 50%,
        transparent 100%
      );
      box-shadow: 0 0 8px ${theme.accent}, 0 0 12px ${theme.accent};
      animation: scan 2s ease-in-out infinite;
    }

    @keyframes scan {
      0% {
        top: 0;
        opacity: 0.8;
      }
      50% {
        top: calc(100% - 2px);
        opacity: 1;
      }
      100% {
        top: 0;
        opacity: 0.8;
      }
    }
  }
`;

const ControlPanel = styled.div`
  margin-top: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  i {
    margin-right: 0.7rem;
    font-size: 1.1rem;
  }
  &:focus {
    outline: none;
  }
`;

const PrimaryButton = styled(Button)`
  background: ${theme.primary};
  color: ${theme.light};
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  z-index: 1;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      rgba(255, 215, 0, 0.2) 0%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    background-color: rgba(10, 17, 40, 0.5);
    cursor: not-allowed;
    transform: none;
    &::before {
      opacity: 0;
    }
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  color: ${theme.dark};
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const ManualEntrySection = styled.div`
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${theme.dark};
    margin-bottom: 1.2rem;
    display: flex;
    align-items: center;

    i {
      margin-right: 0.8rem;
      color: ${theme.accent};
    }
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;

  input {
    flex: 1;
    padding: 1rem 1.2rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.8);

    &:focus {
      outline: none;
      border-color: ${theme.accent};
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.2);
      background: white;
    }

    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }
  }
`;

const TicketPlaceholder = styled.div`
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;

  .icon {
    font-size: 4rem;
    color: rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;
    animation: pulse 2s infinite ease-in-out;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
  }

  h3 {
    font-size: 1.4rem;
    font-weight: 600;
    color: ${theme.dark};
    margin-bottom: 0.8rem;
  }
  p {
    color: rgba(0, 0, 0, 0.5);
    max-width: 280px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const LoadingIndicator = styled.div`
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;

  .spinner {
    width: 60px;
    height: 60px;
    border: 3px solid rgba(0, 31, 84, 0.1);
    border-left-color: ${theme.accent};
    border-radius: 50%;
    animation: spin 1.2s linear infinite;
    margin-bottom: 2rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(0, 0, 0, 0.6);
    font-weight: 500;
  }
`;

const TicketCard = styled.div`
  position: relative;
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
`;

const TicketHeader = styled.div`
  background: ${(props) =>
    props.$success
      ? "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)"
      : "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)"};
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -10px;
    right: -10px;
    width: 120px;
    height: 120px;
    background: ${(props) => (props.$success ? theme.success : theme.error)};
    opacity: 0.1;
    border-radius: 50%;
  }

  .status-badge {
    position: absolute;
    top: 1rem;
    right: -3rem;
    background: ${(props) => (props.$success ? theme.success : theme.error)};
    color: white;
    padding: 0.4rem 3rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    transform: rotate(45deg);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  h3 {
    font-size: 1.6rem;
    font-weight: 700;
    color: ${theme.dark};
    margin-bottom: 0.8rem;
    line-height: 1.3;
    max-width: 80%;
  }
  .check-in-time {
    font-size: 0.95rem;
    color: ${(props) => (props.$success ? theme.success : theme.error)};
    font-weight: 600;
    display: flex;
    align-items: center;

    i {
      margin-right: 0.6rem;
      font-size: 1.1rem;
    }
  }
`;

const TicketInfo = styled.div`
  padding: 2rem;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 8px;
    background-image: linear-gradient(
      90deg,
      ${theme.cardBg} 0px,
      ${theme.cardBg} 12px,
      transparent 12px,
      transparent 24px
    );
    background-size: 24px 8px;
    opacity: 0.5;
  }
`;

const TicketProperty = styled.div`
  display: flex;
  margin-bottom: 1.2rem;

  &:last-child {
    margin-bottom: 0;
  }

  .label {
    width: 40%;
    font-size: 0.95rem;
    color: rgba(0, 0, 0, 0.5);
    font-weight: 500;
  }
  .value {
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
    color: ${theme.dark};
  }
`;

const TicketActions = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: rgba(10, 17, 40, 0.01);
`;

const StatusIcon = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(props) => (props.$success ? theme.success : theme.error)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  i {
    color: white;
    font-size: 1.2rem;
  }
`;

// Main component
const QRCodeScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [mirrorImage, setMirrorImage] = useState(true);
  const [ticketResponse, setTicketResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualTicketCode, setManualTicketCode] = useState("");

  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const scannerIntervalRef = useRef();

  const navigate = useNavigate();
  const { token } = useAuth();
  const apiBaseUrl = "http://localhost:5204/api";

  const successSound = new Audio("/sounds/success.mp3");
  const errorSound = new Audio("/sounds/error.mp3");

  const getRole = () => {
    return localStorage.getItem("role") || sessionStorage.getItem("role");
  };

  useEffect(() => {
    const role = getRole();
    if (role !== "Staff" && role !== "Admin") {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCameras(videoDevices);

        if (videoDevices.length > 0) {
          setCurrentCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
        toast.error(
          "Không thể truy cập camera. Vui lòng cấp quyền và thử lại.",
          { icon: "🎬" }
        );
      }
    };

    getCameras();

    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (scannerIntervalRef.current) {
        clearInterval(scannerIntervalRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          deviceId: currentCamera ? { exact: currentCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setScanning(true);
      startScanning();

      toast.info("Camera đã sẵn sàng. Vui lòng đưa mã QR vào khung quét.", {
        icon: "📷",
      });
    } catch (error) {
      console.error("Error starting camera:", error);
      toast.error("Không thể truy cập camera. Vui lòng cấp quyền và thử lại.", {
        icon: "🎬",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }

    setScanning(false);
  };

  const startScanning = () => {
    if (scannerIntervalRef.current) {
      clearInterval(scannerIntervalRef.current);
    }

    scannerIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            processQRCode(code.data);
          }
        }
      }
    }, 100);
  };

  const processQRCode = async (qrData) => {
    stopCamera();

    try {
      setLoading(true);

      console.log("QR Data:", qrData);

      let ticketCode = qrData;

      try {
        const parsedData = JSON.parse(qrData);
        if (parsedData.code) {
          ticketCode = parsedData.code;
        } else if (parsedData.ticketCode) {
          ticketCode = parsedData.ticketCode;
        }
      } catch (e) {
        // Dữ liệu QR không phải JSON, giữ nguyên
      }

      await scanTicket(ticketCode);
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast.error("Không thể xác thực vé. Vui lòng thử lại.", { icon: "❌" });
      setLoading(false);
    }
  };

  const scanTicket = async (ticketCode, suppressToast = false) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post(
        `${apiBaseUrl}/Ticket/scan/${ticketCode}`,
        {},
        config
      );

      // Nếu success: false, ném lỗi với thông điệp từ API
      if (!response.data.success) {
        throw new Error(response.data.message || "Vé không hợp lệ");
      }

      // Xử lý khi vé hợp lệ
      setTicketResponse(response.data);

      try {
        successSound.play();
        if (!suppressToast) {
          toast.success("Check-in vé thành công!", { icon: "✅" });
        }
      } catch (e) {
        console.log("Audio play error:", e);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error scanning ticket:", error);

      // Đặt loading thành false trước khi xử lý lỗi để tránh trạng thái loading vô hạn
      setLoading(false);

      // Xử lý lỗi 401 (hết hạn phiên đăng nhập)
      if (error.response && error.response.status === 401) {
        if (!suppressToast) {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
            icon: "🔒",
          });
        }
        navigate("/login");
        return; // Thêm return để ngăn thực hiện code phía dưới
      }
      // Xử lý lỗi 404 (Not Found)
      else if (error.response && error.response.status === 404) {
        const errorMessage =
          error.response.data?.message || "Không tìm thấy vé với mã này";
        if (!suppressToast) {
          toast.error(errorMessage, { icon: "❌" });
        }
        throw new Error(errorMessage);
      }
      // Xử lý lỗi 400 (Bad Request)
      else if (error.response && error.response.status === 400) {
        const errorMessage = error.response.data?.message || "Vé không hợp lệ";
        if (!suppressToast) {
          toast.error(errorMessage, { icon: "❌" });
        }
        throw new Error(errorMessage);
      }
      // Các lỗi khác
      else {
        const errorMessage =
          error.message || "Không thể xác thực vé. Vui lòng thử lại.";
        if (!suppressToast) {
          toast.error(errorMessage, { icon: "❌" });
        }
        throw error;
      }
    }
  };

  const resetScanner = () => {
    setTicketResponse(null);
    setScanning(false);
  };

  const handleManualEntry = async (e) => {
    e.preventDefault();

    if (!manualTicketCode.trim()) {
      toast.warning("Vui lòng nhập mã vé", { icon: "⚠️" });
      return;
    }

    try {
      setLoading(true);
      await scanTicket(manualTicketCode.trim(), true);
      setManualTicketCode("");
    } catch (error) {
      console.error("Error fetching ticket:", error);
      // Sửa ở đây: hiển thị message từ error thay vì message cứng
      toast.error(error.message || "Không thể xác thực vé. Vui lòng thử lại.", {
        icon: "❌",
      });
      setLoading(false);
      setTicketResponse(null);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  // Hàm mới để tải file PDF
  const downloadTicketPDF = async () => {
    if (
      !ticketResponse ||
      !ticketResponse.ticket_info ||
      !ticketResponse.ticket_info.ticket_id
    ) {
      toast.error("Không có thông tin vé để tải PDF.", { icon: "❌" });
      return;
    }

    try {
      const ticketId = ticketResponse.ticket_info.ticket_id;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Quan trọng: để nhận dữ liệu dưới dạng blob
      };

      const response = await axios.get(
        `${apiBaseUrl}/Ticket/pdf/${ticketId}`,
        config
      );

      // Tạo URL từ blob và tải file
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;

      // Lấy tên file từ header content-disposition nếu có, hoặc đặt mặc định
      const contentDisposition = response.headers["content-disposition"];
      let fileName = `Ticket_${ticketId}.pdf`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Tải file PDF thành công!", { icon: "✅" });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
          icon: "🔒",
        });
        navigate("/login");
      } else {
        toast.error("Không thể tải file PDF. Vui lòng thử lại.", {
          icon: "❌",
        });
      }
    }
  };

  return (
    <PageWrapper>
      <ScannerContainer>
        <PageHeader initial="hidden" animate="visible" variants={fadeIn}>
          <HeaderIcon>
            <i className="fas fa-qrcode"></i>
          </HeaderIcon>
          <HeaderTitle>
            <h1>Kiểm tra vé</h1>
            <p>Quét mã QR hoặc nhập mã vé để xác thực và check-in</p>
          </HeaderTitle>
        </PageHeader>

        <ContentGrid initial="hidden" animate="visible" variants={fadeIn}>
          <Card initial="hidden" animate="visible" variants={slideUp}>
            <CardHeader>
              <CardTitle>
                <div className="icon">
                  <i className="fas fa-camera"></i>
                </div>
                <h2>Quét mã QR</h2>
              </CardTitle>
            </CardHeader>

            <CardBody>
              <CameraContainer $mirror={mirrorImage}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onCanPlay={() => videoRef.current.play()}
                />
                <canvas ref={canvasRef} />
                {scanning && (
                  <ScanOverlay>
                    <div className="scanner-frame">
                      <div className="corner corner-top-left"></div>
                      <div className="corner corner-top-right"></div>
                      <div className="corner corner-bottom-left"></div>
                      <div className="corner corner-bottom-right"></div>
                      <div className="scanner-line"></div>
                    </div>
                  </ScanOverlay>
                )}
              </CameraContainer>

              <ControlPanel>
                {!scanning ? (
                  <PrimaryButton onClick={startCamera} disabled={loading}>
                    <i className="fas fa-play"></i>
                    Bắt đầu quét
                  </PrimaryButton>
                ) : (
                  <SecondaryButton onClick={stopCamera}>
                    <i className="fas fa-stop"></i>
                    Dừng quét
                  </SecondaryButton>
                )}

                {cameras.length > 1 && (
                  <SecondaryButton
                    onClick={() => {
                      const currentIndex = cameras.findIndex(
                        (cam) => cam.deviceId === currentCamera
                      );
                      const nextIndex = (currentIndex + 1) % cameras.length;
                      setCurrentCamera(cameras[nextIndex].deviceId);
                      if (scanning) {
                        stopCamera();
                        setTimeout(startCamera, 300);
                      }
                    }}
                  >
                    <i className="fas fa-sync"></i>
                    Đổi camera
                  </SecondaryButton>
                )}

                <SecondaryButton onClick={() => setMirrorImage(!mirrorImage)}>
                  <i className="fas fa-exchange-alt"></i>
                  {mirrorImage ? "Tắt" : "Bật"} đảo ảnh
                </SecondaryButton>
              </ControlPanel>

              <ManualEntrySection>
                <h3>
                  <i className="fas fa-keyboard"></i>
                  Nhập mã vé thủ công
                </h3>
                <form onSubmit={handleManualEntry}>
                  <InputGroup>
                    <input
                      type="text"
                      placeholder="Nhập mã vé (VD: 628A679A)"
                      value={manualTicketCode}
                      onChange={(e) => setManualTicketCode(e.target.value)}
                      disabled={loading}
                    />
                    <PrimaryButton
                      type="submit"
                      disabled={loading || !manualTicketCode.trim()}
                    >
                      <i className="fas fa-search"></i>
                      Kiểm tra
                    </PrimaryButton>
                  </InputGroup>
                </form>
              </ManualEntrySection>
            </CardBody>
          </Card>

          <Card initial="hidden" animate="visible" variants={slideUp}>
            <CardHeader>
              <CardTitle>
                <div className="icon">
                  <i className="fas fa-ticket-alt"></i>
                </div>
                <h2>Thông tin vé</h2>
              </CardTitle>
            </CardHeader>

            <CardBody>
              {loading ? (
                <LoadingIndicator>
                  <div className="spinner"></div>
                  <p>Đang xác thực thông tin vé...</p>
                </LoadingIndicator>
              ) : ticketResponse ? (
                <TicketCard>
                  <TicketHeader $success={ticketResponse.success}>
                    <div className="status-badge">
                      {ticketResponse.success ? "ĐÃ CHECK-IN" : "KHÔNG HỢP LỆ"}
                    </div>
                    <h3>{ticketResponse.ticket_info.movie_name}</h3>
                    <div className="check-in-time">
                      <i
                        className={
                          ticketResponse.success
                            ? "fas fa-check-circle"
                            : "fas fa-times-circle"
                        }
                      ></i>
                      {ticketResponse.success
                        ? `Đã check-in lúc ${formatDateTime(
                            ticketResponse.check_in_time
                          )}`
                        : "Vé không hợp lệ hoặc đã được sử dụng"}
                    </div>
                    <StatusIcon $success={ticketResponse.success}>
                      <i
                        className={
                          ticketResponse.success
                            ? "fas fa-check"
                            : "fas fa-times"
                        }
                      ></i>
                    </StatusIcon>
                  </TicketHeader>

                  <TicketInfo>
                    <TicketProperty>
                      <div className="label">Mã vé:</div>
                      <div className="value">
                        {ticketResponse.ticket_info.ticket_code}
                      </div>
                    </TicketProperty>
                    <TicketProperty>
                      <div className="label">Ghế:</div>
                      <div className="value">
                        {ticketResponse.ticket_info.seat}
                      </div>
                    </TicketProperty>
                    <TicketProperty>
                      <div className="label">Phòng chiếu:</div>
                      <div className="value">
                        {ticketResponse.ticket_info.room_name}
                      </div>
                    </TicketProperty>
                    <TicketProperty>
                      <div className="label">Ngày chiếu:</div>
                      <div className="value">
                        {ticketResponse.ticket_info.show_date}
                      </div>
                    </TicketProperty>
                    <TicketProperty>
                      <div className="label">Giờ chiếu:</div>
                      <div className="value">
                        {ticketResponse.ticket_info.start_time}
                      </div>
                    </TicketProperty>
                    {ticketResponse.ticket_info.customer_name && (
                      <TicketProperty>
                        <div className="label">Khách hàng:</div>
                        <div className="value">
                          {ticketResponse.ticket_info.customer_name}
                        </div>
                      </TicketProperty>
                    )}
                  </TicketInfo>

                  <TicketActions>
                    <SecondaryButton onClick={resetScanner}>
                      <i className="fas fa-redo"></i>
                      Quét vé mới
                    </SecondaryButton>
                    <PrimaryButton onClick={downloadTicketPDF}>
                      <i className="fas fa-print"></i>
                      In thông tin
                    </PrimaryButton>
                  </TicketActions>
                </TicketCard>
              ) : (
                <TicketPlaceholder>
                  <i className="fas fa-ticket-alt icon"></i>
                  <h3>Chưa có thông tin vé</h3>
                  <p>
                    Quét mã QR hoặc nhập mã vé để xem thông tin và xác thực vé
                  </p>
                </TicketPlaceholder>
              )}
            </CardBody>
          </Card>
        </ContentGrid>
      </ScannerContainer>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
        }}
      />
    </PageWrapper>
  );
};

export default QRCodeScanner;
