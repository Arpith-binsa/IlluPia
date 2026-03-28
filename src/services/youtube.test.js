import { describe, it, expect, vi } from 'vitest';
import {
  extractPlaylistId,
  getPlaylistTracks,
  searchVideo,
  createPlaylist,
  addVideosToPlaylist,
} from './youtube';

describe('extractPlaylistId', () => {
  it('extracts list param from YouTube URL', () => {
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=PLabc123'))
      .toBe('PLabc123');
  });
  it('extracts list param from music.youtube.com', () => {
    expect(extractPlaylistId('https://music.youtube.com/playlist?list=PLxyz'))
      .toBe('PLxyz');
  });
  it('returns null for URL without list param', () => {
    expect(extractPlaylistId('https://www.youtube.com/watch?v=abc')).toBeNull();
  });
});

describe('searchVideo', () => {
  it('returns videoId from proxy response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: { videoId: 'vid123' } }] }),
    });

    const id = await searchVideo('Song A', 'Artist A');
    expect(id).toBe('vid123');
    vi.restoreAllMocks();
  });

  it('returns null when no items', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    });

    expect(await searchVideo('Unknown', '')).toBeNull();
    vi.restoreAllMocks();
  });

  it('throws ratelimit error on 429', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 429 });

    await expect(searchVideo('x', 'y')).rejects.toMatchObject({ code: 'ratelimit' });
    vi.restoreAllMocks();
  });
});

describe('getPlaylistTracks', () => {
  it('returns tracks from playlist proxy response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { snippet: { title: 'Track 1' } },
          { snippet: { title: 'Track 2' } },
        ],
      }),
    });

    const tracks = await getPlaylistTracks('PLabc');
    expect(tracks).toEqual([
      { title: 'Track 1', artist: '' },
      { title: 'Track 2', artist: '' },
    ]);
    vi.restoreAllMocks();
  });

  it('throws ratelimit error on 429', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(getPlaylistTracks('PLabc')).rejects.toMatchObject({ code: 'ratelimit' });
    vi.restoreAllMocks();
  });
});
