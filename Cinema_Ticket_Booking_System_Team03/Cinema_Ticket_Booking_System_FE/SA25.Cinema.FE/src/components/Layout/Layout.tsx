import React from 'react';
import { useLocation } from 'react-router-dom';
import NavbarLoginAdmin from './Navbar-Login-Admin';
import NavbarLoginStaff from './Navbar-Login-Staff';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children?: React.ReactNode;
  showNavbar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavbar = true }) => {
  const location = useLocation();
  const role = localStorage.getItem('role');

  const renderNavbar = () => {
    if (!showNavbar) return null;
    switch (role) {
      case 'Admin': return <NavbarLoginAdmin />;
      case 'Staff': return <NavbarLoginStaff />;
      default: return <Navbar />;
    }
  };

  // Check if current route is HomePage (needs full-height hero without extra top padding)
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19]">
      {renderNavbar()}
      <main className={`flex-grow ${showNavbar && !isHomePage ? 'pt-20' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
