import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import type { AppLanguage } from '../types/psi159';
import { useStrings } from '../utils/i18n';
import { resolvePublicAssetPath } from '../utils/parsePsi159';

interface CoverScreenProps {
  onEnter: () => void;
}

const LANGS: Array<{ code: AppLanguage; label: string }> = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

// Deterministic crisp starfield coordinates in normalized 1200x800 space
const STARS = Array.from({ length: 48 }, (_, idx) => {
  const x = ((idx * 173 + 47) % 1160) + 20;
  const y = ((idx * 257 + 31) % 760) + 20;
  const r = idx % 5 === 0 ? 1.4 : idx % 2 === 0 ? 1.0 : 0.75;
  const opacity = 0.22 + ((idx * 19) % 50) / 100;
  return { id: idx, x, y, r, opacity };
});

export const CoverScreen: React.FC<CoverScreenProps> = ({ onEnter }) => {
  const lang = usePsiStore((s) => s.lang);
  const setLang = usePsiStore((s) => s.setLang);
  const t = useStrings(lang);

  const [leaving, setLeaving] = useState(false);
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  const handleOpen = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    enterTimerRef.current = window.setTimeout(() => {
      onEnter();
    }, 300);
  }, [leaving, onEnter]);

  useEffect(() => {
    ctaRef.current?.focus();
    return () => {
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (leaving) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl?.dataset.coverLangBtn === 'true') {
        return;
      }

      e.preventDefault();
      handleOpen();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [leaving, handleOpen]);

  return (
    <div
      style={{ zIndex: 'var(--z-modal)' }}
      className={`fixed inset-0 flex h-dvh min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#0B1020] text-slate-100 transition-opacity duration-300 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background: deep dark space gradient, static starfield & subtle spherical blue 0g flame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 50% 42%, rgba(14, 165, 233, 0.14) 0%, rgba(15, 23, 42, 0.94) 56%, #060913 100%)',
        }}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="coverFlameOuter" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.24" />
              <stop offset="48%" stopColor="#06B6D4" stopOpacity="0.12" />
              <stop offset="76%" stopColor="#6366F1" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0B1020" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="coverFlameCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {STARS.map((star) => (
            <circle
              key={star.id}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="#E2E8F0"
              opacity={star.opacity}
            />
          ))}

          <circle cx="600" cy="340" r="270" fill="url(#coverFlameOuter)" />
          <circle
            cx="600"
            cy="340"
            r="165"
            fill="url(#coverFlameCore)"
            stroke="rgba(56, 189, 248, 0.16)"
            strokeWidth="1"
          />
          <circle
            cx="600"
            cy="340"
            r="225"
            fill="none"
            stroke="rgba(125, 211, 252, 0.08)"
            strokeDasharray="4 8"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Top Bar: Language Selector PT | EN | ES in top-right */}
      <header className="relative z-10 flex w-full shrink-0 items-center justify-end px-4 pt-3 sm:px-6 sm:pt-5">
        <div
          role="group"
          aria-label={t.cover.langGroupAria}
          className="inline-flex items-center gap-0.5 rounded-lg border border-slate-700/90 bg-[#0F172A]/90 p-1 shadow-lg shadow-black/30 backdrop-blur-sm"
        >
          {LANGS.map(({ code, label }) => {
            const active = lang === code;
            return (
              <button
                key={code}
                type="button"
                data-cover-lang-btn="true"
                onClick={() => setLang(code)}
                aria-pressed={active}
                className={`min-h-[38px] min-w-[44px] rounded-md px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  active
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Center Single-Column Hero */}
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-2 text-center">
        <div className="relative mb-4 flex items-center justify-center sm:mb-6">
          <div
            aria-hidden="true"
            className="cover-logo-pulse absolute h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl sm:h-40 sm:w-40"
          />
          <img
            src={resolvePublicAssetPath('assets/aistudio/IMG-20261114-WA0163.jpg-removebg-preview_43bf9c1e.png')}
            alt={t.logoAlt}
            className="cover-logo-pulse relative h-24 w-auto object-contain sm:h-28 md:h-32"
          />
        </div>

        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl md:text-6xl">
          {t.appTitle}
        </h1>

        <p className="mt-3 max-w-xl text-base font-medium leading-snug text-slate-200 sm:mt-4 sm:text-xl">
          {t.cover.subtitle}
        </p>

        <div className="mt-6 sm:mt-8">
          <button
            ref={ctaRef}
            type="button"
            onClick={handleOpen}
            aria-label={t.cover.ctaAria}
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-cyan-400 px-8 py-3.5 text-base font-bold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.34)] transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1020] sm:text-lg"
          >
            <span>{t.cover.cta}</span>
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </main>

      {/* Bottom Source Credit */}
      <footer className="relative z-10 w-full shrink-0 px-4 pb-4 text-center sm:pb-6">
        <p className="text-xs font-medium leading-relaxed text-[#B4C3D8] sm:text-sm">
          {t.cover.credit}
        </p>
      </footer>
    </div>
  );
};
