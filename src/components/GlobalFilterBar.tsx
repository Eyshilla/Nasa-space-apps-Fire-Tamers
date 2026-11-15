import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Filter, Flame, RotateCcw, X } from 'lucide-react';
import {
  DEFAULT_FILTERS,
  DEFAULT_O2_RANGE,
  DEFAULT_PSI_RANGE,
  usePsiStore,
} from '../store/usePsiStore';
import type { GlobalFilters } from '../types/psi159';
import { applyGlobalFilters } from '../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
} from '../utils/formatters';
import { useStrings } from '../utils/i18n';
import { InfoTooltip } from './InfoTooltip';

const FUELS = ['ethane', 'propane', 'butane'] as const;
const OUTCOMES = [
  'self_extinguished',
  'flow_terminated',
  'no_ignition',
  'flash_only',
  'cool_flame_only',
] as const;

interface GlobalFilterBarProps {
  mode: 'mobile' | 'desktop';
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ mode }) => {
  const tests = usePsiStore((s) => s.tests);
  const filters = usePsiStore((s) => s.filters);
  const lang = usePsiStore((s) => s.lang);
  const filterSheetOpen = usePsiStore((s) => s.filterSheetOpen);
  const setFilterSheetOpen = usePsiStore((s) => s.setFilterSheetOpen);
  const t = useStrings(lang);

  const toggleFuel = usePsiStore((s) => s.toggleFuel);
  const toggleFlameType = usePsiStore((s) => s.toggleFlameType);
  const setO2Range = usePsiStore((s) => s.setO2Range);
  const setPsiRange = usePsiStore((s) => s.setPsiRange);
  const toggleOutcome = usePsiStore((s) => s.toggleOutcome);
  const setOnlyCoolFlames = usePsiStore((s) => s.setOnlyCoolFlames);
  const setCrossFilter = usePsiStore((s) => s.setCrossFilter);
  const setFilters = usePsiStore((s) => s.setFilters);
  const clearAllFilters = usePsiStore((s) => s.clearAllFilters);

  const [outcomeMenuOpen, setOutcomeMenuOpen] = useState(false);
  const [outcomePos, setOutcomePos] = useState<{ top: number; left: number }>({
    top: 96,
    left: 16,
  });
  const outcomeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Staged draft state for the mobile bottom sheet
  const [draft, setDraft] = useState<GlobalFilters>(filters);

  useEffect(() => {
    if (filterSheetOpen) {
      setDraft(filters);
    }
  }, [filterSheetOpen, filters]);

  // Body scroll lock & Escape handler while mobile bottom sheet is open
  useEffect(() => {
    if (mode !== 'mobile' || !filterSheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFilterSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mode, filterSheetOpen, setFilterSheetOpen]);

  const filteredCount = useMemo(
    () => applyGlobalFilters(tests, filters).length,
    [tests, filters]
  );

  const draftPreviewCount = useMemo(
    () => applyGlobalFilters(tests, draft).length,
    [tests, draft]
  );

  const o2Changed =
    Math.abs(filters.o2Range[0] - DEFAULT_O2_RANGE[0]) > 0.005 ||
    Math.abs(filters.o2Range[1] - DEFAULT_O2_RANGE[1]) > 0.005;
  const psiChanged =
    Math.abs(filters.psiRange[0] - DEFAULT_PSI_RANGE[0]) > 0.1 ||
    Math.abs(filters.psiRange[1] - DEFAULT_PSI_RANGE[1]) > 0.1;

  const hasActiveFilters =
    filters.fuels.length > 0 ||
    filters.flameTypes.length > 0 ||
    o2Changed ||
    psiChanged ||
    filters.outcomes.length > 0 ||
    filters.onlyCoolFlames ||
    filters.crossFilter !== null;

  const activeFilterCount =
    filters.fuels.length +
    filters.flameTypes.length +
    (o2Changed ? 1 : 0) +
    (psiChanged ? 1 : 0) +
    filters.outcomes.length +
    (filters.onlyCoolFlames ? 1 : 0) +
    (filters.crossFilter ? 1 : 0);

  const labels = {
    filtersBtn: lang === 'en' ? 'Filters' : lang === 'es' ? 'Filtros' : 'Filtros',
    clearShort: lang === 'en' ? 'Clear' : lang === 'es' ? 'Limpiar' : 'Limpar',
    applyBtn: lang === 'en' ? 'Apply' : lang === 'es' ? 'Aplicar' : 'Aplicar',
    sheetTitle:
      lang === 'en'
        ? 'Filter Experiments'
        : lang === 'es'
          ? 'Filtrar Ensayos'
          : 'Filtrar Ensaios',
    closeLabel: lang === 'en' ? 'Close' : lang === 'es' ? 'Cerrar' : 'Fechar',
  };

  const renderActiveChipsRow = (extraClass = '') => {
    if (!hasActiveFilters) return null;
    return (
      <div
        className={`no-scrollbar flex flex-nowrap items-center gap-1.5 overflow-x-auto ${extraClass}`}
      >
        <span className="shrink-0 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {t.filters.active}
        </span>
        {filters.fuels.map((f) => (
          <button
            key={`chip-fuel-${f}`}
            type="button"
            onClick={() => toggleFuel(f)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200 hover:bg-cyan-500/20"
          >
            {fuelLabel(f, lang)} <X className="h-2.5 w-2.5 shrink-0" />
          </button>
        ))}
        {filters.flameTypes.map((ft) => (
          <button
            key={`chip-ft-${ft}`}
            type="button"
            onClick={() => toggleFlameType(ft)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-200 hover:bg-orange-500/20"
          >
            {flameTypeLabel(ft, lang)} <X className="h-2.5 w-2.5 shrink-0" />
          </button>
        ))}
        {o2Changed && (
          <button
            type="button"
            onClick={() => setO2Range(DEFAULT_O2_RANGE)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200 hover:bg-cyan-500/20"
          >
            O₂ {Math.round(filters.o2Range[0] * 100)}–
            {Math.round(filters.o2Range[1] * 100)}%{' '}
            <X className="h-2.5 w-2.5 shrink-0" />
          </button>
        )}
        {psiChanged && (
          <button
            type="button"
            onClick={() => setPsiRange(DEFAULT_PSI_RANGE)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[10px] text-sky-200 hover:bg-sky-500/20"
          >
            P {formatNumber(filters.psiRange[0], 1, lang)}–
            {formatNumber(filters.psiRange[1], 1, lang)} psi{' '}
            <X className="h-2.5 w-2.5 shrink-0" />
          </button>
        )}
        {filters.outcomes.map((o) => (
          <button
            key={`chip-out-${o}`}
            type="button"
            onClick={() => toggleOutcome(o)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700"
          >
            {outcomeMeta(o, lang).label} <X className="h-2.5 w-2.5 shrink-0" />
          </button>
        ))}
        {filters.onlyCoolFlames && (
          <button
            type="button"
            onClick={() => setOnlyCoolFlames(false)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-purple-500/40 bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-200 hover:bg-purple-500/25"
          >
            {t.filters.onlyCoolFlames} <X className="h-2.5 w-2.5 shrink-0" />
          </button>
        )}
        {filters.crossFilter && (
          <button
            type="button"
            onClick={() => setCrossFilter(null)}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-500/25"
          >
            {filters.crossFilter.source}: {filters.crossFilter.label}{' '}
            <X className="h-2.5 w-2.5 shrink-0" />
          </button>
        )}
      </div>
    );
  };

  /* ======================== MOBILE MODE (<= 768px, non-sticky in-flow) ======================== */
  if (mode === 'mobile') {
    const dO2MinPct =
      ((draft.o2Range[0] - DEFAULT_O2_RANGE[0]) /
        (DEFAULT_O2_RANGE[1] - DEFAULT_O2_RANGE[0])) *
      100;
    const dO2MaxPct =
      ((draft.o2Range[1] - DEFAULT_O2_RANGE[0]) /
        (DEFAULT_O2_RANGE[1] - DEFAULT_O2_RANGE[0])) *
      100;
    const dPsiMinPct =
      ((draft.psiRange[0] - DEFAULT_PSI_RANGE[0]) /
        (DEFAULT_PSI_RANGE[1] - DEFAULT_PSI_RANGE[0])) *
      100;
    const dPsiMaxPct =
      ((draft.psiRange[1] - DEFAULT_PSI_RANGE[0]) /
        (DEFAULT_PSI_RANGE[1] - DEFAULT_PSI_RANGE[0])) *
      100;

    return (
      <>
        <section
          aria-label="Filtros globais"
          className="rounded-xl border border-slate-800/90 bg-[#0F1629] px-2.5 py-1"
        >
          {/* Compact row (max-h 48px): Filtros (N) | X de 333 ensaios | Limpar */}
          <div className="flex h-[38px] max-h-[48px] items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              aria-expanded={filterSheetOpen}
              className={`inline-flex min-h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilterCount > 0
                  ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-700 bg-slate-800/80 text-slate-100'
              }`}
            >
              <Filter className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span>
                {labels.filtersBtn}
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </span>
            </button>

            <span className="truncate font-mono text-[11px] font-semibold tabular-nums text-slate-200">
              {t.filters.testsOf(filteredCount, tests.length || 333)}
            </span>

            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`inline-flex min-h-[28px] shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                hasActiveFilters
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-red-400/40 hover:text-red-200'
                  : 'cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-600'
              }`}
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              <span>{labels.clearShort}</span>
            </button>
          </div>

          {/* Single-line horizontally scrollable active filter chips */}
          {renderActiveChipsRow('border-t border-slate-800/70 py-1')}
        </section>

        {/* Bottom Sheet Modal (<= 85dvh, internal scroll, fixed footer, safe-area aware) */}
        {filterSheetOpen && (
          <>
            <div
              style={{ zIndex: 'var(--z-modal)' }}
              className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
              onClick={() => setFilterSheetOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={labels.sheetTitle}
              style={{ zIndex: 'calc(var(--z-modal) + 1)' }}
              className="fixed inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-slate-700 bg-[#0F172A] shadow-2xl shadow-black"
            >
              {/* Drag handle + Sheet Header */}
              <div className="shrink-0 border-b border-slate-800 px-4 pb-2.5 pt-2">
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-600" />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-cyan-300" />
                    <h2 className="text-sm font-bold text-slate-100">
                      {labels.sheetTitle}
                    </h2>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200">
                      {t.filters.testsOf(draftPreviewCount, tests.length || 333)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterSheetOpen(false)}
                    aria-label={labels.closeLabel}
                    className="flex min-h-[30px] min-w-[30px] items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Controls */}
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
                {/* Gas */}
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {t.filters.gas}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FUELS.map((fuel) => {
                      const active = draft.fuels.includes(fuel);
                      return (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              fuels: active
                                ? d.fuels.filter((f) => f !== fuel)
                                : [...d.fuels, fuel],
                            }))
                          }
                          aria-pressed={active}
                          className={`min-h-[32px] whitespace-nowrap rounded-lg border px-3 py-1 text-xs font-medium ${
                            active
                              ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                              : 'border-slate-700 bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          {fuelLabel(fuel, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Flame type */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#B4C3D8]">
                    <span>{t.filters.flame}</span>
                    <InfoTooltip term="flame_type" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['normal', 'inverse'] as const).map((ft) => {
                      const active = draft.flameTypes.includes(ft);
                      const activeStyle =
                        ft === 'normal'
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                          : 'border-orange-400/60 bg-orange-500/20 text-orange-200';
                      return (
                        <button
                          key={ft}
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              flameTypes: active
                                ? d.flameTypes.filter((f) => f !== ft)
                                : [...d.flameTypes, ft],
                            }))
                          }
                          aria-pressed={active}
                          className={`min-h-[32px] whitespace-nowrap rounded-lg border px-3 py-1 text-xs font-medium ${
                            active
                              ? activeStyle
                              : 'border-slate-700 bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          {flameTypeLabel(ft, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* O2 Dual Slider */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-[#B4C3D8]">
                      <span>{t.filters.o2}</span>
                      <InfoTooltip term="o2_fraction" />
                    </span>
                    <span className="font-mono font-semibold text-cyan-200">
                      {Math.round(draft.o2Range[0] * 100)}–
                      {Math.round(draft.o2Range[1] * 100)}%
                    </span>
                  </div>
                  <div className="relative flex min-h-[26px] w-full items-center">
                    <div className="h-1.5 w-full rounded-full bg-slate-700" />
                    <div
                      className="absolute h-1.5 rounded-full bg-cyan-400"
                      style={{
                        left: `${dO2MinPct}%`,
                        width: `${Math.max(0, dO2MaxPct - dO2MinPct)}%`,
                      }}
                    />
                    <input
                      type="range"
                      aria-label="Fração mínima de O2"
                      min={DEFAULT_O2_RANGE[0]}
                      max={DEFAULT_O2_RANGE[1]}
                      step={0.01}
                      value={draft.o2Range[0]}
                      onChange={(e) => {
                        const val = Math.min(
                          Number(e.target.value),
                          draft.o2Range[1] - 0.01
                        );
                        setDraft((d) => ({
                          ...d,
                          o2Range: [Number(val.toFixed(2)), d.o2Range[1]],
                        }));
                      }}
                      className="psi-range absolute inset-0 w-full"
                    />
                    <input
                      type="range"
                      aria-label="Fração máxima de O2"
                      min={DEFAULT_O2_RANGE[0]}
                      max={DEFAULT_O2_RANGE[1]}
                      step={0.01}
                      value={draft.o2Range[1]}
                      onChange={(e) => {
                        const val = Math.max(
                          Number(e.target.value),
                          draft.o2Range[0] + 0.01
                        );
                        setDraft((d) => ({
                          ...d,
                          o2Range: [d.o2Range[0], Number(val.toFixed(2))],
                        }));
                      }}
                      className="psi-range absolute inset-0 w-full"
                    />
                  </div>
                </div>

                {/* Pressure Dual Slider */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-[#B4C3D8]">
                      <span>{t.filters.pressure}</span>
                      <InfoTooltip term="pressure_psi" />
                    </span>
                    <span className="font-mono font-semibold text-sky-200">
                      {formatNumber(draft.psiRange[0], 1, lang)}–
                      {formatNumber(draft.psiRange[1], 1, lang)} psi
                    </span>
                  </div>
                  <div className="relative flex min-h-[26px] w-full items-center">
                    <div className="h-1.5 w-full rounded-full bg-slate-700" />
                    <div
                      className="absolute h-1.5 rounded-full bg-sky-400"
                      style={{
                        left: `${dPsiMinPct}%`,
                        width: `${Math.max(0, dPsiMaxPct - dPsiMinPct)}%`,
                      }}
                    />
                    <input
                      type="range"
                      aria-label="Pressão mínima em psi"
                      min={DEFAULT_PSI_RANGE[0]}
                      max={DEFAULT_PSI_RANGE[1]}
                      step={0.1}
                      value={draft.psiRange[0]}
                      onChange={(e) => {
                        const val = Math.min(
                          Number(e.target.value),
                          draft.psiRange[1] - 0.5
                        );
                        setDraft((d) => ({
                          ...d,
                          psiRange: [Number(val.toFixed(2)), d.psiRange[1]],
                        }));
                      }}
                      className="psi-range absolute inset-0 w-full"
                    />
                    <input
                      type="range"
                      aria-label="Pressão máxima em psi"
                      min={DEFAULT_PSI_RANGE[0]}
                      max={DEFAULT_PSI_RANGE[1]}
                      step={0.1}
                      value={draft.psiRange[1]}
                      onChange={(e) => {
                        const val = Math.max(
                          Number(e.target.value),
                          draft.psiRange[0] + 0.5
                        );
                        setDraft((d) => ({
                          ...d,
                          psiRange: [d.psiRange[0], Number(val.toFixed(2))],
                        }));
                      }}
                      className="psi-range absolute inset-0 w-full"
                    />
                  </div>
                </div>

                {/* Outcomes */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#B4C3D8]">
                    <span>{t.filters.outcomeHeader}</span>
                    <InfoTooltip term="outcome" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {OUTCOMES.map((out) => {
                      const meta = outcomeMeta(out, lang);
                      const checked = draft.outcomes.includes(out);
                      return (
                        <button
                          key={out}
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              outcomes: checked
                                ? d.outcomes.filter((o) => o !== out)
                                : [...d.outcomes, out],
                            }))
                          }
                          aria-pressed={checked}
                          className={`inline-flex min-h-[30px] items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs ${
                            checked
                              ? 'border-cyan-400/60 bg-cyan-500/20 text-slate-100'
                              : 'border-slate-700 bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <span style={{ color: meta.color }}>{meta.glyph}</span>
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cool flames toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        onlyCoolFlames: !d.onlyCoolFlames,
                      }))
                    }
                    aria-pressed={draft.onlyCoolFlames}
                    className={`flex flex-1 min-h-[36px] items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium ${
                      draft.onlyCoolFlames
                        ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                        : 'border-slate-700 bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Flame className="h-4 w-4 text-purple-400" />
                      <span>{t.filters.onlyCoolFlames}</span>
                    </span>
                    <span className="font-mono text-[11px]">
                      {draft.onlyCoolFlames ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <InfoTooltip term="cool_flame" />
                </div>
              </div>

              {/* Fixed Bottom Footer: Limpar + Aplicar (safe-area aware) */}
              <div
                style={{
                  paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                }}
                className="flex shrink-0 items-center gap-2.5 border-t border-slate-800 bg-[#121A30] px-4 pt-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDraft(DEFAULT_FILTERS);
                    clearAllFilters();
                    setFilterSheetOpen(false);
                  }}
                  className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-red-400/40 hover:text-red-200"
                >
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                  <span>{labels.clearShort}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilters(draft);
                    setFilterSheetOpen(false);
                  }}
                  className="inline-flex min-h-[38px] flex-[2] items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  <span>
                    {labels.applyBtn} ({draftPreviewCount})
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  /* ======================== DESKTOP MODE (> 768px, fixed, max-h 64px) ======================== */
  const o2MinPct =
    ((filters.o2Range[0] - DEFAULT_O2_RANGE[0]) /
      (DEFAULT_O2_RANGE[1] - DEFAULT_O2_RANGE[0])) *
    100;
  const o2MaxPct =
    ((filters.o2Range[1] - DEFAULT_O2_RANGE[0]) /
      (DEFAULT_O2_RANGE[1] - DEFAULT_O2_RANGE[0])) *
    100;

  const psiMinPct =
    ((filters.psiRange[0] - DEFAULT_PSI_RANGE[0]) /
      (DEFAULT_PSI_RANGE[1] - DEFAULT_PSI_RANGE[0])) *
    100;
  const psiMaxPct =
    ((filters.psiRange[1] - DEFAULT_PSI_RANGE[0]) /
      (DEFAULT_PSI_RANGE[1] - DEFAULT_PSI_RANGE[0])) *
    100;

  const openOutcomePopover = () => {
    if (!outcomeMenuOpen && outcomeBtnRef.current) {
      const r = outcomeBtnRef.current.getBoundingClientRect();
      setOutcomePos({
        top: Math.round(r.bottom + 6),
        left: Math.min(Math.round(r.left), window.innerWidth - 236),
      });
    }
    setOutcomeMenuOpen((v) => !v);
  };

  return (
    <div
      style={{ zIndex: 'var(--z-filter)' }}
      className="max-h-[64px] w-full overflow-hidden border-b border-slate-800/90 bg-[#0F1629]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1680px] flex-col px-3 py-1 sm:px-4">
        {/* Single compact horizontal-scrollable controls row (<= 34px) */}
        <div className="no-scrollbar flex flex-nowrap items-center gap-2.5 overflow-x-auto py-0.5">
          {/* Fuel selector */}
          <div
            className="flex shrink-0 items-center gap-1"
            role="group"
            aria-label={t.filters.gas}
          >
            <span className="whitespace-nowrap text-[11px] font-medium text-slate-400">
              {t.filters.gas}
            </span>
            {FUELS.map((fuel) => {
              const active = filters.fuels.includes(fuel);
              return (
                <button
                  key={fuel}
                  type="button"
                  onClick={() => toggleFuel(fuel)}
                  aria-pressed={active}
                  className={`min-h-[24px] whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                    active
                      ? 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-200'
                      : 'border border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                  }`}
                >
                  {fuelLabel(fuel, lang)}
                </button>
              );
            })}
          </div>

          {/* Flame type selector */}
          <div
            className="flex shrink-0 items-center gap-1"
            role="group"
            aria-label={t.filters.flame}
          >
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-[#B4C3D8]">
              <span>{t.filters.flame}</span>
              <InfoTooltip term="flame_type" />
            </span>
            {(['normal', 'inverse'] as const).map((ft) => {
              const active = filters.flameTypes.includes(ft);
              const colorClass = active
                ? ft === 'normal'
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                  : 'border-orange-400/60 bg-orange-500/20 text-orange-200'
                : 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-slate-600';
              return (
                <button
                  key={ft}
                  type="button"
                  onClick={() => toggleFlameType(ft)}
                  aria-pressed={active}
                  className={`min-h-[24px] whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${colorClass}`}
                >
                  {flameTypeLabel(ft, lang)}
                </button>
              );
            })}
          </div>

          {/* Dual Slider O2 */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-[#B4C3D8]">
              <span>{t.filters.o2}</span>
              <InfoTooltip term="o2_fraction" />
            </span>
            <div className="relative flex min-h-[18px] w-20 items-center lg:w-24">
              <div className="h-1 w-full rounded-full bg-slate-700" />
              <div
                className="absolute h-1 rounded-full bg-cyan-400"
                style={{
                  left: `${o2MinPct}%`,
                  width: `${Math.max(0, o2MaxPct - o2MinPct)}%`,
                }}
              />
              <input
                type="range"
                aria-label="Fração mínima de O2"
                min={DEFAULT_O2_RANGE[0]}
                max={DEFAULT_O2_RANGE[1]}
                step={0.01}
                value={filters.o2Range[0]}
                onChange={(e) => {
                  const val = Math.min(
                    Number(e.target.value),
                    filters.o2Range[1] - 0.01
                  );
                  setO2Range([Number(val.toFixed(2)), filters.o2Range[1]]);
                }}
                className="psi-range absolute inset-0 w-full"
              />
              <input
                type="range"
                aria-label="Fração máxima de O2"
                min={DEFAULT_O2_RANGE[0]}
                max={DEFAULT_O2_RANGE[1]}
                step={0.01}
                value={filters.o2Range[1]}
                onChange={(e) => {
                  const val = Math.max(
                    Number(e.target.value),
                    filters.o2Range[0] + 0.01
                  );
                  setO2Range([filters.o2Range[0], Number(val.toFixed(2))]);
                }}
                className="psi-range absolute inset-0 w-full"
              />
            </div>
            <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-slate-200">
              {Math.round(filters.o2Range[0] * 100)}–
              {Math.round(filters.o2Range[1] * 100)}%
            </span>
          </div>

          {/* Dual Slider Pressure PSI */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-[#B4C3D8]">
              <span>{t.filters.pressure}</span>
              <InfoTooltip term="pressure_psi" />
            </span>
            <div className="relative flex min-h-[18px] w-20 items-center lg:w-24">
              <div className="h-1 w-full rounded-full bg-slate-700" />
              <div
                className="absolute h-1 rounded-full bg-sky-400"
                style={{
                  left: `${psiMinPct}%`,
                  width: `${Math.max(0, psiMaxPct - psiMinPct)}%`,
                }}
              />
              <input
                type="range"
                aria-label="Pressão mínima em psi"
                min={DEFAULT_PSI_RANGE[0]}
                max={DEFAULT_PSI_RANGE[1]}
                step={0.1}
                value={filters.psiRange[0]}
                onChange={(e) => {
                  const val = Math.min(
                    Number(e.target.value),
                    filters.psiRange[1] - 0.5
                  );
                  setPsiRange([Number(val.toFixed(2)), filters.psiRange[1]]);
                }}
                className="psi-range absolute inset-0 w-full"
              />
              <input
                type="range"
                aria-label="Pressão máxima em psi"
                min={DEFAULT_PSI_RANGE[0]}
                max={DEFAULT_PSI_RANGE[1]}
                step={0.1}
                value={filters.psiRange[1]}
                onChange={(e) => {
                  const val = Math.max(
                    Number(e.target.value),
                    filters.psiRange[0] + 0.5
                  );
                  setPsiRange([filters.psiRange[0], Number(val.toFixed(2))]);
                }}
                className="psi-range absolute inset-0 w-full"
              />
            </div>
            <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-slate-200">
              {formatNumber(filters.psiRange[0], 1, lang)}–
              {formatNumber(filters.psiRange[1], 1, lang)} psi
            </span>
          </div>

          {/* Outcome selector button */}
          <button
            ref={outcomeBtnRef}
            type="button"
            onClick={openOutcomePopover}
            aria-expanded={outcomeMenuOpen}
            className={`inline-flex min-h-[24px] shrink-0 items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
              filters.outcomes.length > 0
                ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                : 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-slate-600'
            }`}
          >
            <Filter className="h-3 w-3 shrink-0" />
            <span>
              {t.filters.outcome}
              {filters.outcomes.length > 0 ? ` (${filters.outcomes.length})` : ''}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>

          {/* Cool flames toggle */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setOnlyCoolFlames(!filters.onlyCoolFlames)}
              aria-pressed={filters.onlyCoolFlames}
              className={`inline-flex min-h-[24px] shrink-0 items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400 ${
                filters.onlyCoolFlames
                  ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                  : 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Flame className="h-3 w-3 shrink-0 text-purple-400" />
              <span>{t.filters.onlyCoolFlames}</span>
            </button>
            <InfoTooltip term="cool_flame" />
          </div>

          {/* Counter + Clear */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="whitespace-nowrap font-mono text-xs font-semibold tabular-nums text-slate-200">
              {t.filters.testsOf(filteredCount, tests.length || 333)}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-red-400/40 hover:text-red-200 focus:outline-none focus:ring-1 focus:ring-red-400"
              >
                <RotateCcw className="h-3 w-3 shrink-0" />
                <span>{t.filters.clearFilters}</span>
              </button>
            )}
          </div>
        </div>

        {/* Single-line horizontally scrollable active filter chips (<= 24px) */}
        {renderActiveChipsRow('border-t border-slate-800/70 pt-1')}
      </div>

      {/* Fixed Outcome Popover so overflow-x-auto / max-h-64 never clips it */}
      {outcomeMenuOpen && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 'var(--z-modal)' }}
            onClick={() => setOutcomeMenuOpen(false)}
          />
          <div
            style={{
              zIndex: 'calc(var(--z-modal) + 1)',
              top: outcomePos.top,
              left: outcomePos.left,
            }}
            className="fixed w-56 rounded-lg border border-slate-700 bg-[#0F172A] p-2 shadow-xl shadow-black/60"
          >
            <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t.filters.outcomeHeader}
            </div>
            <div className="space-y-1">
              {OUTCOMES.map((out) => {
                const meta = outcomeMeta(out, lang);
                const checked = filters.outcomes.includes(out);
                return (
                  <button
                    key={out}
                    type="button"
                    onClick={() => toggleOutcome(out)}
                    className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                      checked
                        ? 'bg-cyan-500/15 text-slate-100'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span style={{ color: meta.color }}>{meta.glyph}</span>
                      <span>{meta.label}</span>
                    </span>
                    <span
                      className={`flex min-h-[14px] min-w-[14px] items-center justify-center rounded border text-[10px] ${
                        checked
                          ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                          : 'border-slate-600'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
