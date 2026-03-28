# IlluPia — Playlist Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build IlluPia — a secure React + Vite SPA with Vercel Edge Functions that converts playlists between Spotify and YouTube Music in both directions, with hardened OAuth, rate limiting, input sanitization, and no server-side secrets exposed to the client.

**Architecture:** Hooks + thin UI components pattern. Custom hooks (`useSpotifyAuth`, `useGoogleAuth`, `useRateLimiter`, `useBridge`) own all logic. UI components are stateless. A Vercel Edge Function proxies all YouTube Data API v3 calls so `GOOGLE_API_KEY` never reaches the browser.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Vitest 2, @testing-library/react, Vercel Edge Functions (Web API runtime)

---

## File Map

| File | Responsibility |
|---|---|
| `vite.config.js` | Vite + Vitest config, build-time env guard |
| `index.html` | Entry HTML, Outfit font, meta tags |
| `src/main.jsx` | React root mount |
| `src/App.jsx` | Shell — lang gate, auth, bridge panels |
| `src/translations.js` | en + se strings (moved from root) |
| `src/utils/pkce.js` | PKCE verifier, challenge, state generation |
| `src/utils/sanitize.js` | Strip chars, URL allowlist, field filter |
| `src/hooks/useRateLimiter.js` | Client-side sliding window rate limiter |
| `src/hooks/useSpotifyAuth.js` | Spotify PKCE OAuth, token lifecycle |
| `src/hooks/useGoogleAuth.js` | Google PKCE OAuth, persistence fix |
| `src/hooks/useBridge.js` | Orchestrates Pia + Illu conversion |
| `src/services/spotify.js` | Spotify API calls |
| `src/services/youtube.js` | YouTube API calls (via Edge Function proxy) |
| `src/components/LanguagePicker.jsx` | First-visit language selection |
| `src/components/AuthButton.jsx` | Connect/Disconnect for each service |
| `src/components/BridgePanel.jsx` | URL input + Convert button |
| `src/components/ResultsView.jsx` | Matched/Missed + Open link |
| `src/test/setup.js` | Vitest + @testing-library/jest-dom bootstrap |
| `api/rate-limit.js` | Shared IP rate limit utility (Edge runtime) |
| `api/youtube-search.js` | Edge Function — proxy for YT Data API v3 |
| `vercel.json` | SPA rewrite + Edge Function routing |
| `.env.example` | Empty keys with comments |
| `.gitignore` | Excludes .env, node_modules, dist |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/test/setup.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "illupia",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create vite.config.js**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // OWASP: build-time guard — fail fast if required env vars are missing
  if (mode === 'production') {
    const required = ['VITE_SPOTIFY_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID'];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}. Check your Vercel environment settings.`);
      }
    }
  }

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
    },
  };
});
```

- [ ] **Step 4: Create tailwind.config.js**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
// postcss.config.js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 6: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Convert playlists between Spotify and YouTube Music" />
    <title>IlluPia</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create src/main.jsx**

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 8: Create src/index.css**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Outfit', sans-serif;
  background-color: #0d0d0d;
  color: #f0f0f0;
}
```

- [ ] **Step 9: Create src/test/setup.js**

```javascript
// src/test/setup.js
import '@testing-library/jest-dom';
```

- [ ] **Step 10: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
.env.*.local
*.log
.DS_Store
```

- [ ] **Step 11: Create .env.example**

```
# ─────────────────────────────────────────────────────────────
# IlluPia — Environment Configuration
# ─────────────────────────────────────────────────────────────
# 1. Copy this file to .env (NEVER commit .env to version control)
# 2. Replace placeholder values with your real credentials
# 3. .env is already in .gitignore
# ─────────────────────────────────────────────────────────────

# Spotify — PKCE client ID (safe to expose, no secret needed for PKCE)
# Get from: https://developer.spotify.com/dashboard
# Redirect URI to register: https://illupia.com/
VITE_SPOTIFY_CLIENT_ID=

# Google — OAuth 2.0 client ID (safe to expose, no secret needed for PKCE)
# Get from: https://console.cloud.google.com → APIs & Services → Credentials
# Authorized redirect URI to add: https://illupia.com/
# Authorized JavaScript origin to add: https://illupia.com
VITE_GOOGLE_CLIENT_ID=

# ─────────────────────────────────────────────────────────────
# SERVER-ONLY — Set this in Vercel dashboard, NOT here for production
# ─────────────────────────────────────────────────────────────
# Google API Key — restrict to YouTube Data API v3 only
# Get from: https://console.cloud.google.com → APIs & Services → Credentials
# NEVER prefix with VITE_ — this must never reach the browser bundle
GOOGLE_API_KEY=
```

