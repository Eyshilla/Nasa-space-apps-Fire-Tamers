import React from 'react';
import { usePsiStore } from '../store/usePsiStore';
import type { ComputedKpis } from '../types/psi159';
import { formatNumber } from '../utils/formatters';
import { useStrings } from '../utils/i18n';
import { InfoTooltip } from './InfoTooltip';

interface KpiStripProps {
  kpis: ComputedKpis;
  totalDataset: number;
  loading?: boolean;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  kpis,
  totalDataset,
  loading = false,
}) => {
  const selectTest = usePsiStore((s) => s.selectTest);
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const lang = usePsiStore((s) => s.lang);
  const t = useStrings(lang);
  const maxDaily = Math.max(1, ...kpis.dailyCounts);

  const activeRangeSummary =
    kpis.o2Min !== null &&
    kpis.o2Max !== null &&
    kpis.psiMin !== null &&
    kpis.psiMax !== null
      ? ` ${t.kpis.o2Title}: ${Math.round(kpis.o2Min * 100)}–${Math.round(
          kpis.o2Max * 100
        )}% · ${t.kpis.psiTitle}: ${formatNumber(
          kpis.psiMin,
          1,
          lang
        )}–${formatNumber(kpis.psiMax, 1, lang)} psi.`
      : '';

  if (loading) {
    return (
      <div className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto md:grid md:grid-cols-6 md:overflow-visible">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="min-h-[76px] min-w-[162px] shrink-0 animate-pulse rounded-lg border border-slate-800 bg-[#121A30] p-2.5 md:min-w-0 md:shrink"
          />
        ))}
      </div>
    );
  }

  return (
    <section
      aria-label="Indicadores principais dos ensaios filtrados"
      className="no-scrollbar flex flex-nowrap snap-x snap-mandatory gap-2 overflow-x-auto md:grid md:grid-cols-6 md:overflow-visible"
    >
      {/* 1. Total de ensaios */}
      <div className="flex min-w-[162px] shrink-0 snap-start flex-col justify-between rounded-lg border border-slate-800/90 bg-[#121A30] px-2.5 py-1.5 md:min-w-0 md:shrink">
        <div className="flex items-center justify-between gap-1">
          <span
            title={t.kpis.filteredTitle}
            className="truncate text-[11px] font-medium text-[#B4C3D8]"
          >
            {t.kpis.filteredTitle}
          </span>
          {!presentationMode && (
            <InfoTooltip
              title={t.kpis.filteredTitle}
              body={`${t.kpis.filteredBody}${activeRangeSummary}`}
            />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-1">
          <span className="kpi-value font-mono font-bold tabular-nums text-slate-100">
            {kpis.total}
          </span>
          <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-[#B4C3D8]">
            /{totalDataset}
          </span>
        </div>
        <div className="mt-1 flex min-h-[8px] items-end gap-0.5">
          {kpis.dailyCounts.map((count, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t-xs bg-cyan-400/70"
              style={{
                height: `${Math.max(2, Math.round((count / maxDaily) * 8))}px`,
              }}
              title={`Dia ${idx + 1}: ${count}`}
            />
          ))}
        </div>
      </div>

      {/* 2. % que acenderam */}
      <div className="flex min-w-[162px] shrink-0 snap-start flex-col justify-between rounded-lg border border-slate-800/90 bg-[#121A30] px-2.5 py-1.5 md:min-w-0 md:shrink">
        <div className="flex items-center justify-between gap-1">
          <span
            title={t.kpis.ignitedTitle}
            className="truncate text-[11px] font-medium text-[#B4C3D8]"
          >
            {t.kpis.ignitedTitle}
          </span>
          {!presentationMode && (
            <InfoTooltip title={t.kpis.ignitedTitle} body={t.kpis.ignitedBody} />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-1">
          <span className="kpi-value font-mono font-bold tabular-nums text-sky-300">
            {formatNumber(kpis.ignitedPct, 1, lang)}%
          </span>
          <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-[#B4C3D8]">
            {kpis.ignitedCount} {t.kpis.ignitedSub}
          </span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-sky-400"
            style={{ width: `${Math.min(100, kpis.ignitedPct)}%` }}
          />
        </div>
      </div>

      {/* 3. Chamas frias confirmadas */}
      <div className="flex min-w-[162px] shrink-0 snap-start flex-col justify-between rounded-lg border border-purple-500/25 bg-[#121A30] px-2.5 py-1.5 md:min-w-0 md:shrink">
        <div className="flex items-center justify-between gap-1">
          <span
            title={t.kpis.coolTitle}
            className="truncate text-[11px] font-medium text-[#B4C3D8]"
          >
            {t.kpis.coolTitle}
          </span>
          {!presentationMode && (
            <InfoTooltip title={t.kpis.coolTitle} body={t.kpis.coolBody} />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-1">
          <span className="kpi-value font-mono font-bold tabular-nums text-purple-300">
            {kpis.coolFlameCount}
          </span>
          <span className="whitespace-nowrap text-[11px] text-purple-200">
            ◆ {t.kpis.coolSub}
          </span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-purple-500"
            style={{
              width: `${
                kpis.total > 0
                  ? Math.max(
                      kpis.coolFlameCount > 0 ? 8 : 0,
                      (kpis.coolFlameCount / kpis.total) * 100
                    )
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* 4. Maior temperatura no queimador */}
      <div className="flex min-w-[162px] shrink-0 snap-start flex-col justify-between rounded-lg border border-red-500/25 bg-[#121A30] px-2.5 py-1.5 md:min-w-0 md:shrink">
        <div className="flex items-center justify-between gap-1">
          <span
            title={t.kpis.peakTitle}
            className="truncate text-[11px] font-medium text-[#B4C3D8]"
          >
            {t.kpis.peakTitle}
          </span>
          {!presentationMode && (
            <InfoTooltip title={t.kpis.peakTitle} body={t.kpis.peakBody} />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-1">
          <span className="kpi-value font-mono font-bold tabular-nums text-red-300">
            {kpis.maxPeakTempC !== null
              ? `${formatNumber(kpis.maxPeakTempC, 1, lang)} °C`
              : '—'}
          </span>
          {kpis.maxPeakTempTestId && (
            <button
              type="button"
              onClick={() => selectTest(kpis.maxPeakTempTestId!, true)}
              className="whitespace-nowrap font-mono text-[11px] text-cyan-300 underline decoration-cyan-500/40 hover:text-cyan-200"
            >
              {kpis.maxPeakTempTestId}
            </button>
          )}
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-red-500"
            style={{
              width: `${
                kpis.maxPeakTempC !== null
                  ? Math.min(100, (kpis.maxPeakTempC / 700) * 100)
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* 5. Tempo de queima médio e máximo */}
      <div className="flex min-w-[162px] shrink-0 snap-start flex-col justify-between rounded-lg border border-slate-800/90 bg-[#121A30] px-2.5 py-1.5 md:min-w-0 md:shrink">
        <div className="flex items-center justify-between gap-1">
          <span
            title={t.kpis.burnTitle}
            className="truncate text-[11px] font-medium text-[#B4C3D8]"
          >
            {t.kpis.burnTitle}
          </span>
          {!presentationMode && (
            <InfoTooltip title={t.kpis.burnTitle} body={t.kpis.burnBody} />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-1">
          <span className="kpi-value font-mono font-bold tabular-nums text-slate-100">
            {formatNumber(kpis.avgBurnTimeS, 1, lang)} s
          </span>
          <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-amber-300">
            {t.kpis.burnMax} {formatNumber(kpis.maxBurnTimeS, 0, lang)} s
          </span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-400"
            style={{
              width: `${Math.min(
                100,
                (kpis.avgBurnTimeS / Math.max(1, kpis.maxBurnTimeS || 250)) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* 6. % na Zona Lunar (tooltip carries active O2 & pressure ranges) */}
      <div className="flex min-w-[162px] shrink-0 snap-start flex-col justify-between rounded-lg border border-emerald-500/25 bg-[#121A30] px-2.5 py-1.5 md:min-w-0 md:shrink">
        <div className="flex items-center justify-between gap-1">
          <span
            title={t.kpis.lunarTitle}
            className="truncate text-[11px] font-medium text-[#B4C3D8]"
          >
            {t.kpis.lunarTitle}
          </span>
          {!presentationMode && (
            <InfoTooltip
              title={t.kpis.lunarTitle}
              body={`${t.kpis.lunarBody}${activeRangeSummary}`}
            />
          )}
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-1">
          <span className="kpi-value font-mono font-bold tabular-nums text-emerald-300">
            {formatNumber(kpis.lunarZonePct, 1, lang)}%
          </span>
          <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-[#B4C3D8]">
            {kpis.lunarZoneCount} {t.kpis.lunarSub}
          </span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-400"
            style={{ width: `${Math.min(100, kpis.lunarZonePct)}%` }}
          />
        </div>
      </div>
    </section>
  );
};
