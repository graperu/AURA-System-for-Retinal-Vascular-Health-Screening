import React, { useState, useMemo, useEffect } from 'react';
import { Pagination, PaginationProps } from './Pagination';

export interface Column<T> {
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTablePaginationConfig {
  pageSize?: number;
  pageSizeOptions?: number[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showSizeChanger?: boolean;
  showTotal?: boolean;
  itemLabel?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: boolean | DataTablePaginationConfig;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  loading = false,
  onRowClick,
  pagination = false,
  className = '',
}: DataTableProps<T>) {
  const paginationConfig: DataTablePaginationConfig | null = useMemo(() => {
    if (!pagination) return null;
    if (typeof pagination === 'object') return pagination;
    return {};
  }, [pagination]);

  const isPageControlled =
    paginationConfig?.currentPage !== undefined &&
    typeof paginationConfig.onPageChange === 'function';

  const isPageSizeControlled =
    paginationConfig?.pageSize !== undefined &&
    typeof paginationConfig.onPageSizeChange === 'function';

  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(
    paginationConfig?.pageSize || 10
  );

  const currentPage = isPageControlled ? paginationConfig!.currentPage! : internalPage;
  const pageSize = isPageSizeControlled ? paginationConfig!.pageSize! : internalPageSize;

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  // Reset về trang 1 hoặc clamp trang hợp lệ khi data thay đổi kích thước
  useEffect(() => {
    if (!isPageControlled && internalPage > totalPages) {
      setInternalPage(Math.max(1, totalPages));
    }
  }, [data.length, totalPages, isPageControlled, internalPage]);

  const handlePageChange = (page: number) => {
    if (isPageControlled) {
      paginationConfig?.onPageChange?.(page);
    } else {
      setInternalPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isPageSizeControlled) {
      paginationConfig?.onPageSizeChange?.(newSize);
    } else {
      setInternalPageSize(newSize);
    }
    if (isPageControlled) {
      paginationConfig?.onPageChange?.(1);
    } else {
      setInternalPage(1);
    }
  };

  const displayedData = useMemo(() => {
    if (!paginationConfig) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, paginationConfig, currentPage, pageSize]);

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-clinical-border bg-clinical-surface shadow-medical-card ${className}`}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-clinical-surface-subtle border-b border-clinical-border text-clinical-text-secondary font-bold">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 whitespace-nowrap ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-clinical-text-muted">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : displayedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-clinical-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayedData.map((row, rIdx) => (
                <tr
                  key={keyExtractor(row, rIdx)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors duration-150 ease-out ${
                    onRowClick ? 'cursor-pointer hover:bg-brand-50/60 active:bg-brand-100/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-3.5 px-4 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                        ? (row[col.accessor] as any)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tích hợp Pagination Footer */}
      {paginationConfig && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={data.length}
          pageSize={pageSize}
          pageSizeOptions={paginationConfig.pageSizeOptions || [5, 10, 20, 50]}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showSizeChanger={paginationConfig.showSizeChanger ?? true}
          showTotal={paginationConfig.showTotal ?? true}
          itemLabel={paginationConfig.itemLabel}
        />
      )}
    </div>
  );
}

