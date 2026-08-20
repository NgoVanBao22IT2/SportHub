import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * MapSearchBar Component - Alobo-style search pill
 */
function MapSearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Tìm kiếm sân quanh đây...',
  className = ''
}) {
  return (
    <div className={`relative flex items-center bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-full shadow-md hover:shadow-lg transition-all duration-200 ${className}`}>
      {/* Brand Shuttlecock Icon on Left */}
      <div className="pl-3.5 pr-1.5 flex items-center justify-center pointer-events-none text-emerald-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M12 2v6" />
          <path d="M4.93 10.93l4.24-4.24" />
          <path d="M19.07 10.93l-4.24-4.24" />
          <circle cx="12" cy="18" r="4" fill="currentColor" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm kiếm sân quanh đây"
        className="w-full py-2.5 pr-8 text-xs sm:text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400 font-medium"
      />

      {value && value.trim().length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Xóa tìm kiếm"
          className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X size={15} />
        </button>
      ) : (
        <div className="pr-3.5 text-gray-400 pointer-events-none flex items-center">
          <Search size={16} />
        </div>
      )}
    </div>
  );
}

export default React.memo(MapSearchBar);
