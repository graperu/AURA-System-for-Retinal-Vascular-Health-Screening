import React from 'react';
import { Camera, Layers, CircleDot, Target, ScanLine } from 'lucide-react';

export interface ScanTypeBadgeProps {
  scanType?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const ScanTypeBadge: React.FC<ScanTypeBadgeProps> = ({
  scanType = '',
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const norm = (scanType || '').toUpperCase();

  let label = scanType || 'Ảnh đáy mắt';
  let colorClasses = 'bg-slate-100/90 text-slate-700 border-slate-200/90';
  let IconComponent = Camera;

  if (norm.includes('OCT')) {
    label = 'Cắt lớp OCT';
    colorClasses = 'bg-purple-50/90 text-purple-800 border-purple-200/90';
    IconComponent = Layers;
  } else if (norm.includes('MACULA') || norm.includes('HOÀNG ĐIỂM') || norm.includes('HOANG DIEM')) {
    label = 'Fundus Hoàng Điểm';
    colorClasses = 'bg-amber-50/90 text-amber-800 border-amber-200/90';
    IconComponent = Target;
  } else if (norm.includes('OPTIC') || norm.includes('DISC') || norm.includes('ĐĨA THỊ') || norm.includes('DIA THI')) {
    label = 'Fundus Đĩa Thị';
    colorClasses = 'bg-cyan-50/90 text-cyan-800 border-cyan-200/90';
    IconComponent = CircleDot;
  } else if (norm.includes('WIDE') || norm.includes('PANORAMA')) {
    label = 'Fundus Toàn Cảnh';
    colorClasses = 'bg-blue-50/90 text-blue-800 border-blue-200/90';
    IconComponent = ScanLine;
  } else if (norm.includes('FUNDUS') || norm.includes('COLOR')) {
    label = 'Ảnh màu đáy mắt';
    colorClasses = 'bg-slate-100/90 text-slate-700 border-slate-200/90';
    IconComponent = Camera;
  }

  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs gap-1.5 rounded-lg'
      : 'px-2.5 py-0.5 text-[11px] gap-1.5 rounded-md';

  const iconSizes = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center font-sans font-medium border select-none transition-colors ${colorClasses} ${sizeClasses} ${className}`}
    >
      {showIcon && <IconComponent className={`shrink-0 ${iconSizes} opacity-80`} />}
      <span className="leading-tight">{label}</span>
    </span>
  );
};
