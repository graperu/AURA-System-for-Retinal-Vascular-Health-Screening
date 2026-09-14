import React from 'react';

export interface LanguageSwitcherProps {
  className?: string;
  isDarkRoom?: boolean;
  variant?: 'pill' | 'button' | 'compact';
}

/**
 * LanguageSwitcher đã được vô hiệu hóa theo chính sách hệ thống chỉ dùng Tiếng Việt.
 * Trả về null để tránh gây lỗi ở bất kỳ nơi nào còn tham chiếu hoặc import cũ.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = () => {
  return null;
};
