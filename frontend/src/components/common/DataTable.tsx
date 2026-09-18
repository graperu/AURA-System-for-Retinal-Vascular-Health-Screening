import React from 'react';
import { SkeletonLoading } from './SkeletonLoading';
import { EmptyState } from './EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import { tableRowHoverPhysics, tableRowTapPhysics } from '../../utils/motion';
import { useAuraReducedMotion } from '../../hooks/useAuraReducedMotion';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle,
  emptyMessage,
  keyExtractor,
  onRowClick,
  className = '',
}: DataTableProps<T>): React.ReactElement {
  const { isVi } = useLanguage();
  const prefersReducedMotion = useAuraReducedMotion();

  if (loading) {
    return (
      <SkeletonLoading
        variant="table"
        rows={5}
        columns={columns.length}
        className={className}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`rounded-2xl border border-[#EAECF0] bg-white overflow-hidden ${className}`}>
        <EmptyState
          title={emptyTitle || (isVi ? 'Không có bản ghi nào' : 'No records found')}
          message={emptyMessage || (isVi ? 'Chưa có dữ liệu nào phù hợp với bộ lọc hiện tại.' : 'No data matches the current filter criteria.')}
          className="border-none"
        />
      </div>
    );
  }

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[#EAECF0] bg-white shadow-xs overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          {/* Header Row */}
          <thead>
            <tr className="border-b border-[#EAECF0] bg-[#F8F9FA]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-5 sm:px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#667085] ${getAlignClass(
                    col.align
                  )} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody className="divide-y divide-[#EAECF0] bg-white">
            {data.map((item, index) => {
              const key = keyExtractor(item, index);
              const isClickable = Boolean(onRowClick);

              return (
                <motion.tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  whileHover={isClickable && !prefersReducedMotion ? tableRowHoverPhysics : undefined}
                  whileTap={isClickable && !prefersReducedMotion ? tableRowTapPhysics : undefined}
                  className={`transition-colors duration-150 ${
                    isClickable
                      ? 'cursor-pointer hover:bg-[#F9FAFB]'
                      : 'hover:bg-[#F9FAFB]/60'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={`${key}-${col.key}`}
                      className={`px-5 sm:px-6 py-4 text-xs text-[#111827] ${getAlignClass(
                        col.align
                      )} ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item, index)
                        : (item as any)[col.key]}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
