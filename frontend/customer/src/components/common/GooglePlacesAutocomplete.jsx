import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, X, Loader2, Search } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Popular fallback suggestions for instant display when focused
const POPULAR_VIETNAM_PLACES = [
  { name: 'Đà Nẵng', description: 'Thành phố Đà Nẵng, Việt Nam' },
  { name: 'Hà Nội', description: 'Thủ đô Hà Nội, Việt Nam' },
  { name: 'Hồ Chí Minh', description: 'TP. Hồ Chí Minh, Việt Nam' },
  { name: 'Hải Phòng', description: 'Thành phố Hải Phòng, Việt Nam' },
  { name: 'Cần Thơ', description: 'Thành phố Cần Thơ, Việt Nam' },
  { name: 'Bình Dương', description: 'Tỉnh Bình Dương, Việt Nam' },
  { name: 'Đồng Nai', description: 'Tỉnh Đồng Nai, Việt Nam' },
  { name: 'Quảng Nam', description: 'Tỉnh Quảng Nam, Việt Nam' },
  { name: 'Khánh Hòa', description: 'Tỉnh Khánh Hòa, Việt Nam' },
  { name: 'Bà Rịa - Vũng Tàu', description: 'Tỉnh Bà Rịa - Vũng Tàu, Việt Nam' },
];

/**
 * Google Places & Location Autocomplete component
 * Powered by Google Maps Places API with intelligent fallback & GPS geolocation
 */
