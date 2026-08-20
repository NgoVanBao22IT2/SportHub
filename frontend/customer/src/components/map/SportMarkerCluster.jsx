import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getSportMarkerIcon } from './sportMarkerStyles';

/**
 * Direct Sport Markers Component
 * Renders every individual venue as its own distinct pin directly on its real geographic coordinates (no clustering).
 */
export default function SportMarkerCluster({
  venues = [],
  selectedVenueId = null,
  onSelectVenue
}) {
  const map = useMap();
  const layerGroupRef = useRef(null);

  // Initialize standard Leaflet LayerGroup on mount
  useEffect(() => {
    if (!map) return;

    const layerGroup = L.layerGroup();
    map.addLayer(layerGroup);
    layerGroupRef.current = layerGroup;

    return () => {
      if (layerGroupRef.current && map.hasLayer(layerGroupRef.current)) {
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [map]);

  // Synchronize venue markers when venues or selectedVenueId changes
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    // Clear existing markers
    layerGroup.clearLayers();

    if (!Array.isArray(venues) || venues.length === 0) {
      return;
    }

    // Render each venue at its exact coordinates
    for (let i = 0; i < venues.length; i++) {
      const v = venues[i];
      if (typeof v.latitude !== 'number' || typeof v.longitude !== 'number') continue;

      const isSelected = selectedVenueId && (
        v.branch_id === selectedVenueId ||
        v.id === selectedVenueId ||
        v.venue_id === selectedVenueId
      );

      const icon = getSportMarkerIcon(v.sport_category, v.name || v.venue_name, isSelected);
      const marker = L.marker([v.latitude, v.longitude], {
        icon,
        title: v.name || v.venue_name || 'Sân thể thao',
        zIndexOffset: isSelected ? 1000 : 0
      });

      // Click listener: Select this venue and open left preview card
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectVenue) {
          onSelectVenue(v);
        }
      });

      layerGroup.addLayer(marker);
    }
  }, [venues, selectedVenueId, onSelectVenue]);

  return null;
}
