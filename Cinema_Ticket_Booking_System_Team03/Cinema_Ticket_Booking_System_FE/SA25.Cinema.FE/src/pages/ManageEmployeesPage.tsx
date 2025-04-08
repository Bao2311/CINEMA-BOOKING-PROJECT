import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Mail,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import Layout from "../components/Layout/Layout";
import UserForm from "../components/Auth/UserForm";
import Modal from "../components/Admin/Modal";
import axios from "axios";
import classNames from "classnames";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface User {
  $id: string;
  user_ID: number;
  full_Name: string;
  email: string;
  role: string;
  date_Of_Birth: string;
  sex: string;
  phone_Number: string;
  address: string;
  account_Status: string;
  created_At: string;
  last_Login: string | null;
}

interface SortConfig {
  key: keyof User | null;
  direction: "asc" | "desc";
}

// Component tự tạo để thay thế Spinner
const Spinner = () => (
  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
);

// Component tự tạo để thay thế Badge
const Badge = ({ children, className = "" }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${className}`}
  >
    {children}
  </span>
);

// Component tự tạo để thay thế AlertDialog
const AlertDialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">{children}</div>
    </div>
  );
};

const API_BASE_URL = "https://localhost:7168/api";

const ManageUsersPage: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [error, setError] = useState<string | null>(null);

  const usersPerPage = 10;

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

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
  // API calls with better error handling
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/User`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        response.data &&
        response.data.$values &&
        Array.isArray(response.data.$values)
      ) {
        setUsers(response.data.$values);
      } else {
        console.error("API response is not an array:", response.data);
        setUsers([]);
        setError("Định dạng dữ liệu không hợp lệ");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setError(
        error.response?.data?.message || "Không thể tải danh sách người dùng"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleAddUser = async (
    data: Omit<User, "$id" | "user_ID" | "created_At" | "last_Login">
  ) => {
    const postData = {
      email: data.email,
      fullName: data.full_Name,
      role: data.role,
      hire_Date: new Date().toISOString(),
      dateOfBirth: data.date_Of_Birth,
      sex: data.sex,
      phoneNumber: data.phone_Number,
      address: data.address,
    };

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        `${API_BASE_URL}/User/register-user`,
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Thêm người dùng thành công!");
        setIsAddingUser(false);
        await fetchUsers(); // Refresh user list
      } else {
        toast.error("Thêm người dùng thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error adding user:", error);

      if (error.response) {
        const errorMessage =
          error.response.data.message ||
          error.response.data.title ||
          `Lỗi ${error.response.status}: Thêm người dùng thất bại.`;
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error(
          "Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối và thử lại."
        );
      } else {
        toast.error("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (
    data: Omit<User, "$id" | "created_At" | "last_Login">
  ) => {
    if (!editingUser) return;

    const putData = {
      fullName: data.full_Name,
      dateOfBirth: data.date_Of_Birth,
      sex: data.sex,
      phoneNumber: data.phone_Number,
      address: data.address,
      role: data.role,
      accountStatus: data.account_Status,
    };

    try {
      setIsSubmitting(true);

      await axios.put(`${API_BASE_URL}/User/${editingUser.user_ID}`, putData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Cập nhật người dùng thành công!");
      setEditingUser(null);
      await fetchUsers(); // Refresh user list
    } catch (error) {
      console.error("Error updating user:", error);

      if (error.response) {
        toast.error(
          `Lỗi: ${
            error.response.data.message || "Cập nhật người dùng thất bại."
          }`
        );
      } else {
        toast.error("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsSubmitting(true);

      const response = await axios.delete(
        `${API_BASE_URL}/User/${userToDelete.user_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setUsers(users.filter((user) => user.user_ID !== userToDelete.user_ID));
        toast.success("Xóa người dùng thành công!");
      } else {
        toast.error("Xóa người dùng thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Không thể xóa người dùng");
    } finally {
      setUserToDelete(null);
      setIsSubmitting(false);
    }
  };

  const handleSort = (key: keyof User) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRoleFilter("all");
    setSortConfig({ key: null, direction: "asc" });
    setCurrentPage(1);
  };

  // Memoized filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    // Apply filters
    let result = users.filter((user) => {
      const matchesSearch =
        user.full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        user.account_Status.toLowerCase() === statusFilter.toLowerCase();

      const matchesRole =
        roleFilter === "all" ||
        user.role.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole;
    });

    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [users, searchTerm, statusFilter, roleFilter, sortConfig]);

  // Get unique roles for filter dropdown with normalization
  const uniqueRoles = useMemo(() => {
    const roles = new Set(
      users
        .map((user) => user.role)
        .map(
          (role) => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
        )
    );
    return Array.from(roles);
  }, [users]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
  const currentUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" /> {status}
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-yellow-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" /> {status}
          </Badge>
        );
      case "Locked":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" /> {status}
          </Badge>
        );
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý người dùng
          </h1>
          <button
            onClick={() => setIsAddingUser(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm người dùng
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
            <button
              className="ml-auto text-red-700 hover:bg-red-100 px-2 py-1 rounded-md text-sm"
              onClick={fetchUsers}
            >
              <RefreshCw className="h-4 w-4 mr-1 inline" /> Thử lại
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Filter section */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-40 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Active">Hoạt động</option>
                  <option value="Pending">Đang chờ</option>
                  <option value="Locked">Đã khóa</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-40 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Tất cả vai trò</option>
                  {uniqueRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  onClick={resetFilters}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Đặt lại
                </button>
              </div>
            </div>
          </div>

          {/* Table section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("user_ID")}
                    >
                      <div className="flex items-center">
                        ID
                        {sortConfig.key === "user_ID" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${
                              sortConfig.direction === "asc"
                                ? "transform rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("full_Name")}
                    >
                      <div className="flex items-center">
                        Họ tên
                        {sortConfig.key === "full_Name" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${
                              sortConfig.direction === "asc"
                                ? "transform rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center">
                        Email
                        {sortConfig.key === "email" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${
                              sortConfig.direction === "asc"
                                ? "transform rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center">
                        Vai trò
                        {sortConfig.key === "role" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${
                              sortConfig.direction === "asc"
                                ? "transform rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("account_Status")}
                    >
                      <div className="flex items-center">
                        Trạng thái
                        {sortConfig.key === "account_Status" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${
                              sortConfig.direction === "asc"
                                ? "transform rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        Không tìm thấy người dùng nào.
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user) => (
                      <tr key={user.user_ID} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.user_ID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.full_Name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {renderStatusBadge(user.account_Status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <a
                              href={`mailto:${user.email}`}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                              title="Gửi email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-amber-600 hover:text-amber-900 p-1 rounded-md hover:bg-amber-50"
                              title={`Chỉnh sửa - Role hiện tại: ${user.role}`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => confirmDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && filteredAndSortedUsers.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border border-gray-300 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border border-gray-300 rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * usersPerPage + 1}
                    </span>{" "}
                    đến{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * usersPerPage,
                        filteredAndSortedUsers.length
                      )}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-medium">
                      {filteredAndSortedUsers.length}
                    </span>{" "}
                    người dùng
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Trang trước</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }).map(
                      (_, i) => {
                        let pageNum;

                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${
                              currentPage === pageNum
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Trang sau</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isAddingUser}
        onClose={() => !isSubmitting && setIsAddingUser(false)}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Thêm người dùng mới
          </h2>
          <UserForm
            onSubmit={handleAddUser}
            onCancel={() => !isSubmitting && setIsAddingUser(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </Modal>

      <Modal
        isOpen={!!editingUser}
        onClose={() => !isSubmitting && setEditingUser(null)}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Chỉnh sửa người dùng
          </h2>
          <UserForm
            user={editingUser}
            onSubmit={handleUpdateUser}
            onCancel={() => !isSubmitting && setEditingUser(null)}
            isSubmitting={isSubmitting}
          />
        </div>
      </Modal>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => !isSubmitting && setUserToDelete(null)}
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            Xác nhận xóa người dùng
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn có chắc chắn muốn xóa người dùng{" "}
            <strong>{userToDelete?.full_Name}</strong>? Hành động này không thể
            hoàn tác.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setUserToDelete(null)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"></div>
                  Đang xóa...
                </>
              ) : (
                "Xóa người dùng"
              )}
            </button>
          </div>
        </div>
      </AlertDialog>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ManageUsersPage;
