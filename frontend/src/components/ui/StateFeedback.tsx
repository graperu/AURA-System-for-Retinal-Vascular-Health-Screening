import React from 'react';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-10 h-10 text-slate-400" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-clinical-border ${className}`}>
      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-clinical-text mb-1">{title}</h4>
      <p className="text-sm text-clinical-text-muted max-w-md mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  className = '',
}) => {
  const { t, isVi } = useLanguage();
  const displayMessage = message !== undefined ? message : t('common.loading', isVi ? 'Đang tải dữ liệu lâm sàng...' : 'Loading clinical data...');

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-clinical-text-secondary">{displayMessage}</p>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = '',
}) => {
  const { t, isVi } = useLanguage();
  const displayTitle = title !== undefined ? title : (isVi ? 'Đã xảy ra lỗi' : 'An error occurred');

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-2xl border border-red-200 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-3 text-red-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-red-950 mb-1">{displayTitle}</h4>
      <p className="text-sm text-red-700 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          {t('common.retry', isVi ? 'Thử lại' : 'Retry')}
        </Button>
      )}
    </div>
  );
};

/* Unified Skeletons */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`} />
);

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2 pt-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5 w-full" />
      ))}
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 5,
  className = '',
}) => (
  <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
    <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-8 w-32 rounded-xl" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton
              key={cIdx}
              className={`h-4 ${cIdx === 0 ? 'w-28' : cIdx === 1 ? 'w-36' : 'w-20'}`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonProfile: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 p-6 space-y-6 ${className}`} aria-label="Hồ Sơ Y Tế">
    <div className="flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3.5 w-64" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </div>
  </div>
);