export default function GooglePlacesAutocomplete({
  value = '',
  onChange,
  onSelectPlace,
  placeholder = 'Nhập thành phố, quận, hoặc địa chỉ...',
  className = '',
  id = 'google-places-autocomplete',
}) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const containerRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal state with prop
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Load Google Maps Places API dynamically if key is available
  useEffect(() => {
    if (window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      geocoderRef.current = new window.google.maps.Geocoder();
      setGoogleLoaded(true);
      return;
    }

    if (GOOGLE_MAPS_API_KEY && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=vi&region=VN`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps?.places) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          geocoderRef.current = new window.google.maps.Geocoder();
          setGoogleLoaded(true);
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Place Predictions from Google Maps or Nominatim Geocoding API
  const fetchPredictions = useCallback(async (query) => {
    if (!query || query.trim().length === 0) {
      setPredictions(POPULAR_VIETNAM_PLACES.map(p => ({
        main_text: p.name,
        secondary_text: p.description,
        full_text: p.name,
      })));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. If Google Maps Places Autocomplete is active
    if (window.google?.maps?.places && autocompleteServiceRef.current) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'vn' },
          },
          (results, status) => {
            setIsLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const mapped = results.map((item) => ({
                place_id: item.place_id,
                main_text: item.structured_formatting?.main_text || item.description,
                secondary_text: item.structured_formatting?.secondary_text || '',
                full_text: item.structured_formatting?.main_text || item.description,
              }));
              setPredictions(mapped);
            } else {
              fallbackFetch(query);
            }
          }
        );
        return;
      } catch (err) {
        console.warn('Google Places API error, falling back to Geocoding service:', err);
      }
    }

    // 2. Fallback to OpenStreetMap / Nominatim Vietnam Geocoding API
    await fallbackFetch(query);
  }, []);

  const fallbackFetch = async (query) => {
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=vn&addressdetails=1&limit=6`;
      const res = await fetch(endpoint, {
        headers: { 'Accept-Language': 'vi,en' },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item) => {
          const name = item.name || item.display_name.split(',')[0];
          const parts = item.display_name.split(',').map((p) => p.trim());
          const secondary = parts.slice(1, 4).join(', ');
          return {
            main_text: name,
            secondary_text: secondary,
            full_text: name,
            lat: item.lat,
            lng: item.lon,
          };
        });
        setPredictions(mapped);
      } else {
        // Local filtered popular places
        const filtered = POPULAR_VIETNAM_PLACES.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        ).map((p) => ({
          main_text: p.name,
          secondary_text: p.description,
          full_text: p.name,
        }));
        setPredictions(filtered);
      }
    } catch (e) {
      console.warn('Fallback location search error:', e);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (onChange) onChange(e);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(text);
    }, 250);
  };

  const handleSelect = (item) => {
    const selectedText = item.main_text || item.full_text;
    setInputValue(selectedText);
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: selectedText } });
    }
    if (onSelectPlace) {
      onSelectPlace(item);
    }
  };

  // Get User's Current GPS Location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Try Google Geocoder first
        if (window.google?.maps && geocoderRef.current) {
          try {
            geocoderRef.current.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                setIsLocating(false);
                if (status === 'OK' && results?.[0]) {
                  const place = results[0];
                  // Find city / district from address_components
                  let cityName = '';
                  place.address_components.forEach((c) => {
                    if (c.types.includes('administrative_area_level_1') || c.types.includes('locality')) {
                      cityName = c.long_name;
                    }
                  });
                  const chosenName = cityName || place.formatted_address.split(',')[0];
                  setInputValue(chosenName);
                  setIsOpen(false);
                  if (onChange) onChange({ target: { value: chosenName } });
                  if (onSelectPlace) onSelectPlace({ main_text: chosenName, lat: latitude, lng: longitude });
                }
              }
            );
            return;
          } catch (e) {}
        }

        // Fallback Reverse Geocode via Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.state ||
            data.address?.town ||
            data.address?.county ||
            'Vị trí của tôi';
          setInputValue(city);
          setIsOpen(false);
          if (onChange) onChange({ target: { value: city } });
          if (onSelectPlace) onSelectPlace({ main_text: city, lat: latitude, lng: longitude });
        } catch (err) {
          console.error('Failed to reverse geocode:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation denied or error:', error);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center text-gray-900 w-full">
        <MapPin size={18} className="text-accent-primary mr-2 flex-shrink-0" />
        <input
          id={id}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            fetchPredictions(inputValue);
          }}
          className={`outline-none w-full bg-transparent text-sm placeholder:text-text-muted font-medium pr-6 ${className}`}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              if (onChange) onChange({ target: { value: '' } });
              fetchPredictions('');
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer -ml-5 z-10"
            title="Xóa địa điểm"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* AUTOCOMPLETE FLOATING POPUP MENU */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden min-w-[280px] md:min-w-[340px] animate-fadeIn">
          {/* 1. GPS Current Location Action */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLocating}
            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-emerald-50 text-emerald-700 transition-colors border-b border-gray-100 cursor-pointer font-medium text-xs md:text-sm group"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform">
              {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-emerald-800">
                {isLocating ? 'Đang xác định vị trí...' : 'Sử dụng vị trí hiện tại của tôi'}
              </div>
              <div className="text-[11px] text-emerald-600 truncate">
                Tự động tìm sân xung quanh bạn
              </div>
            </div>
          </button>

          {/* 2. Loading State */}
          {isLoading && (
            <div className="px-4 py-3 flex items-center justify-center gap-2 text-xs text-gray-500">
              <Loader2 size={16} className="animate-spin text-accent-primary" />
              <span>Đang tìm địa điểm từ Google Maps...</span>
            </div>
          )}

          {/* 3. Predictions List */}
          {!isLoading && predictions.length > 0 && (
            <div className="max-h-60 overflow-y-auto py-1">
              <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Gợi ý địa điểm Google Maps
              </div>
              {predictions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-2.5 text-left flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-accent-primary-light group-hover:text-accent-primary transition-colors">
                    <MapPin size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-accent-primary transition-colors truncate">
                      {item.main_text}
                    </div>
                    {item.secondary_text && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {item.secondary_text}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 4. Empty Results */}
          {!isLoading && predictions.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-gray-500">
              Không tìm thấy địa điểm phù hợp trên bản đồ.
            </div>
          )}

          {/* Google Maps Footer attribution */}
          <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
            <span>Dữ liệu bản đồ Google Maps</span>
            <span className="text-gray-300">•</span>
            <span>Việt Nam</span>
          </div>
        </div>
      )}
    </div>
  );
}
