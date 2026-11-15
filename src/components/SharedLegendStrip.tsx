import React from 'react';
import { usePsiStore } from '../store/usePsiStore';
import { useStrings } from '../utils/i18n';

export const SharedLegendStrip: React.FC = () => {
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

  return (
    <section
      aria-label={tStr.sharedLegend.title}
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-slate-800/90 bg-[#121A30] px-3.5 py-2 text-xs text-slate-100"
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
