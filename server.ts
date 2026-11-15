import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  DataDictionaryEntry,
  Psi159DatasetResponse,
  Psi159Summary,
  Psi159Test,
} from './src/types/psi159.ts';

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const cleanText = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ''));
}

function toNum(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toBool(val: string | undefined): boolean {
  return (val ?? '').trim().toLowerCase() === 'true';
}

function toStr(val: string | undefined): string | null {
  if (!val || val.trim() === '') return null;
  return val.trim();
}

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

function loadDataset(): Psi159DatasetResponse {
  const dictRows = parseCsvRows(rawDictionaryCsv);
  const dictHeaders = dictRows[0];
  const dictionary: DataDictionaryEntry[] = dictRows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    dictHeaders.forEach((h, idx) => {
      record[h] = row[idx] ?? '';
    });
    return {
      coluna: record.coluna ?? '',
      rotulo: record.rotulo ?? '',
      unidade: record.unidade ?? '',
      explicacao_simples: record.explicacao_simples ?? '',
      observacao_tecnica: record.observacao_tecnica ?? '',
    };
  });

  const dataRows = parseCsvRows(rawDataCsv);
  const dataHeaders = dataRows[0];
  const tests: Psi159Test[] = dataRows.slice(1).map((row) => {
    const r: Record<string, string> = {};
    dataHeaders.forEach((h, idx) => {
      r[h] = row[idx] ?? '';
    });
    return {
      investigation: r.investigation ?? 'PSI-159',
      test_id: r.test_id ?? '',
      flame_type: r.flame_type === 'inverse' ? 'inverse' : 'normal',
      day: toNum(r.day) ?? 0,
      fuel: r.fuel ?? '',
      fuel_mix_pct: toNum(r.fuel_mix_pct) ?? 100,
      o2_fraction: toNum(r.o2_fraction) ?? 0,
      o2_fraction_after: toNum(r.o2_fraction_after) ?? 0,
      o2_location: r.o2_location ?? '',
      fuel_fraction: toNum(r.fuel_fraction) ?? 0,
      fuel_fraction_after: toNum(r.fuel_fraction_after) ?? 0,
      fuel_location: r.fuel_location ?? '',
      pressure_bar: toNum(r.pressure_bar) ?? 0,
      pressure_psi: toNum(r.pressure_psi) ?? 0,
      hc_flow_mg_s: toNum(r.hc_flow_mg_s) ?? 0,
      o2_flow_mg_s: toNum(r.o2_flow_mg_s),
      tad_k: toNum(r.tad_k),
      zst: toNum(r.zst),
      tfp: toBool(r.tfp),
      ignition_type: r.ignition_type ?? 'none',
      ignited: toBool(r.ignited),
      outcome: r.outcome ?? 'no_ignition',
      burn_time_s: toNum(r.burn_time_s),
      cool_flame: toBool(r.cool_flame),
      cool_flame_code: toStr(r.cool_flame_code),
      peak_burner_temp_c: toNum(r.peak_burner_temp_c),
      peak_burner_temp_k: toNum(r.peak_burner_temp_k),
      flame_color: toStr(r.flame_color),
      hit_burner_temp_limit: toBool(r.hit_burner_temp_limit),
      quality_notes: toStr(r.quality_notes),
      comments: toStr(r.comments),
      _arquivo: r._arquivo ?? '',
    };
  });

  let maxPeakTempC = -Infinity;
  let maxPeakTempK = 0;
  let maxPeakTempTestId = '';
  let minPressureBar = Infinity;
  let maxPressureBar = -Infinity;
  let minPressurePsi = Infinity;
  let maxPressurePsi = -Infinity;
  let longestBurnS = -1;
  let longestBurnTestId = '';

  const fuelSet = new Set<string>();

  for (const t of tests) {
    if (t.fuel) fuelSet.add(t.fuel);
    if (t.peak_burner_temp_c !== null && t.peak_burner_temp_c > maxPeakTempC) {
      maxPeakTempC = t.peak_burner_temp_c;
      maxPeakTempK = t.peak_burner_temp_k ?? t.peak_burner_temp_c + 273.15;
      maxPeakTempTestId = t.test_id;
    }
    if (t.pressure_bar < minPressureBar) minPressureBar = t.pressure_bar;
    if (t.pressure_bar > maxPressureBar) maxPressureBar = t.pressure_bar;
    if (t.pressure_psi < minPressurePsi) minPressurePsi = t.pressure_psi;
    if (t.pressure_psi > maxPressurePsi) maxPressurePsi = t.pressure_psi;
    if (t.burn_time_s !== null && t.burn_time_s > longestBurnS) {
      longestBurnS = t.burn_time_s;
      longestBurnTestId = t.test_id;
    }
  }

  const summary: Psi159Summary = {
    totalTests: tests.length,
    normalCount: tests.filter((t) => t.flame_type === 'normal').length,
    inverseCount: tests.filter((t) => t.flame_type === 'inverse').length,
    ignitedCount: tests.filter((t) => t.ignited).length,
    coolFlameCount: tests.filter((t) => t.cool_flame).length,
    coolFlameOnlyCount: tests.filter((t) => t.outcome === 'cool_flame_only').length,
    tempLimitCount: tests.filter((t) => t.hit_burner_temp_limit).length,
    maxPeakTempC,
    maxPeakTempK,
    maxPeakTempTestId,
    minPressureBar,
    maxPressureBar,
    minPressurePsi,
    maxPressurePsi,
    longestBurnS,
    longestBurnTestId,
    fuels: Array.from(fuelSet),
  };

  return { tests, dictionary, summary };
}

const dataset = loadDataset();
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
      const message = err instanceof Error ? err.message : String(err);
      console.error('Erro no streaming /api/assistant/chat:', message);
      if (!res.headersSent) {
        res.status(500).json({
          error: localizedServerError(targetLang, 'chat_failed', message),
        });
      } else {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: message })}\n\n`
        );
        res.end();
      }
    }
  });

  app.post('/api/assistant/quiz', async (req, res) => {
    const body = (req.body ?? {}) as {
      lang?: string;
      filtersSummary?: string;
      kpisSummary?: string;
      sampleTests?: Psi159Test[];
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

      res.json({ language: returnedLang, questions: parsed.questions });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        error: localizedServerError(targetLang, 'quiz_failed', message),
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
