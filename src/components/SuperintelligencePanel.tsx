import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_O2_RANGE,
  DEFAULT_PSI_RANGE,
  usePsiStore,
  type AiInteractionKind,
} from '../store/usePsiStore';
import type {
  ApiLanguageCode,
  AppLanguage,
  ChatMessage,
  QuizQuestion,
} from '../types/psi159';
import { applyGlobalFilters, computeKpis } from '../utils/analytics';
import {
  flameTypeLabel,
  formatNumber,
  fuelLabel,
  outcomeLabel,
} from '../utils/formatters';
import { useStrings } from '../utils/i18n';

function toApiLanguage(lang: AppLanguage): ApiLanguageCode {
  if (lang === 'en') return 'en';
  if (lang === 'es') return 'es';
  return 'pt-BR';
}

function renderInlineFormatting(
  line: string,
  onSelectTest: (id: string) => void
): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\b\d{5}\s+[A-Z]\d+[A-Z]?\b)/g;
  const parts = line.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      if (/^\d{5}\s+[A-Z]\d+[A-Z]?$/.test(inner)) {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectTest(inner)}
            className="mx-0.5 inline-flex items-center whitespace-nowrap rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0 font-mono text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/25"
          >
            {inner}
          </button>
        );
      }
      return (
        <code
          key={idx}
          className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[11px] text-cyan-200"
        >
          {inner}
        </code>
      );
    }
    if (/^\d{5}\s+[A-Z]\d+[A-Z]?$/.test(part)) {
      return (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectTest(part)}
          className="mx-0.5 inline-flex items-center whitespace-nowrap rounded border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0 font-mono text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/25"
        >
          {part}
        </button>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const FormattedMarkdown: React.FC<{
  text: string;
  onSelectTest: (id: string) => void;
}> = ({ text, onSelectTest }) => {
  const lines = text.split('\n');
  return (
    <div className="wrap-anywhere space-y-1.5 text-xs text-slate-200">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (
          trimmed.startsWith('- ') ||
          trimmed.startsWith('• ') ||
          trimmed.startsWith('* ')
        ) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="shrink-0 text-cyan-400">•</span>
              <span className="min-w-0">
                {renderInlineFormatting(trimmed.slice(2), onSelectTest)}
              </span>
            </div>
          );
        }
        return <p key={i}>{renderInlineFormatting(line, onSelectTest)}</p>;
      })}
    </div>
  );
};

interface SuperintelligencePanelProps {
  panelWidth: number;
  onWidthChange: (w: number) => void;
}

