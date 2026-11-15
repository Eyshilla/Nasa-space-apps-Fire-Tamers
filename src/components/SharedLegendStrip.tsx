import React from 'react';
import { usePsiStore } from '../store/usePsiStore';
import { useStrings } from '../utils/i18n';

interface SharedLegendStripProps {
  inline?: boolean;
}

export const SharedLegendStrip: React.FC<SharedLegendStripProps> = ({
  inline = false,
}) => {
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const items = [
    {
      id: 'hotNormal',
      label: tStr.sharedLegend.hotNormal,
      marker: <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />,
    },
    {
      id: 'hotInverse',
      label: tStr.sharedLegend.hotInverse,
      marker: <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />,
    },
    {
      id: 'cool',
      label: tStr.sharedLegend.cool,
      marker: <span className="text-[11px] leading-none text-purple-400">◆</span>,
    },
    {
      id: 'limit',
      label: tStr.sharedLegend.limit,
      marker: <span className="text-[10px] leading-none text-red-400">▲</span>,
    },
    {
      id: 'none',
      label: tStr.sharedLegend.none,
      marker: <span className="text-[10px] leading-none text-slate-400">✕</span>,
    },
  ];

  if (inline) {
    return (
      <div
        aria-label={tStr.sharedLegend.title}
        className="no-scrollbar chrome-text-xs flex min-w-0 flex-nowrap items-center gap-x-3 overflow-x-auto text-slate-200"
      >
        <span className="shrink-0 whitespace-nowrap font-semibold text-[#B4C3D8]">
          {tStr.sharedLegend.title}
        </span>
        {items.map((item) => (
          <span
            key={item.id}
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap"
          >
            {item.marker}
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <section
      aria-label={tStr.sharedLegend.title}
      className="chart-text-legend flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-slate-800/90 bg-[#121A30] px-3.5 py-2 text-slate-100"
    >
      <span className="font-semibold text-[#B4C3D8]">
        {tStr.sharedLegend.title}
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {items.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {item.marker}
            <span>{item.label}</span>
          </span>
        ))}
      </div>
    </section>
  );
};
