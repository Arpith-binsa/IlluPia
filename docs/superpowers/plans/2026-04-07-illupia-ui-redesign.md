# IlluPia UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign IlluPia to a black-and-white aesthetic with a hero section, full-section converter layout, an About page at `/about` with dog stories and photos, a persistent EN/SE language toggle in the header, and playful CSS button animations — without touching any auth, conversion, or rate-limiting logic.

**Architecture:** React Router DOM is added to provide two routes (`/` and `/about`). `App.jsx` handles the language gate, all hooks, and renders the main page; a new `src/pages/AboutPage.jsx` renders the About page. Custom CSS animation utility classes are added to `index.css` and applied via `className` on buttons. All translation strings go through the existing `TRANSLATIONS` object in `translations.js`.

**Tech Stack:** React 18, Vite, Tailwind CSS v3, React Router DOM v6, pure CSS animations

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `react-router-dom` |
| `src/main.jsx` | Modify | Wrap `<App />` in `<BrowserRouter>` |
| `src/index.css` | Modify | White/black body defaults; CSS animation utility classes |
| `src/translations.js` | Modify | Add 8 new translation keys to `en` and `se` |
| `src/components/LanguagePicker.jsx` | Modify | Restyle to B&W, keep flags and selection logic |
| `src/components/AuthButton.jsx` | Modify | Minimal pill style with lift animation |
| `src/components/BridgePanel.jsx` | Modify | Full-section layout, large title, convert button animations |
| `src/components/ResultsView.jsx` | Modify | B&W restyle, animated buttons |
| `src/App.jsx` | Modify | Hero + routing + header with lang toggle + About link at bottom |
| `src/pages/AboutPage.jsx` | Create | About page: intro, Illu story + photo, Pia story + photo |

---

### Task 1: Install React Router DOM and update main.jsx

**Files:**
- Modify: `package.json`
- Modify: `src/main.jsx`

- [ ] **Step 1: Install react-router-dom**

```bash
cd /Users/arpithmadakkuni/IlluPia
npm install react-router-dom
```

Expected: `react-router-dom` appears in `package.json` dependencies, `node_modules/react-router-dom` exists.

- [ ] **Step 2: Wrap the app in BrowserRouter**

Replace the entire contents of `src/main.jsx`:

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

- [ ] **Step 3: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all existing tests pass. None of them import `main.jsx` so this is a sanity check.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.jsx
git commit -m "feat: add react-router-dom, wrap app in BrowserRouter"
```

---

### Task 2: Add CSS animation utilities and update body defaults

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace index.css**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Outfit', sans-serif;
  background-color: #ffffff;
  color: #111111;
}

/* Base: bounce scale on hover, pop on click */
.btn-animated {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 150ms ease,
              border-color 150ms ease;
}
.btn-animated:hover:not(:disabled) { transform: scale(1.04); }
.btn-animated:active:not(:disabled) { transform: scale(0.97); }
.btn-animated:disabled { cursor: not-allowed; }

/* Lift: floats up — used on auth pills and language choice cards */
.btn-lift:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); }

/* Convert: tilts slightly on hover */
.btn-convert:hover:not(:disabled) { transform: scale(1.04) rotate(1.5deg); }

/* Entry wobble: fires once when component mounts — Convert button only */
@keyframes wobble-in {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-2deg) scale(1.03); }
  50%  { transform: rotate(2deg) scale(1.03); }
  75%  { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
}
.btn-wobble-in {
  animation: wobble-in 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass (CSS changes don't affect unit tests).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: white/black body defaults and CSS button animation utilities"
```

---

### Task 3: Add new translation keys

**Files:**
- Modify: `src/translations.js`

- [ ] **Step 1: Replace translations.js**

