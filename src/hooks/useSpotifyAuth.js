// src/hooks/useSpotifyAuth.js
import { useState, useEffect, useCallback } from 'react';
import { generateVerifier, generateChallenge, generateState } from '../utils/pkce';

// OWASP: client ID is safe to expose — PKCE flow requires no secret
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = window.location.origin + '/';
const SCOPES = 'playlist-read-private playlist-modify-public playlist-modify-private';

// localStorage / sessionStorage keys
const STORAGE_KEY = 'pb_spotify_token';
const VERIFIER_KEY = 'pb_spotify_verifier';
const STATE_KEY = 'pb_spotify_state';

export function useSpotifyAuth() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const exchangeCode = useCallback(async (code, verifier) => {
    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          code_verifier: verifier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Token exchange failed');

      const tokenData = {
        access_token: data.access_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
      // PERSISTENCE: write to localStorage BEFORE cleaning the URL
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenData));
      setToken(tokenData);
      history.replaceState({}, '', '/');
    } catch {
      setError('autherror');
      localStorage.removeItem(STORAGE_KEY);
      history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    // 1. Try to restore token from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at > Date.now()) {
          setToken(parsed);
          return; // Already authenticated, skip callback check
        }
      } catch { /* malformed — fall through */ }
      localStorage.removeItem(STORAGE_KEY);
    }

    // 2. Handle OAuth callback — verify state param first (CSRF protection)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    const storedState = sessionStorage.getItem(STATE_KEY);

    if (code && returnedState && returnedState === storedState) {
      const verifier = sessionStorage.getItem(VERIFIER_KEY);
      sessionStorage.removeItem(VERIFIER_KEY);
      sessionStorage.removeItem(STATE_KEY);
      exchangeCode(code, verifier);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(async () => {
    if (!CLIENT_ID) { setError('noenv'); return; }

    const verifier = generateVerifier();
    const challenge = await generateChallenge(verifier);
    const state = generateState();

    // Store in sessionStorage (cleared on tab close — safer than localStorage for ephemeral state)
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(STATE_KEY, state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setError(null);
  }, []);

  return { token, error, connected: !!token, connect, disconnect };
}
