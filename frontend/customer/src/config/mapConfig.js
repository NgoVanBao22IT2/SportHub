/**
 * Map Configuration for SportHub Map Engine
 * Centralizes all map constants, default locations, and tile providers.
 */
export const MAP_CONFIG = {
  // Default Center: Da Nang / Central Vietnam coordinates
  defaultCenter: [16.054407, 108.202167],
  defaultZoom: 13,
  minZoom: 5,
  maxZoom: 19,

  // Debounce timing for map pan/zoom events (ms)
  debounceDelay: 250,

  // Base tile layer configuration (Pluggable and OSM-compatible CartoDB Voyager / OSM)
  tileLayer: {
    url: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAP_TILE_URL) || 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c', 'd']
  },

  // Marker Clustering Configuration - Configured to reveal all individual sport pins across the city view
  clustering: {
    maxClusterRadius: 10,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 7
  }
};
