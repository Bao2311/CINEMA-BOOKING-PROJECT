import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LogIn, Eye, EyeOff, Mail, Lock, CheckCircle, AlertCircle, 
  ShieldCheck, Loader2, ArrowRight, Info
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
const LoginForm: React.FC = () => {
  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
  
  // UI state management
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  // Refs for focus management and animations
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Focus on email input when component mounts
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // Email validation with comprehensive regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
  };

  // Form validation
  useEffect(() => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (touched.email) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (touched.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    setErrors(newErrors);
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Auto-validate after user has attempted to submit once
    if (formSubmitted) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // Refocus on password input after toggling visibility
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setFormSubmitted(true);
    
  //   // Kiểm tra lỗi
  //   const newErrors: {email?: string; password?: string; general?: string} = {};
  //   if (!formData.email) newErrors.email = 'Email is required';
  //   else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    
  //   if (!formData.password) newErrors.password = 'Password is required';
  //   else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
  //   // Nếu có lỗi, không tiếp tục
  //   if (Object.keys(newErrors).length > 0) {
  //     setErrors(newErrors);
  //     setTouched({ email: true, password: true });
  //     return;
  //   }
    
  //   // Bắt đầu xử lý đăng nhập
  //   setIsLoading(true);
    
  //   try {
  //     const result = await login(formData.email, formData.password);
      
  //     // Kiểm tra nếu cần đổi mật khẩu
  //     if (result && result.requiresPasswordChange) {
  //       // Chuyển hướng đến trang profile với state yêu cầu đổi mật khẩu
  //       navigate('/settings', { 
  //         state: { 
  //           passwordChangeRequired: true, 
  //           from: location // Lưu vị trí hiện tại để quay lại sau
  //         } 
  //       });
  //       toast.info('Please change your password before continuing.');
  //       return;
  //     } else {
  //       // If no password change required, navigate to home or intended destination
  //       const from = location.state?.from?.pathname || '/';
  //       navigate(from);
  //     }
      
  //     // Đăng nhập thành công
  //     toast.success('Login successful!');
  //     // Chuyển hướng đến trang chính
  //     navigate('/');
  //     // Lưu thông tin đăng nhập nếu chọn "Remember me"
  //     if (rememberMe) {
  //       localStorage.setItem('rememberedEmail', formData.email);
  //     } else {
  //       localStorage.removeItem('rememberedEmail');
  //     }
      
      
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     setLoginAttempts(prev => prev + 1);
      
  //     // Hiển thị thông báo lỗi
  //     setErrors({
  //       general: 'Login failed. Please check your credentials.'
  //     });
      
  //     toast.error('Login failed. Please check your credentials.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setFormSubmitted(true); // Add this to be consistent with your validation logic
  
    // Check for validation errors before submitting
    const newErrors: {email?: string; password?: string; general?: string} = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    // If there are validation errors, don't proceed with login
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      setIsLoading(false);
      return;
    }
  
    try {
      const result = await login(formData.email, formData.password);
      
      if (result && result.requiresPasswordChange) {
        navigate('/profile/settings', { 
          state: { 
            passwordChangeRequired: true,
            from: location
          } 
        });
        toast.info('Please change your password before continuing.');
      } else {
        toast.success('Login successful!');
        // Navigate to home or intended destination
        const from = location.state?.from?.pathname || '/';
        navigate(from);
        
        // Save login info if "Remember me" is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginAttempts(prev => prev + 1);
      setError('Invalid email or password');
      setErrors({
        general: 'Login failed. Please check your credentials.'
      });
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
      
      // If email is pre-filled, focus on password instead
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }
  }, []);

  // Show security warning after multiple failed attempts
  const showSecurityWarning = loginAttempts >= 3;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="px-8 py-10">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-3 rounded-full transition-all duration-300 hover:bg-indigo-200 hover:scale-105">
            <LogIn className="h-10 w-10 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Sign in to access your account
        </p>

        {errors.general && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          </div>
        )}
{/* Add the error display code here */}
{error && (
  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
      <p className="text-sm text-red-700">{error}</p>
    </div>
  </div>
)}
        {showSecurityWarning && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <Info className="h-5 w-5 text-amber-500 mr-2" />
              <p className="text-sm text-amber-700">
                Multiple login attempts detected. Make sure you're using the correct credentials.
              </p>
            </div>
          </div>
        )}

        <form 
          className="space-y-6 transition-all" 
          onSubmit={handleSubmit} 
          noValidate
          onKeyDown={handleKeyDown}
        >
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
              Email
              {touched.email && !errors.email && (
                <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
              )}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
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
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`block w-full pl-10 pr-10 py-3 border ${
                  errors.email ? 'border-red-500 bg-red-50' : touched.email ? 'border-green-500 bg-green-50' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors.email ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                } focus:border-transparent transition-all duration-200`}
                placeholder="your@email.com"
              />
              {touched.email && !errors.email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
              {errors.email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" id="email-error">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center">
                Password
                {touched.password && !errors.password && (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                )}
              </label>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                ref={passwordInputRef}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`block w-full pl-10 pr-10 py-3 border ${
                  errors.password ? 'border-red-500 bg-red-50' : touched.password ? 'border-green-500 bg-green-50' : 'border-gray-300'
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                  errors.password ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                } focus:border-transparent transition-all duration-200`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500 hover:text-indigo-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500 hover:text-indigo-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600" id="password-error">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 relative group overflow-hidden"
            >
              <span className={`flex items-center transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                Sign in
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-gray-400 mr-2" />
            <p className="text-xs text-gray-500">
              Secure login protected with 256-bit encryption
            </p>
          </div>
        </form>
      </div>

      <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-center text-sm text-gray-600 mb-4 sm:mb-0">
          Don't have an account?
        </p>
        <Link 
          to="/register" 
          className="w-full sm:w-auto flex justify-center items-center px-6 py-2 border border-indigo-600 rounded-lg text-base font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 group"
        >
          Sign up now
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
