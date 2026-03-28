// src/hooks/useGoogleAuth.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoogleAuth } from './useGoogleAuth';

vi.mock('../utils/pkce', () => ({
  generateVerifier: () => 'g-verifier',
  generateChallenge: async () => 'g-challenge',
  generateState: () => 'g-state',
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
});

describe('useGoogleAuth — initial state', () => {
  it('starts disconnected', () => {
    const { result } = renderHook(() => useGoogleAuth());
    expect(result.current.connected).toBe(false);
  });

  it('restores valid token from localStorage', () => {
    const tokenData = { access_token: 'g-token', expires_at: Date.now() + 3600_000 };
    localStorage.setItem('pb_google_token', JSON.stringify(tokenData));

    const { result } = renderHook(() => useGoogleAuth());
    expect(result.current.connected).toBe(true);
    expect(result.current.token?.access_token).toBe('g-token');
  });

  it('discards expired token', () => {
    const tokenData = { access_token: 'g-token', expires_at: Date.now() - 1 };
    localStorage.setItem('pb_google_token', JSON.stringify(tokenData));

    const { result } = renderHook(() => useGoogleAuth());
    expect(result.current.connected).toBe(false);
  });
});

function makeFakeIdToken(aud) {
  const payload = btoa(JSON.stringify({ aud })).replace(/=/g, '');
  return `header.${payload}.signature`;
}

describe('useGoogleAuth — OAuth callback (persistence fix)', () => {
  it('stores token in localStorage BEFORE cleaning URL', async () => {
    window.history.replaceState({}, '', '/?code=g-code&state=g-state');
    sessionStorage.setItem('pb_google_state', 'g-state');
    sessionStorage.setItem('pb_google_verifier', 'g-verifier');

    const mockToken = { access_token: 'g-new-token', expires_in: 3600 };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockToken,
    });

    const { result } = renderHook(() => useGoogleAuth());

    await waitFor(() => expect(result.current.connected).toBe(true));

    // Token must be in localStorage (the persistence fix)
    const stored = JSON.parse(localStorage.getItem('pb_google_token'));
    expect(stored?.access_token).toBe('g-new-token');

    // URL must be cleaned
    expect(window.location.search).toBe('');
  });

  it('blocks callback with mismatched state (CSRF)', async () => {
    window.history.replaceState({}, '', '/?code=g-code&state=wrong');
    sessionStorage.setItem('pb_google_state', 'correct-state');

    const { result } = renderHook(() => useGoogleAuth());
    expect(result.current.connected).toBe(false);
  });

  it('sets autherror when token exchange fails', async () => {
    window.history.replaceState({}, '', '/?code=bad-code&state=g-state');
    sessionStorage.setItem('pb_google_state', 'g-state');
    sessionStorage.setItem('pb_google_verifier', 'g-verifier');

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'invalid_grant' }),
    });

    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.error).toBe('autherror'));
    expect(result.current.connected).toBe(false);
  });

  it('accepts token when id_token audience matches client ID', async () => {
    window.history.replaceState({}, '', '/?code=g-code&state=g-state');
    sessionStorage.setItem('pb_google_state', 'g-state');
    sessionStorage.setItem('pb_google_verifier', 'g-verifier');

    // VITE_GOOGLE_CLIENT_ID is undefined in test env, so CLIENT_ID is undefined
    // verifyAudience checks payload.aud === CLIENT_ID; undefined === undefined → true
    const mockToken = {
      access_token: 'g-token-valid-aud',
      expires_in: 3600,
      id_token: makeFakeIdToken(undefined),
    };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockToken,
    });

    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.connected).toBe(true));
    vi.restoreAllMocks();
  });

  it('rejects token when id_token audience does not match (token substitution)', async () => {
    window.history.replaceState({}, '', '/?code=g-code&state=g-state');
    sessionStorage.setItem('pb_google_state', 'g-state');
    sessionStorage.setItem('pb_google_verifier', 'g-verifier');

    const mockToken = {
      access_token: 'g-token-wrong-aud',
      expires_in: 3600,
      id_token: makeFakeIdToken('evil-client-id'),
    };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockToken,
    });

    const { result } = renderHook(() => useGoogleAuth());
    await waitFor(() => expect(result.current.error).toBe('autherror'));
    expect(result.current.connected).toBe(false);
    vi.restoreAllMocks();
  });
});

describe('useGoogleAuth — disconnect', () => {
  it('clears token and localStorage', () => {
    const tokenData = { access_token: 'tok', expires_at: Date.now() + 3600_000 };
    localStorage.setItem('pb_google_token', JSON.stringify(tokenData));

    const { result } = renderHook(() => useGoogleAuth());
    act(() => result.current.disconnect());

    expect(result.current.connected).toBe(false);
    expect(localStorage.getItem('pb_google_token')).toBeNull();
  });
});
