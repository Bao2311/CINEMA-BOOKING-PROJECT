import React, { useEffect } from 'react';
// import { useAuth } from '../../context/AuthContext'; // Bạn có thể bỏ dòng này nếu không dùng `user` từ context trong component này nữa
import NavbarLoginAdmin from './Navbar-Login-Admin';
import NavbarLoginStaff from './Navbar-Login-Staff'; // 1. Import NavbarLoginStaff
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
interface LayoutProps {
  children?: React.ReactNode;
  showNavbar?: boolean; // Giữ nguyên prop này
}

const Layout: React.FC<LayoutProps> = ({ children, showNavbar = true }) => { // Đặt giá trị mặc định cho showNavbar là true nếu muốn
  const { user } = useAuth(); // Dòng này không còn cần thiết nếu chỉ dựa vào localStorage

  useEffect(() => {
    // Không cần useEffect nếu chỉ đọc localStorage khi render
  }, []);

  // Lấy role từ localStorage mỗi khi component render
  const role = localStorage.getItem('role');

  // Log vai trò hiện tại để kiểm tra (tùy chọn)
  console.log('Current user role from localStorage:', role);

  // Hàm hoặc biến phụ trợ để quyết định Navbar nào sẽ render (giúp code dễ đọc hơn)
  const renderNavbar = () => {
    if (!showNavbar) {
      return null; // Không hiển thị Navbar nếu showNavbar là false
    }

    switch (role) {
      case 'Admin':
        return <NavbarLoginAdmin />;
      case 'Staff': // 2. Thêm trường hợp cho 'Staff'
        return <NavbarLoginStaff />;
      default: // Trường hợp mặc định (không phải Admin, không phải Staff, hoặc chưa đăng nhập/không có role)
        return <Navbar />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {renderNavbar()} {/* 3. Sử dụng hàm/biến phụ trợ để render Navbar */}
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;





// import React, { useEffect } from 'react';
// import { useAuth } from '../../context/AuthContext';
// import NavbarLoginAdmin from './Navbar-Login-Admin';
// import Navbar from './Navbar';
// import Footer from './Footer';

// interface LayoutProps {
//   children?: React.ReactNode; // Đảm bảo rằng bạn định nghĩa 'children' nếu có
//   showNavbar?: boolean; // New prop to control navbar visibility
// }

// const Layout: React.FC<LayoutProps> = ({ children, showNavbar }) => {
//   const { user } = useAuth();

//   useEffect(() => {
//     // Token check logic can be implemented here if needed
//   }, []);

//   const role = localStorage.getItem('role');

//   // Log vai trò hiện tại
//   console.log('Current user role:', role);

//   return (
//     <div className="flex flex-col min-h-screen">
//       {showNavbar && (role === 'Admin' ? <NavbarLoginAdmin /> : <Navbar />)} 
//       <main className="flex-grow">
//         {children} {/* Render các phần tử con tại đây */}
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default Layout;