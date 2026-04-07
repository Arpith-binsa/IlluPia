# IlluPia — UI Redesign Spec
**Date:** 2026-04-07
**Approach:** Option A — restyle in-place, no new component files
**Scope:** Visual redesign + language toggle + button animations. Zero logic changes.

---

## Overview

Redesign IlluPia's UI to a clean black-and-white aesthetic matching a modern design studio. Add a persistent in-header language toggle (EN/SE), an About section with placeholder story copy, and playful CSS button animations. All existing functionality — OAuth flows, PKCE, CSRF checks, rate limiting, conversion logic — remains completely unchanged.

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

---

## Page Layout

### Header (always visible)
```
[ IlluPia ]                    [ EN ]  [ Spotify — Connect ]  [ YouTube ✓ ]
```
- Logo: `IlluPia`, 18px, weight 800, left-aligned
- Language toggle: small bordered pill showing `EN` or `SE`, toggles on click, right side
- Auth buttons: minimal pills, unobtrusive — show service name + connect/disconnect status
- Bottom border: 1px `#eeeeee`

### Hero Section
- Eyebrow: `PLAYLIST BRIDGE` (small caps, tracked, muted)
- Heading: large (clamp ~40–52px), weight 900, tight letter-spacing — placeholder: `"Move music between worlds."`
- Tagline: 14px, muted, max-width ~280px — pulled from `t.heroTagline`
- Generous vertical padding (48px top, 40px bottom)
- Bottom border: 1px `#eeeeee`

### Converter Sections (Illu + Pia)
Each gets its own full-width section (not a card), separated by a 1px border:
```
ILLU                           ← small caps label
YouTube → Spotify              ← large bold title (32px, weight 900)
Paste a YouTube playlist link  ← muted subtitle (12px)

[ URL input field _________________________ ] [ Convert ]
```
- Section padding: 36px vertical, 24px horizontal
- Input: full-width minus button, 1px border, focus ring switches border to `#111`
- Convert button: black bg, white text, animated (see Animations)

### About Section
Below the two converter sections:
```
ABOUT                          ← small caps eyebrow

Illu                           ← 20px bold title
[placeholder story text]       ← 12px, muted, line-height 1.7

────────────────────           ← hairline divider

Pia
[placeholder story text]
```
- Padding: 40px top, 36px bottom, 24px horizontal
- Stories keyed to `t.illuStory` and `t.piaStory` — placeholder English text added now, Sámi to be filled in later

### LanguagePicker (first visit only)
Full-screen, white background, same typography as the rest of the app:
- Eyebrow: `"Choose language / Vállje giela"` (bilingual — so a Sámi-only reader can navigate before selecting)
- Title: `"IlluPia"` large, weight 900
- Two bordered choice cards side by side: flag image + language name + native name
- Cards: white bg, 1.5px `#dddddd` border, hover → border goes `#111`
- On select: stores `pb_lang` in localStorage, renders the main app

After first visit, the full-screen picker is never shown again. Language is changed via the header toggle.

### ResultsView
Same B&W treatment:
- White background, black text
- "Open playlist" button: black bg, white text (same as Convert)
- "Convert another" button: white bg, black border, black text
- Matched/missed counts in plain text, no color coding
- **Error messages stay red** (`text-red-500`) — intentional accessibility exception so errors are clearly distinct from normal content. This is the only color in the UI.

---

## Language Toggle (Header)

- Renders as a small bordered button: `EN` or `SE`
- On click: toggles between the two, writes to `localStorage('pb_lang')`, updates `lang` state in `App.jsx`
- Lives inside the existing `handleLangSelect` flow — same function the LanguagePicker already calls
- No separate component needed — inline in the header JSX in `App.jsx`

---

## New Translation Keys

The following keys must be added to both `en` and `se` objects in `src/translations.js`:

| Key | English value | Sámi |
|---|---|---|
| `heroHeading` | `"Move music between worlds."` | *(to be added by user)* |
| `heroTagline` | `"Convert playlists between Spotify and YouTube — in both directions."` | *(to be added by user)* |
| `aboutTitle` | `"About"` | *(to be added by user)* |
| `illuStory` | `"[Placeholder — Illu's story goes here.]"` | *(to be added by user)* |
| `piaStory` | `"[Placeholder — Pia's story goes here.]"` | *(to be added by user)* |

Sámi placeholder values in code: same English placeholder text until the user fills them in (empty string would render nothing, which is confusing).

---

## Button Animations

Implemented as pure CSS in `src/index.css` — no Framer Motion required.

### Utility classes (added to `index.css`)

```css
/* Base interactive button */
.btn-animated {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 150ms ease,
              border-color 150ms ease;
}
.btn-animated:hover:not(:disabled) {
  transform: scale(1.04);
}
.btn-animated:active:not(:disabled) {
  transform: scale(0.97);
}
.btn-animated:disabled {
  cursor: not-allowed;
}

/* Lift variant — auth pills */
.btn-lift:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
}

/* Convert button — rotate + scale on hover */
.btn-convert:hover:not(:disabled) {
  transform: scale(1.04) rotate(1.5deg);
}

/* Entry wobble — plays once on mount */
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

### Applied to components

| Component | Classes |
|---|---|
| `BridgePanel` Convert button | `btn-animated btn-convert btn-wobble-in` |
| `AuthButton` connect/disconnect | `btn-animated btn-lift` |
| `ResultsView` Open playlist link | `btn-animated` |
| `ResultsView` Convert another | `btn-animated` |
| `LanguagePicker` choice cards | `btn-animated btn-lift` |

---

## Files Changed

| File | Change summary |
|---|---|
| `src/index.css` | White bg, black text body defaults; add `btn-animated`, `btn-lift`, `btn-convert`, `btn-wobble-in` CSS classes and `@keyframes wobble-in` |
| `src/translations.js` | Add `heroTagline`, `aboutTitle`, `illuStory`, `piaStory` to `en` and `se` |
| `src/App.jsx` | Add hero section, about section, inline lang toggle in header; remove dark bg; keep all hook/logic unchanged |
| `src/components/LanguagePicker.jsx` | White bg, bordered choice cards, bilingual eyebrow, same flag images |
| `src/components/AuthButton.jsx` | Minimal pill style, `btn-animated btn-lift` |
| `src/components/BridgePanel.jsx` | Full-section layout, large title, `btn-animated btn-convert btn-wobble-in` on Convert button |
| `src/components/ResultsView.jsx` | White bg, B&W buttons, `btn-animated` |

**No changes to:** any hook, service, utility, API function, `vercel.json`, `vite.config.js`, or test file.

---

## What is NOT in scope

- Framer Motion (not installed, not needed)
- New component files
- Any logic, auth, rate limiting, or conversion changes
- Responsive / mobile-specific breakpoints beyond Tailwind defaults
- Dark mode toggle
- Real About copy (user will add EN + Sámi text directly to `translations.js`)
