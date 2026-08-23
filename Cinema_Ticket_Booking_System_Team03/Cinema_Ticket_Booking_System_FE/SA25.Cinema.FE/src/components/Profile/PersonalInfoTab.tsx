import React, { useState, useEffect } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { Edit, X } from 'lucide-react';
import { UserProfile } from '../../interfaces/ProfileInterfaces';
import { format } from 'date-fns';
import axios from 'axios';
import { Ticket, Gift, CreditCard } from 'lucide-react';
interface PersonalInfoTabProps {
  profile: UserProfile | null;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  showAlert: (type: 'success' | 'error' | 'info', message: string) => void;
  apiBaseUrl: string;
  navigate: NavigateFunction;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  profile,
  activeSubTab,
  setActiveSubTab,
  showAlert,
  apiBaseUrl,
  navigate,
  setProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_Name: '',
    email: '',
    phone_Number: '',
    address: '',
    date_Of_Birth: '',
    sex: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_Name: profile.full_Name || '',
        email: profile.email || '',
        phone_Number: profile.phone_Number || '',
        address: profile.address || '',
        date_Of_Birth: profile.date_Of_Birth ? profile.date_Of_Birth.split('T')[0] : '',
        sex: profile.sex || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.phone_Number)) {
      showAlert('error', 'Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số.');
      return;
    }
    try {
      let formattedDateOfBirth = formData.date_Of_Birth;
      if (formData.date_Of_Birth) {
        const dob = new Date(formData.date_Of_Birth);
        const today = new Date('2025-04-08'); // Current date: April 08, 2025
        const ageDiff = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const dayDiff = today.getDate() - dob.getDate();
        const isUnder10 = ageDiff < 10 || (ageDiff === 10 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)));
  
        if (isNaN(dob.getTime()) || dob >= today) {
          showAlert('error', 'Ngày sinh không hợp lệ hoặc phải trong quá khứ.');
          return;
        }
        if (isUnder10) {
          showAlert('error', 'Bạn phải ít nhất 10 tuổi.');
          return;
        }
        formattedDateOfBirth = dob.toISOString().split('T')[0];
      }
      const token = localStorage.getItem('token');
      if (!token) {
        showAlert('error', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
        return;
      }
      await axios.put(`${apiBaseUrl}/Auth/profile`, {
        fullName: formData.full_Name,
        phoneNumber: formData.phone_Number,
        address: formData.address,
        dateOfBirth: formattedDateOfBirth,
        sex: formData.sex
      }, { headers: { Authorization: `Bearer ${token}` } });
      showAlert('success', 'Cập nhật thông tin thành công!');
      setIsEditing(false);
      if (profile) {
        setProfile({ ...profile, ...formData, date_Of_Birth: formattedDateOfBirth });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showAlert('error', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString.split('T')[0];
    }
  };

  return (
    <div className="bg-[#161D2F] border border-white/10 rounded-2xl shadow-xl overflow-hidden text-white">
      <div className="border-b border-white/10">
        <div className="flex">
          <button
            onClick={() => setActiveSubTab('personal')}
            className={`px-6 py-4 text-sm font-semibold transition-all ${
              activeSubTab === 'personal'
                ? 'text-red-400 border-b-2 border-red-500 bg-white/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveSubTab('membership')}
            className={`px-6 py-4 text-sm font-semibold transition-all ${
              activeSubTab === 'membership'
                ? 'text-red-400 border-b-2 border-red-500 bg-white/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Thành viên & Ưu đãi
          </button>
        </div>
      </div>
      <div className="p-6">
        {activeSubTab === 'personal' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Thông tin cá nhân</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      setFormData({
                        full_Name: profile.full_Name || '',
                        email: profile.email || '',
                        phone_Number: profile.phone_Number || '',
                        address: profile.address || '',
                        date_Of_Birth: profile.date_Of_Birth ? profile.date_Of_Birth.split('T')[0] : '',
                        sex: profile.sex || '',
                      });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Hủy</span>
                </button>
              )}
            </div>
            <form className="space-y-6" onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_Name" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_Name"
                    value={formData.full_Name}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${
                      isEditing
                        ? 'border-white/20 bg-white/5 text-white focus:border-red-500'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    className="w-full px-3.5 py-2.5 border border-white/10 bg-white/[0.02] text-gray-400 rounded-xl text-sm cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="phone_Number" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="phone_Number"
                    value={formData.phone_Number}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${
                      isEditing
                        ? 'border-white/20 bg-white/5 text-white focus:border-red-500'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Giới tính
                  </label>
                  <select
                    id="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${
                      isEditing
                        ? 'border-white/20 bg-[#161D2F] text-white focus:border-red-500'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isEditing}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none transition-all ${
                      isEditing
                        ? 'border-white/20 bg-white/5 text-white focus:border-red-500'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              {isEditing && (
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
        {activeSubTab === 'membership' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Thành viên & Ưu đãi</h2>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg overflow-hidden shadow-lg mb-8 p-6 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Thẻ thành viên Cinema</h3>
                  <p className="text-indigo-200 text-sm">Hạng: {profile?.membershipLevel || 'Standard'}</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  {profile?.loyaltyPoints || 0} điểm
                </div>
              </div>
              <div className="mb-6">
                <p className="text-2xl font-mono tracking-wider">**** **** **** {Math.floor(Math.random() * 9000) + 1000}</p>
                <p className="text-sm text-indigo-200 mt-1">Thành viên từ: {formatDate(profile?.memberSince || new Date().toISOString())}</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-lg font-medium uppercase">{profile?.full_Name}</p>
                <img src="/logo-placeholder-white.png" alt="Cinema Logo" className="h-8 opacity-80" />
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quyền lợi hạng {profile?.membershipLevel || 'Standard'}</h3>
                <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
                      <Ticket className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Giảm giá vé</h4>
                      <p className="text-xs text-gray-500">Giảm 10% giá vé các ngày trong tuần (T2-T5).</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
                      <Gift className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Quà sinh nhật</h4>
                      <p className="text-xs text-gray-500">01 vé xem phim 2D miễn phí trong tháng sinh nhật.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1.5">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">Tích điểm đổi quà</h4>
                      <p className="text-xs text-gray-500">Mỗi 20.000đ = 1 điểm. Đổi điểm lấy vé, combo bắp nước.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Ưu đãi dành cho bạn</h3>
                <div className="space-y-4">
                  <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:shadow-sm transition-shadow flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Thứ 2 vui vẻ - Giảm 30% vé 2D</h4>
                      <p className="text-sm text-gray-600 mt-1">Áp dụng cho mọi suất chiếu ngày thứ 2.</p>
                      <span className="text-xs text-gray-500 block mt-2">Hết hạn: 30/04/2025</span>
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 border border-indigo-600 rounded-md">
                      Chi tiết
                    </button>
                  </div>
                  <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:shadow-sm transition-shadow flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Combo bắp nước chỉ 79.000đ</h4>
                      <p className="text-sm text-gray-600 mt-1">Áp dụng khi mua vé online hoặc tại quầy.</p>
                      <span className="text-xs text-gray-500 block mt-2">Hết hạn: 15/03/2025</span>
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 border border-indigo-600 rounded-md">
                      Chi tiết
                    </button>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    Xem tất cả ưu đãi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalInfoTab;