- [ ] **Step 12: Move translations.js to src/**

```bash
mv /path/to/IlluPia/translations.js /path/to/IlluPia/src/translations.js
```

- [ ] **Step 13: Verify dev server starts**

Run: `npm run dev`
Expected: Vite dev server starts on `http://localhost:5173`, no errors.

- [ ] **Step 14: Commit scaffold**

```bash
git add package.json vite.config.js index.html tailwind.config.js postcss.config.js \
  src/main.jsx src/index.css src/test/setup.js src/translations.js \
  .gitignore .env.example
git commit -m "feat: scaffold Vite + React + Tailwind project"
```

---

## Task 2: PKCE Utilities

**Files:**
- Create: `src/utils/pkce.js`
- Create: `src/utils/pkce.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// src/utils/pkce.test.js
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- pkce`
Expected: FAIL — "Cannot find module './pkce'"

- [ ] **Step 3: Implement pkce.js**

```javascript
// src/utils/pkce.js
// OWASP PKCE implementation — RFC 7636

/** Generate a cryptographically random base64url string of `byteLength` bytes */
function randomBase64url(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  // btoa produces standard base64; replace chars for base64url (RFC 4648 §5)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE code_verifier.
 * 128 random bytes → base64url (~171 chars). Stored in sessionStorage.
 */
export function generateVerifier() {
  return randomBase64url(128);
}

/**
 * Generate PKCE code_challenge from verifier.
 * SHA-256(verifier) → base64url. Sent to auth server.
 */
export async function generateChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate CSRF state token.
 * 32 random bytes → base64url. Verified on OAuth callback.
 */
export function generateState() {
  return randomBase64url(32);
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- pkce`
Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/utils/pkce.js src/utils/pkce.test.js
git commit -m "feat: add PKCE utilities with tests"
```

---

## Task 3: Input Sanitization

**Files:**
- Create: `src/utils/sanitize.js`
- Create: `src/utils/sanitize.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// src/utils/sanitize.test.js
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- sanitize`
Expected: FAIL — "Cannot find module './sanitize'"

- [ ] **Step 3: Implement sanitize.js**

```javascript
// src/utils/sanitize.js
// OWASP input validation — strip injection chars, enforce limits, allowlist URLs

/** Characters that enable XSS/injection attacks — stripped from all user input */
const DANGEROUS_CHARS = /[<>"'`]/g;

/** Hard max on any user-supplied string */
const MAX_LENGTH = 512;

/**
 * Domains allowed for playlist URLs and result redirect links.
 * Validated via URL parser — not string matching — to prevent bypass.
 */
export const URL_ALLOWLIST = [
  'open.spotify.com',
  'www.youtube.com',
  'music.youtube.com',
];

/**
 * Strip dangerous characters and enforce max length.
 * Returns empty string for non-string inputs.
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.replace(DANGEROUS_CHARS, '').slice(0, MAX_LENGTH);
}

/**
 * Validate a playlist URL against the allowlist.
 * Returns the sanitized URL string if valid, null if not.
 * Only https:// URLs on allowlisted domains are accepted.
 */
export function validatePlaylistUrl(raw) {
  const cleaned = sanitizeString(raw);
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'https:') return null;
    if (!URL_ALLOWLIST.includes(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Return a new object containing only the specified keys.
 * Rejects unexpected fields before passing data to any API call.
 */
export function pickFields(obj, allowedKeys) {
  if (typeof obj !== 'object' || obj === null) return {};
  return Object.fromEntries(
    allowedKeys.filter(k => k in obj).map(k => [k, obj[k]])
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- sanitize`
Expected: PASS — 16 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sanitize.js src/utils/sanitize.test.js
git commit -m "feat: add input sanitization utilities with tests"
```

---

## Task 4: Client-Side Rate Limiter Hook

**Files:**
- Create: `src/hooks/useRateLimiter.js`
- Create: `src/hooks/useRateLimiter.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// src/hooks/useRateLimiter.test.js
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- useRateLimiter`
Expected: FAIL — "Cannot find module './useRateLimiter'"

- [ ] **Step 3: Implement useRateLimiter.js**

```javascript
// src/hooks/useRateLimiter.js
import { useCallback } from 'react';

// Rate limit configuration — adjust these if needed
const LIMITS = {
  // OWASP: limit auth attempts to prevent brute-force / abuse
  auth: { max: 5, windowMs: 60_000 },          // 5 attempts per 60s per service
  // Prevent excessive API consumption
  conversion: { max: 3, windowMs: 5 * 60_000 }, // 3 conversions per 5 minutes
};

/** Read stored timestamps from localStorage, pruning those outside the window */
function getTimestamps(key, windowMs) {
  const now = Date.now();
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    return stored.filter(ts => now - ts < windowMs);
  } catch {
    return [];
  }
}

/** Persist updated timestamps to localStorage */
function recordAttempt(key, timestamps) {
  localStorage.setItem(key, JSON.stringify([...timestamps, Date.now()]));
}

/**
 * Client-side sliding window rate limiter backed by localStorage.
 * Note: client-side limits are a UX safeguard, not a security boundary.
 * Server-side enforcement is in api/rate-limit.js for the Edge Function.
 */
export function useRateLimiter() {
  const check = useCallback((type, qualifier = '') => {
    const { max, windowMs } = LIMITS[type];
    const key = `pb_rl_${type}_${qualifier}`;
    const timestamps = getTimestamps(key, windowMs);

    if (timestamps.length >= max) {
      // Calculate how long until the oldest entry expires
      const retryAfterMs = windowMs - (Date.now() - timestamps[0]);
      return { allowed: false, retryAfterMs };
    }

    recordAttempt(key, timestamps);
    return { allowed: true, retryAfterMs: 0 };
  }, []);

  return { check };
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- useRateLimiter`
Expected: PASS — 9 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRateLimiter.js src/hooks/useRateLimiter.test.js
git commit -m "feat: add client-side rate limiter hook with tests"
```

---

## Task 5: Edge Function — Rate Limit Utility

**Files:**
- Create: `api/rate-limit.js`

No test file — this runs in the Edge runtime and is exercised via the youtube-search Edge Function tests in Task 6.

- [ ] **Step 1: Create api/rate-limit.js**

```javascript
// api/rate-limit.js
// In-memory sliding window rate limiter for Vercel Edge Functions.
// Shared state persists within a single edge node's lifetime.
// For high-traffic production: replace with Vercel KV (Redis).

/** ip → [timestamp, timestamp, ...] */
const store = new Map();

const WINDOW_MS = 60_000; // 1 minute sliding window
const MAX_REQUESTS = 10;  // per IP per window

/**
 * Check and record a request from the given IP.
 * Returns { allowed: boolean, retryAfter: number (seconds) }.
 *
 * OWASP: rate limiting protects against DoS and API abuse.
 */
export function checkRateLimit(ip) {
  const now = Date.now();
  // Prune timestamps outside the current window
  const timestamps = (store.get(ip) || []).filter(ts => now - ts < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - timestamps[0])) / 1000);
    return { allowed: false, retryAfter };
  }

  store.set(ip, [...timestamps, now]);
  return { allowed: true, retryAfter: 0 };
}
```

- [ ] **Step 2: Commit**

```bash
git add api/rate-limit.js
git commit -m "feat: add Edge Function rate limit utility"
```

---

## Task 6: Edge Function — YouTube Search Proxy

**Files:**
- Create: `api/youtube-search.js`

- [ ] **Step 1: Create api/youtube-search.js**

```javascript
// api/youtube-search.js
// Vercel Edge Function — proxies YouTube Data API v3 requests.
// GOOGLE_API_KEY is a server-only env var, never exposed to the client.
import { checkRateLimit } from './rate-limit.js';

export const config = { runtime: 'edge' };

const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_PLAYLIST_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

// OWASP: strip injection chars from query params before forwarding to upstream
function sanitizeParam(value) {
  return String(value ?? '').replace(/[<>"'`]/g, '').slice(0, 200);
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

export default async function handler(req) {
  // OWASP: enforce rate limit by client IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      429,
      { 'Retry-After': String(retryAfter) }
    );
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // OWASP: reject unexpected action values — allowlist only
  if (!['search', 'playlist'].includes(action)) {
    return json({ error: 'Invalid action. Expected "search" or "playlist".' }, 400);
  }

  // OWASP: GOOGLE_API_KEY is server-only — never sent to the client
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server misconfigured. Contact admin.' }, 500);
  }

  try {
    let upstreamUrl;

    if (action === 'search') {
      // Proxy a YouTube video search
      const q = sanitizeParam(searchParams.get('q'));
      if (!q) return json({ error: 'Missing query parameter "q".' }, 400);
      upstreamUrl =
        `${YT_SEARCH_URL}?part=snippet&type=video&maxResults=1` +
        `&q=${encodeURIComponent(q)}&key=${apiKey}`;
    } else {
      // Proxy a YouTube playlist items fetch
      const playlistId = sanitizeParam(searchParams.get('playlistId'));
      if (!playlistId) return json({ error: 'Missing parameter "playlistId".' }, 400);
      upstreamUrl =
        `${YT_PLAYLIST_URL}?part=snippet&maxResults=50` +
        `&playlistId=${encodeURIComponent(playlistId)}&key=${apiKey}`;
    }

    const upstreamRes = await fetch(upstreamUrl);
    const data = await upstreamRes.json();

    return json(data, upstreamRes.status);
  } catch {
    return json({ error: 'Upstream YouTube API error.' }, 502);
  }
}
```

- [ ] **Step 2: Create vercel.json**

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/youtube-search.js": {
      "runtime": "edge"
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add api/youtube-search.js vercel.json
git commit -m "feat: add YouTube search Edge Function with IP rate limiting"
```

---

## Task 7: Spotify Auth Hook

**Files:**
- Create: `src/hooks/useSpotifyAuth.js`
- Create: `src/hooks/useSpotifyAuth.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- useSpotifyAuth`
Expected: FAIL — "Cannot find module './useSpotifyAuth'"

- [ ] **Step 3: Implement useSpotifyAuth.js**

```javascript
// src/hooks/useSpotifyAuth.js
import { useState, useEffect, useCallback } from 'react';
import { generateVerifier, generateChallenge, generateState } from '../utils/pkce';

// OWASP: client ID is safe to expose — PKCE flow requires no secret
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'https://illupia.com/';
const SCOPES = 'playlist-read-private playlist-modify-public playlist-modify-private';

// localStorage / sessionStorage keys
const STORAGE_KEY = 'pb_spotify_token';
const VERIFIER_KEY = 'pb_spotify_verifier';
const STATE_KEY = 'pb_spotify_state';

export function useSpotifyAuth() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

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
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- useSpotifyAuth`
Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSpotifyAuth.js src/hooks/useSpotifyAuth.test.js
git commit -m "feat: add Spotify PKCE auth hook with tests"
```

---

## Task 8: Google Auth Hook (with Persistence Fix)

**Files:**
- Create: `src/hooks/useGoogleAuth.js`
- Create: `src/hooks/useGoogleAuth.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- useGoogleAuth`
Expected: FAIL — "Cannot find module './useGoogleAuth'"

- [ ] **Step 3: Implement useGoogleAuth.js**

```javascript
// src/hooks/useGoogleAuth.js
import { useState, useEffect, useCallback } from 'react';
import { generateVerifier, generateChallenge, generateState } from '../utils/pkce';

// OWASP: client ID is safe to expose — PKCE requires no secret
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = 'https://illupia.com/';
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

  const exchangeCode = useCallback(async (code, verifier) => {
    try {
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
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- useGoogleAuth`
Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGoogleAuth.js src/hooks/useGoogleAuth.test.js
git commit -m "feat: add Google PKCE auth hook with persistence fix and tests"
```

---

## Task 9: Spotify Service

**Files:**
- Create: `src/services/spotify.js`
- Create: `src/services/spotify.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// src/services/spotify.test.js
import { describe, it, expect, vi } from 'vitest';
import {
  extractPlaylistId,
  getPlaylistTracks,
  searchTrack,
  createPlaylist,
  addTracksToPlaylist,
} from './spotify';

describe('extractPlaylistId', () => {
  it('extracts ID from standard Spotify playlist URL', () => {
    expect(extractPlaylistId('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'))
      .toBe('37i9dQZF1DXcBWIGoYBM5M');
  });
  it('extracts ID with query params', () => {
    expect(extractPlaylistId('https://open.spotify.com/playlist/abc123?si=xyz'))
      .toBe('abc123');
  });
  it('returns null for non-playlist URL', () => {
    expect(extractPlaylistId('https://open.spotify.com/track/abc')).toBeNull();
  });
});

describe('getPlaylistTracks', () => {
  it('fetches tracks and returns [{title, artist}]', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        next: null,
        items: [
          { track: { name: 'Song A', artists: [{ name: 'Artist A' }] } },
          { track: { name: 'Song B', artists: [{ name: 'Artist B' }] } },
        ],
      }),
    });

    const tracks = await getPlaylistTracks('playlist123', 'access-token');
    expect(tracks).toEqual([
      { title: 'Song A', artist: 'Artist A' },
      { title: 'Song B', artist: 'Artist B' },
    ]);
    vi.restoreAllMocks();
  });

  it('skips null tracks', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        next: null,
        items: [{ track: null }, { track: { name: 'Song C', artists: [{ name: 'Artist C' }] } }],
      }),
    });

    const tracks = await getPlaylistTracks('pl', 'tok');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].title).toBe('Song C');
    vi.restoreAllMocks();
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(getPlaylistTracks('pl', 'tok')).rejects.toThrow('Spotify API error: 401');
    vi.restoreAllMocks();
  });
});

describe('searchTrack', () => {
  it('returns track URI on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: { items: [{ uri: 'spotify:track:abc' }] } }),
    });

    const uri = await searchTrack('Song A', 'Artist A', 'tok');
    expect(uri).toBe('spotify:track:abc');
    vi.restoreAllMocks();
  });

  it('returns null when no results', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tracks: { items: [] } }),
    });

    expect(await searchTrack('Unknown', '', 'tok')).toBeNull();
    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- spotify`
Expected: FAIL — "Cannot find module './spotify'"

- [ ] **Step 3: Implement src/services/spotify.js**

```javascript
// src/services/spotify.js
// Spotify Web API client — all calls require a valid access token

const API = 'https://api.spotify.com/v1';

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** Extract Spotify playlist ID from a playlist URL */
export function extractPlaylistId(url) {
  const match = url.match(/playlist\/([A-Za-z0-9]+)/);
  return match?.[1] ?? null;
}

/**
 * Fetch all tracks from a Spotify playlist.
 * Handles pagination via the `next` cursor.
 * Returns [{title: string, artist: string}]
 */
export async function getPlaylistTracks(playlistId, token) {
  const tracks = [];
  // Request only the fields we need (reduces response size)
  let url =
    `${API}/playlists/${encodeURIComponent(playlistId)}/tracks` +
    `?fields=next,items(track(name,artists(name)))&limit=50`;

  while (url) {
    const res = await fetch(url, { headers: authHeaders(token) });
    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
    const data = await res.json();

    for (const item of data.items) {
      // Skip local files and null tracks
      if (!item.track) continue;
      tracks.push({
        title: item.track.name,
        artist: item.track.artists[0]?.name ?? '',
      });
    }
    url = data.next; // null when last page
  }
  return tracks;
}

/**
 * Search Spotify for a track by title + artist.
 * Returns the best-match track URI or null.
 */
export async function searchTrack(title, artist, token) {
  // Trim to 200 chars — Spotify search doesn't benefit from longer queries
  const q = encodeURIComponent(`${title} ${artist}`.trim().slice(0, 200));
  const res = await fetch(`${API}/search?q=${q}&type=track&limit=1`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.tracks?.items?.[0]?.uri ?? null;
}

/**
 * Create a new public Spotify playlist for the authenticated user.
 * Returns the new playlist's ID.
 */
export async function createPlaylist(name, token) {
  const meRes = await fetch(`${API}/me`, { headers: authHeaders(token) });
  if (!meRes.ok) throw new Error('Could not fetch Spotify user');
  const { id: userId } = await meRes.json();

  const res = await fetch(`${API}/users/${encodeURIComponent(userId)}/playlists`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name, public: true }),
  });
  if (!res.ok) throw new Error(`Create playlist failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

/**
 * Add track URIs to a Spotify playlist.
 * Spotify allows max 100 URIs per request — batched automatically.
 */
export async function addTracksToPlaylist(playlistId, uris, token) {
  for (let i = 0; i < uris.length; i += 100) {
    const batch = uris.slice(i, i + 100);
    const res = await fetch(
      `${API}/playlists/${encodeURIComponent(playlistId)}/tracks`,
      {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ uris: batch }),
      }
    );
    if (!res.ok) throw new Error(`Add tracks failed: ${res.status}`);
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- spotify`
Expected: PASS — 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/services/spotify.js src/services/spotify.test.js
git commit -m "feat: add Spotify service with pagination and tests"
```

---

## Task 10: YouTube Service

**Files:**
- Create: `src/services/youtube.js`
- Create: `src/services/youtube.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// src/services/youtube.test.js
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
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- youtube`
Expected: FAIL — "Cannot find module './youtube'"

- [ ] **Step 3: Implement src/services/youtube.js**

```javascript
// src/services/youtube.js
// YouTube API client.
// All YouTube Data API v3 calls go through /api/youtube-search (Edge Function)
// so that GOOGLE_API_KEY never reaches the browser.

const PROXY = '/api/youtube-search';

/** Extract YouTube playlist ID from a playlist URL (list= param) */
export function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

/**
 * Fetch all items from a YouTube playlist via Edge Function proxy.
 * Returns [{title: string, artist: ''}]
 * (YouTube playlist items don't include artist — title only)
 */
export async function getPlaylistTracks(playlistId) {
  const res = await fetch(
    `${PROXY}?action=playlist&playlistId=${encodeURIComponent(playlistId)}`
  );
  if (res.status === 429) {
    throw Object.assign(new Error('Rate limit exceeded'), { code: 'ratelimit' });
  }
  if (!res.ok) throw new Error(`YouTube proxy error: ${res.status}`);

  const data = await res.json();
  return (data.items ?? []).map(item => ({
    title: item.snippet?.title ?? '',
    artist: '', // YouTube playlist items don't include artist metadata
  }));
}

/**
 * Search YouTube for a video matching title + artist via Edge Function proxy.
 * Returns videoId or null.
 */
export async function searchVideo(title, artist) {
  const q = `${title} ${artist}`.trim();
  const res = await fetch(
    `${PROXY}?action=search&q=${encodeURIComponent(q)}`
  );
  if (res.status === 429) {
    throw Object.assign(new Error('Rate limit exceeded'), { code: 'ratelimit' });
  }
  if (!res.ok) return null;

  const data = await res.json();
  return data.items?.[0]?.id?.videoId ?? null;
}

/**
 * Create a new YouTube playlist for the authenticated user.
 * Returns { playlistId, url }
 * Note: uses the YouTube Data API directly (authenticated call, no proxy needed)
 */
export async function createPlaylist(name, token) {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ snippet: { title: name } }),
    }
  );
  if (!res.ok) throw new Error(`Create YouTube playlist failed: ${res.status}`);
  const data = await res.json();
  return {
    playlistId: data.id,
    url: `https://www.youtube.com/playlist?list=${data.id}`,
  };
}

/**
 * Add video IDs to a YouTube playlist.
 * Adds one at a time — YouTube's batch insert is not available in v3.
 */
export async function addVideosToPlaylist(playlistId, videoIds, token) {
  for (const videoId of videoIds) {
    await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          playlistId,
          resourceId: { kind: 'youtube#video', videoId },
        },
      }),
    });
    // Continue on error — missing one video shouldn't abort the whole playlist
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- youtube`
Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/services/youtube.js src/services/youtube.test.js
git commit -m "feat: add YouTube service with Edge Function proxy and tests"
```

---

## Task 11: Bridge Hook

**Files:**
- Create: `src/hooks/useBridge.js`
- Create: `src/hooks/useBridge.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
// src/hooks/useBridge.test.js
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
  getPlaylistTracks: async () => [{ title: 'YT Track', artist: '' }],
  searchVideo: async () => 'video-id-1',
  createPlaylist: async () => ({ playlistId: 'new-yt-id', url: 'https://www.youtube.com/playlist?list=new-yt-id' }),
  addVideosToPlaylist: vi.fn(async () => {}),
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
    expect(result.current.results.matched).toBe(2); // searchVideo always returns a match in mock
    expect(result.current.results.url).toContain('youtube.com');
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
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npm test -- useBridge`
Expected: FAIL — "Cannot find module './useBridge'"

- [ ] **Step 3: Implement useBridge.js**

```javascript
// src/hooks/useBridge.js
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
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npm test -- useBridge`
Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBridge.js src/hooks/useBridge.test.js
git commit -m "feat: add bridge hook orchestrating both conversion directions with tests"
```

---

## Task 12: UI Components

**Files:**
- Create: `src/components/LanguagePicker.jsx`
- Create: `src/components/AuthButton.jsx`
- Create: `src/components/BridgePanel.jsx`
- Create: `src/components/ResultsView.jsx`

- [ ] **Step 1: Create LanguagePicker.jsx**

```jsx
// src/components/LanguagePicker.jsx
// Shown once on first visit — stores choice in localStorage as pb_lang

export function LanguagePicker({ onSelect }) {
  return (
    <main className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold text-[#f0f0f0] font-['Outfit']">IlluPia</h1>
      <div className="flex gap-6">
        {/* English */}
        <button
          onClick={() => onSelect('en')}
          className="flex flex-col items-center gap-2 text-[#f0f0f0] opacity-80 hover:opacity-100 transition-opacity"
          aria-label="English"
        >
          <span className="text-4xl">🇬🇧</span>
          <span className="text-sm font-['Outfit']">English</span>
        </button>

        {/* Northern Sámi */}
        <button
          onClick={() => onSelect('se')}
          className="flex flex-col items-center gap-2 text-[#f0f0f0] opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Northern Sámi"
        >
          <img src="/sami.jpg" alt="Sámi flag" className="w-12 h-8 object-cover rounded" />
          <span className="text-sm font-['Outfit']">Sámegillii</span>
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create AuthButton.jsx**

```jsx
// src/components/AuthButton.jsx

export function AuthButton({ label, connected, error, onConnect, onDisconnect, t }) {
  return (
    <div className="flex-1">
      <button
        onClick={connected ? onDisconnect : onConnect}
        className={[
          'w-full py-2 px-4 rounded text-sm font-semibold font-["Outfit"] transition-colors',
          connected
            ? 'bg-[#161616] text-[#f0f0f0] border border-[#333] hover:border-red-500 hover:text-red-400'
            : 'bg-[#f0f0f0] text-[#0d0d0d] hover:bg-[#d0d0d0]',
        ].join(' ')}
      >
        {label} — {connected ? t.disconnect : t.connect}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-400 text-center">{t[error] ?? error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create BridgePanel.jsx**

```jsx
// src/components/BridgePanel.jsx
import { useState } from 'react';

// Maps status to translation key for display
const STATUS_LABELS = {
  loading: 'loading',
  searching: 'searching',
  creating: 'creating',
  done: 'done',
  error: 'autherror',
};

export function BridgePanel({ title, subtitle, onConvert, status, t }) {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState(null);

  const isConverting = ['loading', 'searching', 'creating'].includes(status);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    const err = await onConvert(url.trim());
    if (err) setLocalError(err);
  }

  return (
    <section className="bg-[#161616] rounded-xl p-5 space-y-3">
      <div>
        <h2 className="text-lg font-bold font-['Outfit']">{title}</h2>
        <p className="text-xs text-[#888]">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={t.paste}
          disabled={isConverting}
          maxLength={512}
          className="flex-1 bg-[#0d0d0d] text-[#f0f0f0] text-sm px-3 py-2 rounded border border-[#333] focus:outline-none focus:border-[#666] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isConverting || !url.trim()}
          className="px-4 py-2 bg-[#f0f0f0] text-[#0d0d0d] text-sm font-semibold rounded hover:bg-[#d0d0d0] disabled:opacity-40 transition-colors"
        >
          {isConverting ? (t[STATUS_LABELS[status]] ?? t.loading) : t.convert}
        </button>
      </form>

      {localError && (
        <p className="text-xs text-red-400">{t[localError] ?? localError}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create ResultsView.jsx**

```jsx
// src/components/ResultsView.jsx
import { URL_ALLOWLIST } from '../utils/sanitize';

// OWASP: validate result URL before rendering as a link
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && URL_ALLOWLIST.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function ResultsView({ results, onAgain, t }) {
  const { matched, missed, url } = results;

  return (
    <main className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[480px] bg-[#161616] rounded-xl p-6 space-y-4">
        <p className="text-[#f0f0f0] font-['Outfit']">
          {t.matched}: <strong>{matched}</strong>
        </p>
        <p className="text-[#f0f0f0] font-['Outfit']">
          {t.missed}: <strong>{missed.length}</strong>
        </p>

        {missed.length > 0 && (
          <ul className="text-xs text-[#888] space-y-1 max-h-40 overflow-y-auto">
            {missed.map((track, i) => (
              <li key={i}>{track}</li>
            ))}
          </ul>
        )}

        <div className="flex gap-3 pt-2">
          {isSafeUrl(url) && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 bg-[#f0f0f0] text-[#0d0d0d] text-sm font-semibold rounded hover:bg-[#d0d0d0] transition-colors"
            >
              {t.open}
            </a>
          )}
          <button
            onClick={onAgain}
            className="flex-1 py-2 bg-[#161616] text-[#f0f0f0] text-sm font-semibold rounded border border-[#333] hover:border-[#666] transition-colors"
          >
            {t.again}
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/LanguagePicker.jsx src/components/AuthButton.jsx \
  src/components/BridgePanel.jsx src/components/ResultsView.jsx
git commit -m "feat: add UI components (LanguagePicker, AuthButton, BridgePanel, ResultsView)"
```

---

## Task 13: App.jsx — Wire Everything Together

**Files:**
- Create: `src/App.jsx`

- [ ] **Step 1: Create src/App.jsx**

```jsx
// src/App.jsx
import { useState, useCallback } from 'react';
import { TRANSLATIONS } from './translations';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useRateLimiter } from './hooks/useRateLimiter';
import { useBridge } from './hooks/useBridge';
import { LanguagePicker } from './components/LanguagePicker';
import { AuthButton } from './components/AuthButton';
import { BridgePanel } from './components/BridgePanel';
import { ResultsView } from './components/ResultsView';

export default function App() {
  // Language — persisted in localStorage as pb_lang
  const [lang, setLang] = useState(() => localStorage.getItem('pb_lang'));
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.en;

  const spotify = useSpotifyAuth();
  const google = useGoogleAuth();
  const { check } = useRateLimiter();

  const [activeDirection, setActiveDirection] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  const bridge = useBridge({
    spotifyToken: spotify.token?.access_token,
    googleToken: google.token?.access_token,
    onRateLimit: () => setGlobalError('ratelimit'),
  });

  function handleLangSelect(l) {
    localStorage.setItem('pb_lang', l);
    setLang(l);
  }

  const handleConnect = useCallback((service, connectFn) => {
    setGlobalError(null);
    const { allowed } = check('auth', service);
    if (!allowed) { setGlobalError('ratelimit'); return; }
    connectFn();
  }, [check]);

  const handleConvert = useCallback(async (direction, url) => {
    setGlobalError(null);
    const { allowed } = check('conversion');
    if (!allowed) { setGlobalError('ratelimit'); return null; }

    setActiveDirection(direction);
    return direction === 'pia'
      ? bridge.convertPia(url)
      : bridge.convertIllu(url);
  }, [check, bridge]);

  // Gate: show language picker on first visit
  if (!lang) return <LanguagePicker onSelect={handleLangSelect} />;

  // Show results screen after a successful conversion
  if (bridge.results) {
    return <ResultsView results={bridge.results} onAgain={bridge.reset} t={t} />;
  }

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] space-y-6">
        <h1 className="text-2xl font-bold text-center font-['Outfit'] tracking-tight">
          IlluPia
        </h1>

        {/* Auth buttons */}
        <div className="flex gap-3">
          <AuthButton
            label="Spotify"
            connected={spotify.connected}
            error={spotify.error}
            onConnect={() => handleConnect('spotify', spotify.connect)}
            onDisconnect={spotify.disconnect}
            t={t}
          />
          <AuthButton
            label="YouTube"
            connected={google.connected}
            error={google.error}
            onConnect={() => handleConnect('google', google.connect)}
            onDisconnect={google.disconnect}
            t={t}
          />
        </div>

        {/* Global error display */}
        {globalError && (
          <p className="text-red-400 text-sm text-center font-['Outfit']">
            {t[globalError] ?? globalError}
          </p>
        )}

        {/* Illu: YouTube → Spotify */}
        <BridgePanel
          title="Illu"
          subtitle={t.illuSub}
          onConvert={(url) => handleConvert('illu', url)}
          status={activeDirection === 'illu' ? bridge.status : 'idle'}
          t={t}
        />

        {/* Pia: Spotify → YouTube */}
        <BridgePanel
          title="Pia"
          subtitle={t.piaSub}
          onConvert={(url) => handleConvert('pia', url)}
          status={activeDirection === 'pia' ? bridge.status : 'idle'}
          t={t}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run all tests — verify everything passes**

Run: `npm test`
Expected: PASS — all tests across all files passing.

- [ ] **Step 3: Run dev server and smoke test in browser**

Run: `npm run dev`

Check manually:
- [ ] Language picker appears on first visit
- [ ] Selecting a language stores `pb_lang` in localStorage
- [ ] Spotify Connect button initiates OAuth redirect
- [ ] Google Connect button initiates OAuth redirect
- [ ] After auth callback, connected state persists on page reload
- [ ] URL input shows placeholder, accepts up to 512 chars
- [ ] Convert button is disabled when no URL is entered
- [ ] Rate limit messages display correctly

- [ ] **Step 4: Verify build succeeds**

Run: `VITE_SPOTIFY_CLIENT_ID=test VITE_GOOGLE_CLIENT_ID=test npm run build`
Expected: `dist/` created, no errors.

- [ ] **Step 5: Final commit**

```bash
git add src/App.jsx
git commit -m "feat: wire App.jsx — complete IlluPia SPA with auth, rate limiting, and bridge"
```

---

## Task 14: Vercel Deployment Setup

**Files:**
- Already created: `vercel.json`
- Already created: `.env.example`

- [ ] **Step 1: Verify vercel.json is correct**

Confirm `vercel.json` contains:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/youtube-search.js": {
      "runtime": "edge"
    }
  }
}
```

- [ ] **Step 2: Set environment variables in Vercel dashboard**

In Vercel project settings → Environment Variables, add:
- `VITE_SPOTIFY_CLIENT_ID` — your Spotify client ID
- `VITE_GOOGLE_CLIENT_ID` — your Google client ID
- `GOOGLE_API_KEY` — your Google API key (restrict to YouTube Data API v3)

Do NOT add `GOOGLE_API_KEY` to `.env` — set it only in the Vercel dashboard.

- [ ] **Step 3: Register redirect URIs in OAuth consoles**

**Spotify Developer Dashboard:**
- Redirect URI: `https://illupia.com/`

**Google Cloud Console → OAuth 2.0 Client:**
- Authorized redirect URI: `https://illupia.com/`
- Authorized JavaScript origin: `https://illupia.com`

- [ ] **Step 4: Deploy**

```bash
git push origin main
```

Vercel auto-deploys on push. Verify at `https://illupia.com`.

---

## Self-Review Against Spec

- [x] PKCE + state for both OAuth flows — Tasks 7, 8
- [x] Google token persistence bug fixed — Task 8 (`exchangeCode` stores to localStorage before `replaceState`)
- [x] `GOOGLE_API_KEY` server-only — Task 6 (Edge Function only, never in client bundle)
- [x] `VITE_` env vars guard at build time — Task 1 (vite.config.js)
- [x] Input sanitization on all user inputs — Task 3
- [x] URL allowlist validation — Task 3
- [x] No `innerHTML` — all JSX (Tasks 12, 13)
- [x] Client-side rate limiting (5 auth/60s, 3 conv/5min) — Task 4
- [x] Edge Function IP rate limiting (10 req/min) — Tasks 5, 6
- [x] 429 with `Retry-After` header — Task 6
- [x] Token audience verification on Google ID token — Task 8
- [x] URL cleaned after OAuth callback — Tasks 7, 8
- [x] Result links validated before rendering — Task 12 (`ResultsView` `isSafeUrl`)
- [x] Language picker (en/se) with localStorage — Tasks 12, 13
- [x] Sámi flag via `public/sami.jpg` — Task 12
- [x] `.gitignore` excludes `.env` — Task 1
- [x] `.env.example` has empty keys only — Task 1
- [x] Error handling for all spec scenarios — Tasks 11, 13
- [x] Pia direction (Spotify → YouTube) — Task 11
- [x] Illu direction (YouTube → Spotify) — Task 11
