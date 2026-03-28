// OWASP PKCE implementation — RFC 7636

/** Generate a cryptographically random base64url string of `byteLength` bytes */
function randomBase64url(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  // btoa produces standard base64; replace chars for base64url (RFC 4648 §5)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE code_verifier.
 * 128 random bytes → base64url (~171 chars). Stored in sessionStorage.
 */
export function generateVerifier() {
  return randomBase64url(128);
}

/**
 * Generate PKCE code_challenge from verifier.
 * SHA-256(verifier) → base64url. Sent to auth server.
 */
export async function generateChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate CSRF state token.
 * 32 random bytes → base64url. Verified on OAuth callback.
 */
export function generateState() {
  return randomBase64url(32);
}
