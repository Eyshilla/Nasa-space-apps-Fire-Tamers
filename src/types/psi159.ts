export type AppLanguage = 'pt' | 'en' | 'es';
export type ChartFontScaleLevel = 'normal' | 'large' | 'xlarge';

export interface Psi159Test {
  investigation: string;
  test_id: string;
  flame_type: 'normal' | 'inverse';
  day: number;
  fuel: 'ethane' | 'propane' | 'butane' | string;
  fuel_mix_pct: number;
  o2_fraction: number;
  o2_fraction_after: number;
  o2_location: 'chamber' | 'burner_flow' | string;
  fuel_fraction: number;
  fuel_fraction_after: number;
  fuel_location: 'chamber' | 'burner_flow' | string;
  pressure_bar: number;
  pressure_psi: number;
  hc_flow_mg_s: number;
  o2_flow_mg_s: number | null;
  tad_k: number | null;
  zst: number | null;
  tfp: boolean;
  ignition_type: 'hot' | 'cool' | 'flash' | 'none' | string;
  ignited: boolean;
  outcome:
    | 'no_ignition'
    | 'self_extinguished'
    | 'flow_terminated'
    | 'flash_only'
    | 'cool_flame_only'
    | string;
  burn_time_s: number | null;
  cool_flame: boolean;
  cool_flame_code: string | null;
  peak_burner_temp_c: number | null;
  peak_burner_temp_k: number | null;
  flame_color: string | null;
  hit_burner_temp_limit: boolean;
  quality_notes: string | null;
  comments: string | null;
  _arquivo: string;
}

export interface DataDictionaryEntry {
  coluna: string;
  rotulo: string;
  unidade: string;
  explicacao_simples: string;
  observacao_tecnica: string;
}

export interface Psi159Summary {
  totalTests: number;
  normalCount: number;
  inverseCount: number;
  ignitedCount: number;
  coolFlameCount: number;
  coolFlameOnlyCount: number;
  tempLimitCount: number;
  maxPeakTempC: number;
  maxPeakTempK: number;
  maxPeakTempTestId: string;
  minPressureBar: number;
  maxPressureBar: number;
  minPressurePsi: number;
  maxPressurePsi: number;
  longestBurnS: number;
  longestBurnTestId: string;
  fuels: string[];
}

export interface Psi159DatasetResponse {
  tests: Psi159Test[];
  dictionary: DataDictionaryEntry[];
  summary: Psi159Summary;
}

export type DashboardTab =
  | 'overview'
  | 'analyses'
  | 'ignition'
  | 'cool_flames'
  | 'explore'
  | 'about';

export type OverviewCardTabId =
  | 'outcomes'
  | 'burn'
  | 'radar'
  | 'timeline'
  | 'flow';

export interface CrossFilter {
  source: string;
  label: string;
  testIds: string[];
}

export interface GlobalFilters {
  fuels: string[];
  flameTypes: Array<'normal' | 'inverse'>;
  o2Range: [number, number];
  psiRange: [number, number];
  outcomes: string[];
  onlyCoolFlames: boolean;
  crossFilter: CrossFilter | null;
}

export interface ComputedKpis {
  total: number;
  ignitedCount: number;
  ignitedPct: number;
  coolFlameCount: number;
  maxPeakTempC: number | null;
  maxPeakTempTestId: string | null;
  avgBurnTimeS: number;
  maxBurnTimeS: number;
  maxBurnTestId: string | null;
  o2Min: number | null;
  o2Max: number | null;
  psiMin: number | null;
  psiMax: number | null;
  lunarZoneCount: number;
  lunarZonePct: number;
  tempLimitCount: number;
  dailyCounts: number[];
}

export interface LunarRankedTest {
  test: Psi159Test;
  score: number;
  breakdown: {
    lunarZonePts: number;
    coolFlamePts: number;
    thermalPts: number;
    burnPts: number;
  };
  inLunarZone: boolean;
}

export interface DiscoveryCard {
  id: string;
  title: string;
  metric: string;
  description: string;
  tone: 'cyan' | 'purple' | 'red' | 'amber' | 'emerald';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citedTestIds?: string[];
  error?: boolean;
  streaming?: boolean;
}

export type ApiLanguageCode = 'pt-BR' | 'en' | 'es';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  explanation: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  testIdRef: string;
}
