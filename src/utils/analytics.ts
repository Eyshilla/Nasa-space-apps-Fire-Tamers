import type {
  ComputedKpis,
  DiscoveryCard,
  GlobalFilters,
  LunarRankedTest,
  Psi159Test,
} from '../types/psi159';

export const LUNAR_O2_MIN = 0.3;
export const LUNAR_PSI_MAX = 10.2;

export function isInLunarZone(t: Psi159Test): boolean {
  return t.o2_fraction >= LUNAR_O2_MIN && t.pressure_psi <= LUNAR_PSI_MAX;
}

export function applyGlobalFilters(
  tests: Psi159Test[],
  filters: GlobalFilters
): Psi159Test[] {
  const crossSet = filters.crossFilter
    ? new Set(filters.crossFilter.testIds)
    : null;

  return tests.filter((t) => {
    if (filters.fuels.length > 0 && !filters.fuels.includes(t.fuel)) {
      return false;
    }
    if (
      filters.flameTypes.length > 0 &&
      !filters.flameTypes.includes(t.flame_type)
    ) {
      return false;
    }
    if (
      t.o2_fraction < filters.o2Range[0] - 1e-6 ||
      t.o2_fraction > filters.o2Range[1] + 1e-6
    ) {
      return false;
    }
    if (
      t.pressure_psi < filters.psiRange[0] - 1e-6 ||
      t.pressure_psi > filters.psiRange[1] + 1e-6
    ) {
      return false;
    }
    if (
      filters.outcomes.length > 0 &&
      !filters.outcomes.includes(t.outcome)
    ) {
      return false;
    }
    if (filters.onlyCoolFlames && !t.cool_flame) {
      return false;
    }
    if (crossSet && !crossSet.has(t.test_id)) {
      return false;
    }
    return true;
  });
}

export function computeKpis(filtered: Psi159Test[]): ComputedKpis {
  const total = filtered.length;
  if (total === 0) {
    return {
      total: 0,
      ignitedCount: 0,
      ignitedPct: 0,
      coolFlameCount: 0,
      maxPeakTempC: null,
      maxPeakTempTestId: null,
      avgBurnTimeS: 0,
      maxBurnTimeS: 0,
      maxBurnTestId: null,
      o2Min: null,
      o2Max: null,
      psiMin: null,
      psiMax: null,
      lunarZoneCount: 0,
      lunarZonePct: 0,
      tempLimitCount: 0,
      dailyCounts: Array(12).fill(0),
    };
  }

  let ignitedCount = 0;
  let coolFlameCount = 0;
  let maxPeakTempC: number | null = null;
  let maxPeakTempTestId: string | null = null;
  let burnSum = 0;
  let burnCount = 0;
  let maxBurnTimeS = 0;
  let maxBurnTestId: string | null = null;
  let o2Min = Infinity;
  let o2Max = -Infinity;
  let psiMin = Infinity;
  let psiMax = -Infinity;
  let lunarZoneCount = 0;
  let tempLimitCount = 0;
  const dailyCounts = Array(12).fill(0);

  for (const t of filtered) {
    if (t.ignited) ignitedCount++;
    if (t.cool_flame) coolFlameCount++;
    if (t.hit_burner_temp_limit) tempLimitCount++;
    if (isInLunarZone(t)) lunarZoneCount++;

    if (
      t.peak_burner_temp_c !== null &&
      (maxPeakTempC === null || t.peak_burner_temp_c > maxPeakTempC)
    ) {
      maxPeakTempC = t.peak_burner_temp_c;
      maxPeakTempTestId = t.test_id;
    }

    if (t.burn_time_s !== null) {
      burnSum += t.burn_time_s;
      burnCount++;
      if (t.burn_time_s >= maxBurnTimeS) {
        maxBurnTimeS = t.burn_time_s;
        maxBurnTestId = t.test_id;
      }
    }

    if (t.o2_fraction < o2Min) o2Min = t.o2_fraction;
    if (t.o2_fraction > o2Max) o2Max = t.o2_fraction;
    if (t.pressure_psi < psiMin) psiMin = t.pressure_psi;
    if (t.pressure_psi > psiMax) psiMax = t.pressure_psi;

    if (t.day >= 1 && t.day <= 12) {
      dailyCounts[t.day - 1]++;
    }
  }

  return {
    total,
    ignitedCount,
    ignitedPct: (ignitedCount / total) * 100,
    coolFlameCount,
    maxPeakTempC,
    maxPeakTempTestId,
    avgBurnTimeS: burnCount > 0 ? burnSum / burnCount : 0,
    maxBurnTimeS,
    maxBurnTestId,
    o2Min,
    o2Max,
    psiMin,
    psiMax,
    lunarZoneCount,
    lunarZonePct: (lunarZoneCount / total) * 100,
    tempLimitCount,
    dailyCounts,
  };
}

