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
