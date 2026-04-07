// src/components/LanguagePicker.jsx
// Shown once on first visit — stores choice in localStorage as pb_lang

export function LanguagePicker({ onSelect }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <div className="text-center">
        <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[#bbb] mb-3">
          Choose language / Vállje giela
        </p>
        <h1 className="text-6xl font-black tracking-[-3px] text-[#111]">IlluPia</h1>
      </div>

      <div className="flex gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelect('en')}
          className="flex-1 flex flex-col items-center gap-3 p-5 border border-[#ddd] rounded-lg hover:border-[#111] transition-colors bg-white btn-animated btn-lift"
          aria-label="English"
        >
          <img src="/uk.jpg" alt="UK flag" className="w-11 h-8 object-cover rounded" />
          <div>
            <div className="text-sm font-bold text-[#111]">English</div>
            <div className="text-xs text-[#999] mt-0.5">English</div>
          </div>
        </button>

        <button
          onClick={() => onSelect('se')}
          className="flex-1 flex flex-col items-center gap-3 p-5 border border-[#ddd] rounded-lg hover:border-[#111] transition-colors bg-white btn-animated btn-lift"
          aria-label="Northern Sámi"
        >
          <img src="/sami.jpg" alt="Sámi flag" className="w-11 h-8 object-cover rounded" />
          <div>
            <div className="text-sm font-bold text-[#111]">Sámegiella</div>
            <div className="text-xs text-[#999] mt-0.5">Northern Sámi</div>
          </div>
        </button>
      </div>
    </main>
  );
}
