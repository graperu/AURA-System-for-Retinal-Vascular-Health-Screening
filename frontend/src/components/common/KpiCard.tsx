import React from 'react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { kpiCardHoverPhysics } from '../../utils/motion';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  unit?: string;
  trend?: string;
  change?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  subtitle?: string;
  detailsLink?: {
    label?: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  unit,
  trend,
  change,
  subtitle,
  detailsLink,
  className = '',
  onClick,
}) => {
  const { isVi } = useLanguage();
  const prefersReducedMotion = useAuraReducedMotion();

  // Resolve trend information
  const trendValue = change?.value ?? trend;
  const isPositive =
    change?.positive !== undefined
      ? change.positive
      : typeof trendValue === 'string'
      ? trendValue.trim().startsWith('+') || !trendValue.trim().startsWith('-')
      : true;

  const defaultDetailsLabel = isVi ? 'Chi tiết' : 'Details';
  const detailsLabel = detailsLink?.label || defaultDetailsLabel;

  return (
    <motion.div
      onClick={onClick}
      whileHover={!prefersReducedMotion ? kpiCardHoverPhysics : undefined}
      className={`relative flex flex-col justify-between rounded-2xl border border-[#EAECF0] bg-white p-5 sm:p-6 transition-colors duration-150 hover:border-[#C7D7FE] hover:shadow-xs ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Top Row: Icon Container + Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-[#3478F6]">
          {icon}
        </div>
        <span className="text-xs sm:text-sm font-medium text-[#667085] truncate">
          {title}
        </span>
      </div>

      {/* Middle Row: Big Metric Value & Unit */}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] font-mono-data">
          {value}
        </span>
        {unit && (
          <span className="text-xs sm:text-sm font-medium text-[#667085]">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom Row: Trend Pill, Subtitle & Details Link */}
      <div className="mt-4 flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          {trendValue !== undefined && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPositive
                  ? 'bg-[#ECFDF3] text-[#22C55E] border border-[#D1FADF]'
                  : 'bg-[#FEF3F2] text-[#EF4444] border border-[#FEE4E2]'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{trendValue}</span>
            </span>
          )}

          {subtitle && (
            <span className="truncate text-xs text-[#98A2B3]">{subtitle}</span>
          )}
        </div>

        {detailsLink && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              detailsLink.onClick?.();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3478F6] hover:text-[#2563EB] transition-colors"
          >
            <span>{detailsLabel}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
