# IlluPia — UI Redesign Spec
**Date:** 2026-04-07
**Approach:** Option A — restyle in-place + one new page component + React Router
**Scope:** Visual redesign, language toggle, button animations, About page at `/about`. Zero logic changes to auth/conversion.

---

## Overview

Redesign IlluPia's UI to a clean black-and-white aesthetic matching a modern design studio. Add a persistent in-header language toggle (EN/SE), playful CSS button animations, and a dedicated About page at `illupia.com/about` — a full-page tribute to the two dogs the app is named after. The main page links to it with an "About IlluPia" button at the bottom. All existing functionality — OAuth flows, PKCE, CSRF checks, rate limiting, conversion logic — remains completely unchanged.

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#ffffff` |
| Text | `#111111` |
| Border / divider | `#eeeeee` |
| Muted text | `#888888` |
| Eyebrow / label text | `#999999` |
| Button bg | `#111111` |
| Button text | `#ffffff` |
| Button hover bg | `#333333` |
| Input bg | `#fafafa` |
| Input border | `#dddddd` |
| Input focus border | `#111111` |
| Font | `'Outfit'`, system-ui fallback |

No gradients. No brand colors. Black, white, and hairline greys only.
**Exception:** Error messages stay `text-red-500` — accessibility requires errors to be visually distinct.

---

## Routing

React Router DOM (`react-router-dom`) is added as a dependency. `src/main.jsx` wraps the app in `<BrowserRouter>`. Two routes:

| Route | Component | Notes |
|---|---|---|
| `/` | `App.jsx` | Main converter page (existing) |
| `/about` | `src/pages/AboutPage.jsx` | New — About IlluPia |

`vercel.json` already has a catch-all SPA rewrite (`/((?!api/).*) → /index.html`) so `/about` works on Vercel without changes.

The `LanguagePicker` full-screen gate (`if (!lang)`) runs before routing — if no language is stored, the picker is shown regardless of which URL the user is on. After selecting a language, they land on whichever route they originally requested.

---

## Page Layout: Main (`/`)

### Header (always visible on both pages)
```
[ IlluPia ]                    [ EN ]  [ Spotify — Connect ]  [ YouTube ✓ ]
```
- Logo: `IlluPia`, 18px, weight 800, left-aligned — is a `<Link to="/">` (React Router)
- Language toggle: small bordered pill showing `EN` or `SE`, toggles on click
- Auth buttons: minimal pills — service name + connect/disconnect status
- Bottom border: 1px `#eeeeee`

### Hero Section
- Eyebrow: `PLAYLIST BRIDGE` (small caps, tracked, muted) — hardcoded, not translated (decorative)
- Heading: large (`clamp(36px, 8vw, 52px)`), weight 900, tight letter-spacing — `t.heroHeading`
- Tagline: 14px, muted, max-width ~280px — `t.heroTagline`
- Padding: 48px top, 40px bottom
- Bottom border: 1px `#eeeeee`

### Converter Sections (Illu + Pia)
Each gets its own full-width section separated by a 1px border — not a card:
```
ILLU                           ← small caps label (hardcoded — it's a name)
YouTube → Spotify              ← large bold title (32px, weight 900) — t.illuSub already exists
Paste a YouTube playlist link  ← t.paste label, muted (12px)

[ URL input ________________________________ ] [ Convert ]
```
- Section padding: 36px vertical, 24px horizontal
- Input: 1px `#dddddd` border, focus → `#111`
- Convert button: black bg, white text, animated (see Animations)

### Bottom of Main Page
After the Pia section, a minimal link to the About page:
```
────────────────────────────────
[ About IlluPia → ]            ← text link, subtle, not a CTA button
```
- Styled as a quiet text link (`t.aboutLink`), right-arrow indicator
- Uses `<Link to="/about">` (React Router)
- No border card, no bg — just text at the bottom of the page with generous padding

---

## Page Layout: About (`/about`)

### Structure
```
← IlluPia                     ← back link (top left), links to "/"

IlluPia is named after
two of the greatest dogs
to ever live.                  ← large intro heading (t.aboutIntro)

Illu is still here, bounding
through life. Pia is gone —
but every playlist carries
something of her.              ← intro subtext (t.aboutSubtext)

──────────────────────────────

[ photo of Illu ]

Illu                           ← 28px bold
t.illuStory                    ← story text, 15px, comfortable line-height

──────────────────────────────

[ photo of Pia ]

Pia                            ← 28px bold
t.piaStory                     ← story text

──────────────────────────────

← IlluPia                     ← back link repeated at bottom
```

