import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode; // Nội dung của route (trang con)
  requirePasswordChange?: boolean; // Yêu cầu đổi mật khẩu (mặc định là true)
  requiredRole?: string; // Vai trò yêu cầu (nếu có)
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirePasswordChange = true,
  requiredRole,
}) => {
  const { isAuthenticated, user } = useAuth(); // Lấy thông tin xác thực và người dùng từ context
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kiểm tra nếu người dùng chưa đăng nhập
    if (!isAuthenticated) {
      // Chỉ hiển thị thông báo nếu truy cập các trang yêu cầu xác thực
      if (location.pathname !== "/") {
        //toast.error("You must be logged in to access this page.");
      }
      navigate("/login", { state: { from: location } }); // Chuyển hướng đến trang login và lưu lại vị trí hiện tại
      return;
    }

    // Kiểm tra nếu người dùng cần thay đổi mật khẩu
    if (requirePasswordChange && user?.requiresPasswordChange) {
      toast.warning("You must change your password before proceeding.");
      navigate("/settings", {
        state: {
          passwordChangeRequired: true,
          from: location, // Lưu lại vị trí hiện tại để quay lại sau khi đổi mật khẩu
        },
      });
      return;
    }

    // Kiểm tra vai trò của người dùng
    if (requiredRole && user?.role !== requiredRole) {
      toast.error("You do not have permission to access this page.");
      navigate("/unauthorized", { state: { from: location } }); // Chuyển hướng đến trang không được phép truy cập
      return;
    }
  }, [
    isAuthenticated,
    user,
    navigate,
    location,
    requirePasswordChange,
    requiredRole,
  ]);

  // Render nội dung của route nếu tất cả điều kiện đều được thỏa mãn
  return <>{children}</>;
};

export default ProtectedRoute;
