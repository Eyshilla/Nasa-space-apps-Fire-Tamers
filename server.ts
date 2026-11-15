import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { Psi159Test, QuizQuestion } from './src/types/psi159.ts';
import { parsePsi159Dataset } from './src/utils/parsePsi159.ts';

const dictPath = path.resolve(
  process.cwd(),
  'public/assets/aistudio/dicionario_dados_a4c7d2bd.csv'
);
const dataPath = path.resolve(
  process.cwd(),
  'public/assets/aistudio/psi159_unificado_f4d98f38.csv'
);

const rawDictionaryCsv = fs.readFileSync(dictPath, 'utf-8');
const rawDataCsv = fs.readFileSync(dataPath, 'utf-8');

const dataset = parsePsi159Dataset(rawDictionaryCsv, rawDataCsv);
const validTestIds = dataset.tests.map((t) => t.test_id);
const sortedTestIdsByLength = [...validTestIds].sort((a, b) => b.length - a.length);

function extractCitedTestIds(text: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const id of sortedTestIdsByLength) {
    if (!seen.has(id)) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`);
      if (regex.test(text)) {
        seen.add(id);
        found.push(id);
      }
    }
  }
  return found;
}

type ApiLanguageCode = 'pt-BR' | 'en' | 'es';

function normalizeApiLanguage(raw?: string): ApiLanguageCode {
  const val = (raw ?? '').trim().toLowerCase();
  if (val === 'en' || val.startsWith('en-')) return 'en';
  if (val === 'es' || val.startsWith('es-')) return 'es';
  return 'pt-BR';
}

function getLanguageName(lang: ApiLanguageCode): string {
  if (lang === 'en') return 'English';
  if (lang === 'es') return 'Spanish';
  return 'Portuguese (Brazil)';
}

function getLocalizedCsvVocabulary(lang: ApiLanguageCode): string {
  if (lang === 'en') {
    return `Localized vocabulary for CSV column values and labels (explain in English; keep technical symbols Zst, T_ad, TFP, Test ID, psi, bar, mg/s, °C, K as-is):
- flame_type: "normal" -> Normal flame (fuel exits burner into O₂ chamber); "inverse" -> Inverse flame (O₂ exits burner into fuel-rich chamber)
- fuel: "ethane" -> Ethane; "propane" -> Propane; "butane" -> Butane
- outcome: "no_ignition" -> No ignition; "self_extinguished" -> Self-extinguished; "flow_terminated" -> Flow terminated; "flash_only" -> Flash only; "cool_flame_only" -> Cool flame only
- o2_location / fuel_location: "chamber" -> Chamber; "burner_flow" -> Burner flow
- quality_notes: "teste_abortado" -> Aborted test; "dados_perdidos" -> Missing data; "chama_nao_esferica" -> Non-spherical flame; "repeticao" -> Repeated test; "sem_nitrogenio" -> No nitrogen flow`;
  }
  if (lang === 'es') {
    return `Vocabulario localizado para columnas y valores del CSV (explica en Español; mantén intactos los símbolos técnicos Zst, T_ad, TFP, Test ID, psi, bar, mg/s, °C, K):
- flame_type: "normal" -> Llama normal (combustible sale del quemador hacia O₂); "inverse" -> Llama inversa (O₂ sale del quemador hacia atmósfera combustible)
- fuel: "ethane" -> Etano; "propane" -> Propano; "butane" -> Butano
- outcome: "no_ignition" -> Sin ignición; "self_extinguished" -> Autoextinguida; "flow_terminated" -> Flujo cortado; "flash_only" -> Solo destello; "cool_flame_only" -> Solo llama fría
- o2_location / fuel_location: "chamber" -> Cámara; "burner_flow" -> Quemador
- quality_notes: "teste_abortado" -> Ensayo abortado; "dados_perdidos" -> Datos perdidos; "chama_nao_esferica" -> Llama no esférica; "repeticao" -> Repetición de ensayo; "sem_nitrogenio" -> Sin flujo de nitrógeno`;
  }
  return `Vocabulário localizado para colunas e valores do CSV (explique em Português do Brasil; mantenha siglas técnicas Zst, T_ad, TFP, Test ID, psi, bar, mg/s, °C, K como estão):
- flame_type: "normal" -> Chama normal; "inverse" -> Chama inversa
- fuel: "ethane" -> Etano; "propane" -> Propano; "butane" -> Butano
- outcome: "no_ignition" -> Sem ignição; "self_extinguished" -> Apagou sozinha; "flow_terminated" -> Fluxo cortado; "flash_only" -> Só clarão; "cool_flame_only" -> Só chama fria`;
}

function localizedServerError(
  lang: ApiLanguageCode,
  kind: 'missing_key' | 'empty_messages' | 'chat_failed' | 'quiz_failed' | 'quiz_lang_mismatch',
  detail = ''
): string {
  if (lang === 'en') {
    switch (kind) {
      case 'missing_key':
        return 'Gemini API key is not configured on the server (GEMINI_API_KEY). Check Settings > Secrets.';
      case 'empty_messages':
        return 'Please send at least one question.';
      case 'chat_failed':
        return `Failed to query Fire Tamers Mentor: ${detail}`;
      case 'quiz_failed':
        return `Failed to generate quiz: ${detail}`;
      case 'quiz_lang_mismatch':
        return `Generated quiz did not match the active language (${detail}). Please try again.`;
    }
  }
  if (lang === 'es') {
    switch (kind) {
      case 'missing_key':
        return 'La clave de la API Gemini no está configurada en el servidor (GEMINI_API_KEY). Revisa Settings > Secrets.';
      case 'empty_messages':
        return 'Envía al menos una pregunta.';
      case 'chat_failed':
        return `Error al consultar al Mentor Fire Tamers: ${detail}`;
      case 'quiz_failed':
        return `Error al generar el quiz: ${detail}`;
      case 'quiz_lang_mismatch':
        return `El quiz generado no coincidió con el idioma activo (${detail}). Inténtalo de nuevo.`;
    }
  }
  switch (kind) {
    case 'missing_key':
      return 'Chave da API Gemini não configurada no servidor (GEMINI_API_KEY). Verifique Settings > Secrets.';
    case 'empty_messages':
      return 'Envie pelo menos uma pergunta.';
    case 'chat_failed':
      return `Falha ao consultar o Mentor Fire Tamers: ${detail}`;
    case 'quiz_failed':
      return `Erro ao gerar quiz: ${detail}`;
    case 'quiz_lang_mismatch':
      return `O quiz gerado não correspondeu ao idioma ativo (${detail}). Tente novamente.`;
  }
}

function isQuotaExceededError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  return (
    raw.includes('429') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    /exceeded your current quota/i.test(raw) ||
    /rate[- ]limit/i.test(raw)
  );
}

function extractRetryHint(raw: string): string | null {
  const retryInMatch = raw.match(/Please retry in\s+([0-9]+h[0-9]+m|[0-9]+m[0-9]+s|[0-9]+(?:\.[0-9]+)?s)/i);
  if (retryInMatch?.[1]) {
    return retryInMatch[1].replace(/\.[0-9]+s$/, 's');
  }
  const delayMatch = raw.match(/"retryDelay"\s*:\s*"([^"]+)"/i);
  if (delayMatch?.[1]) return delayMatch[1];
  return null;
}

function sanitizeErrorDetail(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        error?: { message?: string };
        message?: string;
      };
      const msg = parsed?.error?.message ?? parsed?.message;
      if (msg) return msg.split('\n')[0].trim();
    } catch {
      // ignore parse failure
    }
  }
  return trimmed.split('\n')[0].slice(0, 180);
}

function formatGeminiErrorMessage(
  lang: ApiLanguageCode,
  err: unknown,
  kind: 'chat_failed' | 'quiz_failed'
): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  if (isQuotaExceededError(err)) {
    const retry = extractRetryHint(raw);
    if (lang === 'en') {
      return retry
        ? `The AI service reached its temporary request limit (429). Please wait (${retry}) or check your Gemini API quota and try again.`
        : 'The AI service reached its temporary request limit (429). Please wait a moment or check your Gemini API quota and try again.';
    }
    if (lang === 'es') {
      return retry
        ? `El servicio de IA alcanzó su límite temporal de solicitudes (429). Espera (${retry}) o revisa la cuota de la API Gemini e inténtalo de nuevo.`
        : 'El servicio de IA alcanzó su límite temporal de solicitudes (429). Espera unos instantes o revisa la cuota de la API Gemini e inténtalo de nuevo.';
    }
    return retry
      ? `O limite temporário de requisições da IA foi atingido (429). Aguarde (${retry}) ou verifique a cota da API Gemini e tente novamente.`
      : 'O limite temporário de requisições da IA foi atingido (429). Aguarde alguns instantes ou verifique a cota da API Gemini e tente novamente.';
  }
  return localizedServerError(lang, kind, sanitizeErrorDetail(raw));
}

const QUIZ_CACHE_TTL_MS = 30 * 60 * 1000;
const quizServerCache = new Map<
  string,
  { questions: QuizQuestion[]; createdAt: number }
>();

function formatFuelForQuiz(fuel: string, lang: ApiLanguageCode): string {
  const f = fuel.toLowerCase();
  if (f === 'ethane') return lang === 'en' ? 'Ethane' : 'Etano';
  if (f === 'propane') return lang === 'en' ? 'Propane' : 'Propano';
  if (f === 'butane') return lang === 'en' ? 'Butane' : 'Butano';
  return fuel;
}

function formatFlameForQuiz(flame: string, lang: ApiLanguageCode): string {
  if (flame === 'inverse') {
    return lang === 'en' ? 'Inverse flame' : lang === 'es' ? 'Llama inversa' : 'Chama inversa';
  }
  return lang === 'en' ? 'Normal flame' : lang === 'es' ? 'Llama normal' : 'Chama normal';
}

function buildFallbackQuizFromDataset(
  lang: ApiLanguageCode,
  sampleTests: Psi159Test[]
): QuizQuestion[] {
  const pool = sampleTests.length >= 3 ? sampleTests : dataset.tests;
  const withPeak = pool
    .filter((t) => t.peak_burner_temp_c !== null)
    .sort((a, b) => (b.peak_burner_temp_c ?? -999) - (a.peak_burner_temp_c ?? -999));
  const peakTop = withPeak[0] ?? dataset.tests.find((t) => t.test_id === dataset.summary.maxPeakTempTestId) ?? dataset.tests[0];
  const peakAlt1 = withPeak[Math.min(3, Math.max(0, withPeak.length - 1))] ?? dataset.tests[1];
  const peakAlt2 = withPeak[Math.min(7, Math.max(0, withPeak.length - 1))] ?? dataset.tests[2];

  const withBurn = pool
    .filter((t) => t.burn_time_s !== null && t.burn_time_s > 0)
    .sort((a, b) => (b.burn_time_s ?? -1) - (a.burn_time_s ?? -1));
  const burnTop = withBurn[0] ?? dataset.tests.find((t) => t.test_id === dataset.summary.longestBurnTestId) ?? dataset.tests[0];

  const coolCandidate =
    pool.find((t) => t.cool_flame && t.o2_fraction >= 0.3 && t.pressure_psi <= 10.2) ??
    pool.find((t) => t.cool_flame) ??
    dataset.tests.find((t) => t.cool_flame) ??
    pool[0];

  const peakVal = (peakTop.peak_burner_temp_c ?? dataset.summary.maxPeakTempC).toFixed(1);
  const burnVal = (burnTop.burn_time_s ?? dataset.summary.longestBurnS).toFixed(1);
  const coolO2 = Math.round(coolCandidate.o2_fraction * 100);
  const coolPsi = coolCandidate.pressure_psi.toFixed(1);

  if (lang === 'en') {
    const q1Opts = Array.from(
      new Set([
        `${peakTop.test_id} (${peakVal} °C)`,
        `${peakAlt1.test_id} (${(peakAlt1.peak_burner_temp_c ?? 210).toFixed(1)} °C)`,
        `${peakAlt2.test_id} (${(peakAlt2.peak_burner_temp_c ?? 140).toFixed(1)} °C)`,
        '21167 A1 (48.0 °C)',
      ])
    ).slice(0, 4);
    while (q1Opts.length < 4) q1Opts.push(`Sample #${q1Opts.length + 1} (95.0 °C)`);

    return [
      {
        question: `In the active PSI-159 selection, which Test ID reached the highest peak burner temperature (${peakVal} °C)?`,
        options: q1Opts,
        correctIndex: 0,
        hint: `Look for the ${formatFuelForQuiz(peakTop.fuel, 'en')} (${formatFlameForQuiz(peakTop.flame_type, 'en')}) test near the top of the thermal chart.`,
        explanation: `Test ID ${peakTop.test_id} (${formatFuelForQuiz(peakTop.fuel, 'en')}, ${formatFlameForQuiz(peakTop.flame_type, 'en')}) hit ${peakVal} °C at ${Math.round(peakTop.o2_fraction * 100)}% O₂ and ${peakTop.pressure_psi.toFixed(1)} psi — like turning a stove burner up before its safety thermal shutoff (TFP / thermal limit).`,
        correctFeedback: `Spot on! Test ID ${peakTop.test_id} reached ${peakVal} °C.`,
        incorrectFeedback: `Not quite — Test ID ${peakTop.test_id} recorded the peak of ${peakVal} °C in this selection.`,
        testIdRef: peakTop.test_id,
      },
      {
        question: `Which Test ID sustained a microgravity flame the longest (${burnVal} s) in the current selection?`,
        options: [
          `Test ID ${burnTop.test_id} (${formatFuelForQuiz(burnTop.fuel, 'en')})`,
          'A standard Earth candle flame (0.5 s)',
          'An unignited test with 0.0 s burn time',
          'A brief flash-only ignition (< 1 s)',
        ],
        correctIndex: 0,
        hint: `Without hot air rising in microgravity, steady diffusion keeps ${formatFuelForQuiz(burnTop.fuel, 'en')} burning near the porous sphere.`,
        explanation: `In Test ID ${burnTop.test_id}, ${formatFuelForQuiz(burnTop.fuel, 'en')} burned for ${burnVal} s at ${Math.round(burnTop.o2_fraction * 100)}% O₂ and ${burnTop.pressure_psi.toFixed(1)} psi. In space, spherical diffusion feeds the flame steadily instead of flickering away like on Earth.`,
        correctFeedback: `Correct! Test ID ${burnTop.test_id} burned for ${burnVal} s.`,
        incorrectFeedback: `Actually, Test ID ${burnTop.test_id} sustained combustion for ${burnVal} s.`,
        testIdRef: burnTop.test_id,
      },
      {
        question: `Why is a cool flame like Test ID ${coolCandidate.test_id} (${coolO2}% O₂, ${coolPsi} psi) a concern for Lunar Base safety (O₂ ≥ 30%, P ≤ 10.2 psi)?`,
        options: [
          'It releases toxic smoke and low-visibility ~200–400 °C heat that can evade standard sensors',
          'It instantly freezes the spacecraft hull below 0 °C',
          'It only occurs at Earth sea-level pressure (14.7 psi) and never below 12 psi',
          'It immediately extinguishes all oxygen in the habitat within milliseconds',
        ],
        correctIndex: 0,
        hint: 'Think of engine knock pre-ignition: faint blue glow and moderate temperature, yet reactive and hazardous.',
        explanation: `Test ID ${coolCandidate.test_id} produced a confirmed cool flame at ${coolO2}% O₂ and ${coolPsi} psi. Like invisible pre-ignition inside a car engine, cool flames burn dimly (~200–400 °C) and can transition into hot flames in enriched Lunar habitats.`,
        correctFeedback: 'Exactly right! Low visibility and enriched O₂ make detection critical.',
        incorrectFeedback: 'Cool flames burn dimly (~200–400 °C) and are hard to spot with standard optical fire detectors.',
        testIdRef: coolCandidate.test_id,
      },
    ];
  }

  if (lang === 'es') {
    const q1Opts = Array.from(
      new Set([
        `${peakTop.test_id} (${peakVal} °C)`,
        `${peakAlt1.test_id} (${(peakAlt1.peak_burner_temp_c ?? 210).toFixed(1)} °C)`,
        `${peakAlt2.test_id} (${(peakAlt2.peak_burner_temp_c ?? 140).toFixed(1)} °C)`,
        '21167 A1 (48.0 °C)',
      ])
    ).slice(0, 4);
    while (q1Opts.length < 4) q1Opts.push(`Muestra #${q1Opts.length + 1} (95.0 °C)`);

    return [
      {
        question: `En la selección actual de PSI-159, ¿qué Test ID alcanzó la mayor temperatura pico en el quemador (${peakVal} °C)?`,
        options: q1Opts,
        correctIndex: 0,
        hint: `Busca el ensayo de ${formatFuelForQuiz(peakTop.fuel, 'es')} (${formatFlameForQuiz(peakTop.flame_type, 'es')}) en la parte superior del gráfico térmico.`,
        explanation: `El Test ID ${peakTop.test_id} (${formatFuelForQuiz(peakTop.fuel, 'es')}, ${formatFlameForQuiz(peakTop.flame_type, 'es')}) alcanzó ${peakVal} °C con ${Math.round(peakTop.o2_fraction * 100)}% de O₂ y ${peakTop.pressure_psi.toFixed(1)} psi — como subir la hornalla al máximo antes de que salte el corte de seguridad.`,
        correctFeedback: `¡Exacto! El Test ID ${peakTop.test_id} alcanzó ${peakVal} °C.`,
        incorrectFeedback: `Casi — el Test ID ${peakTop.test_id} registró el pico máximo de ${peakVal} °C en esta selección.`,
        testIdRef: peakTop.test_id,
      },
      {
        question: `¿Qué Test ID mantuvo la llama encendida durante más tiempo (${burnVal} s) en microgravedad dentro de la selección actual?`,
        options: [
          `Test ID ${burnTop.test_id} (${formatFuelForQuiz(burnTop.fuel, 'es')})`,
          'Una llama común de vela en Tierra (0,5 s)',
          'Un ensayo sin ignición con 0,0 s de duración',
          'Un destello breve que se apaga en menos de 1 s',
        ],
        correctIndex: 0,
        hint: `Sin aire caliente subiendo en microgravedad, la difusión estable mantiene el ${formatFuelForQuiz(burnTop.fuel, 'es')} encendido.`,
        explanation: `En el Test ID ${burnTop.test_id}, el ${formatFuelForQuiz(burnTop.fuel, 'es')} ardió durante ${burnVal} s con ${Math.round(burnTop.o2_fraction * 100)}% de O₂ y ${burnTop.pressure_psi.toFixed(1)} psi. En el espacio la difusión esférica alimenta la llama de forma continua.`,
        correctFeedback: `¡Correcto! El Test ID ${burnTop.test_id} duró ${burnVal} s.`,
        incorrectFeedback: `En realidad, el Test ID ${burnTop.test_id} sostuvo la combustión durante ${burnVal} s.`,
        testIdRef: burnTop.test_id,
      },
      {
        question: `¿Por qué una llama fría como la del Test ID ${coolCandidate.test_id} (${coolO2}% O₂, ${coolPsi} psi) preocupa para la seguridad en la Base Lunar (O₂ ≥ 30%, P ≤ 10,2 psi)?`,
        options: [
          'Arde a baja luminosidad (~200–400 °C) y puede pasar desapercibida para sensores ópticos comunes',
          'Congela instantáneamente el casco de la nave por debajo de 0 °C',
          'Solo ocurre a presión terrestre (14,7 psi) y nunca por debajo de 12 psi',
          'Consume todo el oxígeno del hábitat en milisegundos sin generar calor',
        ],
        correctIndex: 0,
        hint: 'Piensa en la preignición o picado dentro del motor de un auto: llama tenue, pero químicamente activa.',
        explanation: `El Test ID ${coolCandidate.test_id} generó una llama fría confirmada con ${coolO2}% de O₂ y ${coolPsi} psi. Como una combustión oculta en el motor, emite poca luz (~200–400 °C) y puede reactivarse en atmósferas lunares ricas en oxígeno.`,
        correctFeedback: '¡Muy bien! Su baja visibilidad y el exceso de O₂ exigen detección específica.',
        incorrectFeedback: 'Las llamas frías arden con brillo mínimo (~200–400 °C) y dificultan la detección temprana.',
        testIdRef: coolCandidate.test_id,
      },
    ];
  }

  const q1Opts = Array.from(
    new Set([
      `${peakTop.test_id} (${peakVal} °C)`,
      `${peakAlt1.test_id} (${(peakAlt1.peak_burner_temp_c ?? 210).toFixed(1)} °C)`,
      `${peakAlt2.test_id} (${(peakAlt2.peak_burner_temp_c ?? 140).toFixed(1)} °C)`,
      '21167 A1 (48.0 °C)',
    ])
  ).slice(0, 4);
  while (q1Opts.length < 4) q1Opts.push(`Amostra #${q1Opts.length + 1} (95.0 °C)`);

  return [
    {
      question: `Na seleção atual do PSI-159, qual Test ID atingiu a maior temperatura de pico no queimador (${peakVal} °C)?`,
      options: q1Opts,
      correctIndex: 0,
      hint: `Procure o ensaio de ${formatFuelForQuiz(peakTop.fuel, 'pt-BR')} (${formatFlameForQuiz(peakTop.flame_type, 'pt-BR')}) no topo do gráfico térmico.`,
      explanation: `O Test ID ${peakTop.test_id} (${formatFuelForQuiz(peakTop.fuel, 'pt-BR')}, ${formatFlameForQuiz(peakTop.flame_type, 'pt-BR')}) chegou a ${peakVal} °C com ${Math.round(peakTop.o2_fraction * 100)}% de O₂ e ${peakTop.pressure_psi.toFixed(1)} psi — como abrir o bico do fogão até acionar o corte térmico de segurança.`,
      correctFeedback: `Acertou! O Test ID ${peakTop.test_id} atingiu ${peakVal} °C.`,
      incorrectFeedback: `Quase — o Test ID ${peakTop.test_id} registrou o pico máximo de ${peakVal} °C nesta seleção.`,
      testIdRef: peakTop.test_id,
    },
    {
      question: `Qual Test ID manteve a chama acesa por mais tempo (${burnVal} s) em microgravidade na seleção atual?`,
      options: [
        `Test ID ${burnTop.test_id} (${formatFuelForQuiz(burnTop.fuel, 'pt-BR')})`,
        'Uma chama comum de vela na Terra (0,5 s)',
        'Um ensaio sem ignição com 0,0 s de queima',
        'Um clarão rápido que apaga em menos de 1 s',
      ],
      correctIndex: 0,
      hint: `Sem o ar quente subindo na microgravidade, a difusão estável sustenta a queima de ${formatFuelForQuiz(burnTop.fuel, 'pt-BR')}.`,
      explanation: `No Test ID ${burnTop.test_id}, o ${formatFuelForQuiz(burnTop.fuel, 'pt-BR')} queimou por ${burnVal} s a ${Math.round(burnTop.o2_fraction * 100)}% de O₂ e ${burnTop.pressure_psi.toFixed(1)} psi. No espaço, a difusão esférica alimenta a chama continuamente.`,
      correctFeedback: `Isso mesmo! O Test ID ${burnTop.test_id} durou ${burnVal} s.`,
      incorrectFeedback: `Na verdade, o Test ID ${burnTop.test_id} sustentou a chama por ${burnVal} s.`,
      testIdRef: burnTop.test_id,
    },
    {
      question: `Por que uma chama fria como a do Test ID ${coolCandidate.test_id} (${coolO2}% O₂, ${coolPsi} psi) preocupa na segurança da Base Lunar (O₂ ≥ 30%, P ≤ 10,2 psi)?`,
      options: [
        'Queima quase invisível (~200–400 °C) e pode passar despercebida por detectores ópticos comuns',
        'Congela instantaneamente a parede da nave abaixo de 0 °C',
        'Só acontece ao nível do mar na Terra (14,7 psi) e nunca abaixo de 12 psi',
        'Consome todo o oxigênio do módulo em milissegundos sem gerar calor',
      ],
      correctIndex: 0,
      hint: 'Lembre da pré-ignição ("batida de pino") no motor do carro: brilho fraco, mas reação ativa.',
      explanation: `O Test ID ${coolCandidate.test_id} produziu chama fria confirmada a ${coolO2}% de O₂ e ${coolPsi} psi. Como a pré-ignição oculta num motor, ela brilha pouco (~200–400 °C) e pode evoluir em habitats lunares ricos em O₂.`,
      correctFeedback: 'Exato! Baixa luminosidade e O₂ elevado exigem sensores dedicados.',
      incorrectFeedback: 'Chamas frias queimam com brilho fraco (~200–400 °C) e são difíceis de detectar cedo.',
      testIdRef: coolCandidate.test_id,
    },
  ];
}