### Photo handling
- Images placed in `/public/illu.jpg` and `/public/pia.jpg` by the user
- Rendered as `<img src="/illu.jpg" alt="Illu" />` with `w-full rounded-sm object-cover` Tailwind classes, max-height ~360px
- If an image hasn't been added yet, the `<img>` tag will simply show a broken image — acceptable during development. No elaborate placeholder needed.

### Layout constraints
- Max-width: `640px`, centered, generous padding (`24px` horizontal, `64px` vertical)
- The page shares the same header as the main page (logo + lang toggle)
- Auth buttons are **not shown** on the About page — they're irrelevant to this context
- No convert functionality on this page

---

## LanguagePicker (first visit only)

Full-screen, white background, same B&W typography as the rest of the app:
- Eyebrow: `"Choose language / Vállje giela"` — bilingual so a Sámi-only reader can navigate it
- Title: `"IlluPia"` large, weight 900
- Two bordered choice cards side by side: flag image + language name + native name
- Cards: white bg, 1.5px `#dddddd` border, hover → `#111`
- On select: stores `pb_lang` in localStorage, app re-renders into the correct route

After first visit, the header toggle handles all language switching.

---

## ResultsView

Same B&W treatment as the rest of the app:
- White background, black text
- "Open playlist" (`<a>` tag): black bg, white text
- "Convert another" (button): white bg, black border, black text
- Matched/missed counts in plain text, no color coding
- Error messages stay `text-red-500`

---

## Language Toggle (Header)

- Small bordered pill: `EN` or `SE`, always visible in the header on both pages
- On click: toggles between the two, writes to `localStorage('pb_lang')`, calls `handleLangSelect`
- Inline in the header JSX — no separate component
- The About page shares the same header, so the toggle works there too

---

## New Translation Keys

Added to both `en` and `se` in `src/translations.js`. Sámi values use English placeholder text until the user fills them in.

| Key | English value |
|---|---|
| `heroHeading` | `"Move music between worlds."` |
| `heroTagline` | `"Convert playlists between Spotify and YouTube — in both directions."` |
| `aboutLink` | `"About IlluPia"` |
| `aboutBack` | `"← IlluPia"` |
| `aboutIntro` | `"IlluPia is named after two of the greatest dogs to ever live."` |
| `aboutSubtext` | `"Illu is still here, bounding through life. Pia is gone — but every playlist carries something of her."` |
| `illuStory` | `"[Placeholder — Illu's story goes here.]"` |
| `piaStory` | `"[Placeholder — Pia's story goes here.]"` |

---

## Button Animations

Pure CSS in `src/index.css` — no Framer Motion.

```css
/* Base: bounce scale on hover, pop on click */
.btn-animated {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 150ms ease,
              border-color 150ms ease;
}
.btn-animated:hover:not(:disabled) { transform: scale(1.04); }
.btn-animated:active:not(:disabled) { transform: scale(0.97); }
.btn-animated:disabled { cursor: not-allowed; }

/* Lift: auth pills and choice cards */
.btn-lift:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); }

/* Convert: rotate + scale */
.btn-convert:hover:not(:disabled) { transform: scale(1.04) rotate(1.5deg); }

/* Entry wobble: fires once on mount (Convert button only) */
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

| Component | Classes |
|---|---|
| `BridgePanel` Convert button | `btn-animated btn-convert btn-wobble-in` |
| `AuthButton` | `btn-animated btn-lift` |
| `ResultsView` Open playlist | `btn-animated` |
| `ResultsView` Convert another | `btn-animated` |
| `LanguagePicker` choice cards | `btn-animated btn-lift` |

---

## Files Changed

| File | Change |
|---|---|
| `package.json` | Add `react-router-dom` |
| `src/main.jsx` | Wrap app in `<BrowserRouter>` |
| `src/index.css` | White/black body defaults; animation utility classes |
| `src/translations.js` | Add 8 new keys to `en` and `se` |
| `src/App.jsx` | Add hero, converter sections, "About IlluPia" footer link, inline lang toggle; wire up React Router `<Routes>` |
| `src/components/LanguagePicker.jsx` | Restyle to B&W |
| `src/components/AuthButton.jsx` | Minimal pill style + `btn-animated btn-lift` |
| `src/components/BridgePanel.jsx` | Full-section layout + animations |
| `src/components/ResultsView.jsx` | B&W restyle + `btn-animated` |
| `src/pages/AboutPage.jsx` | **New file** — About page with intro, dog stories, photos |

**No changes to:** hooks, services, utilities, API functions, `vercel.json`, `vite.config.js`, test files.

---

## What is NOT in scope

- Framer Motion
- More than two routes
- Mobile-specific breakpoints beyond Tailwind defaults
- Dark mode toggle
- Real About copy in Sámi (user adds to `translations.js` directly)
- Lightbox or gallery for photos (plain `<img>` tags)
