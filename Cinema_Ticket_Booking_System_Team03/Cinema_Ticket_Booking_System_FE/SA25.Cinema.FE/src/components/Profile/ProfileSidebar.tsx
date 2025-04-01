import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Ticket, LogOut, Home, Bell, Phone, Mail } from 'lucide-react';
import { UserProfile } from '../../interfaces/ProfileInterfaces';

interface ProfileSidebarProps {
  profile: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  notificationCount: number;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  activeTab,
  setActiveTab,
  handleLogout,
  notificationCount
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt={profile.full_Name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold text-center">{profile?.full_Name || 'Người dùng'}</h2>
            <p className="text-indigo-200 text-sm truncate w-full text-center">{profile?.email}</p>
            {profile?.membershipLevel && (
              <div className="mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                {profile.membershipLevel}
              </div>
            )}
          </div>
          {profile?.loyaltyPoints !== undefined && (
            <div className="mt-4 bg-white/10 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Điểm tích lũy</span>
                <span className="font-bold">{profile.loyaltyPoints} điểm</span>
              </div>
              <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{ width: `${Math.min((profile.loyaltyPoints / 1000) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-right text-indigo-200">
                {profile.loyaltyPoints}/1000 điểm
              </div>
            </div>
          )}
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-left ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <User className="h-5 w-5 mr-3 flex-shrink-0" />
                Thông tin cá nhân
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-left ${activeTab === 'bookings' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Ticket className="h-5 w-5 mr-3 flex-shrink-0" />
                Lịch sử đặt vé
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-md text-left ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <div className="flex items-center">
                  <Bell className="h-5 w-5 mr-3 flex-shrink-0" />
                  Thông báo
                </div>
                {notificationCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                    {notificationCount}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-4 py-2 rounded-md text-left ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                Cài đặt tài khoản
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 text-left"
              >
                <Home className="h-5 w-5 mr-3 flex-shrink-0" />
                Trang chủ
              </button>
            </li>
            <li className="border-t border-gray-200 pt-2 mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 rounded-md text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                Đăng xuất
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6 p-4">
        <h3 className="font-medium text-gray-900 mb-2">Hỗ trợ khách hàng</h3>
        <p className="text-sm text-gray-600 mb-3">Bạn cần hỗ trợ? Liên hệ với chúng tôi qua các kênh sau:</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-700">
            <Phone className="h-4 w-4 mr-2 text-indigo-600 flex-shrink-0" />
            <span>Hotline: 1900 6017</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Mail className="h-4 w-4 mr-2 text-indigo-600 flex-shrink-0" />
            <span>Email: support@cinema.vn</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSidebar;