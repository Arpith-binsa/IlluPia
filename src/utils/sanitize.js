// OWASP input validation — strip injection chars, enforce limits, allowlist URLs

/** Characters that enable XSS/injection attacks — stripped from all user input */
const DANGEROUS_CHARS = /[<>"'`]/g;

/** Hard max on any user-supplied string */
const MAX_LENGTH = 512;

/**
 * Domains allowed for playlist URLs and result redirect links.
 * Validated via URL parser — not string matching — to prevent bypass.
 */
export const URL_ALLOWLIST = [
  'open.spotify.com',
  'www.youtube.com',
  'music.youtube.com',
];

/**
 * Strip dangerous characters and enforce max length.
 * Returns empty string for non-string inputs.
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.replace(DANGEROUS_CHARS, '').slice(0, MAX_LENGTH);
}

/**
 * Validate a playlist URL against the allowlist.
 * Returns the sanitized URL string if valid, null if not.
 * Only https:// URLs on allowlisted domains are accepted.
 */
export function validatePlaylistUrl(raw) {
  const cleaned = sanitizeString(raw);
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.port !== '') return null;   // reject non-standard ports
    if (!URL_ALLOWLIST.includes(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Return a new object containing only the specified keys.
 * Rejects unexpected fields before passing data to any API call.
 */
export function pickFields(obj, allowedKeys) {
  if (typeof obj !== 'object' || obj === null) return {};
  return Object.fromEntries(
    allowedKeys.filter(k => k in obj).map(k => [k, obj[k]])
  );
}