export const SuperintelligencePanel: React.FC<SuperintelligencePanelProps> = ({
  panelWidth,
  onWidthChange,
}) => {
  const tests = usePsiStore((s) => s.tests);
  const filters = usePsiStore((s) => s.filters);
  const activeTab = usePsiStore((s) => s.activeTab);
  const selectedTestId = usePsiStore((s) => s.selectedTestId);
  const chatOpen = usePsiStore((s) => s.chatOpen);
  const setChatOpen = usePsiStore((s) => s.setChatOpen);
  const filterSheetOpen = usePsiStore((s) => s.filterSheetOpen);
  const selectTest = usePsiStore((s) => s.selectTest);
  const aiExternalPrompt = usePsiStore((s) => s.aiExternalPrompt);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);

  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(
          '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
        ).matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia(
      '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
    );
    const sync = () => setIsMobileView(mq.matches);
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    mq.addEventListener('change', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      mq.removeEventListener('change', sync);
    };
  }, []);

  const [level, setLevel] = useState<'simples' | 'tecnico'>('simples');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizLang, setQuizLang] = useState<AppLanguage | null>(null);
  const [quizCurrentIdx, setQuizCurrentIdx] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<
    Record<number, number>
  >({});
  const [quizVerified, setQuizVerified] = useState<Record<number, boolean>>({});
  const [quizShowHint, setQuizShowHint] = useState<Record<number, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizLangChangedNotice, setQuizLangChangedNotice] = useState(false);
  const [quizSource, setQuizSource] = useState<'ai' | 'cache' | 'fallback' | null>(null);
  const [fabRetracted, setFabRetracted] = useState(false);

  useEffect(() => {
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;
    const onScroll = () => {
      const currY = window.scrollY;
      if (currY < 80) {
        setFabRetracted(false);
      } else if (currY > lastY + 8) {
        setFabRetracted(true);
      } else if (currY < lastY - 8) {
        setFabRetracted(false);
      }
      lastY = currY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const resizingRef = useRef<{ startX: number; startW: number } | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const lastExternalIdRef = useRef<number>(0);
  const quizCacheRef = useRef<Map<string, QuizQuestion[]>>(new Map());
  const quizRequestIdRef = useRef<number>(0);

  const filteredTests = useMemo(
    () => applyGlobalFilters(tests, filters),
    [tests, filters]
  );
  const kpis = useMemo(() => computeKpis(filteredTests), [filteredTests]);

  const filtersSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.fuels.length) {
      const label = lang === 'en' ? 'Fuels' : lang === 'es' ? 'Gases' : 'Gases';
      parts.push(
        `${label}: ${filters.fuels.map((f) => fuelLabel(f, lang)).join(', ')}`
      );
    }
    if (filters.flameTypes.length) {
      const label =
        lang === 'en' ? 'Flames' : lang === 'es' ? 'Llamas' : 'Chamas';
      parts.push(
        `${label}: ${filters.flameTypes
          .map((ft) => flameTypeLabel(ft, lang))
          .join(', ')}`
      );
    }
    if (
      filters.o2Range[0] > DEFAULT_O2_RANGE[0] ||
      filters.o2Range[1] < DEFAULT_O2_RANGE[1]
    ) {
      parts.push(
        `O₂: ${Math.round(filters.o2Range[0] * 100)}–${Math.round(filters.o2Range[1] * 100)}%`
      );
    }
    if (
      filters.psiRange[0] > DEFAULT_PSI_RANGE[0] ||
      filters.psiRange[1] < DEFAULT_PSI_RANGE[1]
    ) {
      const label =
        lang === 'en' ? 'Pressure' : lang === 'es' ? 'Presión' : 'Pressão';
      parts.push(
        `${label}: ${formatNumber(filters.psiRange[0], 1, lang)}–${formatNumber(filters.psiRange[1], 1, lang)} psi`
      );
    }
    if (filters.outcomes.length) {
      const label =
        lang === 'en'
          ? 'Outcomes'
          : lang === 'es'
            ? 'Resultados'
            : 'Desfechos';
      parts.push(
        `${label}: ${filters.outcomes
          .map((o) => outcomeLabel(o, lang))
          .join(', ')}`
      );
    }
    if (filters.onlyCoolFlames) {
      parts.push(tStr.filters.onlyCoolFlames);
    }
    if (filters.crossFilter) {
      const label =
        lang === 'en'
          ? 'Cross-filter'
          : lang === 'es'
            ? 'Filtro cruzado'
            : 'Seleção cruzada';
      parts.push(`${label}: ${filters.crossFilter.label}`);
    }
    if (parts.length > 0) return parts.join(' | ');
    return lang === 'en'
      ? 'All 333 tests'
      : lang === 'es'
        ? 'Todos los 333 ensayos'
        : 'Todos os 333 ensaios';
  }, [filters, lang, tStr.filters.onlyCoolFlames]);

  const kpisSummary = useMemo(() => {
    const peakPart =
      kpis.maxPeakTempC !== null
        ? `${formatNumber(kpis.maxPeakTempC, 1, lang)} °C (${kpis.maxPeakTempTestId})`
        : 'N/A';
    if (lang === 'en') {
      return `${kpis.total} filtered tests; ${formatNumber(kpis.ignitedPct, 1, lang)}% ignition; ${kpis.coolFlameCount} cool flames; max peak ${peakPart}; avg burn ${formatNumber(kpis.avgBurnTimeS, 1, lang)} s; ${kpis.lunarZoneCount} in Lunar Zone.`;
    }
    if (lang === 'es') {
      return `${kpis.total} ensayos filtrados; ${formatNumber(kpis.ignitedPct, 1, lang)}% ignición; ${kpis.coolFlameCount} llamas frías; pico máx ${peakPart}; duración media ${formatNumber(kpis.avgBurnTimeS, 1, lang)} s; ${kpis.lunarZoneCount} en Zona Lunar.`;
    }
    return `${kpis.total} ensaios filtrados; ${formatNumber(kpis.ignitedPct, 1, lang)}% ignição; ${kpis.coolFlameCount} chamas frias; pico máx ${peakPart}; queima média ${formatNumber(kpis.avgBurnTimeS, 1, lang)} s; ${kpis.lunarZoneCount} na Zona Lunar.`;
  }, [kpis, lang]);

  const dynamicSuggestions = useMemo(() => {
    if (lang === 'en') {
      if (activeTab === 'cool_flames') {
        return [
          'Why are cool flames hard to detect inside a spacecraft?',
          'Compare test 21174 C6 and test 21291 C1 in simple terms.',
          'How would Earth gravity (1 g) change the flame in test 21242 A1?',
        ];
      }
      if (activeTab === 'ignition') {
        return [
          'Which 3 tests are most critical inside the Lunar Zone?',
          'Why do O₂ ≥ 30% and pressure ≤ 10.2 psi increase fire risk?',
          'What was the highest burner temperature in the active filters?',
        ];
      }
      return [
        'What are cool flames using a car engine or stove analogy?',
        'Which test burned longest and which reached the highest burner temp?',
        'Why does the Lunar Base plan O₂ ≥ 30% and pressure ≤ 10.2 psi?',
      ];
    }
    if (lang === 'es') {
      if (activeTab === 'cool_flames') {
        return [
          '¿Por qué las llamas frías son difíciles de detectar en una nave?',
          'Compara el ensayo 21174 C6 y el 21291 C1 en lenguaje sencillo.',
          '¿Cómo cambiaría la gravedad terrestre (1 g) la llama del ensayo 21242 A1?',
        ];
      }
      if (activeTab === 'ignition') {
        return [
          '¿Cuáles son los 3 ensayos más críticos dentro de la Zona Lunar?',
          '¿Por qué O₂ ≥ 30% y presión ≤ 10,2 psi aumentan el riesgo?',
          '¿Cuál fue la mayor temperatura medida en los filtros actuales?',
        ];
      }
      return [
        '¿Qué son las llamas frías usando una analogía de motor o cocina?',
        '¿Qué ensayo duró más y cuál alcanzó la mayor temperatura?',
        '¿Por qué la Base Lunar opera con O₂ ≥ 30% y presión ≤ 10,2 psi?',
      ];
    }
    if (activeTab === 'cool_flames') {
      return [
        'Por que chamas frias são difíceis de detectar numa nave?',
        'Compare o ensaio 21174 C6 e o 21291 C1 em linguagem simples.',
        'Como a gravidade da Terra (1 g) mudaria a chama do teste 21242 A1?',
      ];
    }
    if (activeTab === 'ignition') {
      return [
        'Quais são os 3 ensaios mais críticos dentro da Zona Lunar?',
        'Por que o O₂ ≥ 30% e pressão ≤ 10,2 psi aumentam o risco?',
        'Qual foi a maior temperatura medida nos filtros atuais?',
      ];
    }
    return [
      'O que são chamas frias usando uma analogia de carro ou fogão?',
      'Qual ensaio durou mais tempo e qual esquentou mais o queimador?',
      'Por que a Base Lunar usa 30% de O₂ e pressão baixa (10,2 psi)?',
    ];
  }, [activeTab, lang]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, quizQuestions, quizCurrentIdx, quizFinished, chatOpen]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const dx = resizingRef.current.startX - e.clientX;
      onWidthChange(Math.min(560, Math.max(330, resizingRef.current.startW + dx)));
    };
    const onUp = () => {
      resizingRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onWidthChange]);

  const sendMessage = useCallback(
    async (
      promptText: string,
      chartContext?: string,
      interactionKind: AiInteractionKind = 'chat'
    ) => {
      const clean = promptText.trim();
      if (!clean || streaming) return;

      setQuizQuestions(null);
      setQuizError(null);
      setQuizFinished(false);
      setQuizLangChangedNotice(false);
      setQuizSource(null);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: clean,
      };
      const assistantId = `a-${Date.now() + 1}`;
      const historyForApi = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ]);
      setInput('');
      setStreaming(true);

      try {
        const apiLang = toApiLanguage(lang);
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lang: apiLang,
            interactionKind,
            messages: historyForApi,
            selectedTestId,
            level,
            dashboardContext: {
              activeTab,
              filtersSummary,
              kpisSummary,
              chartContext,
            },
          }),
        });

        if (!res.ok || !res.body) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(
            (errJson as { error?: string }).error || `HTTP ${res.status}`
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const evt of events) {
            const line = evt.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            const payload = JSON.parse(line.slice(6)) as {
              type: 'delta' | 'done' | 'error';
              text?: string;
              citedTestIds?: string[];
              error?: string;
            };

            if (payload.type === 'delta' && payload.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + payload.text }
                    : m
                )
              );
            } else if (payload.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        streaming: false,
                        citedTestIds: payload.citedTestIds ?? [],
                      }
                    : m
                )
              );
            } else if (payload.type === 'error') {
              throw new Error(payload.error || tStr.ai.streamErrorFallback);
            }
          }
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : tStr.ai.errorFallback;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: msg, error: true, streaming: false }
              : m
          )
        );
      } finally {
        setStreaming(false);
      }
    },
    [
      streaming,
      messages,
      selectedTestId,
      level,
      activeTab,
      filtersSummary,
      kpisSummary,
      lang,
      tStr.ai.errorFallback,
      tStr.ai.streamErrorFallback,
    ]
  );

  const startQuiz = useCallback(
    async (forceRefresh = false) => {
      if (streaming) return;
      const apiLang = toApiLanguage(lang);
      const cacheKey = `${apiLang}::${filtersSummary}`;

      setQuizError(null);
      setQuizSource(null);
      setQuizSelectedOption({});
      setQuizVerified({});
      setQuizShowHint({});
      setQuizCurrentIdx(0);
      setQuizFinished(false);

      if (!forceRefresh) {
        const cached = quizCacheRef.current.get(cacheKey);
        if (cached && cached.length > 0) {
          setQuizLang(lang);
          setQuizQuestions(cached);
          setQuizSource('cache');
          setQuizLoading(false);
          return;
        }
      }

      const requestId = ++quizRequestIdRef.current;
      setQuizLang(lang);
      setQuizLoading(true);
      setQuizQuestions(null);

      try {
        const res = await fetch('/api/assistant/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lang: apiLang,
            forceRefresh,
            filtersSummary,
            kpisSummary,
            sampleTests: filteredTests.slice(0, 25),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error || `HTTP ${res.status}`
          );
        }
        const data = (await res.json()) as {
          language?: string;
          questions: QuizQuestion[];
          source?: 'ai' | 'cache' | 'fallback';
        };
        if (quizRequestIdRef.current !== requestId) return;
        if (
          data.language !== apiLang ||
          !Array.isArray(data.questions) ||
          data.questions.length === 0
        ) {
          throw new Error(tStr.ai.quizErrorFallback);
        }
        if (data.source !== 'fallback') {
          quizCacheRef.current.set(cacheKey, data.questions);
        }
        setQuizLang(lang);
        setQuizQuestions(data.questions);
        setQuizSource(data.source ?? 'ai');
      } catch (err: unknown) {
        if (quizRequestIdRef.current !== requestId) return;
        setQuizError(
          err instanceof Error ? err.message : tStr.ai.quizErrorFallback
        );
      } finally {
        if (quizRequestIdRef.current === requestId) {
          setQuizLoading(false);
        }
      }
    },
    [
      streaming,
      lang,
      filtersSummary,
      kpisSummary,
      filteredTests,
      tStr.ai.quizErrorFallback,
    ]
  );

  const restartCurrentQuiz = useCallback(() => {
    setQuizSelectedOption({});
    setQuizVerified({});
    setQuizShowHint({});
    setQuizCurrentIdx(0);
    setQuizFinished(false);
  }, []);

  // When switching language while a quiz is open, clear old questions and prompt the user instead of auto-calling the API
  useEffect(() => {
    const hasQuizOpen =
      quizQuestions !== null ||
      quizLoading ||
      quizFinished ||
      quizError !== null;
    if (hasQuizOpen && quizLang && quizLang !== lang) {
      quizRequestIdRef.current += 1;
      setQuizLang(lang);
      setQuizLoading(false);
      setQuizQuestions(null);
      setQuizSelectedOption({});
      setQuizVerified({});
      setQuizShowHint({});
      setQuizCurrentIdx(0);
      setQuizFinished(false);
      setQuizError(null);
      setQuizSource(null);
      setQuizLangChangedNotice(true);
    }
  }, [lang, quizLang, quizQuestions, quizLoading, quizFinished, quizError]);

  useEffect(() => {
    if (
      aiExternalPrompt &&
      aiExternalPrompt.id !== lastExternalIdRef.current
    ) {
      lastExternalIdRef.current = aiExternalPrompt.id;
      if (aiExternalPrompt.mode === 'quiz') {
        setQuizLangChangedNotice(false);
        void startQuiz(false);
      } else {
        void sendMessage(
          aiExternalPrompt.text,
          aiExternalPrompt.chartContext,
          aiExternalPrompt.kind ?? 'explain_chart'
        );
      }
    }
  }, [aiExternalPrompt, sendMessage, startQuiz]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const backLabel = tStr.ai.backLabel;

  return (
    <>
      {!chatOpen && !filterSheetOpen && (
        <div
          style={{
            zIndex: 'var(--z-chat)',
          }}
          className={`group/fab fixed bottom-[4.25rem] right-3 md:bottom-4 md:right-4 flex items-center gap-2.5 transition-all duration-300 ${
            fabRetracted
              ? 'translate-y-4 scale-75 opacity-35 hover:translate-y-0 hover:scale-100 hover:opacity-100'
              : 'translate-y-0 scale-100 opacity-100'
          }`}
        >
          <div
            role="tooltip"
            className="pointer-events-none translate-x-2 rounded-full border border-cyan-400/40 bg-[#121A30]/95 px-3.5 py-1.5 text-right opacity-0 shadow-xl shadow-black/60 backdrop-blur-md transition-all duration-200 group-hover/fab:translate-x-0 group-hover/fab:opacity-100 group-focus-within/fab:translate-x-0 group-focus-within/fab:opacity-100"
          >
            <div className="whitespace-nowrap text-xs font-semibold text-cyan-100">
              {tStr.ai.title}
            </div>
            <div className="whitespace-nowrap text-[10px] text-cyan-300/90">
              {tStr.ai.launcherSub}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label={`${tStr.ai.title} · ${tStr.ai.launcherSub}`}
            title={tStr.ai.title}
            className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full border border-cyan-400/60 bg-[#121A30]/95 text-cyan-300 shadow-2xl shadow-cyan-950/70 backdrop-blur-md transition-transform hover:scale-105 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <Bot className="h-6 w-6" />
          </button>
        </div>
      )}

      {chatOpen && (
        <>
          {!isMobileView && (
            <div
              style={{ zIndex: 'calc(var(--z-chat) - 1)' }}
              className="fixed inset-0 bg-black/45 lg:hidden"
              onClick={() => setChatOpen(false)}
            />
          )}
          <section
            aria-label={tStr.ai.title}
            style={
              isMobileView
                ? {
                    zIndex: 'calc(var(--z-modal) + 2)',
                    top: 0,
                    left: 0,
                    right: 0,
                    width: '100vw',
                    height: '100dvh',
                  }
                : {
                    zIndex: 'var(--z-chat)',
                    top: 'var(--header-h)',
                    height: 'calc(100dvh - var(--header-h))',
                    width: `min(100vw, ${panelWidth}px)`,
                  }
            }
            className={`fixed right-0 flex flex-col overflow-hidden bg-[#0F172A] shadow-2xl shadow-black/80 ${
              isMobileView ? '' : 'border-l border-slate-700'
            }`}
          >
            {/* Left-edge drag resize handle on desktop */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                resizingRef.current = { startX: e.clientX, startW: panelWidth };
              }}
              title={tStr.ai.resizeHandleTitle}
              className="absolute inset-y-0 left-0 z-10 hidden w-1.5 cursor-ew-resize hover:bg-cyan-400/50 lg:block"
            />

            <header className="flex items-center justify-between gap-2 border-b border-slate-800 bg-[#121A30] px-3 py-2.5 sm:px-3.5">
              <div className="flex min-w-0 items-center gap-2">
                {isMobileView && (
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    aria-label={backLabel}
                    className="inline-flex min-h-[30px] shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                    <span>{backLabel}</span>
                  </button>
                )}
                <div className="flex min-h-[28px] min-w-[28px] shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-slate-100">
                    {tStr.ai.title}
                  </h2>
                  <p className="truncate text-[10px] text-slate-400">
                    {tStr.ai.subtitle(tests.length || 333)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    title={tStr.ai.clearChatTitle}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  aria-label={tStr.ai.minimizeChatLabel}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-[#0B1020] px-3 py-1.5">
              <div
                className="flex rounded border border-slate-700 bg-[#121A30] p-0.5 text-[10px]"
                role="group"
              >
                <button
                  type="button"
                  onClick={() => setLevel('simples')}
                  className={`min-h-[22px] whitespace-nowrap rounded px-2 py-0.5 font-medium transition-colors ${
                    level === 'simples'
                      ? 'bg-cyan-500/20 text-cyan-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tStr.ai.simple}
                </button>
                <button
                  type="button"
                  onClick={() => setLevel('tecnico')}
                  className={`min-h-[22px] whitespace-nowrap rounded px-2 py-0.5 font-medium transition-colors ${
                    level === 'tecnico'
                      ? 'bg-purple-500/20 text-purple-200'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tStr.ai.tech}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuizLangChangedNotice(false);
                  void startQuiz(false);
                }}
                disabled={quizLoading || streaming}
                className="inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
              >
                <HelpCircle className="h-3 w-3 shrink-0" />
                <span>{quizLoading ? tStr.ai.quizLoading : tStr.ai.quizBtn}</span>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {messages.length === 0 &&
                !quizQuestions &&
                !quizLoading &&
                !quizError &&
                !quizLangChangedNotice && (
                <div className="space-y-3">
                  <div className="wrap-anywhere rounded-lg border border-slate-800 bg-[#121A30] p-3 text-xs text-slate-300">
                    {tStr.ai.welcome(kpis.total)}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {tStr.ai.suggestionsTitle}
                    </div>
                    {dynamicSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => void sendMessage(sug, undefined, 'chip')}
                        className="flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-[#121A30]/70 px-3 py-2 text-left text-[11px] text-slate-200 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10"
                      >
                        <Sparkles className="h-3 w-3 shrink-0 text-cyan-400" />
                        <span className="wrap-anywhere">{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-xl px-3 py-2.5 ${
                      m.role === 'user'
                        ? 'border border-cyan-500/35 bg-cyan-600/25 text-xs text-slate-100'
                        : m.error
                          ? 'border border-red-500/40 bg-red-500/10 text-xs text-red-200'
                          : 'border border-slate-800 bg-[#121A30] text-slate-200'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <span className="wrap-anywhere">{m.content}</span>
                    ) : m.content ? (
                      <FormattedMarkdown
                        text={m.content}
                        onSelectTest={(id) => selectTest(id, true)}
                      />
                    ) : (
                      <span className="text-xs italic text-slate-400">...</span>
                    )}

                    {m.role === 'assistant' && !m.streaming && !m.error && m.content && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-1.5">
                        <div className="flex flex-wrap gap-1">
                          {(m.citedTestIds ?? []).slice(0, 5).map((id) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => selectTest(id, true)}
                              className="whitespace-nowrap rounded border border-cyan-500/35 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300 hover:bg-cyan-500/20"
                            >
                              {tStr.ai.viewTest} {id}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              {tStr.ai.copied}
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              {tStr.ai.copy}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {quizLangChangedNotice && (
                <div
                  role="status"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100"
                >
                  <span className="wrap-anywhere font-medium">
                    {tStr.ai.quizLangChangedPrompt}
                  </span>
                  <button
                    type="button"
                    disabled={quizLoading}
                    onClick={() => {
                      setQuizLangChangedNotice(false);
                      void startQuiz(false);
                    }}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-cyan-400/50 bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3 shrink-0" />
                    <span>{tStr.ai.quizRegenerateBtn}</span>
                  </button>
                </div>
              )}

              {quizLoading && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  {tStr.ai.quizLoading}
                </div>
              )}

              {quizError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                  {quizError}
                </div>
              )}

              {quizQuestions && quizQuestions.length > 0 && (
                <div className="space-y-3">
                  {quizSource === 'fallback' && (
                    <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
                      {tStr.ai.quizOfflineFallbackNotice}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-300">
                        {tStr.ai.quizTitle(quizQuestions.length)}
                      </span>
                      {!quizFinished && (
                        <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-200">
                          {tStr.ai.quizProgress(
                            quizCurrentIdx + 1,
                            quizQuestions.length
                          )}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizQuestions(null);
                        setQuizLangChangedNotice(false);
                        setQuizFinished(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      {tStr.ai.closeQuiz}
                    </button>
                  </div>

                  {quizFinished ? (
                    (() => {
                      const correctCount = quizQuestions.reduce(
                        (acc, item, idx) =>
                          quizVerified[idx] &&
                          quizSelectedOption[idx] === item.correctIndex
                            ? acc + 1
                            : acc,
                        0
                      );
                      return (
                        <div className="space-y-3 rounded-xl border border-emerald-500/40 bg-[#121A30] p-4 text-center">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                            <Award className="h-5 w-5" />
                          </div>
                          <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                            {tStr.ai.quizScoreTitle}
                          </div>
                          <div className="font-mono text-2xl font-bold tabular-nums text-slate-100">
                            {correctCount} / {quizQuestions.length}
                          </div>
                          <p className="wrap-anywhere text-xs text-slate-300">
                            {tStr.ai.quizScoreSummary(
                              correctCount,
                              quizQuestions.length
                            )}
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={restartCurrentQuiz}
                              className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
                            >
                              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                              <span>{tStr.ai.quizRestartBtn}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuizLangChangedNotice(false);
                                void startQuiz(true);
                              }}
                              className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
                            >
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              <span>{tStr.ai.quizRegenerateBtn}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const q = quizQuestions[quizCurrentIdx];
                      if (!q) return null;
                      const chosen = quizSelectedOption[quizCurrentIdx];
                      const verified = Boolean(quizVerified[quizCurrentIdx]);
                      const isAnswerCorrect =
                        verified && chosen === q.correctIndex;
                      const hintOpen = Boolean(quizShowHint[quizCurrentIdx]);
                      const isLastQuestion =
                        quizCurrentIdx >= quizQuestions.length - 1;

                      return (
                        <div className="rounded-xl border border-slate-800 bg-[#121A30] p-3 text-xs">
                          <p className="wrap-anywhere font-semibold text-slate-100">
                            {quizCurrentIdx + 1}. {q.question}
                          </p>

                          {q.hint && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setQuizShowHint((prev) => ({
                                    ...prev,
                                    [quizCurrentIdx]: !hintOpen,
                                  }))
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-amber-200"
                              >
                                <Lightbulb className="h-3 w-3 shrink-0" />
                                <span>
                                  {hintOpen
                                    ? tStr.ai.quizHideHintBtn
                                    : tStr.ai.quizHintBtn}
                                </span>
                              </button>
                              {hintOpen && (
                                <p className="wrap-anywhere mt-1 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-100">
                                  {q.hint}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="mt-2.5 space-y-1.5">
                            {q.options.map((opt, optIdx) => {
                              const isCorrectOpt = optIdx === q.correctIndex;
                              const isChosen = chosen === optIdx;
                              let style = isChosen
                                ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-100'
                                : 'border-slate-700 bg-[#0B1020] text-slate-200 hover:border-cyan-500/40';
                              if (verified) {
                                if (isCorrectOpt) {
                                  style =
                                    'border-emerald-500/60 bg-emerald-500/15 text-emerald-200';
                                } else if (isChosen) {
                                  style =
                                    'border-red-500/60 bg-red-500/15 text-red-200';
                                } else {
                                  style =
                                    'border-slate-800 bg-[#0B1020] text-slate-500';
                                }
                              }
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={verified}
                                  onClick={() =>
                                    setQuizSelectedOption((prev) => ({
                                      ...prev,
                                      [quizCurrentIdx]: optIdx,
                                    }))
                                  }
                                  className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-colors ${style}`}
                                >
                                  <span className="wrap-anywhere">{opt}</span>
                                  {verified && isCorrectOpt && (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                  )}
                                  {verified && isChosen && !isCorrectOpt && (
                                    <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {!verified ? (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                disabled={chosen === undefined}
                                onClick={() =>
                                  setQuizVerified((prev) => ({
                                    ...prev,
                                    [quizCurrentIdx]: true,
                                  }))
                                }
                                className="inline-flex min-h-[28px] items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-40"
                              >
                                <Check className="h-3.5 w-3.5 shrink-0" />
                                <span>{tStr.ai.quizVerifyBtn}</span>
                              </button>
                              <button
                                type="button"
                                onClick={restartCurrentQuiz}
                                className="inline-flex min-h-[28px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-[11px] text-slate-300 hover:text-slate-100"
                              >
                                <RefreshCw className="h-3 w-3 shrink-0" />
                                <span>{tStr.ai.quizRestartBtn}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              <div
                                className={`rounded-lg border p-2 text-[11px] ${
                                  isAnswerCorrect
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                    : 'border-red-500/40 bg-red-500/10 text-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 font-semibold">
                                  {isAnswerCorrect ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                                  )}
                                  <span>
                                    {isAnswerCorrect
                                      ? tStr.ai.quizCorrectMsg
                                      : tStr.ai.quizIncorrectMsg}
                                  </span>
                                </div>
                                {(isAnswerCorrect
                                  ? q.correctFeedback
                                  : q.incorrectFeedback) && (
                                  <p className="wrap-anywhere mt-1 text-slate-200">
                                    {isAnswerCorrect
                                      ? q.correctFeedback
                                      : q.incorrectFeedback}
                                  </p>
                                )}
                              </div>

                              <div className="wrap-anywhere rounded-lg border border-slate-800 bg-[#0B1020] p-2 text-[11px] text-slate-300">
                                <p>{q.explanation}</p>
                                {q.testIdRef && (
                                  <button
                                    type="button"
                                    onClick={() => selectTest(q.testIdRef, true)}
                                    className="mt-1 font-mono text-[10px] text-cyan-300 underline"
                                  >
                                    {tStr.ai.viewTest}: {q.testIdRef}
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                <button
                                  type="button"
                                  onClick={restartCurrentQuiz}
                                  className="inline-flex min-h-[28px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-[11px] text-slate-300 hover:text-slate-100"
                                >
                                  <RefreshCw className="h-3 w-3 shrink-0" />
                                  <span>{tStr.ai.quizRestartBtn}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isLastQuestion) {
                                      setQuizFinished(true);
                                    } else {
                                      setQuizCurrentIdx((idx) => idx + 1);
                                    }
                                  }}
                                  className="inline-flex min-h-[28px] items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
                                >
                                  <span>
                                    {isLastQuestion
                                      ? tStr.ai.quizFinishBtn
                                      : tStr.ai.quizNextBtn}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input, undefined, 'chat');
              }}
              style={{
                paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))',
              }}
              className="border-t border-slate-800 bg-[#121A30] px-2.5 pt-2.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={tStr.ai.placeholder}
                  disabled={streaming}
                  className="min-h-[34px] flex-1 rounded-lg border border-slate-700 bg-[#0B1020] px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  aria-label={tStr.ai.sendLabel}
                  className="flex min-h-[34px] min-w-[34px] shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 transition-colors hover:bg-cyan-400 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </>
  );
};
