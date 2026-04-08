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

        {/* Heading */}
        <h1 className="mt-10 mb-8 text-[clamp(32px,7vw,48px)] font-black tracking-[-2px] leading-[1.0] text-[#111]">
          {t.aboutIntro}
        </h1>

        {/* Story */}
        <p className="text-[15px] text-[#555] leading-[1.8] mb-14">
          {t.aboutStory}
        </p>

        {/* Photos — Pia first, she comes first in the story */}
        <div className="space-y-10">
          <div>
            <img
              src="/pia.jpg"
              alt="Pia"
              className="w-full rounded-sm object-cover max-h-[400px]"
            />
            <p className="mt-2 text-xs text-[#999] tracking-[1px] uppercase">Pia</p>
          </div>
          <div>
            <img
              src="/illu.jpg"
              alt="Illu"
              className="w-full rounded-sm object-cover max-h-[400px]"
            />
            <p className="mt-2 text-xs text-[#999] tracking-[1px] uppercase">Illu</p>
          </div>
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
