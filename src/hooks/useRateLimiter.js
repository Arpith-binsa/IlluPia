import { useCallback } from 'react';

// Rate limit configuration — adjust these if needed
const LIMITS = {
  // OWASP: limit auth attempts to prevent brute-force / abuse
  auth: { max: 5, windowMs: 60_000 },          // 5 attempts per 60s per service
  // Prevent excessive API consumption
  conversion: { max: 3, windowMs: 5 * 60_000 }, // 3 conversions per 5 minutes
};

/** Read stored timestamps from localStorage, pruning those outside the window */
function getTimestamps(key, windowMs) {
  const now = Date.now();
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return stored.filter(ts => now - ts < windowMs);
  } catch {
    return [];
  }
}

/** Persist updated timestamps to localStorage */
function recordAttempt(key, timestamps) {
  localStorage.setItem(key, JSON.stringify([...timestamps, Date.now()]));
}

/**
 * Client-side sliding window rate limiter backed by localStorage.
 * Note: client-side limits are a UX safeguard, not a security boundary.
 * Server-side enforcement is in api/rate-limit.js for the Edge Function.
 */
export function useRateLimiter() {
  const check = useCallback((type, qualifier = '') => {
    const { max, windowMs } = LIMITS[type];
    const key = `pb_rl_${type}_${qualifier}`;
    const timestamps = getTimestamps(key, windowMs);

    if (timestamps.length >= max) {
      // Calculate how long until the oldest entry expires
      const retryAfterMs = windowMs - (Date.now() - timestamps[0]);
      return { allowed: false, retryAfterMs };
    }

    recordAttempt(key, timestamps);
    return { allowed: true, retryAfterMs: 0 };
  }, []);

  return { check };
}
