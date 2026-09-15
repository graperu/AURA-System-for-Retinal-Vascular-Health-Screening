import React from 'react';
import { Eye } from 'lucide-react';

export type EyePosition = 'OD' | 'OS' | 'OU' | 'BOTH' | string;

export interface EyeBadgeProps {
  position?: EyePosition;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  showDot?: boolean;
  compact?: boolean;
  className?: string;
}

export const EyeBadge: React.FC<EyeBadgeProps> = ({
  position = '',
  size = 'sm',
  showIcon = true,
  showDot = true,
  compact = false,
  className = '',
}) => {
  const norm = (position || '').toUpperCase();
  const isBoth = norm.includes('BOTH') || norm.includes('OU') || norm.includes('2');
  const isOS = !isBoth && (norm.includes('OS') || norm.includes('LEFT') || norm === 'L');
  const isOD = !isBoth && (norm.includes('OD') || norm.includes('RIGHT') || norm === 'R');

  let label = 'Chưa xác định';
  let colorClasses = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let iconColor = 'text-slate-500';

  if (isBoth) {
    label = compact ? 'OU' : 'Cả hai mắt (OU)';
    colorClasses = 'bg-indigo-50/90 text-indigo-800 border-indigo-200/90';
    dotColor = 'bg-indigo-500';
    iconColor = 'text-indigo-600';
  } else if (isOS) {
    label = compact ? 'OS' : 'Mắt Trái (OS)';
    colorClasses = 'bg-teal-50/90 text-teal-800 border-teal-200/90';
    dotColor = 'bg-teal-500';
    iconColor = 'text-teal-600';
  } else if (isOD) {
    label = compact ? 'OD' : 'Mắt Phải (OD)';
    colorClasses = 'bg-sky-50/90 text-sky-800 border-sky-200/90';
    dotColor = 'bg-sky-500';
    iconColor = 'text-sky-600';
  }

  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs gap-1.5 rounded-lg'
      : 'px-2.5 py-0.5 text-[11px] gap-1.5 rounded-md';

  const iconSizes = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const dotSizes = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <span
      className={`inline-flex items-center font-sans font-semibold border select-none transition-colors ${colorClasses} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`rounded-full shrink-0 ${dotSizes} ${dotColor}`} />}
      {showIcon && <Eye className={`shrink-0 ${iconSizes} ${iconColor}`} />}
      <span className="leading-tight">{label}</span>
    </span>
  );
};
