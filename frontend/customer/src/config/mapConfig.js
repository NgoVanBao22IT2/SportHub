/**
 * Map Configuration for SportHub Map Engine
 * Centralizes all map constants, default locations, and tile providers.
 */
export const MAP_CONFIG = {
  // Default Center: Da Nang / Central Vietnam coordinates
  defaultCenter: [16.054407, 108.202167],
  defaultZoom: 13,
  minZoom: 5,
  maxZoom: 18,

  // Debounce timing for map pan/zoom events (ms)
  debounceDelay: 250,

  // Base tile layer configuration (Pluggable and OSM-compatible)
  tileLayer: {
    url: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAP_TILE_URL) || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  },

  // Marker Clustering Configuration
  clustering: {
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 17
  }
};
