import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import UserForm from '../components/Auth/UserForm';
import Modal from '../components/Admin/Modal';
import axios from 'axios';
import classNames from 'classnames';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

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
      toast.success('User added successfully!');
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
      toast.success('User updated successfully!');
      navigate('/admin'); // Navigate back to the admin page
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
          toast.success('User deleted successfully!');
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

  // Calculate the users to display based on the current page
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div showNavbar={false}>
      <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-10 py-16">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Manage Users</h1>
          <button
            onClick={() => setIsAddingUser(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-md flex items-center transition-colors"
          >
            <Plus className="h-6 w-6 mr-2" />
            Add User
          </button>
        </div>

        <Modal isOpen={isAddingUser} onClose={() => setIsAddingUser(false)}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New User</h2>
          <UserForm
            onSubmit={handleAddUser}
            onCancel={() => setIsAddingUser(false)}
          />
        </Modal>

        <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>
          <UserForm
            user={editingUser}
            onSubmit={handleUpdateUser}
            onCancel={() => setEditingUser(null)}
          />
        </Modal>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Account Status</th>
                    <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-6 text-center text-gray-500">No users found.</td>
                    </tr>
                  ) : (
                    currentUsers.map(user => (
                      <tr key={user.user_ID}>
                        <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-700">{user.user_ID}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-700">{user.full_Name}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-700">{user.email}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-lg text-gray-700">{user.role}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-lg">
                          <span
                            className={classNames('px-2 py-1 rounded-full text-white', {
                              'bg-green-500': user.account_Status === 'Active',
                              'bg-yellow-500': user.account_Status === 'Pending',
                              'bg-red-500': user.account_Status === 'Locked',
                            })}
                          >
                            {user.account_Status}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-lg font-medium">
                          <div className="flex space-x-3">
                            <a href={`mailto:${user.email}`} className="text-indigo-600 hover:text-indigo-900" title="Email">
                              <Mail className="h-6 w-6" />
                            </a>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit className="h-6 w-6" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.user_ID)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-6 w-6" />
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

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l flex items-center"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </button>
          <span className="text-lg font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r flex items-center"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <ToastContainer />
    </div >
  );
};

export default ManageUsersPage;