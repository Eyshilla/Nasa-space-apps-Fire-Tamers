import React, { useMemo } from 'react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { flameTypeLabel, formatNumber } from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { ChartCard, type ChartLegendItem } from '../ChartCard';

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
      helpBody="Na chama normal, o gás combustível sai do queimador para uma câmara com O₂. Na chama inversa, o O₂ sai do queimador para uma atmosfera rica em combustível."
      chartContextPrompt="Compare chamas normais vs chamas inversas nos ensaios filtrados (O₂ médio, pressão média, tempo de queima, temperatura de pico e taxa de ignição), citando exemplos reais de Test ID."
      chartContextLabel={tStr.radarChart.title}
      legend={legendItems}
      plotAutoHeight
      footer={
        <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] tabular-nums sm:grid-cols-2">
          <div className="min-w-0 rounded bg-cyan-500/10 px-2 py-1 text-cyan-200">
            <span className="font-sans font-semibold">
              {flameTypeLabel('normal', lang)} ({stats.normal.count}):
            </span>{' '}
            {formatNumber(stats.normal.burn, 1, lang)}s ·{' '}
            {formatNumber(stats.normal.temp, 0, lang)}°C
          </div>
          <div className="min-w-0 rounded bg-orange-500/10 px-2 py-1 text-orange-200">
            <span className="font-sans font-semibold">
              {flameTypeLabel('inverse', lang)} ({stats.inverse.count}):
            </span>{' '}
            {formatNumber(stats.inverse.burn, 1, lang)}s ·{' '}
            {formatNumber(stats.inverse.temp, 0, lang)}°C
          </div>
        </div>
      }
      isEmpty={tests.length === 0}
      loading={loading}
    >
      <div className="space-y-2.5 py-0.5">
        {stats.metrics.map((m) => {
          const nPct = Math.max(2, Math.min(100, (m.normalVal / m.max) * 100));
          const iPct = Math.max(2, Math.min(100, (m.inverseVal / m.max) * 100));
          return (
            <div
              key={m.id}
              className="rounded-lg border border-slate-800/80 bg-[#0B1020]/55 px-2.5 py-2"
            >
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-200 lg:text-[13px]">
                <span>{m.label}</span>
              </div>

              <div className="space-y-1.5">
                {/* Normal horizontal bar */}
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-[11px] font-medium text-cyan-300">
                    {flameTypeLabel('normal', lang)}
                  </span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-900/90">
                    <div
                      className="flex h-full items-center rounded bg-cyan-500/85 px-2 transition-all duration-300"
                      style={{ width: `${nPct}%` }}
                    >
                      {nPct >= 34 && (
                        <span className="whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums text-slate-950">
                          {m.normalText}
                        </span>
                      )}
                    </div>
                    {nPct < 34 && (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums text-cyan-200"
                        style={{ left: `calc(${nPct}% + 6px)` }}
                      >
                        {m.normalText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inverse horizontal bar */}
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-[11px] font-medium text-orange-300">
                    {flameTypeLabel('inverse', lang)}
                  </span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-900/90">
                    <div
                      className="flex h-full items-center rounded bg-orange-500/85 px-2 transition-all duration-300"
                      style={{ width: `${iPct}%` }}
                    >
                      {iPct >= 34 && (
                        <span className="whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums text-slate-950">
                          {m.inverseText}
                        </span>
                      )}
                    </div>
                    {iPct < 34 && (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums text-orange-200"
                        style={{ left: `calc(${iPct}% + 6px)` }}
                      >
                        {m.inverseText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
};
