import React, { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { useStrings } from '../../utils/i18n';
import {
  measureTextWidth,
  useChartTypography,
} from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';
import { useChartHost, useIsChartExpanded } from '../ChartHostContext';
import { SafeResponsiveContainer } from '../SafeResponsiveContainer';
import { ClickableChartTooltip } from './ClickableChartTooltip';

interface CampaignTimelineChartProps {
  tests: Psi159Test[];
  loading?: boolean;
}

export const CampaignTimelineChart: React.FC<CampaignTimelineChartProps> = ({
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
    const days = Array.from({ length: 12 }, (_, idx) => idx + 1);
    return days.map((day) => {
      const subset = tests.filter((t) => t.day === day);
      const temps = subset.filter((t) => t.peak_burner_temp_c !== null);
      const meanTemp =
        temps.length > 0
          ? Math.round(
              temps.reduce((s, t) => s + (t.peak_burner_temp_c ?? 0), 0) /
                temps.length
            )
          : 0;
      return {
        dayLabel: `D${day}`,
        day,
        count: subset.length,
        meanTemp,
        coolCount: subset.filter((t) => t.cool_flame).length,
        ids: subset.map((t) => t.test_id),
      };
    });
  }, [tests]);

  const legendItems: ChartLegendItem[] = useMemo(
    () => [
      {
        id: 'tests',
        label: tStr.timelineChart.tests,
        shortLabel: tStr.timelineChart.tests,
        marker: <span className="h-2 w-2 rounded-xs bg-cyan-400" />,
      },
      {
        id: 'meanPeak',
        label: tStr.timelineChart.meanPeak,
        shortLabel: tStr.timelineChart.meanPeak,
        marker: <span className="h-0.5 w-3 bg-amber-400" />,
      },
    ],
    [tStr]
  );

  return (
    <ChartCard
      title={tStr.timelineChart.title}
      subtitle={tStr.timelineChart.subtitle}
      helpTitle={tStr.timelineChart.title}
      helpBody={tStr.timelineChart.helpTip}
      chartContextPrompt={tStr.prompts.explainTimeline}
      chartContextLabel={tStr.timelineChart.title}
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
          const leftW = Math.ceil(
            measureTextWidth('80', typo.axisFontSize, '500', 'mono') + 14
          );
          const rightW = Math.ceil(
            measureTextWidth('650', typo.axisFontSize, '500', 'mono') + 14
          );
          const plotW = Math.max(120, boxWidth - leftW - rightW - 12);
          const dayTickW =
            measureTextWidth('D12', typo.axisFontSize, '500') + 10;
          const xInterval =
            plotW / 12 >= dayTickW ? 0 : plotW / 6 >= dayTickW ? 1 : 2;
          return (
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 6, left: 4, bottom: 10 }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              interval={xInterval}
              height={Math.ceil(typo.axisFontSize * 1.55 + 10)}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              width={leftW}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#FBBF24', fontSize: typo.axisFontSize }}
              axisLine={false}
              tickLine={false}
              width={rightW}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={<ClickableChartTooltip hintText={tStr.chartCard.clickToFilter} />}
            />
            <Bar
              yAxisId="left"
              dataKey="count"
              name={tStr.timelineChart.tests}
              fill="#06B6D4"
              fillOpacity={0.78}
              activeBar={{ fillOpacity: 1, stroke: '#F8FAFC', strokeWidth: 1.5 }}
              radius={[3, 3, 0, 0]}
              className="cursor-pointer"
              onClick={(entry) => {
                const payload = entry?.payload as
                  | { day: number; ids: string[] }
                  | undefined;
                if (payload && payload.ids.length > 0) {
                  setCrossFilter({
                    source: tStr.timelineChart.title,
                    label: `D${payload.day} (${payload.ids.length})`,
                    testIds: payload.ids,
                  });
                }
              }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="meanTemp"
              name={tStr.timelineChart.meanPeak}
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#F59E0B' }}
            />
            </ComposedChart>
          );
        })()}
      </SafeResponsiveContainer>
    </ChartCard>
  );
};
