// src/hooks/useGoogleAuth.js
import { useState, useEffect, useCallback } from 'react';
import { generateVerifier, generateChallenge, generateState } from '../utils/pkce';

// OWASP: client ID is safe to expose — PKCE requires no secret
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = window.location.origin + '/';
// YouTube scope required to create playlists and add items
const SCOPES = 'https://www.googleapis.com/auth/youtube';

const STORAGE_KEY = 'pb_google_token';
const VERIFIER_KEY = 'pb_google_verifier';
const STATE_KEY = 'pb_google_state';

/**
 * Verify Google ID token audience claim.
 * OWASP: prevents token substitution attacks.
 */
function verifyAudience(idToken) {
  try {
    // JWT payload is the second segment, base64url-encoded
    const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.aud === CLIENT_ID;
  } catch {
    return false;
  }
}

export function useGoogleAuth() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const exchangeCode = useCallback(async (code, verifier) => {
    try {
      // DEBUG: log token exchange params (partial values only — remove before prod)
      console.log('[GoogleAuth] token exchange debug:', {
        grant_type: 'authorization_code',
        code_prefix: code ? code.slice(0, 10) : 'NULL/UNDEFINED',
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier_prefix: verifier ? verifier.slice(0, 10) : 'NULL/UNDEFINED',
        code_verifier_type: typeof verifier,
      });
      console.log('[GoogleAuth] sessionStorage verifier at exchange time:',
        sessionStorage.getItem(VERIFIER_KEY) === null ? 'NULL (already removed or never set)' : 'present'
      );

      const res = await fetch('https://oauth2.googleapis.com/token', {
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

      // OWASP: verify token audience if id_token is present
      if (data.id_token && !verifyAudience(data.id_token)) {
        throw new Error('Token audience mismatch — possible token substitution attack');
      }

      const tokenData = {
        access_token: data.access_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      // PERSISTENCE FIX: write token to localStorage BEFORE cleaning URL.
      // Bug was: history.replaceState was called first, then token stored —
      // on page reload the code param was gone but localStorage was empty too.
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
    // 1. Restore from localStorage first (this is the persistence fix)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at > Date.now()) {
          setToken(parsed);
          return;
        }
      } catch { /* malformed */ }
      localStorage.removeItem(STORAGE_KEY);
    }

    // 2. Handle OAuth callback — CSRF check via state param
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
      access_type: 'offline', // Request refresh token
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setError(null);
  }, []);

  return { token, error, connected: !!token, connect, disconnect };
}
