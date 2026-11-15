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

function buildSystemInstruction(level: 'simples' | 'tecnico'): string {
  const levelGuide =
    level === 'tecnico'
      ? `Nível selecionado: EXPLICAR TÉCNICO. Mantenha frases objetivas e rigor científico para pesquisadores/estudantes avançados, detalhando parâmetros (Zst, T_ad, pressões em bar e psi, frações molares, fluxo mássico em mg/s), mas ainda definindo siglas na primeira menção e sem inventar nenhum dado fora da tabela.`
      : `Nível selecionado: EXPLICAR SIMPLES. Você é o Mentor Fire Tamers, mentor de estudantes do ensino médio. Explique com analogias do dia a dia (fogão de casa, isqueiro, batida de pino no motor do carro, extintor de incêndio), frases curtas e sem jargão; defina cada termo técnico na primeira vez (chama fria, Zst, T_ad, TFP, microgravidade).`;

  return `Você é o Mentor Fire Tamers (em inglês: Fire Tamers Mentor), tutor educacional do dashboard analítico Fire Tamers sobre o experimento PSI-159 (Cool Flames Investigation with Gases, projeto ACME / CFI-G).

Identidade e transparência obrigatória:
- O projeto Fire Tamers é um projeto independente criado para o desafio NASA e NÃO é um projeto oficial da NASA.
- Você utiliza exclusivamente dados públicos do experimento NASA PSI-159 (NASA Physical Science Informatics). Sempre que o usuário perguntar sobre sua origem, autoria ou vínculo institucional, deixe claro que você usa dados públicos do experimento NASA PSI-159 e que este projeto não é oficial da NASA.

${levelGuide}

Regras obrigatórias:
1. Responda SOMENTE com base nos dados reais do arquivo psi159_unificado.csv, no dicionario_dados.csv, no contexto do painel enviado na conversa e no conhecimento científico básico de combustão/segurança espacial.
2. Nunca invente números. Se os dados não cobrirem a pergunta (por exemplo, gravidade parcial da Lua/Marte, ou o significado de TFP e PCI que constam como "a confirmar" no dicionário), diga claramente "não sei" ou que essa informação não consta nos dados do PSI-159 (que cobre apenas microgravidade na ISS).
3. Sempre que falar de pressão, temperatura de pico, tempo de queima, limites de inflamabilidade ou ensaios da Zona Lunar (O2 >= 30% e pressão <= 10,2 psi), cite os valores exatos e o código 'Test ID' correspondente (ex.: \`21242 A1\`, \`21174 C6\`).
4. Termine respostas com mais de 3 linhas com um "**Resumo em 1 linha:** ..." direto ao ponto.
5. Responda por padrão em Português do Brasil com Markdown leve (ou no idioma solicitado no início da mensagem, como inglês ou espanhol).

=== RESUMO VERIFICADO DO DATASET (333 ENSAIOS) ===
- Total de ensaios: ${dataset.summary.totalTests} (${dataset.summary.normalCount} normais, ${dataset.summary.inverseCount} inversas)
- Ignições confirmadas: ${dataset.summary.ignitedCount}
- Chamas frias confirmadas (cool_flame=True): ${dataset.summary.coolFlameCount} (inclui ${dataset.summary.coolFlameOnlyCount} casos de cool_flame_only)
- Atingiram limite térmico do queimador: ${dataset.summary.tempLimitCount}
- Maior temperatura de pico no queimador: ${dataset.summary.maxPeakTempC} °C (${dataset.summary.maxPeakTempK} K) no Test ID ${dataset.summary.maxPeakTempTestId}
- Maior duração de queima: ${dataset.summary.longestBurnS} s no Test ID ${dataset.summary.longestBurnTestId}
- Faixa de pressão: ${dataset.summary.minPressurePsi} a ${dataset.summary.maxPressurePsi} psi (${dataset.summary.minPressureBar} a ${dataset.summary.maxPressureBar} bar)

=== DICIONÁRIO DE DADOS (dicionario_dados.csv) ===
${rawDictionaryCsv}

=== DADOS EXPERIMENTAIS COMPLETOS (psi159_unificado.csv) ===
${rawDataCsv}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/psi159/data', (_req, res) => {
    res.json(dataset);
  });

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error:
            'Chave da API Gemini não configurada no servidor (GEMINI_API_KEY). Verifique Settings > Secrets.',
        });
        return;
      }

      const body = req.body as {
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

      const messages = Array.isArray(body?.messages) ? body.messages : [];
      if (messages.length === 0) {
        res.status(400).json({ error: 'Envie pelo menos uma pergunta.' });
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
      if (body.dashboardContext?.activeTab) {
        contextLines.push(`Aba atual: ${body.dashboardContext.activeTab}`);
      }
      if (body.dashboardContext?.filtersSummary) {
        contextLines.push(`Filtros globais ativos: ${body.dashboardContext.filtersSummary}`);
      }
      if (body.dashboardContext?.kpisSummary) {
        contextLines.push(`KPIs calculados dos ensaios filtrados: ${body.dashboardContext.kpisSummary}`);
      }
      if (body.dashboardContext?.chartContext) {
        contextLines.push(`Gráfico em análise: ${body.dashboardContext.chartContext}`);
      }
      if (selectedTest) {
        contextLines.push(
          `Ensaio selecionado no detalhe: ${JSON.stringify(selectedTest)}`
        );
      }

      const contents = messages.map((m, index) => {
        const isLastUser = index === messages.length - 1 && m.role === 'user';
        let text = m.content;
        if (isLastUser && contextLines.length > 0) {
          text = `[CONTEXTO ATUAL DO PAINEL]\n${contextLines.join('\n')}\n\n[PERGUNTA DO USUÁRIO]\n${m.content}`;
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
          systemInstruction: buildSystemInstruction(level),
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
          error: `Falha ao consultar o Mentor Fire Tamers: ${message}`,
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
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
        return;
      }

      const body = req.body as {
        filtersSummary?: string;
        kpisSummary?: string;
        sampleTests?: Psi159Test[];
      };

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const sampleSnippet = JSON.stringify((body.sampleTests ?? []).slice(0, 25));

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Crie um quiz rápido educativo com exatamente 3 perguntas de múltipla escolha em Português do Brasil para estudantes do ensino médio sobre o experimento PSI-159, usando EXCLUSIVAMENTE estes dados filtrados e exemplos reais:
Filtros: ${body.filtersSummary ?? 'Todos os 333 ensaios'}
KPIs atuais: ${body.kpisSummary ?? ''}
Amostra dos ensaios filtrados: ${sampleSnippet}

Cada pergunta deve citar um Test ID real da amostra ou da tabela quando envolver números, ter 4 alternativas curtas, índice da resposta correta (0 a 3) e uma explicação didática curta com analogia terrestre.`,
        config: {
          systemInstruction: buildSystemInstruction('simples'),
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
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
                explanation: { type: Type.STRING },
                testIdRef: { type: Type.STRING },
              },
              required: [
                'question',
                'options',
                'correctIndex',
                'explanation',
                'testIdRef',
              ],
            },
          },
        },
      });

      const raw = (response.text ?? '[]').trim();
      const questions = JSON.parse(raw);
      res.json({ questions });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Erro ao gerar quiz: ${message}` });
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
