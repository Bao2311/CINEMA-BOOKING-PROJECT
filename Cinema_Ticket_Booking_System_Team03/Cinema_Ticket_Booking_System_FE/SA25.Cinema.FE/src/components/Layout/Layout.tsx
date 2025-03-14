import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import NavbarLoginAdmin from './Navbar-Login-Admin';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children?: React.ReactNode; // Đảm bảo rằng bạn định nghĩa 'children' nếu có
  showNavbar?: boolean; // New prop to control navbar visibility
}

const Layout: React.FC<LayoutProps> = ({ children, showNavbar }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Token check logic can be implemented here if needed
  }, []);

  const role = localStorage.getItem('role');

  // Log vai trò hiện tại
  console.log('Current user role:', role);

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && (role === 'Admin' ? <NavbarLoginAdmin /> : <Navbar />)} 
      <main className="flex-grow">
        {children} {/* Render các phần tử con tại đây */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;