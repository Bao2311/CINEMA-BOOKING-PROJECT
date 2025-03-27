import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Dropdown, Menu as AntdMenu } from 'antd';
import { useAuth } from '../../context/AuthContext'; // Đảm bảo đường dẫn AuthContext chính xác
import avatar from '../../Images/avata.jpg'; // Đảm bảo đường dẫn avatar chính xác
import {
    UserOutlined,
    LogoutOutlined,
    HomeOutlined,
    ScheduleOutlined, // Icon cho lịch chiếu/đặt vé
    SolutionOutlined, // Icon cho quản lý đặt vé
    VideoCameraOutlined // Icon cho Phim (Movies)
} from '@ant-design/icons';

const NavbarLoginStaff: React.FC = () => {
    const { user, isAuthenticated } = useAuth(); // Chỉ lấy những gì cần thiết từ context
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // const navigate = useNavigate(); // Giữ lại nếu cần cho các hành động khác

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        // Xóa thông tin đăng nhập khỏi localStorage (hoặc sessionStorage nếu dùng)
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('fullname');
        localStorage.removeItem('isLoggedIn');
        // Chuyển hướng về trang chủ hoặc trang đăng nhập
        window.location.href = '/';
    };

    // Menu dropdown cho nhân viên
    const staffMenu = (
        <AntdMenu>
            <AntdMenu.Item key="1" icon={<HomeOutlined />}>
                {/* Có thể dẫn đến trang chủ chung hoặc dashboard riêng của nhân viên */}
                <Link to="/">Trang Chủ</Link>
            </AntdMenu.Item>
            <AntdMenu.Item key="2" icon={<UserOutlined />}>
                <Link to="/profile">Thông Tin Cá Nhân</Link>
            </AntdMenu.Item>
            <AntdMenu.Item key="3" icon={<ScheduleOutlined />}>
                {/* Liên kết đến chức năng chính: đặt vé, thường bắt đầu từ lịch chiếu */}
                <Link to="/showtimes">Đặt Vé / Lịch Chiếu</Link>
            </AntdMenu.Item>
            <AntdMenu.Item key="4" icon={<SolutionOutlined />}>
                 {/* Liên kết để quản lý các vé đã đặt */}
                <Link to="/manage-bookings">Quản Lý Đặt Vé</Link>
            </AntdMenu.Item>
            <AntdMenu.Item key="5" icon={<LogoutOutlined />} danger onClick={handleLogout}>
                Đăng xuất
            </AntdMenu.Item>
        </AntdMenu>
    );

    return (
        // Đổi màu nền để phân biệt với Navbar Admin nếu muốn (ví dụ: bg-teal-700)
        <nav className="bg-teal-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            {/* Cập nhật tiêu đề cho phù hợp với vai trò nhân viên */}
                            <span className="font-bold text-xl">CinemaPlus Staff</span>
                        </Link>
                    </div>

                    {/* Navigation cho Desktop */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link to="/showtimes" className="px-3 py-2 rounded-md hover:bg-teal-600">
                           Lịch Chiếu / Đặt Vé
                        </Link>
                         <Link to="/manage-bookings" className="px-3 py-2 rounded-md hover:bg-teal-600">
                           Quản Lý Đặt Vé
                        </Link>
                        <Link to="/movies" className="px-3 py-2 rounded-md hover:bg-teal-600">
                           Danh Sách Phim {/* Nhân viên có thể cần xem thông tin phim */}
                        </Link>
                        {/* Thêm các link khác phù hợp với nhân viên nếu cần */}

                        {/* Dropdown Avatar và Tên người dùng */}
                        {isAuthenticated && user && (
                            <Dropdown overlay={staffMenu} trigger={['click']} placement="bottomRight">
                                <div className="flex items-center cursor-pointer">
                                    <img src={avatar} alt="User Avatar" className="h-10 w-10 rounded-full" />
                                    {/* Hiển thị tên nhân viên */}
                                    <span className="ml-2">{user?.full_Name}</span>
                                </div>
                            </Dropdown>
                        )}
                    </div>

                    {/* Nút Menu cho Mobile */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-teal-600 focus:outline-none"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Menu cho Mobile (hiện ra khi nhấn nút) */}
            {isMenuOpen && (
                <div className="md:hidden bg-teal-600"> {/* Màu nền menu mobile */}
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            to="/showtimes"
                            className="block px-3 py-2 rounded-md hover:bg-teal-500"
                            onClick={() => setIsMenuOpen(false)} // Đóng menu khi nhấn link
                        >
                            Lịch Chiếu / Đặt Vé
                        </Link>
                         <Link
                            to="/manage-bookings"
                            className="block px-3 py-2 rounded-md hover:bg-teal-500"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Quản Lý Đặt Vé
                        </Link>
                         <Link
                            to="/movies"
                            className="block px-3 py-2 rounded-md hover:bg-teal-500"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Danh Sách Phim
                        </Link>
                        {/* Thêm các link khác cho mobile nếu cần */}

                        {/* Thông tin user và dropdown/logout cho mobile */}
                        {isAuthenticated && user && (
                            <div className="pt-4 pb-3 border-t border-teal-700">
                                 {/* Có thể dùng Dropdown như desktop hoặc liệt kê thẳng các mục */}
                                <Dropdown overlay={staffMenu} trigger={['click']} placement="bottomRight">
                                     <div className="flex items-center px-3 cursor-pointer">
                                        <img src={avatar} alt="User Avatar" className="h-10 w-10 rounded-full" />
                                        <span className="ml-3 text-base font-medium">{user?.full_Name}</span>
                                     </div>
                                </Dropdown>
                                {/* Hoặc hiển thị trực tiếp các link từ staffMenu cho đơn giản trên mobile */}
                                {/* <div className="mt-3 px-2 space-y-1">
                                    <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-teal-500" onClick={() => setIsMenuOpen(false)}>Thông Tin Cá Nhân</Link>
                                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-teal-500 hover:text-red-100">Đăng xuất</button>
                                 </div> */}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavbarLoginStaff;