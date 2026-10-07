import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

interface UserFormProps {
  user?: {
    full_Name: string;
    date_Of_Birth: string;
    sex: string;
    phone_Number: string;
    address: string;
    role: string;
    account_Status: string;
    email: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  disableRoleSelect?: boolean;
  isSubmitting?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel, disableRoleSelect, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    full_Name: user?.full_Name || '',
    date_Of_Birth: user?.date_Of_Birth
      ? new Date(user.date_Of_Birth).toISOString().split('T')[0]
      : '',
    sex: user?.sex || '',
    phone_Number: user?.phone_Number || '',
    address: user?.address || '',
    role: user?.role || '',
    account_Status: user?.account_Status || '',
    email: user?.email || '',
  });

  const [dateError, setDateError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'date_Of_Birth') {
      setDateError('');
      let formattedValue = value.replace(/[^\d-]/g, '');
      if (formattedValue.length === 4 && !formattedValue.includes('-')) {
        formattedValue = formattedValue + '-';
      } else if (formattedValue.length === 7 && formattedValue.split('-').length === 2) {
        formattedValue = formattedValue + '-';
      }
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateDateFormat = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    const timestamp = date.getTime();
    if (isNaN(timestamp)) return false;
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (month < 1 || month > 12) return false;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date_Of_Birth && !validateDateFormat(formData.date_Of_Birth)) {
      setDateError('Vui lòng nhập ngày sinh đúng định dạng YYYY-MM-DD');
      toast.error('Ngày sinh không hợp lệ');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-5">
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Họ và tên
              </label>
              <input
                type="text"
                name="full_Name"
                value={formData.full_Name}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-500 text-sm"
                placeholder="Nhập họ và tên"
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-500 text-sm"
                placeholder="email@example.com"
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Ngày sinh
              </label>
              <input
                type="text"
                name="date_Of_Birth"
                value={formData.date_Of_Birth}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                className={`block w-full px-4 py-2.5 bg-[#0B0F19] border ${dateError ? 'border-red-500' : 'border-white/10'} text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-500 text-sm font-mono`}
              />
              {dateError ? (
                <p className="mt-1 text-xs text-red-400">{dateError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">Định dạng: YYYY-MM-DD (VD: 1990-05-15)</p>
              )}
            </div>
            
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Giới tính
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 text-sm"
              >
                <option value="">Chọn giới tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
              </select>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-5">
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Số điện thoại
              </label>
              <input
                type="text"
                name="phone_Number"
                value={formData.phone_Number}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-500 text-sm font-mono"
                placeholder="Nhập số điện thoại"
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Địa chỉ
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 placeholder-gray-500 text-sm"
                placeholder="Nhập địa chỉ"
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Vai trò
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={disableRoleSelect}
                title={user ? `Current role: ${user.role}` : "Chọn vai trò"}
                className="block w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 text-sm disabled:opacity-50"
              >
                {user?.role && <option value={user.role}>{user.role}</option>}
                {(!user?.role || user.role !== "Staff") && <option value="Staff">Staff</option>}
                {(!user?.role || user.role !== "Customer") && <option value="Customer">Customer</option>}
                {(!user?.role || user.role !== "Admin") && <option value="Admin">Admin</option>}
              </select>
              {user && (
                <p className="mt-1 text-xs text-gray-400 italic">
                  Vai trò hiện tại: {user.role}
                </p>
              )}
            </div>
            
            <div className="group">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5 group-hover:text-red-400 transition-colors">
                Trạng thái tài khoản
              </label>
              <select
                name="account_Status"
                value={formData.account_Status}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 text-sm"
              >
                <option value="">Chọn trạng thái</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Locked">Locked</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-5 border-t border-white/10 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors font-medium text-sm focus:outline-none disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 font-semibold text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang lưu...' : (user ? 'Cập nhật' : 'Tạo mới')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
