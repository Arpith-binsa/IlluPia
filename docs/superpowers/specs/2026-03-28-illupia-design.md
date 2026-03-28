# IlluPia — Playlist Bridge Design Spec
**Date:** 2026-03-28
**Domain:** illupia.com
**Stack:** React 18 + Vite, Tailwind CSS, Vercel (static + Edge Functions)

---

## Overview

IlluPia converts playlists between Spotify and YouTube Music in both directions:
- **Illu** — YouTube Music → Spotify
- **Pia** — Spotify → YouTube Music

Pure frontend SPA with Vercel Edge Functions for API proxying and server-side rate limiting. No database. No backend server.

---

## Project Structure

```
IlluPia/
├── api/
│   ├── youtube-search.js      # Edge Function — proxies YT Data API, hides GOOGLE_API_KEY
│   └── rate-limit.js          # Shared rate limit utility for edge functions
├── src/
│   ├── hooks/
│   │   ├── useSpotifyAuth.js   # PKCE flow, token storage, refresh
│   │   ├── useGoogleAuth.js    # PKCE flow, token persistence fix, localStorage
│   │   ├── useRateLimiter.js   # Client-side rate limiting
│   │   └── useBridge.js        # Orchestrates conversion (Illu or Pia direction)
│   ├── services/
│   │   ├── spotify.js          # Spotify API calls (search, create playlist)
│   │   └── youtube.js          # YouTube API calls (via /api/youtube-search proxy)
│   ├── components/
│   │   ├── AuthButton.jsx      # Connect/Disconnect for each service
│   │   ├── BridgePanel.jsx     # URL input + Convert button
│   │   ├── LanguagePicker.jsx  # en/se selector, shown once, stored in localStorage
│   │   └── ResultsView.jsx     # Matched/Missed counts + Open playlist link
│   ├── utils/
│   │   ├── sanitize.js         # Input sanitization
│   │   └── pkce.js             # Shared PKCE code verifier/challenge generation
│   ├── App.jsx
│   ├── translations.js         # en + Northern Sámi (se) strings
│   └── main.jsx
├── public/
│   └── sami.jpg
├── .env.example               # Empty keys only — never commit real .env
├── .gitignore                 # .env explicitly listed
├── vercel.json                # SPA rewrite + edge function config
└── vite.config.js
```

---

## Environment Variables

| Variable | Where | Safe to expose? |
|---|---|---|
| `VITE_SPOTIFY_CLIENT_ID` | Vite build (client bundle) | Yes — PKCE needs no secret |
| `VITE_GOOGLE_CLIENT_ID` | Vite build (client bundle) | Yes — PKCE needs no secret |
| `GOOGLE_API_KEY` | Vercel Edge Function env only | No — never in bundle |

**Build-time guard:** `vite.config.js` throws if `VITE_SPOTIFY_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID` are missing.
**`.env` is in `.gitignore`.** `.env.example` contains only empty keys with comments.

---

## OAuth Flows

### Spotify (PKCE Authorization Code)
- `code_verifier`: 128 random bytes → base64url, stored in `sessionStorage`
- `state`: 32 random bytes, verified on callback (CSRF protection)
- Redirect URI: `https://illupia.com/`
- Tokens stored in `localStorage` under `pb_spotify_token`
- URL cleaned via `history.replaceState` after token exchange

### Google / YouTube (PKCE Authorization Code)
- Same PKCE + state pattern as Spotify
- **Token persistence fix:** `useGoogleAuth` reads `code` from URL → exchanges for token → writes to `localStorage` → *then* calls `history.replaceState`. On every mount, checks `localStorage` first before prompting re-auth.
- Tokens stored in `localStorage` under `pb_google_token`
- Redirect URI: `https://illupia.com/`

### Token Lifecycle (both services)
```
App mount
  → check localStorage for token
    → valid: restore connected state (no re-auth)
    → expired/missing: show Connect button
  → post-auth callback:
    → parse code from URL
    → exchange for token
    → store in localStorage
    → clean URL with history.replaceState
```

