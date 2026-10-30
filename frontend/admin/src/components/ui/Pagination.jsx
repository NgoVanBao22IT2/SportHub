import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Standard Unified Pagination Component - Admin Portal
 * Format:
 * [Left: Trang X / Y (Tổng Z mục)] --- [Right: (Trang trước) (1) (2) (3) ... (Trang sau)]
 */
export default function Pagination({
  currentPage = 1,
  page,
  totalPages = 1,
  totalItems = null,
  total,
  itemLabel = 'mục',
  onPageChange,
  className = ''
}) {
  const activePage = Math.max(1, page || currentPage || 1);
  const totalPageCount = Math.max(1, totalPages || 1);
  const totalCount = totalItems !== null && totalItems !== undefined ? totalItems : total;

  if (totalPageCount <= 1 && (totalCount === null || totalCount === undefined || totalCount === 0)) {
    return null;
  }

  const getPageNumbers = () => {
    if (totalPageCount <= 7) {
      return Array.from({ length: totalPageCount }, (_, i) => i + 1);
    }
    if (activePage <= 3) {
      return [1, 2, 3, 4, '...', totalPageCount];
    }
    if (activePage >= totalPageCount - 2) {
      return [1, '...', totalPageCount - 3, totalPageCount - 2, totalPageCount - 1, totalPageCount];
    }
    return [1, '...', activePage - 1, activePage, activePage + 1, '...', totalPageCount];
  };

  const pages = getPageNumbers();

  const handlePageClick = (p) => {
    if (typeof p === 'number' && p >= 1 && p <= totalPageCount && p !== activePage) {
      if (onPageChange) {
        onPageChange(p);
      }
    }
  };

  return (
    <div className={`p-4 border-t border-slate-700/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none ${className}`}>
      {/* LEFT: Info summary */}
      <div className="text-xs text-slate-400">
        Trang <span className="font-bold text-white">{activePage}</span> / <span className="font-bold text-white">{totalPageCount}</span>
        {totalCount !== null && totalCount !== undefined && (
          <span className="ml-1 text-slate-400 font-normal">
            (Tổng <span className="font-bold text-indigo-400">{totalCount.toLocaleString('vi-VN')}</span> {itemLabel})
          </span>
        )}
      </div>

      {/* RIGHT: Prev, Numeric Buttons, Next */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        <button
          type="button"
          disabled={activePage <= 1}
          onClick={() => handlePageClick(activePage - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Trang trước</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 font-bold text-xs select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = p === activePage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => handlePageClick(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={activePage >= totalPageCount}
          onClick={() => handlePageClick(activePage + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>Trang sau</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
