import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import NavbarLogin from './Navbar-Login';
import Footer from './Footer';


interface LayoutProps {
  children?: React.ReactNode; // Đảm bảo rằng bạn định nghĩa 'children' nếu có
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token); // Nếu có token, set isAuthenticated là true
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {isAuthenticated ? <NavbarLogin /> : <Navbar />}
      <main className="flex-grow">
        {children} {/* Render các phần tử con tại đây */}
      </main>
      <Footer />
    </div>
  );
};


export default Layout;
