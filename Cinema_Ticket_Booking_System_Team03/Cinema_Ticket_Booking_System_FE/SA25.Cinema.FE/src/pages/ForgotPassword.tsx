import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2, Loader2, Film } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_URL } from '../config/apiUrl';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/Auth/reset-password`,
        { email },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 200) {
        setSuccess('Mật khẩu tạm thời đã được gửi đến email của bạn thành công!');
        toast.success('Mật khẩu mới đã được gửi đến email của bạn');
      } else {
        throw new Error(response.data?.message || 'Có lỗi xảy ra');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response);
        const msg = error.response?.data?.message || 'Không tìm thấy tài khoản với email này hoặc lỗi hệ thống.';
        setError(msg);
        toast.error(msg);
      } else {
        console.error('Unexpected Error:', error);
        setError('Đã xảy ra lỗi không mong muốn.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#161D2F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-red-500 rounded-xl blur-lg opacity-60" />
            <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Quên mật khẩu
          </h2>
          <p className="text-gray-400 text-sm mt-1 text-center">
            Nhập email của bạn để nhận mật khẩu tạm thời
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3.5 mb-6 rounded-xl flex items-center gap-2.5 text-red-400 text-sm animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center animate-fade-in py-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Đã gửi mật khẩu mới!</h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Mật khẩu tạm thời đã được gửi đến email <strong className="text-red-400">{email}</strong>. Vui lòng kiểm tra hộp thư (cả thư mục Spam nếu cần) và đăng nhập lại.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer"
            >
              Đến trang đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Địa chỉ email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-red-500 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Gửi mật khẩu mới</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại đăng nhập</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
