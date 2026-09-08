import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type RiskLevelType = 'Low' | 'Moderate' | 'High' | 'Critical' | 'Severe' | 'Normal' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'SEVERE';

export interface RiskBadgeProps {
  level?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level = 'Low',
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  const config = (() => {
    switch (normLevel) {
      case 'NORMAL':
      case 'LOW':
        return {
          label: 'Nguy cơ Thấp',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'MODERATE':
      case 'MEDIUM':
        return {
          label: 'Nguy cơ Trung bình',
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'HIGH':
        return {
          label: 'Nguy cơ Cao',
          classes: 'bg-orange-50 text-orange-800 border-orange-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
        };
      case 'CRITICAL':
      case 'SEVERE':
        return {
          label: 'Nguy cơ Nghiêm trọng',
          classes: 'bg-red-50 text-red-800 border-red-200 font-bold',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
        };
      default:
        return {
          label: level || 'Không xác định',
          classes: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <Info className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  })();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.classes} ${sizeClasses} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
