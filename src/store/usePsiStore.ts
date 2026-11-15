import { create } from 'zustand';
import type {
  AppLanguage,
  ChartFontScaleLevel,
  CrossFilter,
  DashboardTab,
  DataDictionaryEntry,
  GlobalFilters,
  OverviewCardTabId,
  Psi159DatasetResponse,
  Psi159Summary,
  Psi159Test,
} from '../types/psi159';
import {
  getPreloadedPsi159Dataset,
  preloadPsi159Csv,
} from '../utils/parsePsi159';

export function detectBrowserLanguage(): AppLanguage {
  if (typeof window !== 'undefined') {
    const queryLang = new URLSearchParams(window.location.search)
      .get('lang')
      ?.trim()
      .toLowerCase();
    if (queryLang === 'en' || queryLang?.startsWith('en-')) return 'en';
    if (queryLang === 'es' || queryLang?.startsWith('es-')) return 'es';
    if (queryLang === 'pt' || queryLang?.startsWith('pt-')) return 'pt';
  }
  if (typeof navigator !== 'undefined') {
    const candidates = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language,
    ];
    for (const raw of candidates) {
      const code = (raw ?? '').trim().toLowerCase();
      if (!code) continue;
      if (code.startsWith('pt')) return 'pt';
      if (code.startsWith('en')) return 'en';
      if (code.startsWith('es')) return 'es';
    }
  }
  return 'pt';
}

export const CHART_FONT_SCALE_FACTORS: Record<ChartFontScaleLevel, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

const FONT_SCALE_STORAGE_KEY = 'fire_tamers_chart_font_scale';

function loadInitialChartFontScale(): ChartFontScaleLevel {
  if (typeof window === 'undefined') return 'large';
  try {
    const saved = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (saved === 'normal' || saved === 'large' || saved === 'xlarge') {
      return saved;
    }
  } catch {
    // ignore storage access issues
  }
  return 'large';
}

function persistChartFontScale(level: ChartFontScaleLevel): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, level);
  } catch {
    // ignore storage access issues
  }
}

const OVERVIEW_TAB_SESSION_KEY = 'fire_tamers_overview_card_tab';

function loadInitialOverviewCardTab(): OverviewCardTabId {
  if (typeof window === 'undefined') return 'outcomes';
  try {
    const saved = window.sessionStorage.getItem(OVERVIEW_TAB_SESSION_KEY);
    if (
      saved === 'outcomes' ||
      saved === 'burn' ||
      saved === 'radar' ||
      saved === 'timeline' ||
      saved === 'flow'
    ) {
      return saved;
    }
  } catch {
    // ignore session storage errors
  }
  return 'outcomes';
}

function persistOverviewCardTab(tab: OverviewCardTabId): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(OVERVIEW_TAB_SESSION_KEY, tab);
  } catch {
    // ignore session storage errors
  }
}

export const DEFAULT_O2_RANGE: [number, number] = [0.12, 0.85];
export const DEFAULT_PSI_RANGE: [number, number] = [7.18, 48.01];

export const DEFAULT_FILTERS: GlobalFilters = {
  fuels: [],
  flameTypes: [],
  o2Range: DEFAULT_O2_RANGE,
  psiRange: DEFAULT_PSI_RANGE,
  outcomes: [],
  onlyCoolFlames: false,
  crossFilter: null,
};

export type AiInteractionKind =
  | 'chat'
  | 'explain_chart'
  | 'analyze_test'
  | 'chip';

interface AiExternalPrompt {
  id: number;
  text: string;
  chartContext?: string;
  mode?: 'chat' | 'quiz';
  kind?: AiInteractionKind;
}

interface PsiState {
  tests: Psi159Test[];
  dictionary: DataDictionaryEntry[];
  summary: Psi159Summary | null;
  loading: boolean;
  error: string | null;
  lang: AppLanguage;
  activeTab: DashboardTab;
  filters: GlobalFilters;
  selectedTestId: string;
  drawerOpen: boolean;
  drawerView: 'detail' | 'cluster_list';
  clusterDrawerTests: Psi159Test[] | null;
  clusterDrawerTitle: string | null;
  helpOpen: boolean;
  chatOpen: boolean;
  filterSheetOpen: boolean;
  lunarRankingModalOpen: boolean;
  overviewCardTab: OverviewCardTabId;
  presentationMode: boolean;
  chartFontScale: ChartFontScaleLevel;
  aiExternalPrompt: AiExternalPrompt | null;

  fetchDataset: () => Promise<void>;
  setLang: (lang: AppLanguage) => void;
  setActiveTab: (tab: DashboardTab) => void;
  setOverviewCardTab: (tab: OverviewCardTabId) => void;
  setLunarRankingModalOpen: (open: boolean) => void;
  toggleFuel: (fuel: string) => void;
  toggleFlameType: (type: 'normal' | 'inverse') => void;
  setO2Range: (range: [number, number]) => void;
  setPsiRange: (range: [number, number]) => void;
  toggleOutcome: (outcome: string) => void;
  setOnlyCoolFlames: (val: boolean) => void;
  setCrossFilter: (cf: CrossFilter | null) => void;
  setFilters: (filters: GlobalFilters) => void;
  clearAllFilters: () => void;

