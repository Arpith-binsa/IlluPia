// api/rate-limit.js
// In-memory sliding window rate limiter for Vercel Edge Functions.
// Shared state persists within a single edge node's lifetime.
// For high-traffic production: replace with Vercel KV (Redis).

/** ip → [timestamp, timestamp, ...] */
const store = new Map();
// NOTE: If x-forwarded-for is absent, all anonymous requests share the 'unknown' bucket.
// This is a known limitation of in-memory rate limiting without a request ID.

const WINDOW_MS = 60_000; // 1 minute sliding window
const MAX_REQUESTS = 10;  // per IP per window

/**
 * Check and record a request from the given IP.
 * Returns { allowed: boolean, retryAfter: number (seconds) }.
 *
 * OWASP: rate limiting protects against DoS and API abuse.
 */
export function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = (store.get(ip) || []).filter(ts => now - ts < WINDOW_MS);

  // Note: when all previous timestamps have expired, we clear and immediately
  // reset the entry on the next store.set below. The delete here avoids leaving
  // an empty array permanently if this IP never makes another request.
  if (timestamps.length === 0) {
    store.delete(ip);
  }

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - timestamps[0])) / 1000);
    return { allowed: false, retryAfter };
  }

  store.set(ip, [...timestamps, now]);
  return { allowed: true, retryAfter: 0 };
}
