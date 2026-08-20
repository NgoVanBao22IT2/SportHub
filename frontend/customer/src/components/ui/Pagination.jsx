import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination UI Component
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
  className = ''
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // Number of pages around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page >= 1 && page <= totalPages && page !== currentPage) {
      if (onPageChange) {
        onPageChange(page);
      }
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
      {/* Items Count Summary */}
      {totalItems > 0 && (
        <div className="text-xs sm:text-sm text-gray-500 font-medium">
          Hiển thị{' '}
          <span className="font-semibold text-gray-800">
            {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
          </span>{' '}
          -{' '}
          <span className="font-semibold text-gray-800">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{' '}
          trên tổng số <span className="font-semibold text-gray-800">{totalItems}</span> kết quả
        </div>
      )}

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1.5 select-none">
        {/* First Page */}
        <button
          type="button"
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          aria-label="Trang đầu tiên"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 font-medium text-xs"
                >
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageClick(p)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang tiếp theo"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Trang cuối cùng"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-xs"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
