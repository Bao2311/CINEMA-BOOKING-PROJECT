import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import NavbarLoginAdmin from './Navbar-Login-Admin';
import NavbarLogin from './Navbar-Login';
import Footer from './Footer';

interface LayoutProps {
  children?: React.ReactNode; // Đảm bảo rằng bạn định nghĩa 'children' nếu có
  showNavbar?: boolean; // New prop to control navbar visibility
}

const Layout: React.FC<LayoutProps> = ({ children, showNavbar }) => { // Include showNavbar in destructuring
  const { user } = useAuth();

  useEffect(() => {
    // Token check logic can be implemented here if needed
  }, []);

  const isAdmin = user?.role === 'admin';

  // Add console log to verify current user role
  console.log('Current user role:', user?.role);

  return (
    <div className="flex flex-col min-h-screen">
      {showNavbar && (isAdmin ? <NavbarLoginAdmin /> : <NavbarLogin />)} 
      <main className="flex-grow">
        {children} {/* Render các phần tử con tại đây */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
