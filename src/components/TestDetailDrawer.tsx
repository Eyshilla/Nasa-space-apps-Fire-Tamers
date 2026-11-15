import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Sparkles, X } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import { isInLunarZone } from '../utils/analytics';
import {
  flameColorLabel,
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  locationLabel,
  outcomeMeta,
  qualityNotesLabel,
} from '../utils/formatters';
import { useStrings } from '../utils/i18n';
import { InfoTooltip } from './InfoTooltip';

export const TestDetailDrawer: React.FC = () => {
  const tests = usePsiStore((s) => s.tests);
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const drawerOpen = usePsiStore((s) => s.drawerOpen);
  const setDrawerOpen = usePsiStore((s) => s.setDrawerOpen);
  const setActiveTab = usePsiStore((s) => s.setActiveTab);
  const askAi = usePsiStore((s) => s.askAi);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(
          '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
        ).matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia(
      '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
    );
    const sync = () => setIsMobileView(mq.matches);
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    mq.addEventListener('change', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      mq.removeEventListener('change', sync);
    };
  }, []);

  const test = useMemo(
    () => tests.find((t) => t.test_id === selectedTestId) ?? null,
    [tests, selectedTestId]
  );

  if (!drawerOpen || !test) return null;

  const meta = outcomeMeta(test.outcome, lang);
  const lunar = isInLunarZone(test);
  const qualityText = qualityNotesLabel(test.quality_notes);

  const paramRow = (
    label: string,
    value: string,
    column: string,
    highlightClass = 'text-slate-100'
  ) => (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-[#0B1020] px-2.5 py-1.5">
      <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-[#B4C3D8]">
        <span className="wrap-anywhere">{label}</span>
        <InfoTooltip term={column} labelOverride={label} />
      </span>
      <span
        className={`whitespace-nowrap font-mono text-xs font-semibold tabular-nums ${highlightClass}`}
      >
        {value}
      </span>
    </div>
  );

  return (
    <>
      {/* Backdrop only on < lg viewports; on desktop >=1024px the drawer docks beside narrowed main content */}
      <div
        style={{
          zIndex: isMobileView ? 'var(--z-modal)' : 'calc(var(--z-drawer) - 1)',
        }}
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] lg:hidden"
        onClick={() => setDrawerOpen(false)}
      />

      <aside
        aria-label={`Detalhe do ensaio ${test.test_id}`}
        style={{
          zIndex: isMobileView ? 'calc(var(--z-modal) + 1)' : 'var(--z-drawer)',
          top: isMobileView ? 0 : 'var(--header-h)',
          height: isMobileView ? '100dvh' : 'calc(100dvh - var(--header-h))',
        }}
        className="fixed right-0 flex w-full max-w-[400px] flex-col border-l border-slate-800 bg-[#121A30] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap font-mono text-base font-bold text-cyan-300">
                {test.test_id}
              </span>
              <span className="whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                {tStr.drawer.day} {test.day}
              </span>
              {lunar && (
                <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                  {tStr.ignitionChart.lunarZone}
                </span>
              )}
            </div>
            <p className="wrap-anywhere mt-0.5 text-xs text-slate-400">
              {fuelLabel(test.fuel, lang)} ({formatNumber(test.fuel_mix_pct, 0, lang)}%) ·{' '}
              <span
                className={
                  test.flame_type === 'inverse'
                    ? 'font-medium text-orange-300'
                    : 'font-medium text-cyan-300'
                }
              >
                {flameTypeLabel(test.flame_type, lang)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={tStr.drawer.close}
            className="min-h-[28px] min-w-[28px] shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          style={{
            paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom) + 2.5rem))',
          }}
          className="flex-1 space-y-3 overflow-y-auto p-4 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium ${meta.badgeClass}`}
            >
              <span>{meta.glyph}</span>
              <span>{meta.label}</span>
            </span>
            {test.cool_flame && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-purple-400/50 bg-purple-500/15 px-2 py-1 text-xs font-medium text-purple-200">
                <Flame className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                {tStr.ignitionChart.legendCool}{' '}
                {test.cool_flame_code ? `(${test.cool_flame_code})` : ''}
              </span>
            )}
            {test.hit_burner_temp_limit && (
              <span className="whitespace-nowrap rounded-md border border-red-500/40 bg-red-500/15 px-2 py-1 text-xs font-medium text-red-200">
                ▲ {tStr.ignitionChart.legendLimit}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                askAi(
                  `Explique o ensaio ${test.test_id} em detalhes simples: o que aconteceu com essa mistura de ${fuelLabel(test.fuel, lang)} a ${Math.round(test.o2_fraction * 100)}% de O₂ e ${formatNumber(test.pressure_psi, 2, lang)} psi, e qual a lição de segurança espacial?`,
                  `Detalhe do ensaio ${test.test_id}`
                );
              }}
              className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-center text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="wrap-anywhere">{tStr.drawer.askAiBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setActiveTab('cool_flames');
              }}
              className="inline-flex min-h-[32px] items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-cyan-500/40"
            >
              <Flame className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span>{tStr.drawer.openSimBtn}</span>
            </button>
          </div>

          <div>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {tStr.drawer.atmSection}
            </h3>
            <div className="space-y-1.5">
              {paramRow(
                'O₂ inicial',
                `${Math.round(test.o2_fraction * 100)}%`,
                'o2_fraction',
                'text-cyan-300'
              )}
              {paramRow(
                'O₂ final',
                `${formatNumber(test.o2_fraction_after * 100, 1, lang)}%`,
                'o2_fraction_after'
              )}
              {paramRow('Local O₂', locationLabel(test.o2_location, lang), 'o2_location')}
              {paramRow(
                tStr.table.colPsi,
                `${formatNumber(test.pressure_psi, 2, lang)} psi (${formatNumber(test.pressure_bar, 2, lang)} bar)`,
                'pressure_psi'
              )}
              {paramRow(
                tStr.table.colFlow,
                `${formatNumber(test.hc_flow_mg_s, 3, lang)} mg/s`,
                'hc_flow_mg_s'
              )}
              {test.o2_flow_mg_s !== null &&
                paramRow(
                  'Fluxo O₂',
                  `${formatNumber(test.o2_flow_mg_s, 3, lang)} mg/s`,
                  'o2_flow_mg_s'
                )}
            </div>
          </div>

          <div>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {tStr.drawer.thermalSection}
            </h3>
            <div className="space-y-1.5">
              {paramRow(
                tStr.table.colBurn,
                test.burn_time_s !== null
                  ? `${formatNumber(test.burn_time_s, 1, lang)} s`
                  : '—',
                'burn_time_s'
              )}
              {paramRow(
                tStr.table.colPeak,
                test.peak_burner_temp_c !== null
                  ? `${formatNumber(test.peak_burner_temp_c, 1, lang)} °C (${formatNumber(test.peak_burner_temp_k, 1, lang)} K)`
                  : '—',
                'peak_burner_temp_c',
                test.hit_burner_temp_limit ? 'text-red-300' : 'text-slate-100'
              )}
              {paramRow(
                'T_ad',
                test.tad_k !== null ? `${formatNumber(test.tad_k, 0, lang)} K` : '—',
                'tad_k'
              )}
              {paramRow(
                'Zst',
                test.zst !== null ? formatNumber(test.zst, 3, lang) : '—',
                'zst'
              )}
              {paramRow(
                tStr.sim3d.colorLabel,
                flameColorLabel(test.flame_color, lang),
                'flame_color'
              )}
              {paramRow('TFP', test.tfp ? 'True' : 'False', 'tfp')}
            </div>
          </div>

          {(qualityText || test.comments) && (
            <div className="space-y-2 rounded-lg border border-slate-800 bg-[#0B1020] p-3">
              {qualityText && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    {tStr.drawer.qualityTitle}
                  </div>
                  <p className="wrap-anywhere mt-0.5 text-[11px] text-amber-100">
                    {qualityText}
                  </p>
                </div>
              )}
              {test.comments && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {tStr.drawer.commentTitle}
                  </div>
                  <p className="wrap-anywhere mt-0.5 font-mono text-[11px] text-slate-300">
                    {test.comments}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
