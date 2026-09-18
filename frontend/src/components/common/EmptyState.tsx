import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  action,
  className = '',
}) => {
  const { isVi } = useLanguage();

  const defaultTitle = isVi ? 'Chưa có dữ liệu' : 'No data available';
  const defaultMessage = isVi
    ? 'Hiện tại chưa có thông tin hoặc bản ghi nào cần hiển thị.'
    : 'There are currently no records or data to display.';

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#EAECF0] bg-white ${className}`}
    >
      {/* Icon Container */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#3478F6] mb-4">
        {icon || <Inbox className="h-7 w-7" />}
      </div>

      {/* Text Info */}
      <h4 className="text-base font-bold text-[#111827] tracking-tight">
        {title || defaultTitle}
      </h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#667085] leading-relaxed">
        {message || defaultMessage}
      </p>

      {/* CTA Button */}
      {action && (
        <div className="mt-5">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3478F6] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#2563EB] active:bg-[#1D4ED8]"
          >
            {action.icon || <Plus className="h-4 w-4" />}
            <span>{action.label}</span>
          </button>
        </div>
      )}
    </div>
  );
};
