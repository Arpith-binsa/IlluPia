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
