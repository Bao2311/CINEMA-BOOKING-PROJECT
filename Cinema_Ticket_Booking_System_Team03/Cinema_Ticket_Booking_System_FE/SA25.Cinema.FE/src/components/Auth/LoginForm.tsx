import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  LogIn,
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Film,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email: boolean;
    password: boolean;
  }>({
    email: false,
    password: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    const newErrors: { email?: string; password?: string } = {};
    if (touched.email) {
      if (!formData.email) {
        newErrors.email = "Email không được để trống";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Định dạng email không hợp lệ";
      }
    }
    if (touched.password) {
      if (!formData.password) {
        newErrors.password = "Mật khẩu không được để trống";
      } else if (formData.password.length < 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }
    }
    setErrors(newErrors);
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) newErrors.email = "Email không được để trống";
    else if (!validateEmail(formData.email))
      newErrors.email = "Định dạng email không hợp lệ";

    if (!formData.password) newErrors.password = "Mật khẩu không được để trống";
    else if (formData.password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);

      if (result && result.requiresPasswordChange) {
        navigate("/profile/settings", {
          state: {
            passwordChangeRequired: true,
            from: location,
          },
        });
        toast.info("Vui lòng thay đổi mật khẩu trước khi tiếp tục.");
      } else {
        const from = location.state?.from?.pathname || "/";
        navigate(from);

        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        toast.success("Đăng nhập thành công!");
      }
    } catch (err: any) {
      console.error("Lỗi đăng nhập:", err);
      const msg =
        err?.response?.data?.message ||
        "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-[#161D2F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-red-500 rounded-xl blur-lg opacity-60" />
          <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl">
            <Film className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Chào mừng trở lại
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Đăng nhập vào tài khoản CinemaPlus
        </p>
      </div>

      {/* Quick Test Accounts Tooltip */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-300">
        <div className="font-semibold text-amber-400 mb-1">🔑 Tài khoản test nhanh:</div>
        <div className="grid grid-cols-1 gap-1 text-[11px] text-gray-400">
          <div><span className="text-white">Admin:</span> admin@cinema.com / Admin@123</div>
          <div><span className="text-white">Staff:</span> staff@cinema.com / Staff@123</div>
          <div><span className="text-white">Customer:</span> customer@cinema.com / Customer@123</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3.5 mb-6 rounded-xl flex items-center gap-2.5 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-1.5"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              ref={emailInputRef}
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="admin@cinema.com"
              className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${
                errors.email ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-red-500"
              } text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all`}
            />
            {touched.email && !errors.email && (
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            )}
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Mật khẩu
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${
                errors.password ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-red-500"
              } text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-white/10 border-white/20 text-red-600 focus:ring-red-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">Ghi nhớ đăng nhập</span>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-red-500/30 hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </>
          )}
        </button>
      </form>

      {/* Register Footer */}
      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <p className="text-sm text-gray-400">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-red-400 hover:text-red-300 font-semibold transition-colors"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
