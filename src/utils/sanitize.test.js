import { describe, it, expect } from 'vitest';
import { sanitizeString, validatePlaylistUrl, pickFields } from './sanitize';

describe('sanitizeString', () => {
  it('strips < and >', () => {
    expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });
  it('strips double quotes', () => {
    expect(sanitizeString('"hello"')).toBe('hello');
  });
  it('strips single quotes', () => {
    expect(sanitizeString("it's")).toBe('its');
  });
  it('strips backticks', () => {
    expect(sanitizeString('`cmd`')).toBe('cmd');
  });
  it('enforces 512 char max length', () => {
    expect(sanitizeString('a'.repeat(600))).toHaveLength(512);
  });
  it('returns empty string for null', () => {
    expect(sanitizeString(null)).toBe('');
  });
  it('returns empty string for number', () => {
    expect(sanitizeString(42)).toBe('');
  });
  it('preserves safe characters', () => {
    const safe = 'Hello World 123 - _ . ,';
    expect(sanitizeString(safe)).toBe(safe);
  });
});

describe('validatePlaylistUrl', () => {
  it('accepts valid Spotify URL', () => {
    const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
    expect(validatePlaylistUrl(url)).toBe(url);
  });
  it('accepts valid YouTube URL', () => {
    const url = 'https://www.youtube.com/playlist?list=PLbpi6ZahtOH6Ar_3GPy3workz9';
    expect(validatePlaylistUrl(url)).toBe(url);
  });
  it('accepts music.youtube.com URL', () => {
    const url = 'https://music.youtube.com/playlist?list=PLabc123';
    expect(validatePlaylistUrl(url)).toBe(url);
  });
  it('rejects http (non-https)', () => {
    expect(validatePlaylistUrl('http://open.spotify.com/playlist/abc')).toBeNull();
  });
  it('rejects unlisted domain', () => {
    expect(validatePlaylistUrl('https://evil.com/playlist/abc')).toBeNull();
  });
  it('rejects non-URL string', () => {
    expect(validatePlaylistUrl('not-a-url')).toBeNull();
  });
  it('rejects empty string', () => {
    expect(validatePlaylistUrl('')).toBeNull();
  });
  it('rejects non-standard port', () => {
    expect(validatePlaylistUrl('https://open.spotify.com:8080/playlist/abc')).toBeNull();
  });
});

describe('pickFields', () => {
  it('keeps only specified keys', () => {
    expect(pickFields({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });
  it('ignores keys not present in object', () => {
    expect(pickFields({ a: 1 }, ['a', 'z'])).toEqual({ a: 1 });
  });
  it('returns empty object for null input', () => {
    expect(pickFields(null, ['a'])).toEqual({});
  });
  it('returns empty object when no allowed keys match', () => {
    expect(pickFields({ secret: 'x' }, ['a', 'b'])).toEqual({});
  });
});
