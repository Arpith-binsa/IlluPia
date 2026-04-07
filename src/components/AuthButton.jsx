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
