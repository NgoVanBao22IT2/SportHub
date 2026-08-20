import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination component
 * @param {number} currentPage - 1-based current page
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes: (pageNumber) => void
 * @param {number} totalItems - Total items count (optional)
 * @param {number} itemsPerPage - Items per page count (optional)
 * @param {string} className - Optional container styling
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = ''
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers with ellipsis (e.g. 1 ... 4 5 6 ... 20)
  const getPageNumbers = () => {
    const delta = 2; // Range of pages around current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handlePageClick = (page) => {
    if (page === '...' || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 border-t border-border-subtle-medium ${className}`}>
      {/* Information text */}
      {totalItems !== undefined && (
        <p className="text-xs sm:text-sm text-text-muted">
          Hiển thị <span className="font-semibold text-gray-900">{startItem}</span> - <span className="font-semibold text-gray-900">{endItem}</span> trên tổng số <span className="font-semibold text-gray-900">{totalItems}</span> sân
        </p>
      )}

      {/* Pagination buttons */}
      <div className="flex items-center gap-1.5 select-none">
        {/* First Page */}
        <button
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          aria-label="Trang đầu"
          className="p-2 rounded-lg border border-border-subtle-medium bg-surface text-text-muted hover:bg-surface-subtle hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
          className="p-2 rounded-lg border border-border-subtle-medium bg-surface text-text-muted hover:bg-surface-subtle hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-text-muted font-medium">
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                onClick={() => handlePageClick(page)}
                aria-label={`Trang ${page}`}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'min-w-[36px] h-9 px-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center',
                  isActive
                    ? 'bg-accent-primary text-white shadow-sm shadow-accent-primary/30 font-bold'
                    : 'bg-surface border border-border-subtle-medium text-gray-700 hover:bg-surface-subtle hover:text-gray-900'
                ].join(' ')}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
          className="p-2 rounded-lg border border-border-subtle-medium bg-surface text-text-muted hover:bg-surface-subtle hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Trang cuối"
          className="p-2 rounded-lg border border-border-subtle-medium bg-surface text-text-muted hover:bg-surface-subtle hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
