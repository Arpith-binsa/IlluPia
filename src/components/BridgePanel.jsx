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
