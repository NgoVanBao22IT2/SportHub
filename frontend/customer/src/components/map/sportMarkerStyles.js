import L from 'leaflet';

/**
 * Normalizes sport name to a unified key
 */
export const normalizeSportKey = (sport) => {
  if (!sport || typeof sport !== 'string') return 'general';
  const s = sport
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

  if (s.includes('cau long') || s.includes('badminton')) return 'badminton';
  if (s.includes('pickleball') || s.includes('pickle')) return 'pickleball';
  if (s.includes('bong da') || s.includes('football') || s.includes('soccer') || s.includes('futsal')) return 'football';
  if (s.includes('tennis') || s.includes('quan vot')) return 'tennis';
  if (s.includes('bong ro') || s.includes('basketball')) return 'basketball';
  if (s.includes('golf')) return 'golf';
  if (s.includes('bong chuyen') || s.includes('volleyball') || s.includes('b.chuyen')) return 'volleyball';
  if (s.includes('boi') || s.includes('swim') || s.includes('luot van')) return 'swimming';
  if (s.includes('bong ban') || s.includes('table tennis') || s.includes('ping pong')) return 'tabletennis';
  if (s.includes('bida') || s.includes('billiard') || s.includes('pool')) return 'billiards';
  if (s.includes('gym') || s.includes('fitness') || s.includes('the hinh') || s.includes('yoga')) return 'gym';
  if (s.includes('da nang') || s.includes('ha noi') || s.includes('ho chi minh')) return 'location';

  return 'general';
};

/**
 * Sport visual styles with custom theme colors and sharp inline SVG icons
 * Colors and icons precisely crafted to match the reference sports map design
 */
export const SPORT_STYLES = {
  pickleball: {
    name: 'Pickleball',
    color: '#2563EB', // Blue
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.69 2 6 4.69 6 8c0 2.21 1.2 4.15 3 5.19V19a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5.81c1.8-1.04 3-2.98 3-5.19 0-3.31-2.69-6-6-6zm-1 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-2 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>`
  },
  badminton: {
    name: 'Cầu lông',
    color: '#059669', // Emerald Green / Teal
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M4.93 10.93l4.24-4.24"/><path d="M19.07 10.93l-4.24-4.24"/><circle cx="12" cy="18" r="4" fill="currentColor"/></svg>`
  },
  football: {
    name: 'Bóng đá',
    color: '#16A34A', // Green
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="12 7 15 10 14 14 10 14 9 10" fill="currentColor"/></svg>`
  },
  basketball: {
    name: 'Bóng rổ',
    color: '#EA580C', // Orange
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M5 19A10.3 10.3 0 0 1 19 5"/><path d="M5 5a10.3 10.3 0 0 1 14 14"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>`
  },
  tennis: {
    name: 'Quần vợt',
    color: '#9A3412', // Brown / Amber
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M18 12a6 6 0 0 0-6-6"/><path d="M6 12a6 6 0 0 0 6 6"/></svg>`
  },
  location: {
    name: 'Đà Nẵng',
    color: '#DC2626', // Red
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`
  },
  volleyball: {
    name: 'Bóng chuyền',
    color: '#CA8A04', // Gold
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0-5.8 18.2"/><path d="M12 22a10 10 0 0 0 9.8-8.2"/></svg>`
  },
  swimming: {
    name: 'Bơi lội',
    color: '#0284C7', // Sky Blue
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M2 16h20"/><path d="M2 20h20"/><circle cx="12" cy="6" r="3" fill="currentColor"/></svg>`
  },
  golf: {
    name: 'Golf',
    color: '#047857', // Emerald
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18v4"/><path d="M6 18h12"/><path d="M12 2a4 4 0 0 0-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 0 0-4-4z" fill="currentColor"/></svg>`
  },
  tabletennis: {
    name: 'Bóng bàn',
    color: '#D97706', // Amber
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>`
  },
  billiards: {
    name: 'Bida',
    color: '#4F46E5', // Indigo
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><text x="12" y="16" font-size="10" font-weight="bold" fill="currentColor" text-anchor="middle">8</text></svg>`
  },
  gym: {
    name: 'Gym',
    color: '#7C3AED', // Purple
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/></svg>`
  },
  general: {
    name: 'Thể thao',
    color: '#059669', // Default Brand Green
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/></svg>`
  }
};

/**
 * Cache Map for Leaflet DivIcon instances (prevents memory leaks and re-allocations)
 */
const iconCache = new Map();

/**
 * Returns a cached Leaflet DivIcon with the custom pin style for the requested sport
 */
export const getSportMarkerIcon = (sportCategory, isSelected = false) => {
  const normKey = normalizeSportKey(sportCategory);
  const cacheKey = isSelected ? `${normKey}_selected` : normKey;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const style = SPORT_STYLES[normKey] || SPORT_STYLES.general;

  const html = `
    <div class="sport-map-pin ${isSelected ? 'is-selected' : ''}" style="--pin-color: ${style.color}">
      <div class="pin-head">
        ${style.svg}
      </div>
      <div class="pin-tip"></div>
    </div>
  `;

  const icon = L.divIcon({
    className: 'custom-sport-marker-wrapper',
    html: html,
    iconSize: isSelected ? [34, 42] : [28, 36],
    iconAnchor: isSelected ? [17, 42] : [14, 36],
    popupAnchor: [0, -32]
  });

  iconCache.set(cacheKey, icon);
  return icon;
};

/**
 * Custom Cluster Icon Generator for Leaflet MarkerClusterGroup
 */
export const createCustomClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  let sizeClass = 'cluster-small';
  let size = 36;

  if (count >= 100) {
    sizeClass = 'cluster-large';
    size = 46;
  } else if (count >= 20) {
    sizeClass = 'cluster-medium';
    size = 40;
  }

  return L.divIcon({
    html: `<div class="custom-map-cluster ${sizeClass}"><span>${count}</span></div>`,
    className: 'custom-cluster-wrapper',
    iconSize: L.point(size, size)
  });
};