---

## Security

### Input Sanitization (`src/utils/sanitize.js`)
- Strip characters: `< > " ' \``
- Max length: 512 characters
- Playlist URLs validated against allowlist: `open.spotify.com`, `www.youtube.com`, `music.youtube.com`
- Unexpected object fields rejected before any API call
- No `innerHTML` — all dynamic content via React JSX (auto-escaped)
- Redirect links validated against allowlist before rendering

### PKCE (`src/utils/pkce.js`)
- `code_verifier`: `crypto.getRandomValues` → 128 bytes → base64url
- `code_challenge`: SHA-256 of verifier → base64url
- `state`: `crypto.getRandomValues` → 32 bytes → base64url
- `code_verifier` and `state` stored in `sessionStorage` (cleared on tab close)

### Rate Limiting

| Layer | Scope | Limit | Storage |
|---|---|---|---|
| Client — auth attempts | per service | 5 per 60s | localStorage |
| Client — conversions | global | 3 per 5min | localStorage |
| Edge Function — YouTube proxy | per IP | 10 req/min | In-memory (edge node) |

Client-side limits enforced in `useRateLimiter`. Edge Function limit enforced in `api/rate-limit.js`, returns HTTP 429 with `Retry-After` header on breach.

### Token Audience Verification
- Google ID tokens decoded client-side, `aud` claim verified against `VITE_GOOGLE_CLIENT_ID`

---

## Data Flow

### Pia — Spotify → YouTube Music
1. User pastes Spotify playlist URL → `sanitize.js` validates (allowlist + strip)
2. `useBridge` → `spotify.js` → `GET /playlists/{id}/tracks` → `[{title, artist}]`
3. For each track: `youtube.js` → `POST /api/youtube-search` (Edge Function) → YT Data API v3 → best match `videoId`
4. Authenticated YouTube call: create playlist → add matched `videoId`s
5. `ResultsView`: matched count, missed list, "Open playlist" link

### Illu — YouTube Music → Spotify
1. User pastes YouTube playlist URL → `sanitize.js` validates
2. `useBridge` → `youtube.js` → `GET /api/youtube-search` (playlist items via Edge Function)
3. For each track: `spotify.js` → `GET /search?q={title+artist}` → best match `trackUri`
4. Authenticated Spotify call: create playlist → add matched `trackUri`s
5. `ResultsView`: matched count, missed list, "Open playlist" link

---

## UI Design

- **Background:** `#0d0d0d`, **Text:** `#f0f0f0`, **Surface:** `#161616`
- **Font:** Outfit (Google Fonts)
- Mobile-first, max-width 480px centered
- Minimal, icon-driven
- Two panels: Illu (left/top) and Pia (right/bottom)

### Language Selection
```
App mount → check localStorage pb_lang
  → found: use stored language
  → not found: show LanguagePicker (en/se) → store → proceed
```
Sámi flag uses `public/sami.jpg`.

---

## Error Handling

| Scenario | Response |
|---|---|
| Rate limit hit | Show `t.ratelimit` string, disable button for remaining window |
| OAuth failure | Show `t.autherror`, clear stored tokens |
| Invalid URL | Show `t.urlerror` inline |
| Both accounts not connected | Show `t.needboth` |
| Missing env var | Show `t.noenv` (build-time throw for production) |
| Track not found | Add to missed list, continue conversion |
| API error (5xx) | Surface message, allow retry |

---

## Vercel Configuration

`vercel.json`:
- SPA rewrite: all routes → `index.html`
- Edge Functions: `api/youtube-search.js`, `api/rate-limit.js`
- `GOOGLE_API_KEY` set as Vercel environment variable (not in repo)

---

## Out of Scope
- User accounts / login
- Playlist history
- Backend database
- Server-side session management
- Mobile app
