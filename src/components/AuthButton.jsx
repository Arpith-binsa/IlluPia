// src/components/AuthButton.jsx

export function AuthButton({ label, connected, error, onConnect, onDisconnect, t }) {
  return (
    <div className="flex-1">
      <button
        onClick={connected ? onDisconnect : onConnect}
        className={[
          'w-full py-2 px-4 rounded text-sm font-semibold font-["Outfit"] transition-colors',
          connected
            ? 'bg-[#161616] text-[#f0f0f0] border border-[#333] hover:border-red-500 hover:text-red-400'
            : 'bg-[#f0f0f0] text-[#0d0d0d] hover:bg-[#d0d0d0]',
        ].join(' ')}
      >
        {label} — {connected ? t.disconnect : t.connect}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-400 text-center">{t[error] ?? error}</p>
      )}
    </div>
  );
}
