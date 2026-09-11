export const SPORT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop'
];

export const FALLBACK_SPORT_IMAGE = SPORT_FALLBACK_IMAGES[0];

export const getDeterministicFallback = (seedKey) => {
  if (!seedKey) return SPORT_FALLBACK_IMAGES[0];
  let hash = 0;
  const str = String(seedKey);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SPORT_FALLBACK_IMAGES.length;
  return SPORT_FALLBACK_IMAGES[index];
};

export const getImageUrl = (url, seedKey) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getDeterministicFallback(seedKey);
  }

  let trimmed = url.trim();

  const currentHost = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : 'localhost';
  const currentProto = (typeof window !== 'undefined' && window.location?.protocol) ? window.location.protocol : 'http:';
  const defaultBackend = `${currentProto}//${currentHost}:3000`;

  const backendHost =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
      : '') ||
    defaultBackend;

  if (trimmed.includes('localhost:3000') || trimmed.includes('127.0.0.1:3000')) {
    trimmed = trimmed.replace(/localhost:3000/g, `${currentHost}:3000`).replace(/127.0.0.1:3000/g, `${currentHost}:3000`);
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendHost}${cleanPath}`;
};

export const getVenueImageUrl = (target, purpose = 'card', venueId) => {
  if (!target) return getDeterministicFallback(venueId);

  if (typeof target === 'string') {
    return getImageUrl(target, venueId);
  }

  let extractedUrl = null;
  const seed = venueId || target.venue_id || target.id;

  const extractByPriority = (obj) => {
    if (!obj || typeof obj !== 'object') return null;

    if (purpose === 'avatar' && obj.avatar) return obj.avatar;
    if (purpose === 'cover' && obj.cover) return obj.cover;

    return (
      (purpose === 'avatar' ? obj.avatar : (purpose === 'cover' ? obj.cover : (obj.cover || obj.avatar))) ||
      obj.thumbnail_url ||
      obj.medium_url ||
      obj.large_url ||
      obj.original_url
    );
  };

  extractedUrl = extractByPriority(target);

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
