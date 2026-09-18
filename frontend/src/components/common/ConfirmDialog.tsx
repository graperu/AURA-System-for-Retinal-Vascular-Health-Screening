import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const { isVi } = useLanguage();

  if (!isOpen) return null;

  const defaultConfirm = isVi ? 'Xác nhận' : 'Confirm';
  const defaultCancel = isVi ? 'Hủy bỏ' : 'Cancel';

  const iconConfig = {
    primary: {
      icon: <Info className="h-6 w-6 text-[#3478F6]" />,
      container: 'bg-[#EEF5FF] border-[#E0EAFF]',
      btn: 'bg-[#3478F6] hover:bg-[#2563EB] text-white',
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-[#F59E0B]" />,
      container: 'bg-[#FFFAEB] border-[#FEF0C7]',
      btn: 'bg-[#F59E0B] hover:bg-[#D97706] text-white',
    },
    danger: {
      icon: <AlertCircle className="h-6 w-6 text-[#EF4444]" />,
      container: 'bg-[#FEF3F2] border-[#FEE4E2]',
      btn: 'bg-[#EF4444] hover:bg-[#DC2626] text-white',
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Dialog Backdrop click */}
      <div
        className="fixed inset-0"
        onClick={!isLoading ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Close icon button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-xl p-1 text-[#98A2B3] hover:text-[#111827] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3478F6]"
          aria-label={defaultCancel}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconConfig.container}`}
          >
            {iconConfig.icon}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-base font-bold text-[#111827] tracking-tight">
              {title}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#667085] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#EAECF0]">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-[#D0D5DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#111827] shadow-xs transition-colors hover:bg-[#F8F9FA] disabled:opacity-50"
          >
            {cancelLabel || defaultCancel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 ${iconConfig.btn}`}
          >
            {isLoading ? (isVi ? 'Đang xử lý...' : 'Processing...') : (confirmLabel || defaultConfirm)}
          </button>
        </div>
      </div>
    </div>
  );
};
