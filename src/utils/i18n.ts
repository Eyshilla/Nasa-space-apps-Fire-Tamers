import type { AppLanguage } from '../types/psi159';

export interface UiStrings {
  appTitle: string;
  appSubtitle: string;
  logoAlt: string;
  tabs: {
    overview: string;
    ignition: string;
    cool_flames: string;
    explore: string;
    about: string;
  };
  help: string;
  menu: string;
  presentation: string;
  exitPresentation: string;
  filters: {
    gas: string;
    flame: string;
    o2: string;
    pressure: string;
    outcome: string;
    outcomeHeader: string;
    onlyCoolFlames: string;
    clearFilters: string;
    active: string;
    testsOf: (filtered: number, total: number) => string;
  };
  chartCard: {
    explain: string;
    explainShort: string;
    legendBtn: string;
    emptyTitle: string;
    emptySubtitle: string;
  };
  kpis: {
    filteredTitle: string;
    filteredBody: string;
    ignitedTitle: string;
    ignitedBody: string;
    ignitedSub: string;
    coolTitle: string;
    coolBody: string;
    coolSub: string;
    peakTitle: string;
    peakBody: string;
    burnTitle: string;
    burnBody: string;
    burnMax: string;
    o2Title: string;
    o2Body: string;
    psiTitle: string;
    psiBody: string;
    lunarTitle: string;
    lunarBody: string;
    lunarSub: string;
  };
  sharedLegend: {
    title: string;
    hotNormal: string;
    hotInverse: string;
    cool: string;
    limit: string;
    none: string;
  };
  ignitionChart: {
    title: string;
    subtitle: string;
    points: string;
    heatmap: string;
    lunarZone: string;
    lunarSpecs: string;
    earthAir: string;
    earthShort: string;
    spacesuit: string;
    xAxis: string;
    xAxisShort: string;
    yAxis: string;
    legendNormal: string;
    legendInverse: string;
    legendCool: string;
    legendLimit: string;
    legendNone: string;
    hintBrush: string;
    hintCell: string;
  };
  flowChart: {
    title: string;
    subtitle: string;
    limitLabel: string;
    xAxis: string;
    xAxisShort: string;
    yAxis: string;
    legendLimit: string;
    legendCutoff: string;
    hintClick: string;
  };
  outcomesChart: {
    title: string;
    subtitle: string;
    yAxisLabel: string;
    inverseStripe: string;
    hintClick: string;
  };
  burnChart: {
    title: string;
    subtitle: string;
    hintClick: string;
  };
  radarChart: {
    title: string;
    subtitle: string;
    o2Mean: string;
    pressure: string;
    burnTime: string;
    peakTemp: string;
    ignitionRate: string;
  };
  timelineChart: {
    title: string;
    subtitle: string;
    tests: string;
    meanPeak: string;
    hintClick: string;
  };
  coolMatrix: {
    title: string;
    occurrences: string;
    hintClick: string;
    code: string;
    tests: string;
    gas: string;
    flame: string;
    typicalO2: string;
    typicalPsi: string;
    noneInFilter: string;
    directNoCode: string;
  };
  table: {
    title: string;
    searchPlaceholder: string;
    exportCsv: string;
    colId: string;
    colDay: string;
    colGas: string;
    colFlame: string;
    colO2: string;
    colPsi: string;
    colFlow: string;
    colBurn: string;
    colPeak: string;
    colOutcome: string;
    prev: string;
    next: string;
    pageOf: (p: number, total: number, count: number) => string;
  };
  param3d: {
    title: string;
    subtitle: string;
    hintOrbit: string;
    both: string;
    reset: string;
    zPeak: string;
    zFlow: string;
    zBurn: string;
    legendAxes: (zLabel: string) => string;
    legendLunar: string;
  };
  sim3d: {
    title: string;
    subtitle: string;
    microg: string;
    earth1g: string;
    microgCaption: string;
    earthCaption: string;
    activeTestLabel: string;
    presetsLabel: string;
    askAboutTest: string;
    colorLabel: string;
  };
  top10: {
    title: string;
    subtitle: string;
    howWeCalc: string;
    pts: string;
  };
  insights: {
    honestTitle: string;
    honestBody: string;
    earthTitle: string;
    earthDeepen: string;
    lunarWhyTitle: string;
  };
  drawer: {
    close: string;
    day: string;
    askAiBtn: string;
    openSimBtn: string;
    atmSection: string;
    thermalSection: string;
    qualityTitle: string;
    commentTitle: string;
  };
  ai: {
    title: string;
    subtitle: (n: number) => string;
    launcherSub: string;
    simple: string;
    tech: string;
    quizBtn: string;
    quizLoading: string;
    welcome: (n: number) => string;
    suggestionsTitle: string;
    placeholder: string;
    copy: string;
    copied: string;
    viewTest: string;
    quizTitle: (n: number) => string;
    closeQuiz: string;
  };
}

