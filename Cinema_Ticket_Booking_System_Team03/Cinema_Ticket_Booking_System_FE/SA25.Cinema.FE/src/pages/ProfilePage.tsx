import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { parseISO, isFuture } from "date-fns";

// Import các components
import ProfileSidebar from "../components/Profile/ProfileSidebar";
import AlertMessage from "../components/Profile/AlertMessage";
import PersonalInfoTab from "../components/Profile/PersonalInfoTab";
import BookingsHistoryTab from "../components/Profile/BookingsHistoryTab";
import NotificationsTab from "../components/Profile/NotificationsTab";
import SettingsTab from "../components/Profile/SettingsTab";
import TicketDetailModal from "../components/Profile/TicketDetailModal";

// Import các interfaces
import {
  UserProfile,
  Booking,
  Notification,
  TicketDetail,
  ApiBooking,
} from "../interfaces/ProfileInterfaces";

// Thêm interface cho props
interface ProfilePageProps {
  defaultTab?: "profile" | "bookings" | "notifications" | "settings";
}

// Component chính
const ProfilePage: React.FC<ProfilePageProps> = ({ defaultTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const apiBaseUrl = "https://localhost:7168/api";
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Xác định tab ban đầu dựa trên URL
  const getInitialTabFromUrl = () => {
    if (defaultTab) return defaultTab;

    const path = location.pathname;
    if (path.includes("/profile/bookings")) return "bookings";
    if (path.includes("/profile/notifications")) return "notifications";
    if (path.includes("/profile/settings")) return "settings";
    return "profile";
  };

  const [activeTab, setActiveTab] = useState(
    defaultTab || getInitialTabFromUrl()
  );
  const [activeSubTab, setActiveSubTab] = useState("personal");
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "success" | "error" | "info";
    message: string;
  }>({
    show: false,
    type: "info",
    message: "",
  });
  const [isPaymentLoading, setIsPaymentLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<TicketDetail[]>([]);
  const [formData, setFormData] = useState({
    full_Name: "",
    email: "",
    phone_Number: "",
    address: "",
    date_Of_Birth: "",
    sex: "",
  });

  // Cập nhật URL khi tab thay đổi
  useEffect(() => {
    // Cập nhật URL khi tab thay đổi, nhưng không gây reload trang
    if (activeTab === "profile" && !location.pathname.endsWith("/profile")) {
      navigate("/profile", { replace: true });
    } else if (
      activeTab === "bookings" &&
      !location.pathname.endsWith("/bookings")
    ) {
      navigate("/profile/bookings", { replace: true });
    } else if (
      activeTab === "notifications" &&
      !location.pathname.endsWith("/notifications")
    ) {
      navigate("/profile/notifications", { replace: true });
    } else if (
      activeTab === "settings" &&
      !location.pathname.endsWith("/settings")
    ) {
      navigate("/profile/settings", { replace: true });
    }
  }, [activeTab, navigate, location.pathname]);

  // Đồng bộ tab với URL khi URL thay đổi
  useEffect(() => {
    const newActiveTab = getInitialTabFromUrl();
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Check if password change is required
    if (user && user.requiresPasswordChange) {
      // Redirect to settings page with state
      navigate("/profile/settings", {
        state: {
          passwordChangeRequired: true,
          from: location,
        },
      });
      return;
    }

    // ... phần còn lại của useEffect ...
  }, [isAuthenticated, user, navigate, location]);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 5000);
  };

  const fetchUserProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await axios.get(`${apiBaseUrl}/Auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = response.data;
      setProfile(profileData);
      setFormData({
        full_Name: profileData.full_Name || "",
        email: profileData.email || "",
        phone_Number: profileData.phone_Number || "",
        address: profileData.address || "",
        date_Of_Birth: profileData.date_Of_Birth || "",
        sex: profileData.sex || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      showAlert(
        "error",
        "Không thể tải thông tin người dùng. Vui lòng thử lại sau."
      );
    } finally {
      setIsProfileLoading(false);
    }
  }, [navigate, apiBaseUrl]);

  const fetchBookings = useCallback(async () => {
    setIsBookingsLoading(true);
    setBookings([]);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("error", "Vui lòng đăng nhập để xem lịch sử đặt vé.");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${apiBaseUrl}/Booking/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Kiểm tra cả hai trường hợp có thể có: $values hoặc values
      const apiBookings =
        response.data && response.data.$values
          ? response.data.$values
          : response.data && response.data.values
          ? response.data.values
          : [];

      if (apiBookings.length > 0) {
        const mappedBookings: Booking[] = apiBookings.map(
          (apiBooking: ApiBooking) => {
            const showDatePart = apiBooking.showtime.show_Date.split("T")[0];
            const showDateTimeString = `${showDatePart}T${apiBooking.showtime.start_Time}`;
            return {
              id: String(apiBooking.booking_ID),
              movieTitle:
                apiBooking.showtime.movie.movie_Name || "Không có tên phim",
              showtime: showDateTimeString,
              cinema:
                apiBooking.showtime.room.room_Name || "Không có tên phòng",
              totalAmount: apiBooking.total_Amount,
              bookingDate: apiBooking.booking_Date,
              status: apiBooking.status,
              paymentMethod: apiBooking.payment_Method,
              cancellationDate: apiBooking.cancellation_Date,
            };
          }
        );

        mappedBookings.sort((a, b) => {
          const showDateTimeA = parseISO(a.showtime);
          const showDateTimeB = parseISO(b.showtime);
          if (a.status === "Pending" && b.status !== "Pending") return -1;
          if (a.status !== "Pending" && b.status === "Pending") return 1;
          if (
            a.status === "Confirmed" &&
            isFuture(showDateTimeA) &&
            (b.status !== "Confirmed" || !isFuture(showDateTimeB))
          )
            return -1;
          if (
            b.status === "Confirmed" &&
            isFuture(showDateTimeB) &&
            (a.status !== "Confirmed" || !isFuture(showDateTimeA))
          )
            return 1;
          return (
            parseISO(b.bookingDate).getTime() -
            parseISO(a.bookingDate).getTime()
          );
        });

        setBookings(mappedBookings);
      } else {
        setBookings([]);
      }

      // Thêm log để debug
      console.log("API Response:", response.data);
      console.log("Extracted bookings:", apiBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showAlert("error", "Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.");
      setBookings([]);
    } finally {
      setIsBookingsLoading(false);
    }
  }, [navigate, apiBaseUrl]);

  const fetchNotifications = useCallback(async () => {
    setIsNotificationsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(`${apiBaseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          skip: 0,
          take: 10,
        },
      });

      const { notifications } = response.data;
      if (notifications && notifications.$values) {
        setNotifications(
          notifications.$values.map((notif: any) => ({
            id: String(notif.notification_ID),
            title: notif.title,
            message: notif.content,
            date: notif.creation_Date,
            isRead: notif.is_Read,
            type: notif.type.toLowerCase(), // Đảm bảo type là chữ thường để phù hợp với giao diện đã có
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      showAlert("error", "Không thể tải thông báo. Vui lòng thử lại sau.");
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [navigate, apiBaseUrl]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (activeTab === "bookings") fetchBookings();
    else if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, fetchBookings, fetchNotifications]);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const handlePayment = async (bookingId: string) => {
    try {
      setIsPaymentLoading((prev) => ({ ...prev, [bookingId]: true }));
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("error", "Vui lòng đăng nhập để thanh toán.");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${apiBaseUrl}/payos/payment-url/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        showAlert(
          "error",
          "Không thể tạo liên kết thanh toán. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      showAlert(
        "error",
        "Đã xảy ra lỗi khi tạo thanh toán. Vui lòng thử lại sau."
      );
    } finally {
      setIsPaymentLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    // Hiển thị dialog xác nhận trước khi hủy
    if (!window.confirm("Bạn có chắc chắn muốn hủy vé này không?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("error", "Vui lòng đăng nhập để thực hiện thao tác này.");
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `${apiBaseUrl}/Booking/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        showAlert("success", "Đã hủy vé thành công.");
        // Cập nhật lại danh sách đặt vé
        fetchBookings();
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showAlert("error", "Không thể hủy vé. Vui lòng thử lại sau.");
    }
  };

  const handleViewDetails = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showAlert("error", "Vui lòng đăng nhập để xem chi tiết.");
        navigate("/login");
        return;
      }

      const response = await axios.get<{ $values: TicketDetail[] }>(
        `${apiBaseUrl}/Ticket/booking/${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.$values) {
        setTicketDetails(response.data.$values);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      showAlert("error", "Không thể tải thông tin vé. Vui lòng thử lại sau.");
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
          <p className="mt-4 text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alert.show && (
          <AlertMessage
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <ProfileSidebar
              profile={profile}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleLogout={handleLogout}
              notificationCount={notifications.filter((n) => !n.isRead).length}
            />
          </div>
          <div className="md:col-span-3">
            {activeTab === "profile" && (
              <PersonalInfoTab
                profile={profile}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
                showAlert={showAlert}
                apiBaseUrl={apiBaseUrl}
                navigate={navigate}
                setProfile={setProfile}
              />
            )}
            {activeTab === "bookings" && (
              <BookingsHistoryTab
                bookings={bookings}
                isLoading={isBookingsLoading}
                isPaymentLoading={isPaymentLoading}
                handlePayment={handlePayment}
                handleCancelBooking={handleCancelBooking}
                handleViewDetails={handleViewDetails}
                navigate={navigate}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab
                notifications={notifications}
                isLoading={isNotificationsLoading}
                setNotifications={setNotifications}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
                showAlert={showAlert}
                apiBaseUrl={apiBaseUrl}
                navigate={navigate}
              />
            )}
          </div>
        </div>
      </div>
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        tickets={ticketDetails}
      />
    </div>
  );
};

export default ProfilePage;
