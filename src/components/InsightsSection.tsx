import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Compass,
  Earth,
  Flame,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import type { Psi159Test } from '../types/psi159';
import { computeDiscoveries, computeLunarTop10 } from '../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeMeta,
} from '../utils/formatters';
import { useStrings } from '../utils/i18n';
import { ChartCard } from './ChartCard';
import { InfoTooltip } from './InfoTooltip';

interface LunarTop10CardProps {
  tests: Psi159Test[];
  loading?: boolean;
  compact?: boolean;
}

export const LunarTop10Card: React.FC<LunarTop10CardProps> = ({
  tests,
  loading = false,
  compact = false,
}) => {
  const selectTest = usePsiStore((s) => s.selectTest);
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const top10 = useMemo(() => computeLunarTop10(tests), [tests]);

  return (
    <ChartCard
      title={tStr.top10.title}
      subtitle={tStr.top10.subtitle}
      helpTitle={tStr.top10.howWeCalc}
      helpBody="Zona Lunar (até 40 pts: O₂ ≥ 30% e P ≤ 10,2 psi) + Chama Fria (+25 pts) + Pico Térmico (até 20 pts) + Tempo de Queima (até 15 pts)."
      chartContextPrompt={tStr.prompts.explainLunarTop10}
      chartContextLabel={tStr.top10.title}
      isEmpty={top10.length === 0}
      loading={loading}
      plotAutoHeight
      footer={
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <span>{tStr.top10.howWeCalc}</span>
          {!presentationMode && (
            <InfoTooltip
              title={tStr.top10.howWeCalc}
              body="Zona Lunar (40 pts) + Chama Fria (25 pts) + Pico Térmico (20 pts) + Duração (15 pts)."
            />
          )}
        </span>
      }
    >
      <div
        className={`divide-y divide-slate-800/70 overflow-y-auto ${
          compact ? 'max-h-[245px]' : 'max-h-[380px]'
        }`}
      >
        {top10.map((item, idx) => {
          const t = item.test;
          const isSel = t.test_id === selectedTestId;
          const meta = outcomeMeta(t.outcome, lang);
          return (
            <button
              key={t.test_id}
              type="button"
              onClick={() => selectTest(t.test_id, true)}
              className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left transition-colors ${
                isSel ? 'bg-cyan-500/15' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex min-h-[20px] min-w-[20px] shrink-0 items-center justify-center rounded bg-slate-800 font-mono text-[11px] font-bold text-slate-200">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="whitespace-nowrap font-mono text-xs font-semibold text-cyan-300">
                      {t.test_id}
                    </span>
                    <span className="whitespace-nowrap text-[11px] text-[#B4C3D8]">
                      {fuelLabel(t.fuel, lang)} · {flameTypeLabel(t.flame_type, lang)}
                    </span>
                    {item.inLunarZone && (
                      <span className="whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-1 text-[10px] text-emerald-300">
                        LUNAR
                      </span>
                    )}
                    {t.cool_flame && (
                      <span className="whitespace-nowrap rounded border border-purple-500/40 bg-purple-500/15 px-1 text-[10px] text-purple-200">
                        ◆
                      </span>
                    )}
                  </div>
                  <div className="wrap-anywhere mt-0.5 font-mono text-[11px] tabular-nums text-[#B4C3D8]">
                    O₂ {Math.round(t.o2_fraction * 100)}% ·{' '}
                    {formatNumber(t.pressure_psi, 1, lang)} psi ·{' '}
                    {t.peak_burner_temp_c !== null
                      ? `${formatNumber(t.peak_burner_temp_c, 0, lang)} °C`
                      : '—'}{' '}
                    · {meta.label}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="font-mono text-xs font-bold tabular-nums text-emerald-300">
                  {formatNumber(item.score, 1, lang)}
                </div>
                <div className="text-[10px] text-[#B4C3D8]">{tStr.top10.pts}</div>
              </div>
            </button>
          );
        })}
      </div>
    </ChartCard>
  );
};

interface InsightsSectionProps {
  tests: Psi159Test[];
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({ tests }) => {
  const askAi = usePsiStore((s) => s.askAi);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const discoveries = useMemo(() => computeDiscoveries(tests, lang), [tests, lang]);

  const toneStyle = (tone: string) => {
    switch (tone) {
      case 'red':
        return 'border-red-500/30 bg-red-500/5 text-red-300';
      case 'emerald':
        return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300';
      case 'purple':
        return 'border-purple-500/30 bg-purple-500/5 text-purple-300';
      case 'amber':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-300';
      default:
        return 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300';
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="note"
        className="flex items-start gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-100"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 wrap-anywhere">
          <span className="font-semibold text-amber-200">
            {tStr.insights.honestTitle}
          </span>{' '}
          {tStr.insights.honestBody}
        </div>
      </div>

      {discoveries.length > 0 && (
        <div className="board-row-2">
          {discoveries.map((card) => (
            <div
              key={card.id}
              className={`min-w-0 rounded-xl border p-3.5 ${toneStyle(card.tone)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="wrap-anywhere text-[11px] font-semibold uppercase tracking-wide">
                  {card.title}
                </span>
                <Compass className="h-3.5 w-3.5 shrink-0 opacity-75" />
              </div>
              <div className="mt-1.5 font-mono text-lg font-bold tabular-nums text-slate-100">
                {card.metric}
              </div>
              <p className="wrap-anywhere mt-1 text-[11px] text-slate-300">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="board-2col">
        <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121A30] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <Earth className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="wrap-anywhere">{tStr.insights.earthTitle}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                askAi(
                  tStr.prompts.explainEarthAnalogies,
                  tStr.insights.earthTitle,
                  'explain_chart'
                )
              }
              className="inline-flex min-h-[26px] items-center gap-1 whitespace-nowrap rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300 hover:bg-cyan-500/20"
            >
              <Sparkles className="h-3 w-3 shrink-0" />
              {tStr.insights.earthDeepen}
            </button>
          </div>
          <ul className="mt-2.5 space-y-2 text-xs text-slate-300">
            <li className="wrap-anywhere">
              •{' '}
              {lang === 'en'
                ? 'Engine knock analogy: cool flames occur inside Earth gasoline cylinders before spark ignition. On the ISS they stabilize into long-lasting spheres.'
                : lang === 'es'
                  ? 'Analogía del motor: las llamas frías ocurren dentro de cilindros antes de la chispa. En la ISS se estabilizan durante decenas de segundos.'
                  : '“Batida de pino” no motor: chamas frias acontecem na Terra dentro de cilindros antes da faísca. Na ISS, sem convecção, ficam estáveis por dezenas de segundos.'}
            </li>
            <li className="wrap-anywhere">
              •{' '}
              {lang === 'en'
                ? 'Kitchen stove vs. Inverse flame: on a stove, fuel flows into O₂ air. If an oxygen pipe leaks into fuel vapors in space, an inverse flame burns outward from the leak.'
                : lang === 'es'
                  ? 'Cocina vs. Llama inversa: en casa el gas sale al aire. Si el oxígeno se fuga hacia vapores combustibles, arde de dentro hacia fuera.'
                  : 'Fogão vs. Chama Inversa: no fogão sai gás para o ar. Em vazamentos de oxigênio numa nave, o O₂ cria uma chama inversa queimando de dentro para fora.'}
            </li>
          </ul>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121A30] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="wrap-anywhere">{tStr.insights.lunarWhyTitle}</span>
          </div>
          <p className="wrap-anywhere mt-2 text-xs text-slate-300">
            {lang === 'en'
              ? 'At 14.7 psi on Earth, 78% nitrogen absorbs heat like a thermal brake. In Lunar habitats (≤ 10.2 psi, ≥ 30% O₂), less nitrogen leaves sparks hotter and lets silent cool flames re-ignite.'
              : lang === 'es'
                ? 'A 14,7 psi en la Tierra, el 78% de nitrógeno frena el calor. En hábitats lunares (≤ 10,2 psi, ≥ 30% O₂), hay menos nitrógeno y las llamas frías silenciosas pueden reactivar un fuego.'
                : 'Na Terra (21% O₂ e 14,7 psi), o nitrogênio absorve calor como um freio térmico. Em habitats lunares (≤ 10,2 psi e O₂ ≥ 30%), há menos nitrogênio e uma chama fria silenciosa pode reiniciar um incêndio.'}{' '}
            <Flame className="inline h-3 w-3 text-purple-400" />
          </p>
        </div>
      </div>
    </div>
  );
};
