import React, { useState, useRef, useCallback, useEffect } from 'react';
import SportMapView from '../../components/map/SportMapView';
import { useMapVenues } from '../../hooks/useMapVenues';

/**
 * MapPage - Fullscreen Interactive Sports Map with Left Floating Venue Preview Card
 * Displays sports venues nationwide across Vietnam with instant keyword search and auto-fly.
 */
export default function MapPage() {
  const mapInstanceRef = useRef(null);
  const [selectedVenueId, setSelectedVenueId] = useState(null);

  // Active filters tracker
  const activeFiltersRef = useRef({ sport: null, keyword: '' });
  const isUserSearchingRef = useRef(false);

  const { venues, loading, totalCount, fetchVenuesByBounds } = useMapVenues();

  // Derive currently selected venue object from single source of truth (venues array)
  const selectedVenue = venues.find((v) => {
    if (!selectedVenueId) return false;
    return (
      v.branch_id === selectedVenueId ||
      v.venue_id === selectedVenueId ||
      v.id === selectedVenueId
    );
  }) || null;

  // Auto-deselect if the selected venue falls out of dataset
  useEffect(() => {
    if (selectedVenueId && !selectedVenue && !loading) {
      setSelectedVenueId(null);
    }
  }, [venues, selectedVenueId, selectedVenue, loading]);

  // When searching with keyword and venues arrive, auto-center on the first match
  useEffect(() => {
    if (isUserSearchingRef.current && venues.length > 0 && !loading) {
      isUserSearchingRef.current = false;
      const firstVenue = venues[0];
      if (
        firstVenue &&
        typeof firstVenue.latitude === 'number' &&
        typeof firstVenue.longitude === 'number'
      ) {
        const id = firstVenue.branch_id || firstVenue.venue_id || firstVenue.id;
        setSelectedVenueId(id);
        const map = mapInstanceRef.current;
        if (map && typeof map.flyTo === 'function') {
          map.flyTo([firstVenue.latitude, firstVenue.longitude], 16, {
            duration: 0.8,
            easeLinearity: 0.25
          });
        }
      }
    }
  }, [venues, loading]);

  // Capture Leaflet map instance
  const handleMapReady = useCallback((map) => {
    mapInstanceRef.current = map;
  }, []);

  // Handle venue selection (from Marker click)
  const handleSelectVenue = useCallback((venue) => {
    if (!venue) return;
    const id = venue.branch_id || venue.venue_id || venue.id;
    setSelectedVenueId(id);

    // Focus map on selected venue coordinates
    const map = mapInstanceRef.current;
    if (
      map &&
      typeof map.flyTo === 'function' &&
      typeof venue.latitude === 'number' &&
      typeof venue.longitude === 'number' &&
      !isNaN(venue.latitude) &&
      !isNaN(venue.longitude)
    ) {
      map.flyTo([venue.latitude, venue.longitude], 16, {
        duration: 0.8,
        easeLinearity: 0.25
      });
    }
  }, []);

  // Handle preview card close
  const handleClosePreview = useCallback(() => {
    setSelectedVenueId(null);
  }, []);

  // Handle bounds/filter change from map controller or search/sport chips
  const handleBoundsChange = useCallback(({ bounds, sport, keyword } = {}) => {
    const map = mapInstanceRef.current;
    const targetBounds = bounds || (map && typeof map.getBounds === 'function' ? map.getBounds() : null);

    if (sport !== undefined) activeFiltersRef.current.sport = sport;
    if (keyword !== undefined) activeFiltersRef.current.keyword = keyword;

    const trimmedKw = activeFiltersRef.current.keyword ? activeFiltersRef.current.keyword.trim() : '';

    if (trimmedKw) {
      // Keyword search queries nationwide across all of Vietnam
      isUserSearchingRef.current = true;
      fetchVenuesByBounds(null, {
        sport: activeFiltersRef.current.sport || undefined,
        keyword: trimmedKw,
        all: true,
        limit: 3000
      });
    } else {
      isUserSearchingRef.current = false;
      // Load venues across Vietnam with optional viewport bounds
      fetchVenuesByBounds(targetBounds, {
        sport: activeFiltersRef.current.sport || undefined,
        limit: 3000
      });
    }
  }, [fetchVenuesByBounds]);

  return (
    <div className="w-full h-[calc(100vh-64px)] h-[calc(100dvh-64px)] flex flex-col bg-surface overflow-hidden relative">
      <main className="w-full h-full relative">
        <SportMapView
          venues={venues}
          loading={loading}
          totalCount={totalCount}
          selectedVenue={selectedVenue}
          selectedVenueId={selectedVenueId}
          onSelectVenue={handleSelectVenue}
          onClosePreview={handleClosePreview}
          onBoundsChange={handleBoundsChange}
          onMapReady={handleMapReady}
          className="w-full h-full"
        />
      </main>
    </div>
  );
}
