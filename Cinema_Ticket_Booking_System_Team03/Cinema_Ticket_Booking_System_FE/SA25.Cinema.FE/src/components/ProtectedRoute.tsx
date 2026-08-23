import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import LoginPromptModal from "./LoginPromptModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Yêu cầu đổi mật khẩu trước khi vào (mặc định true) */
  requirePasswordChange?: boolean;
  /** Vai trò yêu cầu (nếu có) */
  requiredRole?: string;
  /**
   * "soft"  → Hiển thị trang bình thường, nhưng khi cần action có tài khoản sẽ hiện modal nhắc (dùng hook useLoginPrompt)
   * "hard"  → Chuyển hướng thẳng đến /login nếu chưa đăng nhập (dùng cho các trang hoàn toàn cần xác thực)
   *
   * Mặc định: "hard"
   */
  mode?: "soft" | "hard";
  /** Thông điệp hiển thị trong modal nhắc (chỉ dùng khi mode="soft") */
  promptMessage?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirePasswordChange = true,
  requiredRole,
  mode = "hard",
  promptMessage,
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (mode === "hard") {
        // Chuyển hướng bắt buộc đến trang đăng nhập
        navigate("/login", { state: { from: location }, replace: true });
        return;
      }
      if (mode === "soft") {
        // Hiển thị modal nhắc nhở, không chuyển hướng
        setShowPrompt(true);
        return;
      }
    }

    // Đã đăng nhập — kiểm tra đổi mật khẩu
    if (requirePasswordChange && user?.requiresPasswordChange) {
      navigate("/settings", {
        state: { passwordChangeRequired: true, from: location },
      });
      return;
    }

    // Kiểm tra vai trò
    if (requiredRole && user?.role !== requiredRole) {
      toast.error("Bạn không có quyền truy cập trang này.");
      navigate("/unauthorized", { state: { from: location } });
      return;
    }

    // Đã đăng nhập hợp lệ — đóng modal nếu đang mở
    setShowPrompt(false);
  }, [
    isAuthenticated,
    user,
    navigate,
    location,
    requirePasswordChange,
    requiredRole,
    mode,
  ]);

  // Hard mode + chưa đăng nhập: render null trong khi redirect diễn ra
  if (!isAuthenticated && mode === "hard") {
    return null;
  }

  return (
    <>
      {/* Modal nhắc đăng nhập cho soft mode */}
      <LoginPromptModal
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        message={promptMessage}
      />
      {children}
    </>
  );
};

export default ProtectedRoute;
