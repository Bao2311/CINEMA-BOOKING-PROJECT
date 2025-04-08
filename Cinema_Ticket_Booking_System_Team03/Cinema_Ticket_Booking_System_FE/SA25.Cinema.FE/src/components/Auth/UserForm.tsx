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
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Full Name
              </label>
              <input
                type="text"
                name="full_Name"
                value={formData.full_Name}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
                placeholder="Enter full name"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
                placeholder="email@example.com"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Date of Birth
              </label>
              <input
                type="text"
                name="date_Of_Birth"
                value={formData.date_Of_Birth}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                className={`block w-full px-4 py-3 border ${dateError ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300`}
              />
              {dateError ? (
                <p className="mt-1 text-xs text-red-500">{dateError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Nhập theo định dạng: Năm-Tháng-Ngày (VD: 1990-05-15)</p>
              )}
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Sex
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Phone Number
              </label>
              <input
                type="text"
                name="phone_Number"
                value={formData.phone_Number}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
                placeholder="Enter address"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                title={user ? `Current role: ${user.role}` : "Select a role"}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-white cursor-help"
              >
                {user?.role && <option value={user.role}>{user.role}</option>}
                {(!user?.role || user.role !== "Staff") && <option value="Staff">Staff</option>}
                {(!user?.role || user.role !== "Customer") && <option value="Customer">Customer</option>}
              </select>
              {user && (
                <p className="mt-1 text-xs text-gray-500 italic">
                  Current role: {user.role}
                </p>
              )}
            </div>
            
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-1 group-hover:text-indigo-600 transition-colors">
                Account Status
              </label>
              <select
                name="account_Status"
                value={formData.account_Status}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 bg-white"
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Locked">Locked</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md"
          >
            {user ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
