import React, { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  safePolygon,
  type Placement,
} from '@floating-ui/react';
import { HelpCircle } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';

export interface InfoTooltipProps {
  term?: string;
  title?: string;
  body?: string;
  note?: string;
  unit?: string;
  labelOverride?: string;
  preferredPlacement?: Placement;
  className?: string;
}

const FALLBACK_TERMS: Record<
  string,
  { title: string; unit?: string; body: string; note?: string }
> = {
  o2_fraction: {
    title: 'Fração de O₂ inicial',
    unit: 'mol/mol (0–1)',
    body: 'Proporção de oxigênio na mistura da câmara antes da ignição. A Terra tem ~21%; a Zona Lunar planeja ≥ 30%.',
  },
  o2_fraction_after: {
    title: 'Fração de O₂ final',
    unit: 'mol/mol (0–1)',
    body: 'Concentração de oxigênio medida na câmara após a queima ou extinção do ensaio.',
  },
  o2_location: {
    title: 'Local do O₂',
    body: 'Indica onde o oxigênio estava: na atmosfera da câmara (chama normal) ou fluindo pelo queimador (chama inversa).',
  },
  pressure_psi: {
    title: 'Pressão da Câmara',
    unit: 'psi / bar',
    body: 'Pressão absoluta dentro da câmara CFI-G. O nível do mar na Terra é 14,7 psi; habitats lunares operam até 10,2 psi.',
  },
  hc_flow_mg_s: {
    title: 'Fluxo de Hidrocarboneto',
    unit: 'mg/s',
    body: 'Vazão mássica de combustível gasoso (etano, propano ou butano) alimentando o experimento.',
  },
  o2_flow_mg_s: {
    title: 'Fluxo de Oxigênio',
    unit: 'mg/s',
    body: 'Vazão mássica de O₂ injetada diretamente pelo queimador poroso nos ensaios de chama inversa.',
  },
  burn_time_s: {
    title: 'Tempo de Queima',
    unit: 's',
    body: 'Duração total da chama sustentada até a extinção ou corte programado de fluxo.',
  },
  peak_burner_temp_c: {
    title: 'Pico Térmico no Queimador',
    unit: '°C / K',
    body: 'Maior temperatura atingida na superfície do queimador esférico poroso durante o ensaio.',
  },
  tad_k: {
    title: 'Temperatura Adiabática (T_ad)',
    unit: 'K',
    body: 'Temperatura teórica máxima de chama calculada para a estequiometria da mistura sem perdas de calor.',
  },
  zst: {
    title: 'Fração de Mistura Estequiométrica (Zst)',
    body: 'Proporção mássica combustível/oxidante em que ambos são consumidos por completo na reação.',
  },
  flame_color: {
    title: 'Cor da Chama',
    body: 'Aparência visual registrada pelas câmeras (azul, amarela, mista ou invisível/fraca em chamas frias).',
  },
  flame_type: {
    title: 'Tipo de Chama (Normal × Inversa)',
    body: 'Normal: combustível sai do queimador para o O₂ da câmara. Inversa: O₂ sai do queimador para atmosfera rica em combustível.',
  },
  tfp: {
    title: 'TFP (Thermocouple Flame Probe)',
    body: 'Indica se a sonda termopar intrusiva de medição térmica esteve inserida durante este ensaio.',
  },
  cool_flame: {
    title: 'Chama Fria',
    body: 'Combustão de baixa temperatura (~400–600 °C), quase invisível a olho nu, que pode persistir após a chama quente apagar.',
  },
  outcome: {
    title: 'Desfecho do Ensaio',
    body: 'Classificação final: queima até extinção, corte de fluxo, limite térmico (≥ 600 °C), flash ou sem ignição.',
  },
};

