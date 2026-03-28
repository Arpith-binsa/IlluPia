// src/hooks/useSpotifyAuth.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSpotifyAuth } from './useSpotifyAuth';

// Mock pkce to return predictable values
vi.mock('../utils/pkce', () => ({
  generateVerifier: () => 'test-verifier',
  generateChallenge: async () => 'test-challenge',
  generateState: () => 'test-state',
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  // Reset URL to clean state
  window.history.replaceState({}, '', '/');
  vi.restoreAllMocks();
});

describe('useSpotifyAuth — initial state', () => {
  it('starts disconnected with no token', () => {
    const { result } = renderHook(() => useSpotifyAuth());
    expect(result.current.connected).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('restores token from localStorage if not expired', () => {
    const tokenData = {
      access_token: 'stored-token',
      expires_at: Date.now() + 3600_000,
    };
    localStorage.setItem('pb_spotify_token', JSON.stringify(tokenData));

    const { result } = renderHook(() => useSpotifyAuth());
    expect(result.current.connected).toBe(true);
    expect(result.current.token?.access_token).toBe('stored-token');
  });

  it('ignores expired token in localStorage', () => {
    const tokenData = {
      access_token: 'old-token',
      expires_at: Date.now() - 1000,
    };
    localStorage.setItem('pb_spotify_token', JSON.stringify(tokenData));

    const { result } = renderHook(() => useSpotifyAuth());
    expect(result.current.connected).toBe(false);
  });
});

describe('useSpotifyAuth — OAuth callback', () => {
  it('exchanges code for token and stores it', async () => {
    // Simulate OAuth callback URL
    window.history.replaceState({}, '', '/?code=auth-code&state=test-state');
    sessionStorage.setItem('pb_spotify_state', 'test-state');
    sessionStorage.setItem('pb_spotify_verifier', 'test-verifier');

    const mockToken = { access_token: 'new-token', expires_in: 3600 };
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockToken,
    });

    const { result } = renderHook(() => useSpotifyAuth());

    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(result.current.token?.access_token).toBe('new-token');
    expect(localStorage.getItem('pb_spotify_token')).toContain('new-token');
    // URL should be cleaned
    expect(window.location.search).toBe('');
  });

  it('rejects callback when state does not match (CSRF)', async () => {
    window.history.replaceState({}, '', '/?code=auth-code&state=wrong-state');
    sessionStorage.setItem('pb_spotify_state', 'expected-state');

    const { result } = renderHook(() => useSpotifyAuth());
    // No fetch should happen, no token set
    expect(result.current.connected).toBe(false);
  });
});

describe('useSpotifyAuth — disconnect', () => {
  it('clears token and localStorage', () => {
    const tokenData = { access_token: 'tok', expires_at: Date.now() + 3600_000 };
    localStorage.setItem('pb_spotify_token', JSON.stringify(tokenData));

    const { result } = renderHook(() => useSpotifyAuth());
    act(() => result.current.disconnect());

    expect(result.current.connected).toBe(false);
    expect(localStorage.getItem('pb_spotify_token')).toBeNull();
  });
});
