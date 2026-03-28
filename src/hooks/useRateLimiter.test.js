import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRateLimiter } from './useRateLimiter';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

describe('useRateLimiter — auth (5 per 60s)', () => {
  it('allows first 5 auth attempts', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 5; i++) {
      const { allowed } = result.current.check('auth', 'spotify');
      expect(allowed).toBe(true);
    }
  });

  it('blocks 6th auth attempt within window', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 5; i++) act(() => result.current.check('auth', 'spotify'));
    const { allowed } = result.current.check('auth', 'spotify');
    expect(allowed).toBe(false);
  });

  it('includes retryAfterMs when blocked', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 5; i++) act(() => result.current.check('auth', 'spotify'));
    const { retryAfterMs } = result.current.check('auth', 'spotify');
    expect(retryAfterMs).toBeGreaterThan(0);
  });

  it('allows again after window expires', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 5; i++) act(() => result.current.check('auth', 'spotify'));
    // Advance past the 60s window
    vi.advanceTimersByTime(61_000);
    const { allowed } = result.current.check('auth', 'spotify');
    expect(allowed).toBe(true);
  });

  it('tracks qualifiers independently (spotify vs google)', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 5; i++) act(() => result.current.check('auth', 'spotify'));
    // google should still be allowed
    const { allowed } = result.current.check('auth', 'google');
    expect(allowed).toBe(true);
  });
});

describe('useRateLimiter — conversion (3 per 5min)', () => {
  it('allows first 3 conversions', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 3; i++) {
      const { allowed } = result.current.check('conversion');
      expect(allowed).toBe(true);
    }
  });

  it('blocks 4th conversion within window', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 3; i++) act(() => result.current.check('conversion'));
    const { allowed } = result.current.check('conversion');
    expect(allowed).toBe(false);
  });

  it('allows again after 5min window', () => {
    const { result } = renderHook(() => useRateLimiter());
    for (let i = 0; i < 3; i++) act(() => result.current.check('conversion'));
    vi.advanceTimersByTime(5 * 60_000 + 1000);
    const { allowed } = result.current.check('conversion');
    expect(allowed).toBe(true);
  });
});
