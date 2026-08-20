import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, RotateCcw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './mapStyles.css';
import { MAP_CONFIG } from '../../config/mapConfig';
import SportMarkerCluster from './SportMarkerCluster';
import MapSearchBar from './MapSearchBar';
import SportFilterChips from './SportFilterChips';
import GeolocationControl from './GeolocationControl';
import VenuePreviewCard from './VenuePreviewCard';

/**
 * Helper component to ensure Leaflet recalculates dimensions when container loads
 */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

/**
 * Subcomponent handling map events (moveend, zoomend) with debouncing
 */
function MapViewportController({ onBoundsChange }) {
  const map = useMap();
  const debounceTimerRef = useRef(null);
  const initialLoadRef = useRef(false);

  // Trigger initial viewport load once map is ready
  useEffect(() => {
    if (!initialLoadRef.current && map) {
      initialLoadRef.current = true;
      const bounds = map.getBounds();
      if (bounds && typeof bounds.getNorth === 'function') {
        onBoundsChange(bounds);
      }
    }
  }, [map, onBoundsChange]);

  // Listen to moveend and zoomend events
  useMapEvents({
    moveend() {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        if (bounds && typeof bounds.getNorth === 'function') {
          onBoundsChange(bounds);
        }
      }, MAP_CONFIG.debounceDelay);
    }
  });

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return null;
}

/**
 * Bridge subcomponent that exposes map instance functions to parent UI controls
 */
function MapBridge({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

/**
 * SportMapView - Fullscreen Map Engine with Left Floating Venue Preview & Red GPS User Marker
 */
export default function SportMapView({
  venues = [],
  loading = false,
  totalCount = 0,
  selectedVenue = null,
  selectedVenueId = null,
  onSelectVenue,
  onClosePreview,
  onBoundsChange,
  onMapReady,
  center = MAP_CONFIG.defaultCenter,
  zoom = MAP_CONFIG.defaultZoom,
  minZoom = MAP_CONFIG.minZoom,
  maxZoom = MAP_CONFIG.maxZoom,
  className = 'w-full h-full'
}) {
  const [mapInstance, setMapInstance] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSport, setActiveSport] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const searchDebounceTimerRef = useRef(null);

  // User Red Location Pin Icon with Radar Ripple Effect
  const userLocationRedIcon = useMemo(() => {
    return L.divIcon({
      className: 'user-location-marker-wrapper',
      html: `
        <div class="user-location-pin-container">
          <div class="user-location-radar"></div>
          <div class="sport-map-pin is-user-location" style="--pin-color: #EF4444;">
            <div class="pin-head">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M22 12h-4"/>
                <path d="M6 12H2"/>
                <path d="M12 6V2"/>
                <path d="M12 22v-4"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
            <div class="pin-tip"></div>
          </div>
        </div>
      `,
      iconSize: [44, 52],
      iconAnchor: [22, 50],
      popupAnchor: [0, -42]
    });
  }, []);

  // Handle search input typing with 350ms debounce
  const handleSearchChange = (val) => {
    setSearchInput(val);

    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      const trimmed = val.trim();
      if (onBoundsChange) {
        onBoundsChange({ keyword: trimmed, sport: activeSport });
      }
    }, 350);
  };

  // Handle clearing search input
  const handleClearSearch = () => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    setSearchInput('');
    if (onBoundsChange) {
      onBoundsChange({ keyword: '', sport: activeSport });
    }
  };

  // Handle sport chip selection
  const handleSelectSport = (sport) => {
    setActiveSport(sport);
    if (onBoundsChange) {
      onBoundsChange({ sport, keyword: searchInput.trim() });
    }
  };

  // Handle resetting all active filters
  const handleResetFilters = () => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }
    setSearchInput('');
    setActiveSport(null);
    if (onBoundsChange) {
      onBoundsChange({ sport: null, keyword: '' });
    }
  };

  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, []);

  const hasActiveFilters = Boolean(activeSport || searchInput.trim());

  return (
    <div className={`relative ${className}`}>
      {/* Floating Header Overlay: Search Bar & Sport Category Filter Chips on ONE SINGLE ROW */}
      <div className="absolute top-3.5 left-4 right-4 z-[400] flex items-center gap-2 pointer-events-auto">
        {/* Search Bar */}
        <div className="flex-shrink-0 w-64 sm:w-72 md:w-80 lg:w-96 max-w-[45vw]">
          <MapSearchBar
            value={searchInput}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            placeholder="Tìm theo tên sân, địa điểm..."
          />
        </div>

        {/* Reset Filter Button if active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            title="Xóa bộ lọc"
            className="flex-shrink-0 px-3 py-2 bg-white/95 backdrop-blur-md hover:bg-white text-gray-700 hover:text-red-600 border border-gray-200/90 rounded-2xl shadow-md hover:shadow-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Xóa</span>
          </button>
        )}

        {/* Sport Category Filter Chips on the same row */}
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
          <SportFilterChips
            activeSport={activeSport}
            onSelectSport={handleSelectSport}
          />
        </div>
      </div>

      {/* Floating Selected Venue Preview Card on the LEFT SIDE */}
      {selectedVenue && (
        <div className="absolute top-28 md:top-24 left-4 z-[450] pointer-events-auto">
          <VenuePreviewCard
            venue={selectedVenue}
            onClose={onClosePreview}
          />
        </div>
      )}

      {/* Floating Status & Venue Count Badges */}
      <div className="absolute bottom-6 left-4 z-[400] flex items-center gap-2 pointer-events-none">
        {loading && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-semibold text-gray-800 animate-fade-in pointer-events-auto">
            <Loader2 size={15} className="animate-spin text-emerald-600" />
            <span>Đang tìm sân...</span>
          </div>
        )}
        {!loading && (
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg px-3.5 py-2 rounded-full text-xs font-semibold text-gray-800 pointer-events-auto">
            <span>
              {totalCount > 0 ? (
                <>Tìm thấy <strong className="text-emerald-600">{totalCount}</strong> sân</>
              ) : (
                <span className="text-gray-500">Không có sân trong khu vực này</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Floating Geolocation GPS Control (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-[400] pointer-events-auto">
        <GeolocationControl
          map={mapInstance}
          onLocate={(coords) => setUserLocation(coords)}
        />
      </div>

      {/* Leaflet Map Engine */}
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      >
        <TileLayer
          url={MAP_CONFIG.tileLayer.url}
          attribution={MAP_CONFIG.tileLayer.attribution}
          maxZoom={MAP_CONFIG.tileLayer.maxZoom}
        />
        <MapResizer />
        <MapBridge onMapReady={(map) => {
          setMapInstance(map);
          if (onMapReady) {
            onMapReady(map);
          }
        }} />
        <MapViewportController
          onBoundsChange={(bounds) => {
            if (onBoundsChange) {
              onBoundsChange({ bounds, sport: activeSport, keyword: searchInput.trim() });
            }
          }}
        />

        {/* User GPS Red Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userLocationRedIcon}
            zIndexOffset={10000}
          >
            <Popup>
              <div className="text-xs font-bold text-red-600 flex items-center gap-1.5 p-1">
                <span>📍 Vị trí hiện tại của bạn</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Sport Venue Markers */}
        <SportMarkerCluster
          venues={venues}
          selectedVenueId={selectedVenueId}
          onSelectVenue={onSelectVenue}
        />
      </MapContainer>
    </div>
  );
}
