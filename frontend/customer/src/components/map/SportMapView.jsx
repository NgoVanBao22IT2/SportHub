import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, RotateCcw, Navigation, X, Route, Compass, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './mapStyles.css';
import { MAP_CONFIG } from '../../config/mapConfig';
import SportMarkerCluster from './SportMarkerCluster';
import MapSearchBar from './MapSearchBar';
import SportFilterChips from './SportFilterChips';
import GeolocationControl from './GeolocationControl';
import VenuePreviewCard from './VenuePreviewCard';
import Button from '../ui/Button';

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
  directRouteVenue = null,
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

  // In-App Direction Routing States
  const [routingTarget, setRoutingTarget] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

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

  // Direction Routing Handler: traces real path from User GPS -> Target Venue
  const handleStartRouting = useCallback((targetVenue) => {
    if (!targetVenue) return;

    let destLat = typeof targetVenue.latitude === 'number' ? targetVenue.latitude : null;
    let destLng = typeof targetVenue.longitude === 'number' ? targetVenue.longitude : null;

    if (!destLat || !destLng) {
      if (targetVenue.geo_coordinates) {
        try {
          const coords = typeof targetVenue.geo_coordinates === 'string'
            ? JSON.parse(targetVenue.geo_coordinates)
            : targetVenue.geo_coordinates;
          if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
            destLat = coords.lat;
            destLng = coords.lng;
          }
        } catch (e) {}
      } else if (targetVenue.branches && targetVenue.branches[0]?.geo_coordinates) {
        try {
          const coords = typeof targetVenue.branches[0].geo_coordinates === 'string'
            ? JSON.parse(targetVenue.branches[0].geo_coordinates)
            : targetVenue.branches[0].geo_coordinates;
          if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
            destLat = coords.lat;
            destLng = coords.lng;
          }
        } catch (e) {}
      }
    }

    if (!destLat || !destLng) {
      return;
    }

    const destObj = {
      ...targetVenue,
      latitude: destLat,
      longitude: destLng,
      name: targetVenue.venue_name || targetVenue.name || 'Sân thể thao',
      address: targetVenue.address || targetVenue.location || (targetVenue.branches && targetVenue.branches[0]?.street_address) || ''
    };

    setRoutingTarget(destObj);
    setIsRoutingLoading(true);

    const performRouting = async (userCoords) => {
      setUserLocation(userCoords);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userCoords.longitude},${userCoords.latitude};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          const latLngs = r.geometry.coordinates.map(c => [c[1], c[0]]);
          setRoutePath(latLngs);
          setRouteInfo({
            distanceKm: (r.distance / 1000).toFixed(1),
            durationMin: Math.max(1, Math.ceil(r.duration / 60))
          });
        } else {
          setRoutePath([[userCoords.latitude, userCoords.longitude], [destLat, destLng]]);
          const dLat = destLat - userCoords.latitude;
          const dLng = destLng - userCoords.longitude;
          const dist = (Math.sqrt(dLat * dLat + dLng * dLng) * 111).toFixed(1);
          setRouteInfo({
            distanceKm: dist,
            durationMin: Math.max(1, Math.ceil(Number(dist) * 2.5))
          });
        }
      } catch (err) {
        setRoutePath([[userCoords.latitude, userCoords.longitude], [destLat, destLng]]);
        const dLat = destLat - userCoords.latitude;
        const dLng = destLng - userCoords.longitude;
        const dist = (Math.sqrt(dLat * dLat + dLng * dLng) * 111).toFixed(1);
        setRouteInfo({
          distanceKm: dist,
          durationMin: Math.max(1, Math.ceil(Number(dist) * 2.5))
        });
      } finally {
        setIsRoutingLoading(false);
      }

      if (mapInstance && typeof mapInstance.fitBounds === 'function') {
        const bounds = L.latLngBounds([
          [userCoords.latitude, userCoords.longitude],
          [destLat, destLng]
        ]);
        mapInstance.fitBounds(bounds, { padding: [120, 120], maxZoom: 16 });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          performRouting({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        () => {
          performRouting({
            latitude: 16.054407,
            longitude: 108.202167
          });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      performRouting({
        latitude: 16.054407,
        longitude: 108.202167
      });
    }
  }, [mapInstance]);

  const handleStopRouting = () => {
    setRoutingTarget(null);
    setRoutePath([]);
    setRouteInfo(null);
    setIsRoutingLoading(false);
  };

  // Auto trigger routing if directRouteVenue is provided
  useEffect(() => {
    if (directRouteVenue) {
      handleStartRouting(directRouteVenue);
    }
  }, [directRouteVenue, handleStartRouting]);

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

      {/* Floating Direction Navigation Card */}
      {routingTarget && (
        <div className="absolute top-20 left-4 z-[450] w-[340px] sm:w-[380px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md border border-emerald-300 rounded-2xl p-4 shadow-2xl pointer-events-auto animate-fade-in space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Navigation size={10} className="fill-emerald-600 text-emerald-600" />
                  Chỉ đường SportHub
                </span>
                {isRoutingLoading && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin text-emerald-600" /> Đang tính toán...
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-gray-900 mt-1 truncate">
                {routingTarget.name || routingTarget.venue_name}
              </h4>
              <p className="text-[11px] text-gray-500 truncate">{routingTarget.address || 'Đang cập nhật địa chỉ'}</p>
            </div>
            <button
              type="button"
              onClick={handleStopRouting}
              aria-label="Đóng chỉ đường"
              className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {routeInfo && (
            <div className="grid grid-cols-2 gap-2 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <div>
                <span className="text-[10px] text-gray-500 font-medium block">Khoảng cách</span>
                <strong className="text-emerald-700 text-base font-black">{routeInfo.distanceKm} km</strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-medium block">Thời gian ước tính</span>
                <strong className="text-emerald-700 text-base font-black">~{routeInfo.durationMin} phút</strong>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => {
                const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${routingTarget.latitude},${routingTarget.longitude}`;
                window.open(googleUrl, '_blank');
              }}
              leftIcon={<ExternalLink size={13} />}
            >
              Mở Google Maps
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopRouting}
            >
              Dừng
            </Button>
          </div>
        </div>
      )}

      {/* Floating Selected Venue Preview Card on the LEFT SIDE (hidden if actively routing) */}
      {selectedVenue && !routingTarget && (
        <div className="absolute top-28 md:top-24 left-4 z-[450] pointer-events-auto">
          <VenuePreviewCard
            venue={selectedVenue}
            onClose={onClosePreview}
            onDirectRoute={(v) => handleStartRouting(v)}
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

        {/* Active Route Polylines on Map */}
        {routePath.length > 0 && (
          <>
            {/* Ambient Background Track */}
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#065F46',
                weight: 8,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Glowing Foreground Routing Polyline */}
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#10B981',
                weight: 5,
                opacity: 0.95,
                dashArray: '8, 6',
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Sport Venue Markers */}
        <SportMarkerCluster
          venues={venues}
          selectedVenueId={routingTarget?.venue_id || routingTarget?.id || selectedVenueId}
          onSelectVenue={onSelectVenue}
        />
      </MapContainer>
    </div>
  );
}
