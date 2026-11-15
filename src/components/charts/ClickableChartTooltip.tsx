import React from 'react';

interface TooltipEntry {
  name?: string;
  value?: number | string | Array<number | string>;
  color?: string;
  fill?: string;
}

interface ClickableChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  hintText: string;
  hideZero?: boolean;
}

export const ClickableChartTooltip: React.FC<ClickableChartTooltipProps> = ({
  active,
  payload,
  label,
  hintText,
  hideZero = false,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const visibleEntries = hideZero
    ? payload.filter((e) => e.value !== 0 && e.value !== undefined && e.value !== null)
    : payload.filter((e) => e.value !== undefined && e.value !== null);

  return (
    <div
      style={{ fontSize: 'calc(14px * var(--chart-font-scale))' }}
      className="rounded-lg border border-slate-700 bg-[#0B1020]/96 px-3 py-2 text-slate-100 shadow-xl shadow-black/75"
    >
      <div className="mb-1 text-[0.82em] font-medium text-cyan-300">
        {hintText}
      </div>
      {label !== undefined && label !== '' && (
        <div className="mb-1 border-b border-slate-800 pb-1 font-semibold text-slate-100">
          {label}
        </div>
      )}
      <div className="space-y-0.5 tabular-nums">
        {visibleEntries.map((entry, idx) => {
          const val = Array.isArray(entry.value)
            ? entry.value.join(' – ')
            : entry.value;
          const dotColor = entry.color ?? entry.fill ?? '#38BDF8';
          return (
            <div
              key={`${entry.name ?? idx}-${idx}`}
              className="flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center gap-1.5 text-slate-200">
                <span
                  className="h-2 w-2 shrink-0 rounded-xs"
                  style={{ backgroundColor: dotColor }}
                />
                <span>{entry.name}</span>
              </span>
              <span className="font-mono font-semibold text-slate-100">
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
