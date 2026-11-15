import React, { useMemo, useRef } from 'react';
import { Flame } from 'lucide-react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { ChartCard } from '../ChartCard';
import { PointTooltipPopover, useClusterTooltip } from '../PointTooltipPopover';

interface CoolFlameMatrixProps {
  tests: Psi159Test[];
  loading?: boolean;
}

const PCI_CODES = ['PCI-A', 'PCI-B', 'PCI-C', 'PCI-D', 'PCI-E', 'PCI-F', 'PCI-G'];

export const CoolFlameMatrix: React.FC<CoolFlameMatrixProps> = ({
  tests,
  loading = false,
}) => {
  const selectTest = usePsiStore((s) => s.selectTest);
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const lastPointerTypeRef = useRef<string>('mouse');

  type CoolRow = {
    code: string;
    label: string;
    matching: Psi159Test[];
    avgO2: number;
    avgPsi: number;
    fuels: string;
    flameTypes: string;
  };
  const rowTooltip = useClusterTooltip<CoolRow>((r) => r.code);

  const rows = useMemo(() => {
    const list: Array<{
      code: string;
      label: string;
      matching: Psi159Test[];
      avgO2: number;
      avgPsi: number;
      fuels: string;
      flameTypes: string;
    }> = [];

    for (const code of PCI_CODES) {
      const matching = tests.filter((t) => t.cool_flame_code === code);
      list.push({
        code,
        label: code,
        matching,
        avgO2:
          matching.length > 0
            ? matching.reduce((s, t) => s + t.o2_fraction, 0) / matching.length
            : 0,
        avgPsi:
          matching.length > 0
            ? matching.reduce((s, t) => s + t.pressure_psi, 0) / matching.length
            : 0,
        fuels:
          [...new Set(matching.map((m) => fuelLabel(m.fuel, lang)))].join(', ') || '—',
        flameTypes:
          [...new Set(matching.map((m) => flameTypeLabel(m.flame_type, lang)))].join(
            ', '
          ) || '—',
      });
    }

    const directOnly = tests.filter(
      (t) => t.cool_flame && (!t.cool_flame_code || t.cool_flame_code.trim() === '')
    );
    if (directOnly.length > 0 || tests.some((t) => t.cool_flame)) {
      list.push({
        code: 'DIRETA',
        label: tStr.coolMatrix.directNoCode,
        matching: directOnly,
        avgO2:
          directOnly.length > 0
            ? directOnly.reduce((s, t) => s + t.o2_fraction, 0) / directOnly.length
            : 0,
        avgPsi:
          directOnly.length > 0
            ? directOnly.reduce((s, t) => s + t.pressure_psi, 0) / directOnly.length
            : 0,
        fuels:
          [...new Set(directOnly.map((m) => fuelLabel(m.fuel, lang)))].join(', ') ||
          '—',
        flameTypes:
          [...new Set(directOnly.map((m) => flameTypeLabel(m.flame_type, lang)))].join(
            ', '
          ) || '—',
      });
    }

    return list;
  }, [tests, lang, tStr]);

  const totalCool = rows.reduce((s, r) => s + r.matching.length, 0);

  return (
    <ChartCard
      title={tStr.coolMatrix.title}
      subtitle={`${totalCool} ${tStr.coolMatrix.occurrences}`}
      helpTitle={tStr.coolMatrix.title}
      helpBody={`${tStr.kpis.coolBody} ${tStr.coolMatrix.helpTip}`}
      chartContextPrompt={tStr.prompts.explainCoolMatrix}
      chartContextLabel={tStr.coolMatrix.title}
      isEmpty={tests.length === 0}
      loading={loading}
      plotAutoHeight
    >
      <div className="max-h-[420px] overflow-auto">
        <table className="chart-text-tick w-full min-w-[700px] border-collapse text-left">
          <thead
            style={{ zIndex: 'var(--z-sticky)' }}
            className="sticky top-0 bg-[#0F172A]"
          >
            <tr className="border-b border-slate-800 font-semibold uppercase tracking-wider text-slate-400">
              <th className="min-w-[140px] py-2 pr-3">{tStr.coolMatrix.code}</th>
              <th className="min-w-[65px] py-2 px-2 text-center">
                {tStr.coolMatrix.tests}
              </th>
              <th className="min-w-[90px] py-2 px-2">{tStr.coolMatrix.gas}</th>
              <th className="min-w-[85px] py-2 px-2">{tStr.coolMatrix.flame}</th>
              <th className="min-w-[85px] py-2 px-2 font-mono">
                {tStr.coolMatrix.typicalO2}
              </th>
              <th className="min-w-[100px] py-2 px-2 font-mono">
                {tStr.coolMatrix.typicalPsi}
              </th>
              <th className="min-w-[150px] py-2 pl-2">Test IDs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {rows.map((row) => {
              const count = row.matching.length;
              const heatAlpha = Math.min(0.42, count * 0.16);
              return (
                <tr
                  key={row.code}
                  style={{
                    backgroundColor:
                      count > 0 ? `rgba(168, 85, 247, ${heatAlpha})` : 'transparent',
                  }}
                  className="transition-colors hover:bg-purple-500/15"
                >
                  <td className="py-2 pr-3 font-mono font-semibold text-purple-200">
                    <span className="inline-flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                      <span className="wrap-anywhere">{row.label}</span>
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold tabular-nums text-slate-100">
                    {count > 0 ? (
                      <button
                        type="button"
                        data-point-trigger="true"
                        onMouseEnter={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          rowTooltip.onPointEnter(row, {
                            x: r.left + r.width / 2,
                            y: r.top + r.height / 2,
                            width: r.width,
                            height: r.height,
                          });
                        }}
                        onMouseLeave={() => rowTooltip.onPointLeave()}
                        onPointerDown={(e) => {
                          lastPointerTypeRef.current = e.pointerType;
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (count === 1) {
                            rowTooltip.closeAll();
                            selectTest(row.matching[0].test_id, true);
                          } else {
                            const r = e.currentTarget.getBoundingClientRect();
                            rowTooltip.onPointClick(
                              row,
                              {
                                x: r.left + r.width / 2,
                                y: r.top + r.height / 2,
                                width: r.width,
                                height: r.height,
                              },
                              row.code,
                              lastPointerTypeRef.current
                            );
                          }
                        }}
                        className="inline-flex min-h-[26px] min-w-[32px] cursor-pointer items-center justify-center rounded-md border border-purple-400/45 bg-purple-500/20 px-2 py-0.5 font-mono font-bold text-purple-100 transition-colors hover:border-cyan-400/60 hover:bg-purple-500/35 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        {count}
                      </button>
                    ) : (
                      <span>0</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-slate-200">{row.fuels}</td>
                  <td className="py-2 px-2 text-slate-300">{row.flameTypes}</td>
                  <td className="py-2 px-2 font-mono tabular-nums text-cyan-300">
                    {count > 0 ? `${Math.round(row.avgO2 * 100)}%` : '—'}
                  </td>
                  <td className="py-2 px-2 font-mono tabular-nums text-slate-200">
                    {count > 0 ? `${formatNumber(row.avgPsi, 1, lang)} psi` : '—'}
                  </td>
                  <td className="py-2 pl-2">
                    {count === 0 ? (
                      <span className="text-slate-500">
                        {tStr.coolMatrix.noneInFilter}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.matching.map((m) => (
                          <button
                            key={m.test_id}
                            type="button"
                            onClick={() => selectTest(m.test_id, true)}
                            className={`cursor-pointer whitespace-nowrap rounded border px-1.5 py-0.5 font-mono transition-colors ${
                              m.test_id === selectedTestId
                                ? 'border-white bg-purple-500/40 text-white'
                                : 'border-purple-400/40 bg-[#0B1020]/70 text-purple-200 hover:border-cyan-400/60 hover:text-white'
                            }`}
                            title={`${tStr.chartCard.clickToOpenTest} · ${outcomeMeta(m.outcome, lang).label} · ${formatNumber(m.peak_burner_temp_c, 1, lang)} °C`}
                          >
                            {m.test_id}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PointTooltipPopover
        open={Boolean(rowTooltip.active)}
        pinned={rowTooltip.isPinned}
        anchor={rowTooltip.active?.anchor ?? null}
        tests={rowTooltip.active?.data.matching ?? []}
        headerSummary={
          rowTooltip.active && rowTooltip.active.data.matching.length > 1
            ? `${rowTooltip.active.data.label} · ${tStr.pointPopover.testsCount(
                rowTooltip.active.data.matching.length
              )} · ~${Math.round(rowTooltip.active.data.avgO2 * 100)}% O₂`
            : undefined
        }
        onPointerEnterPopover={rowTooltip.onPopoverEnter}
        onPointerLeavePopover={rowTooltip.onPopoverLeave}
        onPin={rowTooltip.pinActive}
        onClose={rowTooltip.closeAll}
      />
    </ChartCard>
  );
};
