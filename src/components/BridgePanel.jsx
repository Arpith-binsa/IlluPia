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
          type="text"
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
