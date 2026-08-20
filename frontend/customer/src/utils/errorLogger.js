/**
 * Production-safe Error Logging Utility for SportHub Customer Frontend
 * Sanitizes sensitive credentials and provides structured diagnostic logging.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'jwt',
  'cookie'
]);

/**
 * Sanitizes an object to remove credentials before logging
 */
function sanitize(obj, depth = 0) {
  if (depth > 3 || !obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('pass') || lowerKey.includes('secret')) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitize(value, depth + 1);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Logs an error with structured context safely
 * @param {Object} options
 * @param {string} options.source - Module name (e.g. 'map', 'search', 'booking')
 * @param {string} options.action - Action that failed (e.g. 'fetchVenuesByBounds', 'locateMe')
 * @param {Error|Object|string} options.error - The caught error
 * @param {Object} [options.metadata] - Additional non-sensitive context
 */
export function logError({ source = 'app', action = 'general', error = null, metadata = {} }) {
  // Ignore deliberate user cancellations
  if (
    error?.name === 'AbortError' ||
    error?.name === 'CanceledError' ||
    error?.code === 'ERR_CANCELED'
  ) {
    return;
  }

  const timestamp = new Date().toISOString();
  const requestId = error?.response?.headers?.['x-request-id'] || metadata?.requestId || null;
  const status = error?.response?.status || error?.status || null;
  const message = error?.response?.data?.message || error?.message || String(error);

  const errorPayload = {
    timestamp,
    source,
    action,
    message,
    status,
    requestId,
    metadata: sanitize(metadata)
  };

  if (import.meta.env?.DEV) {
    console.error(`[SportHub ${source.toUpperCase()}] ${action} failed:`, errorPayload, error);
  } else {
    // In production, emit clean non-sensitive diagnostic record
    console.error(`[SportHub Error] [${source}:${action}]`, {
      message,
      status,
      requestId,
      timestamp
    });
  }
}
