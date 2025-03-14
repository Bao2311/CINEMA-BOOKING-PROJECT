// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, Edit, Trash2, Mail } from 'lucide-react';
// import Layout from '../components/Layout/Layout';
// import EmployeeForm from '../components/Admin/EmployeeForm';
// import { Employee, User } from '../types';
// import { mockEmployees } from '../data/mockData';
// import { useAuth } from '../context/AuthContext';

// const ManageEmployeesPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { user, isAuthenticated } = useAuth();
  
//   const [employees, setEmployees] = useState<(Employee & { user: User })[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAddingEmployee, setIsAddingEmployee] = useState(false);
//   const [editingEmployee, setEditingEmployee] = useState<(Employee & { user: User }) | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
  
//   useEffect(() => {
//     // Check if user is authenticated and is an admin
//     // if (!isAuthenticated || (user && user.role !== 'admin')) {
//     //   navigate('/');
//     //   return;
//     // }
    
//     // In a real app, this would be an API call
//     // For now, we'll use mock data
//     setEmployees(mockEmployees);
//     setIsLoading(false);
//   }, [isAuthenticated, user, navigate]);

//   const handleAddEmployee = (data: { employee: Omit<Employee, 'id'>, user: Omit<User, 'id'> }) => {
//     // In a real app, this would be an API call
//     // For now, we'll simulate adding an employee
//     const newUser: User = {
//       id: `user-${Date.now()}`,
//       ...data.user,
//     };
    
//     const newEmployee: Employee & { user: User } = {
//       id: `employee-${Date.now()}`,
//       ...data.employee,
//       userId: newUser.id,
//       user: newUser,
//     };
    
//     setEmployees([...employees, newEmployee]);
//     setIsAddingEmployee(false);
//   };

//   const handleUpdateEmployee = (data: { employee: Omit<Employee, 'id'>, user: Omit<User, 'id'> }) => {
//     // In a real app, this would be an API call
//     // For now, we'll simulate updating an employee
//     if (!editingEmployee) return;
    
//     const updatedEmployees = employees.map(employee => {
//       if (employee.id === editingEmployee.id) {
//         return {
//           ...employee,
//           ...data.employee,
//           user: {
//             ...employee.user,
//             ...data.user,
//           },
//         };
//       }
//       return employee;
//     });
    
//     setEmployees(updatedEmployees);
//     setEditingEmployee(null);
//   };

//   const handleDeleteEmployee = (id: string) => {
//     // In a real app, this would be an API call with confirmation
//     // For now, we'll simulate deleting an employee
//     if (window.confirm('Are you sure you want to delete this employee?')) {
//       setEmployees(employees.filter(employee => employee.id !== id));
//     }
//   };

//   const filteredEmployees = employees.filter(employee => 
//     employee.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     employee.position.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <Layout>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="flex justify-between items-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Manage Employees</h1>
//           <button
//             onClick={() => setIsAddingEmployee(true)}
//             className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
//           >
//             <Plus className="h-5 w-5 mr-1" />
//             Add Employee
//           </button>
//         </div>
        
//         {isAddingEmployee && (
//           <div className="bg-white rounded-lg shadow-md p-6 mb-8">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Employee</h2>
//             <EmployeeForm
//               onSubmit={handleAddEmployee}
//               onCancel={() => setIsAddingEmployee(false)}
//             />
//           </div>
//         )}
        
//         {editingEmployee && (
//           <div className="bg-white rounded-lg shadow-md p-6 mb-8">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Employee</h2>
//             <EmployeeForm
//               employee={editingEmployee}
//               onSubmit={handleUpdateEmployee}
//               onCancel={() => setEditingEmployee(null)}
//             />
//           </div>
//         )}
        
//         <div className="bg-white rounded-lg shadow-md overflow-hidden">
//           <div className="p-4 border-b border-gray-200">
//             <input
//               type="text"
//               placeholder="Search employees..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//             />
//           </div>
          
