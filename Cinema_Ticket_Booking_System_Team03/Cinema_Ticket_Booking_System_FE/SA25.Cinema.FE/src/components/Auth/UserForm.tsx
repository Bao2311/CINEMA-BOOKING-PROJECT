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
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel, disableRoleSelect }) => {
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
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'date_Of_Birth') {
      // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
      setDateError('');
      
      // Chỉ cho phép nhập số và dấu gạch ngang
      let formattedValue = value.replace(/[^\d-]/g, '');
      
      // Tự động thêm dấu gạch ngang sau khi nhập 4 số (năm) và 2 số (tháng)
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
    // Kiểm tra định dạng YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    // Kiểm tra ngày tháng có hợp lệ không
    const date = new Date(dateString);
    const timestamp = date.getTime();
    
    if (isNaN(timestamp)) return false;
    
    // Kiểm tra xem ngày tháng có hợp lý không (tháng 1-12, ngày 1-31)
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (month < 1 || month > 12) return false;
    
    // Kiểm tra ngày hợp lệ cho từng tháng
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra ngày tháng
    if (formData.date_Of_Birth && !validateDateFormat(formData.date_Of_Birth)) {
      setDateError('Vui lòng nhập ngày sinh đúng định dạng YYYY-MM-DD');
      toast.error('Ngày sinh không hợp lệ');
      return;
    }
    
    onSubmit(formData);
  };

  // Close form when clicking outside (and show a toast notification)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onCancel();
        toast.info("Form closed");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-2xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
        {user ? 'Edit User Information' : 'Create New User'}
      </h2>
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Họ và tên
              </label>
              <input
                type="text"
                name="full_Name"
                value={formData.full_Name}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-[#1E2738] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                placeholder="Nhập họ và tên"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-[#1E2738] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                placeholder="email@example.com"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Ngày sinh
              </label>
              <input
                type="text"
                name="date_Of_Birth"
                value={formData.date_Of_Birth}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                className={`block w-full px-4 py-3 bg-[#1E2738] border ${dateError ? 'border-red-500' : 'border-white/10'} text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 placeholder-gray-500`}
              />
              {dateError ? (
                <p className="mt-1 text-xs text-red-500">{dateError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">Nhập theo định dạng: YYYY-MM-DD (VD: 1990-05-15)</p>
              )}
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Giới tính
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-[#1E2738] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Chọn giới tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
              </select>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Số điện thoại
              </label>
              <input
                type="text"
                name="phone_Number"
                value={formData.phone_Number}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-[#1E2738] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                placeholder="Nhập số điện thoại"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Địa chỉ
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-[#1E2738] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                placeholder="Nhập địa chỉ"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Vai trò
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                title={user ? `Current role: ${user.role}` : "Chọn vai trò"}
                className="block w-full px-4 py-3 bg-[#1E2738] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                {user?.role && <option value={user.role}>{user.role}</option>}
                {(!user?.role || user.role !== "Staff") && <option value="Staff">Staff</option>}
                {(!user?.role || user.role !== "Customer") && <option value="Customer">Customer</option>}
              </select>
              {user && (
                <p className="mt-1 text-xs text-gray-400 italic">
                  Vai trò hiện tại: {user.role}
                </p>
              )}
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-300 mb-1 group-hover:text-red-400 transition-colors">
                Trạng thái tài khoản
              </label>
              <select
                name="account_Status"
                value={formData.account_Status}
                onChange={handleChange}
                className="block w-full px-4 py-3 bg-[#1E2738] border border-white/10 text-white rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Chọn trạng thái</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Locked">Locked</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-6 border-t border-white/10 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors duration-200 font-medium focus:outline-none"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200 font-medium focus:outline-none shadow-lg shadow-red-600/30"
          >
            {user ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