const PT: UiStrings = {
  appTitle: 'PSI-159 · Laboratório de Chamas Frias',
  appSubtitle: 'CFI-G / ACME · Microgravidade na ISS & Base Lunar',
  logoAlt: 'Logotipo Fire Tamers e ACME · Voltar para Visão Geral',
  tabs: {
    overview: 'Visão Geral',
    ignition: 'Mapa de Ignição',
    cool_flames: 'Chamas Frias',
    explore: 'Explorar Ensaios',
    about: 'Sobre os Dados',
  },
  help: 'Ajuda',
  menu: 'Menu',
  presentation: 'Apresentação (P)',
  exitPresentation: 'Sair (P / Esc)',
  filters: {
    gas: 'Gás:',
    flame: 'Chama:',
    o2: 'O₂:',
    pressure: 'Pressão:',
    outcome: 'Desfecho',
    outcomeHeader: 'Desfecho real (outcome)',
    onlyCoolFlames: 'Somente chamas frias',
    clearFilters: 'Limpar filtros',
    active: 'Ativos:',
    testsOf: (f, t) => `${f} de ${t} ensaios`,
  },
  chartCard: {
    explain: 'Explicar este gráfico',
    explainShort: 'Explicar',
    legendBtn: 'Legenda',
    emptyTitle: 'Nenhum ensaio corresponde aos filtros atuais.',
    emptySubtitle: 'Amplie a faixa de O₂ ou pressão, ou remova o filtro cruzado.',
  },
  kpis: {
    filteredTitle: 'Ensaios filtrados',
    filteredBody: 'Testes da câmara CFI-G que atendem aos filtros atuais (total: 333 ensaios em 12 dias na ISS).',
    ignitedTitle: 'Taxa de ignição',
    ignitedBody: 'Porcentagem de ensaios em que o gás entrou em ignição (quente, chama fria ou clarão).',
    ignitedSub: 'acenderam',
    coolTitle: 'Chamas frias',
    coolBody: 'Queima em baixa temperatura (~200–400 °C), quase invisível, como pré-ignição em motores.',
    coolSub: 'confirmadas',
    peakTitle: 'Pico térmico máx.',
    peakBody: 'Maior temperatura no queimador poroso. Ao atingir o limite do sensor, o fluxo é cortado.',
    burnTitle: 'Queima (méd / máx)',
    burnBody: 'Duração da chama em segundos. Sem convecção na microgravidade, a chama depende da difusão.',
    burnMax: 'máx',
    o2Title: 'Faixa de O₂',
    o2Body: 'Ar da Terra tem 21% de O₂; Base Lunar planeja ≥ 30%. A câmara CFI-G testou de 12% a 85%.',
    psiTitle: 'Faixa de pressão',
    psiBody: 'Ar ao nível do mar tem 14,7 psi. Habitats lunares operam até 10,2 psi.',
    lunarTitle: 'Zona Lunar',
    lunarBody: 'Fração de ensaios com O₂ ≥ 30% e pressão ≤ 10,2 psi, onde materiais inflamam mais fácil.',
    lunarSub: 'ens.',
  },
  sharedLegend: {
    title: 'Legenda geral:',
    hotNormal: 'Hot · Normal',
    hotInverse: 'Hot · Inversa',
    cool: 'Fria',
    limit: 'Limite',
    none: 'Sem ignição',
  },
  ignitionChart: {
    title: 'Mapa de Ignição · Pressão × O₂',
    subtitle: 'Fração de O₂ por pressão na câmara CFI-G',
    points: 'Pontos',
    heatmap: 'Mapa de calor',
    lunarZone: 'Zona Lunar',
    lunarSpecs: 'O₂≥30%, ≤10,2 psi',
    earthAir: 'Ar da Terra (21%, 14,7 psi)',
    earthShort: 'Ar da Terra',
    spacesuit: 'Traje: 4,3 psi · 100% O₂',
    xAxis: 'Pressão da Câmara (psi)',
    xAxisShort: 'Pressão (psi)',
    yAxis: 'Fração de O₂',
    legendNormal: 'Normal',
    legendInverse: 'Inversa',
    legendCool: 'Fria',
    legendLimit: 'Limite',
    legendNone: 'Sem ignição',
    hintBrush: 'Arraste para filtrar região · Clique num ponto para abrir o ensaio',
    hintCell: 'Clique numa célula para filtrar',
  },
  flowChart: {
    title: 'Fluxo de Combustível × Pico Térmico',
    subtitle: 'Escala logarítmica no fluxo (mg/s) por temperatura máxima',
    limitLabel: 'Limite térmico do queimador',
    xAxis: 'Fluxo de Combustível (mg/s · log)',
    xAxisShort: 'Fluxo (mg/s · log)',
    yAxis: 'Pico Térmico (°C)',
    legendLimit: 'Limite',
    legendCutoff: 'Fluxo cortado',
    hintClick: 'Cor por gás · Clique num ponto para inspecionar',
  },
  outcomesChart: {
    title: 'Desfechos por Gás e Chama',
    subtitle: 'Barras agrupadas: Normal (sólida) × Inversa (hachurada)',
    yAxisLabel: 'Nº de ensaios',
    inverseStripe: 'Inversa (hach.)',
    hintClick: 'Clique em um segmento para filtrar os gráficos',
  },
  burnChart: {
    title: 'Distribuição do Tempo de Queima',
    subtitle: 'Duração da chama em segundos por gás',
    hintClick: 'Clique em uma faixa para filtrar os gráficos',
  },
  radarChart: {
    title: 'Comparativo Normal × Inversa',
    subtitle: 'Médias normalizadas de O₂, pressão, queima, pico e ignição',
    o2Mean: 'O₂ médio',
    pressure: 'Pressão',
    burnTime: 'Queima (s)',
    peakTemp: 'Pico (°C)',
    ignitionRate: 'Ignição %',
  },
  timelineChart: {
    title: 'Linha do Tempo (Dias 1–12)',
    subtitle: 'Ensaios realizados e pico térmico médio por dia',
    tests: 'Ensaios',
    meanPeak: 'Pico (°C)',
    hintClick: 'Clique em um dia para filtrar os gráficos',
  },
  coolMatrix: {
    title: 'Matriz de Chama Fria · Códigos PCI-A a PCI-G',
    occurrences: 'ocorrências nos filtros atuais',
    hintClick: 'Clique em um Test ID para abrir os detalhes do ensaio',
    code: 'Código',
    tests: 'Ensaios',
    gas: 'Gás',
    flame: 'Chama',
    typicalO2: 'O₂ típico',
    typicalPsi: 'Pressão típica',
    noneInFilter: 'Sem ocorrências neste filtro',
    directNoCode: 'Sem código PCI (só chama fria)',
  },
  table: {
    title: 'Explorar Ensaios · Tabela Completa',
    searchPlaceholder: 'Buscar Test ID, código PCI...',
    exportCsv: 'Exportar CSV',
    colId: 'Test ID',
    colDay: 'Dia',
    colGas: 'Gás',
    colFlame: 'Chama',
    colO2: 'O₂',
    colPsi: 'Pressão',
    colFlow: 'Fluxo',
    colBurn: 'Queima',
    colPeak: 'Pico °C',
    colOutcome: 'Desfecho',
    prev: 'Anterior',
    next: 'Próxima',
    pageOf: (p, total, count) => `Página ${p} de ${total} (${count} resultados)`,
  },
  param3d: {
    title: 'Espaço de Parâmetros 3D · Pressão × O₂ × Eixo Z',
    subtitle: 'Visualização tridimensional com Zona Lunar destacada',
    hintOrbit: 'Arraste para girar · Scroll para zoom · Clique numa esfera',
    both: 'Ambas',
    reset: 'Resetar',
    zPeak: 'Pico térmico',
    zFlow: 'Fluxo de gás',
    zBurn: 'Tempo de queima',
    legendAxes: (z) => `Z: ${z}`,
    legendLunar: 'Zona Lunar',
  },
  sim3d: {
    title: 'Simulador 3D do Ensaio · Queimador Esférico CFI-G',
    subtitle: 'Alterne entre Microgravidade (0 g na ISS) e Terra (1 g)',
    microg: 'Microgravidade (0 g)',
    earth1g: 'Comparar Terra (1 g)',
    microgCaption: 'Chama esférica por difusão (0 g · ISS)',
    earthCaption: 'Simulação ilustrativa de convecção na Terra (1 g)',
    activeTestLabel: 'Ensaio em simulação',
    presetsLabel: 'Atalhos recomendados',
    askAboutTest: 'Perguntar sobre este ensaio',
    colorLabel: 'Cor',
  },
  top10: {
    title: 'Top 10 · Base Lunar',
    subtitle: 'Ranqueamento de risco (O₂ ≥ 30%, P ≤ 10,2 psi)',
    howWeCalc: 'Como calculamos?',
    pts: 'pts',
  },
  insights: {
    honestTitle: 'Escopo científico honesto:',
    honestBody:
      'PSI-159 cobre apenas gravidade zero na ISS. Não há dados de gravidade parcial (Lua 1/6 g ou Marte 3/8 g) no PSI ainda — os insights orientam hipóteses para a Base Lunar (O₂ ≥ 30%, P ≤ 10,2 psi).',
    earthTitle: 'E na Terra? Conexão com o dia a dia',
    earthDeepen: 'Aprofundar com IA',
    lunarWhyTitle: 'Por que habitats lunares mudam tudo?',
  },
  drawer: {
    close: 'Fechar detalhe',
    day: 'Dia',
    askAiBtn: 'Perguntar à Superinteligência sobre este ensaio',
    openSimBtn: 'Abrir no Simulador 3D (0g vs 1g)',
    atmSection: 'Parâmetros Atmosféricos e de Fluxo',
    thermalSection: 'Resultados Térmicos e Combustão',
    qualityTitle: 'Notas de qualidade',
    commentTitle: 'Comentário original da NASA',
  },
  ai: {
    title: 'Superinteligência NASA',
    subtitle: (n) => `Baseada 100% nos ${n} ensaios reais`,
    launcherSub: 'Mentora PSI-159 · Dúvidas & Quiz',
    simple: 'Explicar simples',
    tech: 'Explicar técnico',
    quizBtn: 'Modo Quiz rápido',
    quizLoading: 'Gerando Quiz...',
    welcome: (n) =>
      `Olá! Eu leio exatamente os filtros e gráficos que você vê agora (${n} ensaios). Pergunte qualquer coisa ou faça o Quiz rápido!`,
    suggestionsTitle: 'Sugestões para esta tela',
    placeholder: 'Pergunte sobre O₂, chamas frias, Test ID...',
    copy: 'Copiar',
    copied: 'Copiado',
    viewTest: 'Ver',
    quizTitle: (n) => `Modo Quiz Rápido (${n} questões)`,
    closeQuiz: 'Fechar quiz',
  },
};