//           {isLoading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Employee
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Position
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Hire Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Salary
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredEmployees.length === 0 ? (
//                     <tr>
//                       <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
//                         No employees found.
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredEmployees.map(employee => (
//                       <tr key={employee.id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center">
//                             <div className="ml-4">
//                               <div className="text-sm font-medium text-gray-900">
//                                 {employee.user.username}
//                               </div>
//                               <div className="text-sm text-gray-500">{employee.user.email}</div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-sm text-gray-900">{employee.position}</div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             employee.user.role === 'admin'
//                               ? 'bg-purple-100 text-purple-800'
//                               : 'bg-green-100 text-green-800'
//                           }`}>
//                             {employee.user.role}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-sm text-gray-500">
//                             {new Date(employee.hireDate).toLocaleDateString()}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="text-sm text-gray-500">
//                             ${employee.salary.toLocaleString()}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                           <div className="flex space-x-2">
//                             <a
//                               href={`mailto:${employee.user.email}`}
//                               className="text-indigo-600 hover:text-indigo-900"
//                               title="Email"
//                             >
//                               <Mail className="h-5 w-5" />
//                             </a>
//                             <button
//                               onClick={() => setEditingEmployee(employee)}
//                               className="text-yellow-600 hover:text-yellow-900"
//                               title="Edit"
//                             >
//                               <Edit className="h-5 w-5" />
//                             </button>
//                             <button
//                               onClick={() => handleDeleteEmployee(employee.id)}
//                               className="text-red-600 hover:text-red-900"
//                               title="Delete"
//                             >
//                               <Trash2 className="h-5 w-5" />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default ManageEmployeesPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import UserForm from '../components/Auth/UserForm';
import axios from 'axios';
import { Menu, Dropdown } from 'antd';

interface User {
  $id: string;
  user_ID: number;
  full_Name: string;
  email: string;
  role: string;
  date_Of_Birth: string;
  sex: string;
  phone_Number: string;
  address: string;
  account_Status: string;
  created_At: string;
  last_Login: string | null;
}

const ManageUsersPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxIiwidW5pcXVlX25hbWUiOiJOZ3V54buFbiBWxINuIE1pbmgiLCJlbWFpbCI6Im5ndXllbnZhbmFAY2luZW1hLmNvbSIsInJvbGUiOiJBZG1pbiIsIm5iZiI6MTc0MTkxMzExMCwiZXhwIjoxNzQxOTk5NTEwLCJpYXQiOjE3NDE5MTMxMTAsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjcxNjgiLCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo3MTY4In0.TB5uLsWtcJh3Rac6Jnz2bZTeBajZd4803vhhlVWB8wQ'; // Your provided token

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://localhost:7168/api/User', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.$values && Array.isArray(response.data.$values)) {
          setUsers(response.data.$values);
        } else {
          console.error('API response is not an array:', response.data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [token]); // Add token to the dependency array if you might change it dynamically

  const handleAddUser = async (data: Omit<User, '$id' | 'user_ID' | 'created_At' | 'last_Login'>) => {
    const postData = {
      email: data.email,
      fullName: data.full_Name,
      role: data.role,
      department: data.department, // Department is new
      hire_Date: new Date().toISOString(),
      dateOfBirth: data.date_Of_Birth,
      sex: data.sex,
      phoneNumber: data.phone_Number,
      address: data.address,
    };
    
    try {
      const response = await axios.post('https://localhost:7168/api/User', postData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers([...users, response.data]);
      setIsAddingUser(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (data: Omit<User, '$id' | 'created_At' | 'last_Login'>) => {
    if (!editingUser) return;
    const putData = { 
      fullName: data.full_Name,
      dateOfBirth: data.date_Of_Birth,
      sex: data.sex,
      phoneNumber: data.phone_Number,
      address: data.address,
      role: data.role,
      accountStatus: data.account_Status,
    };
    
    try {
      const response = await axios.put(`https://localhost:7168/api/User/${editingUser.user_ID}`, putData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.map(user => user.user_ID === editingUser.user_ID ? response.data : user));
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`https://localhost:7168/api/User/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setUsers(users.filter(user => user.user_ID !== id));
        } else {
          console.error('Failed to delete user:', response);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout showNavbar={false}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
          <button
            onClick={() => setIsAddingUser(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-1" />
            Add User
          </button>
        </div>

        {isAddingUser && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
            <UserForm
              onSubmit={handleAddUser}
              onCancel={() => setIsAddingUser(false)}
            />
          </div>
        )}

        {editingUser && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
            <UserForm
              user={editingUser}
              onSubmit={handleUpdateUser}
              onCancel={() => setEditingUser(null)}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No users found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.user_ID}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.full_Name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.account_Status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <a href={`mailto:${user.email}`} className="text-indigo-600 hover:text-indigo-900" title="Email">
                              <Mail className="h-5 w-5" />
                            </a>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.user_ID)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ManageUsersPage;
