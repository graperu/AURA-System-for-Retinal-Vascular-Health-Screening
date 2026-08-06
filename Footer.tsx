import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 px-gutter flex flex-col md:flex-row justify-between items-center bg-surface-container-lowest border-t border-outline-variant mt-auto">
      <p className="text-body-md text-on-surface-variant text-center md:text-left mb-4 md:mb-0">
        © 2026 Hệ thống Hỗ trợ Quyết định Lâm sàng AURA. Đạt chuẩn HIPAA & ISO 27001.
      </p>
      <div className="flex items-center gap-6">
        <a href="#" className="text-label-md text-on-surface-variant hover:text-primary underline transition-colors">
          Chính sách Bảo mật
        </a>
        <a href="#" className="text-label-md text-on-surface-variant hover:text-primary underline transition-colors">
          Điều khoản Sử dụng
        </a>
        <a href="#" className="text-label-md text-on-surface-variant hover:text-primary underline transition-colors">
          Trung tâm Hỗ trợ
        </a>
      </div>
    </footer>
  );
};