const EN: UiStrings = {
  appTitle: 'PSI-159 · Cool Flames Lab',
  appSubtitle: 'CFI-G / ACME · ISS Microgravity & Lunar Base Safety',
  logoAlt: 'Fire Tamers and ACME logo · Back to Overview',
  tabs: {
    overview: 'Overview',
    ignition: 'Ignition Map',
    cool_flames: 'Cool Flames',
    explore: 'Explore Tests',
    about: 'About Data',
  },
  help: 'Help',
  menu: 'Menu',
  presentation: 'Present (P)',
  exitPresentation: 'Exit (P / Esc)',
  filters: {
    gas: 'Fuel:',
    flame: 'Flame:',
    o2: 'O₂:',
    pressure: 'Pressure:',
    outcome: 'Outcome',
    outcomeHeader: 'Measured outcome',
    onlyCoolFlames: 'Cool flames only',
    clearFilters: 'Clear filters',
    active: 'Active:',
    testsOf: (f, t) => `${f} of ${t} tests`,
  },
  chartCard: {
    explain: 'Explain this chart',
    explainShort: 'Explain',
    legendBtn: 'Legend',
    emptyTitle: 'No tests match the current filters.',
    emptySubtitle: 'Widen the O₂ or pressure range, or clear the cross-filter.',
  },
  kpis: {
    filteredTitle: 'Filtered tests',
    filteredBody: 'CFI-G chamber tests matching active filters (total: 333 tests over 12 ISS days).',
    ignitedTitle: 'Ignition rate',
    ignitedBody: 'Share of tests where the fuel ignited (hot flame, cool flame, or flash).',
    ignitedSub: 'ignited',
    coolTitle: 'Cool flames',
    coolBody: 'Low-temperature (~200–400 °C), nearly invisible burning similar to engine knock pre-ignition.',
    coolSub: 'confirmed',
    peakTitle: 'Max burner peak',
    peakBody: 'Highest temperature recorded on the porous burner before thermal safety shutoff.',
    burnTitle: 'Burn time (avg / max)',
    burnBody: 'Flame duration in seconds. Without buoyancy in microgravity, burning relies on diffusion.',
    burnMax: 'max',
    o2Title: 'O₂ range',
    o2Body: 'Earth air is 21% O₂; Lunar Base plans ≥ 30%. CFI-G tested from 12% up to 85% O₂.',
    psiTitle: 'Pressure range',
    psiBody: 'Sea-level air is 14.7 psi. Lunar habitats operate at ≤ 10.2 psi.',
    lunarTitle: 'Lunar Zone',
    lunarBody: 'Share of tests with O₂ ≥ 30% and pressure ≤ 10.2 psi, where materials ignite much more easily.',
    lunarSub: 'tests',
  },
  sharedLegend: {
    title: 'Shared key:',
    hotNormal: 'Hot · Normal',
    hotInverse: 'Hot · Inverse',
    cool: 'Cool',
    limit: 'Limit',
    none: 'No ignition',
  },
  ignitionChart: {
    title: 'Ignition Map · Pressure × O₂',
    subtitle: 'O₂ fraction vs. CFI-G chamber pressure',
    points: 'Points',
    heatmap: 'Heatmap',
    lunarZone: 'Lunar Zone',
    lunarSpecs: 'O₂≥30%, ≤10.2 psi',
    earthAir: 'Earth Air (21%, 14.7 psi)',
    earthShort: 'Earth Air',
    spacesuit: 'Suit: 4.3 psi · 100% O₂',
    xAxis: 'Chamber Pressure (psi)',
    xAxisShort: 'Pressure (psi)',
    yAxis: 'O₂ Fraction',
    legendNormal: 'Normal',
    legendInverse: 'Inverse',
    legendCool: 'Cool',
    legendLimit: 'Limit',
    legendNone: 'No ignition',
    hintBrush: 'Drag box on plot to filter · Click point to inspect',
    hintCell: 'Click cell to filter',
  },
  flowChart: {
    title: 'Fuel Flow × Peak Burner Temp',
    subtitle: 'Log-scale fuel flow (mg/s) vs. peak temp',
    limitLabel: 'Burner thermal limit zone',
    xAxis: 'Fuel Flow (mg/s · log)',
    xAxisShort: 'Flow (mg/s · log)',
    yAxis: 'Peak Temp (°C)',
    legendLimit: 'Limit',
    legendCutoff: 'Flow cutoff',
    hintClick: 'Color by fuel · Click a point to inspect',
  },
  outcomesChart: {
    title: 'Outcomes by Fuel & Flame',
    subtitle: 'Grouped bars: Normal (solid) vs. Inverse (hatched)',
    yAxisLabel: 'No. of tests',
    inverseStripe: 'Inverse (hatch)',
    hintClick: 'Click a bar segment to filter',
  },
  burnChart: {
    title: 'Burn Duration Distribution',
    subtitle: 'Flame duration bins (s) by fuel',
    hintClick: 'Click a bar bin to filter',
  },
  radarChart: {
    title: 'Normal vs. Inverse Comparison',
    subtitle: 'Normalized O₂, pressure, burn time & peak averages',
    o2Mean: 'Mean O₂',
    pressure: 'Pressure',
    burnTime: 'Burn (s)',
    peakTemp: 'Peak (°C)',
    ignitionRate: 'Ignition %',
  },
  timelineChart: {
    title: 'Campaign Timeline (Days 1–12)',
    subtitle: 'Tests performed and mean peak temp per day',
    tests: 'Tests',
    meanPeak: 'Peak (°C)',
    hintClick: 'Click a day bar to filter',
  },
  coolMatrix: {
    title: 'Cool Flame Matrix · Codes PCI-A to PCI-G',
    occurrences: 'occurrences in active filters',
    hintClick: 'Click any Test ID to inspect test details',
    code: 'Code',
    tests: 'Tests',
    gas: 'Fuel',
    flame: 'Flame',
    typicalO2: 'Typical O₂',
    typicalPsi: 'Typical P',
    noneInFilter: 'No matches in active filter',
    directNoCode: 'No PCI code (cool flame only)',
  },
  table: {
    title: 'Explore Tests · Full Table',
    searchPlaceholder: 'Search Test ID, PCI code...',
    exportCsv: 'Export CSV',
    colId: 'Test ID',
    colDay: 'Day',
    colGas: 'Fuel',
    colFlame: 'Flame',
    colO2: 'O₂',
    colPsi: 'Pressure',
    colFlow: 'Flow',
    colBurn: 'Burn',
    colPeak: 'Peak °C',
    colOutcome: 'Outcome',
    prev: 'Previous',
    next: 'Next',
    pageOf: (p, total, count) => `Page ${p} of ${total} (${count} results)`,
  },
  param3d: {
    title: '3D Parameter Space · Pressure × O₂ × Z-Axis',
    subtitle: '3D distribution with Lunar Zone volume highlighted',
    hintOrbit: 'Drag to orbit · Scroll to zoom · Click a sphere to inspect',
    both: 'Both',
    reset: 'Reset',
    zPeak: 'Peak temp',
    zFlow: 'Fuel flow',
    zBurn: 'Burn time',
    legendAxes: (z) => `Z: ${z}`,
    legendLunar: 'Lunar Zone',
  },
  sim3d: {
    title: '3D Test Simulator · CFI-G Spherical Burner',
    subtitle: 'Switch between Microgravity (0 g ISS) and Earth Gravity (1 g)',
    microg: 'Microgravity (0 g)',
    earth1g: 'Compare Earth (1 g)',
    microgCaption: 'Spherical diffusion flame (0 g · ISS)',
    earthCaption: 'Illustrative buoyant plume on Earth (1 g)',
    activeTestLabel: 'Simulated test',
    presetsLabel: 'Benchmark presets',
    askAboutTest: 'Ask AI about this test',
    colorLabel: 'Color',
  },
  top10: {
    title: 'Top 10 · Lunar Base Relevance',
    subtitle: 'Safety risk ranking (O₂ ≥ 30%, P ≤ 10.2 psi)',
    howWeCalc: 'How scored?',
    pts: 'pts',
  },
  insights: {
    honestTitle: 'Honest scientific scope:',
    honestBody:
      'PSI-159 covers microgravity on the ISS only. Partial-gravity fire data (Moon 1/6 g or Mars 3/8 g) is not in PSI yet — insights guide safety hypotheses for Lunar Base atmospheres (O₂ ≥ 30%, P ≤ 10.2 psi).',
    earthTitle: 'And on Earth? Everyday analogies',
    earthDeepen: 'Explore with AI',
    lunarWhyTitle: 'Why lunar habitats change fire risk?',
  },
  drawer: {
    close: 'Close details',
    day: 'Day',
    askAiBtn: 'Ask NASA Superintelligence about this test',
    openSimBtn: 'Open in 3D Simulator (0g vs 1g)',
    atmSection: 'Atmosphere & Flow Parameters',
    thermalSection: 'Thermal & Combustion Results',
    qualityTitle: 'Quality notes',
    commentTitle: 'Original NASA comment',
  },
  ai: {
    title: 'NASA Superintelligence',
    subtitle: (n) => `Grounded 100% in ${n} real tests`,
    launcherSub: 'PSI-159 Mentor · Q&A & Quiz',
    simple: 'Simple mode',
    tech: 'Technical mode',
    quizBtn: 'Quick Quiz Mode',
    quizLoading: 'Generating Quiz...',
    welcome: (n) =>
      `Hello! I see your active filters and charts (${n} tests). Ask anything or start the Quick Quiz!`,
    suggestionsTitle: 'Suggested questions',
    placeholder: 'Ask about O₂, cool flames, Test ID...',
    copy: 'Copy',
    copied: 'Copied',
    viewTest: 'Inspect',
    quizTitle: (n) => `Quick Quiz Mode (${n} questions)`,
    closeQuiz: 'Close quiz',
  },
};

