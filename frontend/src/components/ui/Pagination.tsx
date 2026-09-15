import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showSizeChanger?: boolean;
  showTotal?: boolean;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
  showSizeChanger = true,
  showTotal = true,
  itemLabel,
  className = '',
}) => {
  const { isVi } = useLanguage();

  // Đảm bảo currentPage hợp lệ trong khoảng [1, totalPages]
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Tính toán khoảng bản ghi đang hiển thị
  const startItem = totalItems !== undefined && totalItems > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems !== undefined ? Math.min(safeCurrentPage * pageSize, totalItems) : 0;

  // Thuật toán sinh dãy số trang kèm dấu ba chấm '...'
  const pageNumbers = useMemo<(number | '...')[]>(() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 3) {
      return [
        1,
        '...',
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      safeTotalPages,
    ];
  }, [safeCurrentPage, safeTotalPages]);

  if (safeTotalPages <= 1 && (!totalItems || totalItems <= pageSize) && !showTotal) {
    return null;
  }

  const defaultItemLabel = isVi ? 'bản ghi' : 'entries';
  const label = itemLabel || defaultItemLabel;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 border-t border-slate-200/80 bg-white/60 select-none text-xs ${className}`}
    >
      {/* Thông tin số lượng hiển thị */}
      {showTotal && (
        <div className="text-slate-500 font-sans">
          {totalItems !== undefined ? (
            isVi ? (
              <span>
                Hiển thị <strong className="text-slate-800 font-mono-data">{startItem}</strong> -{' '}
                <strong className="text-slate-800 font-mono-data">{endItem}</strong> trên tổng số{' '}
                <strong className="text-slate-800 font-mono-data">{totalItems}</strong> {label}
              </span>
            ) : (
              <span>
                Showing <strong className="text-slate-800 font-mono-data">{startItem}</strong> to{' '}
                <strong className="text-slate-800 font-mono-data">{endItem}</strong> of{' '}
                <strong className="text-slate-800 font-mono-data">{totalItems}</strong> {label}
              </span>
            )
          ) : (
            isVi ? (
              <span>
                Trang <strong className="text-slate-800 font-mono-data">{safeCurrentPage}</strong> /{' '}
                <strong className="text-slate-800 font-mono-data">{safeTotalPages}</strong>
              </span>
            ) : (
              <span>
                Page <strong className="text-slate-800 font-mono-data">{safeCurrentPage}</strong> of{' '}
                <strong className="text-slate-800 font-mono-data">{safeTotalPages}</strong>
              </span>
            )
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Bộ chọn số dòng trên mỗi trang */}
        {showSizeChanger && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>{isVi ? 'Số dòng:' : 'Rows:'}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
              aria-label={isVi ? 'Số dòng trên mỗi trang' : 'Rows per page'}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-700 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / {isVi ? 'trang' : 'page'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Thanh chuyển trang: <- 1 2 ... 9 -> */}
        <nav
          className="inline-flex items-center gap-1 rounded-xl bg-slate-50 p-1 border border-slate-200 shadow-2xs"
          aria-label={isVi ? 'Phân trang' : 'Pagination'}
        >
          {/* Nút lùi (Previous) */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            aria-label={isVi ? 'Trang trước' : 'Previous page'}
            title={isVi ? 'Trang trước' : 'Previous page'}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-teal-700 hover:shadow-2xs transition-all disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dãy số trang */}
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-8 w-6 flex items-center justify-center text-slate-400 font-bold"
                >
                  …
                </span>
              );
            }

            const isActive = page === safeCurrentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={isVi ? `Trang ${page}` : `Page ${page}`}
                className={`h-8 min-w-[32px] px-2 rounded-lg font-mono-data text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-teal-700 hover:shadow-2xs'
                }`}
              >
                {page}
              </button>
            );
          })}

          {/* Nút tiến (Next) */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= safeTotalPages}
            aria-label={isVi ? 'Trang sau' : 'Next page'}
            title={isVi ? 'Trang sau' : 'Next page'}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-teal-700 hover:shadow-2xs transition-all disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </div>
  );
};
