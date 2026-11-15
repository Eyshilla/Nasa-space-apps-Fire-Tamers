import React, { useMemo } from 'react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { flameTypeLabel, formatNumber } from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { ChartCard, type ChartLegendItem } from '../ChartCard';
import { useChartHost, useIsChartExpanded } from '../ChartHostContext';

interface NormalVsInverseChartProps {
  tests: Psi159Test[];
  loading?: boolean;
  sharedLegendActive?: boolean;
}

export const NormalVsInverseChart: React.FC<NormalVsInverseChartProps> = ({
  tests,
  loading = false,
}) => {
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const host = useChartHost();
  const isExpanded = useIsChartExpanded();
  const useScrollableFill = Boolean(host?.fillHeight) && !isExpanded;

  const stats = useMemo(() => {
    const calc = (subset: Psi159Test[]) => {
      if (subset.length === 0) {
        return { count: 0, o2Pct: 0, psi: 0, burn: 0, temp: 0, ignitedPct: 0 };
      }
      const o2Pct =
        (subset.reduce((s, t) => s + t.o2_fraction, 0) / subset.length) * 100;
      const psi = subset.reduce((s, t) => s + t.pressure_psi, 0) / subset.length;
      const burnArr = subset.filter((t) => t.burn_time_s !== null);
      const burn =
        burnArr.length > 0
          ? burnArr.reduce((s, t) => s + (t.burn_time_s ?? 0), 0) / burnArr.length
          : 0;
      const tempArr = subset.filter((t) => t.peak_burner_temp_c !== null);
      const temp =
        tempArr.length > 0
          ? tempArr.reduce((s, t) => s + (t.peak_burner_temp_c ?? 0), 0) /
            tempArr.length
          : 0;
      const ignitedPct =
        (subset.filter((t) => t.ignited).length / subset.length) * 100;

      return { count: subset.length, o2Pct, psi, burn, temp, ignitedPct };
    };

    const normal = calc(tests.filter((t) => t.flame_type === 'normal'));
    const inverse = calc(tests.filter((t) => t.flame_type === 'inverse'));

    const maxBurn = Math.max(180, normal.burn * 1.15, inverse.burn * 1.15);

    const metrics = [
      {
        id: 'o2',
        label: tStr.radarChart.o2Mean,
        normalVal: normal.o2Pct,
        inverseVal: inverse.o2Pct,
        max: 85,
        normalText: `${formatNumber(normal.o2Pct, 1, lang)}%`,
        inverseText: `${formatNumber(inverse.o2Pct, 1, lang)}%`,
      },
      {
        id: 'psi',
        label: tStr.radarChart.pressure,
        normalVal: normal.psi,
        inverseVal: inverse.psi,
        max: 48,
        normalText: `${formatNumber(normal.psi, 1, lang)} psi`,
        inverseText: `${formatNumber(inverse.psi, 1, lang)} psi`,
      },
      {
        id: 'burn',
        label: tStr.radarChart.burnTime,
        normalVal: normal.burn,
        inverseVal: inverse.burn,
        max: maxBurn,
        normalText: `${formatNumber(normal.burn, 1, lang)} s`,
        inverseText: `${formatNumber(inverse.burn, 1, lang)} s`,
      },
      {
        id: 'temp',
        label: tStr.radarChart.peakTemp,
        normalVal: normal.temp,
        inverseVal: inverse.temp,
        max: 650,
        normalText: `${formatNumber(normal.temp, 0, lang)} °C`,
        inverseText: `${formatNumber(inverse.temp, 0, lang)} °C`,
      },
      {
        id: 'ignited',
        label: tStr.radarChart.ignitionRate,
        normalVal: normal.ignitedPct,
        inverseVal: inverse.ignitedPct,
        max: 100,
        normalText: `${formatNumber(normal.ignitedPct, 1, lang)}%`,
        inverseText: `${formatNumber(inverse.ignitedPct, 1, lang)}%`,
      },
    ];

    return { normal, inverse, metrics };
  }, [tests, lang, tStr]);

  const legendItems: ChartLegendItem[] = useMemo(
    () => [
      {
        id: 'normal',
        label: `${flameTypeLabel('normal', lang)} (${stats.normal.count})`,
        shortLabel: flameTypeLabel('normal', lang),
        marker: <span className="h-2.5 w-2.5 rounded-xs bg-cyan-400" />,
      },
      {
        id: 'inverse',
        label: `${flameTypeLabel('inverse', lang)} (${stats.inverse.count})`,
        shortLabel: flameTypeLabel('inverse', lang),
        marker: <span className="h-2.5 w-2.5 rounded-xs bg-orange-400" />,
      },
    ],
    [lang, stats.normal.count, stats.inverse.count]
  );

  return (
    <ChartCard
      title={tStr.radarChart.title}
      subtitle={tStr.radarChart.subtitle}
      helpTitle={tStr.radarChart.title}
      helpBody={tStr.radarChart.helpTip}
      chartContextPrompt={tStr.prompts.explainNormalVsInverse}
      chartContextLabel={tStr.radarChart.title}
      legend={legendItems}
      plotAutoHeight={!useScrollableFill}
      isEmpty={tests.length === 0}
      loading={loading}
    >
      <div
        className={`space-y-2 py-0.5 ${
          useScrollableFill ? 'h-full min-h-0 flex-1 overflow-y-auto pr-1' : ''
        }`}
      >
        <div className="chart-text-annotation grid grid-cols-1 gap-1.5 font-mono tabular-nums sm:grid-cols-2">
          <div className="min-w-0 wrap-anywhere rounded border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">
            <span className="font-sans font-semibold">
              {flameTypeLabel('normal', lang)} ({stats.normal.count}):
            </span>{' '}
            {formatNumber(stats.normal.burn, 1, lang)}s ·{' '}
            {formatNumber(stats.normal.temp, 0, lang)}°C
          </div>
          <div className="min-w-0 wrap-anywhere rounded border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-orange-200">
            <span className="font-sans font-semibold">
              {flameTypeLabel('inverse', lang)} ({stats.inverse.count}):
            </span>{' '}
            {formatNumber(stats.inverse.burn, 1, lang)}s ·{' '}
            {formatNumber(stats.inverse.temp, 0, lang)}°C
          </div>
        </div>
        {stats.metrics.map((m) => {
          const nPct = Math.max(2, Math.min(100, (m.normalVal / m.max) * 100));
          const iPct = Math.max(2, Math.min(100, (m.inverseVal / m.max) * 100));
          const nInside = nPct >= 48;
          const iInside = iPct >= 48;
          return (
            <div
              key={m.id}
              className="rounded-lg border border-slate-800/80 bg-[#0B1020]/55 px-2.5 py-2"
            >
              <div className="chart-text-axis mb-2 flex items-center justify-between font-semibold text-slate-200">
                <span className="wrap-anywhere">{m.label}</span>
              </div>

              <div className="grid grid-cols-[max-content_1fr] items-center gap-x-2.5 gap-y-2">
                {/* Normal horizontal bar */}
                <span className="chart-text-bar whitespace-nowrap font-medium text-cyan-300">
                  {flameTypeLabel('normal', lang)}
                </span>
                <div className="flex min-h-[calc(26px*var(--chart-font-scale))] min-w-0 items-center overflow-hidden rounded bg-slate-900/90">
                  <div
                    className="flex h-full min-h-[calc(26px*var(--chart-font-scale))] shrink-0 items-center justify-end rounded bg-cyan-500/85 px-2 transition-all duration-300"
                    style={{ width: `${nPct}%` }}
                  >
                    {nInside && (
                      <span className="chart-text-bar whitespace-nowrap font-mono font-semibold tabular-nums text-slate-950">
                        {m.normalText}
                      </span>
                    )}
                  </div>
                  {!nInside && (
                    <span className="chart-text-bar ml-2 whitespace-nowrap font-mono font-semibold tabular-nums text-cyan-200">
                      {m.normalText}
                    </span>
                  )}
                </div>

                {/* Inverse horizontal bar */}
                <span className="chart-text-bar whitespace-nowrap font-medium text-orange-300">
                  {flameTypeLabel('inverse', lang)}
                </span>
                <div className="flex min-h-[calc(26px*var(--chart-font-scale))] min-w-0 items-center overflow-hidden rounded bg-slate-900/90">
                  <div
                    className="flex h-full min-h-[calc(26px*var(--chart-font-scale))] shrink-0 items-center justify-end rounded bg-orange-500/85 px-2 transition-all duration-300"
                    style={{ width: `${iPct}%` }}
                  >
                    {iInside && (
                      <span className="chart-text-bar whitespace-nowrap font-mono font-semibold tabular-nums text-slate-950">
                        {m.inverseText}
                      </span>
                    )}
                  </div>
                  {!iInside && (
                    <span className="chart-text-bar ml-2 whitespace-nowrap font-mono font-semibold tabular-nums text-orange-200">
                      {m.inverseText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
};
