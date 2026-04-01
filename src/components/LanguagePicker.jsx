// src/components/LanguagePicker.jsx
// Shown once on first visit — stores choice in localStorage as pb_lang

export function LanguagePicker({ onSelect }) {
  return (
    <main className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold text-[#f0f0f0] font-['Outfit']">IlluPia</h1>
      <div className="flex gap-6">
        {/* English */}
        <button
          onClick={() => onSelect('en')}
          className="flex flex-col items-center gap-2 text-[#f0f0f0] opacity-80 hover:opacity-100 transition-opacity"
          aria-label="English"
        >
          <img src="/uk.jpg" alt="UK flag" className="w-12 h-8 object-cover rounded" /> 
          <span className="text-sm font-['Outfit']">English</span>
        </button>

        {/* Northern Sámi */}
        <button
          onClick={() => onSelect('se')}
          className="flex flex-col items-center gap-2 text-[#f0f0f0] opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Northern Sámi"
        >
          <img src="/sami.jpg" alt="Sámi flag" className="w-12 h-8 object-cover rounded" />
          <span className="text-sm font-['Outfit']">Sámegiella</span>
        </button>
      </div>
    </main>
  );
}
