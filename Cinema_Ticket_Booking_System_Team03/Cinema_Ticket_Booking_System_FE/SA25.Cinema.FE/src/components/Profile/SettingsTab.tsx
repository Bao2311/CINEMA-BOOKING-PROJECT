import React, { useState } from 'react';
import { NavigateFunction,useLocation } from 'react-router-dom';
import { Shield, Check, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface SettingsTabProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  showAlert: (type: 'success' | 'error' | 'info', message: string) => void;
  apiBaseUrl: string;
  navigate: NavigateFunction;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  activeSubTab,
  setActiveSubTab,
  showAlert,
  apiBaseUrl,
  navigate
}) => { 
    
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingCommunications: true,
    bookingReminders: true,
    specialOffers: true,
  });
  
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(true);
  
  // Thêm các biến trạng thái để lưu trữ thông tin người dùng
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [id]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      showAlert('error', 'Vui lòng nhập đầy đủ thông tin mật khẩu.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      showAlert('error', 'Mật khẩu mới và xác nhận không khớp.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      showAlert('error', 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      const response = await axios.put(`${apiBaseUrl}/Auth/password`, {
        OldPassword: passwordForm.currentPassword,
        NewPassword: passwordForm.newPassword,
        ConfirmNewPassword: passwordForm.confirmNewPassword
      }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      
      // Cập nhật biến requiresPasswordChange thành false
      setRequiresPasswordChange(false);
      
      // Lưu trữ thông tin người dùng từ phản hồi
      setRole(response.data.role);
      setToken(response.data.token);
      setUserId(response.data.userId);
      
      showAlert('success', 'Đổi mật khẩu thành công!');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('fullname');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/login';
    } catch (error) {
      console.error("Error changing password:", error);
      showAlert('error', 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.');
    }
  };

  const handleNotificationSettingsChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    setTimeout(() => showAlert('success', 'Đã cập nhật cài đặt thông báo.'), 500);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => { setActiveSubTab('password'); setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); }}
            className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'password' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Đổi mật khẩu
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'notifications' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Cài đặt thông báo
          </button>
          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`px-6 py-4 text-sm font-medium ${activeSubTab === 'privacy' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Bảo mật & Quyền riêng tư
          </button>
        </div>
      </div>
      <div className="p-6">
        {activeSubTab === 'password' && (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  autoComplete="current-password"
                />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).
                </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition-colors text-sm font-medium">
                  Đổi mật khẩu
                </button>
              </div>
            </form>
          </div>
        )}
        {activeSubTab === 'notifications' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Cài đặt thông báo</h2>
            <p className="text-sm text-gray-600 mb-6">Chọn cách bạn muốn nhận thông báo từ chúng tôi.</p>
            <div className="space-y-6">
              {(Object.keys(notificationSettings) as Array<keyof typeof notificationSettings>).map(key => {
                let label = '';
                let description = '';
                switch (key) {
                  case 'emailNotifications': label = 'Thông báo qua Email'; description = 'Nhận thông tin đặt vé, khuyến mãi, cập nhật hệ thống qua email.'; break;
                  case 'smsNotifications': label = 'Thông báo qua SMS'; description = 'Nhận thông tin đặt vé, mã OTP, cảnh báo quan trọng qua SMS.'; break;
                  case 'marketingCommunications': label = 'Khuyến mãi & Ưu đãi'; description = 'Nhận thông tin về các chương trình khuyến mãi, phim mới.'; break;
                  case 'bookingReminders': label = 'Nhắc nhở lịch chiếu'; description = 'Nhận thông báo nhắc nhở trước giờ chiếu phim.'; break;
                  case 'specialOffers': label = 'Ưu đãi đặc biệt'; description = 'Nhận thông báo về các ưu đãi dành riêng cho thành viên.'; break;
                }
                return (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                    <div className="mr-4">
                      <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{description}</p>
                    </div>
                    <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                      <input
                        type="checkbox"
                        id={key}
                        checked={notificationSettings[key]}
                        onChange={() => handleNotificationSettingsChange(key)}
                        className="sr-only peer"
                      />
                      <label
                        htmlFor={key}
                        className="block overflow-hidden h-6 rounded-full bg-gray-300 peer-checked:bg-indigo-600 cursor-pointer"
                      >
                        <span className={`block w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1 ${notificationSettings[key] ? 'translate-x-4' : 'translate-x-0'}`}></span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeSubTab === 'privacy' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Bảo mật & Quyền riêng tư</h2>
            <div className="space-y-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Giữ tài khoản của bạn an toàn</h3>
                    <div className="mt-2 text-sm text-yellow-700 space-y-1">
                      <p>• Sử dụng mật khẩu mạnh, duy nhất cho trang này.</p>
                      <p>• Cập nhật mật khẩu định kỳ.</p>
                      <p>• Không bao giờ chia sẻ thông tin đăng nhập.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Phiên đăng nhập</h3>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-full p-1 mr-3">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phiên hiện tại</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {navigator.userAgent.includes('Mobile') ? 'Thiết bị di động' : 'Máy tính để bàn'} • IP: 192.168.1.xxx
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                    Đăng xuất khỏi tất cả thiết bị khác
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quản lý dữ liệu của bạn</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Chính sách quyền riêng tư</h4>
                      <p className="text-xs text-gray-500 mt-1">Xem cách chúng tôi thu thập và sử dụng dữ liệu của bạn.</p>
                    </div>
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                      Xem chính sách <ChevronRight className="h-4 w-4 ml-0.5" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Tải xuống dữ liệu</h4>
                      <p className="text-xs text-gray-500 mt-1">Yêu cầu bản sao dữ liệu cá nhân của bạn.</p>
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                      Yêu cầu tải xuống
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-sm font-medium text-red-600">Xóa tài khoản</h4>
                      <p className="text-xs text-gray-500 mt-1">Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan.</p>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                      Yêu cầu xóa tài khoản
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;


