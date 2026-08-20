import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * MapSearchBar Component
 * Floating search bar on top of the interactive map with clear button.
 */
function MapSearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Tìm tên sân, địa điểm...',
  className = ''
}) {
  return (
    <div className={`relative flex items-center w-full bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 ${className}`}>
      <div className="pl-3.5 pr-2 text-emerald-600 flex items-center justify-center pointer-events-none">
        <Search size={18} className="stroke-[2.2]" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm kiếm sân thể thao trên bản đồ"
        className="w-full py-2.5 pr-9 text-xs sm:text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400 font-medium"
      />

      {value && value.trim().length > 0 && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Xóa tìm kiếm"
          className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default React.memo(MapSearchBar);