```js
/**
 * UI translations for IlluPia.
 * Two languages: English (en) and Northern Sámi (se).
 * Keys marked [TODO: Sámi] need to be filled in by the user.
 */
export const TRANSLATIONS = {
  en: {
    connect: 'Connect',
    paste: 'Paste',
    convert: 'Convert',
    matched: 'Matched',
    missed: 'Missed',
    open: 'Open playlist',
    again: 'Convert another',
    loading: 'Loading…',
    searching: 'Searching…',
    creating: 'Creating…',
    done: 'Done ✓',
    ratelimit: 'Slow down',
    autherror: 'Auth failed',
    urlerror: 'Invalid URL',
    needboth: 'Connect both accounts first',
    noenv: 'Missing client ID — check .env',
    disconnect: 'Disconnect',
    illuSub: 'YouTube → Spotify',
    piaSub: 'Spotify → YouTube',
    heroHeading: 'Move music between worlds.',
    heroTagline: 'Convert playlists between Spotify and YouTube — in both directions.',
    aboutLink: 'About IlluPia',
    aboutBack: '← IlluPia',
    aboutIntro: 'IlluPia is named after two of the greatest dogs to ever live.',
    aboutSubtext: 'Illu is still here, bounding through life. Pia is gone — but every playlist carries something of her.',
    illuStory: '[Placeholder — Illu\'s story goes here.]',
    piaStory: '[Placeholder — Pia\'s story goes here.]',
  },
  se: {
    connect: 'Čatnat',
    paste: 'Liibmet',
    convert: 'Rievdadit',
    matched: 'Gávdnan',
    missed: 'ii gávdnon',
    open: 'Rahpat speallanlisttu',
    again: 'Nuppi',
    loading: 'Viežžamin…',
    searching: 'Ohcamin…',
    creating: 'Ráhkadeamen…',
    done: 'Gárvvis ✓',
    ratelimit: 'Mana hiđit!',
    autherror: 'I lihkostuvvan dovddastit',
    urlerror: 'URL ii leat gustovaš',
    needboth: 'Čatna goappašat kontoat vuos',
    noenv: 'Client ID váilu',
    disconnect: 'Čatnasa eret',
    illuSub: 'YouTube → Spotify',
    piaSub: 'Spotify → YouTube',
    // [TODO: Sámi] — fill in the translations below
    heroHeading: 'Move music between worlds.',
    heroTagline: 'Convert playlists between Spotify and YouTube — in both directions.',
    aboutLink: 'About IlluPia',
    aboutBack: '← IlluPia',
    aboutIntro: 'IlluPia is named after two of the greatest dogs to ever live.',
    aboutSubtext: 'Illu is still here, bounding through life. Pia is gone — but every playlist carries something of her.',
    illuStory: '[Placeholder — Illu\'s story goes here.]',
    piaStory: '[Placeholder — Pia\'s story goes here.]',
  },
};
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/translations.js
git commit -m "feat: add heroHeading, heroTagline, about page translation keys"
```

---

### Task 4: Restyle LanguagePicker

**Files:**
- Modify: `src/components/LanguagePicker.jsx`

- [ ] **Step 1: Replace LanguagePicker.jsx**

```jsx
// src/components/LanguagePicker.jsx
// Shown once on first visit — stores choice in localStorage as pb_lang

export function LanguagePicker({ onSelect }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <div className="text-center">
        <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#bbb] mb-3">
          Choose language / Vállje giela
        </p>
        <h1 className="text-6xl font-black tracking-[-3px] text-[#111]">IlluPia</h1>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelect('en')}
          className="flex-1 flex flex-col items-center gap-3 p-5 border border-[#ddd] rounded-lg hover:border-[#111] transition-colors bg-white btn-animated btn-lift"
          aria-label="English"
        >
          <img src="/uk.jpg" alt="UK flag" className="w-11 h-8 object-cover rounded" />
          <div>
            <div className="text-sm font-bold text-[#111]">English</div>
            <div className="text-xs text-[#999] mt-0.5">English</div>
          </div>
        </button>

        <button
          onClick={() => onSelect('se')}
          className="flex-1 flex flex-col items-center gap-3 p-5 border border-[#ddd] rounded-lg hover:border-[#111] transition-colors bg-white btn-animated btn-lift"
          aria-label="Northern Sámi"
        >
          <img src="/sami.jpg" alt="Sámi flag" className="w-11 h-8 object-cover rounded" />
          <div>
            <div className="text-sm font-bold text-[#111]">Sámegiella</div>
            <div className="text-xs text-[#999] mt-0.5">Northern Sámi</div>
          </div>
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/LanguagePicker.jsx
git commit -m "feat: restyle LanguagePicker to B&W with bordered choice cards"
```

