import React from "react";
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

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Helper function to determine the background color based on notification type
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

  // Helper function to determine the icon based on notification type
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
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true }))
                )
              }
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Đánh dấu tất cả đã đọc
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
            <img
              src="/path-to-empty-notification-image.png"
              alt="No notifications"
              className="mx-auto h-24 w-24 mb-4"
            />
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Bạn không có thông báo nào.</p>
          </div>
        )}
        {!isLoading && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-300 ease-in-out ${getBackgroundColor(
                  notification.type
                )}`}
                onClick={() => markNotificationAsRead(notification.id)}
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
                        } relative`}
                      >
                        {formatDateTime(notification.date)}
                        <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-6 ml-2">
                          {format(
                            parseISO(notification.date),
                            "EEEE, d MMMM yyyy",
                            { locale: vi }
                          )}
                        </div>
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
                      {notification.type === "promo" && (
                        <span className="text-green-600 font-semibold ml-1">
                          +{notification.points} điểm
                        </span>
                      )}
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
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
