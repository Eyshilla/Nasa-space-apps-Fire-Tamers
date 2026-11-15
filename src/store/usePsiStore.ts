import { create } from 'zustand';
import type {
  AppLanguage,
  CrossFilter,
  DashboardTab,
  DataDictionaryEntry,
  GlobalFilters,
  Psi159DatasetResponse,
  Psi159Summary,
  Psi159Test,
} from '../types/psi159';

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

interface AiExternalPrompt {
  id: number;
  text: string;
  chartContext?: string;
  mode?: 'chat' | 'quiz';
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
  helpOpen: boolean;
  chatOpen: boolean;
  filterSheetOpen: boolean;
  presentationMode: boolean;
  aiExternalPrompt: AiExternalPrompt | null;

  fetchDataset: () => Promise<void>;
  setLang: (lang: AppLanguage) => void;
  setActiveTab: (tab: DashboardTab) => void;
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
  setHelpOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setFilterSheetOpen: (open: boolean) => void;
  setPresentationMode: (enabled: boolean) => void;
  togglePresentationMode: () => void;
  askAi: (text: string, chartContext?: string) => void;
  triggerQuiz: () => void;
}

export const usePsiStore = create<PsiState>((set, get) => ({
  tests: [],
  dictionary: [],
  summary: null,
  loading: true,
  error: null,
  lang: 'pt',
  activeTab: 'overview',
  filters: DEFAULT_FILTERS,
  selectedTestId: '21174 C6',
  drawerOpen: false,
  helpOpen: false,
  chatOpen: false,
  filterSheetOpen: false,
  presentationMode: false,
  aiExternalPrompt: null,

  fetchDataset: async () => {
    set({ loading: true, error: null });
    try {
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
      set({
        loading: false,
        error:
          err instanceof Error
            ? err.message
            : 'Falha ao carregar os dados experimentais PSI-159.',
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
      chatOpen: openDrawer && narrowDesktop ? false : s.chatOpen,
    }));
  },

  setDrawerOpen: (drawerOpen) => {
    const narrowDesktop =
      typeof window !== 'undefined' && window.innerWidth < 1520;
    set((s) => ({
      drawerOpen,
      chatOpen: drawerOpen && narrowDesktop ? false : s.chatOpen,
    }));
  },

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

  askAi: (text, chartContext) => {
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
