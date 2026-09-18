import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryLabel,
  className = '',
}) => {
  const { isVi } = useLanguage();

  const defaultTitle = isVi ? 'Không thể tải dữ liệu' : 'Unable to load data';
  const defaultMessage = isVi
    ? 'Đã xảy ra sự cố khi tải thông tin lâm sàng. Vui lòng kiểm tra lại kết nối và thử lại.'
    : 'An error occurred while loading clinical information. Please check your connection and retry.';
  const defaultRetry = isVi ? 'Thử lại' : 'Retry';

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-[#FEE4E2] bg-[#FEF3F2]/30 ${className}`}
    >
      {/* Icon Container */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF3F2] text-[#EF4444] border border-[#FEE4E2] mb-4">
        <AlertCircle className="h-7 w-7" />
      </div>

      {/* Title & Message */}
      <h4 className="text-base font-bold text-[#111827] tracking-tight">
        {title || defaultTitle}
      </h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#667085] leading-relaxed">
        {message || defaultMessage}
      </p>

      {/* Retry Action */}
      {onRetry && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#D0D5DD] px-4 py-2.5 text-xs font-semibold text-[#111827] shadow-xs transition-all duration-150 hover:bg-[#F8F9FA] hover:border-[#98A2B3]"
          >
            <RotateCw className="h-4 w-4 text-[#667085]" />
            <span>{retryLabel || defaultRetry}</span>
          </button>
        </div>
      )}
    </div>
  );
};
