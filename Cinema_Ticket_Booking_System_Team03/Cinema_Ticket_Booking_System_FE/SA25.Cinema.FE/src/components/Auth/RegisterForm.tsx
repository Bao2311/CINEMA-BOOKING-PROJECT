import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, MapPin, Film, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from '../../config/apiUrl';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    dateOfBirth: "",
    sex: "Nam",
    phoneNumber: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    const emailRegex = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(formData.email)) {
      setError("Định dạng email không hợp lệ");
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/Auth/register`, {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : new Date().toISOString(),
        sex: formData.sex,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        navigate("/login");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      const msg = err?.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#161D2F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-red-500 rounded-xl blur-lg opacity-60" />
          <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl">
            <Film className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Tạo tài khoản mới
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Trở thành thành viên của CinemaPlus
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3.5 mb-6 rounded-xl flex items-center gap-2.5 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Họ và tên
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nguyễn Văn A"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Phone & Sex */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Số điện thoại
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="0901234567"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Giới tính
            </label>
            <select
              name="sex"
              value={formData.sex}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all cursor-pointer"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Xác nhận MK
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Địa chỉ
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <MapPin className="h-4 w-4" />
            </div>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="TP. Hồ Chí Minh"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-red-500/30 hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Đăng ký tài khoản
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-sm text-gray-400">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="text-red-400 hover:text-red-300 font-semibold transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
