import React from 'react';
import { AlertTriangle, MousePointerClick, ShieldAlert, X } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import { useStrings } from '../utils/i18n';

export const HelpModal: React.FC = () => {
  const helpOpen = usePsiStore((s) => s.helpOpen);
  const setHelpOpen = usePsiStore((s) => s.setHelpOpen);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  if (!helpOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      style={{ zIndex: 'var(--z-modal)' }}
      className="fixed inset-0 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      onClick={() => setHelpOpen(false)}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-[#121A30] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="min-w-0">
            <h2
              id="help-modal-title"
              className="wrap-anywhere text-base font-bold text-slate-100"
            >
              {tStr.help} · {tStr.appTitle}
            </h2>
            <p className="wrap-anywhere mt-0.5 text-xs text-slate-400">
              {tStr.appSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            aria-label={tStr.drawer.close}
            className="min-h-[28px] min-w-[28px] shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{tStr.ignitionChart.lunarZone} (O₂ ≥ 30%, P ≤ 10,2 psi)</span>
            </div>
            <p className="wrap-anywhere mt-1 text-slate-200">
              {tStr.kpis.lunarBody}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-slate-800 bg-[#0B1020] p-3">
              <div className="mb-1.5 font-semibold text-cyan-300">
                {tStr.table.colOutcome} &amp; Symbols
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400">●</span>
                  <span>{tStr.ignitionChart.legendNormal}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono text-orange-400">●</span>
                  <span>{tStr.ignitionChart.legendInverse}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono text-purple-400">◆</span>
                  <span>{tStr.ignitionChart.legendCool}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono text-red-400">▲</span>
                  <span>{tStr.ignitionChart.legendLimit}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">✕</span>
                  <span>{tStr.ignitionChart.legendNone}</span>
                </li>
              </ul>
            </div>

            <div className="min-w-0 rounded-lg border border-slate-800 bg-[#0B1020] p-3">
              <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-cyan-300">
                <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
                <span>Cross-filtering &amp; 3D</span>
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li className="wrap-anywhere">• {tStr.ignitionChart.subtitle}</li>
                <li className="wrap-anywhere">• {tStr.param3d.subtitle}</li>
                <li className="wrap-anywhere">• {tStr.ai.welcome(333)}</li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{tStr.insights.honestTitle}</span>
            </div>
            <p className="wrap-anywhere mt-1 text-slate-200">
              {tStr.insights.honestBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