---

### Task 5: Restyle AuthButton

**Files:**
- Modify: `src/components/AuthButton.jsx`

- [ ] **Step 1: Replace AuthButton.jsx**

```jsx
// src/components/AuthButton.jsx

export function AuthButton({ label, connected, error, onConnect, onDisconnect, t }) {
  return (
    <div>
      <button
        onClick={connected ? onDisconnect : onConnect}
        className={[
          'py-1.5 px-3 rounded-full text-xs font-semibold border transition-colors btn-animated btn-lift',
          connected
            ? 'bg-white text-[#111] border-[#111] hover:border-red-500 hover:text-red-500'
            : 'bg-[#111] text-white border-[#111] hover:bg-[#333]',
        ].join(' ')}
      >
        {label} — {connected ? t.disconnect : t.connect}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-500 text-center">{t[error] ?? error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthButton.jsx
git commit -m "feat: restyle AuthButton to minimal pill with lift animation"
```

---

### Task 6: Restyle BridgePanel

**Files:**
- Modify: `src/components/BridgePanel.jsx`

Note: `title` prop is the section name ("Illu" / "Pia") displayed as a small-caps eyebrow. `subtitle` prop is `t.illuSub` ("YouTube → Spotify") displayed as the large heading. This matches how App.jsx already calls this component.

