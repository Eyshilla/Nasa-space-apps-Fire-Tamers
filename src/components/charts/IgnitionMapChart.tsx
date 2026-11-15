import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Grid3X3, ScatterChart } from 'lucide-react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { formatNumber, testCategoryColor } from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import {
  measureTextWidth,
  useChartTypography,
} from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';
import { useIsChartExpanded } from '../ChartHostContext';
import {
  PointTooltipPopover,
  useClusterTooltip,
  type PointTooltipAnchor,
} from '../PointTooltipPopover';

interface IgnitionMapChartProps {
  tests: Psi159Test[];
  loading?: boolean;
  tall?: boolean;
  fillHeight?: boolean;
  compact?: boolean;
  sharedLegendActive?: boolean;
}

const PSI_MIN = 6;
const PSI_MAX = 50;
const O2_MIN = 0;
const O2_MAX = 0.92;

interface PointCluster {
  id: string;
  cx: number;
  cy: number;
  tests: Psi159Test[];
  rep: Psi159Test;
  color: string;
}

function testPriority(t: Psi159Test, selectedId: string): number {
  if (t.test_id === selectedId) return 5;
  if (t.cool_flame || t.ignition_type === 'cool') return 4;
  if (t.hit_burner_temp_limit) return 3;
  if (t.ignited) return 2;
  return 1;
}

interface HeatCell {
  ix: number;
  iy: number;
  psi0: number;
  psi1: number;
  o20: number;
  o21: number;
  tests: Psi159Test[];
  ignited: number;
  coolCount: number;
  pct: number;
}