function buildSystemInstruction(
  level: 'simples' | 'tecnico',
  lang: ApiLanguageCode = 'pt-BR',
  mode: 'chat' | 'quiz' = 'chat'
): string {
  const languageName = getLanguageName(lang);

  const topDirective =
    mode === 'quiz'
      ? `IMPORTANT LANGUAGE REQUIREMENT: Generate ALL quiz content (questions, answer options, explanations, hints and feedback) in ${languageName}. Do not use any other language, even if the dashboard data or field names are in Portuguese or English.`
      : `IMPORTANT LANGUAGE REQUIREMENT: Generate ALL response content (explanations, summaries, analogies, hints and feedback) in ${languageName}. Do not use any other language, even if the dashboard data or field names are in Portuguese or English.`;

  const levelGuide =
    level === 'tecnico'
      ? `Selected level: TECHNICAL. Keep sentences objective with scientific rigor for researchers/advanced students, detailing parameters (Zst, T_ad, pressure in bar and psi, mole fractions, mass flow in mg/s), defining acronyms on first mention in ${languageName}, and never inventing data outside the dataset.`
      : `Selected level: SIMPLE. You are the Fire Tamers Mentor for high-school students and curious learners. Explain using everyday analogies (kitchen stove, lighter, car engine knock, fire extinguisher), short jargon-free sentences, and define every technical term on first mention in ${languageName} (cool flame, Zst, T_ad, TFP, microgravity).`;

  const localizedRules =
    lang === 'en'
      ? `Mandatory rules:
1. Answer ONLY using real data from psi159_unificado.csv, dicionario_dados.csv, the panel context sent in the request, and basic combustion/space-safety science.
2. Never invent numbers. If the data does not cover the question (e.g., partial gravity on Moon 1/6 g or Mars 3/8 g, or the exact acronym meaning of TFP and PCI marked "to be confirmed" in the dictionary), state clearly that it is unknown / not present in PSI-159 (which covers ISS microgravity only).
3. Keep technical terms (Zst, T_ad, TFP, Test ID, psi) as-is, and explain them in English. Whenever citing pressure, peak temperature, burn time, flammability limits, or Lunar Zone tests (O2 >= 30% and pressure <= 10.2 psi), cite exact values and the corresponding Test ID (e.g., \`21242 A1\`, \`21174 C6\`).
4. For chat answers longer than 3 lines, end with a concise "**1-line summary:** ...".
5. Respond exclusively in English using light Markdown.`
      : lang === 'es'
        ? `Reglas obligatorias:
1. Responde ÚNICAMENTE con base en los datos reales de psi159_unificado.csv, dicionario_dados.csv, el contexto enviado en la solicitud y ciencia básica de combustión/seguridad espacial.
2. Nunca inventes números. Si los datos no cubren la pregunta (por ejemplo, gravedad parcial de la Luna 1/6 g o Marte 3/8 g, o el significado exacto de TFP y PCI marcados como "por confirmar" en el diccionario), dilo claramente indicando que no consta en PSI-159 (que cubre solo microgravedad en la ISS).
3. Mantén los términos técnicos (Zst, T_ad, TFP, Test ID, psi) tal como están y explícalos en Español. Siempre que menciones presión, temperatura pico, duración, límites de inflamabilidad o Zona Lunar (O2 >= 30% y presión <= 10,2 psi), cita valores exactos y el código Test ID (ej.: \`21242 A1\`, \`21174 C6\`).
4. Para respuestas de chat de más de 3 líneas, termina con "**Resumen en 1 línea:** ...".
5. Responde exclusivamente en Español con Markdown ligero.`
        : `Regras obrigatórias:
1. Responda SOMENTE com base nos dados reais do arquivo psi159_unificado.csv, no dicionario_dados.csv, no contexto do painel enviado na conversa e no conhecimento científico básico de combustão/segurança espacial.
2. Nunca invente números. Se os dados não cobrirem a pergunta (por exemplo, gravidade parcial da Lua/Marte, ou o significado de TFP e PCI que constam como "a confirmar" no dicionário), diga claramente "não sei" ou que essa informação não consta nos dados do PSI-159 (que cobre apenas microgravidade na ISS).
3. Mantenha termos técnicos (Zst, T_ad, TFP, Test ID, psi) como estão, explicando-os em Português do Brasil. Sempre que falar de pressão, temperatura de pico, tempo de queima, limites de inflamabilidade ou ensaios da Zona Lunar (O2 >= 30% e pressão <= 10,2 psi), cite os valores exatos e o código 'Test ID' correspondente (ex.: \`21242 A1\`, \`21174 C6\`).
4. Termine respostas de chat com mais de 3 linhas com um "**Resumo em 1 linha:** ..." direto ao ponto.
5. Responda exclusivamente em Português do Brasil com Markdown leve.`;

  return `${topDirective}

You are the Fire Tamers Mentor (Mentor Fire Tamers), educational tutor for the Fire Tamers analytical dashboard on the PSI-159 experiment (Cool Flames Investigation with Gases, ACME / CFI-G).

Identity & Transparency:
- Fire Tamers is an independent project created for the NASA challenge and is NOT an official NASA project.
- You use public data from the NASA PSI-159 experiment (NASA Physical Science Informatics). Whenever asked about your origin or affiliation, make it clear that you use public NASA PSI-159 experiment data and that this project is not official NASA.

${levelGuide}

${localizedRules}

${getLocalizedCsvVocabulary(lang)}

=== VERIFIED DATASET SUMMARY (${dataset.summary.totalTests} TESTS) ===
- Total tests: ${dataset.summary.totalTests} (${dataset.summary.normalCount} normal, ${dataset.summary.inverseCount} inverse)
- Confirmed ignitions: ${dataset.summary.ignitedCount}
- Confirmed cool flames (cool_flame=True): ${dataset.summary.coolFlameCount} (includes ${dataset.summary.coolFlameOnlyCount} cool_flame_only cases)
- Hit burner thermal limit: ${dataset.summary.tempLimitCount}
- Max peak burner temp: ${dataset.summary.maxPeakTempC} °C (${dataset.summary.maxPeakTempK} K) in Test ID ${dataset.summary.maxPeakTempTestId}
- Longest burn duration: ${dataset.summary.longestBurnS} s in Test ID ${dataset.summary.longestBurnTestId}
- Pressure range: ${dataset.summary.minPressurePsi} to ${dataset.summary.maxPressurePsi} psi (${dataset.summary.minPressureBar} to ${dataset.summary.maxPressureBar} bar)

=== DATA DICTIONARY (dicionario_dados.csv — translate field explanations into ${languageName}, keep technical symbols Zst, T_ad, TFP, Test ID, psi) ===
${rawDictionaryCsv}

=== EXPERIMENTAL DATASET (psi159_unificado.csv) ===
${rawDataCsv}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/psi159/data', (_req, res) => {
    res.json(dataset);
  });

  app.post('/api/assistant/chat', async (req, res) => {
    const body = (req.body ?? {}) as {
      lang?: string;
      interactionKind?: 'chat' | 'explain_chart' | 'analyze_test' | 'chip';
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
      selectedTestId?: string;
      level?: 'simples' | 'tecnico';
      dashboardContext?: {
        activeTab?: string;
        filtersSummary?: string;
        kpisSummary?: string;
        chartContext?: string;
      };
    };
    const targetLang = normalizeApiLanguage(body.lang);
    const languageName = getLanguageName(targetLang);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error: localizedServerError(targetLang, 'missing_key'),
        });
        return;
      }

      const messages = Array.isArray(body?.messages) ? body.messages : [];
      if (messages.length === 0) {
        res.status(400).json({
          error: localizedServerError(targetLang, 'empty_messages'),
        });
        return;
      }

      const level = body.level === 'tecnico' ? 'tecnico' : 'simples';
      const selectedTest = body.selectedTestId
        ? dataset.tests.find((t) => t.test_id === body.selectedTestId)
        : undefined;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contextLines: string[] = [];
      contextLines.push(`Active output language: ${languageName} (${targetLang})`);
      if (body.interactionKind) {
        contextLines.push(`Interaction mode: ${body.interactionKind}`);
      }
      if (body.dashboardContext?.activeTab) {
        contextLines.push(`Active tab: ${body.dashboardContext.activeTab}`);
      }
      if (body.dashboardContext?.filtersSummary) {
        contextLines.push(`Active filters: ${body.dashboardContext.filtersSummary}`);
      }
      if (body.dashboardContext?.kpisSummary) {
        contextLines.push(`Filtered KPIs: ${body.dashboardContext.kpisSummary}`);
      }
      if (body.dashboardContext?.chartContext) {
        contextLines.push(`Target item/chart: ${body.dashboardContext.chartContext}`);
      }
      if (selectedTest) {
        contextLines.push(
          `Selected test detail: ${JSON.stringify(selectedTest)}`
        );
      }

      const contents = messages.map((m, index) => {
        const isLastUser = index === messages.length - 1 && m.role === 'user';
        let text = m.content;
        if (isLastUser && contextLines.length > 0) {
          text = `[DASHBOARD CONTEXT]\n${contextLines.join('\n')}\n\n[USER REQUEST — Respond strictly in ${languageName}]\n${m.content}`;
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text }],
        };
      });

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await ai.models.generateContentStream({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: buildSystemInstruction(level, targetLang, 'chat'),
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      let fullText = '';
      for await (const chunk of stream) {
        const delta = chunk.text ?? '';
        if (delta) {
          fullText += delta;
          res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
        }
      }

      const citedTestIds = extractCitedTestIds(fullText);
      res.write(
        `data: ${JSON.stringify({ type: 'done', citedTestIds })}\n\n`
      );
      res.end();
    } catch (err: unknown) {
      const friendlyMessage = formatGeminiErrorMessage(targetLang, err, 'chat_failed');
      console.error('Erro no streaming /api/assistant/chat:', err);
      if (!res.headersSent) {
        res.status(isQuotaExceededError(err) ? 429 : 500).json({
          error: friendlyMessage,
        });
      } else {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: friendlyMessage })}\n\n`
        );
        res.end();
      }
    }
  });

  app.post('/api/assistant/quiz', async (req, res) => {
    const body = (req.body ?? {}) as {
      lang?: string;
      forceRefresh?: boolean;
      filtersSummary?: string;
      kpisSummary?: string;
      sampleTests?: Psi159Test[];
    };
    const targetLang = normalizeApiLanguage(body.lang);
    const languageName = getLanguageName(targetLang);
    const filtersKey = (body.filtersSummary ?? 'default').trim();
    const cacheKey = `${targetLang}::${filtersKey}`;
    const sampleTests = Array.isArray(body.sampleTests) ? body.sampleTests : [];

    const cached = quizServerCache.get(cacheKey);
    if (
      !body.forceRefresh &&
      cached &&
      Date.now() - cached.createdAt < QUIZ_CACHE_TTL_MS
    ) {
      res.json({
        language: targetLang,
        questions: cached.questions,
        source: 'cache',
      });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.json({
          language: targetLang,
          questions: buildFallbackQuizFromDataset(targetLang, sampleTests),
          source: 'fallback',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const sampleSnippet = JSON.stringify((body.sampleTests ?? []).slice(0, 25));

      const basePrompt = `Generate an educational quick quiz with exactly 3 multiple-choice questions strictly in ${languageName} (language code "${targetLang}") for students exploring the PSI-159 experiment, using ONLY the filtered data and real examples below:
Target output language: ${languageName} ("${targetLang}")
Active filters: ${body.filtersSummary ?? 'All 333 tests'}
Current KPIs: ${body.kpisSummary ?? ''}
Sample of filtered tests: ${sampleSnippet}

Requirements:
- Set the top-level JSON field "language" to "${targetLang}".
- Write ALL questions, 4 answer options, hints, correctFeedback, incorrectFeedback, and short Earth-analogy explanations strictly in ${languageName}.
- Keep technical terms (Zst, T_ad, TFP, Test ID, psi) as-is, and explain them in ${languageName}.
- Translate any CSV column labels or categorical values (like fuel or outcome) into ${languageName}.
- Each question must cite a real Test ID from the sample or dataset whenever numbers are involved, with correctIndex from 0 to 3.`;

      const quizResponseSchema = {
        type: Type.OBJECT,
        properties: {
          language: {
            type: Type.STRING,
            description: `Must be exactly "${targetLang}"`,
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                hint: { type: Type.STRING },
                explanation: { type: Type.STRING },
                correctFeedback: { type: Type.STRING },
                incorrectFeedback: { type: Type.STRING },
                testIdRef: { type: Type.STRING },
              },
              required: [
                'question',
                'options',
                'correctIndex',
                'hint',
                'explanation',
                'correctFeedback',
                'incorrectFeedback',
                'testIdRef',
              ],
            },
          },
        },
        required: ['language', 'questions'],
      };

      const generateQuizOnce = async (extraReminder = '') => {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `${basePrompt}${extraReminder}`,
          config: {
            systemInstruction: buildSystemInstruction('simples', targetLang, 'quiz'),
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: quizResponseSchema,
          },
        });
        const raw = (response.text ?? '{}').trim();
        return JSON.parse(raw) as {
          language?: string;
          questions?: Array<{
            question: string;
            options: string[];
            correctIndex: number;
            hint?: string;
            explanation: string;
            correctFeedback?: string;
            incorrectFeedback?: string;
            testIdRef: string;
          }>;
        };
      };

      let parsed = await generateQuizOnce();
      let returnedLang = (parsed.language ?? '').trim();

      if (
        returnedLang !== targetLang ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length === 0
      ) {
        parsed = await generateQuizOnce(
          `\n\nCRITICAL CORRECTION: Previous output had language="${returnedLang || 'missing'}". You MUST set "language" to "${targetLang}" and write EVERY single word of questions, options, hints, feedback, and explanations in ${languageName}.`
        );
        returnedLang = (parsed.language ?? '').trim();
      }

      if (
        returnedLang !== targetLang ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length === 0
      ) {
        res.status(502).json({
          error: localizedServerError(
            targetLang,
            'quiz_lang_mismatch',
            `${returnedLang || 'unknown'} != ${targetLang}`
          ),
        });
        return;
      }

      quizServerCache.set(cacheKey, {
        questions: parsed.questions,
        createdAt: Date.now(),
      });
      res.json({
        language: returnedLang,
        questions: parsed.questions,
        source: 'ai',
      });
    } catch (err: unknown) {
      if (isQuotaExceededError(err)) {
        if (cached && cached.questions.length > 0) {
          res.json({
            language: targetLang,
            questions: cached.questions,
            source: 'cache',
          });
          return;
        }
        res.json({
          language: targetLang,
          questions: buildFallbackQuizFromDataset(targetLang, sampleTests),
          source: 'fallback',
        });
        return;
      }
      res.status(500).json({
        error: formatGeminiErrorMessage(targetLang, err, 'quiz_failed'),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fire Tamers (PSI-159 Dashboard) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
