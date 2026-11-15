import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from 'lucide-react';
import { usePsiStore } from '../../store/usePsiStore';
import type { Psi159Test } from '../../types/psi159';
import { isInLunarZone } from '../../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
} from '../../utils/formatters';
import { useStrings } from '../../utils/i18n';
import { ChartCard } from '../ChartCard';
import { InfoTooltip } from '../InfoTooltip';

interface ExploreTestsTableProps {
  tests: Psi159Test[];
  loading?: boolean;
}

type SortKey =
  | 'test_id'
  | 'day'
  | 'fuel'
  | 'flame_type'
  | 'o2_fraction'
  | 'pressure_psi'
  | 'hc_flow_mg_s'
  | 'burn_time_s'
  | 'peak_burner_temp_c'
  | 'outcome';

const PAGE_SIZE = 18;

export const ExploreTestsTable: React.FC<ExploreTestsTableProps> = ({
  tests,
  loading = false,
}) => {
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const selectTest = usePsiStore((s) => s.selectTest);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('day');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tests;
    return tests.filter(
      (t) =>
        t.test_id.toLowerCase().includes(q) ||
        fuelLabel(t.fuel, lang).toLowerCase().includes(q) ||
        (t.comments ?? '').toLowerCase().includes(q) ||
        (t.cool_flame_code ?? '').toLowerCase().includes(q) ||
        outcomeMeta(t.outcome, lang).label.toLowerCase().includes(q)
    );
  }, [tests, query, lang]);

  const sorted = useMemo(() => {
    const copy = [...searched];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [searched, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleExportCsv = () => {
    if (sorted.length === 0) return;
    const headers = [
      'test_id',
      'day',
      'fuel',
      'flame_type',
      'o2_fraction',
      'pressure_psi',
      'pressure_bar',
      'hc_flow_mg_s',
      'burn_time_s',
      'peak_burner_temp_c',
      'cool_flame',
      'cool_flame_code',
      'hit_burner_temp_limit',
      'outcome',
      'comments',
    ];
    const escape = (val: unknown) => {
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const lines = [
      headers.join(','),
      ...sorted.map((t) =>
        headers.map((h) => escape(t[h as keyof Psi159Test])).join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `psi159_ensaios_filtrados_${sorted.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTh = (
    label: string,
    key: SortKey,
    minW: string,
    right = false,
    tooltipTerm?: string
  ) => (
    <th className={`${minW} px-2 py-2 ${right ? 'text-right' : 'text-left'}`}>
      <span
        className={`inline-flex items-center gap-1 ${
          right ? 'justify-end' : 'justify-start'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider transition-colors hover:text-cyan-300 ${
            sortKey === key ? 'text-cyan-300' : 'text-[#B4C3D8]'
          }`}
        >
          <span>{label}</span>
          <ArrowDownUp className="h-2.5 w-2.5 shrink-0" />
        </button>
        {tooltipTerm && <InfoTooltip term={tooltipTerm} labelOverride={label} />}
      </span>
    </th>
  );

  return (
    <ChartCard
      title={tStr.table.title}
      subtitle={`${sorted.length} ${tStr.coolMatrix.tests.toLowerCase()}`}
      isEmpty={tests.length === 0}
      loading={loading}
      plotAutoHeight
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span className="font-mono tabular-nums">
            {tStr.table.pageOf(safePage, totalPages, sorted.length)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500/40 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {tStr.table.prev}
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500/40 disabled:opacity-40"
            >
              {tStr.table.next}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={tStr.table.searchPlaceholder}
              aria-label={tStr.table.searchPlaceholder}
              className="min-h-[28px] w-40 rounded-md border border-slate-700 bg-[#0B1020] py-1 pl-7 pr-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none min-[420px]:w-44 sm:w-56"
            />
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sorted.length === 0}
            className="inline-flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span>{tStr.table.exportCsv}</span>
          </button>
        </div>
      }
    >
      <div className="max-h-[540px] overflow-auto rounded-lg border border-slate-800/70">
        <table className="w-full min-w-[920px] border-collapse text-xs">
          <thead
            style={{ zIndex: 'var(--z-sticky)' }}
            className="sticky top-0 bg-[#0F172A] shadow-xs"
          >
            <tr className="border-b border-slate-800">
              {renderTh(tStr.table.colId, 'test_id', 'min-w-[130px]')}
              {renderTh(tStr.table.colDay, 'day', 'min-w-[55px]', true)}
              {renderTh(tStr.table.colGas, 'fuel', 'min-w-[85px]')}
              {renderTh(tStr.table.colFlame, 'flame_type', 'min-w-[100px]', false, 'flame_type')}
              {renderTh(tStr.table.colO2, 'o2_fraction', 'min-w-[80px]', true, 'o2_fraction')}
              {renderTh(tStr.table.colPsi, 'pressure_psi', 'min-w-[105px]', true, 'pressure_psi')}
              {renderTh(tStr.table.colFlow, 'hc_flow_mg_s', 'min-w-[90px]', true, 'hc_flow_mg_s')}
              {renderTh(tStr.table.colBurn, 'burn_time_s', 'min-w-[95px]', true, 'burn_time_s')}
              {renderTh(tStr.table.colPeak, 'peak_burner_temp_c', 'min-w-[95px]', true, 'peak_burner_temp_c')}
              {renderTh(tStr.table.colOutcome, 'outcome', 'min-w-[190px]', false, 'outcome')}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  {tStr.chartCard.emptyTitle}
                </td>
              </tr>
            ) : (
              pageRows.map((t) => {
                const meta = outcomeMeta(t.outcome, lang);
                const isSel = t.test_id === selectedTestId;
                const lunar = isInLunarZone(t);
                return (
                  <tr
                    key={t.test_id}
                    onClick={() => selectTest(t.test_id, true)}
                    className={`cursor-pointer transition-colors ${
                      isSel ? 'bg-cyan-500/15' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <span className="whitespace-nowrap">{t.test_id}</span>
                        {lunar && (
                          <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1 text-[9px] text-emerald-300">
                            LUNAR
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-slate-300">
                      {t.day}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-slate-200">
                      {fuelLabel(t.fuel, lang)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">
                      <span
                        className={
                          t.flame_type === 'inverse'
                            ? 'text-orange-300'
                            : 'text-cyan-300'
                        }
                      >
                        {flameTypeLabel(t.flame_type, lang)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums text-slate-200">
                      {Math.round(t.o2_fraction * 100)}%
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums text-slate-200">
                      {formatNumber(t.pressure_psi, 2, lang)} psi
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums text-slate-300">
                      {formatNumber(t.hc_flow_mg_s, 3, lang)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums text-slate-200">
                      {t.burn_time_s !== null
                        ? `${formatNumber(t.burn_time_s, 1, lang)} s`
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right font-mono tabular-nums text-slate-200">
                      {t.peak_burner_temp_c !== null ? (
                        <span
                          className={
                            t.hit_burner_temp_limit
                              ? 'font-semibold text-red-300'
                              : ''
                          }
                        >
                          {formatNumber(t.peak_burner_temp_c, 1, lang)}
                          {t.hit_burner_temp_limit ? ' ▲' : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium ${meta.badgeClass}`}
                        >
                          <span>{meta.glyph}</span>
                          <span>{meta.label}</span>
                        </span>
                        {t.cool_flame && (
                          <span className="whitespace-nowrap rounded border border-purple-400/40 bg-purple-500/15 px-1.5 py-0.5 font-mono text-[10px] text-purple-200">
                            ◆ {t.cool_flame_code ?? 'Cool'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
};
