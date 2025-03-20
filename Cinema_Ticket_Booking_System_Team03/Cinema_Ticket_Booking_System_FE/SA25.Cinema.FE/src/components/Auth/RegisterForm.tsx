import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Form, Input, Button } from 'antd';
import { useState } from 'react';
const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dateOfBirth: '',
    sex: '',
    phoneNumber: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (values: any) => {
    setError('');
    setIsLoading(true);

    const emailRegex = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(values.email)) {
      setError('Invalid email format');
      setIsLoading(false);
      return;
    }

    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordPattern.test(values.password)) {
      setError('Password must be at least 8 characters long, contain letters, numbers, and at least one special character.');
      setIsLoading(false);
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const today = new Date();
    const birthDate = new Date(values.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 10) {
      setError('You must be at least 10 years old.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://localhost:7168/api/Auth/register', values, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 201 || response.status === 200) {
        toast.success(response.data.message || 'Registration successful!');
        navigate('/login');
      } else {
        throw new Error(response.data?.message || 'Unexpected error occurred');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Registration failed. Please try again.');
        toast.error(error.response?.data?.message || 'Registration failed.');
      } else {
        setError('An unexpected error occurred.');
        toast.error('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-black">
      <div className="px-6 py-8">
        <div className="flex justify-center mb-6">
          <UserPlus className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-6">
          Create your account
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Form layout="vertical" className="space-y-6" onFinish={handleSubmit}>
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Please enter your full name!' }]}
          >
            <Input placeholder="Enter your full name" style={{ width: '100%', padding: '8px' }} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input placeholder="Enter your email" style={{ width: '100%', padding: '8px' }} />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter your password!' },
              { 
                validator: (_, value) => {
                  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                  if (!value || passwordPattern.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Password must be at least 8 characters long, contain letters, numbers, and at least one special character.'));
                }
              }
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input.Password placeholder="Enter your password" style={{ width: '100%', padding: '8px' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </Form.Item>
        </Form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 mt-6">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
