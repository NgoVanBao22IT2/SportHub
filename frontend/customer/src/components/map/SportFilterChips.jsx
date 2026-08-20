import React, { useState, useEffect } from 'react';
import { getSportsCategories } from '../../api/venues';
import SportIcon from '../common/SportIcon';
import { normalizeSportKey, SPORT_STYLES } from './sportMarkerStyles';

const ALOBO_SPORTS = [
  'Pickleball',
  'Cầu lông',
  'Bóng đá',
  'Bóng rổ',
  'Quần vợt',
  'Đà nẵng',
  'Typti',
  'Lướt ván',
  'B.Chuyền',
  'Golf',
  'Padel',
  'Bida',
  'Bóng bàn',
  'Bơi lội',
  'Gym'
];

/**
 * SportFilterChips Component - Alobo-style horizontally scrollable pill chip strip
 */
function SportFilterChips({
  activeSport = null,
  onSelectSport,
  className = ''
}) {
  const [sports, setSports] = useState(ALOBO_SPORTS);

  useEffect(() => {
    let isMounted = true;
    getSportsCategories()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Merge unique categories while preserving Alobo default order
          const merged = Array.from(new Set([...ALOBO_SPORTS, ...data]));
          setSports(merged);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch sports categories, using Alobo default list:', err);
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
    <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5 ${className}`}>
      {/* Individual sport chips with Alobo color-coded circular badge */}
      {sports.map((sport) => {
        const isSelected = activeSport === sport;
        const normKey = normalizeSportKey(sport);
        const sportStyle = SPORT_STYLES[normKey] || SPORT_STYLES.general;
        const badgeColor = sportStyle.color || '#059669';

        return (
          <button
            key={sport}
            type="button"
            onClick={() => handleChipClick(sport)}
            aria-pressed={isSelected}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all duration-150 shadow-md flex items-center gap-1.5 cursor-pointer ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 scale-102 font-bold ring-2 ring-emerald-500'
                : 'bg-white/95 backdrop-blur-md text-gray-800 hover:bg-white border border-gray-200/90 hover:border-gray-300 font-medium'
            }`}
          >
            {/* Color-coded circular icon badge */}
            <div
              className="w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-2xs"
              style={{ backgroundColor: badgeColor }}
            >
              <SportIcon
                sport={sport}
                size={10}
                className="text-white"
              />
            </div>
            <span className="whitespace-nowrap font-medium text-[11px] sm:text-xs">{sport}</span>
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(SportFilterChips);
