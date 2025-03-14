import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');  // Reset lỗi khi gửi form

    try {
      setIsLoading(true);  // Bật loading khi đang xử lý

      // Gọi API login và lưu thông tin đăng nhập vào localStorage
      await login(email, password);  // Sử dụng hàm login từ AuthContext

      // Remove unused user variable
      // const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate('/Homepage');  // Điều hướng về trang chính sau khi đăng nhập

      toast.success('Đăng nhập thành công!');
    } catch {
      // Hiển thị thông báo lỗi khi đăng nhập thất bại
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
      toast.error('Đăng nhập thất bại!');
    } finally {
      setIsLoading(false);  // Tắt loading sau khi xử lý xong
    }
  };

  return (
    <div>
      {/* Render form login here */}
    </div>
  );
};

export default LoginForm; 