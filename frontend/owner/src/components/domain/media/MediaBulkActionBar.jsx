import React, { useState } from 'react';
import { Trash2, FolderEdit, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import Button from '../../ui/Button';

const CATEGORY_OPTIONS = [
  { id: 'VENUE', label: 'Ảnh sân' },
  { id: 'FACILITY', label: 'Ảnh tiện ích' },
  { id: 'EVENT', label: 'Ảnh sự kiện' },
  { id: 'PROMOTION', label: 'Ảnh khuyến mãi' },
  { id: 'TOURNAMENT', label: 'Ảnh giải đấu' },
  { id: 'COURSE', label: 'Ảnh khóa học' },
  { id: 'OTHER', label: 'Khác' }
];

export default function MediaBulkActionBar({
  selectedCount = 0,
  onClearSelection,
  onBulkDelete,
  onBulkUpdateCategory,
  onBulkUpdateStatus,
  loading = false
}) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom duration-200">
      <div className="bg-gray-900 text-white rounded-2xl p-3 px-4 shadow-2xl border border-gray-800 flex items-center justify-between gap-3 backdrop-blur-md">
        {/* Count Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-accent-primary text-white text-xs font-bold flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold">Đã chọn {selectedCount} ảnh</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 relative">
          {/* Change Category Dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<FolderEdit size={14} />}
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowStatusDropdown(false);
              }}
              className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
            >
              Đổi danh mục
            </Button>

            {showCategoryDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                <div className="absolute bottom-full mb-2 right-0 w-44 bg-surface text-gray-900 border border-border-subtle rounded-xl shadow-xl z-20 py-1 text-xs">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setShowCategoryDropdown(false);
                        onBulkUpdateCategory && onBulkUpdateCategory(cat.id);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-surface-subtle transition"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Change Status Dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              size="xs"
              leftIcon={<CheckCircle2 size={14} />}
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowCategoryDropdown(false);
              }}
              className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
            >
              Đổi trạng thái
            </Button>

            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute bottom-full mb-2 right-0 w-44 bg-surface text-gray-900 border border-border-subtle rounded-xl shadow-xl z-20 py-1 text-xs">
                  <button
                    onClick={() => {
                      setShowStatusDropdown(false);
                      onBulkUpdateStatus && onBulkUpdateStatus('PUBLISHED');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-subtle font-medium text-emerald-600"
                  >
                    Công khai
                  </button>
                  <button
                    onClick={() => {
                      setShowStatusDropdown(false);
                      onBulkUpdateStatus && onBulkUpdateStatus('DRAFT');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-subtle font-medium text-amber-600"
                  >
                    Lưu nháp
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete Selected */}
          <Button
            variant="danger"
            size="xs"
            leftIcon={<Trash2 size={14} />}
            onClick={onBulkDelete}
            disabled={loading}
          >
            Xóa ({selectedCount})
          </Button>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition ml-1"
            title="Bỏ chọn"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
