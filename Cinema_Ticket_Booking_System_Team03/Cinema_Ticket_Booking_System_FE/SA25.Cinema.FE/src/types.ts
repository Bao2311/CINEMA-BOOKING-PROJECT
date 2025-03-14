export type User = {
  id: string; // Ensure the id property is included
  username: string;
  email: string;
  role: 'admin' | 'employee';
};

export type Employee = {
  id: string;
  userId: string;
  position: string;
  hireDate: string;
  salary: number;
  user: User;
};

// Mock data for employees
export const mockEmployees: Employee[] = [
  {
    id: 'employee-1',
    userId: 'user-1',
    position: 'Software Engineer',
    hireDate: '2022-01-15',
    salary: 60000,
    user: {
      id: 'user-1',
      username: 'john_doe',
      email: 'john@example.com',
      role: 'employee',
    },
  },
  {
    id: 'employee-2',
    userId: 'user-2',
    position: 'Product Manager',
    hireDate: '2021-06-20',
    salary: 80000,
    user: {
      id: 'user-2',
      username: 'jane_smith',
      email: 'jane@example.com',
      role: 'admin',
    },
  },
];
