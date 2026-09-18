import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  variant,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const { isVi } = useLanguage();

  const normalizedStatus = String(status || '').toLowerCase().trim();

  // Automatic variant inference if not explicitly provided
  const resolvedVariant: StatusVariant = (() => {
    if (variant) return variant;

    switch (normalizedStatus) {
      // Success cases
      case 'booked':
      case 'completed':
      case 'approved':
      case 'normal':
      case 'low':
      case 'low risk':
      case 'active':
      case 'reviewed':
      case 'success':
      case 'đã duyệt':
      case 'hoàn thành':
      case 'bình thường':
        return 'success';

      // Warning cases
      case 'pending':
      case 'in_review':
      case 'in review':
      case 'moderate':
      case 'borderline':
      case 'processing':
      case 'draft':
      case 'đang chờ':
      case 'chờ duyệt':
      case 'trung bình':
        return 'warning';

      // Danger cases
      case 'canceled':
      case 'cancelled':
      case 'rejected':
      case 'high':
      case 'high risk':
      case 'critical':
      case 'danger':
      case 'failed':
      case 'hủy':
      case 'từ chối':
      case 'nguy cơ cao':
      case 'nguy kịch':
        return 'danger';

      // Info cases
      case 'info':
      case 'scheduled':
      case 'analyzing':
      case 'đã lên lịch':
        return 'info';

      default:
        return 'neutral';
    }
  })();

  const variantClasses: Record<StatusVariant, { badge: string; dot: string }> = {
    success: {
      badge: 'bg-[#ECFDF3] text-[#22C55E] border-[#D1FADF]',
      dot: 'bg-[#22C55E]',
    },
    warning: {
      badge: 'bg-[#FFFAEB] text-[#F59E0B] border-[#FEF0C7]',
      dot: 'bg-[#F59E0B]',
    },
    danger: {
      badge: 'bg-[#FEF3F2] text-[#EF4444] border-[#FEE4E2]',
      dot: 'bg-[#EF4444]',
    },
    info: {
      badge: 'bg-[#EEF5FF] text-[#0EA5E9] border-[#E0EAFF]',
      dot: 'bg-[#0EA5E9]',
    },
    neutral: {
      badge: 'bg-[#F8F9FA] text-[#667085] border-[#EAECF0]',
      dot: 'bg-[#98A2B3]',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  // Human-friendly text fallback
  const displayLabel = label || (() => {
    switch (normalizedStatus) {
      case 'booked': return isVi ? 'Đã đặt hẹn' : 'Booked';
      case 'canceled':
      case 'cancelled': return isVi ? 'Đã hủy' : 'Canceled';
      case 'completed': return isVi ? 'Hoàn thành' : 'Completed';
      case 'pending': return isVi ? 'Đang chờ' : 'Pending';
      case 'in_review': return isVi ? 'Đang xem xét' : 'In Review';
      case 'reviewed': return isVi ? 'Đã đánh giá' : 'Reviewed';
      case 'normal': return isVi ? 'Bình thường' : 'Normal';
      case 'borderline': return isVi ? 'Ranh giới' : 'Borderline';
      case 'high':
      case 'high risk': return isVi ? 'Nguy cơ cao' : 'High Risk';
      case 'critical': return isVi ? 'Nguy kịch' : 'Critical';
      default: return status;
    }
  })();

  const currentConfig = variantClasses[resolvedVariant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${currentConfig.badge} ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${currentConfig.dot}`}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};
