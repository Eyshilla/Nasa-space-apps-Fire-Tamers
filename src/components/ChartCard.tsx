import React from 'react';
import { FilterX, Sparkles } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import { useStrings } from '../utils/i18n';
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
  footer?: React.ReactNode;
  helpTitle?: string;
  helpBody?: string;
  chartContextPrompt?: string;
  chartContextLabel?: string;
  isEmpty?: boolean;
  loading?: boolean;
  tall?: boolean;
  plotAutoHeight?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  id,
  title,
  subtitle,
  legend,
  actions,
  footer,
  helpTitle,
  helpBody,
  chartContextPrompt,
  chartContextLabel,
  isEmpty = false,
  loading = false,
  tall = false,
  plotAutoHeight = false,
  className = '',
  children,
}) => {
  const askAi = usePsiStore((s) => s.askAi);
  const clearAllFilters = usePsiStore((s) => s.clearAllFilters);
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const lang = usePsiStore((s) => s.lang);
  const t = useStrings(lang);

  const showHelp = Boolean(!presentationMode && helpTitle && helpBody);
  const hasActions = Boolean(actions || chartContextPrompt || showHelp);

  return (
    <section
      id={id}
      className={`chart-card rounded-xl border border-slate-800/90 bg-[#121A30] p-3.5 shadow-lg shadow-black/25 ${className}`}
    >
      {/* 1. Header */}
      <div className="chart-card__header-row border-b border-slate-800/80 pb-2.5">
        <header className="chart-card__header">
          <h3 className="chart-card__title wrap-anywhere font-semibold text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="chart-card__subtitle wrap-anywhere font-sans text-[#B4C3D8]">
              {subtitle}
            </p>
          )}
        </header>

        {hasActions && (
          <div className="chart-card__actions">
            {actions}
            {showHelp && (
              <InfoTooltip title={helpTitle!} body={helpBody!} />
            )}
            {chartContextPrompt && (
              <button
                type="button"
                onClick={() => askAi(chartContextPrompt, chartContextLabel ?? title)}
                title={t.chartCard.explain}
                className="inline-flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-500/20 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>{t.chartCard.explainShort}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Legend (HTML normal flow above plot) */}
      {!loading && !isEmpty && legend && legend.length > 0 && (
        <div className="chart-card__legend rounded-lg border border-slate-800/70 bg-[#0F1629]/85 px-2.5 py-1.5 text-[11px] text-slate-200">
          {legend.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {item.marker}
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* 3. Plot / Content Area */}
      <div
        className={
          plotAutoHeight
            ? 'chart-card__plot chart-card__plot--auto'
            : tall
              ? 'chart-card__plot chart-card__plot--tall'
              : 'chart-card__plot'
        }
      >
        {loading ? (
          <div className="flex min-h-[220px] flex-col justify-center gap-2.5 p-2">
            <div className="min-h-[12px] w-1/3 animate-pulse rounded bg-slate-800" />
            <div className="min-h-[160px] w-full animate-pulse rounded-lg bg-slate-800/70" />
          </div>
        ) : isEmpty ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-700/80 bg-[#0B1020]/50 p-4 text-center">
            <p className="wrap-anywhere text-xs font-medium text-slate-300">
              {t.chartCard.emptyTitle}
            </p>
            <p className="wrap-anywhere mt-1 text-[11px] text-slate-400">
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
          children
        )}
      </div>

      {/* 4. Footer */}
      {!loading && !isEmpty && footer && (
        <footer className="chart-card__footer border-t border-slate-800/70 pt-2 font-sans text-slate-400">
          {footer}
        </footer>
      )}
    </section>
  );
};
