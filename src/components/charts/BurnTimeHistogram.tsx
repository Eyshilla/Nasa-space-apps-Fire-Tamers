import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { fuelLabel } from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import {
  measureTextWidth,
  useChartTypography,
} from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';
import { useChartHost, useIsChartExpanded } from '../ChartHostContext';
import { SafeResponsiveContainer } from '../SafeResponsiveContainer';
import { ClickableChartTooltip } from './ClickableChartTooltip';

interface BurnTimeHistogramProps {
  tests: Psi159Test[];
  loading?: boolean;
}

const BINS = [
  { id: '0', label: '0 s', min: -0.1, max: 0.01 },
  { id: '1-20', label: '1–20s', min: 0.01, max: 20 },
  { id: '20-60', label: '20–60s', min: 20, max: 60 },
  { id: '60-120', label: '60–120s', min: 60, max: 120 },
  { id: '120-180', label: '120–180s', min: 120, max: 180 },
  { id: '180+', label: '180s+', min: 180, max: Infinity },
] as const;

export const BurnTimeHistogram: React.FC<BurnTimeHistogramProps> = ({
  tests,
  loading = false,
}) => {
  const setCrossFilter = usePsiStore((s) => s.setCrossFilter);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const typo = useChartTypography();

  const host = useChartHost();
  const isExpanded = useIsChartExpanded();
  const [boxWidth, setBoxWidth] = useState(340);
  const compactMinH = host?.fillHeight && !isExpanded ? 185 : 240;

  const data = useMemo(() => {
    return BINS.map((bin) => {
      const inBin = tests.filter((t) => {
        const val = t.burn_time_s ?? 0;
        return val > bin.min && val <= bin.max;
      });
      return {
        id: bin.id,
        label: bin.label,
        ethane: inBin.filter((t) => t.fuel === 'ethane').length,
        propane: inBin.filter((t) => t.fuel === 'propane').length,
        butane: inBin.filter((t) => t.fuel === 'butane').length,
        ids: inBin.map((t) => t.test_id),
      };
    });
  }, [tests]);

  const legendItems: ChartLegendItem[] = useMemo(
    () => [
      {
        id: 'ethane',
        label: fuelLabel('ethane', lang),
        shortLabel: fuelLabel('ethane', lang),
        marker: <span className="h-2 w-2 rounded-full bg-cyan-400" />,
      },
      {
        id: 'propane',
        label: fuelLabel('propane', lang),
        shortLabel: fuelLabel('propane', lang),
        marker: <span className="h-2 w-2 rounded-full bg-orange-400" />,
      },
      {
        id: 'butane',
        label: fuelLabel('butane', lang),
        shortLabel: fuelLabel('butane', lang),
        marker: <span className="h-2 w-2 rounded-full bg-purple-400" />,
      },
    ],
    [lang]
  );

  return (
    <ChartCard
      title={tStr.burnChart.title}
      subtitle={tStr.burnChart.subtitle}
      helpTitle={tStr.burnChart.title}
      helpBody={`${tStr.kpis.burnBody} ${tStr.burnChart.helpTip}`}
      chartContextPrompt={tStr.prompts.explainBurnTime}
      chartContextLabel={tStr.burnChart.title}
      legend={legendItems}
      isEmpty={tests.length === 0}
      loading={loading}
    >
      <SafeResponsiveContainer
        minHeight={compactMinH}
        fallbackWidth={340}
        onMeasureWidth={(w) => setBoxWidth((prev) => (prev === w ? prev : w))}
      >
        {(() => {
          const yAxisW = Math.ceil(
            measureTextWidth('150', typo.axisFontSize, '500', 'mono') + 14
          );
          const plotW = Math.max(140, boxWidth - yAxisW - 14);
          const widestBinW =
            measureTextWidth('120–180s', typo.axisFontSize, '500') + 14;
          const xInterval = plotW / BINS.length < widestBinW ? 1 : 0;
          return (
            <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="label"
              interval={xInterval}
              height={Math.ceil(typo.axisFontSize * 1.55 + 10)}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              width={yAxisW}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={<ClickableChartTooltip hintText={tStr.chartCard.clickToFilter} hideZero />}
            />
            <Bar
              dataKey="ethane"
              name={fuelLabel('ethane', lang)}
              stackId="g"
              fill="#06B6D4"
              activeBar={{ fillOpacity: 1, stroke: '#F8FAFC', strokeWidth: 1.5 }}
              className="cursor-pointer"
              onClick={(entry) => {
                const payload = entry?.payload as { label: string; ids: string[] } | undefined;
                if (payload && payload.ids.length > 0) {
                  setCrossFilter({
                    source: tStr.burnChart.title,
                    label: `${payload.label} (${payload.ids.length})`,
                    testIds: payload.ids,
                  });
                }
              }}
            />
            <Bar
              dataKey="propane"
              name={fuelLabel('propane', lang)}
              stackId="g"
              fill="#F97316"
              activeBar={{ fillOpacity: 1, stroke: '#F8FAFC', strokeWidth: 1.5 }}
              className="cursor-pointer"
              onClick={(entry) => {
                const payload = entry?.payload as { label: string; ids: string[] } | undefined;
                if (payload && payload.ids.length > 0) {
                  setCrossFilter({
                    source: tStr.burnChart.title,
                    label: `${payload.label} (${payload.ids.length})`,
                    testIds: payload.ids,
                  });
                }
              }}
            />
            <Bar
              dataKey="butane"
              name={fuelLabel('butane', lang)}
              stackId="g"
              fill="#A855F7"
              activeBar={{ fillOpacity: 1, stroke: '#F8FAFC', strokeWidth: 1.5 }}
              className="cursor-pointer"
              onClick={(entry) => {
                const payload = entry?.payload as { label: string; ids: string[] } | undefined;
                if (payload && payload.ids.length > 0) {
                  setCrossFilter({
                    source: tStr.burnChart.title,
                    label: `${payload.label} (${payload.ids.length})`,
                    testIds: payload.ids,
                  });
                }
              }}
            />
            </BarChart>
          );
        })()}
      </SafeResponsiveContainer>
    </ChartCard>
  );
};
