import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Earth,
  Flame,
  ShieldAlert,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import type { Psi159Test } from '../types/psi159';
import { computeDiscoveries, computeLunarTop10 } from '../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
} from '../utils/formatters';
import { useStrings } from '../utils/i18n';
import { ChartCard } from './ChartCard';
import { ChartErrorBoundary } from './ChartErrorBoundary';

interface LunarTop10CardProps {
  tests: Psi159Test[];
  loading?: boolean;
  compact?: boolean;
}

export const LunarTop10Card: React.FC<LunarTop10CardProps> = ({
  tests,
  loading = false,
  compact = false,
}) => {
  const selectTest = usePsiStore((s) => s.selectTest);
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const top10 = useMemo(() => computeLunarTop10(tests), [tests]);

  return (
    <ChartCard
      title={tStr.top10.title}
      subtitle={tStr.top10.subtitle}
      helpTitle={tStr.top10.howWeCalc}
      helpBody={tStr.top10.helpTip}
      chartContextPrompt={tStr.prompts.explainLunarTop10}
      chartContextLabel={tStr.top10.title}
      isEmpty={top10.length === 0}
      loading={loading}
      plotAutoHeight
    >
      <div
        className={`divide-y divide-slate-800/70 overflow-y-auto ${
          compact ? 'max-h-[280px]' : 'max-h-[420px]'
        }`}
      >
        {top10.map((item, idx) => {
          const t = item.test;
          const isSel = t.test_id === selectedTestId;
          const meta = outcomeMeta(t.outcome, lang);
          return (
            <button
              key={t.test_id}
              type="button"
              onClick={() => selectTest(t.test_id, true)}
              className={`flex w-full items-center justify-between gap-2 px-2 py-2 text-left transition-colors ${
                isSel ? 'bg-cyan-500/15' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="chart-text-annotation flex min-h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded bg-slate-800 px-1 font-mono font-bold text-slate-200">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="chart-text-axis whitespace-nowrap font-mono font-semibold text-cyan-300">
                      {t.test_id}
                    </span>
                    <span className="chart-text-annotation wrap-anywhere text-[#B4C3D8]">
                      {fuelLabel(t.fuel, lang)} · {flameTypeLabel(t.flame_type, lang)}
                    </span>
                    {item.inLunarZone && (
                      <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1 text-[11px] text-emerald-300">
                        LUNAR
                      </span>
                    )}
                    {t.cool_flame && (
                      <span className="whitespace-nowrap rounded border border-purple-500/40 bg-purple-500/15 px-1 text-[11px] text-purple-200">
                        ◆
                      </span>
                    )}
                  </div>
                  <div className="chart-text-annotation wrap-anywhere mt-0.5 font-mono tabular-nums text-[#B4C3D8]">
                    O₂ {Math.round(t.o2_fraction * 100)}% ·{' '}
                    {formatNumber(t.pressure_psi, 1, lang)} psi ·{' '}
                    {t.peak_burner_temp_c !== null
                      ? `${formatNumber(t.peak_burner_temp_c, 0, lang)} °C`
                      : '—'}{' '}
                    · {meta.label}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="chart-text-axis font-mono font-bold tabular-nums text-emerald-300">
                  {formatNumber(item.score, 1, lang)}
                </div>
                <div className="chart-text-annotation text-[#B4C3D8]">{tStr.top10.pts}</div>
              </div>
            </button>
          );
        })}
      </div>
    </ChartCard>
  );
};

interface OverviewDiscoveriesCardProps {
  tests: Psi159Test[];
  onMoreAnalyses?: () => void;
}

export const OverviewDiscoveriesCard: React.FC<OverviewDiscoveriesCardProps> = ({
  tests,
  onMoreAnalyses,
}) => {
  const lang = usePsiStore((s) => s.lang);
  const setLunarRankingModalOpen = usePsiStore((s) => s.setLunarRankingModalOpen);
  const tStr = useStrings(lang);

  const top3 = useMemo(
    () => computeDiscoveries(tests, lang).slice(0, 3),
    [tests, lang]
  );

  const toneDotColor = (tone: string) => {
    switch (tone) {
      case 'red':
        return 'text-red-300';
      case 'emerald':
        return 'text-emerald-300';
      case 'purple':
        return 'text-purple-300';
      case 'amber':
        return 'text-amber-300';
      default:
        return 'text-cyan-300';
    }
  };

  return (
    <section
      aria-label={tStr.nav.discoveriesTitle}
      className="flex shrink-0 flex-col rounded-xl border border-slate-800/90 bg-[#121A30] px-2.5 py-2 shadow-lg shadow-black/25"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Compass className="h-4 w-4 shrink-0 text-cyan-300" />
          <h3 className="chart-text-axis truncate font-semibold text-slate-100">
            {tStr.nav.discoveriesTitle}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLunarRankingModalOpen(true)}
            className="chrome-text-xs inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            <span>{tStr.nav.viewLunarRanking}</span>
          </button>
          {onMoreAnalyses && (
            <button
              type="button"
              onClick={onMoreAnalyses}
              className="chrome-text-xs inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded-md border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20 focus:outline-none focus:ring-1 focus:ring-cyan-400 md:hidden"
            >
              <span>{tStr.tabs.analyses}</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {top3.length === 0 ? (
        <p className="chart-text-annotation py-2 text-slate-400">
          {tStr.chartCard.emptyTitle}
        </p>
      ) : (
        <ul className="divide-y divide-slate-800/70">
          {top3.map((item) => (
            <li
              key={item.id}
              title={item.description}
              className="flex items-baseline justify-between gap-2 py-1 first:pt-1.5 last:pb-0"
            >
              <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <span
                  className={`chrome-text-xs shrink-0 font-semibold ${toneDotColor(
                    item.tone
                  )}`}
                >
                  {item.title}:
                </span>
                <span className="chrome-text-xs min-w-0 flex-1 truncate text-[#B4C3D8]">
                  {item.description}
                </span>
              </div>
              <span className="chrome-text-xs shrink-0 whitespace-nowrap font-mono font-bold tabular-nums text-slate-100">
                {item.metric}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

interface LunarRankingModalProps {
  tests: Psi159Test[];
  loading?: boolean;
}

export const LunarRankingModal: React.FC<LunarRankingModalProps> = ({
  tests,
  loading = false,
}) => {
  const open = usePsiStore((s) => s.lunarRankingModalOpen);
  const setOpen = usePsiStore((s) => s.setLunarRankingModalOpen);
  const setActiveTab = usePsiStore((s) => s.setActiveTab);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      requestAnimationFrame(() =>
        previousFocusRef.current?.focus({ preventScroll: true })
      );
    };
  }, [open, setOpen]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      style={{ zIndex: 'calc(var(--z-modal) + 10)' }}
      className="fixed inset-0 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs md:p-6"
      onClick={() => setOpen(false)}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={tStr.top10.title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700 bg-[#0F172A] p-4 shadow-2xl shadow-black"
      >
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-400" />
            <h2 className="chart-text-axis font-bold text-slate-100">
              {tStr.top10.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setActiveTab('analyses');
              }}
              className="chrome-text-xs inline-flex min-h-[28px] items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 font-medium text-cyan-200 hover:bg-cyan-500/20"
            >
              <span>{tStr.nav.moreAnalyses}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tStr.drawer.close}
              className="flex min-h-[30px] min-w-[30px] items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChartErrorBoundary variant="card" title={tStr.top10.title}>
            <LunarTop10Card tests={tests} loading={loading} />
          </ChartErrorBoundary>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface InsightsSectionProps {
  tests: Psi159Test[];
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({ tests }) => {
  const askAi = usePsiStore((s) => s.askAi);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const discoveries = useMemo(() => computeDiscoveries(tests, lang), [tests, lang]);

  const toneStyle = (tone: string) => {
    switch (tone) {
      case 'red':
        return 'border-red-500/30 bg-red-500/5 text-red-300';
      case 'emerald':
        return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300';
      case 'purple':
        return 'border-purple-500/30 bg-purple-500/5 text-purple-300';
      case 'amber':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-300';
      default:
        return 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300';
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-100"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 wrap-anywhere">
          <span className="font-semibold text-amber-200">
            {tStr.insights.honestTitle}
          </span>{' '}
          {tStr.insights.honestBody}
        </div>
      </div>

      {discoveries.length > 0 && (
        <div className="board-row-2">
          {discoveries.map((card) => (
            <div
              key={card.id}
              className={`min-w-0 rounded-xl border p-3.5 ${toneStyle(card.tone)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="wrap-anywhere text-[11px] font-semibold uppercase tracking-wide">
                  {card.title}
                </span>
                <Compass className="h-3.5 w-3.5 shrink-0 opacity-75" />
              </div>
              <div className="mt-1.5 font-mono text-lg font-bold tabular-nums text-slate-100">
                {card.metric}
              </div>
              <p className="wrap-anywhere mt-1 text-[11px] text-slate-300">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="board-2col">
        <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121A30] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <Earth className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="wrap-anywhere">{tStr.insights.earthTitle}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                askAi(
                  tStr.prompts.explainEarthAnalogies,
                  tStr.insights.earthTitle,
                  'explain_chart'
                )
              }
              className="inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300 hover:bg-cyan-500/20"
            >
              <Sparkles className="h-3 w-3 shrink-0" />
              {tStr.insights.earthDeepen}
            </button>
          </div>
          <ul className="mt-2.5 space-y-2 text-xs text-slate-300">
            <li className="wrap-anywhere">
              •{' '}
              {lang === 'en'
                ? 'Engine knock analogy: cool flames occur inside Earth gasoline cylinders before spark ignition. On the ISS they stabilize into long-lasting spheres.'
                : lang === 'es'
                  ? 'Analogía del motor: las llamas frías ocurren dentro de cilindros antes de la chispa. En la ISS se estabilizan durante decenas de segundos.'
                  : '“Batida de pino” no motor: chamas frias acontecem na Terra dentro de cilindros antes da faísca. Na ISS, sem convecção, ficam estáveis por dezenas de segundos.'}
            </li>
            <li className="wrap-anywhere">
              •{' '}
              {lang === 'en'
                ? 'Kitchen stove vs. Inverse flame: on a stove, fuel flows into O₂ air. If an oxygen pipe leaks into fuel vapors in space, an inverse flame burns outward from the leak.'
                : lang === 'es'
                  ? 'Cocina vs. Llama inversa: en casa el gas sale al aire. Si el oxígeno se fuga hacia vapores combustibles, arde de dentro hacia fuera.'
                  : 'Fogão vs. Chama Inversa: no fogão sai gás para o ar. Em vazamentos de oxigênio numa nave, o O₂ cria uma chama inversa queimando de dentro para fora.'}
            </li>
          </ul>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121A30] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="wrap-anywhere">{tStr.insights.lunarWhyTitle}</span>
          </div>
          <p className="wrap-anywhere mt-2 text-xs text-slate-300">
            {lang === 'en'
              ? 'At 14.7 psi on Earth, 78% nitrogen absorbs heat like a thermal brake. In Lunar habitats (≤ 10.2 psi, ≥ 30% O₂), less nitrogen leaves sparks hotter and lets silent cool flames re-ignite.'
              : lang === 'es'
                ? 'A 14,7 psi en la Tierra, el 78% de nitrógeno frena el calor. En hábitats lunares (≤ 10,2 psi, ≥ 30% O₂), hay menos nitrógeno y las llamas frías silenciosas pueden reactivar un fuego.'
                : 'Na Terra (21% O₂ e 14,7 psi), o nitrogênio absorve calor como um freio térmico. Em habitats lunares (≤ 10,2 psi e O₂ ≥ 30%), há menos nitrogênio e uma chama fria silenciosa pode reiniciar um incêndio.'}{' '}
            <Flame className="inline h-3 w-3 text-purple-400" />
          </p>
        </div>
      </div>
    </div>
  );
};
