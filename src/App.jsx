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