/**
 * Transparent Lunar Base safety score (0 - 100):
 * - Proximidade da Zona Lunar (max 40 pts): 25 pts if O2 >= 0.30 & psi <= 10.2 (otherwise partial by O2/psi distance) + 15 pts for higher O2 above 0.30
 * - Chama Fria (max 25 pts): 25 pts if cool_flame === true (hard-to-detect silent combustion risk)
 * - Pico Térmico (max 20 pts): scaled up to 650 °C (plus +5 bonus if hit_burner_temp_limit)
 * - Duração da Queima (max 15 pts): scaled up to 250 s
 */
export function computeLunarTop10(filtered: Psi159Test[]): LunarRankedTest[] {
  const scored: LunarRankedTest[] = filtered.map((t) => {
    const inZone = isInLunarZone(t);
    let lunarZonePts = 0;
    if (inZone) {
      lunarZonePts = 28 + Math.min(12, ((t.o2_fraction - 0.3) / 0.55) * 12);
    } else {
      const o2Score = Math.min(1, t.o2_fraction / 0.3) * 10;
      const psiScore =
        t.pressure_psi <= 10.2
          ? 10
          : Math.max(0, 10 - ((t.pressure_psi - 10.2) / 38) * 10);
      lunarZonePts = o2Score + psiScore;
    }

    const coolFlamePts = t.cool_flame ? 25 : 0;

    const tempVal = t.peak_burner_temp_c ?? 25;
    const thermalBase = Math.min(15, Math.max(0, ((tempVal - 25) / 625) * 15));
    const thermalPts = thermalBase + (t.hit_burner_temp_limit ? 5 : 0);

    const burnVal = t.burn_time_s ?? 0;
    const burnPts = Math.min(15, (burnVal / 250) * 15);

    const score = Math.round(
      (lunarZonePts + coolFlamePts + thermalPts + burnPts) * 10
    ) / 10;

    return {
      test: t,
      score,
      breakdown: {
        lunarZonePts: Math.round(lunarZonePts * 10) / 10,
        coolFlamePts,
        thermalPts: Math.round(thermalPts * 10) / 10,
        burnPts: Math.round(burnPts * 10) / 10,
      },
      inLunarZone: inZone,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

export function computeDiscoveries(
  filtered: Psi159Test[],
  lang: 'pt' | 'en' | 'es' = 'pt'
): DiscoveryCard[] {
  if (filtered.length === 0) return [];

  const cards: DiscoveryCard[] = [];

  // 1. High O2 (>= 30%) ignition & thermal limit rate
  const highO2 = filtered.filter((t) => t.o2_fraction >= 0.3);
  if (highO2.length > 0) {
    const highO2Ignited = highO2.filter((t) => t.ignited).length;
    const highO2Limit = highO2.filter((t) => t.hit_burner_temp_limit).length;
    const pctIgn = ((highO2Ignited / highO2.length) * 100).toFixed(1).replace('.', ',');
    const pctLim = ((highO2Limit / highO2.length) * 100).toFixed(1).replace('.', ',');
    cards.push({
      id: 'disc-o2',
      title:
        lang === 'en'
          ? 'Risk at O₂ ≥ 30% (lunar O₂)'
          : lang === 'es'
            ? 'Riesgo con O₂ ≥ 30% (lunar)'
            : 'Risco com O₂ ≥ 30% (atmosfera lunar)',
      metric:
        lang === 'en'
          ? `${pctIgn}% ignited`
          : lang === 'es'
            ? `${pctIgn}% encendieron`
            : `${pctIgn}% acenderam`,
      description:
        lang === 'en'
          ? `Across ${highO2.length} filtered tests with O₂ ≥ 30%, ${highO2Ignited} ignited and ${highO2Limit} (${pctLim}%) hit the burner thermal limit.`
          : lang === 'es'
            ? `En ${highO2.length} ensayos filtrados con O₂ ≥ 30%, ${highO2Ignited} encendieron y ${highO2Limit} (${pctLim}%) alcanzaron el límite térmico.`
            : `Nos ${highO2.length} ensaios filtrados com O₂ ≥ 30%, ${highO2Ignited} entraram em ignição e ${highO2Limit} (${pctLim}%) atingiram o limite térmico do queimador.`,
      tone: 'red',
    });
  }

  // 2. Lunar Zone specific finding
  const lunar = filtered.filter(isInLunarZone);
  if (lunar.length > 0) {
    const lunarIgnited = lunar.filter((t) => t.ignited).length;
    const lunarMaxTemp = lunar.reduce(
      (m, t) =>
        t.peak_burner_temp_c !== null && t.peak_burner_temp_c > m
          ? t.peak_burner_temp_c
          : m,
      0
    );
    const pctL = ((lunarIgnited / lunar.length) * 100).toFixed(1).replace('.', ',');
    const tempStr = lunarMaxTemp.toFixed(1).replace('.', ',');
    cards.push({
      id: 'disc-lunar',
      title:
        lang === 'en'
          ? 'Inside Lunar Zone'
          : lang === 'es'
            ? 'Dentro de la Zona Lunar'
            : 'Comportamento dentro da Zona Lunar',
      metric:
        lang === 'en'
          ? `${lunarIgnited}/${lunar.length} ignited`
          : lang === 'es'
            ? `${lunarIgnited}/${lunar.length} con ignición`
            : `${lunarIgnited}/${lunar.length} com ignição`,
      description:
        lang === 'en'
          ? `At O₂ ≥ 30% and P ≤ 10.2 psi, ${pctL}% ignited, reaching ${tempStr} °C on the burner.`
          : lang === 'es'
            ? `Con O₂ ≥ 30% y P ≤ 10,2 psi, el ${pctL}% encendió, llegando a ${tempStr} °C.`
            : `Com O₂ ≥ 30% e pressão ≤ 10,2 psi, ${pctL}% dos testes acenderam, chegando a ${tempStr} °C no queimador.`,
      tone: 'emerald',
    });
  } else {
    cards.push({
      id: 'disc-lunar-empty',
      title:
        lang === 'en'
          ? 'Lunar Zone in filters'
          : lang === 'es'
            ? 'Zona Lunar en filtros'
            : 'Zona Lunar nos filtros atuais',
      metric: lang === 'en' ? '0 tests' : '0 ensaios',
      description:
        lang === 'en'
          ? 'No selected tests simultaneously satisfy O₂ ≥ 30% and pressure ≤ 10.2 psi.'
          : lang === 'es'
            ? 'Ningún ensayo seleccionado cumple O₂ ≥ 30% y presión ≤ 10,2 psi a la vez.'
            : 'Nenhum dos ensaios selecionados está simultaneamente com O₂ ≥ 30% e pressão ≤ 10,2 psi.',
      tone: 'emerald',
    });
  }

  // 3. Normal vs Inverse burn duration comparison
  const normal = filtered.filter((t) => t.flame_type === 'normal');
  const inverse = filtered.filter((t) => t.flame_type === 'inverse');
  if (normal.length > 0 && inverse.length > 0) {
    const avgNormBurn =
      normal.reduce((s, t) => s + (t.burn_time_s ?? 0), 0) / normal.length;
    const avgInvBurn =
      inverse.reduce((s, t) => s + (t.burn_time_s ?? 0), 0) / inverse.length;
    const nStr = avgNormBurn.toFixed(1).replace('.', ',');
    const iStr = avgInvBurn.toFixed(1).replace('.', ',');
    cards.push({
      id: 'disc-flame-type',
      title:
        lang === 'en'
          ? 'Burn time: Normal vs. Inverse'
          : lang === 'es'
            ? 'Duración: Normal vs. Inversa'
            : 'Duração: Normal vs. Inversa',
      metric: `${nStr} s vs ${iStr} s`,
      description:
        lang === 'en'
          ? `Normal flames average ${nStr} s (${normal.length} tests) vs. ${iStr} s for inverse flames (${inverse.length} tests).`
          : lang === 'es'
            ? `Las llamas normales duran ${nStr} s de media (${normal.length} ensayos) frente a ${iStr} s en inversas (${inverse.length}).`
            : `Nas condições filtradas, chamas normais duram em média ${nStr} s (${normal.length} testes), enquanto chamas inversas duram ${iStr} s (${inverse.length} testes).`,
      tone: 'cyan',
    });
  }

  // 4. Cool flames concentration
  const cool = filtered.filter((t) => t.cool_flame);
  if (cool.length > 0) {
    const minPsi = Math.min(...cool.map((c) => c.pressure_psi)).toFixed(2).replace('.', ',');
    const maxPsi = Math.max(...cool.map((c) => c.pressure_psi)).toFixed(2).replace('.', ',');
    cards.push({
      id: 'disc-cool',
      title:
        lang === 'en'
          ? 'Cool Flame Window'
          : lang === 'es'
            ? 'Ventana de Llamas Frías'
            : 'Janela de Chamas Frias',
      metric:
        lang === 'en'
          ? `${cool.length} occurrence${cool.length > 1 ? 's' : ''}`
          : `${cool.length} ${lang === 'es' ? 'casos' : `ocorrência${cool.length > 1 ? 's' : ''}`}`,
      description:
        lang === 'en'
          ? `Observed between ${minPsi} and ${maxPsi} psi, sustaining low-temperature reactions even without hot visible flame.`
          : lang === 'es'
            ? `Detectadas entre ${minPsi} y ${maxPsi} psi, con reacción silenciosa incluso sin llama caliente visible.`
            : `Detectadas entre ${minPsi} e ${maxPsi} psi, com queima silenciosa mesmo quando não há chama quente visível.`,
      tone: 'purple',
    });
  } else {
    const lowFlow = filtered.filter((t) => t.hc_flow_mg_s > 0 && t.hc_flow_mg_s <= 0.8);
    const lowFlowTemp =
      lowFlow.filter((t) => t.peak_burner_temp_c !== null).length > 0
        ? lowFlow.reduce((s, t) => s + (t.peak_burner_temp_c ?? 0), 0) /
          lowFlow.filter((t) => t.peak_burner_temp_c !== null).length
        : 0;
    cards.push({
      id: 'disc-flow',
      title:
        lang === 'en'
          ? 'Low flow heats burner more'
          : lang === 'es'
            ? 'Bajo flujo calienta más'
            : 'Vazão baixa aquece mais o bico',
      metric: `${lowFlowTemp.toFixed(0)} °C`,
      description:
        lang === 'en'
          ? `In ${lowFlow.length} tests at flow ≤ 0.8 mg/s, the flame sits closer to the burner, averaging ${lowFlowTemp.toFixed(1)} °C.`
          : lang === 'es'
            ? `En ${lowFlow.length} ensayos con flujo ≤ 0,8 mg/s, la llama queda más cerca y promedia ${lowFlowTemp.toFixed(1)} °C.`
            : `Nos ${lowFlow.length} testes com vazão ≤ 0,8 mg/s, a chama fica mais próxima do queimador, elevando a temperatura média para ${lowFlowTemp.toFixed(1).replace('.', ',')} °C.`,
      tone: 'amber',
    });
  }

  return cards;
}

// Deterministic pseudo-jitter in [-0.5, 0.5] from test_id so overlapping points spread reproducibly
export function deterministicJitter(testId: string, salt = 0): number {
  let hash = 2166136261 ^ salt;
  for (let i = 0; i < testId.length; i++) {
    hash ^= testId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 4294967295) - 0.5;
}
