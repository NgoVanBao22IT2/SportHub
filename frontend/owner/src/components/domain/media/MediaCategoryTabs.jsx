import React from 'react';

export const CATEGORIES = [
  { id: 'ALL', label: 'Tất cả', statKey: 'total' },
  { id: 'COVER', label: 'Ảnh bìa', statKey: 'cover' },
  { id: 'AVATAR', label: 'Ảnh đại diện', statKey: 'avatar' },
  { id: 'VENUE', label: 'Ảnh sân & Không gian', statKey: 'venue' },
  { id: 'FACILITY', label: 'Ảnh tiện ích', statKey: 'facility' },
  { id: 'EVENT', label: 'Ảnh sự kiện', statKey: 'event' },
  { id: 'PROMOTION', label: 'Ảnh khuyến mãi', statKey: 'promotion' },
  { id: 'TOURNAMENT', label: 'Ảnh giải đấu', statKey: 'tournament' },
  { id: 'COURSE', label: 'Ảnh khóa học', statKey: 'course' },
  { id: 'OTHER', label: 'Khác', statKey: 'other' }
];

export default function MediaCategoryTabs({
  activeCategory = 'ALL',
  onSelectCategory,
  stats = {}
}) {
  return (
    <div className="overflow-x-auto no-scrollbar pb-1">
      <div className="flex items-center gap-1.5 min-w-max border-b border-border-subtle p-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = stats[cat.statKey] !== undefined ? stats[cat.statKey] : null;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory && onSelectCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-brand-orange text-white shadow-xs'
                  : 'bg-surface hover:bg-surface-subtle text-text-muted hover:text-gray-900 border border-transparent'
              }`}
            >
              <span>{cat.label}</span>
              {count !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
