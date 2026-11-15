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
  filterRef?: React.Ref<HTMLElement>;
  sticky?: boolean;
  onCompactChange?: (compact: boolean) => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  mode,
  filterRef,
  sticky = true,
  onCompactChange,
}) => {
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

  const desktopPopoverBtnRef = useRef<HTMLButtonElement | null>(null);
  const [desktopPopoverOpen, setDesktopPopoverOpen] = useState(false);
  const [desktopPopoverPos, setDesktopPopoverPos] = useState<{
    top: number;
    left: number;
  }>({ top: 96, left: 16 });

  const [draft, setDraft] = useState<GlobalFilters>(filters);

  useEffect(() => {
    onCompactChange?.(false);
  }, [onCompactChange]);

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

  // Escape handler for desktop Filters popover
  useEffect(() => {
    if (mode !== 'desktop' || !desktopPopoverOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDesktopPopoverOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, desktopPopoverOpen]);

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

  const popoverFilterCount =
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

  const renderActiveChipsRow = (extraClass = '', includeFuelFlame = true) => {
    const showFuelFlame = includeFuelFlame;
    const anyChip =
      (showFuelFlame &&
        (filters.fuels.length > 0 || filters.flameTypes.length > 0)) ||
      o2Changed ||
      psiChanged ||
      filters.outcomes.length > 0 ||
      filters.onlyCoolFlames ||
      filters.crossFilter !== null;

    if (!anyChip) return null;
    return (
      <div
        className={`no-scrollbar flex flex-nowrap items-center gap-1.5 overflow-x-auto ${extraClass}`}
      >
        {showFuelFlame &&
          filters.fuels.map((f) => (
            <button
              key={`chip-fuel-${f}`}
              type="button"
              onClick={() => toggleFuel(f)}
              className="chrome-text-xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-cyan-200 hover:bg-cyan-500/20"
            >
              {fuelLabel(f, lang)} <X className="h-3 w-3 shrink-0" />
            </button>
          ))}
        {showFuelFlame &&
          filters.flameTypes.map((ft) => (
            <button
              key={`chip-ft-${ft}`}
              type="button"
              onClick={() => toggleFlameType(ft)}
              className="chrome-text-xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-orange-200 hover:bg-orange-500/20"
            >
              {flameTypeLabel(ft, lang)} <X className="h-3 w-3 shrink-0" />
            </button>
          ))}
        {o2Changed && (
          <button
            type="button"
            onClick={() => setO2Range(DEFAULT_O2_RANGE)}
            className="chrome-text-xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-cyan-200 hover:bg-cyan-500/20"
          >
            O₂ {Math.round(filters.o2Range[0] * 100)}–
            {Math.round(filters.o2Range[1] * 100)}%{' '}
            <X className="h-3 w-3 shrink-0" />
          </button>
        )}
        {psiChanged && (
          <button
            type="button"
            onClick={() => setPsiRange(DEFAULT_PSI_RANGE)}
            className="chrome-text-xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 font-mono text-sky-200 hover:bg-sky-500/20"
          >
            P {formatNumber(filters.psiRange[0], 1, lang)}–
            {formatNumber(filters.psiRange[1], 1, lang)} psi{' '}
            <X className="h-3 w-3 shrink-0" />
          </button>
        )}
        {filters.outcomes.map((o) => (
          <button
            key={`chip-out-${o}`}
            type="button"
            onClick={() => toggleOutcome(o)}
            className="chrome-text-xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-slate-200 hover:bg-slate-700"
          >
            {outcomeMeta(o, lang).label} <X className="h-3 w-3 shrink-0" />
          </button>
        ))}
        {filters.onlyCoolFlames && (
          <button
            type="button"
            onClick={() => setOnlyCoolFlames(false)}
            className="chrome-text-xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-purple-500/40 bg-purple-500/15 px-1.5 py-0.5 text-purple-200 hover:bg-purple-500/25"
          >
            {t.filters.onlyCoolFlames} <X className="h-3 w-3 shrink-0" />
          </button>
        )}
        {filters.crossFilter && (
          <button
            type="button"
            onClick={() => setCrossFilter(null)}
            className="chrome-text-xs inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-emerald-200 hover:bg-emerald-500/25"
          >
            {filters.crossFilter.source}: {filters.crossFilter.label}{' '}
            <X className="h-3 w-3 shrink-0" />
          </button>
        )}
      </div>
    );
  };

  /* ======================== MOBILE MODE (<= 768px) ======================== */
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
          ref={filterRef}
          aria-label="Filtros globais"
          className="rounded-xl border border-slate-800/90 bg-[#0F1629] px-2.5 py-1.5 shadow-[0_6px_18px_-6px_rgba(2,6,23,0.7)]"
        >
          <div className="flex min-h-[38px] flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              aria-expanded={filterSheetOpen}
              className={`chrome-text-sm inline-flex min-h-[2rem] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 font-medium transition-colors ${
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

            <span className="chrome-text-sm shrink-0 whitespace-nowrap font-mono font-semibold tabular-nums text-slate-200">
              {t.filters.testsOf(filteredCount, tests.length || 333)}
            </span>

            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`chrome-text-xs inline-flex min-h-[1.875rem] shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 font-medium transition-colors ${
                hasActiveFilters
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-red-400/40 hover:text-red-200'
                  : 'cursor-not-allowed border-slate-800 bg-slate-900/50 text-slate-600'
              }`}
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              <span>{labels.clearShort}</span>
            </button>
          </div>

          {renderActiveChipsRow('mt-1 border-t border-slate-800/70 pt-1.5', true)}
        </section>

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
              <div className="shrink-0 border-b border-slate-800 px-4 pb-2.5 pt-2">
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-600" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="h-4 w-4 text-cyan-300" />
                    <h2 className="chrome-text-base font-bold text-slate-100">
                      {labels.sheetTitle}
                    </h2>
                    <span className="chrome-text-xs whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-200">
                      {t.filters.testsOf(draftPreviewCount, tests.length || 333)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilterSheetOpen(false)}
                    aria-label={labels.closeLabel}
                    className="flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
                {/* Gas */}
                <div>
                  <div className="chrome-text-xs mb-1.5 font-semibold uppercase tracking-wider text-slate-400">
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
                          className={`chrome-text-sm min-h-[2rem] whitespace-nowrap rounded-lg border px-3 py-1 font-medium ${
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
                  <div className="chrome-text-xs mb-1.5 flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-[#B4C3D8]">
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
                          className={`chrome-text-sm min-h-[2rem] whitespace-nowrap rounded-lg border px-3 py-1 font-medium ${
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
                  <div className="chrome-text-xs mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-[#B4C3D8]">
                      <span>{t.filters.o2}</span>
                      <InfoTooltip term="o2_fraction" />
                    </span>
                    <span className="whitespace-nowrap font-mono font-semibold text-cyan-200">
                      {Math.round(draft.o2Range[0] * 100)}–
                      {Math.round(draft.o2Range[1] * 100)}%
                    </span>
                  </div>
                  <div className="relative flex min-h-[1.625rem] w-full min-w-[140px] items-center">
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
                  <div className="chrome-text-xs mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-[#B4C3D8]">
                      <span>{t.filters.pressure}</span>
                      <InfoTooltip term="pressure_psi" />
                    </span>
                    <span className="whitespace-nowrap font-mono font-semibold text-sky-200">
                      {formatNumber(draft.psiRange[0], 1, lang)}–
                      {formatNumber(draft.psiRange[1], 1, lang)} psi
                    </span>
                  </div>
                  <div className="relative flex min-h-[1.625rem] w-full min-w-[140px] items-center">
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
                  <div className="chrome-text-xs mb-1.5 flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-[#B4C3D8]">
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
                          className={`chrome-text-sm inline-flex min-h-[1.875rem] items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 ${
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
                    className={`chrome-text-sm flex min-h-[2.25rem] flex-1 items-center justify-between whitespace-nowrap rounded-lg border px-3 py-2 font-medium ${
                      draft.onlyCoolFlames
                        ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                        : 'border-slate-700 bg-slate-800/70 text-slate-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Flame className="h-4 w-4 text-purple-400" />
                      <span>{t.filters.onlyCoolFlames}</span>
                    </span>
                    <span className="chrome-text-xs font-mono">
                      {draft.onlyCoolFlames ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <InfoTooltip term="cool_flame" />
                </div>
              </div>

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
                  className="chrome-text-sm inline-flex min-h-[2.375rem] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-semibold text-slate-200 hover:border-red-400/40 hover:text-red-200"
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
                  className="chrome-text-sm inline-flex min-h-[2.375rem] flex-[2] items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400"
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

  /* ======================== DESKTOP MODE (> 768px): COMPACT 1-LINE BAR (~44px) ======================== */
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

  const openDesktopFiltersPopover = () => {
    if (!desktopPopoverOpen && desktopPopoverBtnRef.current) {
      const r = desktopPopoverBtnRef.current.getBoundingClientRect();
      const maxWidth = Math.min(680, window.innerWidth - 24);
      setDesktopPopoverPos({
        top: Math.round(r.bottom + 8),
        left: Math.max(
          12,
          Math.min(Math.round(r.left), window.innerWidth - maxWidth - 12)
        ),
      });
    }
    setDesktopPopoverOpen((v) => !v);
  };

  return (
    <section
      ref={filterRef}
      aria-label="Filtros globais"
      style={{
        zIndex: 'var(--z-filters)',
        top: sticky ? 'var(--header-h)' : undefined,
      }}
      className={`${
        sticky ? 'sticky' : 'static'
      } w-full border-b border-slate-800/90 bg-[#0F1629]/95 shadow-[0_6px_16px_-6px_rgba(2,6,23,0.72)] backdrop-blur-md`}
    >
      <div className="mx-auto flex min-h-[42px] max-w-[1680px] flex-nowrap items-center gap-2.5 px-3 py-1 sm:px-4">
        {/* Gas quick toggles */}
        <div
          className="flex shrink-0 items-center gap-1 whitespace-nowrap"
          role="group"
          aria-label={t.filters.gas}
        >
          <span className="chrome-text-xs hidden font-medium text-slate-400 xl:inline">
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
                className={`chrome-text-xs min-h-[1.625rem] whitespace-nowrap rounded border px-2 py-0.5 font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  active
                    ? 'border-cyan-400/55 bg-cyan-500/20 text-cyan-100'
                    : 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                }`}
              >
                {fuelLabel(fuel, lang)}
              </button>
            );
          })}
        </div>

        {/* Flame quick toggles */}
        <div
          className="flex shrink-0 items-center gap-1 whitespace-nowrap"
          role="group"
          aria-label={t.filters.flame}
        >
          <span className="chrome-text-xs hidden font-medium text-[#B4C3D8] xl:inline">
            {t.filters.flame}
          </span>
          {(['normal', 'inverse'] as const).map((ft) => {
            const active = filters.flameTypes.includes(ft);
            const colorClass = active
              ? ft === 'normal'
                ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                : 'border-orange-400/60 bg-orange-500/20 text-orange-100'
              : 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-slate-600';
            return (
              <button
                key={ft}
                type="button"
                onClick={() => toggleFlameType(ft)}
                aria-pressed={active}
                className={`chrome-text-xs min-h-[1.625rem] whitespace-nowrap rounded border px-2 py-0.5 font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${colorClass}`}
              >
                {flameTypeLabel(ft, lang)}
              </button>
            );
          })}
        </div>

        {/* Filters (N) popover trigger (O2, pressure, outcomes, cool flames) */}
        <button
          ref={desktopPopoverBtnRef}
          type="button"
          onClick={openDesktopFiltersPopover}
          aria-expanded={desktopPopoverOpen}
          className={`chrome-text-xs inline-flex min-h-[1.75rem] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-0.5 font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
            popoverFilterCount > 0 || desktopPopoverOpen
              ? 'border-cyan-400/55 bg-cyan-500/20 text-cyan-100'
              : 'border-slate-700 bg-slate-800/80 text-slate-100 hover:border-cyan-500/40'
          }`}
        >
          <Filter className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
          <span>
            {labels.filtersBtn}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </button>

        {/* Horizontally scrollable active filter chips */}
        <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
          {renderActiveChipsRow('', false)}
        </div>

        {/* Counter + Clear */}
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span className="chrome-text-sm whitespace-nowrap font-mono font-semibold tabular-nums text-slate-200">
            {t.filters.testsOf(filteredCount, tests.length || 333)}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="chrome-text-xs inline-flex min-h-[1.625rem] items-center gap-1 whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-medium text-slate-200 transition-colors hover:border-red-400/40 hover:text-red-200 focus:outline-none focus:ring-1 focus:ring-red-400"
            >
              <RotateCcw className="h-3 w-3 shrink-0" />
              <span>{labels.clearShort}</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Filters Popover (O2 slider, Pressure slider, Outcomes, Cool flames) */}
      {desktopPopoverOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: 'var(--z-modal)' }}
            onClick={() => setDesktopPopoverOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.sheetTitle}
            style={{
              zIndex: 'calc(var(--z-modal) + 1)',
              top: desktopPopoverPos.top,
              left: desktopPopoverPos.left,
            }}
            className="fixed w-[min(680px,calc(100vw-24px))] max-h-[calc(100dvh-110px)] overflow-y-auto rounded-xl border border-slate-700 bg-[#0F172A] p-4 shadow-2xl shadow-black/80"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-cyan-300" />
                <h2 className="chrome-text-base font-bold text-slate-100">
                  {labels.sheetTitle}
                </h2>
                <span className="chrome-text-xs whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 font-mono text-cyan-200">
                  {t.filters.testsOf(filteredCount, tests.length || 333)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="chrome-text-xs inline-flex min-h-[1.75rem] items-center gap-1 whitespace-nowrap rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-medium text-slate-200 hover:border-red-400/40 hover:text-red-200"
                  >
                    <RotateCcw className="h-3 w-3 shrink-0" />
                    <span>{labels.clearShort}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDesktopPopoverOpen(false)}
                  aria-label={labels.closeLabel}
                  className="flex min-h-[2rem] min-w-[2rem] items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* O2 & Pressure sliders */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="chrome-text-xs mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-[#B4C3D8]">
                      <span>{t.filters.o2}</span>
                      <InfoTooltip term="o2_fraction" />
                    </span>
                    <span className="whitespace-nowrap font-mono font-semibold text-cyan-200">
                      {Math.round(filters.o2Range[0] * 100)}–
                      {Math.round(filters.o2Range[1] * 100)}%
                    </span>
                  </div>
                  <div className="relative flex min-h-[1.5rem] w-full min-w-[140px] items-center">
                    <div className="h-1.5 w-full rounded-full bg-slate-700" />
                    <div
                      className="absolute h-1.5 rounded-full bg-cyan-400"
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
                </div>

                <div>
                  <div className="chrome-text-xs mb-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-[#B4C3D8]">
                      <span>{t.filters.pressure}</span>
                      <InfoTooltip term="pressure_psi" />
                    </span>
                    <span className="whitespace-nowrap font-mono font-semibold text-sky-200">
                      {formatNumber(filters.psiRange[0], 1, lang)}–
                      {formatNumber(filters.psiRange[1], 1, lang)} psi
                    </span>
                  </div>
                  <div className="relative flex min-h-[1.5rem] w-full min-w-[140px] items-center">
                    <div className="h-1.5 w-full rounded-full bg-slate-700" />
                    <div
                      className="absolute h-1.5 rounded-full bg-sky-400"
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
                </div>
              </div>

              {/* Outcomes */}
              <div>
                <div className="chrome-text-xs mb-1.5 flex items-center gap-1 whitespace-nowrap font-semibold uppercase tracking-wider text-[#B4C3D8]">
                  <span>{t.filters.outcomeHeader}</span>
                  <InfoTooltip term="outcome" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {OUTCOMES.map((out) => {
                    const meta = outcomeMeta(out, lang);
                    const checked = filters.outcomes.includes(out);
                    return (
                      <button
                        key={out}
                        type="button"
                        onClick={() => toggleOutcome(out)}
                        aria-pressed={checked}
                        className={`chrome-text-sm inline-flex min-h-[1.875rem] items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 ${
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
                  onClick={() => setOnlyCoolFlames(!filters.onlyCoolFlames)}
                  aria-pressed={filters.onlyCoolFlames}
                  className={`chrome-text-sm flex min-h-[2.25rem] flex-1 items-center justify-between whitespace-nowrap rounded-lg border px-3 py-2 font-medium ${
                    filters.onlyCoolFlames
                      ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
                      : 'border-slate-700 bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Flame className="h-4 w-4 text-purple-400" />
                    <span>{t.filters.onlyCoolFlames}</span>
                  </span>
                  <span className="chrome-text-xs font-mono">
                    {filters.onlyCoolFlames ? 'ON' : 'OFF'}
                  </span>
                </button>
                <InfoTooltip term="cool_flame" />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
