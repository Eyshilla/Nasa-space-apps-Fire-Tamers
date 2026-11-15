import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { useStrings } from '../../utils/i18n';
import { useChartTypography } from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';

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

  const boxRef = useRef<HTMLDivElement | null>(null);
  const [boxWidth, setBoxWidth] = useState(340);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setBoxWidth(Math.round(w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, tests.length]);

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
      helpBody="Os 333 ensaios do PSI-159 foram executados ao longo de 12 dias na câmara CFI-G. Clique em qualquer dia para filtrar os outros gráficos."
      chartContextPrompt={tStr.prompts.explainTimeline}
      chartContextLabel={tStr.timelineChart.title}
      legend={legendItems}
      footer={<span>{tStr.timelineChart.hintClick}</span>}
      isEmpty={tests.length === 0}
      loading={loading}
    >
      <div ref={boxRef} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 6, left: 2, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              interval={boxWidth < 330 ? 1 : 0}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              width={typo.isLargeScreen ? 36 : 30}
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
              width={typo.isLargeScreen ? 44 : 36}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              contentStyle={{
                backgroundColor: '#0B1020',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#F1F5F9',
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="count"
              name={tStr.timelineChart.tests}
              fill="#06B6D4"
              fillOpacity={0.75}
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
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
