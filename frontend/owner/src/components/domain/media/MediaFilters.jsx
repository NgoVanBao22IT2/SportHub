import React from 'react';
import { Search, RotateCcw, LayoutGrid, List, Calendar, Filter, ArrowUpDown } from 'lucide-react';
import Button from '../../ui/Button';

export default function MediaFilters({
  searchQuery = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  sortBy = 'created_at',
  onSortByChange,
  sortOrder = 'DESC',
  onSortOrderChange,
  viewMode = 'grid',
  onViewModeChange,
  onResetFilters
}) {
  return (
    <div className="p-4 bg-surface border border-border-subtle rounded-2xl space-y-3 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, tiêu đề, mô tả, tags..."
            aria-label="Tìm kiếm hình ảnh"
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs text-gray-900 placeholder:text-text-muted/60 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-text-muted hover:text-gray-900"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
            aria-label="Lọc theo trạng thái"
            className="px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none transition cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã xuất bản (Published)</option>
            <option value="DRAFT">Bản nháp (Draft)</option>
            <option value="ARCHIVED">Lưu trữ (Archived)</option>
          </select>

          {/* Date From */}
          <div className="flex items-center gap-1 bg-surface border border-border-subtle rounded-xl px-2 py-1 text-xs">
            <Calendar size={14} className="text-text-muted flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange && onDateFromChange(e.target.value)}
              aria-label="Từ ngày"
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1 bg-surface border border-border-subtle rounded-xl px-2 py-1 text-xs">
            <span className="text-text-muted text-[11px]">Đến:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange && onDateToChange(e.target.value)}
              aria-label="Đến ngày"
              className="bg-transparent border-none text-xs text-gray-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [valSort, valOrder] = e.target.value.split('_');
                onSortByChange && onSortByChange(valSort);
                onSortOrderChange && onSortOrderChange(valOrder);
              }}
              aria-label="Sắp xếp danh sách"
              className="px-3 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none transition cursor-pointer"
            >
              <option value="created_at_DESC">Mới nhất</option>
              <option value="created_at_ASC">Cũ nhất</option>
              <option value="title_ASC">Tên A → Z</option>
              <option value="title_DESC">Tên Z → A</option>
              <option value="file_size_DESC">Dung lượng lớn nhất</option>
              <option value="display_order_ASC">Thứ tự hiển thị</option>
            </select>
          </div>

          {/* Reset Filters */}
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<RotateCcw size={14} />}
            onClick={onResetFilters}
            title="Đặt lại bộ lọc"
            className="text-text-muted hover:text-gray-900"
          >
            Đặt lại
          </Button>

          {/* View Mode Toggle (Grid vs List) */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 ml-auto lg:ml-0">
            <button
              onClick={() => onViewModeChange && onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white text-accent-primary shadow-2xs font-bold'
                  : 'text-text-muted hover:text-gray-900'
              }`}
              title="Chế độ Lưới (Grid)"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => onViewModeChange && onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white text-accent-primary shadow-2xs font-bold'
                  : 'text-text-muted hover:text-gray-900'
              }`}
              title="Chế độ Danh sách (List)"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
