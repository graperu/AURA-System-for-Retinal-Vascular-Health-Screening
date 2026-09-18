import React from 'react';

export type SkeletonVariant = 'kpi' | 'table' | 'card' | 'chart' | 'text' | 'profile';

export interface SkeletonLoadingProps {
  variant?: SkeletonVariant;
  count?: number;
  rows?: number;
  columns?: number;
  className?: string;
  height?: string | number;
}

export const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  variant = 'card',
  count = 1,
  rows = 5,
  columns = 4,
  className = '',
  height,
}) => {
  const shimmerBase =
    'relative overflow-hidden bg-[#F2F4F7] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

  // KPI Skeleton: Icon box + stat lines
  if (variant === 'kpi') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[#EAECF0] bg-white p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${shimmerBase}`} />
              <div className={`h-4 w-24 rounded-md ${shimmerBase}`} />
            </div>
            <div className={`h-8 w-28 rounded-lg ${shimmerBase}`} />
            <div className="flex items-center justify-between pt-1">
              <div className={`h-5 w-16 rounded-full ${shimmerBase}`} />
              <div className={`h-4 w-12 rounded-md ${shimmerBase}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table Skeleton
  if (variant === 'table') {
    return (
      <div className={`rounded-2xl border border-[#EAECF0] bg-white overflow-hidden ${className}`}>
        {/* Table Header */}
        <div className="bg-[#F8F9FA] border-b border-[#EAECF0] px-6 py-3.5 flex items-center justify-between gap-4">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 rounded-md ${shimmerBase} flex-1 max-w-[140px]`}
            />
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#EAECF0]">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <div
              key={rIdx}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              {Array.from({ length: columns }).map((_, cIdx) => (
                <div
                  key={cIdx}
                  className={`h-4 rounded-md ${shimmerBase} flex-1 ${
                    cIdx === 0 ? 'max-w-[180px]' : 'max-w-[120px]'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Chart Skeleton
  if (variant === 'chart') {
    return (
      <div
        className={`rounded-2xl border border-[#EAECF0] bg-white p-6 space-y-6 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className={`h-5 w-36 rounded-md ${shimmerBase}`} />
          <div className={`h-7 w-20 rounded-lg ${shimmerBase}`} />
        </div>
        <div className="h-56 flex items-end justify-between gap-3 pt-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-full rounded-t-lg ${shimmerBase}`}
              style={{ height: `${25 + ((idx * 19) % 70)}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Profile Skeleton
  if (variant === 'profile') {
    return (
      <div className={`rounded-2xl border border-[#EAECF0] bg-white p-6 space-y-6 ${className}`}>
        <div className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-2xl ${shimmerBase}`} />
          <div className="space-y-2 flex-1">
            <div className={`h-5 w-40 rounded-md ${shimmerBase}`} />
            <div className={`h-4 w-28 rounded-md ${shimmerBase}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className={`h-3.5 w-20 rounded-md ${shimmerBase}`} />
              <div className={`h-4 w-32 rounded-md ${shimmerBase}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Text Skeleton
  if (variant === 'text') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className={`h-4 rounded-md ${shimmerBase} ${
              idx === count - 1 && count > 1 ? 'w-3/4' : 'w-full'
            }`}
            style={height ? { height } : undefined}
          />
        ))}
      </div>
    );
  }

  // Default: Card Skeleton
  return (
    <div
      className={`rounded-2xl border border-[#EAECF0] bg-white p-5 sm:p-6 space-y-4 ${className}`}
      style={height ? { height } : undefined}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#EAECF0]">
        <div className={`h-5 w-32 rounded-md ${shimmerBase}`} />
        <div className={`h-7 w-16 rounded-lg ${shimmerBase}`} />
      </div>
      <div className="space-y-3 pt-2">
        <div className={`h-4 w-full rounded-md ${shimmerBase}`} />
        <div className={`h-4 w-5/6 rounded-md ${shimmerBase}`} />
        <div className={`h-4 w-2/3 rounded-md ${shimmerBase}`} />
      </div>
    </div>
  );
};
