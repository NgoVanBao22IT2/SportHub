import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ListFilter, MapPin, AlertTriangle, RotateCcw } from 'lucide-react';
import VenueListItem from './VenueListItem';

/**
 * VenueBottomSheet Component (Phase 6 Polish)
 * Mobile-friendly collapsible bottom sheet showing venues in the current viewport with rich states.
 */
export default function VenueBottomSheet({
  venues = [],
  selectedVenueId = null,
  onSelectVenue,
  loading = false,
  error = null,
  onRetry,
  onResetFilters,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[450] bg-white rounded-t-3xl shadow-2xl border-t border-gray-200/90 transition-all duration-300 ease-in-out md:hidden flex flex-col ${
        isExpanded ? 'h-[65vh]' : 'h-14'
      } ${className}`}
    >
      {/* Handle & Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Thu gọn danh sách sân' : 'Mở rộng danh sách sân'}
        className="w-full py-2.5 px-4 flex items-center justify-between cursor-pointer border-b border-gray-100 bg-white rounded-t-3xl select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
          <ListFilter size={16} className="text-emerald-600" />
          <span className="font-bold text-gray-800 text-xs sm:text-sm">
            Danh sách sân ({venues.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <span>{isExpanded ? 'Thu gọn' : 'Xem danh sách'}</span>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {/* Expanded Scrollable List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {error ? (
            <div className="py-8 text-center text-gray-500">
              <AlertTriangle size={24} className="mx-auto text-red-500 mb-2" />
              <p className="text-xs font-semibold text-gray-800 mb-2">Không thể tải danh sách sân</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Thử lại</span>
                </button>
              )}
            </div>
          ) : venues.length > 0 ? (
            <div role="list" className="space-y-2">
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
                      onSelectVenue={(v) => {
                        onSelectVenue(v);
                        setIsExpanded(false); // Collapse to reveal map & preview card
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <MapPin size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-800 mb-1">Không tìm thấy sân trong khu vực này</p>
              <p className="text-[11px] text-gray-400 mb-3">Thử di chuyển bản đồ hoặc đổi bộ lọc</p>
              {onResetFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onResetFilters();
                    setIsExpanded(false);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
