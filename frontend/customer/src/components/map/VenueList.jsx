import React from 'react';
import { Loader2, MapPinOff, AlertTriangle, RotateCcw } from 'lucide-react';
import VenueListItem from './VenueListItem';

/**
 * VenueList Component (Phase 6 Polish)
 * Displays the scrollable list of venues currently in the map viewport with rich states.
 */
export default function VenueList({
  venues = [],
  selectedVenueId = null,
  onSelectVenue,
  loading = false,
  error = null,
  onRetry,
  onResetFilters,
  className = ''
}) {
  return (
    <div
      role="region"
      aria-label="Danh sách sân thể thao trong khung nhìn"
      className={`flex flex-col h-full bg-white border-r border-gray-200/90 shadow-sm ${className}`}
    >
      {/* List Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900 text-sm md:text-base">
            Sân trong khu vực
          </h2>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200/60">
            {venues.length}
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin text-emerald-600" />
            <span>Đang cập nhật...</span>
          </div>
        )}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Error State */}
        {error ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">
              Không thể tải danh sách sân
            </h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-4">
              Vui lòng kiểm tra kết nối mạng hoặc thử lại.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <RotateCcw size={13} />
                <span>Thử lại</span>
              </button>
            )}
          </div>
        ) : venues.length > 0 ? (
          <div role="list" className="space-y-2.5">
            {venues.map((venue) => {
              const venueKey = venue.branch_id || venue.venue_id || venue.id;
              const isSelected = selectedVenueId && (
                venue.branch_id === selectedVenueId ||
                venue.venue_id === selectedVenueId ||
                venue.id === selectedVenueId
              );

              return (
                <div key={venueKey} role="listitem">
                  <VenueListItem
                    venue={venue}
                    isSelected={Boolean(isSelected)}
                    onSelectVenue={onSelectVenue}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <MapPinOff size={24} />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">
              Không tìm thấy sân phù hợp
            </h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-4">
              Hãy thử di chuyển bản đồ đến khu vực khác hoặc làm mới bộ lọc tìm kiếm.
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Xóa bộ lọc</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
