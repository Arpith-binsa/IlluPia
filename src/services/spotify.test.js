import { describe, it, expect, vi } from 'vitest';
import {
  extractPlaylistId,
  getPlaylistTracks,
  searchTrack,
  createPlaylist,
  addTracksToPlaylist,
} from './spotify';

describe('extractPlaylistId', () => {
  it('extracts ID from standard Spotify playlist URL', () => {
    expect(extractPlaylistId('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'))
      .toBe('37i9dQZF1DXcBWIGoYBM5M');
  });
  it('extracts ID with query params', () => {
    expect(extractPlaylistId('https://open.spotify.com/playlist/abc123?si=xyz'))
      .toBe('abc123');
  });
  it('returns null for non-playlist URL', () => {
    expect(extractPlaylistId('https://open.spotify.com/track/abc')).toBeNull();
  });
});

describe('getPlaylistTracks', () => {
  it('fetches tracks and returns [{title, artist}]', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        next: null,
        items: [
          { track: { name: 'Song A', artists: [{ name: 'Artist A' }] } },
          { track: { name: 'Song B', artists: [{ name: 'Artist B' }] } },
        ],
      }),
    });

    const tracks = await getPlaylistTracks('playlist123', 'access-token');
    expect(tracks).toEqual([
      { title: 'Song A', artist: 'Artist A' },
      { title: 'Song B', artist: 'Artist B' },
    ]);
    vi.restoreAllMocks();
  });

  it('skips null tracks', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        next: null,
        items: [{ track: null }, { track: { name: 'Song C', artists: [{ name: 'Artist C' }] } }],
      }),
    });

    const tracks = await getPlaylistTracks('pl', 'tok');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].title).toBe('Song C');
    vi.restoreAllMocks();
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(getPlaylistTracks('pl', 'tok')).rejects.toThrow('Spotify API error: 401');
    vi.restoreAllMocks();
  });
});

describe('searchTrack', () => {
  it('returns track URI on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: { items: [{ uri: 'spotify:track:abc' }] } }),
    });

    const uri = await searchTrack('Song A', 'Artist A', 'tok');
    expect(uri).toBe('spotify:track:abc');
    vi.restoreAllMocks();
  });

  it('returns null when no results', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: { items: [] } }),
    });

    expect(await searchTrack('Unknown', '', 'tok')).toBeNull();
    vi.restoreAllMocks();
  });
});
