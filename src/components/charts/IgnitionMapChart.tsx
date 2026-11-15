import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Grid3X3, ScatterChart } from 'lucide-react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { isInLunarZone } from '../../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
  testCategoryColor,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { useChartTypography } from '../../utils/useChartTypography';
import { ChartCard, type ChartLegendItem } from '../ChartCard';

interface IgnitionMapChartProps {
  tests: Psi159Test[];
  loading?: boolean;
  tall?: boolean;
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

export const IgnitionMapChart: React.FC<IgnitionMapChartProps> = ({
  tests,
  loading = false,
  tall = false,
  sharedLegendActive = false,
}) => {
  const [viewMode, setViewMode] = useState<'scatter' | 'heatmap'>('scatter');
  const [hoveredCluster, setHoveredCluster] = useState<PointCluster | null>(null);
  const [pinnedCluster, setPinnedCluster] = useState<PointCluster | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    psiLabel: string;
    o2Label: string;
    total: number;
    ignited: number;
    coolCount: number;
    pct: number;
  } | null>(null);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ w: 680, h: 320 });

  const typo = useChartTypography();

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const w = Math.max(240, Math.round(rect.width));
      const h = Math.max(220, Math.round(rect.height));
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading, tests.length, tall, typo.presentationMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinnedCluster(null);
        setHoveredCluster(null);
      }
    };
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setPinnedCluster(null);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, []);

  const W = size.w;
  const H = size.h;
  const narrow = W < 540;
  const PAD = {
    top: narrow ? 50 : 34,
    right: 20,
    bottom: typo.isLargeScreen ? 50 : 44,
    left: typo.isLargeScreen ? 62 : 52,
  };
  const PLOT_W = Math.max(120, W - PAD.left - PAD.right);
  const PLOT_H = Math.max(120, H - PAD.top - PAD.bottom);

  const xPx = (psi: number) =>
    PAD.left + ((psi - PSI_MIN) / (PSI_MAX - PSI_MIN)) * PLOT_W;
  const yPx = (o2: number) =>
    PAD.top + (1 - (o2 - O2_MIN) / (O2_MAX - O2_MIN)) * PLOT_H;

  const [brushStart, setBrushStart] = useState<{ x: number; y: number } | null>(null);
  const [brushCurr, setBrushCurr] = useState<{ x: number; y: number } | null>(null);

  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const selectTest = usePsiStore((s) => s.selectTest);
  const setCrossFilter = usePsiStore((s) => s.setCrossFilter);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

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

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (viewMode !== 'scatter') return;
    if ((e.target as HTMLElement).dataset.point === 'true') return;
    setPinnedCluster(null);
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

  const xTicks = W < 420 ? [10, 20, 30, 40] : [10, 15, 20, 25, 30, 35, 40, 45];
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8];

  const lunarLabel = `${tStr.ignitionChart.lunarZone} (${tStr.ignitionChart.lunarSpecs})`;
  const lunarDisplayText = narrow ? tStr.ignitionChart.lunarZone : lunarLabel;
  const suitLabel = `↖ ${tStr.ignitionChart.spacesuit}`;
  const earthLabel = tStr.ignitionChart.earthAir;

  const badgeW = (txt: string) => Math.round(txt.length * 5.7 + 14);
  const lunarBW = Math.min(PLOT_W * 0.48, badgeW(lunarDisplayText));
  const suitBW = Math.min(PLOT_W * 0.48, badgeW(suitLabel));
  const earthBW = Math.min(PLOT_W * 0.65, badgeW(earthLabel));

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

  // Active transient tooltip (hover takes precedence unless user clicked to inspect a cluster; never fixed permanently)
  const activeCluster = hoveredCluster ?? pinnedCluster;

  return (
    <ChartCard
      id="ignition-map-card"
      title={tStr.ignitionChart.title}
      subtitle={tStr.ignitionChart.subtitle}
      helpTitle={tStr.ignitionChart.title}
      helpBody={tStr.kpis.lunarBody}
      chartContextPrompt="Explique o Mapa de Ignição atual (pressão vs O₂) destacando a Zona Lunar (O₂ >= 30% e pressão <= 10,2 psi), o Ar da Terra e exemplos reais de Test ID."
      chartContextLabel={tStr.ignitionChart.title}
      legend={legendItems}
      tall={tall}
      className={typo.presentationMode ? 'presentation-focus-card' : ''}
      footer={
        <span>
          {viewMode === 'scatter'
            ? tStr.ignitionChart.hintBrush
            : tStr.ignitionChart.hintCell}
        </span>
      }
      isEmpty={tests.length === 0}
      loading={loading}
      actions={
        <div className="flex items-center rounded-md border border-slate-700 bg-[#0B1020] p-0.5">
          <button
            type="button"
            onClick={() => {
              setViewMode('scatter');
              setHoveredCell(null);
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
              setHoveredCluster(null);
              setPinnedCluster(null);
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
        className="relative h-full w-full select-none overflow-hidden"
        onMouseLeave={() => {
          setHoveredCluster(null);
          setHoveredCell(null);
        }}
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
            setHoveredCluster(null);
            setHoveredCell(null);
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
                y={yPx(o2) + 4}
                textAnchor="end"
                fill={typo.tickColor}
                fontSize={typo.axisFontSize}
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
                y={H - PAD.bottom + typo.axisFontSize + 4}
                textAnchor="middle"
                fill={typo.tickColor}
                fontSize={typo.axisFontSize}
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
            {/* 1. Zona Lunar label on top-left border */}
            <line
              x1={lunarX + Math.min(lunarW / 2, 24)}
              y1={23}
              x2={lunarX + Math.min(lunarW / 2, 24)}
              y2={PAD.top}
              stroke="#34D399"
              strokeOpacity={0.65}
              strokeDasharray="2 2"
            />
            <rect
              x={PAD.left}
              y={4}
              width={lunarBW}
              height={19}
              rx={4}
              fill="#0B1020"
              fillOpacity={0.92}
              stroke="#34D399"
              strokeOpacity={0.55}
            />
            <text
              x={PAD.left + 7}
              y={16.5}
              fill="#6EE7B7"
              fontSize="9.5"
              fontWeight="600"
            >
              {narrow ? tStr.ignitionChart.lunarZone : lunarLabel}
            </text>

            {/* 2. Spacesuit reference label on top border */}
            <rect
              x={narrow ? W - PAD.right - suitBW : PAD.left + lunarBW + 8}
              y={4}
              width={suitBW}
              height={19}
              rx={4}
              fill="#0B1020"
              fillOpacity={0.92}
              stroke="#38BDF8"
              strokeOpacity={0.5}
            />
            <text
              x={(narrow ? W - PAD.right - suitBW : PAD.left + lunarBW + 8) + 7}
              y={16.5}
              fill="#7DD3FC"
              fontSize="9.5"
              fontFamily="IBM Plex Mono, monospace"
            >
              {suitLabel}
            </text>

            {/* 3. Earth Air label fixed on top-right border (or row 2 on narrow screens) */}
            {(() => {
              const ex = narrow ? PAD.left : W - PAD.right - earthBW;
              const ey = narrow ? 26 : 4;
              return (
                <>
                  <line
                    x1={earthX}
                    y1={earthY}
                    x2={ex + earthBW / 2}
                    y2={ey + 19}
                    stroke="#FACC15"
                    strokeOpacity={0.35}
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={ex}
                    y={ey}
                    width={earthBW}
                    height={19}
                    rx={4}
                    fill="#0B1020"
                    fillOpacity={0.92}
                    stroke="#FACC15"
                    strokeOpacity={0.6}
                  />
                  <text
                    x={ex + 7}
                    y={ey + 12.5}
                    fill="#FDE047"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {earthLabel}
                  </text>
                </>
              );
            })()}
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
              return (
                <g
                  key={`cell-${cell.ix}-${cell.iy}`}
                  className={hasTests ? 'cursor-pointer' : ''}
                  onMouseEnter={() =>
                    setHoveredCell({
                      psiLabel: `${formatNumber(cell.psi0, 1, lang)}–${formatNumber(cell.psi1, 1, lang)} psi`,
                      o2Label: `${Math.round(cell.o20 * 100)}–${Math.round(cell.o21 * 100)}% O₂`,
                      total: cell.tests.length,
                      ignited: cell.ignited,
                      coolCount: cell.coolCount,
                      pct: cell.pct,
                    })
                  }
                  onClick={() => {
                    if (cell.tests.length > 0) {
                      setCrossFilter({
                        source: tStr.ignitionChart.heatmap,
                        label: `${cell.tests.length} (${Math.round(cell.o20 * 100)}–${Math.round(cell.o21 * 100)}% O₂)`,
                        testIds: cell.tests.map((t) => t.test_id),
                      });
                    }
                  }}
                >
                  <rect
                    x={x0 + 1}
                    y={y0 + 1}
                    width={Math.max(0, x1 - x0 - 2)}
                    height={Math.max(0, y1 - y0 - 2)}
                    rx={3}
                    fill={fill}
                    stroke={hasTests ? 'rgba(148,163,184,0.32)' : 'rgba(30,41,59,0.4)'}
                  />
                  {hasTests && x1 - x0 > 36 && (
                    <text
                      x={(x0 + x1) / 2}
                      y={(y0 + y1) / 2 + 3}
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="10"
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
              const count = cluster.tests.length;
              const r = isSelected ? 6.4 : 5.4;

              const commonProps = {
                'data-point': 'true',
                className: 'cursor-pointer transition-opacity',
                onMouseEnter: () => setHoveredCluster(cluster),
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (count === 1) {
                    setPinnedCluster(null);
                    selectTest(t.test_id, true);
                  } else {
                    setPinnedCluster((prev) =>
                      prev?.id === cluster.id ? null : cluster
                    );
                  }
                },
              };

              let shape: React.ReactNode;
              if (t.cool_flame || t.ignition_type === 'cool') {
                const d = r + 0.6;
                shape = (
                  <polygon
                    {...commonProps}
                    points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
                    fill={color}
                    fillOpacity={0.92}
                    stroke={isSelected ? '#FFFFFF' : '#0B1020'}
                    strokeWidth={isSelected ? 1.8 : 1}
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
                    stroke={isSelected ? '#FFFFFF' : '#0B1020'}
                    strokeWidth={isSelected ? 1.8 : 1}
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
                      stroke={isSelected ? '#FFFFFF' : '#0B1020'}
                      strokeWidth={isSelected ? 1.8 : 1}
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
                    stroke={isSelected ? '#FFFFFF' : '#0B1020'}
                    strokeWidth={isSelected ? 1.8 : 1}
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
            y={H - 8}
            textAnchor="middle"
            fill={typo.tickColor}
            fontSize={typo.axisTitleSize}
          >
            {W < 400 ? tStr.ignitionChart.xAxisShort : tStr.ignitionChart.xAxis}
          </text>
          <text
            x={16}
            y={PAD.top + PLOT_H / 2}
            textAnchor="middle"
            fill={typo.tickColor}
            fontSize={typo.axisTitleSize}
            transform={`rotate(-90 16 ${PAD.top + PLOT_H / 2})`}
          >
            {tStr.ignitionChart.yAxis}
          </text>
        </svg>

        {/* Transient Tooltip (ONLY visible on hover or click, never fixed) */}
        {activeCluster && viewMode === 'scatter' && (
          <div
            style={{
              zIndex: 'var(--z-tooltip)',
              left: `${Math.max(8, Math.min(W - 242, activeCluster.cx + 12))}px`,
              top: `${Math.max(8, Math.min(H - 150, activeCluster.cy - 18))}px`,
            }}
            className={`${
              pinnedCluster && !hoveredCluster ? 'pointer-events-auto' : 'pointer-events-none'
            } absolute w-58 rounded-lg border border-slate-700 bg-[#0B1020]/96 p-2.5 text-[11px] shadow-xl shadow-black/75`}
          >
            {activeCluster.tests.length === 1 ? (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                  <span className="font-mono font-bold text-cyan-300">
                    {activeCluster.rep.test_id}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {fuelLabel(activeCluster.rep.fuel, lang)} ·{' '}
                    {flameTypeLabel(activeCluster.rep.flame_type, lang)}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[10px] tabular-nums text-slate-200">
                  <span>O₂: {Math.round(activeCluster.rep.o2_fraction * 100)}%</span>
                  <span>
                    P: {formatNumber(activeCluster.rep.pressure_psi, 2, lang)} psi
                  </span>
                  <span>
                    {activeCluster.rep.burn_time_s !== null
                      ? `${formatNumber(activeCluster.rep.burn_time_s, 1, lang)} s`
                      : '—'}
                  </span>
                  <span>
                    {activeCluster.rep.peak_burner_temp_c !== null
                      ? `${formatNumber(activeCluster.rep.peak_burner_temp_c, 0, lang)} °C`
                      : '—'}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span
                    className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] ${outcomeMeta(activeCluster.rep.outcome, lang).badgeClass}`}
                  >
                    {outcomeMeta(activeCluster.rep.outcome, lang).glyph}{' '}
                    {outcomeMeta(activeCluster.rep.outcome, lang).label}
                  </span>
                  {isInLunarZone(activeCluster.rep) && (
                    <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">
                      {tStr.ignitionChart.lunarZone}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                  <span className="font-mono font-bold text-cyan-300">
                    {activeCluster.tests.length} ensaios ·{' '}
                    {Math.round(activeCluster.rep.o2_fraction * 100)}% O₂ ·{' '}
                    {formatNumber(activeCluster.rep.pressure_psi, 1, lang)} psi
                  </span>
                </div>
                <div className="mt-1.5 max-h-28 space-y-1 overflow-y-auto pr-1">
                  {activeCluster.tests.slice(0, 6).map((item) => (
                    <button
                      key={item.test_id}
                      type="button"
                      onClick={() => {
                        setPinnedCluster(null);
                        selectTest(item.test_id, true);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded bg-slate-900/90 px-1.5 py-1 text-left text-[10px] hover:bg-slate-800"
                    >
                      <span className="font-mono font-semibold text-cyan-300">
                        {item.test_id}
                      </span>
                      <span className="text-slate-300">
                        {fuelLabel(item.fuel, lang)} ·{' '}
                        {flameTypeLabel(item.flame_type, lang)}
                      </span>
                    </button>
                  ))}
                  {activeCluster.tests.length > 6 && (
                    <div className="text-[10px] text-slate-300">
                      +{activeCluster.tests.length - 6} mais nesta posição
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {hoveredCell && viewMode === 'heatmap' && (
          <div
            style={{ zIndex: 'var(--z-tooltip)' }}
            className="pointer-events-none absolute right-2 top-2 w-52 rounded-lg border border-slate-700 bg-[#0B1020]/95 p-2.5 text-[11px] shadow-xl"
          >
            <div className="font-mono font-semibold text-cyan-300">
              {hoveredCell.o2Label} · {hoveredCell.psiLabel}
            </div>
            <div className="mt-1 space-y-0.5 text-slate-200">
              <div>
                {tStr.coolMatrix.tests}:{' '}
                <strong className="font-mono">{hoveredCell.total}</strong>
              </div>
              <div>
                {hoveredCell.ignited} ({formatNumber(hoveredCell.pct, 0, lang)}%)
              </div>
              {hoveredCell.coolCount > 0 && (
                <div className="text-purple-300">
                  ◆ <strong className="font-mono">{hoveredCell.coolCount}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
};
