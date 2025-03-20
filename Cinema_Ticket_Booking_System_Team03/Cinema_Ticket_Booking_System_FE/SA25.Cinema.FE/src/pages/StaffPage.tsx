import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    FaUsers, FaUserPlus, FaSearch, FaEdit, FaTrash, FaEye,
    FaSort, FaSortUp, FaSortDown, FaFilter, FaDownload,
    FaUpload, FaUserShield, FaCheck, FaTimes, FaEnvelope,
    FaSyncAlt, FaExclamationCircle
  } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debounce } from 'lodash';


// Types
interface User {
  user_ID: number;
  username: string;
  email: string;
  full_Name: string;
  role: string;
  phone_Number?: string;
  created_At: string;
  account_Status: string;
  avatar_URL?: string;
  date_Of_Birth?: string;
  sex?: string;
  address?: string;
  last_Login?: string;
}


interface SortConfig {
  key: keyof User | null;
  direction: 'asc' | 'desc';
}


interface RegisterUserData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_Name: string;
  phone_Number?: string;
  role: string;
  date_Of_Birth?: string;
  sex?: string;
  address?: string;
}


interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  full_Name?: string;
  phone_Number?: string;
}


// Main component
const StaffPage: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
 
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
 
  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc'
  });
 
  // Modal states
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
 
  // User registration state
  const [registerData, setRegisterData] = useState<RegisterUserData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_Name: '',
    phone_Number: '',
    role: 'customer', // Mặc định là customer cho nhân viên
    date_Of_Birth: '',
    sex: 'male',
    address: ''
  });


  // API Base URL
  const API_BASE_URL = 'https://localhost:7168/api';
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
 
  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset về trang đầu tiên khi tìm kiếm
      }, 300),
    []
  );
 
  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
   
    try {
      const response = await axios.get(`${API_BASE_URL}/User`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
        setUsers(response.data.$values);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('API response is not an array:', response.data);
        setUsers([]);
        setError('Định dạng dữ liệu không hợp lệ');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setError(error.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    fetchUsers();
  }, []);
 
  // Form validation
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
   
    if (!registerData.username.trim()) errors.username = 'Tên đăng nhập không được để trống';
    if (!registerData.email.trim()) errors.email = 'Email không được để trống';
    if (!/\S+@\S+\.\S+/.test(registerData.email)) errors.email = 'Email không hợp lệ';
    if (!registerData.password) errors.password = 'Mật khẩu không được để trống';
    if (registerData.password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (registerData.password !== registerData.confirmPassword) errors.confirmPassword = 'Mật khẩu không khớp';
    if (!registerData.full_Name.trim()) errors.full_Name = 'Họ tên không được để trống';
   
    return errors;
  };
 
  // Handle user registration
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
   
    // Validate form
    const errors = validateForm();
    setFormErrors(errors);
   
    if (Object.keys(errors).length > 0) {
      // Hiển thị lỗi đầu tiên
      toast.error(Object.values(errors)[0]);
      return;
    }
   
    setIsSubmitting(true);
    try {
      const postData = {
        email: registerData.email,
        fullName: registerData.full_Name,
        role: 'customer', // Giới hạn chỉ tạo được customer
        dateOfBirth: registerData.date_Of_Birth || new Date().toISOString(),
        sex: registerData.sex || 'male',
        phoneNumber: registerData.phone_Number || '',
        address: registerData.address || '',
        password: registerData.password,
        username: registerData.username
      };
     
      await axios.post(`${API_BASE_URL}/User/register-user`, postData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });


      toast.success('Đăng ký người dùng thành công');
      setRegisterData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_Name: '',
        phone_Number: '',
        role: 'customer',
        date_Of_Birth: '',
        sex: 'male',
        address: ''
      });
     
      // Refresh user list
      await fetchUsers(); // Đảm bảo dữ liệu được cập nhật trước khi đóng modal
      setShowUserModal(false);
    } catch (error) {
      console.error('Error registering user:', error);
     
      let errorMessage = 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      if (error.response) {
        errorMessage = error.response.data.message ||
                      error.response.data.title ||
                      `Lỗi ${error.response.status}: Thêm người dùng thất bại.`;
      } else if (error.request) {
        errorMessage = 'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  // Handle update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
   
    setIsSubmitting(true);
    try {
      const putData = {
        fullName: selectedUser.full_Name,
        dateOfBirth: selectedUser.date_Of_Birth || new Date().toISOString(),
        sex: selectedUser.sex || 'male',
        phoneNumber: selectedUser.phone_Number || '',
        address: selectedUser.address || '',
        role: 'customer', // Giới hạn chỉ cập nhật customer
        accountStatus: selectedUser.account_Status,
      };
     
      await axios.put(`${API_BASE_URL}/User/${selectedUser.user_ID}`, putData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
     
      toast.success('Cập nhật người dùng thành công!');
      setShowUserModal(false);
      await fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error updating user:', error);
     
      let errorMessage = 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      if (error.response) {
        errorMessage = error.response.data.message ||
                     `Lỗi ${error.response.status}: Cập nhật người dùng thất bại.`;
      } else if (error.request) {
        errorMessage = 'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
   
    setIsSubmitting(true);
    try {
      await axios.delete(`${API_BASE_URL}/User/${userToDelete.user_ID}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      setUsers(users.filter(user => user.user_ID !== userToDelete.user_ID));
      toast.success('Xóa người dùng thành công!');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting user:', error);
     
      let errorMessage = 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
      if (error.response) {
        errorMessage = error.response.data.message ||
                     `Lỗi ${error.response.status}: Xóa người dùng thất bại.`;
      } else if (error.request) {
        errorMessage = 'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
      }
      toast.error(errorMessage);
    } finally {
      setUserToDelete(null);
      setIsSubmitting(false);
    }
  };
 
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  };
 
  // Handle sort
  const handleSort = (key: keyof User) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
 
  // Modal handlers
  const openModal = (user: User | null, mode: 'view' | 'edit' | 'add') => {
    setSelectedUser(user);
    setModalMode(mode);
    setShowUserModal(true);
    setFormErrors({});
   
    if (mode === 'add') {
      setRegisterData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_Name: '',
        phone_Number: '',
        role: 'customer',
        date_Of_Birth: '',
        sex: 'male',
        address: ''
      });
    }
  };
 
  // Confirm delete user
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };
 
  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set(users.map(user => user.role));
    return Array.from(roles);
  }, [users]);
 
  // Memoized filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    // Apply filters - only show customers for staff
    let result = users.filter(user => {
      // Nhân viên chỉ được xem và quản lý khách hàng
      if (user.role !== 'customer') return false;
     
      const matchesSearch =
        user.full_Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase());
     
      const matchesStatus = statusFilter === 'all' || user.account_Status === statusFilter;
     
      return matchesSearch && matchesStatus;
    });
   
    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
       
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
   
    return result;
  }, [users, searchQuery, statusFilter, roleFilter, sortConfig]);
 
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
 
  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
 
  // Get sort icon
  const getSortIcon = (key: keyof User) => {
    if (sortConfig.key !== key) return <FaSort className="inline ml-1" />;
    return sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
     
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
          <FaUsers className="mr-2" /> Quản lý khách hàng
        </h1>
       
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => openModal(null, 'add')}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaUserPlus className="mr-2" /> Thêm khách hàng
          </button>
         
          <button
            onClick={fetchUsers}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FaSyncAlt className="mr-2" /> Làm mới
          </button>
        </div>
      </div>
     
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FaSearch className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
          </div>
         
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="blocked">Đã khóa</option>
            </select>
           
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>
     
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 flex items-center">
          <FaExclamationCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}
     
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
     
      {/* Users table */}
      {!loading && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('full_Name')}
                        className="flex items-center font-medium text-gray-700"
                      >
                        Họ tên {getSortIcon('full_Name')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('username')}
                        className="flex items-center font-medium text-gray-700"
                      >
                        Tên đăng nhập {getSortIcon('username')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center font-medium text-gray-700"
                      >
                        Email {getSortIcon('email')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('created_At')}
                        className="flex items-center font-medium text-gray-700"
                      >
                        Ngày tạo {getSortIcon('created_At')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('account_Status')}
                        className="flex items-center font-medium text-gray-700"
                      >
                        Trạng thái {getSortIcon('account_Status')}
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((user, index) => (
                      <motion.tr
                        key={user.user_ID}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.avatar_URL || "https://via.placeholder.com/40?text=User"}
                                alt={user.full_Name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.full_Name}</div>
                              <div className="text-sm text-gray-500">{user.phone_Number || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(user.created_At)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${user.account_Status === 'active' ? 'bg-green-100 text-green-800' :
                              user.account_Status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}`}
                          >
                            {user.account_Status === 'active' ? 'Hoạt động' :
                             user.account_Status === 'inactive' ? 'Không hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              title="Xem chi tiết"
                              onClick={() => openModal(user, 'view')}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                            >
                              <FaEye className="h-5 w-5" />
                            </button>
                            <button
                              title="Chỉnh sửa"
                              onClick={() => openModal(user, 'edit')}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100 transition-colors"
                            >
                              <FaEdit className="h-5 w-5" />
                            </button>
                            <button
                              title="Xóa"
                              onClick={() => confirmDeleteUser(user)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Không tìm thấy khách hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
         
          {/* Pagination */}
          {filteredAndSortedUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0">
                <span className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredAndSortedUsers.length)}
                  </span>{" "}
                  trong <span className="font-medium">{filteredAndSortedUsers.length}</span> khách hàng
                </span>
              </div>
             
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Trước
                </button>
               
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  // Show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                 
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
               
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Tiếp
                </button>
              </div>
            </div>
          )}
        </>
      )}
     
            {/* Add/Edit/View User Modal */}
            <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {modalMode === 'add' ? 'Thêm khách hàng mới' :
                     modalMode === 'edit' ? 'Chỉnh sửa khách hàng' : 'Thông tin khách hàng'}
                  </h2>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
               
                {modalMode === 'add' ? (
                  <form onSubmit={handleRegisterUser}>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                        <input
                          type="text"
                          className={`mt-1 block w-full rounded-md border ${formErrors.username ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                          value={registerData.username}
                          onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                        />
                        {formErrors.username && <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>}
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          className={`mt-1 block w-full rounded-md border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                          value={registerData.email}
                          onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        />
                        {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                        <input
                          type="password"
                          className={`mt-1 block w-full rounded-md border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        />
                        {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                        <input
                          type="password"
                          className={`mt-1 block w-full rounded-md border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        />
                        {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                        <input
                          type="text"
                          className={`mt-1 block w-full rounded-md border ${formErrors.full_Name ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                          value={registerData.full_Name}
                          onChange={(e) => setRegisterData({...registerData, full_Name: e.target.value})}
                        />
                        {formErrors.full_Name && <p className="mt-1 text-sm text-red-600">{formErrors.full_Name}</p>}
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={registerData.phone_Number}
                          onChange={(e) => setRegisterData({...registerData, phone_Number: e.target.value})}
                        />
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value="customer"
                          disabled={true}
                        >
                          <option value="customer">Khách hàng</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Nhân viên chỉ có thể tạo tài khoản khách hàng</p>
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                        <input
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={registerData.date_Of_Birth}
                          onChange={(e) => setRegisterData({...registerData, date_Of_Birth: e.target.value})}
                        />
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={registerData.sex}
                          onChange={(e) => setRegisterData({...registerData, sex: e.target.value})}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          value={registerData.address}
                          onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                        ></textarea>
                      </div>
                    </div>
                   
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowUserModal(false)}
                        className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="inline-block animate-spin mr-2">⟳</span>
                            Đang xử lý...
                          </>
                        ) : (
                          'Thêm khách hàng'
                        )}
                      </button>
                    </div>
                  </form>
                ) : modalMode === 'edit' && selectedUser ? (
                  <form onSubmit={handleUpdateUser}>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={selectedUser.full_Name}
                          onChange={(e) => setSelectedUser({...selectedUser, full_Name: e.target.value})}
                        />
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={selectedUser.email}
                          disabled={true}
                        />
                        <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={selectedUser.phone_Number || ''}
                          onChange={(e) => setSelectedUser({...selectedUser, phone_Number: e.target.value})}
                        />
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái tài khoản</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={selectedUser.account_Status}
                          onChange={(e) => setSelectedUser({...selectedUser, account_Status: e.target.value})}
                        >
                          <option value="active">Hoạt động</option>
                          <option value="inactive">Không hoạt động</option>
                          <option value="blocked">Đã khóa</option>
                        </select>
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                        <input
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={selectedUser.date_Of_Birth?.split('T')[0] || ''}
                          onChange={(e) => setSelectedUser({...selectedUser, date_Of_Birth: e.target.value})}
                        />
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={selectedUser.sex || 'male'}
                          onChange={(e) => setSelectedUser({...selectedUser, sex: e.target.value})}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          value={selectedUser.address || ''}
                          onChange={(e) => setSelectedUser({...selectedUser, address: e.target.value})}
                        ></textarea>
                      </div>
                    </div>
                   
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowUserModal(false)}
                        className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="inline-block animate-spin mr-2">⟳</span>
                            Đang xử lý...
                          </>
                        ) : (
                          'Cập nhật'
                        )}
                      </button>
                    </div>
                  </form>
                ) : selectedUser ? (
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <img
                          src={selectedUser.avatar_URL || "https://via.placeholder.com/100?text=User"}
                          alt={selectedUser.full_Name}
                          className="h-24 w-24 rounded-full object-cover border-2 border-blue-500"
                        />
                        <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white ${
                          selectedUser.account_Status === 'active' ? 'bg-green-500' :
                          selectedUser.account_Status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Tên đăng nhập</h3>
                        <p className="mt-1">{selectedUser.username}</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Họ tên</h3>
                        <p className="mt-1">{selectedUser.full_Name}</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="mt-1">{selectedUser.email}</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Số điện thoại</h3>
                        <p className="mt-1">{selectedUser.phone_Number || 'Chưa cập nhật'}</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Vai trò</h3>
                        <p className="mt-1">Khách hàng</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Trạng thái</h3>
                        <p className="mt-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${selectedUser.account_Status === 'active' ? 'bg-green-100 text-green-800' :
                              selectedUser.account_Status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}`}
                          >
                            {selectedUser.account_Status === 'active' ? 'Hoạt động' :
                             selectedUser.account_Status === 'inactive' ? 'Không hoạt động' : 'Đã khóa'}
                          </span>
                        </p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Ngày tạo</h3>
                        <p className="mt-1">{formatDate(selectedUser.created_At)}</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Đăng nhập gần nhất</h3>
                        <p className="mt-1">{selectedUser.last_Login ? formatDate(selectedUser.last_Login) : 'Chưa đăng nhập'}</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Ngày sinh</h3>
                        <p className="mt-1">{selectedUser.date_Of_Birth ? formatDate(selectedUser.date_Of_Birth) : 'Chưa cập nhật'}</p>
                      </div>
                     
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Giới tính</h3>
                        <p className="mt-1">
                          {selectedUser.sex === 'male' ? 'Nam' :
                           selectedUser.sex === 'female' ? 'Nữ' :
                           selectedUser.sex === 'other' ? 'Khác' : 'Chưa cập nhật'}
                        </p>
                      </div>
                    </div>
                   
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Địa chỉ</h3>
                      <p className="mt-1">{selectedUser.address || 'Chưa cập nhật'}</p>
                    </div>
                   
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowUserModal(false)}
                        className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModalMode('edit');
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
     
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4 text-red-600">
                  <FaExclamationCircle className="h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-center mb-4">Xác nhận xóa người dùng</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{userToDelete.full_Name}</span>?
                  Hành động này không thể hoàn tác.
                </p>
               
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={isSubmitting}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Đang xử lý...
                      </>
                    ) : (
                      'Xóa'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default StaffPage;
