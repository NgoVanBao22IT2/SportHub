import { useState, useRef, useCallback, useEffect } from 'react';
import { getVenuesForMap } from '../api/venues';

/**
 * Custom Hook for Fetching Map Venues across Vietnam and Viewport
 * Handles nationwide loading, keyword searches, in-flight request cancellation, race-condition safety, and unmount safety.
 */
export function useMapVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // References for request tracking and cancellation
  const abortControllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Fetch venues across Vietnam or within a Leaflet LatLngBounds
   * @param {L.LatLngBounds|null} bounds - Optional Leaflet map bounds
   * @param {Object} options - Optional filters (sport, keyword, all, limit)
   */
  const fetchVenuesByBounds = useCallback(async (bounds = null, options = {}) => {
    // Cancel any ongoing in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const currentRequestId = ++latestRequestIdRef.current;

    const params = {
      sport: options.sport || undefined,
      keyword: options.keyword || undefined,
      all: options.all || (!bounds ? true : undefined),
      limit: options.limit || 3000
    };

    if (bounds && typeof bounds.getNorth === 'function' && !options.keyword && !options.all) {
      params.north = bounds.getNorth();
      params.south = bounds.getSouth();
      params.east = bounds.getEast();
      params.west = bounds.getWest();
    }

    setLoading(true);
    setError(null);

    try {
      const responseData = await getVenuesForMap(params);

      // Verify request is still the latest and component is still mounted
      if (!isMountedRef.current || currentRequestId !== latestRequestIdRef.current) {
        return;
      }

      const venueList = Array.isArray(responseData?.data)
        ? responseData.data
        : (Array.isArray(responseData) ? responseData : []);

      setVenues(venueList);
      setTotalCount(responseData?.total !== undefined ? responseData.total : venueList.length);
      setLoading(false);
    } catch (err) {
      // Ignore AbortError silently
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }

      if (isMountedRef.current && currentRequestId === latestRequestIdRef.current) {
        console.error('Failed to load map venues:', err);
        setError(err);
        setLoading(false);
      }
    }
  }, []);

  return {
    venues,
    loading,
    error,
    totalCount,
    fetchVenuesByBounds
  };
}
