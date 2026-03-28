// YouTube API client.
// All YouTube Data API v3 calls go through /api/youtube-search (Edge Function)
// so that GOOGLE_API_KEY never reaches the browser.

const PROXY = '/api/youtube-search';

/** Extract YouTube playlist ID from a playlist URL (list= param) */
export function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

/**
 * Fetch all items from a YouTube playlist via Edge Function proxy.
 * Returns [{title: string, artist: ''}]
 * (YouTube playlist items don't include artist — title only)
 */
export async function getPlaylistTracks(playlistId) {
  const items = [];
  let pageToken = '';

  do {
    const url =
      `${PROXY}?action=playlist&playlistId=${encodeURIComponent(playlistId)}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');

    const res = await fetch(url);
    if (res.status === 429) {
      throw Object.assign(new Error('Rate limit exceeded'), { code: 'ratelimit' });
    }
    if (!res.ok) throw new Error(`YouTube proxy error: ${res.status}`);

    const data = await res.json();
    for (const item of data.items ?? []) {
      items.push({
        title: item.snippet?.title ?? '',
        artist: '',
      });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);

  return items;
}

/**
 * Search YouTube for a video matching title + artist via Edge Function proxy.
 * Returns videoId or null.
 */
export async function searchVideo(title, artist) {
  const q = `${title} ${artist}`.trim();
  const res = await fetch(
    `${PROXY}?action=search&q=${encodeURIComponent(q)}`
  );
  if (res.status === 429) {
    throw Object.assign(new Error('Rate limit exceeded'), { code: 'ratelimit' });
  }
  if (!res.ok) return null;

  const data = await res.json();
  return data.items?.[0]?.id?.videoId ?? null;
}

/**
 * Create a new YouTube playlist for the authenticated user.
 * Returns { playlistId, url }
 * Note: uses the YouTube Data API directly (authenticated call, no proxy needed)
 */
export async function createPlaylist(name, token) {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ snippet: { title: name } }),
    }
  );
  if (!res.ok) throw new Error(`Create YouTube playlist failed: ${res.status}`);
  const data = await res.json();
  return {
    playlistId: data.id,
    url: `https://www.youtube.com/playlist?list=${data.id}`,
  };
}

/**
 * Add video IDs to a YouTube playlist.
 * Adds one at a time — YouTube's batch insert is not available in v3.
 */
export async function addVideosToPlaylist(playlistId, videoIds, token) {
  const failed = [];
  for (const videoId of videoIds) {
    const res = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          playlistId,
          resourceId: { kind: 'youtube#video', videoId },
        },
      }),
    });
    // Collect failures — a single missing video shouldn't abort the whole playlist
    if (!res.ok) failed.push(videoId);
  }
  return { failedCount: failed.length };
}
