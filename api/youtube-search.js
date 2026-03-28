// api/youtube-search.js
// Vercel Edge Function — proxies YouTube Data API v3 requests.
// GOOGLE_API_KEY is a server-only env var, never exposed to the client.
import { checkRateLimit } from './rate-limit.js';

export const config = { runtime: 'edge' };

const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_PLAYLIST_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

// OWASP: strip injection chars from query params before forwarding to upstream
function sanitizeParam(value) {
  return String(value ?? '').replace(/[<>"'`]/g, '').slice(0, 200);
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

export default async function handler(req) {
  // OWASP: enforce rate limit by client IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      429,
      { 'Retry-After': String(retryAfter) }
    );
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // OWASP: reject unexpected action values — allowlist only
  if (!['search', 'playlist'].includes(action)) {
    return json({ error: 'Invalid action. Expected "search" or "playlist".' }, 400);
  }

  // OWASP: GOOGLE_API_KEY is server-only — never sent to the client
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server misconfigured. Contact admin.' }, 500);
  }

  try {
    let upstreamUrl;

    if (action === 'search') {
      // Proxy a YouTube video search
      const q = sanitizeParam(searchParams.get('q'));
      if (!q) return json({ error: 'Missing query parameter "q".' }, 400);
      upstreamUrl =
        `${YT_SEARCH_URL}?part=snippet&type=video&maxResults=1` +
        `&q=${encodeURIComponent(q)}&key=${apiKey}`;
    } else {
      // Proxy a YouTube playlist items fetch
      const playlistId = sanitizeParam(searchParams.get('playlistId'));
      if (!playlistId) return json({ error: 'Missing parameter "playlistId".' }, 400);
      upstreamUrl =
        `${YT_PLAYLIST_URL}?part=snippet&maxResults=50` +
        `&playlistId=${encodeURIComponent(playlistId)}&key=${apiKey}`;
    }

    const upstreamRes = await fetch(upstreamUrl);
    const data = await upstreamRes.json();

    return json(data, upstreamRes.status);
  } catch {
    return json({ error: 'Upstream YouTube API error.' }, 502);
  }
}
