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
import {
  flameTypeLabel,
  fuelLabel,
  outcomeLabel,
  outcomeShortLabel,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import {
  measureTextWidth,
  useChartTypography,
} from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';
import { useChartHost, useIsChartExpanded } from '../ChartHostContext';
import { SafeResponsiveContainer } from '../SafeResponsiveContainer';
import { ClickableChartTooltip } from './ClickableChartTooltip';

interface OutcomesBarChartProps {
  tests: Psi159Test[];
  loading?: boolean;
  sharedLegendActive?: boolean;
}

const FUELS = ['ethane', 'propane', 'butane'] as const;

// High-contrast distinct categorical palette
const OUTCOME_SERIES = [
  { key: 'self_extinguished', color: '#38BDF8' }, // Sky Blue
  { key: 'flow_terminated', color: '#10B981' }, // Emerald Green
  { key: 'no_ignition', color: '#64748B' }, // Slate Gray
  { key: 'flash_only', color: '#F59E0B' }, // Amber Gold
  { key: 'cool_flame_only', color: '#A855F7' }, // Purple
] as const;

export const OutcomesBarChart: React.FC<OutcomesBarChartProps> = ({
  tests,
  loading = false,
}) => {
  const setCrossFilter = usePsiStore((s) => s.setCrossFilter);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const typo = useChartTypography();

  const host = useChartHost();
  const isExpanded = useIsChartExpanded();
  const [chartW, setChartW] = useState(480);
  const compactMinH = host?.fillHeight && !isExpanded ? 185 : 240;

  const data = useMemo(() => {
    return FUELS.map((fuel) => {
      const nSub = tests.filter((t) => t.fuel === fuel && t.flame_type === 'normal');
      const iSub = tests.filter((t) => t.fuel === fuel && t.flame_type === 'inverse');
      return {
        fuel,
        fuelLabel: fuelLabel(fuel, lang),
        n_self_extinguished: nSub.filter((t) => t.outcome === 'self_extinguished').length,
        n_flow_terminated: nSub.filter((t) => t.outcome === 'flow_terminated').length,
        n_no_ignition: nSub.filter((t) => t.outcome === 'no_ignition').length,
        n_flash_only: nSub.filter((t) => t.outcome === 'flash_only').length,
        n_cool_flame_only: nSub.filter((t) => t.outcome === 'cool_flame_only').length,
        i_self_extinguished: iSub.filter((t) => t.outcome === 'self_extinguished').length,
        i_flow_terminated: iSub.filter((t) => t.outcome === 'flow_terminated').length,
        i_no_ignition: iSub.filter((t) => t.outcome === 'no_ignition').length,
        i_flash_only: iSub.filter((t) => t.outcome === 'flash_only').length,
        i_cool_flame_only: iSub.filter((t) => t.outcome === 'cool_flame_only').length,
      };
    });
  }, [tests, lang]);

  const handleSegmentClick = (
    fuel: string,
    flame: 'normal' | 'inverse',
    outcomeKey: string
  ) => {
    const ids = tests
      .filter(
        (t) =>
          t.fuel === fuel && t.flame_type === flame && t.outcome === outcomeKey
      )
      .map((t) => t.test_id);
    if (ids.length === 0) return;
    setCrossFilter({
      source: tStr.outcomesChart.title,
      label: `${fuelLabel(fuel, lang)} · ${flameTypeLabel(flame, lang)} · ${outcomeShortLabel(outcomeKey, lang)} (${ids.length})`,
      testIds: ids,
    });
  };

  // Always include ALL 5 outcome categories (including gray no_ignition) + Normal vs Inverse visual key
  const legendItems: ChartLegendItem[] = useMemo(() => {
    const items: ChartLegendItem[] = OUTCOME_SERIES.map((s) => {
      const label = outcomeShortLabel(s.key, lang);
      return {
        id: s.key,
        label,
        shortLabel: label,
        marker: (
          <span
            className="h-2.5 w-2.5 rounded-xs"
            style={{ backgroundColor: s.color }}
          />
        ),
      };
    });
    items.push(
      {
        id: 'normal-style',
        label: flameTypeLabel('normal', lang),
        shortLabel: flameTypeLabel('normal', lang),
        marker: <span className="h-2.5 w-2.5 rounded-xs bg-slate-200" />,
      },
      {
        id: 'inverse-style',
        label: tStr.outcomesChart.inverseStripe,
        shortLabel: tStr.outcomesChart.inverseStripe,
        marker: (
          <span
            className="h-2.5 w-2.5 rounded-xs border border-slate-300/80"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(226,232,240,0.65) 0 2px, transparent 2px 4px)',
            }}
          />
        ),
      }
    );
    return items;
  }, [lang, tStr]);

  return (
    <ChartCard
      title={tStr.outcomesChart.title}
      subtitle={tStr.outcomesChart.subtitle}
      helpTitle={tStr.outcomesChart.title}
      helpBody={`${tStr.kpis.ignitedBody} ${tStr.outcomesChart.helpTip}`}
      chartContextPrompt={tStr.prompts.explainOutcomes}
      chartContextLabel={tStr.outcomesChart.title}
      legend={legendItems}
      isEmpty={tests.length === 0}
      loading={loading}
    >
      <SafeResponsiveContainer
        minHeight={compactMinH}
        fallbackWidth={480}
        onMeasureWidth={(w) => setChartW((prev) => (prev === w ? prev : w))}
      >
        <BarChart
            data={data}
            barGap={chartW < 400 ? 4 : 8}
            barCategoryGap="24%"
            margin={{ top: 10, right: 10, left: 10, bottom: 8 }}
          >
            <defs>
              {OUTCOME_SERIES.map((s) => (
                <pattern
                  key={s.key}
                  id={`hatch-${s.key}`}
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill={s.color} fillOpacity={0.45} />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="#0B1020"
                    strokeWidth="2.2"
                    strokeOpacity={0.75}
                  />
                </pattern>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="fuelLabel"
              interval={0}
              height={Math.ceil(typo.axisFontSize * 1.55 + 10)}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize, fontWeight: 600 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              width={Math.ceil(
                measureTextWidth('100', typo.axisFontSize, '500', 'mono') +
                  typo.axisTitleSize +
                  24
              )}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={false}
              tickLine={false}
              label={{
                value: tStr.outcomesChart.yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 4,
                style: {
                  fill: typo.tickColor,
                  fontSize: typo.axisTitleSize,
                  textAnchor: 'middle',
                },
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={<ClickableChartTooltip hintText={tStr.chartCard.clickToFilter} hideZero />}
            />

            {/* Normal Flame Stacked Column */}
            {OUTCOME_SERIES.map((series) => {
              const name = `${flameTypeLabel('normal', lang)} · ${outcomeLabel(series.key, lang)}`;
              return (
                <Bar
                  key={`n-${series.key}`}
                  dataKey={`n_${series.key}`}
                  name={name}
                  stackId="normal"
                  fill={series.color}
                  fillOpacity={0.94}
                  activeBar={{ fillOpacity: 1, stroke: '#F8FAFC', strokeWidth: 1.5 }}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const payload = entry?.payload as { fuel: string } | undefined;
                    if (payload) {
                      handleSegmentClick(payload.fuel, 'normal', series.key);
                    }
                  }}
                />
              );
            })}

            {/* Inverse Flame Stacked Column (grouped side-by-side with hatched pattern) */}
            {OUTCOME_SERIES.map((series) => {
              const name = `${flameTypeLabel('inverse', lang)} · ${outcomeLabel(series.key, lang)}`;
              return (
                <Bar
                  key={`i-${series.key}`}
                  dataKey={`i_${series.key}`}
                  name={name}
                  stackId="inverse"
                  fill={`url(#hatch-${series.key})`}
                  stroke={series.color}
                  strokeWidth={0.8}
                  activeBar={{ stroke: '#F8FAFC', strokeWidth: 1.6 }}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const payload = entry?.payload as { fuel: string } | undefined;
                    if (payload) {
                      handleSegmentClick(payload.fuel, 'inverse', series.key);
                    }
                  }}
                />
              );
            })}
        </BarChart>
      </SafeResponsiveContainer>
    </ChartCard>
  );
};
