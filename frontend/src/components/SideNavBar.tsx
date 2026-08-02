import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SideNavBarProps {
  currentRole?: string;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ currentRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;

  const role = user?.role || 'DOCTOR';

  let roleTitle = currentRole;
  if (!roleTitle) {
    if (role === 'PATIENT' || role === 'USER') roleTitle = 'Bệnh nhân';
    else if (role === 'DOCTOR') roleTitle = 'Bác sĩ Phân tích';
    else if (role === 'ADMIN') roleTitle = 'Quản trị hệ thống';
    else if (role === 'CLINIC') roleTitle = 'Quản lý phòng khám';
    else roleTitle = 'Người dùng';
  }

  // Define nav items per role
  let navItems = [
    { label: 'Bàn làm việc Bác sĩ', path: '/doctor', icon: 'stethoscope' },
    { label: 'Giao diện Bệnh nhân', path: '/patient', icon: 'person' },
    { label: 'Tổng quan Phòng khám', path: '/clinic', icon: 'domain' },
    { label: 'Quản trị Hệ thống', path: '/admin', icon: 'admin_panel_settings' },
    { label: 'Tải lên Ca khám mới', path: '/upload', icon: 'cloud_upload' },
    { label: 'Nhật ký Kiểm toán', path: '/audit', icon: 'history' },
  ];

  if (role === 'PATIENT' || role === 'USER') {
    navItems = [
      { label: 'Trang chủ Bệnh nhân', path: '/patient', icon: 'dashboard' },
      { label: 'Lịch sử Sàng lọc', path: '/patient/history', icon: 'history' },
      { label: 'Tải ảnh Sàng lọc mới', path: '/upload', icon: 'cloud_upload' },
    ];
  } else if (role === 'DOCTOR') {
    navItems = [
      { label: 'Bàn làm việc Bác sĩ', path: '/doctor', icon: 'stethoscope' },
      { label: 'Tải lên Ca khám mới', path: '/upload', icon: 'cloud_upload' },
      { label: 'Danh sách Bệnh nhân', path: '/patient', icon: 'group' },
    ];
  } else if (role === 'ADMIN') {
    navItems = [
      { label: 'Quản trị Hệ thống', path: '/admin', icon: 'admin_panel_settings' },
      { label: 'Nhật ký Kiểm toán', path: '/audit', icon: 'history' },
      { label: 'Quản lý Phòng khám', path: '/clinic', icon: 'domain' },
    ];
  } else if (role === 'CLINIC') {
    navItems = [
      { label: 'Tổng quan Phòng khám', path: '/clinic', icon: 'domain' },
      { label: 'Bàn làm việc Bác sĩ', path: '/doctor', icon: 'stethoscope' },
      { label: 'Tải lên Ca khám mới', path: '/upload', icon: 'cloud_upload' },
    ];
  }

  const handleLogout = async () => {
    await auth.logout();
    navigate('/login');
  };

  return (
    <nav className="hidden md:flex flex-col h-screen w-sidebar-width py-margin-page px-4 border-r border-outline-variant bg-surface-container-low fixed left-0 top-0 z-40">
      <div className="mb-6 px-2 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
          <span className="material-symbols-outlined filled text-xl">visibility</span>
        </div>
        <div className="overflow-hidden">
          <h1 className="text-headline-sm font-black text-primary leading-tight truncate">AURA Clinical</h1>
          <p className="text-[11px] text-on-surface-variant truncate">Sức khỏe Võng mạc</p>
        </div>
      </div>

      <Link
        to="/upload"
        className="w-full mb-5 bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 font-semibold text-label-md transition-colors shadow-sm"
      >
        <span className="material-symbols-outlined text-base">add</span>
        Tải Ca Tầm Soát Mới
      </Link>

      <ul className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-md transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-3 border-t border-outline-variant flex items-center justify-between px-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AU'}
          </div>
          <div className="overflow-hidden">
            <p className="text-label-md font-semibold text-on-surface truncate">
              {user?.fullName || 'Người dùng AURA'}
            </p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">
              {roleTitle}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="text-on-surface-variant hover:text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>
      </div>
    </nav>
  );
};