- [ ] **Step 1: Replace BridgePanel.jsx**

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
    <section className="px-6 py-9 border-b border-[#eee]">
      <p className="text-[10px] font-bold tracking-[2px] uppercase text-[#999] mb-1.5">{title}</p>
      <h2 className="text-[32px] font-black tracking-[-1px] leading-none text-[#111] mb-1">{subtitle}</h2>
      <p className="text-xs text-[#888] mb-5">{t.paste}</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={t.paste}
          disabled={isConverting}
          maxLength={512}
          className="flex-1 bg-[#fafafa] text-[#111] text-sm px-3 py-2.5 rounded border border-[#ddd] focus:outline-none focus:border-[#111] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isConverting || !url.trim()}
          className="px-5 py-2.5 bg-[#111] text-white text-sm font-bold rounded hover:bg-[#333] disabled:opacity-40 btn-animated btn-convert btn-wobble-in"
        >
          {isConverting ? (t[STATUS_LABELS[status]] ?? t.loading) : t.convert}
        </button>
      </form>

      {localError && (
        <p className="mt-2 text-xs text-red-500">{t[localError] ?? localError}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/BridgePanel.jsx
git commit -m "feat: restyle BridgePanel to full-section layout with convert animations"
```

---

### Task 7: Restyle ResultsView

**Files:**
- Modify: `src/components/ResultsView.jsx`

- [ ] **Step 1: Replace ResultsView.jsx**

```jsx
// src/components/ResultsView.jsx
import { URL_ALLOWLIST } from '../utils/sanitize';

// OWASP: validate result URL before rendering as a link
function isSafeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.port === '' && URL_ALLOWLIST.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function ResultsView({ results, onAgain, t }) {
  const { matched, missed, url } = results;

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[560px] py-16 space-y-6">
        <h1 className="text-4xl font-black tracking-[-1.5px] text-[#111]">{t.done}</h1>

        <div className="border-t border-[#eee] pt-6 space-y-3">
          <p className="flex items-baseline gap-3">
            <span className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#999]">{t.matched}</span>
            <strong className="text-2xl font-black text-[#111]">{matched}</strong>
          </p>
          <p className="flex items-baseline gap-3">
            <span className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#999]">{t.missed}</span>
            <strong className="text-2xl font-black text-[#111]">{missed.length}</strong>
          </p>
        </div>

        {missed.length > 0 && (
          <ul className="text-xs text-[#888] space-y-1 max-h-40 overflow-y-auto border-t border-[#eee] pt-4">
            {missed.map((track, i) => (
              <li key={i}>{track}</li>
            ))}
          </ul>
        )}

        <div className="flex gap-3 pt-4">
          {isSafeUrl(url) && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 bg-[#111] text-white text-sm font-bold rounded hover:bg-[#333] transition-colors btn-animated"
            >
              {t.open}
            </a>
          )}
          <button
            onClick={onAgain}
            className="flex-1 py-2.5 bg-white text-[#111] text-sm font-bold rounded border border-[#111] hover:bg-[#f5f5f5] transition-colors btn-animated"
          >
            {t.again}
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultsView.jsx
git commit -m "feat: restyle ResultsView to B&W with animated buttons"
```

---

### Task 8: Create AboutPage

**Files:**
- Create: `src/pages/AboutPage.jsx`

Photos `illu.jpg` and `pia.jpg` should be placed in `/public` before this task — if they haven't been added yet, the `<img>` tags will show a broken image indicator during development, which is acceptable.

- [ ] **Step 1: Create src/pages/AboutPage.jsx**

```jsx
// src/pages/AboutPage.jsx
import { Link } from 'react-router-dom';

export function AboutPage({ lang, onLangToggle, t }) {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      {/* Header — logo + lang toggle only, no auth buttons */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-[#eee]">
        <Link to="/" className="text-lg font-black tracking-[-0.5px] text-[#111] hover:opacity-70 transition-opacity">
          IlluPia
        </Link>
        <button
          onClick={onLangToggle}
          className="text-[11px] font-bold tracking-[0.5px] border border-[#111] px-2 py-1 rounded hover:bg-[#111] hover:text-white transition-colors"
        >
          {lang === 'en' ? 'EN' : 'SE'}
        </button>
      </header>

      <div className="max-w-[640px] mx-auto px-6 py-16">
        {/* Top back link */}
        <Link to="/" className="text-sm text-[#888] hover:text-[#111] transition-colors">
          {t.aboutBack}
        </Link>

        {/* Intro */}
        <div className="mt-10 mb-16">
          <h1 className="text-[clamp(28px,6vw,40px)] font-black tracking-[-1.5px] leading-[1.1] text-[#111] mb-5">
            {t.aboutIntro}
          </h1>
          <p className="text-base text-[#555] leading-relaxed max-w-[480px]">
            {t.aboutSubtext}
          </p>
        </div>

        {/* Illu */}
        <div className="border-t border-[#eee] pt-10 mb-14">
          <img
            src="/illu.jpg"
            alt="Illu"
            className="w-full rounded-sm object-cover max-h-[360px] mb-6"
          />
          <h2 className="text-[28px] font-black tracking-[-1px] text-[#111] mb-3">Illu</h2>
          <p className="text-[15px] text-[#555] leading-[1.75]">{t.illuStory}</p>
        </div>

        {/* Pia */}
        <div className="border-t border-[#eee] pt-10">
          <img
            src="/pia.jpg"
            alt="Pia"
            className="w-full rounded-sm object-cover max-h-[360px] mb-6"
          />
          <h2 className="text-[28px] font-black tracking-[-1px] text-[#111] mb-3">Pia</h2>
          <p className="text-[15px] text-[#555] leading-[1.75]">{t.piaStory}</p>
        </div>

        {/* Bottom back link */}
        <div className="border-t border-[#eee] mt-16 pt-8">
          <Link to="/" className="text-sm text-[#888] hover:text-[#111] transition-colors">
            {t.aboutBack}
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AboutPage.jsx
git commit -m "feat: create AboutPage at /about with intro, dog stories, photo slots"
```

---

### Task 9: Restructure App.jsx — hero, routing, header, About link

**Files:**
- Modify: `src/App.jsx`

This is the largest change. Logic (hooks, handleConnect, handleConvert) is untouched — only the JSX returned changes. The LanguagePicker gate runs before routing so it always shows first on any URL.

- [ ] **Step 1: Replace App.jsx**

```jsx
// src/App.jsx
import { useState, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { TRANSLATIONS } from './translations';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import { useRateLimiter } from './hooks/useRateLimiter';
import { useBridge } from './hooks/useBridge';
import { LanguagePicker } from './components/LanguagePicker';
import { AuthButton } from './components/AuthButton';
import { BridgePanel } from './components/BridgePanel';
import { ResultsView } from './components/ResultsView';
import { AboutPage } from './pages/AboutPage';

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

  function handleLangToggle() {
    handleLangSelect(lang === 'en' ? 'se' : 'en');
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

  // Gate: show language picker on first visit (runs before routing)
  if (!lang) return <LanguagePicker onSelect={handleLangSelect} />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          bridge.results ? (
            <ResultsView
              results={bridge.results}
              onAgain={() => { bridge.reset(); setActiveDirection(null); }}
              t={t}
            />
          ) : (
            <main className="min-h-screen bg-white text-[#111]">

              {/* Header */}
              <header className="flex items-center justify-between px-6 py-5 border-b border-[#eee]">
                <Link
                  to="/"
                  className="text-lg font-black tracking-[-0.5px] text-[#111] hover:opacity-70 transition-opacity"
                >
                  IlluPia
                </Link>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLangToggle}
                    className="text-[11px] font-bold tracking-[0.5px] border border-[#111] px-2 py-1 rounded hover:bg-[#111] hover:text-white transition-colors"
                  >
                    {lang === 'en' ? 'EN' : 'SE'}
                  </button>
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
              </header>

              {/* Hero */}
              <section className="px-6 py-12 border-b border-[#eee]">
                <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#999] mb-3">
                  Playlist Bridge
                </p>
                <h1 className="text-[clamp(36px,8vw,52px)] font-black tracking-[-2px] leading-[1.0] text-[#111] mb-4">
                  {t.heroHeading}
                </h1>
                <p className="text-sm text-[#888] max-w-[280px] leading-relaxed">
                  {t.heroTagline}
                </p>
              </section>

              {/* Global error */}
              {globalError && (
                <p className="px-6 pt-4 text-sm text-red-500 text-center">
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

              {/* About link */}
              <div className="px-6 py-10 flex justify-center">
                <Link
                  to="/about"
                  className="text-sm text-[#888] hover:text-[#111] transition-colors"
                >
                  {t.aboutLink} →
                </Link>
              </div>

            </main>
          )
        }
      />
      <Route
        path="/about"
        element={
          <AboutPage lang={lang} onLangToggle={handleLangToggle} t={t} />
        }
      />
    </Routes>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass. The hook tests don't import App.jsx so this is a runtime check only — confirm manually in the next step.

- [ ] **Step 3: Smoke test in the browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- If `pb_lang` is not in localStorage → LanguagePicker appears (white bg, bordered cards)
- After selecting a language → main page loads with hero, two converter sections, About link at bottom
- EN/SE toggle in header switches language and persists on reload
- Auth pills appear in top-right
- Clicking "About IlluPia →" navigates to `/about`
- `/about` page shows intro, photo slots (broken images OK if not added yet), Pia and Illu sections
- Back link on About page returns to `/`
- Convert buttons have wobble animation on load and rotate on hover
- Auth buttons lift slightly on hover

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: hero section, B&W layout, lang toggle header, About link, routing"
```

---

### Task 10: Final verification and push

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Build for production to catch any Vite/Tailwind issues**

```bash
npm run build
```

Expected: build completes with no errors. Warnings about bundle size are acceptable.

- [ ] **Step 3: Add .superpowers to .gitignore**

Check if `.superpowers/` is already in `.gitignore`:

```bash
grep superpowers /Users/arpithmadakkuni/IlluPia/.gitignore
```

If not present, add it:

```bash
echo '.superpowers/' >> /Users/arpithmadakkuni/IlluPia/.gitignore
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm session files"
```

- [ ] **Step 4: Push to remote**

```bash
git push
```

- [ ] **Step 5: Verify Vercel deployment**

After Vercel deploys, confirm:
- `illupia.com/` loads the main page
- `illupia.com/about` loads the About page (not a 404 — the SPA rewrite handles this)
- Language toggle persists across refreshes
- Auth flows still work end-to-end