function computeEdgeAwarePlacement(
  triggerEl: Element | null,
  explicit?: Placement
): Placement {
  if (explicit) return explicit;
  if (!triggerEl || typeof window === 'undefined') return 'bottom';
  const rect = triggerEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const vw = window.innerWidth;
  if (centerX >= vw * 0.55) return 'left';
  if (centerX <= vw * 0.35) return 'right';
  return 'bottom';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  term,
  title,
  body,
  note,
  unit,
  labelOverride,
  preferredPlacement,
  className = '',
}) => {
  const dictionary = usePsiStore((s) => s.dictionary);
  const [open, setOpen] = useState(false);
  const [dynamicPlacement, setDynamicPlacement] = useState<Placement>(
    preferredPlacement ?? 'bottom'
  );
  const tooltipId = useId();

  const dictEntry = useMemo(
    () => (term ? dictionary.find((d) => d.coluna === term) : undefined),
    [dictionary, term]
  );

  const fallback = term ? FALLBACK_TERMS[term] : undefined;

  const resolvedTitle =
    title ?? labelOverride ?? dictEntry?.rotulo ?? fallback?.title ?? term ?? '';
  const resolvedBody =
    body ?? dictEntry?.explicacao_simples ?? fallback?.body ?? '';
  const resolvedUnit =
    unit ??
    (dictEntry?.unidade && dictEntry.unidade !== '-'
      ? dictEntry.unidade
      : fallback?.unit);
  const resolvedNote =
    note ??
    (dictEntry?.observacao_tecnica && dictEntry.observacao_tecnica !== '-'
      ? dictEntry.observacao_tecnica
      : fallback?.note);

  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open,
    onOpenChange: (nextOpen) => {
      if (nextOpen) {
        setDynamicPlacement(
          computeEdgeAwarePlacement(
            refs.reference.current as Element | null,
            preferredPlacement
          )
        );
      }
      setOpen(nextOpen);
    },
    placement: dynamicPlacement,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ['left', 'right', 'bottom', 'top'],
        padding: 8,
      }),
      shift({ padding: 8 }),
    ],
  });

  const hover = useHover(context, {
    delay: { open: 150, close: 120 },
    handleClose: safePolygon({ buffer: 4 }),
  });
  const focus = useFocus(context);
  const click = useClick(context, { toggle: true });
  const dismiss = useDismiss(context, {
    outsidePress: true,
    escapeKey: true,
  });
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  if (!resolvedBody && !resolvedTitle) return null;

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        aria-label={`Ajuda: ${resolvedTitle}`}
        aria-describedby={open ? tooltipId : undefined}
        {...getReferenceProps({
          onClick: (e) => {
            e.stopPropagation();
          },
        })}
        className={`inline-flex min-h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-full p-0.5 text-[#B4C3D8] transition-colors hover:bg-slate-800 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${className}`}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={refs.setFloating}
            id={tooltipId}
            role="tooltip"
            style={{
              ...floatingStyles,
              zIndex: 'var(--z-tooltip)',
              visibility: isPositioned ? 'visible' : 'hidden',
            }}
            {...getFloatingProps()}
            className="wrap-anywhere w-max max-w-[min(240px,calc(100vw-16px))] rounded-lg border border-slate-600 bg-[#0F172A] p-[11px] text-left text-[13px] leading-[1.45] text-slate-100 shadow-2xl shadow-black/85 sm:max-w-[min(280px,calc(100vw-16px))]"
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span className="wrap-anywhere text-[13px] font-semibold leading-[1.4] text-cyan-300">
                {resolvedTitle}
              </span>
              {resolvedUnit && (
                <span className="whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[13px] leading-[1.2] text-cyan-200">
                  {resolvedUnit}
                </span>
              )}
            </div>
            {resolvedBody && (
              <p className="wrap-anywhere m-0 text-[13px] leading-[1.45] text-slate-200">
                {resolvedBody}
              </p>
            )}
            {resolvedNote && (
              <p className="wrap-anywhere mt-1.5 border-t border-slate-700/80 pt-1.5 text-[13px] leading-[1.45] text-[#B4C3D8]">
                {resolvedNote}
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