export const IgnitionMapChart: React.FC<IgnitionMapChartProps> = ({
  tests,
  loading = false,
  tall = false,
  fillHeight = false,
  compact = false,
  sharedLegendActive = false,
}) => {
  const [viewMode, setViewMode] = useState<'scatter' | 'heatmap'>('scatter');
  const scatterTooltip = useClusterTooltip<PointCluster>((c) => c.id);
  const cellTooltip = useClusterTooltip<HeatCell>((c) => `${c.ix}-${c.iy}`);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastPointerTypeRef = useRef<string>('mouse');
  const [size, setSize] = useState({ w: 680, h: 320 });

  const typo = useChartTypography();
  const isExpanded = useIsChartExpanded();

  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const selectTest = usePsiStore((s) => s.selectTest);
  const setCrossFilter = usePsiStore((s) => s.setCrossFilter);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

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
      const h = Math.max(150, Math.round(rect.height));
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
    fillHeight,
    isExpanded,
    typo.presentationMode,
    typo.scaleFactor,
  ]);

  const W = size.w;
  const H = size.h;

  const yTickMaxW = measureTextWidth('100%', typo.axisFontSize, '500', 'mono');
  const padLeft = Math.ceil(yTickMaxW + typo.axisTitleSize + 24);
  const padRight = 20;
  const padBottom = Math.ceil(typo.axisFontSize * 1.3 + typo.axisTitleSize + 22);
  const availBadgeW = Math.max(140, W - padLeft - padRight);
  const badgeH = Math.ceil(typo.zoneFontSize * 1.45 + 6);
  const badgeRowGap = 5;

  const zoneBadgeLayout = useMemo(() => {
    const rawItems = [
      {
        id: 'lunar',
        full: `${tStr.ignitionChart.lunarZone} (${tStr.ignitionChart.lunarSpecs})`,
        short: tStr.ignitionChart.lunarZone,
        fill: '#6EE7B7',
        stroke: '#34D399',
        fontFamily: 'sans' as const,
        fontWeight: '600',
      },
      {
        id: 'suit',
        full: `↖ ${tStr.ignitionChart.spacesuit}`,
        short: `↖ ${tStr.ignitionChart.spacesuit}`,
        fill: '#7DD3FC',
        stroke: '#38BDF8',
        fontFamily: 'mono' as const,
        fontWeight: '500',
      },
      {
        id: 'earth',
        full: tStr.ignitionChart.earthAir,
        short: tStr.ignitionChart.earthShort,
        fill: '#FDE047',
        stroke: '#FACC15',
        fontFamily: 'sans' as const,
        fontWeight: '600',
      },
    ];

    const prepared = rawItems.map((item) => {
      const fullW =
        measureTextWidth(item.full, typo.zoneFontSize, item.fontWeight, item.fontFamily) + 16;
      const useShort = fullW > availBadgeW * 0.65 && item.short !== item.full;
      const text = useShort ? item.short : item.full;
      const textW = measureTextWidth(text, typo.zoneFontSize, item.fontWeight, item.fontFamily);
      return {
        ...item,
        text,
        bw: Math.min(availBadgeW, textW + 16),
      };
    });

    const rows: Array<Array<(typeof prepared)[number] & { x: number; y: number }>> = [];
    let currentRow: (typeof prepared)[number][] = [];
    let currentW = 0;
    const colGap = 8;

    for (const item of prepared) {
      const needed = currentRow.length === 0 ? item.bw : currentW + colGap + item.bw;
      if (currentRow.length > 0 && needed > availBadgeW) {
        rows.push(
          currentRow.map((r) => ({ ...r, x: 0, y: 0 }))
        );
        currentRow = [item];
        currentW = item.bw;
      } else {
        currentRow.push(item);
        currentW = needed;
      }
    }
    if (currentRow.length > 0) {
      rows.push(currentRow.map((r) => ({ ...r, x: 0, y: 0 })));
    }

    const placed: Array<(typeof prepared)[number] & { x: number; y: number }> = [];
    rows.forEach((row, rowIdx) => {
      const y = 4 + rowIdx * (badgeH + badgeRowGap);
      if (rowIdx === 0 && row.length === 3) {
        // Spread: Lunar left, Suit after Lunar, Earth right-aligned
        row[0].x = padLeft;
        row[0].y = y;
        row[1].x = padLeft + row[0].bw + colGap;
        row[1].y = y;
        row[2].x = Math.max(row[1].x + row[1].bw + colGap, W - padRight - row[2].bw);
        row[2].y = y;
      } else {
        let cursorX = padLeft;
        for (const r of row) {
          r.x = cursorX;
          r.y = y;
          cursorX += r.bw + colGap;
        }
      }
      placed.push(...row);
    });

    return {
      placed,
      padTop: rows.length * (badgeH + badgeRowGap) + 6,
    };
  }, [tStr, typo.zoneFontSize, availBadgeW, badgeH, padLeft, padRight, W]);

  const PAD = {
    top: zoneBadgeLayout.padTop,
    right: padRight,
    bottom: padBottom,
    left: padLeft,
  };
  const PLOT_W = Math.max(120, W - PAD.left - PAD.right);
  const PLOT_H = Math.max(120, H - PAD.top - PAD.bottom);

  const xPx = (psi: number) =>
    PAD.left + ((psi - PSI_MIN) / (PSI_MAX - PSI_MIN)) * PLOT_W;
  const yPx = (o2: number) =>
    PAD.top + (1 - (o2 - O2_MIN) / (O2_MAX - O2_MIN)) * PLOT_H;

  const [brushStart, setBrushStart] = useState<{ x: number; y: number } | null>(null);
  const [brushCurr, setBrushCurr] = useState<{ x: number; y: number } | null>(null);

  // Cluster coincident tests (pixel distance <= 10px) so overlapping markers display a crisp count badge
  const clusters = useMemo<PointCluster[]>(() => {
    const sorted = [...tests].sort(
      (a, b) => testPriority(b, selectedTestId) - testPriority(a, selectedTestId)
    );
    const groups: PointCluster[] = [];
    const radiusSq = 100; // 10px proximity threshold

    for (const t of sorted) {
      const cx = Math.max(
        PAD.left + 6,
        Math.min(W - PAD.right - 6, xPx(t.pressure_psi))
      );
      const cy = Math.max(
        PAD.top + 6,
        Math.min(H - PAD.bottom - 6, yPx(t.o2_fraction))
      );

      let matched: PointCluster | null = null;
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
          color: testCategoryColor(t),
        });
      }
    }
    return groups;
  }, [tests, selectedTestId, W, H, PLOT_W, PLOT_H, PAD.left, PAD.right, PAD.top, PAD.bottom]);

  const heatCells = useMemo(() => {
    const psiBins = W < 420 ? 6 : 8;
    const o2Bins = 6;
    const psiStep = (PSI_MAX - PSI_MIN) / psiBins;
    const o2Step = (O2_MAX - O2_MIN) / o2Bins;
    const cells: Array<{
      ix: number;
      iy: number;
      psi0: number;
      psi1: number;
      o20: number;
      o21: number;
      tests: Psi159Test[];
      ignited: number;
      coolCount: number;
      pct: number;
    }> = [];

    for (let ix = 0; ix < psiBins; ix++) {
      for (let iy = 0; iy < o2Bins; iy++) {
        const psi0 = PSI_MIN + ix * psiStep;
        const psi1 = psi0 + psiStep;
        const o20 = O2_MIN + iy * o2Step;
        const o21 = o20 + o2Step;
        const matching = tests.filter(
          (t) =>
            t.pressure_psi >= psi0 &&
            (ix === psiBins - 1 ? t.pressure_psi <= psi1 : t.pressure_psi < psi1) &&
            t.o2_fraction >= o20 &&
            (iy === o2Bins - 1 ? t.o2_fraction <= o21 : t.o2_fraction < o21)
        );
        const ignited = matching.filter((t) => t.ignited).length;
        const coolCount = matching.filter((t) => t.cool_flame).length;
        cells.push({
          ix,
          iy,
          psi0,
          psi1,
          o20,
          o21,
          tests: matching,
          ignited,
          coolCount,
          pct: matching.length > 0 ? (ignited / matching.length) * 100 : 0,
        });
      }
    }
    return cells;
  }, [tests, W]);

  const toSvgCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return { x, y };
  };

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

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (viewMode !== 'scatter') return;
    if ((e.target as HTMLElement).dataset.point === 'true') return;
    scatterTooltip.closeAll();
    const pt = toSvgCoords(e);
    if (!pt) return;
    if (
      pt.x >= PAD.left &&
      pt.x <= W - PAD.right &&
      pt.y >= PAD.top &&
      pt.y <= H - PAD.bottom
    ) {
      setBrushStart(pt);
      setBrushCurr(pt);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!brushStart) return;
    const pt = toSvgCoords(e);
    if (pt) setBrushCurr(pt);
  };

  const handleMouseUp = () => {
    if (!brushStart || !brushCurr) {
      setBrushStart(null);
      setBrushCurr(null);
      return;
    }
    const minX = Math.min(brushStart.x, brushCurr.x);
    const maxX = Math.max(brushStart.x, brushCurr.x);
    const minY = Math.min(brushStart.y, brushCurr.y);
    const maxY = Math.max(brushStart.y, brushCurr.y);

    if (maxX - minX > 10 && maxY - minY > 10) {
      const selected = clusters
        .filter((p) => p.cx >= minX && p.cx <= maxX && p.cy >= minY && p.cy <= maxY)
        .flatMap((p) => p.tests.map((t) => t.test_id));
      if (selected.length > 0) {
        setCrossFilter({
          source: tStr.ignitionChart.title.split('·')[0].trim(),
          label: `${selected.length}`,
          testIds: selected,
        });
      }
    }
    setBrushStart(null);
    setBrushCurr(null);
  };

  const lunarX = xPx(PSI_MIN);
  const lunarW = Math.max(2, xPx(10.2) - xPx(PSI_MIN));
  const lunarY = yPx(O2_MAX);
  const lunarH = Math.max(2, yPx(0.3) - yPx(O2_MAX));

  const earthX = xPx(14.7);
  const earthY = yPx(0.21);

  const xTickMinGap = measureTextWidth('45', typo.axisFontSize, '500', 'mono') + 24;
  const xTicks =
    PLOT_W / 8 >= xTickMinGap
      ? [10, 15, 20, 25, 30, 35, 40, 45]
      : PLOT_W / 4 >= xTickMinGap
        ? [10, 20, 30, 40]
        : [10, 25, 40];
  const yTicks =
    PLOT_H < typo.axisFontSize * 7.5 ? [0, 0.4, 0.8] : [0, 0.2, 0.4, 0.6, 0.8];

  const legendItems: ChartLegendItem[] = useMemo(() => {
    if (sharedLegendActive) {
      return [
        {
          id: 'lunarZone',
          label: tStr.ignitionChart.lunarZone,
          shortLabel: tStr.ignitionChart.lunarZone,
          marker: (
            <span className="h-2.5 w-2.5 rounded-xs border border-emerald-400/80 bg-emerald-500/30" />
          ),
        },
        {
          id: 'earthAir',
          label: tStr.ignitionChart.earthShort,
          shortLabel: tStr.ignitionChart.earthShort,
          marker: (
            <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-yellow-400" />
          ),
        },
      ];
    }

    return [
      {
        id: 'normal',
        label: tStr.ignitionChart.legendNormal,
        shortLabel: tStr.ignitionChart.legendNormal,
        marker: <span className="text-cyan-400">●</span>,
      },
      {
        id: 'inverse',
        label: tStr.ignitionChart.legendInverse,
        shortLabel: tStr.ignitionChart.legendInverse,
        marker: <span className="text-orange-400">●</span>,
      },
      {
        id: 'cool',
        label: tStr.ignitionChart.legendCool,
        shortLabel: tStr.ignitionChart.legendCool,
        marker: <span className="text-purple-400">◆</span>,
      },
      {
        id: 'limit',
        label: tStr.ignitionChart.legendLimit,
        shortLabel: tStr.ignitionChart.legendLimit,
        marker: <span className="text-red-400">▲</span>,
      },
      {
        id: 'none',
        label: tStr.ignitionChart.legendNone,
        shortLabel: tStr.ignitionChart.legendNone,
        marker: <span className="text-slate-300">✕</span>,
      },
    ];
  }, [sharedLegendActive, tStr]);

  const activeCluster = scatterTooltip.active?.data ?? null;
  const activeCell = cellTooltip.active?.data ?? null;

  return (
    <ChartCard
      id="ignition-map-card"
      title={tStr.ignitionChart.title}
      subtitle={tStr.ignitionChart.subtitle}
      helpTitle={tStr.ignitionChart.title}
      helpBody={`${tStr.kpis.lunarBody} ${tStr.ignitionChart.helpTip}`}
      chartContextPrompt={tStr.prompts.explainIgnitionMap}
      chartContextLabel={tStr.ignitionChart.title}
      legend={legendItems}
      tall={tall}
      fillHeight={fillHeight}
      compact={compact}
      className={typo.presentationMode ? 'presentation-focus-card' : ''}
      isEmpty={tests.length === 0}
      loading={loading}
      actions={
        <div className="flex items-center rounded-md border border-slate-700 bg-[#0B1020] p-0.5">
          <button
            type="button"
            onClick={() => {
              setViewMode('scatter');
              cellTooltip.closeAll();
            }}
            className={`inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              viewMode === 'scatter'
                ? 'bg-cyan-500/20 text-cyan-200'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            <ScatterChart className="h-3 w-3 shrink-0" />
            {tStr.ignitionChart.points}
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('heatmap');
              scatterTooltip.closeAll();
            }}
            className={`inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-cyan-500/20 text-cyan-200'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            <Grid3X3 className="h-3 w-3 shrink-0" />
            {tStr.ignitionChart.heatmap}
          </button>
        </div>
      }
    >
      <div
        ref={boxRef}
        style={{ minHeight: `${compact && !isExpanded ? 185 : 240}px` }}
        className="relative h-full min-h-0 flex-1 w-full select-none overflow-hidden"
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="block h-full w-full cursor-crosshair overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (brushStart) handleMouseUp();
          }}
        >
          {/* Plot border frame */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="none"
            stroke="#1E293B"
            strokeWidth={1}
          />

          {/* Y grid & ticks starting at 0% */}
          {yTicks.map((o2) => (
            <g key={`y-${o2}`}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yPx(o2)}
                y2={yPx(o2)}
                stroke="#1E293B"
                strokeDasharray="3 3"
              />
              <text
                x={PAD.left - 8}
                y={yPx(o2) + typo.axisFontSize * 0.34}
                textAnchor="end"
                fill={typo.tickColor}
                className="chart-text-tick"
                fontFamily="IBM Plex Mono, monospace"
              >
                {Math.round(o2 * 100)}%
              </text>
            </g>
          ))}

          {/* X grid & ticks */}
          {xTicks.map((psi) => (
            <g key={`x-${psi}`}>
              <line
                x1={xPx(psi)}
                x2={xPx(psi)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="#1E293B"
                strokeDasharray="3 3"
              />
              <text
                x={xPx(psi)}
                y={H - PAD.bottom + typo.axisFontSize + 5}
                textAnchor="middle"
                fill={typo.tickColor}
                className="chart-text-tick"
                fontFamily="IBM Plex Mono, monospace"
              >
                {psi}
              </text>
            </g>
          ))}

          {/* Lunar Zone shaded box */}
          <rect
            x={lunarX}
            y={lunarY}
            width={lunarW}
            height={lunarH}
            fill="rgba(16, 185, 129, 0.11)"
            stroke="rgba(52, 211, 153, 0.6)"
            strokeDasharray="4 3"
          />

          {/* Fixed Border Zone Labels (OUTSIDE the data point plot area, y < PAD.top) */}
          <g pointerEvents="none">
            {zoneBadgeLayout.placed.map((badge) => {
              const targetX =
                badge.id === 'lunar'
                  ? lunarX + Math.min(lunarW / 2, 24)
                  : badge.id === 'earth'
                    ? earthX
                    : null;
              const targetY =
                badge.id === 'lunar'
                  ? PAD.top
                  : badge.id === 'earth'
                    ? earthY
                    : null;
              return (
                <g key={badge.id}>
                  {targetX !== null && targetY !== null && (
                    <line
                      x1={targetX}
                      y1={targetY}
                      x2={Math.min(badge.x + badge.bw / 2, W - PAD.right)}
                      y2={badge.y + badgeH}
                      stroke={badge.stroke}
                      strokeOpacity={badge.id === 'earth' ? 0.38 : 0.65}
                      strokeDasharray="3 3"
                    />
                  )}
                  <rect
                    x={badge.x}
                    y={badge.y}
                    width={badge.bw}
                    height={badgeH}
                    rx={4}
                    fill="#0B1020"
                    fillOpacity={0.94}
                    stroke={badge.stroke}
                    strokeOpacity={0.58}
                  />
                  <text
                    x={badge.x + 8}
                    y={badge.y + badgeH * 0.7}
                    fill={badge.fill}
                    className="chart-text-annotation"
                    fontWeight={badge.fontWeight}
                    fontFamily={
                      badge.fontFamily === 'mono'
                        ? 'IBM Plex Mono, monospace'
                        : undefined
                    }
                  >
                    {badge.text}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Heatmap View */}
          {viewMode === 'heatmap' &&
            heatCells.map((cell) => {
              const x0 = xPx(cell.psi0);
              const x1 = xPx(cell.psi1);
              const y0 = yPx(cell.o21);
              const y1 = yPx(cell.o20);
              const hasTests = cell.tests.length > 0;
              const fill = !hasTests
                ? 'rgba(15, 23, 42, 0.25)'
                : `rgba(${Math.round(56 + (cell.pct / 100) * 185)}, ${Math.round(
                    189 - (cell.pct / 100) * 120
                  )}, ${Math.round(248 - (cell.pct / 100) * 190)}, ${
                    0.24 + (cell.pct / 100) * 0.56
                  })`;
              const isCellActive =
                activeCell?.ix === cell.ix && activeCell?.iy === cell.iy;
              return (
                <g
                  key={`cell-${cell.ix}-${cell.iy}`}
                  data-point-trigger={hasTests ? 'true' : undefined}
                  className={hasTests ? 'cursor-pointer' : ''}
                  onMouseEnter={(e) => {
                    if (!hasTests) return;
                    const r = (e.currentTarget as Element).getBoundingClientRect();
                    cellTooltip.onPointEnter(cell, {
                      x: r.left + r.width / 2,
                      y: r.top + r.height / 2,
                      width: r.width,
                      height: r.height,
                    });
                  }}
                  onMouseLeave={() => {
                    if (hasTests) cellTooltip.onPointLeave();
                  }}
                  onPointerDown={(e) => {
                    lastPointerTypeRef.current = e.pointerType;
                  }}
                  onClick={(e) => {
                    if (!hasTests) return;
                    e.stopPropagation();
                    if (cell.tests.length === 1) {
                      cellTooltip.closeAll();
                      selectTest(cell.tests[0].test_id, true);
                      return;
                    }
                    const r = (e.currentTarget as Element).getBoundingClientRect();
                    cellTooltip.onPointClick(
                      cell,
                      {
                        x: r.left + r.width / 2,
                        y: r.top + r.height / 2,
                        width: r.width,
                        height: r.height,
                      },
                      `${cell.ix}-${cell.iy}`,
                      lastPointerTypeRef.current
                    );
                  }}
                >
                  <rect
                    x={x0 + 1}
                    y={y0 + 1}
                    width={Math.max(0, x1 - x0 - 2)}
                    height={Math.max(0, y1 - y0 - 2)}
                    rx={3}
                    fill={fill}
                    stroke={
                      isCellActive
                        ? '#38BDF8'
                        : hasTests
                          ? 'rgba(148,163,184,0.32)'
                          : 'rgba(30,41,59,0.4)'
                    }
                    strokeWidth={isCellActive ? 1.8 : 1}
                  />
                  {hasTests &&
                    x1 - x0 >=
                      measureTextWidth(
                        `${Math.round(cell.pct)}% (${cell.tests.length})`,
                        typo.barValueFontSize,
                        '600',
                        'mono'
                      ) +
                        8 &&
                    y1 - y0 >= typo.barValueFontSize + 6 && (
                    <text
                      x={(x0 + x1) / 2}
                      y={(y0 + y1) / 2 + typo.barValueFontSize * 0.34}
                      textAnchor="middle"
                      fill="#F8FAFC"
                      className="chart-text-bar"
                      fontWeight="600"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {Math.round(cell.pct)}% ({cell.tests.length})
                    </text>
                  )}
                </g>
              );
            })}

          {/* Scatter View Clustered Points (radius 5–6px, 1px dark border, count badge on coincident tests) */}
          {viewMode === 'scatter' &&
            clusters.map((cluster) => {
              const t = cluster.rep;
              const { cx, cy, color } = cluster;
              const isSelected = cluster.tests.some((x) => x.test_id === selectedTestId);
              const isTooltipActive = activeCluster?.id === cluster.id;
              const count = cluster.tests.length;
              const r = isSelected || isTooltipActive ? 6.4 : 5.4;

              const commonProps = {
                'data-point': 'true',
                'data-point-trigger': 'true',
                className: 'cursor-pointer transition-opacity',
                onMouseEnter: () =>
                  scatterTooltip.onPointEnter(
                    cluster,
                    svgCoordsToAnchor(cx, cy, 16)
                  ),
                onMouseLeave: () => scatterTooltip.onPointLeave(),
                onPointerDown: (e: React.PointerEvent) => {
                  lastPointerTypeRef.current = e.pointerType;
                },
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (count === 1) {
                    scatterTooltip.closeAll();
                    selectTest(t.test_id, true);
                  } else {
                    scatterTooltip.onPointClick(
                      cluster,
                      svgCoordsToAnchor(cx, cy, 16),
                      cluster.id,
                      lastPointerTypeRef.current
                    );
                  }
                },
              };

              const highlight = isSelected || isTooltipActive;
              let shape: React.ReactNode;
              if (t.cool_flame || t.ignition_type === 'cool') {
                const d = r + 0.6;
                shape = (
                  <polygon
                    {...commonProps}
                    points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
                    fill={color}
                    fillOpacity={0.92}
                    stroke={highlight ? '#FFFFFF' : '#0B1020'}
                    strokeWidth={highlight ? 1.8 : 1}
                  />
                );
              } else if (t.hit_burner_temp_limit || t.outcome === 'flash_only') {
                const d = r + 0.5;
                shape = (
                  <polygon
                    {...commonProps}
                    points={`${cx},${cy - d} ${cx + d},${cy + d * 0.85} ${cx - d},${cy + d * 0.85}`}
                    fill={t.hit_burner_temp_limit ? '#EF4444' : '#F59E0B'}
                    fillOpacity={0.92}
                    stroke={highlight ? '#FFFFFF' : '#0B1020'}
                    strokeWidth={highlight ? 1.8 : 1}
                  />
                );
              } else if (!t.ignited) {
                const s = 2.6;
                shape = (
                  <g {...commonProps}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="#475569"
                      fillOpacity={0.85}
                      stroke={highlight ? '#FFFFFF' : '#0B1020'}
                      strokeWidth={highlight ? 1.8 : 1}
                    />
                    <path
                      d={`M${cx - s},${cy - s} L${cx + s},${cy + s} M${cx + s},${cy - s} L${cx - s},${cy + s}`}
                      stroke="#E2E8F0"
                      strokeWidth={1.3}
                      strokeLinecap="round"
                    />
                  </g>
                );
              } else {
                shape = (
                  <circle
                    {...commonProps}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    fillOpacity={0.88}
                    stroke={highlight ? '#FFFFFF' : '#0B1020'}
                    strokeWidth={highlight ? 1.8 : 1}
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
                    <g
                      pointerEvents="none"
                    >
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

          {/* Earth crosshair */}
          <g pointerEvents="none">
            <circle
              cx={earthX}
              cy={earthY}
              r={6}
              fill="rgba(250, 204, 21, 0.14)"
              stroke="#FACC15"
              strokeWidth={1.6}
            />
            <line
              x1={earthX - 8}
              x2={earthX + 8}
              y1={earthY}
              y2={earthY}
              stroke="#FACC15"
              strokeWidth={1.2}
            />
          </g>

          {/* Brush overlay */}
          {brushStart && brushCurr && (
            <rect
              x={Math.min(brushStart.x, brushCurr.x)}
              y={Math.min(brushStart.y, brushCurr.y)}
              width={Math.abs(brushCurr.x - brushStart.x)}
              height={Math.abs(brushCurr.y - brushStart.y)}
              fill="rgba(56, 189, 248, 0.16)"
              stroke="#38BDF8"
              strokeDasharray="3 2"
            />
          )}

          {/* Axis Labels */}
          <text
            x={PAD.left + PLOT_W / 2}
            y={H - Math.max(6, Math.round(typo.axisTitleSize * 0.35 + 2))}
            textAnchor="middle"
            fill={typo.tickColor}
            className="chart-text-axis"
          >
            {W < 420 ? tStr.ignitionChart.xAxisShort : tStr.ignitionChart.xAxis}
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
                {tStr.ignitionChart.yAxis}
              </text>
            );
          })()}
        </svg>

        {/* Shared Floating UI Portal Popover for Scatter Clusters */}
        {viewMode === 'scatter' && (
          <PointTooltipPopover
            open={Boolean(scatterTooltip.active)}
            pinned={scatterTooltip.isPinned}
            anchor={scatterTooltip.active?.anchor ?? null}
            tests={activeCluster?.tests ?? []}
            onPointerEnterPopover={scatterTooltip.onPopoverEnter}
            onPointerLeavePopover={scatterTooltip.onPopoverLeave}
            onPin={scatterTooltip.pinActive}
            onClose={scatterTooltip.closeAll}
          />
        )}

        {/* Shared Floating UI Portal Popover for Heatmap Cells */}
        {viewMode === 'heatmap' && (
          <PointTooltipPopover
            open={Boolean(cellTooltip.active)}
            pinned={cellTooltip.isPinned}
            anchor={cellTooltip.active?.anchor ?? null}
            tests={activeCell?.tests ?? []}
            headerSummary={
              activeCell
                ? `${tStr.pointPopover.testsCount(activeCell.tests.length)} · ${Math.round(
                    activeCell.o20 * 100
                  )}–${Math.round(activeCell.o21 * 100)}% O₂ · ${formatNumber(
                    activeCell.psi0,
                    1,
                    lang
                  )}–${formatNumber(activeCell.psi1, 1, lang)} psi`
                : undefined
            }
            extraStatsLine={
              activeCell
                ? `${activeCell.ignited}/${activeCell.tests.length} (${formatNumber(
                    activeCell.pct,
                    0,
                    lang
                  )}%)${activeCell.coolCount > 0 ? ` · ◆ ${activeCell.coolCount}` : ''}`
                : undefined
            }
            onFilterSubset={
              activeCell && activeCell.tests.length > 0
                ? () =>
                    setCrossFilter({
                      source: tStr.ignitionChart.heatmap,
                      label: `${activeCell.tests.length} (${Math.round(
                        activeCell.o20 * 100
                      )}–${Math.round(activeCell.o21 * 100)}% O₂)`,
                      testIds: activeCell.tests.map((t) => t.test_id),
                    })
                : undefined
            }
            onPointerEnterPopover={cellTooltip.onPopoverEnter}
            onPointerLeavePopover={cellTooltip.onPopoverLeave}
            onPin={cellTooltip.pinActive}
            onClose={cellTooltip.closeAll}
          />
        )}
      </div>
    </ChartCard>
  );
};
