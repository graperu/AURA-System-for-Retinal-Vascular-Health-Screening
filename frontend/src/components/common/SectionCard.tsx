import React from 'react';

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  headerBorder?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
  noPadding = false,
  headerBorder = true,
}) => {
  return (
    <section
      className={`rounded-2xl border border-[#EAECF0] bg-white transition-all duration-150 shadow-xs ${className}`}
    >
      {/* Card Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 ${
          headerBorder ? 'border-b border-[#EAECF0]' : ''
        }`}
      >
        <div className="min-w-0">
          <h3 className="text-base font-bold text-[#111827] tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#667085] truncate">
              {subtitle}
            </p>
          )}
        </div>

        {headerAction && (
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className={noPadding ? '' : 'p-5 sm:p-6'}>
        {children}
      </div>
    </section>
  );
};
