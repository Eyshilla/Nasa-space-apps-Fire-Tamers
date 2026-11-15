import React, { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import { useStrings } from '../utils/i18n';
import { ChartCard } from './ChartCard';
import { InfoTooltip } from './InfoTooltip';
import { InsightsSection } from './InsightsSection';

export const AboutDataView: React.FC = () => {
  const dictionary = usePsiStore((s) => s.dictionary);
  const tests = usePsiStore((s) => s.tests);
  const lang = usePsiStore((s) => s.lang);
  const tStr = useStrings(lang);
  const [search, setSearch] = useState('');

  const filteredDict = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dictionary;
    return dictionary.filter(
      (d) =>
        d.coluna.toLowerCase().includes(q) ||
        d.rotulo.toLowerCase().includes(q) ||
        d.explicacao_simples.toLowerCase().includes(q) ||
        d.observacao_tecnica.toLowerCase().includes(q)
    );
  }, [dictionary, search]);

  return (
    <div className="space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121A30] p-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
            <BookOpen className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="wrap-anywhere">
              {lang === 'en'
                ? 'Mission Context · PSI-159 (ACME / CFI-G)'
                : lang === 'es'
                  ? 'Contexto de la Misión · PSI-159 (ACME / CFI-G)'
                  : 'Contexto da Missão · PSI-159 (ACME / CFI-G)'}
            </span>
          </h2>
          <p className="wrap-anywhere mt-2 text-xs text-slate-300">
            {lang === 'en'
              ? `NASA's Cool Flames Investigation with Gases (CFI-G) on the ISS ran ${tests.length || 333} microgravity tests over 12 days using a porous spherical burner with ethane, propane, and butane in normal and inverse flames.`
              : lang === 'es'
                ? `El experimento Cool Flames Investigation with Gases (CFI-G) en la ISS ejecutó ${tests.length || 333} ensayos en microgravedad durante 12 días usando etano, propano y butano en llamas normales e inversas.`
                : `O experimento Cool Flames Investigation with Gases (CFI-G), parte do projeto ACME na ISS, avaliou ${tests.length || 333} ensaios em microgravidade ao longo de 12 dias utilizando um queimador esférico poroso com etano, propano e butano, em chamas normais e inversas.`}
          </p>
          <p className="wrap-anywhere mt-2 text-xs text-slate-300">
            {lang === 'en'
              ? 'Future Lunar Base habitats and pressurized rovers plan to operate at O₂ ≥ 30% and pressure ≤ 10.2 psi, making materials much more flammable. The CFI-G chamber reached up to 85% O₂.'
              : lang === 'es'
                ? 'Las futuras bases lunares y rovers presurizados operarán con O₂ ≥ 30% y presión ≤ 10,2 psi, donde todo arde más rápido. La cámara CFI-G llegó hasta 85% de O₂.'
                : 'Em futuras bases na Lua e rovers pressurizados, a atmosfera operacional prevista é de O₂ ≥ 30% e pressão ≤ 10,2 psi — condição na qual materiais pegam fogo muito mais facilmente. A câmara de CFI-G testou até 85% de O₂.'}
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-800 bg-[#121A30] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            {lang === 'en'
              ? 'Reference Atmospheres'
              : lang === 'es'
                ? 'Atmósferas de Referencia'
                : 'Atmosferas de Referência'}
          </h3>
          <dl className="mt-2.5 space-y-2 text-xs">
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">{tStr.ignitionChart.earthAir}</dt>
              <dd className="whitespace-nowrap font-mono font-semibold text-yellow-300">
                21% O₂ · 14,7 psi
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">{tStr.ignitionChart.lunarZone}</dt>
              <dd className="whitespace-nowrap font-mono font-semibold text-emerald-300">
                ≥ 30% O₂ · ≤ 10,2 psi
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">EVA Suit</dt>
              <dd className="whitespace-nowrap font-mono font-semibold text-sky-300">
                100% O₂ · 4,3 psi
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-slate-400">CFI-G</dt>
              <dd className="whitespace-nowrap font-mono font-semibold text-slate-100">
                12–85% O₂ · 7,2–48 psi
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <InsightsSection tests={tests} />

      <ChartCard
        title={
          lang === 'en'
            ? `Official Data Dictionary (${dictionary.length} columns)`
            : lang === 'es'
              ? `Diccionario de Datos Oficial (${dictionary.length} columnas)`
              : `Dicionário de Dados Oficial (${dictionary.length} variáveis)`
        }
        subtitle="dicionario_dados.csv · psi159_unificado.csv"
        plotAutoHeight
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tStr.table.searchPlaceholder}
              aria-label={tStr.table.searchPlaceholder}
              className="min-h-[30px] w-52 max-w-full rounded-md border border-slate-700 bg-[#0B1020] py-1 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none sm:w-60"
            />
          </div>
        }
      >
        <div className="max-h-[460px] overflow-auto rounded-lg border border-slate-800/70">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead
              style={{ zIndex: 'var(--z-sticky)' }}
              className="sticky top-0 bg-[#0F172A]"
            >
              <tr className="border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="min-w-[140px] px-3 py-2">Coluna</th>
                <th className="min-w-[140px] px-2 py-2">Rótulo</th>
                <th className="min-w-[70px] px-2 py-2">Unidade</th>
                <th className="min-w-[220px] px-2 py-2">Explicação</th>
                <th className="min-w-[180px] px-2 py-2">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredDict.map((entry) => (
                <tr key={entry.coluna} className="hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-mono text-[11px] font-semibold text-cyan-300">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{entry.coluna}</span>
                      <InfoTooltip term={entry.coluna} />
                    </span>
                  </td>
                  <td className="wrap-anywhere px-2 py-2 font-medium text-slate-100">
                    {entry.rotulo}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-slate-400">
                    {entry.unidade}
                  </td>
                  <td className="wrap-anywhere px-2 py-2 text-slate-300">
                    {entry.explicacao_simples}
                  </td>
                  <td className="wrap-anywhere px-2 py-2 text-[11px] text-slate-400">
                    {entry.observacao_tecnica}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};
