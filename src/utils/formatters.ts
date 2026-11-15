import type { AppLanguage, Psi159Test } from '../types/psi159';

export function formatNumber(
  value: number | null | undefined,
  decimals = 2,
  lang: AppLanguage = 'pt'
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fuelLabel(fuel: string, lang: AppLanguage = 'pt'): string {
  if (lang === 'en') {
    if (fuel === 'ethane') return 'Ethane';
    if (fuel === 'propane') return 'Propane';
    if (fuel === 'butane') return 'Butane';
    return fuel;
  }
  switch (fuel) {
    case 'ethane':
      return 'Etano';
    case 'propane':
      return 'Propano';
    case 'butane':
      return 'Butano';
    default:
      return fuel;
  }
}

export function fuelColorHex(fuel: string): string {
  switch (fuel) {
    case 'ethane':
      return '#06B6D4';
    case 'propane':
      return '#F97316';
    case 'butane':
      return '#A855F7';
    default:
      return '#94A3B8';
  }
}

export function flameTypeLabel(type: string, lang: AppLanguage = 'pt'): string {
  if (lang === 'en') return type === 'inverse' ? 'Inverse' : 'Normal';
  if (lang === 'es') return type === 'inverse' ? 'Inversa' : 'Normal';
  return type === 'inverse' ? 'Inversa' : 'Normal';
}

export function locationLabel(loc: string, lang: AppLanguage = 'pt'): string {
  if (lang === 'en') {
    if (loc === 'chamber') return 'Chamber';
    if (loc === 'burner_flow') return 'Burner';
    return loc;
  }
  if (lang === 'es') {
    if (loc === 'chamber') return 'Cámara';
    if (loc === 'burner_flow') return 'Quemador';
    return loc;
  }
  if (loc === 'chamber') return 'Câmara';
  if (loc === 'burner_flow') return 'Queimador';
  return loc;
}

export function outcomeLabel(outcome: string, lang: AppLanguage = 'pt'): string {
  if (lang === 'en') {
    switch (outcome) {
      case 'no_ignition':
        return 'No ignition';
      case 'self_extinguished':
        return 'Self-extinguished';
      case 'flow_terminated':
        return 'Flow terminated';
      case 'flash_only':
        return 'Flash only';
      case 'cool_flame_only':
        return 'Cool flame only';
      default:
        return outcome;
    }
  }
  if (lang === 'es') {
    switch (outcome) {
      case 'no_ignition':
        return 'Sin ignición';
      case 'self_extinguished':
        return 'Autoextinguida';
      case 'flow_terminated':
        return 'Flujo cortado';
      case 'flash_only':
        return 'Solo destello';
      case 'cool_flame_only':
        return 'Solo llama fría';
      default:
        return outcome;
    }
  }
  switch (outcome) {
    case 'no_ignition':
      return 'Sem ignição';
    case 'self_extinguished':
      return 'Apagou sozinha';
    case 'flow_terminated':
      return 'Fluxo cortado';
    case 'flash_only':
      return 'Só clarão';
    case 'cool_flame_only':
      return 'Só chama fria';
    default:
      return outcome;
  }
}

export function outcomeShortLabel(
  outcome: string,
  lang: AppLanguage = 'pt'
): string {
  if (lang === 'en') {
    switch (outcome) {
      case 'no_ignition':
        return 'No ignition';
      case 'self_extinguished':
        return 'Self-exting.';
      case 'flow_terminated':
        return 'Flow cutoff';
      case 'flash_only':
        return 'Flash only';
      case 'cool_flame_only':
        return 'Cool only';
      default:
        return outcome.slice(0, 14);
    }
  }
  if (lang === 'es') {
    switch (outcome) {
      case 'no_ignition':
        return 'Sin ignición';
      case 'self_extinguished':
        return 'Autoapagada';
      case 'flow_terminated':
        return 'Flujo cortado';
      case 'flash_only':
        return 'Solo destello';
      case 'cool_flame_only':
        return 'Solo fría';
      default:
        return outcome.slice(0, 14);
    }
  }
  switch (outcome) {
    case 'no_ignition':
      return 'Sem ignição';
    case 'self_extinguished':
      return 'Apagou só';
    case 'flow_terminated':
      return 'Fluxo cortado';
    case 'flash_only':
      return 'Só clarão';
    case 'cool_flame_only':
      return 'Só fria';
    default:
      return outcome.slice(0, 14);
  }
}

export function outcomeMeta(
  outcome: string,
  lang: AppLanguage = 'pt'
): {
  label: string;
  color: string;
  badgeClass: string;
  glyph: string;
} {
  const label = outcomeLabel(outcome, lang);
  switch (outcome) {
    case 'self_extinguished':
      return {
        label,
        color: '#38BDF8',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        glyph: '●',
      };
    case 'flow_terminated':
      return {
        label,
        color: '#06B6D4',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        glyph: '■',
      };
    case 'no_ignition':
      return {
        label,
        color: '#64748B',
        badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        glyph: '✕',
      };
    case 'flash_only':
      return {
        label,
        color: '#F59E0B',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        glyph: '▲',
      };
    case 'cool_flame_only':
      return {
        label,
        color: '#A855F7',
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        glyph: '◆',
      };
    default:
      return {
        label,
        color: '#94A3B8',
        badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        glyph: '•',
      };
  }
}

export function testCategoryColor(t: Psi159Test): string {
  if (t.cool_flame || t.ignition_type === 'cool') return '#A855F7';
  if (t.hit_burner_temp_limit) return '#EF4444';
  if (!t.ignited) return '#64748B';
  if (t.flame_type === 'inverse') return '#F97316';
  return '#06B6D4';
}

export function flameColorLabel(
  color: string | null,
  lang: AppLanguage = 'pt'
): string {
  if (!color) {
    return lang === 'en' ? 'Not recorded' : lang === 'es' ? 'No registrada' : 'Não registrada';
  }
  if (lang === 'en') {
    if (color === 'blue') return 'Blue';
    if (color === 'yellow') return 'Yellow (sooting)';
    if (color === 'yellow-blue') return 'Yellow-blue';
    return color;
  }
  if (lang === 'es') {
    if (color === 'blue') return 'Azul';
    if (color === 'yellow') return 'Amarilla (hollín)';
    if (color === 'yellow-blue') return 'Amarilla-azul';
    return color;
  }
  switch (color) {
    case 'blue':
      return 'Azul';
    case 'yellow':
      return 'Amarela (fuligem)';
    case 'yellow-blue':
      return 'Amarela-azul';
    default:
      return color;
  }
}

export function qualityNotesLabel(
  notes: string | null,
  lang: AppLanguage = 'pt'
): string | null {
  if (!notes) return null;
  const map: Record<string, string> =
    lang === 'en'
      ? {
          teste_abortado: 'Aborted test',
          dados_perdidos: 'Missing data',
          chama_nao_esferica: 'Non-spherical flame',
          repeticao: 'Repeated test',
          sem_nitrogenio: 'No nitrogen flow',
        }
      : lang === 'es'
        ? {
            teste_abortado: 'Ensayo abortado',
            dados_perdidos: 'Datos perdidos',
            chama_nao_esferica: 'Llama no esférica',
            repeticao: 'Repetición de ensayo',
            sem_nitrogenio: 'Sin flujo de nitrógeno',
          }
        : {
            teste_abortado: 'Teste abortado',
            dados_perdidos: 'Dados perdidos',
            chama_nao_esferica: 'Chama não esférica',
            repeticao: 'Repetição de ensaio',
            sem_nitrogenio: 'Sem fluxo de nitrogênio',
          };
  return notes
    .split(';')
    .map((n) => map[n.trim()] ?? n.trim())
    .join(' · ');
}
