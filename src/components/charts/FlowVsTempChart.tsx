import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { deterministicJitter } from '../../utils/analytics';
import {
  formatNumber,
  fuelColorHex,
  fuelLabel,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import {
  measureTextWidth,
  useChartTypography,
} from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';
import { useChartHost, useIsChartExpanded } from '../ChartHostContext';
import {
  PointTooltipPopover,
  useClusterTooltip,
  type PointTooltipAnchor,
} from '../PointTooltipPopover';

interface FlowCluster {
  id: string;
  cx: number;
  cy: number;
  tests: Psi159Test[];
  rep: Psi159Test;
  color: string;
}

function flowPriority(t: Psi159Test, selectedId: string): number {
  if (t.test_id === selectedId) return 5;
  if (t.hit_burner_temp_limit) return 4;
  if (t.cool_flame) return 3;
  if (t.outcome === 'flow_terminated') return 2;
  return 1;
}

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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastPointerTypeRef = useRef<string>('mouse');
  const [size, setSize] = useState({ w: 460, h: 270 });
  const clusterTooltip = useClusterTooltip<FlowCluster>((c) => c.id);
  const host = useChartHost();
  const isExpanded = useIsChartExpanded();
  const minWrapperH = host?.fillHeight && !isExpanded ? 185 : 240;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let rafId: number | null = null;
    let attempts = 0;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        if (attempts < 12) {
          attempts += 1;
          rafId = requestAnimationFrame(measure);
        }
        return;
      }
      attempts = 0;
      const w = Math.max(220, Math.round(rect.width));
      const h = Math.max(140, Math.round(rect.height));
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [
    loading,
    tests.length,
    tall,
    isExpanded,
    typo.presentationMode,
    typo.scaleFactor,
  ]);

  const W = size.w;
  const H = size.h;
  const maxYTickW = measureTextWidth('700 °C', typo.axisFontSize, '500', 'mono');
  const limitBadgeH = Math.ceil(typo.zoneFontSize * 1.45 + 6);
  const PAD = {
    top: limitBadgeH + 12,
    right: 16,
    bottom: Math.ceil(typo.axisFontSize * 1.3 + typo.axisTitleSize + 22),
    left: Math.ceil(maxYTickW + typo.axisTitleSize + 24),
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

  const clusters = useMemo<FlowCluster[]>(() => {
    const valid = tests
      .filter((t) => t.peak_burner_temp_c !== null)
      .sort(
        (a, b) =>
          flowPriority(b, selectedTestId) - flowPriority(a, selectedTestId)
      );

    const groups: FlowCluster[] = [];
    const radiusSq = 100; // 10px proximity threshold

    for (const t of valid) {
      const jA = deterministicJitter(t.test_id, 73);
      const jB = deterministicJitter(`${t.test_id}-${t.fuel}`, 191);
      const cx = xLogPx(t.hc_flow_mg_s, jA, jB);
      const cy = yTempPx(t.peak_burner_temp_c!);

      let matched: FlowCluster | null = null;
      for (const g of groups) {
        const dx = g.cx - cx;
        const dy = g.cy - cy;
        if (dx * dx + dy * dy <= radiusSq) {
          matched = g;
          break;
        }
      }

      if (matched) {
        matched.tests.push(t);
      } else {
        groups.push({
          id: t.test_id,
          cx,
          cy,
          tests: [t],
          rep: t,
          color: fuelColorHex(t.fuel),
        });
      }
    }
    return groups;
  }, [tests, selectedTestId, W, H, PLOT_W, PLOT_H, PAD.left, PAD.right, PAD.top]);

  const svgCoordsToAnchor = (
    cx: number,
    cy: number,
    sizePx = 14
  ): PointTooltipAnchor => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: cx, y: cy, width: sizePx, height: sizePx };
    }
    return {
      x: rect.left + (cx / W) * rect.width,
      y: rect.top + (cy / H) * rect.height,
      width: sizePx,
      height: sizePx,
    };
  };

  const limitY = yTempPx(600);
  const minXTickGap = measureTextWidth('3.2', typo.axisFontSize, '500', 'mono') + 22;
  const xTicks =
    PLOT_W / 6 >= minXTickGap
      ? [
          { v: 0.05, label: '0' },
          { v: 0.2, label: '0.2' },
          { v: 0.5, label: '0.5' },
          { v: 1.0, label: '1.0' },
          { v: 2.0, label: '2.0' },
          { v: 3.2, label: '3.2' },
        ]
      : PLOT_W / 4 >= minXTickGap
        ? [
            { v: 0.05, label: '0' },
            { v: 0.5, label: '0.5' },
            { v: 1.0, label: '1.0' },
            { v: 2.0, label: '2.0' },
          ]
        : [
            { v: 0.05, label: '0' },
            { v: 0.5, label: '0.5' },
            { v: 2.0, label: '2.0' },
          ];
  const yTicks =
    PLOT_H < typo.axisFontSize * 11
      ? [200, 400, 600]
      : [100, 200, 300, 400, 500, 600, 700];

  const fullLimitText = `600 °C · ${tStr.flowChart.limitLabel}`;
  const fullLimitW = measureTextWidth(fullLimitText, typo.zoneFontSize, '600') + 16;
  const limitText =
    fullLimitW > PLOT_W - 8
      ? `600 °C · ${tStr.flowChart.legendLimit}`
      : fullLimitText;
  const limitLabelWidth = Math.min(
    PLOT_W - 4,
    measureTextWidth(limitText, typo.zoneFontSize, '600') + 16
  );

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
      helpBody={`${tStr.kpis.peakBody} ${tStr.flowChart.helpTip}`}
      chartContextPrompt={tStr.prompts.explainFlowVsTemp}
      chartContextLabel={tStr.flowChart.title}
      legend={legendItems}
      isEmpty={clusters.length === 0}
      loading={loading}
    >
      <div
        ref={boxRef}
        style={{ minHeight: `${minWrapperH}px` }}
        className="relative h-full min-h-0 flex-1 w-full overflow-hidden"
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="block h-full w-full overflow-hidden"
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
                y={yTempPx(temp) + typo.axisFontSize * 0.34}
                textAnchor="end"
                fill={typo.tickColor}
                className="chart-text-tick"
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
                  y={H - PAD.bottom + typo.axisFontSize + 5}
                  textAnchor="middle"
                  fill={typo.tickColor}
                  className="chart-text-tick"
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
              y1={4 + limitBadgeH}
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
              height={limitBadgeH}
              rx={4}
              fill="rgba(11, 16, 32, 0.86)"
              stroke="rgba(239, 68, 68, 0.55)"
            />
            <text
              x={W - PAD.right - 8}
              y={4 + limitBadgeH * 0.7}
              textAnchor="end"
              fill="#FCA5A5"
              className="chart-text-annotation"
              fontWeight="600"
            >
              {limitText}
            </text>
          </g>

          {/* Clustered Points */}
          {clusters.map((cluster) => {
            const t = cluster.rep;
            const { cx, cy, color } = cluster;
            const isSel = cluster.tests.some((x) => x.test_id === selectedTestId);
            const isActive = clusterTooltip.active?.data.id === cluster.id;
            const count = cluster.tests.length;
            const highlight = isSel || isActive;

            const common = {
              'data-point-trigger': 'true',
              className: 'cursor-pointer',
              onMouseEnter: () =>
                clusterTooltip.onPointEnter(
                  cluster,
                  svgCoordsToAnchor(cx, cy, 14)
                ),
              onMouseLeave: () => clusterTooltip.onPointLeave(),
              onPointerDown: (e: React.PointerEvent) => {
                lastPointerTypeRef.current = e.pointerType;
              },
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                if (count === 1) {
                  clusterTooltip.closeAll();
                  selectTest(t.test_id, true);
                } else {
                  clusterTooltip.onPointClick(
                    cluster,
                    svgCoordsToAnchor(cx, cy, 14),
                    cluster.id,
                    lastPointerTypeRef.current
                  );
                }
              },
            };

            let shape: React.ReactNode;
            if (t.hit_burner_temp_limit) {
              const d = highlight ? 5.2 : 4.2;
              shape = (
                <polygon
                  {...common}
                  points={`${cx},${cy - d} ${cx + d},${cy + d * 0.85} ${cx - d},${cy + d * 0.85}`}
                  fill={color}
                  fillOpacity={0.92}
                  stroke={highlight ? '#FFFFFF' : '#EF4444'}
                  strokeWidth={highlight ? 1.6 : 1.1}
                />
              );
            } else if (t.outcome === 'flow_terminated') {
              const s = highlight ? 4.4 : 3.5;
              shape = (
                <rect
                  {...common}
                  x={cx - s}
                  y={cy - s}
                  width={s * 2}
                  height={s * 2}
                  fill={color}
                  fillOpacity={0.84}
                  stroke={highlight ? '#FFFFFF' : '#0B1020'}
                  strokeWidth={highlight ? 1.6 : 0.8}
                />
              );
            } else if (t.cool_flame) {
              const d = highlight ? 5.4 : 4.4;
              shape = (
                <polygon
                  {...common}
                  points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
                  fill={color}
                  fillOpacity={0.94}
                  stroke="#E9D5FF"
                  strokeWidth={highlight ? 1.6 : 1.1}
                />
              );
            } else {
              shape = (
                <circle
                  {...common}
                  cx={cx}
                  cy={cy}
                  r={highlight ? 5.2 : 3.8}
                  fill={color}
                  fillOpacity={0.82}
                  stroke={highlight ? '#FFFFFF' : '#0B1020'}
                  strokeWidth={highlight ? 1.6 : 0.8}
                />
              );
            }

            const badgeText = String(count);
            const bw = badgeText.length > 1 ? 18 : 14;
            const bx = Math.min(W - PAD.right - bw - 1, cx + 4);
            const by = Math.max(PAD.top + 1, cy - 13);

            return (
              <g key={cluster.id}>
                {shape}
                {count > 1 && (
                  <g pointerEvents="none">
                    <rect
                      x={bx}
                      y={by}
                      width={bw}
                      height={13}
                      rx={6.5}
                      fill="#0B1020"
                      stroke="#38BDF8"
                      strokeWidth={1}
                    />
                    <text
                      x={bx + bw / 2}
                      y={by + 9.5}
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="8.5"
                      fontWeight="700"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {badgeText}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          <text
            x={PAD.left + PLOT_W / 2}
            y={H - Math.max(6, Math.round(typo.axisTitleSize * 0.35 + 2))}
            textAnchor="middle"
            fill={typo.tickColor}
            className="chart-text-axis"
          >
            {W < 420 ? tStr.flowChart.xAxisShort : tStr.flowChart.xAxis}
          </text>
          {(() => {
            const yLabelX = Math.max(14, Math.ceil(typo.axisTitleSize * 0.85 + 4));
            const yLabelY = PAD.top + PLOT_H / 2;
            return (
              <text
                x={yLabelX}
                y={yLabelY}
                textAnchor="middle"
                fill={typo.tickColor}
                className="chart-text-axis"
                transform={`rotate(-90 ${yLabelX} ${yLabelY})`}
              >
                {tStr.flowChart.yAxis}
              </text>
            );
          })()}
        </svg>

        <PointTooltipPopover
          open={Boolean(clusterTooltip.active)}
          pinned={clusterTooltip.isPinned}
          anchor={clusterTooltip.active?.anchor ?? null}
          tests={clusterTooltip.active?.data.tests ?? []}
          headerSummary={
            clusterTooltip.active && clusterTooltip.active.data.tests.length > 1
              ? `${tStr.pointPopover.testsCount(
                  clusterTooltip.active.data.tests.length
                )} · ${formatNumber(
                  clusterTooltip.active.data.rep.hc_flow_mg_s,
                  2,
                  lang
                )} mg/s · ${formatNumber(
                  clusterTooltip.active.data.rep.peak_burner_temp_c ?? 0,
                  0,
                  lang
                )} °C`
              : undefined
          }
          onPointerEnterPopover={clusterTooltip.onPopoverEnter}
          onPointerLeavePopover={clusterTooltip.onPopoverLeave}
          onPin={clusterTooltip.pinActive}
          onClose={clusterTooltip.closeAll}
        />
      </div>
    </ChartCard>
  );
};
