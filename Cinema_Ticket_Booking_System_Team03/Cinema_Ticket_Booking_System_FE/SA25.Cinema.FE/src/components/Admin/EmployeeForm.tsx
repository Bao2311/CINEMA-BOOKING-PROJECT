import React, { useState } from 'react';
import { Employee, User } from '../../types';

interface EmployeeFormProps {
  employee?: Employee & { user: User };
  onSubmit: (data: { employee: Omit<Employee, 'id'>, user: Omit<User, 'id'> }) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSubmit, onCancel }) => {
  const [username, setUsername] = useState(employee?.user.username || '');
  const [email, setEmail] = useState(employee?.user.email || '');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState(employee?.position || '');
  const [salary, setSalary] = useState(employee?.salary.toString() || '');
  const [hireDate, setHireDate] = useState(employee?.hireDate || new Date().toISOString().split('T')[0]);
  const [role, setRole] = useState<'admin' | 'employee'>(employee?.user.role || 'employee');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!employee && !password.trim()) newErrors.password = 'Password is required';
    if (!position.trim()) newErrors.position = 'Position is required';
    if (!salary.trim()) newErrors.salary = 'Salary is required';
    if (isNaN(Number(salary))) newErrors.salary = 'Salary must be a number';
    if (!hireDate) newErrors.hireDate = 'Hire date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSubmit({
      employee: {
        position,
        salary: Number(salary),
        hireDate,
        userId: employee?.userId || '',
      },
      user: {
        username,
        email,
        role,
        isMember: false,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      {!employee && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>
      )}

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
          Position
        </label>
        <input
          type="text"
          id="position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.position ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
            Salary
          </label>
          <input
            type="number"
            id="salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.salary ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
        </div>

        <div>
          <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-1">
            Hire Date
          </label>
          <input
            type="date"
            id="hireDate"
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.hireDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.hireDate && <p className="mt-1 text-sm text-red-600">{errors.hireDate}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {employee ? 'Update Employee' : 'Add Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;