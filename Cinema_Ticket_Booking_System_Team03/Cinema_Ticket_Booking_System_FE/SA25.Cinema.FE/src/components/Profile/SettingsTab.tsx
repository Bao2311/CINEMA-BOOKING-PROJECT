
import React, { useState } from 'react';
import { NavigateFunction } from 'react-router-dom';
import axios from 'axios';

interface SettingsTabProps {
  showAlert: (type: 'success' | 'error' | 'info', message: string) => void;
  apiBaseUrl: string;
  navigate: NavigateFunction;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  showAlert,
  apiBaseUrl,
  navigate
}) => { 
    
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateField = (name: keyof PasswordForm, value: string): string | undefined => {
    switch (name) {
      case 'currentPassword':
        return !value ? 'Vui lòng nhập mật khẩu hiện tại' : undefined;
      case 'newPassword':
        if (!value) return 'Vui lòng nhập mật khẩu mới';
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return !passwordRegex.test(value) 
          ? 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt'
          : undefined;
      case 'confirmNewPassword':
        if (!value) return 'Vui lòng xác nhận mật khẩu mới';
        return value !== passwordForm.newPassword 
          ? 'Mật khẩu xác nhận không khớp với mật khẩu mới'
          : undefined;
      default:
        return undefined;
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id as keyof PasswordForm;
    setPasswordForm(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id as keyof PasswordForm;
    const error = validateField(fieldName, value);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
    
    // Special case for confirmNewPassword - validate it when newPassword changes
    if (fieldName === 'newPassword' && passwordForm.confirmNewPassword) {
      const confirmError = validateField('confirmNewPassword', passwordForm.confirmNewPassword);
      setErrors(prev => ({
        ...prev,
        confirmNewPassword: confirmError
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    // Validate all fields
    Object.entries(passwordForm).forEach(([key, value]) => {
      const fieldName = key as keyof PasswordForm;
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('error', 'Vui lòng kiểm tra lại thông tin mật khẩu.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      
      await axios.put(
        `${apiBaseUrl}/Auth/password`, 
        {
          OldPassword: passwordForm.currentPassword,
          NewPassword: passwordForm.newPassword,
          ConfirmNewPassword: passwordForm.confirmNewPassword
        }, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          } 
        }
      );
      
      showAlert('success', 'Đổi mật khẩu thành công!');
      
      // Đăng xuất người dùng
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('fullname');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/login';
      
    } catch (error: any) {
      console.error("Error changing password:", error);
      
      // Xử lý lỗi cụ thể từ API
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          // Xử lý lỗi validation từ API
          if (data.errors) {
            // Trường hợp API trả về lỗi validation theo từng trường
            const serverErrors: FormErrors = {};
            
            if (data.errors.OldPassword) {
              serverErrors.currentPassword = data.errors.OldPassword[0];
            }
            if (data.errors.NewPassword) {
              serverErrors.newPassword = data.errors.NewPassword[0];
            }
            if (data.errors.ConfirmNewPassword) {
              serverErrors.confirmNewPassword = data.errors.ConfirmNewPassword[0];
            }
            
            setErrors(prev => ({ ...prev, ...serverErrors }));
            showAlert('error', 'Vui lòng kiểm tra lại thông tin mật khẩu.');
          } else if (data.message) {
            // Trường hợp API trả về message lỗi chung
            showAlert('error', data.message);
          } else {
            showAlert('error', 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại.');
          }
        } else if (status === 401) {
          showAlert('error', 'Mật khẩu hiện tại không chính xác.');
          setErrors(prev => ({ 
            ...prev, 
            currentPassword: 'Mật khẩu hiện tại không chính xác' 
          }));
        } else {
          showAlert('error', 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.');
        }
      } else {
        showAlert('error', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>
          <form className="space-y-6 max-w-md" onSubmit={handleChangePassword}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                required
                autoComplete="current-password"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>
              )}
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                required
                autoComplete="new-password"
              />
              {errors.newPassword ? (
                <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                value={passwordForm.confirmNewPassword}
                onChange={handlePasswordChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border ${errors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                required
                autoComplete="new-password"
              />
              {errors.confirmNewPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmNewPassword}</p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className={`${isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-5 py-2 rounded-md transition-colors text-sm font-medium`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
