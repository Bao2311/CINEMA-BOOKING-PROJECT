import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import {
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaCheck,
  FaEllipsisV,
  FaInfoCircle,
  FaTicketAlt,
  FaShoppingBasket,
  FaUsers,
  FaPercent,
  FaTag,
  FaCalendarDay,
  FaFilm,
  FaExclamationTriangle,
  FaClock,
  FaHistory,
  FaUndo,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// Types
interface Promotion {
  id: string;
  name: string;
  code: string;
  discountType: "Percentage" | "Fixed";
  discountValue: number;
  maxDiscount?: number;
  minPurchase?: number;
  startDate: string;
  endDate: string;
  applicableItems: string[];
  description?: string;
  isVIP?: boolean;
  usageLimit?: number;
  usageCount: number;
  status: "active" | "scheduled" | "expired" | "disabled";
}

interface FilterOptions {
  searchTerm: string;
  statusFilter: string;
  promotionType: string[];
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  isExpiringSoon: boolean;
  isLimited: boolean;
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// API Service
const API_BASE_URL = "https://localhost:7168/api";

const promotionService = {
  getAllPromotions: async (): Promise<Promotion[]> => {
    try {
      const token = localStorage.getItem("token") || "";
      const response = await axios.get(
        `${API_BASE_URL}/Promotion?includeInactive=false`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.data.$values) throw new Error("Invalid response format");
      return response.data.$values.map((item: any) => ({
        id: item.promotion_ID.toString(),
        name: item.title,
        code: item.promotion_Code,
        discountType:
          item.discount_Type.toLowerCase() === "Percentage"
            ? "Percentage"
            : "Fixed",
        discountValue: item.discount_Value,
        maxDiscount: item.maximum_Discount || undefined,
        minPurchase: item.minimum_Purchase || undefined,
        startDate: item.start_Date,
        endDate: item.end_Date,
        applicableItems: item.applicable_For
          .split(",")
          .map((i: string) => i.toLowerCase()),
        description: item.promotion_Detail || undefined,
        isVIP: item.applicable_For.toLowerCase() === "member",
        usageLimit: item.usage_Limit || undefined,
        usageCount: item.current_Usage,
        status: item.is_Active
          ? "active"
          : item.is_Expired
          ? "expired"
          : "disabled",
      }));
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể tải danh sách khuyến mãi"
      );
    }
  },

  createPromotion: async (
    promotion: Omit<Promotion, "id" | "usageCount" | "status">
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token") || "";
      const apiData = {
        title: promotion.name,
        promotion_Code: promotion.code,
        start_Date: new Date(promotion.startDate).toISOString(),
        end_Date: new Date(promotion.endDate).toISOString(),
        discount_Type: promotion.discountType,
        discount_Value: promotion.discountValue,
        minimum_Purchase: promotion.minPurchase || 0,
        maximum_Discount: promotion.maxDiscount || 0,
        applicable_For: promotion.applicableItems.join(","),
        usage_Limit: promotion.usageLimit || 0,
        status:
          new Date(promotion.startDate) > new Date() ? "scheduled" : "active",
        promotion_Detail: promotion.description || "",
      };
      const response = await axios.post(`${API_BASE_URL}/Promotion`, apiData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("API Response:", response.data);
      return true;
    } catch (error) {
      console.error("Create Promotion Error:", error.response?.data);
      throw new Error(
        error.response?.data?.message || "Không thể tạo khuyến mãi"
      );
    }
  },

  updatePromotion: async (
    id: string,
    promotion: Partial<Promotion>
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token") || "";
      const apiData = {
        title: promotion.name,
        promotion_Code: promotion.code,
        start_Date: promotion.startDate
          ? new Date(promotion.startDate).toISOString()
          : undefined,
        end_Date: promotion.endDate
          ? new Date(promotion.endDate).toISOString()
          : undefined,
        discount_Type: promotion.discountType,
        discount_Value: promotion.discountValue,
        minimum_Purchase: promotion.minPurchase,
        maximum_Discount: promotion.maxDiscount,
        applicable_For: promotion.applicableItems?.join(","),
        usage_Limit: promotion.usageLimit,
        status: promotion.status,
        promotion_Detail: promotion.description,
      };
      await axios.put(`${API_BASE_URL}/Promotion/${id}`, apiData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể cập nhật khuyến mãi"
      );
    }
  },

  deletePromotion: async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("token") || "";
      await axios.delete(`${API_BASE_URL}/Promotion/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Không thể xóa khuyến mãi"
      );
    }
  },
};

// Utility Functions
const validatePromotionData = (
  data: any
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  if (!data.name?.trim()) errors.name = "Tên không được để trống";
  if (!data.code?.trim()) errors.code = "Mã không được để trống";
  if (!data.discountValue || data.discountValue <= 0)
    errors.discountValue = "Giá trị giảm giá phải lớn hơn 0";
  if (data.discountType === "Percentage" && data.discountValue > 100)
    errors.discountValue = "Phần trăm không vượt quá 100%";
  if (!data.startDate) errors.startDate = "Ngày bắt đầu không được để trống";
  if (!data.endDate) errors.endDate = "Ngày kết thúc không được để trống";
  if (
    data.startDate &&
    data.endDate &&
    new Date(data.startDate) >= new Date(data.endDate)
  )
    errors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
  if (!data.applicableItems?.length)
    errors.applicableItems = "Chọn ít nhất một loại áp dụng";
  return { isValid: Object.keys(errors).length === 0, errors };
};

const checkPromotionValidity = (promotion: Promotion) => {
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  if (now < startDate)
    return { isValid: false, status: "scheduled", message: "Chưa bắt đầu" };
  if (now > endDate)
    return { isValid: false, status: "expired", message: "Đã hết hạn" };
  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit)
    return { isValid: false, status: "active", message: "Hết lượt sử dụng" };
  if (promotion.status === "disabled")
    return { isValid: false, status: "disabled", message: "Đã vô hiệu hóa" };
  const daysUntilExpiry = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysUntilExpiry <= 7;
  return {
    isValid: true,
    status: "active",
    isExpiringSoon,
    daysUntilExpiry,
    message: isExpiringSoon
      ? `Hết hạn trong ${daysUntilExpiry} ngày`
      : "Hợp lệ",
  };
};

// Modal Animations
const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// Utility to format numbers with dots for thousands
const formatNumberWithDots = (number: number | undefined): string => {
  if (number === undefined || number === null) return "0";
  return new Intl.NumberFormat("vi-VN").format(number);
};

// Utility to parse formatted number back to raw number
const parseFormattedNumber = (value: string): number => {
  // Remove all dots and convert to number
  return Number(value.replace(/\./g, ""));
};

// Components
const TagSelector: React.FC<{
  tags: string[];
  selectedTags: string[];
  onChange: (tag: string) => void;
}> = ({ tags, selectedTags, onChange }) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {tags.map((tag) => (
      <div
        key={tag}
        onClick={() => onChange(tag)}
        className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${
          selectedTags.includes(tag)
            ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
            : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
        }`}
      >
        <FaFilm
          className={`mr-1.5 ${
            selectedTags.includes(tag) ? "text-indigo-500" : "text-gray-500"
          }`}
          size={12}
        />
        {tag}
        {selectedTags.includes(tag) && (
          <FaCheck className="ml-1.5 text-indigo-500" size={10} />
        )}
      </div>
    ))}
  </div>
);

