import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBridge } from './useBridge';

// Mock services
vi.mock('../services/spotify', () => ({
  extractPlaylistId: (url) => url.includes('playlist/') ? 'sp-playlist-id' : null,
  getPlaylistTracks: async () => [
    { title: 'Song A', artist: 'Artist A' },
    { title: 'Song B', artist: 'Artist B' },
  ],
  searchTrack: async (title) => title === 'Song A' ? 'spotify:track:uri-a' : null,
  createPlaylist: async () => 'new-sp-playlist-id',
  addTracksToPlaylist: vi.fn(async () => {}),
}));

vi.mock('../services/youtube', () => ({
  extractPlaylistId: (url) => url.includes('list=') ? 'yt-playlist-id' : null,
  getPlaylistTracks: async () => [{ title: 'Song A', artist: '' }],
  searchVideo: async (title) => title === 'Song A' ? 'video-id-1' : null,
  createPlaylist: async () => ({ playlistId: 'new-yt-id', url: 'https://www.youtube.com/playlist?list=new-yt-id' }),
  addVideosToPlaylist: vi.fn(async () => ({ failedCount: 0 })),
}));

const BASE_PROPS = {
  spotifyToken: 'sp-token',
  googleToken: 'g-token',
  onRateLimit: vi.fn(),
};

describe('useBridge — Pia (Spotify → YouTube)', () => {
  it('returns urlerror for invalid URL', async () => {
    const { result } = renderHook(() => useBridge(BASE_PROPS));
    let err;
    await act(async () => { err = await result.current.convertPia('https://evil.com/playlist/x'); });
    expect(err).toBe('urlerror');
  });

  it('returns needboth when tokens missing', async () => {
    const { result } = renderHook(() => useBridge({ ...BASE_PROPS, spotifyToken: null }));
    let err;
    await act(async () => { err = await result.current.convertPia('https://open.spotify.com/playlist/abc'); });
    expect(err).toBe('needboth');
  });

  it('completes and sets results with matched/missed', async () => {
    const { result } = renderHook(() => useBridge(BASE_PROPS));
    await act(async () => {
      await result.current.convertPia('https://open.spotify.com/playlist/abc');
    });

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.results.matched).toBe(1);
    expect(result.current.results.missed).toEqual(['Song B – Artist B']);
    expect(result.current.results.url).toContain('youtube.com');
  });

  it('tracks missed songs with title and artist in Pia direction', async () => {
    const { result } = renderHook(() => useBridge(BASE_PROPS));
    await act(async () => {
      await result.current.convertPia('https://open.spotify.com/playlist/abc');
    });
    await waitFor(() => expect(result.current.status).toBe('done'));
    // Song B doesn't match (mock returns null for non-'Song A' titles)
    expect(result.current.results.missed).toContain('Song B – Artist B');
  });
});

describe('useBridge — Illu (YouTube → Spotify)', () => {
  it('returns urlerror for invalid URL', async () => {
    const { result } = renderHook(() => useBridge(BASE_PROPS));
    let err;
    await act(async () => { err = await result.current.convertIllu('https://evil.com/watch?v=x'); });
    expect(err).toBe('urlerror');
  });

  it('completes and sets results', async () => {
    const { result } = renderHook(() => useBridge(BASE_PROPS));
    await act(async () => {
      await result.current.convertIllu('https://www.youtube.com/playlist?list=PLabc');
    });

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.results.matched).toBe(1);
    expect(result.current.results.url).toContain('spotify.com');
  });
});

describe('useBridge — reset', () => {
  it('resets status and results to idle/null', async () => {
    const { result } = renderHook(() => useBridge(BASE_PROPS));
    await act(async () => {
      await result.current.convertIllu('https://www.youtube.com/playlist?list=PLabc');
    });
    await waitFor(() => expect(result.current.status).toBe('done'));

    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.results).toBeNull();
  });
});
