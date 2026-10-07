import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import jsQR from "jsqr";
import { useAuth } from "../context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { API_URL } from '../config/apiUrl';
import {
  FiCamera,
  FiPlay,
  FiSquare,
  FiRotateCw,
  FiRepeat,
  FiSearch,
  FiPrinter,
  FiCheckCircle,
  FiXCircle,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiEdit3,
} from "react-icons/fi";
import { QrCode, Ticket as TicketIcon } from "lucide-react";

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
  background: rgba(229, 9, 20, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(229, 9, 20, 0.2);
  border: 1px solid rgba(229, 9, 20, 0.3);
  color: ${theme.accent};
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
  padding: 1.75rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
`;

const CardTitle = styled.div`
  display: flex;
  align-items: center;

  h2 {
    font-size: 1.45rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    display: flex;
    align-items: center;
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(229, 9, 20, 0.15);
    border: 1px solid rgba(229, 9, 20, 0.3);
    margin-right: 1rem;
    color: ${theme.accent};
  }
`;

const CardBody = styled.div`
  padding: 2rem;
`;

const CameraContainer = styled.div<{ $mirror?: boolean }>`
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background-color: #0b0f19;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;

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
      rgba(229, 9, 20, 0.6),
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
      rgba(229, 9, 20, 0.6),
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
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:focus {
    outline: none;
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
  color: #ffffff;
  border: 1px solid rgba(229, 9, 20, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(229, 9, 20, 0.4);
    background: linear-gradient(135deg, #f40612 0%, #c10712 100%);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.05);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

const ManualEntrySection = styled.div`
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);

  h3 {
    font-size: 1.15rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;

    svg {
      color: ${theme.accent};
    }
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.75rem;

  input {
    flex: 1;
    padding: 0.85rem 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    background: #0b0f19;
    color: #ffffff;

    &:focus {
      outline: none;
      border-color: ${theme.accent};
      box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.25);
      background: #0f1422;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }
  }
`;

const TicketPlaceholder = styled.div`
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;

  .icon-wrapper {
    width: 76px;
    height: 76px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    color: rgba(255, 255, 255, 0.3);
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
    font-size: 1.35rem;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 0.8rem;
  }
  p {
    color: rgba(255, 255, 255, 0.55);
    max-width: 320px;
    margin: 0 auto;
    line-height: 1.6;
    font-size: 0.95rem;
  }
`;

const LoadingIndicator = styled.div`
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;

  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-left-color: ${theme.accent};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  p {
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }
`;

const TicketCard = styled.div`
  position: relative;
  padding: 0;
  overflow: hidden;
  border-radius: 16px;
  background: #0f1422;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const TicketHeader = styled.div<{ $success?: boolean }>`
  background: ${(props) =>
    props.$success
      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)"
      : "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)"};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
    opacity: 0.12;
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
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
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
    gap: 0.5rem;
  }
`;

const TicketInfo = styled.div`
  padding: 2rem;
  position: relative;
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
    color: rgba(255, 255, 255, 0.55);
    font-weight: 500;
  }
  .value {
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
  }
`;

const TicketActions = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.2);
`;

const StatusIcon = styled.div<{ $success?: boolean }>`
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: white;
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
  const apiBaseUrl = API_URL;

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
            <QrCode size={30} />
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
                  <FiCamera size={20} />
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
                  onCanPlay={() => videoRef.current && videoRef.current.play()}
                  style={{ display: scanning ? "block" : "none" }}
                />
                <canvas ref={canvasRef} />
                {!scanning && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3.5rem 1.5rem",
                      color: "rgba(255,255,255,0.45)",
                      gap: "0.85rem",
                      textAlign: "center",
                    }}
                  >
                    <FiCamera size={44} style={{ opacity: 0.6, color: "#E50914" }} />
                    <p style={{ margin: 0, fontSize: "0.95rem" }}>
                      Nhấn <strong>"Bắt đầu quét"</strong> để bật camera kiểm tra vé
                    </p>
                  </div>
                )}
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
                    <FiPlay size={17} />
                    Bắt đầu quét
                  </PrimaryButton>
                ) : (
                  <SecondaryButton onClick={stopCamera}>
                    <FiSquare size={17} />
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
                    <FiRotateCw size={17} />
                    Đổi camera
                  </SecondaryButton>
                )}

                <SecondaryButton onClick={() => setMirrorImage(!mirrorImage)}>
                  <FiRepeat size={17} />
                  {mirrorImage ? "Tắt" : "Bật"} đảo ảnh
                </SecondaryButton>
              </ControlPanel>

              <ManualEntrySection>
                <h3>
                  <FiEdit3 size={18} />
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
                      <FiSearch size={17} />
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
                  <TicketIcon size={20} />
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
                      {ticketResponse.success ? (
                        <FiCheckCircle size={18} />
                      ) : (
                        <FiXCircle size={18} />
                      )}
                      {ticketResponse.success
                        ? `Đã check-in lúc ${formatDateTime(
                            ticketResponse.check_in_time
                          )}`
                        : "Vé không hợp lệ hoặc đã được sử dụng"}
                    </div>
                    <StatusIcon $success={ticketResponse.success}>
                      {ticketResponse.success ? (
                        <FiCheck size={20} />
                      ) : (
                        <FiX size={20} />
                      )}
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
                      <FiRefreshCw size={17} />
                      Quét vé mới
                    </SecondaryButton>
                    <PrimaryButton onClick={downloadTicketPDF}>
                      <FiPrinter size={17} />
                      In thông tin
                    </PrimaryButton>
                  </TicketActions>
                </TicketCard>
              ) : (
                <TicketPlaceholder>
                  <div className="icon-wrapper">
                    <TicketIcon size={38} />
                  </div>
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
