import React from 'react';
import { Calendar, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type TimeRange = 'day' | 'week' | 'month' | 'year';

export interface FilterBarProps {
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  dateRangeLabel?: string;
  onDateRangeClick?: () => void;
  onFilterClick?: () => void;
  filterActive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  timeRange = 'week',
  onTimeRangeChange,
  dateRangeLabel,
  onDateRangeClick,
  onFilterClick,
  filterActive = false,
  children,
  className = '',
}) => {
  const { isVi } = useLanguage();

  const timeOptions: { key: TimeRange; label: string }[] = [
    { key: 'day', label: isVi ? 'Ngày' : 'Day' },
    { key: 'week', label: isVi ? 'Tuần' : 'Week' },
    { key: 'month', label: isVi ? 'Tháng' : 'Month' },
    { key: 'year', label: isVi ? 'Năm' : 'Year' },
  ];

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 py-1 ${className}`}
    >
      {/* Left: Time Range Pills Toggle */}
      {onTimeRangeChange && (
        <div className="flex items-center rounded-xl bg-[#F2F4F7] p-1 border border-[#EAECF0]">
          {timeOptions.map((option) => {
            const isActive = timeRange === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onTimeRangeChange(option.key)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#3478F6] text-white shadow-xs'
                    : 'text-[#667085] hover:text-[#111827]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Right Actions: Date Range & Filter Button */}
      <div className="flex flex-wrap items-center gap-2.5 ml-auto">
        {dateRangeLabel && (
          <button
            type="button"
            onClick={onDateRangeClick}
            className="inline-flex items-center gap-2 rounded-xl border border-[#EAECF0] bg-white px-3.5 py-2 text-xs font-medium text-[#111827] hover:bg-[#F8F9FA] hover:border-[#D0D5DD] transition-colors shadow-xs"
          >
            <Calendar className="h-4 w-4 text-[#667085]" />
            <span>{dateRangeLabel}</span>
          </button>
        )}

        {onFilterClick && (
          <button
            type="button"
            onClick={onFilterClick}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors shadow-xs ${
              filterActive
                ? 'border-[#3478F6] bg-[#EEF5FF] text-[#3478F6]'
                : 'border-[#EAECF0] bg-white text-[#111827] hover:bg-[#F8F9FA]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 text-[#667085]" />
            <span>{isVi ? 'Bộ lọc' : 'Filter'}</span>
            {filterActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#3478F6]" />
            )}
          </button>
        )}

        {children}
      </div>
    </div>
  );
};
