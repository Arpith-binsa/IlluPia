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
    function handleAgain() {
      bridge.reset();
      setActiveDirection(null);
    }
    return <ResultsView results={bridge.results} onAgain={handleAgain} t={t} />;
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
