export const SPORT_CATEGORY_FALLBACKS = {
  badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop', // Badminton court
  pickleball: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop', // Pickleball arena
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop', // Football pitch
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop', // Tennis court
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop', // Basketball court
  general: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop'
};

export const SPORT_FALLBACK_IMAGES = Object.values(SPORT_CATEGORY_FALLBACKS);
export const FALLBACK_SPORT_IMAGE = SPORT_CATEGORY_FALLBACKS.general;

/**
 * Generates an intelligent sport-aware fallback image
 * Accurately maps sport names (badminton, pickleball, football, tennis, etc.) to the matching sports image.
 */
export const getDeterministicFallback = (seedOrVenue) => {
  if (!seedOrVenue) return SPORT_CATEGORY_FALLBACKS.general;

  if (typeof seedOrVenue === 'object') {
    const sportStr = (
      seedOrVenue.sport_category ||
      (seedOrVenue.courts && seedOrVenue.courts[0]?.sport_category) ||
      (seedOrVenue.branches && seedOrVenue.branches[0]?.courts && seedOrVenue.branches[0].courts[0]?.sport_category) ||
      seedOrVenue.venue_name ||
      seedOrVenue.name ||
      ''
    ).toLowerCase();

    if (sportStr.includes('cầu lông') || sportStr.includes('badminton')) return SPORT_CATEGORY_FALLBACKS.badminton;
    if (sportStr.includes('pickleball') || sportStr.includes('pickle')) return SPORT_CATEGORY_FALLBACKS.pickleball;
    if (sportStr.includes('bóng đá') || sportStr.includes('football') || sportStr.includes('soccer')) return SPORT_CATEGORY_FALLBACKS.football;
    if (sportStr.includes('tennis') || sportStr.includes('quần vợt')) return SPORT_CATEGORY_FALLBACKS.tennis;
    if (sportStr.includes('bóng rổ') || sportStr.includes('basketball')) return SPORT_CATEGORY_FALLBACKS.basketball;
  }

  if (typeof seedOrVenue === 'string') {
    const s = seedOrVenue.toLowerCase();
    if (s.includes('cầu lông') || s.includes('badminton')) return SPORT_CATEGORY_FALLBACKS.badminton;
    if (s.includes('pickleball') || s.includes('pickle')) return SPORT_CATEGORY_FALLBACKS.pickleball;
    if (s.includes('bóng đá') || s.includes('football') || s.includes('soccer')) return SPORT_CATEGORY_FALLBACKS.football;
    if (s.includes('tennis') || s.includes('quần vợt')) return SPORT_CATEGORY_FALLBACKS.tennis;
    if (s.includes('bóng rổ') || s.includes('basketball')) return SPORT_CATEGORY_FALLBACKS.basketball;
  }

  return SPORT_CATEGORY_FALLBACKS.general;
};

/**
 * Formats relative image paths or external image URLs.
 */
export const getImageUrl = (url, seedKey) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getDeterministicFallback(seedKey);
  }

  const trimmed = url.trim();

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  let backendHost = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) || '';
  if (!backendHost && typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    backendHost = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '');
  }
  if (!backendHost && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    backendHost = 'http://localhost:3000';
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return backendHost ? `${backendHost}${cleanPath}` : cleanPath;
};

/**
 * Standardized Purpose-Driven Venue Image Extraction Utility
 * Exact User Priority Sequence: avatar / cover -> thumbnail_url -> medium_url -> large_url -> original_url
 */
export const getVenueImageUrl = (target, purpose = 'card', venueId) => {
  if (!target) return getDeterministicFallback(venueId);

  if (typeof target === 'string') {
    return getImageUrl(target, venueId);
  }

  let extractedUrl = null;
  const seed = target || venueId || target.venue_id || target.id;

  const extractByPriority = (obj) => {
    if (!obj || typeof obj !== 'object') return null;

    if (purpose === 'avatar' && obj.avatar) return obj.avatar;
    if (purpose === 'cover' && obj.cover) return obj.cover;

    return (
      (purpose === 'avatar' ? obj.avatar : (purpose === 'cover' ? obj.cover : (obj.cover || obj.avatar))) ||
      obj.image_url ||
      obj.thumbnail_url ||
      obj.medium_url ||
      obj.large_url ||
      obj.original_url
    );
  };

  // Check direct target object
  extractedUrl = extractByPriority(target);

  // If target has images array
  if (!extractedUrl && Array.isArray(target.images) && target.images.length > 0) {
    let targetImageObj = null;

    if (purpose === 'cover') {
      targetImageObj = target.images.find(img => typeof img === 'object' && (img.is_cover || img.image_type === 'COVER'));
    } else if (purpose === 'avatar') {
      targetImageObj = target.images.find(img => typeof img === 'object' && (img.is_avatar || img.image_type === 'AVATAR'));
    }

    if (!targetImageObj) {
      targetImageObj = target.images[0];
    }

    if (targetImageObj) {
      if (typeof targetImageObj === 'string') {
        extractedUrl = targetImageObj;
      } else {
        extractedUrl = extractByPriority(targetImageObj);
      }
    }
  }

  return getImageUrl(extractedUrl, seed);
};
