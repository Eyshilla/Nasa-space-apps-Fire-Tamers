import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { fuelLabel } from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { useChartTypography } from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';

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

  const boxRef = useRef<HTMLDivElement | null>(null);
  const [boxWidth, setBoxWidth] = useState(340);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setBoxWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, tests.length]);

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
      helpBody={tStr.kpis.burnBody}
      chartContextPrompt="Explique a distribuição do tempo de queima (burn_time_s) entre etano, propano e butano nos ensaios filtrados e cite o ensaio mais longo."
      chartContextLabel={tStr.burnChart.title}
      legend={legendItems}
      footer={<span>{tStr.burnChart.hintClick}</span>}
      isEmpty={tests.length === 0}
      loading={loading}
    >
      <div ref={boxRef} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: 2, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="label"
              interval={boxWidth < 330 ? 1 : 0}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              width={typo.isLargeScreen ? 38 : 30}
              tick={{ fill: typo.tickColor, fontSize: typo.axisFontSize }}
              axisLine={false}
              tickLine={false}
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
              dataKey="ethane"
              name={fuelLabel('ethane', lang)}
              stackId="g"
              fill="#06B6D4"
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
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};
