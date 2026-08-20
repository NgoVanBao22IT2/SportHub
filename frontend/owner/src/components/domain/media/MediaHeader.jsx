import React from 'react';
import { Upload, Building2, ChevronRight } from 'lucide-react';
import Button from '../../ui/Button';

export default function MediaHeader({
  venues = [],
  selectedVenueId = '',
  onSelectVenue,
  onOpenUpload,
  loadingVenues = false
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border-subtle">
      {/* Left: Breadcrumbs & Title */}
      <div>
        {/* <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
          <span>Quản lý sân</span>
          <ChevronRight size={12} className="text-text-muted/60" />
          <span className="font-medium text-text-primary">Thư viện hình ảnh</span>
        </nav> */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Thư viện hình ảnh & Media
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Quản lý toàn bộ hình ảnh, nội dung quảng bá và media của sân thể thao.
        </p>
      </div>

      {/* Right: Venue Selector & Action Button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Venue Selector Dropdown */}
        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Building2 size={16} />
          </div>
          <select
            value={selectedVenueId}
            onChange={(e) => onSelectVenue && onSelectVenue(e.target.value)}
            disabled={loadingVenues || venues.length === 0}
            aria-label="Chọn cơ sở sân"
            className="w-full pl-9 pr-8 py-2.5 bg-surface border border-border-subtle rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary outline-none transition disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {venues.length === 0 ? (
              <option value="">{loadingVenues ? 'Đang tải danh sách sân...' : 'Chưa có cơ sở'}</option>
            ) : (
              venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Upload Button */}
        <Button
          variant="primary"
          size="md"
          leftIcon={<Upload size={18} />}
          onClick={onOpenUpload}
          disabled={!selectedVenueId}
          className="shadow-sm hover:shadow transition"
        >
          Tải media
        </Button>
      </div>
    </div>
  );
}
