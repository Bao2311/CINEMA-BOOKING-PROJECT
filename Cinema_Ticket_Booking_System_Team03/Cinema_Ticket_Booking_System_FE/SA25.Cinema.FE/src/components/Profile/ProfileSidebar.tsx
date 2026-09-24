import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Ticket, LogOut, Home, Bell, Phone, Mail, QrCode, Sparkles } from 'lucide-react';
import { UserProfile } from '../../interfaces/ProfileInterfaces';
import axios from 'axios';
import { API_URL } from '../../config/apiUrl';

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
  const [points, setPoints] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/Points/my-points`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && typeof response.data.total_Points === 'number') {
          setPoints(response.data.total_Points);
        }
      } catch (error) {
        console.error('Error fetching points:', error);
      }
    };

    fetchPoints();
  }, []);

  const navItems = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: User },
    { id: 'bookings', label: 'Lịch sử đặt vé', icon: Ticket },
    { id: 'checkins', label: 'Check-in vé', icon: QrCode },
    { id: 'notifications', label: 'Thông báo', icon: Bell, badge: notificationCount },
    { id: 'settings', label: 'Cài đặt tài khoản', icon: Settings },
  ];

  return (
    <>
      <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        {/* User Card Header */}
        <div className="p-6 bg-gradient-to-br from-red-950/60 via-[#161D2F] to-[#0B0F19] border-b border-white/10 text-white">
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 p-0.5 shadow-xl shadow-red-500/20">
                <div className="h-full w-full rounded-full bg-[#161D2F] flex items-center justify-center overflow-hidden">
                  {profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt={profile.full_Name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-9 w-9 text-red-400" />
                  )}
                </div>
              </div>
            </div>
            <h2 className="text-lg font-bold text-white text-center">{profile?.full_Name || 'Người dùng'}</h2>
            <p className="text-gray-400 text-xs truncate w-full text-center mt-0.5">{profile?.email}</p>
            {profile?.membershipLevel && (
              <div className="mt-2 px-3 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
                {profile.membershipLevel}
              </div>
            )}
          </div>

          {(points !== undefined || profile?.loyaltyPoints !== undefined) && (
            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-400" /> Điểm tích lũy
                </span>
                <span className="font-bold text-amber-400">
                  {(points ?? profile?.loyaltyPoints ?? 0).toLocaleString('vi-VN')} điểm
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                  style={{ width: `${Math.min(((points ?? profile?.loyaltyPoints ?? 0) / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-3">
          <ul className="space-y-1.5">
            {navItems.map(({ id, label, icon: Icon, badge }) => (
              <li key={id}>
                <button
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-red-400" />
                    <span>{label}</span>
                  </div>
                  {badge && badge > 0 ? (
                    <span className="bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                      {badge}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}

            <li className="border-t border-white/10 pt-2 mt-2">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Home className="h-4 w-4 text-blue-400" />
                <span>Trang chủ</span>
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Support Card */}
      <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl mt-6 p-4 text-sm text-gray-300">
        <h3 className="font-bold text-white mb-1.5">Hỗ trợ khách hàng</h3>
        <p className="text-xs text-gray-400 mb-3">Liên hệ hỗ trợ nhanh qua các kênh:</p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center text-gray-300">
            <Phone className="h-3.5 w-3.5 mr-2 text-red-400 flex-shrink-0" />
            <span>Hotline: 1900 6017</span>
          </div>
          <div className="flex items-center text-gray-300">
            <Mail className="h-3.5 w-3.5 mr-2 text-red-400 flex-shrink-0" />
            <span>Email: support@cinemaplus.vn</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSidebar;
