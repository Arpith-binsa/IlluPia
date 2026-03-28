import { describe, it, expect } from 'vitest';
import { generateVerifier, generateChallenge, generateState } from './pkce';

describe('generateVerifier', () => {
  it('returns a base64url string with no padding chars', () => {
    const v = generateVerifier();
    expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(v).not.toContain('=');
    expect(v).not.toContain('+');
    expect(v).not.toContain('/');
  });

  it('returns at least 100 characters (128 bytes encoded)', () => {
    expect(generateVerifier().length).toBeGreaterThan(100);
  });

  it('generates a different value each call', () => {
    expect(generateVerifier()).not.toBe(generateVerifier());
  });

  it('returns at most 128 characters (RFC 7636 §4.1 maximum)', () => {
    expect(generateVerifier().length).toBeLessThanOrEqual(128);
  });
});

describe('generateChallenge', () => {
  it('returns a base64url string with no padding', async () => {
    const challenge = await generateChallenge(generateVerifier());
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).not.toContain('=');
  });

  it('is deterministic for the same verifier', async () => {
    const verifier = generateVerifier();
    const c1 = await generateChallenge(verifier);
    const c2 = await generateChallenge(verifier);
    expect(c1).toBe(c2);
  });

  it('produces different challenges for different verifiers', async () => {
    const c1 = await generateChallenge(generateVerifier());
    const c2 = await generateChallenge(generateVerifier());
    expect(c1).not.toBe(c2);
  });
});

describe('generateState', () => {
  it('returns a base64url string', () => {
    const s = generateState();
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(s.length).toBeGreaterThan(20);
  });

  it('generates a different value each call', () => {
    expect(generateState()).not.toBe(generateState());
  });
});
