// src/pages/AboutPage.jsx
import { Link } from 'react-router-dom';

export function AboutPage({ lang, onLangToggle, t }) {
  return (
    <main className="min-h-screen bg-white text-[#111]">
      {/* Header — logo + lang toggle only, no auth buttons */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-[#eee]">
        <Link to="/" className="text-lg font-black tracking-[-0.5px] text-[#111] hover:opacity-70 transition-opacity">
          IlluPia
        </Link>
        <button
          onClick={onLangToggle}
          className="text-[11px] font-bold tracking-[0.5px] border border-[#111] px-2 py-1 rounded hover:bg-[#111] hover:text-white transition-colors"
        >
          {lang === 'en' ? 'EN' : 'SE'}
        </button>
      </header>

      <div className="max-w-[640px] mx-auto px-6 py-16">
        {/* Top back link */}
        <Link to="/" className="text-sm text-[#888] hover:text-[#111] transition-colors">
          {t.aboutBack}
        </Link>

        {/* Intro */}
        <div className="mt-10 mb-16">
          <h1 className="text-[clamp(28px,6vw,40px)] font-black tracking-[-1.5px] leading-[1.1] text-[#111] mb-5">
            {t.aboutIntro}
          </h1>
          <p className="text-base text-[#555] leading-relaxed max-w-[480px]">
            {t.aboutSubtext}
          </p>
        </div>

        {/* Illu */}
        <div className="border-t border-[#eee] pt-10 mb-14">
          <img
            src="/illu.jpg"
            alt="Illu"
            className="w-full rounded-sm object-cover max-h-[360px] mb-6"
          />
          <h2 className="text-[28px] font-black tracking-[-1px] text-[#111] mb-3">Illu</h2>
          <p className="text-[15px] text-[#555] leading-[1.75]">{t.illuStory}</p>
        </div>

        {/* Pia */}
        <div className="border-t border-[#eee] pt-10">
          <img
            src="/pia.jpg"
            alt="Pia"
            className="w-full rounded-sm object-cover max-h-[360px] mb-6"
          />
          <h2 className="text-[28px] font-black tracking-[-1px] text-[#111] mb-3">Pia</h2>
          <p className="text-[15px] text-[#555] leading-[1.75]">{t.piaStory}</p>
        </div>

        {/* Bottom back link */}
        <div className="border-t border-[#eee] mt-16 pt-8">
          <Link to="/" className="text-sm text-[#888] hover:text-[#111] transition-colors">
            {t.aboutBack}
          </Link>
        </div>
      </div>
    </main>
  );
}