const EnhancedDatePicker: React.FC<{
  selected: Date | null;
  onChange: (date: Date) => void;
  placeholder: string;
  minDate?: Date;
  required?: boolean;
  error?: string;
}> = ({ selected, onChange, placeholder, minDate, required, error }) => (
  <div className="relative">
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="dd/MM/yyyy HH:mm"
      placeholderText={placeholder}
      minDate={minDate}
      required={required}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      className={`w-full border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-2 ${
        error ? "focus:ring-red-500" : "focus:ring-indigo-500"
      }`}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
      <FaCalendarDay className={error ? "text-red-400" : "text-gray-400"} />
    </div>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const ItemTypeSelector: React.FC<{
  selectedItems: string[];
  onChange: (itemId: string) => void;
  error?: string;
}> = ({ selectedItems, onChange, error }) => {
  const itemTypes = [
    { id: "ticket", label: "Vé", icon: <FaTicketAlt />, color: "indigo" },
    { id: "membership", label: "Thành viên", icon: <FaUsers />, color: "blue" },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {itemTypes.map((item) => (
          <div
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`px-3 py-2 rounded-lg text-sm cursor-pointer ${
              selectedItems.includes(item.id)
                ? `bg-${item.color}-100 text-${item.color}-700 border-${item.color}-300`
                : `hover:bg-${item.color}-50 hover:border-${item.color}-200 border-gray-300 text-gray-700`
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
            {selectedItems.includes(item.id) && (
              <FaCheck className="ml-1.5" size={10} />
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

const CustomToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <label className="flex items-center cursor-pointer">
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`w-10 h-5 bg-gray-300 rounded-full shadow-inner ${
          checked ? "bg-indigo-500" : ""
        }`}
      ></div>
      <div
        className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        } top-0.75`}
        style={{ top: "3px", left: "2px" }}
      ></div>
    </div>
    {label && <span className="ml-2 text-sm text-gray-700">{label}</span>}
  </label>
);

const PromotionRow: React.FC<{
  promotion: Promotion;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  onExtend: () => void;
}> = ({ promotion, onEdit, onDelete, onView, onExtend }) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      )
        setShowActions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const isExpiringSoon = () => {
    const today = new Date();
    const endDate = new Date(promotion.endDate);
    const diffDays = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 7 && diffDays > 0 && promotion.status === "active";
  };
  const isNearUsageLimit = () =>
    promotion.usageLimit && promotion.usageCount >= promotion.usageLimit * 0.9;

  const getStatusBadge = () => {
    const statusStyles = {
      active: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: <FaCheck className="mr-1.5" size={12} />,
        label: "Đang hoạt động",
      },
      scheduled: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: <FaClock className="mr-1.5" size={12} />,
        label: "Sắp diễn ra",
      },
      expired: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: <FaHistory className="mr-1.5" size={12} />,
        label: "Đã hết hạn",
      },
      disabled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: <FaTimes className="mr-1.5" size={12} />,
        label: "Đã vô hiệu",
      },
    };
    const { bg, text, icon, label } = statusStyles[promotion.status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="hover:bg-gray-50"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 flex items-center">
          {promotion.name}
          {promotion.isVIP && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-sm">
              VIP
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 font-mono mt-1">
          {promotion.code}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {promotion.discountType === "Percentage" ? (
            <div className="flex items-center text-sm text-gray-900">
              <span className="font-medium">{promotion.discountValue}%</span>
              {promotion.maxDiscount ? (
                <span className="text-gray-500 ml-1.5">
                  (tối đa {formatNumberWithDots(promotion.maxDiscount)}đ)
                </span>
              ) : null}
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-900">
              {formatNumberWithDots(promotion.discountValue)}đ
            </div>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {promotion.applicableItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm bg-gray-100 text-gray-800"
            >
              {item === "ticket" ? (
                <>
                  <FaTicketAlt className="mr-1.5" size={12} />
                  Vé
                </>
              ) : (
                <>
                  <FaUsers className="mr-1.5" size={12} />
                  Thành viên
                </>
              )}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatDate(promotion.startDate)}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          đến {formatDate(promotion.endDate)}
        </div>
        {isExpiringSoon() && (
          <div className="mt-1.5 flex items-center text-xs text-amber-600">
            <FaExclamationTriangle className="mr-1" size={10} />
            Sắp hết hạn
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge()}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {promotion.usageCount}
          {promotion.usageLimit ? `/${promotion.usageLimit}` : ""}
        </div>
        {isNearUsageLimit() && (
          <div className="mt-1.5 flex items-center text-xs text-amber-600">
            <FaExclamationTriangle className="mr-1" size={10} />
            Sắp đạt giới hạn
          </div>
        )}
        {promotion.usageLimit && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
            <div
              className={`h-1.5 rounded-full ${
                promotion.usageCount / promotion.usageLimit > 0.9
                  ? "bg-red-500"
                  : "bg-indigo-500"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (promotion.usageCount / promotion.usageLimit) * 100
                )}%`,
              }}
            ></div>
          </div>
        )}
      </td>
      <td
        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative"
        ref={actionsRef}
      >
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-gray-400 hover:text-gray-500"
        >
          <FaEllipsisV />
        </button>
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onView();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaInfoCircle className="mr-3 text-gray-400" />
                  Xem chi tiết
                </button>
                {promotion.status !== "expired" &&
                  promotion.status !== "disabled" && (
                    <button
                      onClick={() => {
                        onEdit();
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FaEdit className="mr-3 text-gray-400" />
                      Chỉnh sửa
                    </button>
                  )}
                {promotion.status === "expired" && (
                  <button
                    onClick={() => {
                      onExtend();
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <FaUndo className="mr-3 text-gray-400" />
                    Gia hạn
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <FaTrash className="mr-3 text-red-500" />
                  {promotion.usageCount > 0 ? "Vô hiệu hóa" : "Xóa"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
};

const PromotionsList: React.FC<{
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  onView: (promotion: Promotion) => void;
  onExtend: (promotion: Promotion) => void;
}> = ({ promotions, onEdit, onDelete, onView, onExtend }) => (
  <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
    {promotions.length === 0 ? (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FaTicketAlt className="text-gray-400" size={24} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Không có khuyến mãi nào
        </h3>
        <p className="text-gray-500">Hãy thêm khuyến mãi mới để bắt đầu.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên & Mã
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giảm giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sử dụng
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promotions.map((promotion) => (
              <PromotionRow
                key={promotion.id}
                promotion={promotion}
                onEdit={() => onEdit(promotion)}
                onDelete={() => onDelete(promotion)}
                onView={() => onView(promotion)}
                onExtend={() => onExtend(promotion)}
              />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const PromotionsFilter: React.FC<{
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
}> = ({ filters, setFilters, resetFilters }) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "active", label: "Đang hoạt động" },
    { value: "scheduled", label: "Sắp diễn ra" },
    { value: "expired", label: "Đã hết hạn" },
    { value: "disabled", label: "Đã vô hiệu" },
  ];
  const promotionTypes = [
    { id: "Percentage", label: "Giảm theo %", icon: <FaPercent /> },
    { id: "Fixed", label: "Giảm số tiền cố định", icon: <FaTag /> },
  ];

  const handlePromotionTypeToggle = (type: string) => {
    setFilters((prev) => ({
      ...prev,
      promotionType: prev.promotionType.includes(type)
        ? prev.promotionType.filter((t) => t !== type)
        : [...prev.promotionType, type],
    }));
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="w-full md:w-2/5 relative">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã..."
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-48">
            <select
              value={filters.statusFilter}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  statusFilter: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            <FaFilter className="mr-1.5" />
            Bộ lọc{" "}
            {showAdvancedFilters ? (
              <FaChevronUp className="ml-1" />
            ) : (
              <FaChevronDown className="ml-1" />
            )}
          </button>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <FaUndo className="mr-1.5" size={12} />
            Đặt lại
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại khuyến mãi
                </label>
                <div className="flex space-x-4">
                  {promotionTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => handlePromotionTypeToggle(type.id)}
                      className={`px-3 py-2 rounded-lg text-sm cursor-pointer ${
                        filters.promotionType.includes(type.id)
                          ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                          : "hover:bg-indigo-50 hover:border-indigo-200 border-gray-300 text-gray-700"
                      }`}
                    >
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng thời gian
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <EnhancedDatePicker
                    selected={filters.dateRangeStart}
                    onChange={(date) =>
                      setFilters((prev) => ({ ...prev, dateRangeStart: date }))
                    }
                    placeholder="Từ ngày"
                  />
                  <EnhancedDatePicker
                    selected={filters.dateRangeEnd}
                    onChange={(date) =>
                      setFilters((prev) => ({ ...prev, dateRangeEnd: date }))
                    }
                    placeholder="Đến ngày"
                    minDate={filters.dateRangeStart || undefined}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lọc thêm
                </label>
                <div className="space-y-3">
                  <CustomToggle
                    checked={filters.isExpiringSoon}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        isExpiringSoon: !prev.isExpiringSoon,
                      }))
                    }
                    label="Sắp hết hạn (trong 7 ngày)"
                  />
                  <CustomToggle
                    checked={filters.isLimited}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        isLimited: !prev.isLimited,
                      }))
                    }
                    label="Có giới hạn số lần sử dụng"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PromotionFormModal: React.FC<{
  title: string;
  initialData?: Promotion;
  onClose: () => void;
  onSubmit: (data: any) => void;
  error?: string;
}> = ({ title, initialData, onClose, onSubmit, error }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [formData, setFormData] = useState<Promotion>({
    id: "",
    name: "",
    code: "",
    discountType: "Percentage",
    discountValue: 0,
    maxDiscount: 0,
    minPurchase: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(
      new Date().setDate(new Date().getDate() + 30)
    ).toISOString(),
    applicableItems: [],
    description: "",
    isVIP: false,
    usageLimit: 0,
    usageCount: 0,
    status: "active",
    ...initialData,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // State to hold the formatted display values
  const [formattedValues, setFormattedValues] = useState({
    discountValue: "",
    maxDiscount: "",
    minPurchase: "",
    usageLimit: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || "",
        name: initialData.name || "",
        code: initialData.code || "",
        discountType: initialData.discountType || "percentage",
        discountValue: initialData.discountValue || 0,
        maxDiscount: initialData.maxDiscount || 0,
        minPurchase: initialData.minPurchase || 0,
        startDate: initialData.startDate || new Date().toISOString(),
        endDate:
          initialData.endDate ||
          new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        applicableItems: initialData.applicableItems || [],
        description: initialData.description || "",
        isVIP: initialData.isVIP || false,
        usageLimit: initialData.usageLimit || 0,
        usageCount: initialData.usageCount || 0,
        status: initialData.status || "active",
      });
      // Initialize formatted values
      setFormattedValues({
        discountValue: formatNumberWithDots(initialData.discountValue || 0),
        maxDiscount: formatNumberWithDots(initialData.maxDiscount || 0),
        minPurchase: formatNumberWithDots(initialData.minPurchase || 0),
        usageLimit: formatNumberWithDots(initialData.usageLimit || 0),
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (
      name === "discountValue" ||
      name === "maxDiscount" ||
      name === "minPurchase" ||
      name === "usageLimit"
    ) {
      // Parse the formatted value back to a raw number
      const rawValue = parseFormattedNumber(value);
      setFormData((prev) => ({ ...prev, [name]: rawValue }));
      // Format the value for display
      setFormattedValues((prev) => ({
        ...prev,
        [name]: formatNumberWithDots(rawValue),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleItemTypeToggle = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      applicableItems: prev.applicableItems.includes(item)
        ? prev.applicableItems.filter((i) => i !== item)
        : [...prev.applicableItems, item],
    }));
    if (errors.applicableItems)
      setErrors((prev) => ({ ...prev, applicableItems: "" }));
  };

  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 để so sánh chỉ ngày

    if (step === 1) {
      if (!formData.name) newErrors.name = "Tên khuyến mãi là bắt buộc";
      if (!formData.code) newErrors.code = "Mã khuyến mãi là bắt buộc";
      if (!formData.discountValue || formData.discountValue <= 0)
        newErrors.discountValue = "Giá trị giảm giá phải lớn hơn 0";
      if (
        formData.discountType === "Percentage" &&
        formData.discountValue > 100
      )
        newErrors.discountValue = "Phần trăm không vượt quá 100%";
    }
    if (step === 2) {
      if (!formData.startDate) newErrors.startDate = "Ngày bắt đầu là bắt buộc";
      if (!formData.endDate) newErrors.endDate = "Ngày kết thúc là bắt buộc";
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.startDate) >= new Date(formData.endDate)
      )
        newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      if (formData.startDate && new Date(formData.startDate) < currentDate)
        newErrors.startDate = "Ngày bắt đầu không được là quá khứ";
    }
    if (step === 3 && formData.applicableItems.length === 0)
      newErrors.applicableItems = "Vui lòng chọn ít nhất một mục áp dụng";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((prev) => prev + 1);
  };
  const handlePrev = () => setStep((prev) => prev - 1);
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step < totalSteps) return handleNext();
    if (!validateStep()) return;
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FaTimes />
          </button>
        </div>
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step > index + 1
                        ? "bg-indigo-600"
                        : step === index + 1
                        ? "bg-indigo-500"
                        : "bg-gray-200"
                    } text-white font-medium`}
                  >
                    {step > index + 1 ? <FaCheck /> : index + 1}
                  </div>
                  <div className="text-xs mt-2 text-gray-600">
                    {index === 0
                      ? "Thông tin cơ bản"
                      : index === 1
                      ? "Thời gian & Giới hạn"
                      : "Phạm vi áp dụng"}
                  </div>
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > index + 1 ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div
          className="px-6 py-4 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 180px)" }}
        >
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tên khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full border ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } rounded-lg py-2 px-3 focus:outline-none focus:ring-2 ${
                      errors.name
                        ? "focus:ring-red-500"
                        : "focus:ring-indigo-500"
                    }`}
                    placeholder="Nhập tên khuyến mãi"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mã khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }));
                      if (errors.code)
                        setErrors((prev) => ({ ...prev, code: "" }));
                    }}
                    className={`w-full border ${
                      errors.code ? "border-red-500" : "border-gray-300"
                    } rounded-lg py-2 px-3 focus:outline-none focus:ring-2 ${
                      errors.code
                        ? "focus:ring-red-500"
                        : "focus:ring-indigo-500"
                    }`}
                    placeholder="Nhập mã khuyến mãi (VD: SUMMER2023)"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="discountType"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="discountType"
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Percentage">Giảm theo phần trăm (%)</option>
                    <option value="Fixed">Giảm số tiền cố định</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="discountValue"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Giá trị giảm giá <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="discountValue"
                      name="discountValue"
                      value={formattedValues.discountValue}
                      onChange={handleChange}
                      className={`w-full border ${
                        errors.discountValue
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg py-2 px-3 focus:outline-none focus:ring-2 ${
                        errors.discountValue
                          ? "focus:ring-red-500"
                          : "focus:ring-indigo-500"
                      }`}
                      placeholder={
                        formData.discountType === "Percentage"
                          ? "Nhập % giảm giá"
                          : "Nhập số tiền giảm giá"
                      }
                    />
                    <span className="ml-2 text-gray-500">
                      {formData.discountType === "Percentage" ? "%" : "đ"}
                    </span>
                  </div>
                  {errors.discountValue && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.discountValue}
                    </p>
                  )}
                </div>
                {formData.discountType === "Percentage" && (
                  <div>
                    <label
                      htmlFor="maxDiscount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Giảm tối đa{" "}
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        id="maxDiscount"
                        name="maxDiscount"
                        value={formattedValues.maxDiscount}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nhập số tiền giảm tối đa"
                      />
                      <span className="ml-2 text-gray-500">đ</span>
                    </div>
                    {formData.maxDiscount > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        Giảm tối đa:{" "}
                        {formatNumberWithDots(formData.maxDiscount)}đ
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label
                    htmlFor="minPurchase"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Giá trị đơn hàng tối thiểu
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="minPurchase"
                      name="minPurchase"
                      value={formattedValues.minPurchase}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nhập giá trị đơn hàng tối thiểu"
                    />
                    <span className="ml-2 text-gray-500">đ</span>
                  </div>
                  {formData.minPurchase > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Đơn hàng tối thiểu:{" "}
                      {formatNumberWithDots(formData.minPurchase)}đ
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mô tả khuyến mãi
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập mô tả chi tiết về khuyến mãi"
                  />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian áp dụng <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="startDate"
                        className="block text-sm text-gray-500 mb-1"
                      >
                        Ngày bắt đầu
                      </label>
                      <EnhancedDatePicker
                        selected={
                          formData.startDate
                            ? new Date(formData.startDate)
                            : null
                        }
                        onChange={(date: Date) => {
                          setFormData((prev) => ({
                            ...prev,
                            startDate: date.toISOString(),
                          }));
                          if (errors.startDate)
                            setErrors((prev) => ({ ...prev, startDate: "" }));
                        }}
                        placeholder="Chọn ngày bắt đầu"
                        required
                        error={errors.startDate}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="endDate"
                        className="block text-sm text-gray-500 mb-1"
                      >
                        Ngày kết thúc
                      </label>
                      <EnhancedDatePicker
                        selected={
                          formData.endDate ? new Date(formData.endDate) : null
                        }
                        onChange={(date: Date) => {
                          setFormData((prev) => ({
                            ...prev,
                            endDate: date.toISOString(),
                          }));
                          if (errors.endDate)
                            setErrors((prev) => ({ ...prev, endDate: "" }));
                        }}
                        placeholder="Chọn ngày kết thúc"
                        minDate={
                          formData.startDate
                            ? new Date(formData.startDate)
                            : undefined
                        }
                        required
                        error={errors.endDate}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="usageLimit"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Giới hạn số lần sử dụng
                  </label>
                  <input
                    type="text"
                    id="usageLimit"
                    name="usageLimit"
                    value={formattedValues.usageLimit}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập số lần sử dụng tối đa"
                  />
                </div>
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isVIP"
                      name="isVIP"
                      checked={formData.isVIP}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isVIP"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Chỉ áp dụng cho thành viên VIP
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Nếu được chọn, chỉ khách hàng có tài khoản VIP mới có thể sử
                    dụng khuyến mãi này
                  </p>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Áp dụng cho <span className="text-red-500">*</span>
                  </label>
                  <ItemTypeSelector
                    selectedItems={formData.applicableItems}
                    onChange={handleItemTypeToggle}
                    error={errors.applicableItems}
                  />
                </div>
              </div>
            )}
          </form>
        </div>
        <div className="px-6 py-4 border-t flex justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <FaChevronLeft className="inline mr-1" size={12} />
                Quay lại
              </button>
            )}
          </div>
          <div>
            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Tiếp tục
                <FaChevronRight className="inline ml-1" size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Lưu khuyến mãi
                <FaCheck className="inline ml-1.5" size={12} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PromotionDetailsModal: React.FC<{
  promotion: Promotion;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExtend: () => void;
}> = ({ promotion, onClose, onEdit, onDelete, onExtend }) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const validityInfo = checkPromotionValidity(promotion);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Chi tiết khuyến mãi
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <FaTimes />
          </button>
        </div>
        <div
          className="px-6 py-4 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 130px)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {promotion.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Mã:{" "}
                <span className="font-mono font-medium">{promotion.code}</span>
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  validityInfo.status === "active"
                    ? "bg-green-100 text-green-800"
                    : validityInfo.status === "scheduled"
                    ? "bg-blue-100 text-blue-800"
                    : validityInfo.status === "expired"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {validityInfo.status === "active"
                  ? "Đang hoạt động"
                  : validityInfo.status === "scheduled"
                  ? "Sắp diễn ra"
                  : validityInfo.status === "expired"
                  ? "Đã hết hạn"
                  : "Đã vô hiệu"}
              </span>
              {promotion.isVIP && (
                <span className="ml-2 px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  VIP
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Loại giảm giá
                </h4>
                <p className="mt-1 text-base">
                  {promotion.discountType === "Percentage" ? (
                    <>
                      <span className="font-medium">
                        {promotion.discountValue}%
                      </span>
                      {promotion.maxDiscount ? (
                        <span className="text-gray-600 ml-1">
                          (tối đa {formatNumberWithDots(promotion.maxDiscount)}
                          đ)
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="font-medium">
                      {formatNumberWithDots(promotion.discountValue)}đ
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Thời gian áp dụng
                </h4>
                <p className="mt-1 text-base">
                  {formatDate(promotion.startDate)} -{" "}
                  {formatDate(promotion.endDate)}
                </p>
                {validityInfo.isExpiringSoon && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                    <FaExclamationTriangle className="mr-1" size={12} />
                    Sắp hết hạn (còn {validityInfo.daysUntilExpiry} ngày)
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Giới hạn sử dụng
                </h4>
                <p className="mt-1 text-base">
                  {promotion.usageLimit ? (
                    <>
                      <span className="font-medium">
                        {promotion.usageCount}/{promotion.usageLimit}
                      </span>
                      <span className="text-gray-600 ml-1">
                        (
                        {Math.round(
                          (promotion.usageCount / promotion.usageLimit) * 100
                        )}
                        %)
                      </span>
                    </>
                  ) : (
                    <span>
                      Không giới hạn ({promotion.usageCount} đã sử dụng)
                    </span>
                  )}
                </p>
                {promotion.usageLimit && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        promotion.usageCount / promotion.usageLimit > 0.9
                          ? "bg-red-500"
                          : "bg-indigo-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (promotion.usageCount / promotion.usageLimit) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
              {promotion.minPurchase > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Giá trị đơn hàng tối thiểu
                  </h4>
                  <p className="mt-1 text-base font-medium">
                    {formatNumberWithDots(promotion.minPurchase)}đ
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Áp dụng cho
                </h4>
                <div className="text-xs text-gray-500 mt-1">
                  {promotion.applicableItems
                    .map((item) => (item === "ticket" ? "Vé" : "Thành viên"))
                    .join(", ")}
                </div>
              </div>
              {promotion.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Mô tả</h4>
                  <p className="mt-1 text-base text-gray-700">
                    {promotion.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-between">
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Đóng
            </button>
          </div>
          <div className="flex space-x-3">
            {promotion.status === "expired" && (
              <button
                onClick={onExtend}
                className="px-4 py-2 bg-amber-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <FaUndo className="inline mr-1.5" size={12} />
                Gia hạn
              </button>
            )}
            {promotion.status !== "expired" &&
              promotion.status !== "disabled" && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <FaEdit className="inline mr-1.5" size={12} />
                  Chỉnh sửa
                </button>
              )}
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <FaTrash className="inline mr-1.5" size={12} />
              {promotion.usageCount > 0 ? "Vô hiệu hóa" : "Xóa"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ConfirmationModal: React.FC<{
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDelete?: boolean;
}> = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDelete,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="bg-white rounded-lg shadow-xl w-full max-w-md"
    >
      <div className="px-6 py-4">
        <div className="flex items-center mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDelete ? "bg-red-100" : "bg-amber-100"
            } mr-4`}
          >
            {isDelete ? (
              <FaExclamationTriangle className="text-red-600" size={20} />
            ) : (
              <FaInfoCircle className="text-amber-600" size={20} />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      <div className="px-6 py-4 border-t flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 ${
            isDelete
              ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              : "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const Toast: React.FC<{
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-green-50 border-green-500",
      icon: <FaCheck className="text-green-500" size={16} />,
    },
    error: {
      bg: "bg-red-50 border-red-500",
      icon: <FaTimes className="text-red-500" size={16} />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-500",
      icon: <FaExclamationTriangle className="text-amber-500" size={16} />,
    },
    info: {
      bg: "bg-blue-50 border-blue-500",
      icon: <FaInfoCircle className="text-blue-500" size={16} />,
    },
  };
  const { bg, icon } = styles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 w-80 border-l-4 ${bg} p-4 shadow-lg rounded-r-lg`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">{icon}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-gray-800">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="bg-transparent text-gray-400 hover:text-gray-500"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
const ManagePromotionPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showExtendModal, setShowExtendModal] = useState<boolean>(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({ show: false, message: "", type: "info" });
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    statusFilter: "all",
    promotionType: [],
    dateRangeStart: null,
    dateRangeEnd: null,
    isExpiringSoon: false,
    isLimited: false,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await promotionService.getAllPromotions();
      setPromotions(data);
      setPagination((prev) => ({
        ...prev,
        totalPages: Math.ceil(data.length / prev.itemsPerPage),
      }));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions = useMemo(
    () =>
      promotions.filter((promotion) => {
        if (
          filters.searchTerm &&
          !promotion.name
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) &&
          !promotion.code
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase())
        )
          return false;
        if (
          filters.statusFilter !== "all" &&
          promotion.status !== filters.statusFilter
        )
          return false;
        if (
          filters.promotionType.length > 0 &&
          !filters.promotionType.includes(promotion.discountType)
        )
          return false;
        if (
          filters.dateRangeStart &&
          new Date(promotion.startDate) < filters.dateRangeStart
        )
          return false;
        if (
          filters.dateRangeEnd &&
          new Date(promotion.endDate) > filters.dateRangeEnd
        )
          return false;
        if (filters.isExpiringSoon) {
          const today = new Date();
          const endDate = new Date(promotion.endDate);
          const diffDays = Math.ceil(
            (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (!(diffDays <= 7 && diffDays > 0 && promotion.status === "active"))
            return false;
        }
        if (filters.isLimited && !promotion.usageLimit) return false;
        return true;
      }),
    [promotions, filters]
  );

  const paginatedPromotions = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredPromotions.slice(startIndex, endIndex);
  }, [filteredPromotions, pagination.currentPage, pagination.itemsPerPage]);

  const resetFilters = () =>
    setFilters({
      searchTerm: "",
      statusFilter: "all",
      promotionType: [],
      dateRangeStart: null,
      dateRangeEnd: null,
      isExpiringSoon: false,
      isLimited: false,
    });
  const handlePageChange = (page: number) =>
    setPagination((prev) => ({ ...prev, currentPage: page }));
  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => setToast({ show: true, message, type });

  const handleAddPromotion = async (data: any) => {
    try {
      setFormError(null);
      const success = await promotionService.createPromotion(data);
      if (success) {
        await fetchPromotions();
        setShowAddModal(false);
        showToast("Thêm khuyến mãi thành công", "success");
      }
    } catch (err) {
      setFormError(err.message);
      showToast("Thêm khuyến mãi thất bại", "error");
    }
  };

  const handleEditPromotion = async (data: any) => {
    if (!selectedPromotion) return;
    try {
      setFormError(null);
      const success = await promotionService.updatePromotion(
        selectedPromotion.id,
        data
      );
      if (success) {
        await fetchPromotions();
        setShowEditModal(false);
        showToast("Cập nhật khuyến mãi thành công", "success");
      }
    } catch (err) {
      setFormError(err.message);
      showToast("Cập nhật khuyến mãi thất bại", "error");
    }
  };

  const handleDeletePromotion = async () => {
    if (!selectedPromotion) return;
    try {
      const success = await promotionService.deletePromotion(
        selectedPromotion.id
      );
      if (success) {
        await fetchPromotions();
        setShowDeleteModal(false);
        showToast(
          selectedPromotion.usageCount > 0
            ? "Vô hiệu hóa khuyến mãi thành công"
            : "Xóa khuyến mãi thành công",
          "success"
        );
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleExtendPromotion = async (data: any) => {
    if (!selectedPromotion) return;
    try {
      setFormError(null);
      const success = await promotionService.updatePromotion(
        selectedPromotion.id,
        { ...data, status: "active" }
      );
      if (success) {
        await fetchPromotions();
        setShowExtendModal(false);
        showToast("Gia hạn khuyến mãi thành công", "success");
      }
    } catch (err) {
      setFormError(err.message);
      showToast("Gia hạn khuyến mãi thất bại", "error");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý khuyến mãi
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo và quản lý các chương trình khuyến mãi
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
        >
          <FaPlus className="mr-2" />
          Thêm khuyến mãi
        </button>
      </div>
      <PromotionsFilter
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
      />
      {loading ? (
        <div className="mt-6 bg-white rounded-lg shadow p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="mt-6 bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="text-red-500" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Đã xảy ra lỗi
          </h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchPromotions}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <PromotionsList
            promotions={paginatedPromotions}
            onEdit={(promotion) => {
              setSelectedPromotion(promotion);
              setShowEditModal(true);
            }}
            onDelete={(promotion) => {
              setSelectedPromotion(promotion);
              setShowDeleteModal(true);
            }}
            onView={(promotion) => {
              setSelectedPromotion(promotion);
              setShowViewModal(true);
            }}
            onExtend={(promotion) => {
              setSelectedPromotion(promotion);
              setShowExtendModal(true);
            }}
          />
          {filteredPromotions.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị{" "}
                <span className="font-medium">
                  {paginatedPromotions.length}
                </span>{" "}
                trên tổng số{" "}
                <span className="font-medium">{filteredPromotions.length}</span>{" "}
                khuyến mãi
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handlePageChange(Math.max(1, pagination.currentPage - 1))
                  }
                  disabled={pagination.currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    pagination.currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } border border-gray-300`}
                >
                  <FaChevronLeft size={12} />
                </button>
                {Array.from({ length: pagination.totalPages }).map(
                  (_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 rounded-md ${
                        pagination.currentPage === index + 1
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } border border-gray-300`}
                    >
                      {index + 1}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    handlePageChange(
                      Math.min(
                        pagination.totalPages,
                        pagination.currentPage + 1
                      )
                    )
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`px-3 py-1 rounded-md ${
                    pagination.currentPage === pagination.totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } border border-gray-300`}
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <AnimatePresence>
        {showAddModal && (
          <PromotionFormModal
            title="Thêm khuyến mãi mới"
            onClose={() => {
              setShowAddModal(false);
              setFormError(null);
            }}
            onSubmit={handleAddPromotion}
            error={formError}
          />
        )}
        {showEditModal && selectedPromotion && (
          <PromotionFormModal
            title="Chỉnh sửa khuyến mãi"
            initialData={selectedPromotion}
            onClose={() => {
              setShowEditModal(false);
              setFormError(null);
            }}
            onSubmit={handleEditPromotion}
            error={formError}
          />
        )}
        {showViewModal && selectedPromotion && (
          <PromotionDetailsModal
            promotion={selectedPromotion}
            onClose={() => setShowViewModal(false)}
            onEdit={() => {
              setShowViewModal(false);
              setShowEditModal(true);
            }}
            onDelete={() => {
              setShowViewModal(false);
              setShowDeleteModal(true);
            }}
            onExtend={() => {
              setShowViewModal(false);
              setShowExtendModal(true);
            }}
          />
        )}
        {showDeleteModal && selectedPromotion && (
          <ConfirmationModal
            title={
              selectedPromotion.usageCount > 0
                ? "Vô hiệu hóa khuyến mãi"
                : "Xóa khuyến mãi"
            }
            message={
              selectedPromotion.usageCount > 0
                ? `Khuyến mãi "${selectedPromotion.name}" đã được sử dụng ${selectedPromotion.usageCount} lần. Bạn chỉ có thể vô hiệu hóa khuyến mãi này.`
                : `Bạn có chắc chắn muốn xóa khuyến mãi "${selectedPromotion.name}" không? Hành động này không thể hoàn tác.`
            }
            confirmText={
              selectedPromotion.usageCount > 0 ? "Vô hiệu hóa" : "Xóa"
            }
            cancelText="Hủy"
            onConfirm={handleDeletePromotion}
            onCancel={() => setShowDeleteModal(false)}
            isDelete={true}
          />
        )}
        {showExtendModal && selectedPromotion && (
          <PromotionFormModal
            title="Gia hạn khuyến mãi"
            initialData={{
              ...selectedPromotion,
              startDate: new Date().toISOString(),
              endDate: new Date(
                new Date().setDate(new Date().getDate() + 30)
              ).toISOString(),
              status: "active",
            }}
            onClose={() => {
              setShowExtendModal(false);
              setFormError(null);
            }}
            onSubmit={handleExtendPromotion}
            error={formError}
          />
        )}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagePromotionPage;
