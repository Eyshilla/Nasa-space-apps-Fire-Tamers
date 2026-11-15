import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { Filter, ListFilter, Pin, X } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import type { Psi159Test } from '../types/psi159';
import { isInLunarZone } from '../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
} from '../utils/formatters';
import { useStrings } from '../utils/i18n';

export interface PointTooltipAnchor {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface ClusterTooltipState<T> {
  hovered: { data: T; anchor: PointTooltipAnchor } | null;
  pinned: { data: T; anchor: PointTooltipAnchor } | null;
  active: { data: T; anchor: PointTooltipAnchor } | null;
  isPinned: boolean;
  onPointEnter: (data: T, anchor: PointTooltipAnchor) => void;
  onPointLeave: () => void;
  onPopoverEnter: () => void;
  onPopoverLeave: () => void;
  onPointClick: (
    data: T,
    anchor: PointTooltipAnchor,
    id: string,
    pointerType?: string
  ) => void;
  pinActive: () => void;
  closeAll: () => void;
}

const HOVER_CLOSE_DELAY_MS = 250;

export function useClusterTooltip<T>(
  getId: (item: T) => string
): ClusterTooltipState<T> {
  const [hovered, setHovered] = useState<{
    data: T;
    anchor: PointTooltipAnchor;
  } | null>(null);
  const [pinned, setPinned] = useState<{
    data: T;
    anchor: PointTooltipAnchor;
  } | null>(null);

  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const scheduleCloseHovered = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setHovered(null);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const onPointEnter = useCallback(
    (data: T, anchor: PointTooltipAnchor) => {
      clearCloseTimer();
      setHovered({ data, anchor });
    },
    [clearCloseTimer]
  );

  const onPointLeave = useCallback(() => {
    scheduleCloseHovered();
  }, [scheduleCloseHovered]);

  const onPopoverEnter = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const onPopoverLeave = useCallback(() => {
    scheduleCloseHovered();
  }, [scheduleCloseHovered]);

  const onPointClick = useCallback(
    (
      data: T,
      anchor: PointTooltipAnchor,
      id: string,
      pointerType = 'mouse'
    ) => {
      clearCloseTimer();
      setPinned((prev) => {
        if (prev && getId(prev.data) === id && pointerType !== 'touch') {
          return null;
        }
        return { data, anchor };
      });
      setHovered(null);
    },
    [clearCloseTimer, getId]
  );

  const pinActive = useCallback(() => {
    clearCloseTimer();
    setPinned((prev) => prev ?? hovered);
  }, [clearCloseTimer, hovered]);

  const closeAll = useCallback(() => {
    clearCloseTimer();
    setHovered(null);
    setPinned(null);
  }, [clearCloseTimer]);

  // Pinned state stays visible until dismissed; otherwise hover shows transient/interactive popover
  const active = pinned ?? hovered;
  const isPinned = pinned !== null;

  return {
    hovered,
    pinned,
    active,
    isPinned,
    onPointEnter,
    onPointLeave,
    onPopoverEnter,
    onPopoverLeave,
    onPointClick,
    pinActive,
    closeAll,
  };
}

export interface PointTooltipPopoverProps {
  open: boolean;
  pinned: boolean;
  anchor: PointTooltipAnchor | null;
  tests: Psi159Test[];
  headerSummary?: string;
  extraStatsLine?: string;
  onFilterSubset?: () => void;
  onPointerEnterPopover?: () => void;
  onPointerLeavePopover?: () => void;
  onPin?: () => void;
  onClose: () => void;
}

export const PointTooltipPopover: React.FC<PointTooltipPopoverProps> = ({
  open,
  pinned,
  anchor,
  tests,
  headerSummary,
  extraStatsLine,
  onFilterSubset,
  onPointerEnterPopover,
  onPointerLeavePopover,
  onPin,
  onClose,
}) => {
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const selectTest = usePsiStore((s) => s.selectTest);
  const openClusterListDrawer = usePsiStore((s) => s.openClusterListDrawer);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const listRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [scrollMeta, setScrollMeta] = useState<{
    shown: number;
    canScrollMore: boolean;
  }>({ shown: Math.min(tests.length, 6), canScrollMore: tests.length > 6 });

  const isGrouped = tests.length >= 2;
  const rep = tests[0] ?? null;

  const virtualReference = useMemo(() => {
    if (!anchor) return null;
    const w = anchor.width ?? 10;
    const h = anchor.height ?? 10;
    const left = anchor.x - w / 2;
    const top = anchor.y - h / 2;
    return {
      getBoundingClientRect: () => ({
        x: left,
        y: top,
        left,
        top,
        right: left + w,
        bottom: top + h,
        width: w,
        height: h,
        toJSON: () => ({}),
      }),
    };
  }, [anchor]);

  const { refs, floatingStyles, isPositioned } = useFloating({
    open: Boolean(open && anchor && rep),
    placement: 'right-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ['left-start', 'bottom-start', 'top-start', 'bottom', 'top'],
        padding: 8,
      }),
      shift({ padding: 8 }),
    ],
  });

  useEffect(() => {
    if (virtualReference) {
      refs.setPositionReference(virtualReference);
    }
  }, [virtualReference, refs]);

  const updateScrollMeta = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const total = tests.length;
    if (total === 0) {
      setScrollMeta({ shown: 0, canScrollMore: false });
      return;
    }
    const { scrollTop, clientHeight, scrollHeight } = el;
    const canScrollMore = scrollTop + clientHeight < scrollHeight - 3;
    const rows = rowRefs.current;
    let reached = 0;
    const viewBottom = scrollTop + clientHeight;
    for (let i = 0; i < total; i++) {
      const btn = rows[i];
      if (!btn) continue;
      if (btn.offsetTop < viewBottom - 4) {
        reached = i + 1;
      }
    }
    const fallbackCount = Math.min(
      total,
      Math.max(1, Math.round((viewBottom / Math.max(1, scrollHeight)) * total))
    );
    setScrollMeta({
      shown: Math.min(total, Math.max(1, reached || fallbackCount)),
      canScrollMore,
    });
  }, [tests.length]);

  useEffect(() => {
    if (!open || !isGrouped) return;
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
    const raf = requestAnimationFrame(updateScrollMeta);
    return () => cancelAnimationFrame(raf);
  }, [open, isGrouped, tests, updateScrollMeta]);

  useEffect(() => {
    if (!open || !isGrouped || !pinned) return;
    const floating = refs.floating.current;
    const listEl = listRef.current;
    if (!floating || !listEl) return;
    if (!floating.contains(document.activeElement)) {
      listEl.focus({ preventScroll: true });
    }
  }, [open, isGrouped, pinned, refs.floating]);

  // Outside click / Escape closes pinned popover (or Escape closes hovered grouped popover)
  useEffect(() => {
    if (!open || !isGrouped) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!pinned) return;
      const floating = refs.floating.current;
      const target = e.target as HTMLElement | null;
      if (!floating || !target) return;
      if (floating.contains(target)) return;
      if (target.closest('[data-point-trigger="true"]')) return;
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, isGrouped, pinned, refs.floating, onClose]);

  if (!open || !anchor || !rep || typeof document === 'undefined') {
    return null;
  }

  const resolvedHeader =
    headerSummary ??
    `${tStr.pointPopover.testsCount(tests.length)} · ${Math.round(
      rep.o2_fraction * 100
    )}% O₂ · ${formatNumber(rep.pressure_psi, 1, lang)} psi`;

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el) return;
    const activeIndex = rowRefs.current.findIndex(
      (btn) => btn === document.activeElement
    );
    const total = tests.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(total - 1, activeIndex < 0 ? 0 : activeIndex + 1);
      rowRefs.current[next]?.focus();
      rowRefs.current[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, activeIndex < 0 ? 0 : activeIndex - 1);
      rowRefs.current[prev]?.focus();
      rowRefs.current[prev]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      el.scrollBy({ top: Math.max(120, el.clientHeight * 0.8), behavior: 'smooth' });
      const next = Math.min(total - 1, (activeIndex < 0 ? 0 : activeIndex) + 4);
      rowRefs.current[next]?.focus();
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      el.scrollBy({ top: -Math.max(120, el.clientHeight * 0.8), behavior: 'smooth' });
      const prev = Math.max(0, (activeIndex < 0 ? 0 : activeIndex) - 4);
      rowRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      rowRefs.current[0]?.focus();
      el.scrollTo({ top: 0 });
    } else if (e.key === 'End') {
      e.preventDefault();
      rowRefs.current[total - 1]?.focus();
      el.scrollTo({ top: el.scrollHeight });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  /* Single test tooltip: hover-only, pointer-events: none */
  if (!isGrouped) {
    const meta = outcomeMeta(rep.outcome, lang);
    return createPortal(
      <div
        ref={refs.setFloating}
        role="tooltip"
        style={{
          ...floatingStyles,
          zIndex: 'var(--z-tooltip)',
          visibility: isPositioned ? 'visible' : 'hidden',
        }}
        className="grouped-popover-text pointer-events-none w-[min(272px,calc(100vw-16px))] rounded-lg border border-slate-600 bg-[#0B1020] p-2.5 text-slate-100 shadow-2xl shadow-black/85"
      >
        <div className="mb-1 text-[0.82em] font-medium text-cyan-300/90">
          {tStr.chartCard.clickToOpenTest}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1">
          <span className="font-mono font-bold text-cyan-300">{rep.test_id}</span>
          <span className="text-[0.9em] text-slate-300">
            {fuelLabel(rep.fuel, lang)} · {flameTypeLabel(rep.flame_type, lang)}
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[0.9em] tabular-nums text-slate-200">
          <span>O₂: {Math.round(rep.o2_fraction * 100)}%</span>
          <span>P: {formatNumber(rep.pressure_psi, 2, lang)} psi</span>
          <span>
            {rep.burn_time_s !== null
              ? `${formatNumber(rep.burn_time_s, 1, lang)} s`
              : '—'}
          </span>
          <span>
            {rep.peak_burner_temp_c !== null
              ? `${formatNumber(rep.peak_burner_temp_c, 0, lang)} °C`
              : '—'}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[0.85em] ${meta.badgeClass}`}
          >
            <span>{meta.glyph}</span>
            <span>{meta.label}</span>
          </span>
          {isInLunarZone(rep) && (
            <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[0.85em] text-emerald-300">
              {tStr.ignitionChart.lunarZone}
            </span>
          )}
        </div>
      </div>,
      document.body
    );
  }

  /* Grouped tests (>=2): interactive popover with 12px hover bridge, 250ms delay, pinning, and scrollable list */
  return createPortal(
    <div
      ref={refs.setFloating}
      role="dialog"
      aria-modal="false"
      aria-label={resolvedHeader}
      style={{
        ...floatingStyles,
        zIndex: 'var(--z-tooltip)',
        visibility: isPositioned ? 'visible' : 'hidden',
      }}
      onMouseEnter={onPointerEnterPopover}
      onMouseLeave={onPointerLeavePopover}
      onWheel={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="grouped-popover-text pointer-events-auto relative w-[min(360px,calc(100vw-16px))]"
    >
      {/* 12px invisible hover-bridge cushion around the popover when hovering unpinned */}
      {!pinned && (
        <div
          aria-hidden="true"
          className="pointer-events-auto absolute -inset-[12px] -z-10"
        />
      )}

      <div className="flex flex-col overflow-hidden rounded-xl border border-slate-600 bg-[#0B1020] text-slate-100 shadow-2xl shadow-black/90">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-10 flex flex-col gap-1 border-b border-slate-800 bg-[#0B1020] px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="wrap-anywhere font-mono font-bold text-cyan-300">
                {resolvedHeader}
              </div>
              {extraStatsLine && (
                <div className="wrap-anywhere mt-0.5 text-[0.88em] text-slate-300">
                  {extraStatsLine}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={tStr.pointPopover.close}
              title={tStr.pointPopover.close}
              className="inline-flex min-h-[26px] min-w-[26px] shrink-0 items-center justify-center rounded-md border border-slate-700/80 bg-slate-800/80 text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {pinned ? (
              <span className="inline-flex items-center gap-1 text-[0.82em] font-medium text-emerald-300">
                <Pin className="h-3 w-3 shrink-0" />
                <span>{tStr.pointPopover.pinned}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPin?.();
                }}
                className="inline-flex items-center gap-1 rounded text-[0.82em] text-slate-300 hover:text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <Pin className="h-3 w-3 shrink-0 text-cyan-300" />
                <span>{tStr.pointPopover.clickToPin}</span>
              </button>
            )}

            {onFilterSubset && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterSubset();
                  onClose();
                }}
                className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[0.82em] font-medium text-cyan-200 hover:bg-cyan-500/25 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <Filter className="h-3 w-3 shrink-0" />
                <span>{tStr.pointPopover.filterCell}</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable List Body: max-height min(260px, 50dvh), overscroll-behavior: contain, AA 8px scrollbar */}
        <div
          ref={listRef}
          tabIndex={0}
          role="listbox"
          aria-label={resolvedHeader}
          onScroll={updateScrollMeta}
          onKeyDown={handleListKeyDown}
          className="grouped-popover-scroll space-y-1 px-2 py-2 focus:outline-none"
        >
          {tests.map((item, idx) => {
            const meta = outcomeMeta(item.outcome, lang);
            const isSelected = item.test_id === selectedTestId;
            return (
              <button
                key={item.test_id}
                ref={(el) => {
                  rowRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  selectTest(item.test_id, true);
                }}
                className={`flex w-full flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15'
                    : 'border-slate-800/90 bg-[#11192E] hover:border-cyan-500/45 hover:bg-slate-800/90'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-cyan-300">
                    {item.test_id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[0.82em] font-medium ${meta.badgeClass}`}
                  >
                    <span>{meta.glyph}</span>
                    <span>{meta.label}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[0.88em] text-slate-300">
                  <span>
                    {fuelLabel(item.fuel, lang)} ·{' '}
                    {flameTypeLabel(item.flame_type, lang)}
                  </span>
                  <span className="font-mono tabular-nums text-slate-200">
                    {Math.round(item.o2_fraction * 100)}% ·{' '}
                    {formatNumber(item.pressure_psi, 1, lang)} psi
                    {item.peak_burner_temp_c !== null
                      ? ` · ${formatNumber(item.peak_burner_temp_c, 0, lang)} °C`
                      : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sticky Footer */}
        <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-[#0B1020] px-3 py-2 text-[0.85em] text-slate-300">
          <span className="wrap-anywhere">
            {tStr.pointPopover.showingOf(
              scrollMeta.shown,
              tests.length,
              scrollMeta.canScrollMore
            )}
          </span>
          {tests.length > 12 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openClusterListDrawer(tests, resolvedHeader);
                onClose();
              }}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1 font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <ListFilter className="h-3.5 w-3.5 shrink-0" />
              <span>{tStr.pointPopover.viewAll(tests.length)}</span>
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
};
