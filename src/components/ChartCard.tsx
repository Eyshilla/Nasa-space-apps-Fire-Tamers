import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FilterX, Maximize2, Sparkles, X } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import { useStrings } from '../utils/i18n';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { ChartExpandStatusContext, useChartHost } from './ChartHostContext';
import { InfoTooltip } from './InfoTooltip';

export interface ChartLegendItem {
  id: string;
  label: string;
  shortLabel?: string;
  marker: React.ReactNode;
}

export interface ChartCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  legend?: ChartLegendItem[];
  actions?: React.ReactNode;
  helpTitle?: string;
  helpBody?: string;
  chartContextPrompt?: string;
  chartContextLabel?: string;
  isEmpty?: boolean;
  loading?: boolean;
  tall?: boolean;
  plotAutoHeight?: boolean;
  fillHeight?: boolean;
  expandable?: boolean;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null
  );
}

export const ChartCard: React.FC<ChartCardProps> = ({
  id,
  title,
  subtitle,
  legend,
  actions,
  helpTitle,
  helpBody,
  chartContextPrompt,
  chartContextLabel,
  isEmpty = false,
  loading = false,
  tall = false,
  plotAutoHeight = false,
  fillHeight = false,
  expandable = true,
  compact = false,
  className = '',
  children,
}) => {
  const askAi = usePsiStore((s) => s.askAi);
  const clearAllFilters = usePsiStore((s) => s.clearAllFilters);
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const lang = usePsiStore((s) => s.lang);
  const t = useStrings(lang);

  const host = useChartHost();
  const effectiveFillHeight = fillHeight || Boolean(host?.fillHeight);
  const effectiveCompact = compact || Boolean(host?.compactHeader);

  const [expanded, setExpanded] = useState(false);
  const expandBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closeModal = useCallback(() => {
    setExpanded(false);
  }, []);

  // Lock body scroll, trap focus inside modal, close on Escape, and restore focus
  useEffect(() => {
    if (!expanded) return;

    previousFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? expandBtnRef.current;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusRaf = requestAnimationFrame(() => {
      closeBtnRef.current?.focus({ preventScroll: true });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = getFocusableElements(modalRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first || !modalRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || active === last || !modalRef.current.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      cancelAnimationFrame(focusRaf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown, true);
      const restoreTarget = previousFocusRef.current ?? expandBtnRef.current;
      requestAnimationFrame(() => {
        restoreTarget?.focus({ preventScroll: true });
      });
    };
  }, [expanded, closeModal]);

  const showHelp = Boolean(!presentationMode && helpTitle && helpBody);

  const renderTabsStrip = () => {
    if (!host || host.tabs.length === 0) return null;
    return (
      <div
        role="tablist"
        aria-label={title}
        className="flex flex-wrap items-center gap-1 border-b border-slate-800/80 pb-1.5"
      >
        {host.tabs.map((tab) => {
          const active = tab.id === host.activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => host.onSelectTab(tab.id)}
              className={`chrome-text-xs min-h-[28px] shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1 font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                active
                  ? 'border-cyan-400/55 bg-cyan-500/20 text-cyan-100'
                  : 'border-slate-700/70 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderCardBody = (isModalView: boolean) => {
    const plotClass = isModalView || effectiveFillHeight
      ? 'chart-card__plot chart-card__plot--fill'
      : plotAutoHeight
        ? 'chart-card__plot chart-card__plot--auto'
        : tall
          ? 'chart-card__plot chart-card__plot--tall'
          : 'chart-card__plot';

    return (
      <ChartExpandStatusContext.Provider value={isModalView}>
        {/* Tabbed host header tabs */}
        {renderTabsStrip()}

        {/* 1. Header */}
        <div
          className={`chart-card__header-row border-b border-slate-800/80 ${
            effectiveCompact && !isModalView ? 'pb-1.5' : 'pb-2'
          }`}
        >
          <header className="chart-card__header">
            <h3
              className={`chart-card__title wrap-anywhere font-semibold text-slate-100 ${
                effectiveCompact && !isModalView ? 'leading-snug' : ''
              }`}
            >
              {title}
            </h3>
            {subtitle && !(effectiveCompact && !isModalView) && (
              <p className="chart-card__subtitle wrap-anywhere font-sans text-[#B4C3D8]">
                {subtitle}
              </p>
            )}
          </header>

          <div className="chart-card__actions">
            {actions}
            {showHelp && <InfoTooltip title={helpTitle!} body={helpBody!} />}
            {chartContextPrompt && (
              <button
                type="button"
                onClick={() =>
                  askAi(
                    chartContextPrompt,
                    chartContextLabel ?? title,
                    'explain_chart'
                  )
                }
                title={t.chartCard.explain}
                className="inline-flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/20 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>{t.chartCard.explainShort}</span>
              </button>
            )}
            {expandable && !isModalView && (
              <button
                ref={expandBtnRef}
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={`${t.chartCard.expand}: ${title}`}
                title={t.chartCard.expand}
                className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-md border border-slate-700/90 bg-slate-800/80 px-1.5 py-1 text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <Maximize2 className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
            {isModalView && (
              <button
                ref={closeBtnRef}
                type="button"
                onClick={closeModal}
                aria-label={t.chartCard.collapse}
                title={t.chartCard.collapse}
                className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <X className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Legend */}
        {!loading && !isEmpty && legend && legend.length > 0 && (
          <div className="chart-card__legend rounded-lg border border-slate-800/70 bg-[#0F1629]/85 px-2.5 py-1 text-slate-200">
              {legend.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex max-w-full items-center gap-1.5"
                >
                  <span className="inline-flex shrink-0 items-center">
                    {item.marker}
                  </span>
                  <span className="wrap-anywhere">{item.label}</span>
                </span>
              ))}
            </div>
          )}

        {/* 3. Plot / Content Area */}
        <div className={plotClass}>
          {loading ? (
            <div className="flex h-full min-h-[190px] flex-1 flex-col justify-center gap-2.5 p-2">
              <div className="min-h-[12px] w-1/3 animate-pulse rounded bg-slate-800" />
              <div className="min-h-[140px] flex-1 animate-pulse rounded-lg bg-slate-800/70" />
            </div>
          ) : isEmpty ? (
            <div className="flex h-full min-h-[190px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-slate-700/80 bg-[#0B1020]/50 p-4 text-center">
              <p className="chart-text-axis wrap-anywhere font-medium text-slate-300">
                {t.chartCard.emptyTitle}
              </p>
              <p className="chart-text-annotation wrap-anywhere mt-1 text-slate-400">
                {t.chartCard.emptySubtitle}
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-3 inline-flex min-h-[30px] items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <FilterX className="h-3.5 w-3.5" />
                {t.filters.clearFilters}
              </button>
            </div>
          ) : (
            <ChartErrorBoundary
              variant="plot"
              resetKey={`${title}-${lang}-${isModalView ? 'modal' : 'card'}`}
            >
              {children}
            </ChartErrorBoundary>
          )}
        </div>
      </ChartExpandStatusContext.Provider>
    );
  };

  return (
    <>
      <section
        id={id}
        data-chart-fill={effectiveFillHeight ? 'true' : 'false'}
        className={`chart-card rounded-xl border border-slate-800/90 bg-[#121A30] ${
          effectiveCompact ? 'chart-card--compact px-2.5 pt-2 pb-3' : 'px-3.5 pt-3.5 pb-3'
        } shadow-lg shadow-black/25 ${
          effectiveFillHeight ? 'chart-card--fill h-full min-h-0' : ''
        } ${className}`}
      >
        {expanded ? (
          <div className="flex h-full min-h-[180px] items-center justify-center text-xs text-slate-400">
            {title}
          </div>
        ) : (
          renderCardBody(false)
        )}
      </section>

      {expanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{ zIndex: 'calc(var(--z-modal) + 10)' }}
            className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-xs md:p-4"
            onClick={closeModal}
          >
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              onClick={(e) => e.stopPropagation()}
              className="chart-card flex h-dvh w-screen flex-col rounded-none border border-slate-700/90 bg-[#121A30] p-4 shadow-2xl shadow-black md:h-[90dvh] md:w-[90vw] md:rounded-2xl md:p-5"
            >
              {renderCardBody(true)}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
