import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MAP_CONFIG } from '../../config/mapConfig';
import { getSportMarkerIcon, createCustomClusterIcon } from './sportMarkerStyles';

/**
 * SportMarkerCluster Component
 * Manages high-performance clustering of custom sport markers on Leaflet map.
 * Supports individual marker selection and custom cluster click behaviors.
 */
export default function SportMarkerCluster({
  venues = [],
  selectedVenueId = null,
  onSelectVenue
}) {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  // Initialize MarkerClusterGroup on mount
  useEffect(() => {
    if (!map) return;

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: MAP_CONFIG.clustering.maxClusterRadius,
      spiderfyOnMaxZoom: MAP_CONFIG.clustering.spiderfyOnMaxZoom,
      showCoverageOnHover: MAP_CONFIG.clustering.showCoverageOnHover,
      zoomToBoundsOnClick: MAP_CONFIG.clustering.zoomToBoundsOnClick,
      disableClusteringAtZoom: MAP_CONFIG.clustering.disableClusteringAtZoom,
      iconCreateFunction: createCustomClusterIcon
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => {
      if (clusterGroupRef.current && map.hasLayer(clusterGroupRef.current)) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map]);

  // Synchronize venue markers when venues or selectedVenueId prop changes
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    // Clear existing markers
    clusterGroup.clearLayers();

    if (!Array.isArray(venues) || venues.length === 0) {
      return;
    }

    const markers = [];

    for (let i = 0; i < venues.length; i++) {
      const v = venues[i];
      if (typeof v.latitude !== 'number' || typeof v.longitude !== 'number') {
        continue;
      }

      const isSelected = selectedVenueId && (
        v.branch_id === selectedVenueId ||
        v.id === selectedVenueId ||
        v.venue_id === selectedVenueId
      );

      const icon = getSportMarkerIcon(v.sport_category, isSelected);
      const marker = L.marker([v.latitude, v.longitude], {
        icon,
        title: v.name || v.venue_name || 'Sân thể thao',
        zIndexOffset: isSelected ? 1000 : 0
      });

      // Attach venue identity and click listener
      marker.venueData = v;
      marker.on('click', () => {
        if (onSelectVenue) {
          onSelectVenue(v);
        }
      });

      markers.push(marker);
    }

    // Batch add layers for maximum performance
    clusterGroup.addLayers(markers);
  }, [venues, selectedVenueId, onSelectVenue]);

  return null;
}
