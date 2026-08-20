import React, { useState, useEffect } from 'react';
import { getSportsCategories } from '../../api/venues';
import SportIcon from '../common/SportIcon';
import { getSportTheme } from './sportMarkerStyles';

const DEFAULT_SPORTS = [
  'Cầu lông',
  'Pickleball',
  'Bóng đá',
  'Tennis',
  'Bóng rổ',
  'Bóng chuyền',
  'Bơi lội',
  'Bóng bàn',
  'Bida',
  'Gym'
];

/**
 * SportFilterChips Component
 * Horizontally scrollable chip bar with synchronized sport colors and icons.
 */
function SportFilterChips({
  activeSport = null,
  onSelectSport,
  className = ''
}) {
  const [sports, setSports] = useState(DEFAULT_SPORTS);

  useEffect(() => {
    let isMounted = true;
    getSportsCategories()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Merge unique categories while preserving popular defaults
          const merged = Array.from(new Set([...DEFAULT_SPORTS, ...data]));
          setSports(merged);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch sports categories, using default list:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChipClick = (sportName) => {
    if (activeSport === sportName) {
      // Toggle off -> All sports
      onSelectSport(null);
    } else {
      onSelectSport(sportName);
    }
  };

  return (
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 ${className}`}>
      {/* "Tất cả" chip */}
      <button
        type="button"
        onClick={() => onSelectSport(null)}
        aria-pressed={!activeSport}
        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 shadow-xs flex items-center gap-1.5 ${
          !activeSport
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-102'
            : 'bg-white/95 backdrop-blur-md text-gray-700 hover:bg-gray-100/90 border border-gray-200/80 hover:border-gray-300'
        }`}
      >
        <span>Tất cả</span>
      </button>

      {/* Individual sport chips with matching sport colors */}
      {sports.map((sport) => {
        const isSelected = activeSport === sport;
        const theme = getSportTheme(sport);

        return (
          <button
            key={sport}
            type="button"
            onClick={() => handleChipClick(sport)}
            aria-pressed={isSelected}
            style={{
              backgroundColor: isSelected ? theme.color : undefined,
              borderColor: isSelected ? theme.color : undefined
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 shadow-xs flex items-center gap-1.5 ${
              isSelected
                ? 'text-white shadow-md scale-102 font-semibold'
                : 'bg-white/95 backdrop-blur-md text-gray-700 hover:bg-gray-100/90 border border-gray-200/80 hover:border-gray-300'
            }`}
          >
            <SportIcon
              sport={sport}
              size={13}
              style={{ color: isSelected ? '#ffffff' : theme.color }}
              className="flex-shrink-0"
            />
            <span>{sport}</span>
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(SportFilterChips);
