import React, { useState } from "react";
import {
  Bell,
  Loader2,
  Gift,
  Settings,
  Ticket,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios"; // Thêm Axios để gọi API
import { Notification } from "../../interfaces/ProfileInterfaces";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface NotificationsTabProps {
  notifications: Notification[];
  isLoading: boolean;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  isLoading,
  setNotifications,
}) => {
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false); // Trạng thái cho API đánh dấu tất cả đã đọc
  const [currentPage, setCurrentPage] = useState(1); // Trạng thái trang hiện tại
  const notificationsPerPage = 10; // Số thông báo mỗi trang

  // Tính toán các thông báo sẽ hiển thị trên trang hiện tại
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(
    indexOfFirstNotification,
    indexOfLastNotification
  );

  // Tính tổng số trang
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  // Hàm chuyển trang
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm - dd/MM/yyyy", { locale: vi });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return dateString;
    }
  };

  const markAllNotificationsAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực.");
      }

      await axios.put("https://localhost:7168/api/notifications/read-all", null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error(
        "Có lỗi xảy ra khi đánh dấu tất cả thông báo đã đọc:",
        error
      );
      alert("Không thể đánh dấu tất cả thông báo đã đọc. Vui lòng thử lại.");
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Hàm đánh dấu một thông báo đã đọc
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực.");
      }

      // Gọi API để đánh dấu thông báo đã đọc
      await axios.put(
        `https://localhost:7168/api/notifications/${notificationId}/read`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Cập nhật trạng thái thông báo trong UI
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error(
        `Có lỗi xảy ra khi đánh dấu thông báo ${notificationId} đã đọc:`,
        error
      );
      alert("Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.");
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "promo":
        return "bg-green-50 hover:bg-green-100";
      case "system":
        return "bg-blue-50 hover:bg-blue-100";
      case "alert":
        return "bg-red-50 hover:bg-red-100";
      default:
        return "bg-yellow-50 hover:bg-yellow-100";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "promo":
        return <Gift className="h-5 w-5" />;
      case "system":
        return <Settings className="h-5 w-5" />;
      case "alert":
        return <AlertCircle className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Ticket className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Thông báo</h2>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllNotificationsAsRead}
              disabled={isMarkingAllRead}
              className={`text-sm ${
                isMarkingAllRead
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-indigo-600 hover:text-indigo-800"
              }`}
            >
              {isMarkingAllRead ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
            </button>
          )}
        </div>
        {isLoading && (
          <div className="text-center py-12 animate-pulse">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-500">Đang tải thông báo...</p>
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Bạn không có thông báo nào.</p>
          </div>
        )}
        {!isLoading && notifications.length > 0 && (
          <>
            <div className="space-y-4">
              {currentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && markNotificationAsRead(notification.id)} // Gọi API khi nhấn vào thông báo chưa đọc
                  className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-300 ease-in-out ${getBackgroundColor(
                    notification.type
                  )}`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 rounded-full p-1.5 mr-3 transition-all duration-300 ease-in-out group-hover:scale-110 ${
                        notification.type === "promo"
                          ? "bg-green-100 text-green-600"
                          : notification.type === "system"
                          ? "bg-blue-100 text-blue-600"
                          : notification.type === "alert"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4
                          className={`font-medium text-base ${
                            notification.isRead
                              ? "text-gray-800"
                              : notification.type === "promo"
                              ? "text-green-800"
                              : notification.type === "system"
                              ? "text-blue-800"
                              : notification.type === "alert"
                              ? "text-red-800"
                              : "text-yellow-800"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <span
                          className={`text-xs flex-shrink-0 ${
                            notification.isRead
                              ? "text-gray-500"
                              : notification.type === "promo"
                              ? "text-green-700"
                              : notification.type === "system"
                              ? "text-blue-700"
                              : notification.type === "alert"
                              ? "text-red-700"
                              : "text-yellow-700"
                          }`}
                        >
                          {formatDateTime(notification.date)}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-1 ${
                          notification.isRead
                            ? "text-gray-600"
                            : notification.type === "promo"
                            ? "text-green-700"
                            : notification.type === "system"
                            ? "text-blue-700"
                            : notification.type === "alert"
                            ? "text-red-700"
                            : "text-yellow-700"
                        }`}
                      >
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="ml-2 flex-shrink-0 mt-1">
                        <span className="h-2 w-2 bg-indigo-500 rounded-full inline-block"></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Nút phân trang */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                Trang trước
              </button>
              <span className="text-gray-600">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;