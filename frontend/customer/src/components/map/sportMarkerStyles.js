import React from 'react';
import { renderToString } from 'react-dom/server';
import L from 'leaflet';
import SportIcon, { normalizeSport } from '../common/SportIcon';

/**
 * Normalizes sport name and venue name to a unified sport key
 */
export const normalizeSportKey = (sport, venueName = '') => {
  const combined = `${sport || ''} ${venueName || ''}`;
  const norm = normalizeSport(combined);

  if (norm.includes('pickleball') || norm.includes('pickle')) return 'pickleball';
  if (norm.includes('cau long') || norm.includes('badminton')) return 'badminton';
  if (norm.includes('bong da') || norm.includes('football') || norm.includes('soccer') || norm.includes('futsal') || norm.includes('san co')) return 'football';
  if (norm.includes('tennis') || norm.includes('quan vot')) return 'tennis';
  if (norm.includes('bong ro') || norm.includes('basketball')) return 'basketball';
  if (norm.includes('bong chuyen') || norm.includes('volleyball')) return 'volleyball';
  if (norm.includes('boi') || norm.includes('swim') || norm.includes('ho boi') || norm.includes('be boi')) return 'swimming';
  if (norm.includes('bong ban') || norm.includes('table tennis') || norm.includes('ping pong')) return 'tabletennis';
  if (norm.includes('bida') || norm.includes('billiards') || norm.includes('pool') || norm.includes('snooker')) return 'billiards';
  if (norm.includes('gym') || norm.includes('fitness') || norm.includes('the hinh') || norm.includes('yoga')) return 'gym';
  if (norm.includes('golf')) return 'golf';

  return 'general';
};

/**
 * Sport visual styles with synchronized distinct theme colors
 */
export const SPORT_STYLES = {
  badminton: {
    name: 'Cầu lông',
    color: '#0284C7' // Sky Blue
  },
  pickleball: {
    name: 'Pickleball',
    color: '#10B981' // Emerald Green
  },
  football: {
    name: 'Bóng đá',
    color: '#EA580C' // Fire Orange
  },
  tennis: {
    name: 'Tennis',
    color: '#EAB308' // Gold Yellow
  },
  basketball: {
    name: 'Bóng rổ',
    color: '#E11D48' // Rose Red
  },
  volleyball: {
    name: 'Bóng chuyền',
    color: '#6366F1' // Royal Indigo
  },
  swimming: {
    name: 'Bơi lội',
    color: '#06B6D4' // Cyan Blue
  },
  tabletennis: {
    name: 'Bóng bàn',
    color: '#D97706' // Amber
  },
  billiards: {
    name: 'Bida',
    color: '#7C3AED' // Purple
  },
  gym: {
    name: 'Gym',
    color: '#C026D3' // Fuchsia
  },
  golf: {
    name: 'Golf',
    color: '#047857' // Forest Jade Green
  },
  general: {
    name: 'Thể thao',
    color: '#0F766E' // Dark Teal
  }
};

/**
 * Returns sport theme (color, name, key)
 */
export const getSportTheme = (sportCategory, venueName = '') => {
  const normKey = normalizeSportKey(sportCategory, venueName);
  return SPORT_STYLES[normKey] || SPORT_STYLES.general;
};

/**
 * Cache Map for Leaflet DivIcon instances (prevents memory leaks and re-allocations)
 */
const iconCache = new Map();

/**
 * Returns a cached Leaflet DivIcon using the EXACT SAME SportIcon component rendered in filter chips
 */
export const getSportMarkerIcon = (sportCategory, venueName = '', isSelected = false) => {
  const normKey = normalizeSportKey(sportCategory, venueName);
  const cacheKey = isSelected ? `${normKey}_selected` : normKey;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const style = SPORT_STYLES[normKey] || SPORT_STYLES.general;
  const iconHtml = renderToString(
    React.createElement(SportIcon, {
      sport: normKey,
      size: isSelected ? 18 : 15,
      color: '#ffffff',
      style: { color: '#ffffff' }
    })
  );

  const html = `
    <div class="sport-map-pin ${isSelected ? 'is-selected' : ''}" style="--pin-color: ${style.color}">
      <div class="pin-head">
        ${iconHtml}
      </div>
      <div class="pin-tip"></div>
    </div>
  `;

  const icon = L.divIcon({
    className: 'custom-sport-marker-wrapper',
    html: html,
    iconSize: isSelected ? [38, 46] : [32, 40],
    iconAnchor: isSelected ? [19, 46] : [16, 40],
    popupAnchor: [0, -36]
  });

  iconCache.set(cacheKey, icon);
  return icon;
};
