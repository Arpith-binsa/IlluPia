import { useState, useCallback } from 'react';
import { validatePlaylistUrl } from '../utils/sanitize';
import * as spotify from '../services/spotify';
import * as youtube from '../services/youtube';

/**
 * Orchestrates playlist conversion in both directions.
 * Status progression: idle → loading → searching → creating → done | error
 */
export function useBridge({ spotifyToken, googleToken, onRateLimit }) {
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null); // { matched, missed, url }

  /** Pia — Spotify playlist → new YouTube Music playlist */
  const convertPia = useCallback(async (rawUrl) => {
    // OWASP: validate and sanitize URL before any processing
    const url = validatePlaylistUrl(rawUrl);
    if (!url) return 'urlerror';
    if (!spotifyToken || !googleToken) return 'needboth';

    setStatus('loading');
    try {
      const playlistId = spotify.extractPlaylistId(url);
      if (!playlistId) { setStatus('idle'); return 'urlerror'; }

      // Fetch source tracks from Spotify
      const tracks = await spotify.getPlaylistTracks(playlistId, spotifyToken);

      setStatus('searching');
      const matchedVideoIds = [];
      const missed = [];

      for (const track of tracks) {
        const videoId = await youtube.searchVideo(track.title, track.artist);
        if (videoId) matchedVideoIds.push(videoId);
        else missed.push(`${track.title} – ${track.artist}`);
      }

      setStatus('creating');
      const { playlistId: ytId, url: ytUrl } =
        await youtube.createPlaylist('IlluPia Import', googleToken);
      await youtube.addVideosToPlaylist(ytId, matchedVideoIds, googleToken);

      setResults({ matched: matchedVideoIds.length, missed, url: ytUrl });
      setStatus('done');
    } catch (err) {
      if (err?.code === 'ratelimit') {
        onRateLimit?.();
        setStatus('idle');
        return 'ratelimit';
      }
      setStatus('error');
    }
    return null;
  }, [spotifyToken, googleToken, onRateLimit]);

  /** Illu — YouTube playlist → new Spotify playlist */
  const convertIllu = useCallback(async (rawUrl) => {
    const url = validatePlaylistUrl(rawUrl);
    if (!url) return 'urlerror';
    if (!spotifyToken || !googleToken) return 'needboth';

    setStatus('loading');
    try {
      const playlistId = youtube.extractPlaylistId(url);
      if (!playlistId) { setStatus('idle'); return 'urlerror'; }

      // Fetch source tracks from YouTube (via Edge Function proxy)
      const tracks = await youtube.getPlaylistTracks(playlistId);

      setStatus('searching');
      const matchedUris = [];
      const missed = [];

      for (const track of tracks) {
        const uri = await spotify.searchTrack(track.title, track.artist, spotifyToken);
        if (uri) matchedUris.push(uri);
        else missed.push(track.title);
      }

      setStatus('creating');
      const spPlaylistId = await spotify.createPlaylist('IlluPia Import', spotifyToken);
      await spotify.addTracksToPlaylist(spPlaylistId, matchedUris, spotifyToken);

      const spUrl = `https://open.spotify.com/playlist/${spPlaylistId}`;
      setResults({ matched: matchedUris.length, missed, url: spUrl });
      setStatus('done');
    } catch (err) {
      if (err?.code === 'ratelimit') {
        onRateLimit?.();
        setStatus('idle');
        return 'ratelimit';
      }
      setStatus('error');
    }
    return null;
  }, [spotifyToken, googleToken, onRateLimit]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResults(null);
  }, []);

  return { status, results, convertPia, convertIllu, reset };
}