  selectTest: (testId: string, openDrawer?: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  openClusterListDrawer: (tests: Psi159Test[], title: string) => void;
  backToClusterList: () => void;
  setHelpOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setFilterSheetOpen: (open: boolean) => void;
  setPresentationMode: (enabled: boolean) => void;
  togglePresentationMode: () => void;
  setChartFontScale: (level: ChartFontScaleLevel) => void;
  stepChartFontScale: (delta: -1 | 1, maxLevel?: ChartFontScaleLevel) => void;
  askAi: (
    text: string,
    chartContext?: string,
    kind?: AiInteractionKind
  ) => void;
  triggerQuiz: () => void;
}

export const usePsiStore = create<PsiState>((set, get) => ({
  tests: [],
  dictionary: [],
  summary: null,
  loading: true,
  error: null,
  lang: detectBrowserLanguage(),
  activeTab: 'overview',
  filters: DEFAULT_FILTERS,
  selectedTestId: '21174 C6',
  drawerOpen: false,
  drawerView: 'detail',
  clusterDrawerTests: null,
  clusterDrawerTitle: null,
  helpOpen: false,
  chatOpen: false,
  filterSheetOpen: false,
  lunarRankingModalOpen: false,
  overviewCardTab: loadInitialOverviewCardTab(),
  presentationMode: false,
  chartFontScale: loadInitialChartFontScale(),
  aiExternalPrompt: null,

  fetchDataset: async () => {
    const cachedPreload = getPreloadedPsi159Dataset();
    if (cachedPreload) {
      const defaultExists = cachedPreload.tests.some(
        (t) => t.test_id === '21174 C6'
      );
      set({
        tests: cachedPreload.tests,
        dictionary: cachedPreload.dictionary,
        summary: cachedPreload.summary,
        loading: false,
        error: null,
        selectedTestId: defaultExists
          ? '21174 C6'
          : (cachedPreload.tests[0]?.test_id ?? ''),
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      const preloaded = await preloadPsi159Csv();
      if (preloaded) {
        const defaultExists = preloaded.tests.some(
          (t) => t.test_id === '21174 C6'
        );
        set({
          tests: preloaded.tests,
          dictionary: preloaded.dictionary,
          summary: preloaded.summary,
          loading: false,
          selectedTestId: defaultExists
            ? '21174 C6'
            : (preloaded.tests[0]?.test_id ?? ''),
        });
        return;
      }

      const res = await fetch('/api/psi159/data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Psi159DatasetResponse;
      const defaultExists = data.tests.some((t) => t.test_id === '21174 C6');
      set({
        tests: data.tests,
        dictionary: data.dictionary,
        summary: data.summary,
        loading: false,
        selectedTestId: defaultExists
          ? '21174 C6'
          : (data.tests[0]?.test_id ?? ''),
      });
    } catch (err: unknown) {
      const currentLang = get().lang;
      const fallbackMsg =
        currentLang === 'en'
          ? 'Failed to load PSI-159 experimental data.'
          : currentLang === 'es'
            ? 'Error al cargar los datos experimentales PSI-159.'
            : 'Falha ao carregar os dados experimentais PSI-159.';
      set({
        loading: false,
        error: err instanceof Error ? err.message : fallbackMsg,
      });
    }
  },

  setLang: (lang) => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang =
        lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es' : 'en';
    }
    set({ lang });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setOverviewCardTab: (overviewCardTab) => {
    persistOverviewCardTab(overviewCardTab);
    set({ overviewCardTab });
  },

  setLunarRankingModalOpen: (lunarRankingModalOpen) =>
    set({ lunarRankingModalOpen }),

  toggleFuel: (fuel) =>
    set((s) => {
      const exists = s.filters.fuels.includes(fuel);
      const fuels = exists
        ? s.filters.fuels.filter((f) => f !== fuel)
        : [...s.filters.fuels, fuel];
      return { filters: { ...s.filters, fuels } };
    }),

  toggleFlameType: (type) =>
    set((s) => {
      const exists = s.filters.flameTypes.includes(type);
      const flameTypes = exists
        ? s.filters.flameTypes.filter((f) => f !== type)
        : [...s.filters.flameTypes, type];
      return { filters: { ...s.filters, flameTypes } };
    }),

  setO2Range: (o2Range) =>
    set((s) => ({ filters: { ...s.filters, o2Range } })),

  setPsiRange: (psiRange) =>
    set((s) => ({ filters: { ...s.filters, psiRange } })),

  toggleOutcome: (outcome) =>
    set((s) => {
      const exists = s.filters.outcomes.includes(outcome);
      const outcomes = exists
        ? s.filters.outcomes.filter((o) => o !== outcome)
        : [...s.filters.outcomes, outcome];
      return { filters: { ...s.filters, outcomes } };
    }),

  setOnlyCoolFlames: (onlyCoolFlames) =>
    set((s) => ({ filters: { ...s.filters, onlyCoolFlames } })),

  setCrossFilter: (crossFilter) =>
    set((s) => ({ filters: { ...s.filters, crossFilter } })),

  setFilters: (filters) => set({ filters }),

  clearAllFilters: () => set({ filters: DEFAULT_FILTERS }),

  selectTest: (testId, openDrawer = true) => {
    const exists = get().tests.some((t) => t.test_id === testId);
    if (!exists) return;
    // On desktop <1520px, close chat if drawer opens so main content doesn't get crushed
    const narrowDesktop =
      typeof window !== 'undefined' && window.innerWidth < 1520;
    set((s) => ({
      selectedTestId: testId,
      drawerOpen: openDrawer,
      drawerView: openDrawer ? 'detail' : s.drawerView,
      chatOpen: openDrawer && narrowDesktop ? false : s.chatOpen,
    }));
  },

  setDrawerOpen: (drawerOpen) => {
    const narrowDesktop =
      typeof window !== 'undefined' && window.innerWidth < 1520;
    set((s) => ({
      drawerOpen,
      drawerView: drawerOpen ? s.drawerView : 'detail',
      clusterDrawerTests: drawerOpen ? s.clusterDrawerTests : null,
      clusterDrawerTitle: drawerOpen ? s.clusterDrawerTitle : null,
      chatOpen: drawerOpen && narrowDesktop ? false : s.chatOpen,
    }));
  },

  openClusterListDrawer: (tests, title) => {
    const narrowDesktop =
      typeof window !== 'undefined' && window.innerWidth < 1520;
    set((s) => ({
      clusterDrawerTests: tests,
      clusterDrawerTitle: title,
      drawerView: 'cluster_list',
      drawerOpen: true,
      chatOpen: narrowDesktop ? false : s.chatOpen,
    }));
  },

  backToClusterList: () =>
    set((s) =>
      s.clusterDrawerTests && s.clusterDrawerTests.length > 0
        ? { drawerView: 'cluster_list', drawerOpen: true }
        : {}
    ),

  setHelpOpen: (helpOpen) => set({ helpOpen }),

  setChatOpen: (chatOpen) => {
    const narrowDesktop =
      typeof window !== 'undefined' && window.innerWidth < 1520;
    set((s) => ({
      chatOpen,
      drawerOpen: chatOpen && narrowDesktop ? false : s.drawerOpen,
    }));
  },

  setFilterSheetOpen: (filterSheetOpen) => set({ filterSheetOpen }),

  setPresentationMode: (presentationMode) =>
    set((s) => ({
      presentationMode,
      activeTab: presentationMode ? 'overview' : s.activeTab,
      helpOpen: presentationMode ? false : s.helpOpen,
      filterSheetOpen: presentationMode ? false : s.filterSheetOpen,
    })),

  togglePresentationMode: () =>
    set((s) => {
      const next = !s.presentationMode;
      return {
        presentationMode: next,
        activeTab: next ? 'overview' : s.activeTab,
        helpOpen: next ? false : s.helpOpen,
        filterSheetOpen: next ? false : s.filterSheetOpen,
      };
    }),

  setChartFontScale: (chartFontScale) => {
    persistChartFontScale(chartFontScale);
    set({ chartFontScale });
  },

  stepChartFontScale: (delta, maxLevel = 'xlarge') => {
    const order: ChartFontScaleLevel[] =
      maxLevel === 'large' ? ['normal', 'large'] : ['normal', 'large', 'xlarge'];
    const current = get().chartFontScale;
    const clampedIdx = Math.min(
      order.length - 1,
      Math.max(0, order.indexOf(current) === -1 ? order.length - 1 : order.indexOf(current))
    );
    const nextIdx = Math.min(order.length - 1, Math.max(0, clampedIdx + delta));
    const next = order[nextIdx];
    persistChartFontScale(next);
    set({ chartFontScale: next });
  },

  askAi: (text, chartContext, kind = 'explain_chart') => {
    const narrowDesktop =
      typeof window !== 'undefined' && window.innerWidth < 1520;
    set((s) => ({
      chatOpen: true,
      drawerOpen: narrowDesktop ? false : s.drawerOpen,
      aiExternalPrompt: {
        id: Date.now(),
        text,
        chartContext,
        mode: 'chat',
        kind,
      },
    }));
  },

  triggerQuiz: () => {
    const narrowDesktop =
      typeof window !== 'undefined' && window.innerWidth < 1520;
    set((s) => ({
      chatOpen: true,
      drawerOpen: narrowDesktop ? false : s.drawerOpen,
      aiExternalPrompt: {
        id: Date.now(),
        text: 'quiz',
        mode: 'quiz',
      },
    }));
  },
}));
