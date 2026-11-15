import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { deterministicJitter } from '../../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelColorHex,
  fuelLabel,
  outcomeMeta,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { useChartTypography } from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';

interface FlowVsTempChartProps {
  tests: Psi159Test[];
  loading?: boolean;
  tall?: boolean;
  sharedLegendActive?: boolean;
}

const LOG_MIN = Math.log10(0.04);
const LOG_MAX = Math.log10(3.6);
const TEMP_MIN = 0;
const TEMP_MAX = 740;

export const FlowVsTempChart: React.FC<FlowVsTempChartProps> = ({
  tests,
  loading = false,
  tall = false,
  sharedLegendActive = false,
}) => {
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const selectTest = usePsiStore((s) => s.selectTest);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const typo = useChartTypography();

  const boxRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 460, h: 270 });
  const [hovered, setHovered] = useState<{
    test: Psi159Test;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const w = Math.max(240, Math.round(rect.width));
      const h = Math.max(210, Math.round(rect.height));
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, tests.length, tall, typo.presentationMode]);

  const W = size.w;
  const H = size.h;
  const PAD = {
    top: 28,
    right: 16,
    bottom: typo.isLargeScreen ? 50 : 44,
    left: typo.isLargeScreen ? 76 : 60,
  };
  const PLOT_W = Math.max(100, W - PAD.left - PAD.right);
  const PLOT_H = Math.max(100, H - PAD.top - PAD.bottom);

  const xLogPx = (flow: number, jitterA: number, jitterB: number) => {
    const safe = Math.max(0.045, flow);
    // Gentle dual-seed horizontal jitter in log10 space to separate vertical setpoint columns
    const combinedJitter = jitterA * 0.65 + jitterB * 0.35;
    const logVal = Math.log10(safe) + combinedJitter * 0.085;
    const norm = (logVal - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return Math.max(
      PAD.left + 5,
      Math.min(W - PAD.right - 5, PAD.left + norm * PLOT_W)
    );
  };

  const yTempPx = (temp: number) => {
    const norm = Math.max(0, Math.min(1, (temp - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)));
    return PAD.top + (1 - norm) * PLOT_H;
  };

  const validPoints = useMemo(() => {
    return tests
      .filter((t) => t.peak_burner_temp_c !== null)
      .map((t) => {
        const jA = deterministicJitter(t.test_id, 73);
        const jB = deterministicJitter(`${t.test_id}-${t.fuel}`, 191);
        return {
          test: t,
          cx: xLogPx(t.hc_flow_mg_s, jA, jB),
          cy: yTempPx(t.peak_burner_temp_c!),
          color: fuelColorHex(t.fuel),
        };
      });
  }, [tests, W, H, PLOT_W, PLOT_H, PAD.left, PAD.right, PAD.top]);

  const limitY = yTempPx(600);
  const xTicks =
    W < 360
      ? [
          { v: 0.05, label: '0' },
          { v: 0.5, label: '0.5' },
          { v: 2.0, label: '2.0' },
        ]
      : [
          { v: 0.05, label: '0' },
          { v: 0.2, label: '0.2' },
          { v: 0.5, label: '0.5' },
          { v: 1.0, label: '1.0' },
          { v: 2.0, label: '2.0' },
          { v: 3.2, label: '3.2' },
        ];
  const yTicks = H < 240 ? [200, 400, 600] : [100, 200, 300, 400, 500, 600, 700];

  const limitText = `600 °C · ${tStr.flowChart.limitLabel}`;
  const limitLabelWidth = Math.min(PLOT_W - 8, limitText.length * 5.7 + 16);

  const legendItems: ChartLegendItem[] = useMemo(() => {
    const base: ChartLegendItem[] = [
      {
        id: 'ethane',
        label: fuelLabel('ethane', lang),
        shortLabel: fuelLabel('ethane', lang),
        marker: <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />,
      },
      {
        id: 'propane',
        label: fuelLabel('propane', lang),
        shortLabel: fuelLabel('propane', lang),
        marker: <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />,
      },
      {
        id: 'butane',
        label: fuelLabel('butane', lang),
        shortLabel: fuelLabel('butane', lang),
        marker: <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />,
      },
      {
        id: 'cutoff',
        label: tStr.flowChart.legendCutoff,
        shortLabel: tStr.flowChart.legendCutoff,
        marker: <span className="text-slate-200">■</span>,
      },
    ];
    if (!sharedLegendActive) {
      base.splice(3, 0, {
        id: 'limit',
        label: tStr.flowChart.legendLimit,
        shortLabel: tStr.flowChart.legendLimit,
        marker: <span className="text-red-400">▲</span>,
      });
    }
    return base;
  }, [lang, sharedLegendActive, tStr]);

  return (
    <ChartCard
      title={tStr.flowChart.title}
      subtitle={tStr.flowChart.subtitle}
      helpTitle={tStr.flowChart.title}
      helpBody={tStr.kpis.peakBody}
      chartContextPrompt="Analise a relação entre fluxo de combustível (hc_flow_mg_s) e temperatura de pico no queimador (peak_burner_temp_c) nos ensaios filtrados, citando Test IDs."
      chartContextLabel={tStr.flowChart.title}
      legend={legendItems}
      footer={<span>{tStr.flowChart.hintClick}</span>}
      isEmpty={validPoints.length === 0}
      loading={loading}
    >
      <div ref={boxRef} className="relative h-full w-full overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="block h-full w-full overflow-hidden"
          onMouseLeave={() => setHovered(null)}
        >
          {/* Y axis grid & ticks in °C */}
          {yTicks.map((temp) => (
            <g key={temp}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yTempPx(temp)}
                y2={yTempPx(temp)}
                stroke="#1E293B"
                strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 8}
                y={yTempPx(temp) + 4}
                textAnchor="end"
                fill={typo.tickColor}
                fontSize={typo.axisFontSize}
                fontFamily="IBM Plex Mono, monospace"
              >
                {temp} °C
              </text>
            </g>
          ))}

          {/* X log ticks */}
          {xTicks.map((tick) => {
            const tx = xLogPx(tick.v, 0, 0);
            return (
              <g key={tick.label}>
                <line
                  x1={tx}
                  x2={tx}
                  y1={PAD.top}
                  y2={H - PAD.bottom}
                  stroke="#1E293B"
                  strokeDasharray="3 3"
                />
                <text
                  x={tx}
                  y={H - PAD.bottom + typo.axisFontSize + 4}
                  textAnchor="middle"
                  fill={typo.tickColor}
                  fontSize={typo.axisFontSize}
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Thermal Limit Zone Line */}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={limitY}
            y2={limitY}
            stroke="#EF4444"
            strokeWidth={1.4}
            strokeDasharray="5 3"
          />

          {/* Thermal Limit Pill: right-aligned, semi-transparent backdrop, above the point cloud */}
          <g pointerEvents="none">
            <line
              x1={W - PAD.right - 14}
              y1={23}
              x2={W - PAD.right - 14}
              y2={limitY}
              stroke="#EF4444"
              strokeOpacity={0.55}
              strokeDasharray="2 2"
            />
            <rect
              x={Math.max(PAD.left + 4, W - PAD.right - limitLabelWidth)}
              y={4}
              width={limitLabelWidth}
              height={19}
              rx={4}
              fill="rgba(11, 16, 32, 0.8)"
              stroke="rgba(239, 68, 68, 0.55)"
            />
            <text
              x={W - PAD.right - 8}
              y={16.5}
              textAnchor="end"
              fill="#FCA5A5"
              fontSize="9.5"
              fontWeight="600"
            >
              {limitText}
            </text>
          </g>

          {/* Points */}
          {validPoints.map(({ test: t, cx, cy, color }) => {
            const isSel = t.test_id === selectedTestId;
            const common = {
              className: 'cursor-pointer',
              onMouseEnter: () => setHovered({ test: t, x: cx, y: cy }),
              onClick: () => selectTest(t.test_id, true),
            };

            if (t.hit_burner_temp_limit) {
              const d = isSel ? 5.2 : 4.0;
              return (
                <polygon
                  key={t.test_id}
                  {...common}
                  points={`${cx},${cy - d} ${cx + d},${cy + d * 0.85} ${cx - d},${cy + d * 0.85}`}
                  fill={color}
                  fillOpacity={0.92}
                  stroke={isSel ? '#FFFFFF' : '#EF4444'}
                  strokeWidth={isSel ? 1.6 : 1.1}
                />
              );
            }

            if (t.outcome === 'flow_terminated') {
              const s = isSel ? 4.4 : 3.3;
              return (
                <rect
                  key={t.test_id}
                  {...common}
                  x={cx - s}
                  y={cy - s}
                  width={s * 2}
                  height={s * 2}
                  fill={color}
                  fillOpacity={0.82}
                  stroke={isSel ? '#FFFFFF' : '#0B1020'}
                  strokeWidth={isSel ? 1.6 : 0.8}
                />
              );
            }

            if (t.cool_flame) {
              const d = isSel ? 5.4 : 4.2;
              return (
                <polygon
                  key={t.test_id}
                  {...common}
                  points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
                  fill={color}
                  fillOpacity={0.94}
                  stroke="#E9D5FF"
                  strokeWidth={1.1}
                />
              );
            }

            return (
              <circle
                key={t.test_id}
                {...common}
                cx={cx}
                cy={cy}
                r={isSel ? 5 : 3.5}
                fill={color}
                fillOpacity={0.78}
                stroke={isSel ? '#FFFFFF' : '#0B1020'}
                strokeWidth={isSel ? 1.6 : 0.8}
              />
            );
          })}

          <text
            x={PAD.left + PLOT_W / 2}
            y={H - 8}
            textAnchor="middle"
            fill={typo.tickColor}
            fontSize={typo.axisTitleSize}
          >
            {W < 380 ? tStr.flowChart.xAxisShort : tStr.flowChart.xAxis}
          </text>
          <text
            x={16}
            y={PAD.top + PLOT_H / 2}
            textAnchor="middle"
            fill={typo.tickColor}
            fontSize={typo.axisTitleSize}
            transform={`rotate(-90 16 ${PAD.top + PLOT_H / 2})`}
          >
            {tStr.flowChart.yAxis}
          </text>
        </svg>

        {hovered && (
          <div
            style={{
              zIndex: 'var(--z-tooltip)',
              left: `${Math.max(8, Math.min(W - 208, hovered.x + 10))}px`,
              top: `${Math.max(8, Math.min(H - 96, hovered.y - 12))}px`,
            }}
            className="pointer-events-none absolute w-48 rounded-lg border border-slate-700 bg-[#0B1020]/95 p-2 text-[11px] shadow-xl"
          >
            <div className="flex items-center justify-between gap-2 font-mono text-cyan-300">
              <span className="font-bold">{hovered.test.test_id}</span>
              <span className="text-[10px] text-slate-300">
                {fuelLabel(hovered.test.fuel, lang)} ·{' '}
                {flameTypeLabel(hovered.test.flame_type, lang)}
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] tabular-nums text-slate-200">
              <div>{formatNumber(hovered.test.hc_flow_mg_s, 3, lang)} mg/s</div>
              <div>{formatNumber(hovered.test.peak_burner_temp_c, 1, lang)} °C</div>
            </div>
            <div className="mt-1 text-[10px] text-slate-300">
              {outcomeMeta(hovered.test.outcome, lang).glyph}{' '}
              {outcomeMeta(hovered.test.outcome, lang).label}
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
};