const ES: UiStrings = {
  appTitle: 'PSI-159 · Laboratorio de Llamas Frías',
  appSubtitle: 'CFI-G / ACME · Microgravedad en ISS y Base Lunar',
  logoAlt: 'Logotipo Fire Tamers y ACME · Volver a Resumen',
  tabs: {
    overview: 'Resumen',
    ignition: 'Mapa de Ignición',
    cool_flames: 'Llamas Frías',
    explore: 'Explorar Ensayos',
    about: 'Sobre los Datos',
  },
  help: 'Ayuda',
  menu: 'Menú',
  presentation: 'Presentar (P)',
  exitPresentation: 'Salir (P / Esc)',
  filters: {
    gas: 'Gas:',
    flame: 'Llama:',
    o2: 'O₂:',
    pressure: 'Presión:',
    outcome: 'Resultado',
    outcomeHeader: 'Desenlace medido',
    onlyCoolFlames: 'Solo llamas frías',
    clearFilters: 'Limpiar filtros',
    active: 'Activos:',
    testsOf: (f, t) => `${f} de ${t} ensayos`,
  },
  chartCard: {
    explain: 'Explicar este gráfico',
    explainShort: 'Explicar',
    legendBtn: 'Leyenda',
    emptyTitle: 'Ningún ensayo coincide con los filtros actuales.',
    emptySubtitle: 'Amplía el rango de O₂ o presión, o quita el filtro cruzado.',
  },
  kpis: {
    filteredTitle: 'Ensayos filtrados',
    filteredBody: 'Pruebas de la cámara CFI-G que cumplen los filtros activos (total: 333 ensayos en 12 días).',
    ignitedTitle: 'Tasa de ignición',
    ignitedBody: 'Porcentaje de ensayos con ignición (llama caliente, llama fría o destello).',
    ignitedSub: 'encendieron',
    coolTitle: 'Llamas frías',
    coolBody: 'Combustión a baja temperatura (~200–400 °C), casi invisible, similar al picado de motor.',
    coolSub: 'confirmadas',
    peakTitle: 'Pico térmico máx.',
    peakBody: 'Mayor temperatura medida en el quemador poroso antes del corte térmico.',
    burnTitle: 'Combustión (med / máx)',
    burnBody: 'Duración de la llama en segundos. Sin convección en microgravedad depende de difusión.',
    burnMax: 'máx',
    o2Title: 'Rango de O₂',
    o2Body: 'Aire terrestre tiene 21% O₂; Base Lunar planea ≥ 30%. CFI-G probó de 12% a 85%.',
    psiTitle: 'Rango de presión',
    psiBody: 'Aire al nivel del mar tiene 14,7 psi. Hábitats lunares operan hasta 10,2 psi.',
    lunarTitle: 'Zona Lunar',
    lunarBody: 'Fracción de ensayos con O₂ ≥ 30% y presión ≤ 10,2 psi, donde todo arde más fácil.',
    lunarSub: 'ens.',
  },
  sharedLegend: {
    title: 'Leyenda común:',
    hotNormal: 'Hot · Normal',
    hotInverse: 'Hot · Inversa',
    cool: 'Fría',
    limit: 'Límite',
    none: 'Sin ignición',
  },
  ignitionChart: {
    title: 'Mapa de Ignición · Presión × O₂',
    subtitle: 'Fracción de O₂ por presión en la cámara CFI-G',
    points: 'Puntos',
    heatmap: 'Mapa de calor',
    lunarZone: 'Zona Lunar',
    lunarSpecs: 'O₂≥30%, ≤10,2 psi',
    earthAir: 'Aire Tierra (21%, 14,7 psi)',
    earthShort: 'Aire Tierra',
    spacesuit: 'Traje: 4,3 psi · 100% O₂',
    xAxis: 'Presión de Cámara (psi)',
    xAxisShort: 'Presión (psi)',
    yAxis: 'Fracción de O₂',
    legendNormal: 'Normal',
    legendInverse: 'Inversa',
    legendCool: 'Fría',
    legendLimit: 'Límite',
    legendNone: 'Sin ignición',
    hintBrush: 'Arrastra para filtrar · Clic en punto para ver ensayo',
    hintCell: 'Clic en celda para filtrar',
  },
  flowChart: {
    title: 'Flujo de Gas × Pico Térmico',
    subtitle: 'Escala logarítmica de flujo (mg/s) vs. pico térmico',
    limitLabel: 'Zona de límite térmico',
    xAxis: 'Flujo de Combustible (mg/s · log)',
    xAxisShort: 'Flujo (mg/s · log)',
    yAxis: 'Pico Térmico (°C)',
    legendLimit: 'Límite',
    legendCutoff: 'Flujo cortado',
    hintClick: 'Color por gas · Clic en un punto para inspeccionar',
  },
  outcomesChart: {
    title: 'Resultados por Gas y Llama',
    subtitle: 'Barras agrupadas: Normal (sólida) × Inversa (rayada)',
    yAxisLabel: 'Nº de ensayos',
    inverseStripe: 'Inversa (ray.)',
    hintClick: 'Clic en un segmento para filtrar',
  },
  burnChart: {
    title: 'Distribución del Tiempo de Llama',
    subtitle: 'Duración en segundos por gas',
    hintClick: 'Clic en una barra para filtrar',
  },
  radarChart: {
    title: 'Comparativa Normal × Inversa',
    subtitle: 'Promedios normalizados de O₂, presión, duración y pico',
    o2Mean: 'O₂ medio',
    pressure: 'Presión',
    burnTime: 'Llama (s)',
    peakTemp: 'Pico (°C)',
    ignitionRate: 'Ignición %',
  },
  timelineChart: {
    title: 'Línea Temporal (Días 1–12)',
    subtitle: 'Ensayos realizados y pico térmico medio por día',
    tests: 'Ensayos',
    meanPeak: 'Pico medio (°C)',
    hintClick: 'Clic en un día para filtrar',
  },
  coolMatrix: {
    title: 'Matriz de Llama Fría · Códigos PCI-A a PCI-G',
    occurrences: 'casos en filtros activos',
    hintClick: 'Clic en un Test ID para ver detalles del ensayo',
    code: 'Código',
    tests: 'Ensayos',
    gas: 'Gas',
    flame: 'Llama',
    typicalO2: 'O₂ típico',
    typicalPsi: 'Presión típica',
    noneInFilter: 'Sin casos en este filtro',
    directNoCode: 'Sin código PCI (solo llama fría)',
  },
  table: {
    title: 'Explorar Ensayos · Tabla Completa',
    searchPlaceholder: 'Buscar Test ID, código PCI...',
    exportCsv: 'Exportar CSV',
    colId: 'Test ID',
    colDay: 'Día',
    colGas: 'Gas',
    colFlame: 'Llama',
    colO2: 'O₂',
    colPsi: 'Presión',
    colFlow: 'Flujo',
    colBurn: 'Duración',
    colPeak: 'Pico °C',
    colOutcome: 'Resultado',
    prev: 'Anterior',
    next: 'Siguiente',
    pageOf: (p, total, count) => `Página ${p} de ${total} (${count} resultados)`,
  },
  param3d: {
    title: 'Espacio de Parámetros 3D · Presión × O₂ × Eje Z',
    subtitle: 'Distribución 3D con volumen de Zona Lunar destacado',
    hintOrbit: 'Arrastra para rotar · Rueda para zoom · Clic en esfera',
    both: 'Ambas',
    reset: 'Reiniciar',
    zPeak: 'Pico térmico',
    zFlow: 'Flujo de gas',
    zBurn: 'Duración',
    legendAxes: (z) => `Z: ${z}`,
    legendLunar: 'Zona Lunar',
  },
  sim3d: {
    title: 'Simulador 3D del Ensayo · Quemador Esférico CFI-G',
    subtitle: 'Alterna entre Microgravedad (0 g ISS) y Tierra (1 g)',
    microg: 'Microgravedad (0 g)',
    earth1g: 'Comparar Tierra (1 g)',
    microgCaption: 'Llama esférica por difusión (0 g · ISS)',
    earthCaption: 'Simulación ilustrativa por convección en Tierra (1 g)',
    activeTestLabel: 'Ensayo simulado',
    presetsLabel: 'Atajos recomendados',
    askAboutTest: 'Preguntar por este ensayo',
    colorLabel: 'Color',
  },
  top10: {
    title: 'Top 10 · Base Lunar',
    subtitle: 'Ranking de riesgo (O₂ ≥ 30%, P ≤ 10,2 psi)',
    howWeCalc: '¿Cómo se calcula?',
    pts: 'pts',
  },
  insights: {
    honestTitle: 'Alcance científico honesto:',
    honestBody:
      'PSI-159 cubre solo gravedad cero en la ISS. Aún no hay datos de gravedad parcial (Luna 1/6 g o Marte 3/8 g) en PSI — los hallazgos guían hipótesis para la Base Lunar (O₂ ≥ 30%, P ≤ 10,2 psi).',
    earthTitle: '¿Y en la Tierra? Analogías cotidianas',
    earthDeepen: 'Profundizar con IA',
    lunarWhyTitle: '¿Por qué los hábitats lunares cambian el riesgo?',
  },
  drawer: {
    close: 'Cerrar detalle',
    day: 'Día',
    askAiBtn: 'Preguntar a la Superinteligencia sobre este ensayo',
    openSimBtn: 'Abrir en Simulador 3D (0g vs 1g)',
    atmSection: 'Parámetros Atmosféricos y Flujo',
    thermalSection: 'Resultados Térmicos y Combustión',
    qualityTitle: 'Notas de calidad',
    commentTitle: 'Comentario original de NASA',
  },
  ai: {
    title: 'Superinteligencia NASA',
    subtitle: (n) => `Basada 100% en ${n} ensayos reales`,
    launcherSub: 'Mentora PSI-159 · Dudas y Quiz',
    simple: 'Modo simple',
    tech: 'Modo técnico',
    quizBtn: 'Modo Quiz rápido',
    quizLoading: 'Generando Quiz...',
    welcome: (n) =>
      `¡Hola! Veo exactamente tus filtros y gráficos actuales (${n} ensayos). ¡Pregunta lo que quieras o inicia el Quiz rápido!`,
    suggestionsTitle: 'Sugerencias para esta vista',
    placeholder: 'Pregunta sobre O₂, llamas frías, Test ID...',
    copy: 'Copiar',
    copied: 'Copiado',
    viewTest: 'Ver',
    quizTitle: (n) => `Modo Quiz Rápido (${n} preguntas)`,
    closeQuiz: 'Cerrar quiz',
  },
};

const DICT: Record<AppLanguage, UiStrings> = { pt: PT, en: EN, es: ES };

export function useStrings(lang: AppLanguage): UiStrings {
  return DICT[lang] ?? PT;
}
