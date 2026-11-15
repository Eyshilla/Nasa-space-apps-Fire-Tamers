import type {
  DataDictionaryEntry,
  Psi159DatasetResponse,
  Psi159Summary,
  Psi159Test,
} from '../types/psi159';

export function resolvePublicAssetPath(relPath: string): string {
  const clean = relPath.replace(/^\/+/, '');
  const base =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env?.BASE_URL === 'string' &&
    import.meta.env.BASE_URL.length > 0
      ? import.meta.env.BASE_URL
      : './';
  return base.endsWith('/') ? `${base}${clean}` : `${base}/${clean}`;
}

export const STATIC_DICT_CSV_URL = resolvePublicAssetPath(
  'assets/aistudio/dicionario_dados_a4c7d2bd.csv'
);
export const STATIC_DATA_CSV_URL = resolvePublicAssetPath(
  'assets/aistudio/psi159_unificado_f4d98f38.csv'
);

export function parseCsvRows(csvText: string): string[][] {
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

export function parsePsi159Dataset(
  rawDictionaryCsv: string,
  rawDataCsv: string
): Psi159DatasetResponse {
  const dictRows = parseCsvRows(rawDictionaryCsv);
  const dictHeaders = dictRows[0] ?? [];
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
  const dataHeaders = dataRows[0] ?? [];
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

let preloadedPromise: Promise<Psi159DatasetResponse | null> | null = null;
let preloadedCache: Psi159DatasetResponse | null = null;

export function getPreloadedPsi159Dataset(): Psi159DatasetResponse | null {
  return preloadedCache;
}

/**
 * Preloads the static CSV files in the background without hitting /api/* endpoints.
 * Safe to invoke during the cover screen so opening the dashboard is instantaneous.
 */
export function preloadPsi159Csv(): Promise<Psi159DatasetResponse | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return Promise.resolve(null);
  }
  if (preloadedCache) return Promise.resolve(preloadedCache);
  if (preloadedPromise) return preloadedPromise;

  preloadedPromise = (async () => {
    try {
      const [dictRes, dataRes] = await Promise.all([
        fetch(STATIC_DICT_CSV_URL, { cache: 'force-cache' }),
        fetch(STATIC_DATA_CSV_URL, { cache: 'force-cache' }),
      ]);
      if (!dictRes.ok || !dataRes.ok) return null;
      const [dictText, dataText] = await Promise.all([
        dictRes.text(),
        dataRes.text(),
      ]);
      const parsed = parsePsi159Dataset(dictText, dataText);
      if (parsed.tests.length === 0) return null;
      preloadedCache = parsed;
      return parsed;
    } catch {
      return null;
    }
  })();

  return preloadedPromise;
}
