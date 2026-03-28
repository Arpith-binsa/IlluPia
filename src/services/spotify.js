// Spotify Web API client — all calls require a valid access token

const API = 'https://api.spotify.com/v1';

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** Extract Spotify playlist ID from a playlist URL */
export function extractPlaylistId(url) {
  const match = url.match(/playlist\/([A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

/**
 * Fetch all tracks from a Spotify playlist.
 * Handles pagination via the `next` cursor.
 * Returns [{title: string, artist: string}]
 */
export async function getPlaylistTracks(playlistId, token) {
  const tracks = [];
  // Request only the fields we need (reduces response size)
  let url =
    `${API}/playlists/${encodeURIComponent(playlistId)}/tracks` +
    `?fields=next,items(track(name,artists(name)))&limit=50`;

  while (url) {
    const res = await fetch(url, { headers: authHeaders(token) });
    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
    const data = await res.json();

    for (const item of data.items) {
      // Skip local files and null tracks
      if (!item.track) continue;
      tracks.push({
        title: item.track.name,
        artist: item.track.artists[0]?.name ?? '',
      });
    }
    url = data.next; // null when last page
  }
  return tracks;
}

/**
 * Search Spotify for a track by title + artist.
 * Returns the best-match track URI or null.
 */
export async function searchTrack(title, artist, token) {
  // Trim to 200 chars — Spotify search doesn't benefit from longer queries
  const q = encodeURIComponent(`${title} ${artist}`.trim().slice(0, 200));
  const res = await fetch(`${API}/search?q=${q}&type=track&limit=1`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.tracks?.items?.[0]?.uri ?? null;
}

/**
 * Create a new public Spotify playlist for the authenticated user.
 * Returns the new playlist's ID.
 */
export async function createPlaylist(name, token) {
  const meRes = await fetch(`${API}/me`, { headers: authHeaders(token) });
  if (!meRes.ok) throw new Error('Could not fetch Spotify user');
  const { id: userId } = await meRes.json();

  const res = await fetch(`${API}/users/${encodeURIComponent(userId)}/playlists`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, public: true }),
  });
  if (!res.ok) throw new Error(`Create playlist failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

/**
 * Add track URIs to a Spotify playlist.
 * Spotify allows max 100 URIs per request — batched automatically.
 */
export async function addTracksToPlaylist(playlistId, uris, token) {
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);
    const res = await fetch(
      `${API}/playlists/${encodeURIComponent(playlistId)}/tracks`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ uris: batch }),
      }
    );
    if (!res.ok) throw new Error(`Add tracks failed: ${res.status}`);
  }
}
