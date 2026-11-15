import type { AppLanguage } from '../types/psi159';

export interface UiStrings {
  appTitle: string;
  appSubtitle: string;
  appDescription: string;
  footerNotice: string;
  logoAlt: string;
  cover: {
    subtitle: string;
    credit: string;
    cta: string;
    ctaAria: string;
    langGroupAria: string;
  };
  tabs: {
    overview: string;
    analyses: string;
    ignition: string;
    cool_flames: string;
    explore: string;
    about: string;
  };
  nav: {
    breadcrumbRoot: string;
    moreAnalyses: string;
    backToOverview: string;
    viewLunarRanking: string;
    discoveriesTitle: string;
    discoveriesSubtitle: string;
    shortcutHint: string;
    mobileTabMap: string;
  };
  overviewTabs: {
    outcomes: string;
    burn: string;
    radar: string;
    timeline: string;
    flow: string;
  };
  help: string;
  menu: string;
  presentation: string;
  exitPresentation: string;
  textSize: {
    label: string;
    groupAria: string;
    normal: string;
    large: string;
    xlarge: string;
    decreaseAria: string;
    defaultAria: string;
    increaseAria: string;
    mobileCapHint: string;
    presentationHint: string;
  };
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
    expand: string;
    collapse: string;
    legendBtn: string;
    emptyTitle: string;
    emptySubtitle: string;
    errorTitle: string;
    retry: string;
    clickToFilter: string;
    clickToOpenTest: string;
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
    helpTip: string;
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
    helpTip: string;
  };
  outcomesChart: {
    title: string;
    subtitle: string;
    yAxisLabel: string;
    inverseStripe: string;
    helpTip: string;
  };
  burnChart: {
    title: string;
    subtitle: string;
    helpTip: string;
  };
  radarChart: {
    title: string;
    subtitle: string;
    o2Mean: string;
    pressure: string;
    burnTime: string;
    peakTemp: string;
    ignitionRate: string;
    helpTip: string;
  };
  timelineChart: {
    title: string;
    subtitle: string;
    tests: string;
    meanPeak: string;
    helpTip: string;
  };
  coolMatrix: {
    title: string;
    occurrences: string;
    helpTip: string;
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
    helpTip: string;
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
    helpTip: string;
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
    backToList: (n: number) => string;
    listSearchPlaceholder: string;
    sortLabel: string;
    sortId: string;
    sortO2: string;
    sortPsi: string;
    sortTemp: string;
    sortBurn: string;
    emptySearch: string;
  };
  pointPopover: {
    testsCount: (n: number) => string;
    clickToPin: string;
    pinned: string;
    close: string;
    showingOf: (shown: number, total: number, canScrollMore: boolean) => string;
    viewAll: (n: number) => string;
    filterCell: string;
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
    quizProgress: (curr: number, total: number) => string;
    quizHintBtn: string;
    quizHideHintBtn: string;
    quizVerifyBtn: string;
    quizNextBtn: string;
    quizFinishBtn: string;
    quizRestartBtn: string;
    quizRegenerateBtn: string;
    quizCorrectMsg: string;
    quizIncorrectMsg: string;
    quizScoreTitle: string;
    quizScoreSummary: (correct: number, total: number) => string;
    quizLangChangedPrompt: string;
    quizOfflineFallbackNotice: string;
    errorFallback: string;
    quizErrorFallback: string;
    streamErrorFallback: string;
    backLabel: string;
    resizeHandleTitle: string;
    clearChatTitle: string;
    minimizeChatLabel: string;
    sendLabel: string;
  };
  prompts: {
    explainIgnitionMap: string;
    explainFlowVsTemp: string;
    explainOutcomes: string;
    explainBurnTime: string;
    explainNormalVsInverse: string;
    explainTimeline: string;
    explainCoolMatrix: string;
    explainParam3d: string;
    explainLunarTop10: string;
    explainEarthAnalogies: string;
    explainSim3dTest: (
      id: string,
      fuel: string,
      flame: string,
      o2Pct: number,
      psi: string
    ) => string;
    askSim3dTest: (id: string) => string;
    askDrawerTest: (
      id: string,
      fuel: string,
      o2Pct: number,
      psi: string
    ) => string;
    drawerContextLabel: (id: string) => string;
    sim3dContextLabel: (id: string) => string;
  };
}

const PT: UiStrings = {
  appTitle: 'Fire Tamers',
  appSubtitle: 'Dados NASA PSI-159 · Chamas frias em microgravidade',
  appDescription:
    'Fire Tamers — Projeto independente com dados públicos do experimento NASA PSI-159 (chamas frias em microgravidade), visualizações 2D/3D e Mentor Fire Tamers.',
  footerNotice:
    'Projeto independente criado para o desafio NASA. Dados: NASA Physical Science Informatics (PSI-159).',
  logoAlt: 'Logotipo Fire Tamers e ACME · Voltar para Visão Geral',
  cover: {
    subtitle: 'Segurança contra incêndios no espaço, explicada para todo mundo',
    credit: 'Dados NASA ACME CFI-G (PSI-159) · Projeto independente',
    cta: 'Abrir dashboard',
    ctaAria: 'Abrir dashboard (Enter ou Espaço)',
    langGroupAria: 'Selecionar idioma',
  },
  tabs: {
    overview: 'Visão Geral',
    analyses: 'Análises',
    ignition: 'Mapa de Ignição',
    cool_flames: 'Chamas Frias',
    explore: 'Explorar Ensaios',
    about: 'Sobre os Dados',
  },
  nav: {
    breadcrumbRoot: 'Fire Tamers',
    moreAnalyses: 'Mostrar mais análises',
    backToOverview: 'Voltar à Visão Geral',
    viewLunarRanking: 'Ver ranking Lua',
    discoveriesTitle: 'Descobertas',
    discoveriesSubtitle: 'Insights calculados nos filtros atuais',
    shortcutHint: 'Atalhos 1–5',
    mobileTabMap: 'Mapa',
  },
  overviewTabs: {
    outcomes: 'Desfechos',
    burn: 'Tempo de queima',
    radar: 'Normal × Inversa',
    timeline: 'Linha do tempo',
    flow: 'Fluxo × Pico',
  },
  help: 'Ajuda',
  menu: 'Menu',
  presentation: 'Apresentação (P)',
  exitPresentation: 'Sair (P / Esc)',
  textSize: {
    label: 'Tamanho do texto',
    groupAria: 'Tamanho do texto dos gráficos e cards (atalhos [ e ])',
    normal: 'Normal (100%)',
    large: 'Grande (115%)',
    xlarge: 'Extra grande (130%)',
    decreaseAria: 'Tamanho do texto: Normal (100%) · Atalho [',
    defaultAria: 'Tamanho do texto: Grande (115%) · Padrão',
    increaseAria: 'Tamanho do texto: Extra grande (130%) · Atalho ]',
    mobileCapHint: 'No celular o máximo é Grande (115%)',
    presentationHint: 'Modo Apresentação força Extra grande (130%)',
  },
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
    expand: 'Expandir gráfico',
    collapse: 'Fechar visualização ampliada',
    legendBtn: 'Legenda',
    emptyTitle: 'Nenhum ensaio corresponde aos filtros atuais.',
    emptySubtitle: 'Amplie a faixa de O₂ ou pressão, ou remova o filtro cruzado.',
    errorTitle: 'Não foi possível exibir este gráfico. Tentar de novo',
    retry: 'Tentar de novo',
    clickToFilter: 'Clique para filtrar',
    clickToOpenTest: 'Clique para abrir o ensaio',
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
    helpTip: 'Arraste uma região no gráfico para filtrar por O₂ e pressão, ou clique em um ponto ou célula para inspecionar.',
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
    helpTip: 'Cor indica o gás combustível. Clique em qualquer ponto para abrir os detalhes do ensaio.',
  },
  outcomesChart: {
    title: 'Desfechos por Gás e Chama',
    subtitle: 'Barras agrupadas: Normal (sólida) × Inversa (hachurada)',
    yAxisLabel: 'Nº de ensaios',
    inverseStripe: 'Inversa (hach.)',
    helpTip: 'Clique em qualquer segmento da barra para filtrar os gráficos por gás, chama e desfecho.',
  },
  burnChart: {
    title: 'Distribuição do Tempo de Queima',
    subtitle: 'Duração da chama em segundos por gás',
    helpTip: 'Clique em uma faixa de duração para filtrar os gráficos correspondentes.',
  },
  radarChart: {
    title: 'Comparativo Normal × Inversa',
    subtitle: 'Médias normalizadas de O₂, pressão, queima, pico e ignição',
    o2Mean: 'O₂ médio',
    pressure: 'Pressão',
    burnTime: 'Queima (s)',
    peakTemp: 'Pico (°C)',
    ignitionRate: 'Ignição %',
    helpTip: 'Na chama normal, o gás combustível sai do queimador para uma câmara com O₂. Na chama inversa, o O₂ sai do queimador para uma atmosfera rica em combustível.',
  },
  timelineChart: {
    title: 'Linha do Tempo (Dias 1–12)',
    subtitle: 'Ensaios realizados e pico térmico médio por dia',
    tests: 'Ensaios',
    meanPeak: 'Pico (°C)',
    helpTip: 'Os 333 ensaios do PSI-159 foram executados ao longo de 12 dias na câmara CFI-G. Clique em qualquer dia para filtrar os outros gráficos.',
  },
  coolMatrix: {
    title: 'Matriz de Chama Fria · Códigos PCI-A a PCI-G',
    occurrences: 'ocorrências nos filtros atuais',
    helpTip: 'Clique em um Test ID para abrir os detalhes do ensaio, ou na contagem para navegar pelos casos agrupados.',
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
    helpTip: 'Arraste para girar, use o scroll para zoom e clique numa esfera para inspecionar os ensaios.',
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
    helpTip: 'Zona Lunar (até 40 pts: O₂ ≥ 30% e P ≤ 10,2 psi) + Chama Fria (+25 pts) + Pico Térmico (até 20 pts) + Tempo de Queima (até 15 pts). Clique em um ensaio para abrir os detalhes.',
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
    askAiBtn: 'Perguntar ao Mentor Fire Tamers sobre este ensaio',
    openSimBtn: 'Abrir no Simulador 3D (0g vs 1g)',
    atmSection: 'Parâmetros Atmosféricos e de Fluxo',
    thermalSection: 'Resultados Térmicos e Combustão',
    qualityTitle: 'Notas de qualidade',
    commentTitle: 'Comentário original da NASA',
    backToList: (n) => `Voltar à lista (${n})`,
    listSearchPlaceholder: 'Buscar por Test ID...',
    sortLabel: 'Ordenar:',
    sortId: 'Test ID',
    sortO2: 'O₂ %',
    sortPsi: 'Pressão (psi)',
    sortTemp: 'Pico (°C)',
    sortBurn: 'Queima (s)',
    emptySearch: 'Nenhum ensaio encontrado para esta busca.',
  },
  pointPopover: {
    testsCount: (n) => `${n} ensaios`,
    clickToPin: 'Clique para fixar',
    pinned: 'Fixado',
    close: 'Fechar lista',
    showingOf: (shown, total, canScrollMore) =>
      canScrollMore
        ? `Mostrando ${shown} de ${total} · role para ver mais`
        : `Mostrando ${shown} de ${total}`,
    viewAll: (n) => `Ver todos (${n})`,
    filterCell: 'Filtrar célula',
  },
  ai: {
    title: 'Mentor Fire Tamers',
    subtitle: (n) => `Dados públicos NASA PSI-159 · ${n} ensaios`,
    launcherSub: 'Mentor PSI-159 · Dúvidas & Quiz',
    simple: 'Explicar simples',
    tech: 'Explicar técnico',
    quizBtn: 'Modo Quiz rápido',
    quizLoading: 'Gerando Quiz...',
    welcome: (n) =>
      `Olá! Sou o Mentor Fire Tamers (projeto independente com dados públicos do experimento NASA PSI-159, não oficial da NASA). Vejo seus filtros atuais (${n} ensaios) — pergunte qualquer coisa ou faça o Quiz rápido!`,
    suggestionsTitle: 'Sugestões para esta tela',
    placeholder: 'Pergunte sobre O₂, chamas frias, Test ID...',
    copy: 'Copiar',
    copied: 'Copiado',
    viewTest: 'Ver',
    quizTitle: (n) => `Modo Quiz Rápido (${n} questões)`,
    closeQuiz: 'Fechar quiz',
    quizProgress: (curr, total) => `Questão ${curr} de ${total}`,
    quizHintBtn: 'Ver dica',
    quizHideHintBtn: 'Ocultar dica',
    quizVerifyBtn: 'Verificar',
    quizNextBtn: 'Próxima',
    quizFinishBtn: 'Ver placar',
    quizRestartBtn: 'Reiniciar',
    quizRegenerateBtn: 'Gerar novo quiz',
    quizCorrectMsg: 'Resposta correta!',
    quizIncorrectMsg: 'Resposta incorreta.',
    quizScoreTitle: 'Placar final',
    quizScoreSummary: (correct, total) =>
      `Você acertou ${correct} de ${total} questões.`,
    quizLangChangedPrompt: 'Idioma alterado. Gerar novo quiz?',
    quizOfflineFallbackNotice:
      'Cota temporária da IA atingida — quiz gerado diretamente dos dados reais do PSI-159.',
    errorFallback: 'Não foi possível consultar o Mentor Fire Tamers.',
    quizErrorFallback: 'Falha ao gerar o quiz rápido.',
    streamErrorFallback: 'Erro na transmissão da resposta.',
    backLabel: 'Voltar',
    resizeHandleTitle: 'Arraste para redimensionar largura',
    clearChatTitle: 'Limpar conversa',
    minimizeChatLabel: 'Minimizar chat',
    sendLabel: 'Enviar',
  },
  prompts: {
    explainIgnitionMap:
      'Explique o Mapa de Ignição atual (pressão vs O₂) destacando a Zona Lunar (O₂ >= 30% e pressão <= 10,2 psi), o Ar da Terra e exemplos reais de Test ID.',
    explainFlowVsTemp:
      'Analise a relação entre fluxo de combustível (hc_flow_mg_s) e temperatura de pico no queimador (peak_burner_temp_c) nos ensaios filtrados, citando Test IDs.',
    explainOutcomes:
      'Explique a distribuição de desfechos (apagou sozinha, fluxo cortado, sem ignição, clarão, chama fria) entre etano, propano e butano (chamas normais vs inversas) nos dados filtrados.',
    explainBurnTime:
      'Explique a distribuição do tempo de queima (burn_time_s) entre etano, propano e butano nos ensaios filtrados e cite o ensaio mais longo.',
    explainNormalVsInverse:
      'Compare chamas normais vs chamas inversas nos ensaios filtrados (O₂ médio, pressão média, tempo de queima, temperatura de pico e taxa de ignição), citando exemplos reais de Test ID.',
    explainTimeline:
      'Analise a evolução ao longo dos 12 dias da campanha (day 1 a 12) nos dados filtrados: quais dias concentraram mais ensaios, maiores temperaturas médias ou chamas frias?',
    explainCoolMatrix:
      'Explique a Matriz de Chama Fria (códigos PCI-A até PCI-G e casos de cool_flame_only), em que gases, pressões e concentrações de O₂ elas apareceram e por que preocupam na segurança espacial.',
    explainParam3d:
      'Explique o que o Espaço de Parâmetros 3D (Pressão × O₂ × Pico Térmico/Fluxo/Queima) revela sobre onde ocorrem chamas frias, limites térmicos e ensaios na Zona Lunar.',
    explainLunarTop10:
      "Explique os 3 primeiros ensaios do ranking 'Mais relevantes para a Base Lunar' nos filtros atuais e por que eles representam risco em atmosferas lunares (O₂ >= 30%, P <= 10,2 psi).",
    explainEarthAnalogies:
      'Faça uma explicação didática com analogias na Terra (motor de carro, fogão e extintor) conectando chamas frias e o risco na Base Lunar.',
    explainSim3dTest: (id, fuel, flame, o2Pct, psi) =>
      `Explique em linguagem simples o comportamento da chama no ensaio ${id} (${fuel}, ${flame}, ${o2Pct}% O₂, ${psi} psi) comparado com uma chama na Terra (1g).`,
    askSim3dTest: (id) =>
      `Explique em detalhes o ensaio ${id}, por que ele teve esse desfecho e o que isso ensina sobre incêndios na ISS vs na Terra.`,
    askDrawerTest: (id, fuel, o2Pct, psi) =>
      `Explique o ensaio ${id} em detalhes simples: o que aconteceu com essa mistura de ${fuel} a ${o2Pct}% de O₂ e ${psi} psi, e qual a lição de segurança espacial?`,
    drawerContextLabel: (id) => `Detalhe do ensaio ${id}`,
    sim3dContextLabel: (id) => `Simulador 3D (${id})`,
  },
};

const EN: UiStrings = {
  appTitle: 'Fire Tamers',
  appSubtitle: 'NASA PSI-159 data · Cool flames in microgravity',
  appDescription:
    'Fire Tamers — Independent project using public NASA PSI-159 microgravity cool flames data, 2D/3D visualizations, and the Fire Tamers Mentor.',
  footerNotice:
    'Independent project created for the NASA challenge. Data: NASA Physical Science Informatics (PSI-159).',
  logoAlt: 'Fire Tamers and ACME logo · Back to Overview',
  cover: {
    subtitle: 'Fire safety in space, explained for everyone',
    credit: 'NASA ACME CFI-G data (PSI-159) · Independent project',
    cta: 'Open dashboard',
    ctaAria: 'Open dashboard (Enter or Space)',
    langGroupAria: 'Select language',
  },
  tabs: {
    overview: 'Overview',
    analyses: 'Analytics',
    ignition: 'Ignition Map',
    cool_flames: 'Cool Flames',
    explore: 'Explore Tests',
    about: 'About Data',
  },
  nav: {
    breadcrumbRoot: 'Fire Tamers',
    moreAnalyses: 'Show more analytics',
    backToOverview: 'Back to Overview',
    viewLunarRanking: 'View Lunar ranking',
    discoveriesTitle: 'Discoveries',
    discoveriesSubtitle: 'Insights computed from active filters',
    shortcutHint: 'Shortcuts 1–5',
    mobileTabMap: 'Map',
  },
  overviewTabs: {
    outcomes: 'Outcomes',
    burn: 'Burn time',
    radar: 'Normal × Inverse',
    timeline: 'Timeline',
    flow: 'Flow × Peak',
  },
  help: 'Help',
  menu: 'Menu',
  presentation: 'Present (P)',
  exitPresentation: 'Exit (P / Esc)',
  textSize: {
    label: 'Text size',
    groupAria: 'Chart and card text size (shortcuts [ and ])',
    normal: 'Normal (100%)',
    large: 'Large (115%)',
    xlarge: 'Extra large (130%)',
    decreaseAria: 'Text size: Normal (100%) · Shortcut [',
    defaultAria: 'Text size: Large (115%) · Default',
    increaseAria: 'Text size: Extra large (130%) · Shortcut ]',
    mobileCapHint: 'Mobile is capped at Large (115%)',
    presentationHint: 'Presentation Mode forces Extra large (130%)',
  },
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
    expand: 'Expand chart',
    collapse: 'Close expanded view',
    legendBtn: 'Legend',
    emptyTitle: 'No tests match the current filters.',
    emptySubtitle: 'Widen the O₂ or pressure range, or clear the cross-filter.',
    errorTitle: 'Unable to display this chart. Try again',
    retry: 'Try again',
    clickToFilter: 'Click to filter',
    clickToOpenTest: 'Click to open test',
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
    helpTip: 'Drag a box on the plot to filter by O₂ and pressure, or click a point or cell to inspect.',
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
    helpTip: 'Color encodes fuel gas. Click any point to inspect test details.',
  },
  outcomesChart: {
    title: 'Outcomes by Fuel & Flame',
    subtitle: 'Grouped bars: Normal (solid) vs. Inverse (hatched)',
    yAxisLabel: 'No. of tests',
    inverseStripe: 'Inverse (hatch)',
    helpTip: 'Click any bar segment to filter the dashboard by fuel, flame type, and outcome.',
  },
  burnChart: {
    title: 'Burn Duration Distribution',
    subtitle: 'Flame duration bins (s) by fuel',
    helpTip: 'Click any duration bin to filter matching tests across the dashboard.',
  },
  radarChart: {
    title: 'Normal vs. Inverse Comparison',
    subtitle: 'Normalized O₂, pressure, burn time & peak averages',
    o2Mean: 'Mean O₂',
    pressure: 'Pressure',
    burnTime: 'Burn (s)',
    peakTemp: 'Peak (°C)',
    ignitionRate: 'Ignition %',
    helpTip: 'In a normal flame, fuel exits the burner into an O₂ chamber. In an inverse flame, O₂ flows into a fuel-rich atmosphere.',
  },
  timelineChart: {
    title: 'Campaign Timeline (Days 1–12)',
    subtitle: 'Tests performed and mean peak temp per day',
    tests: 'Tests',
    meanPeak: 'Peak (°C)',
    helpTip: 'All 333 PSI-159 tests ran across 12 campaign days in the CFI-G chamber. Click any day bar to filter the dashboard.',
  },
  coolMatrix: {
    title: 'Cool Flame Matrix · Codes PCI-A to PCI-G',
    occurrences: 'occurrences in active filters',
    helpTip: 'Click any Test ID to inspect test details, or click a count badge to browse grouped tests.',
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
    helpTip: 'Drag to orbit, scroll to zoom, and click any sphere to inspect grouped tests.',
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
    helpTip: 'Lunar Zone (up to 40 pts: O₂ ≥ 30% & P ≤ 10.2 psi) + Cool Flame (+25 pts) + Peak Temp (up to 20 pts) + Burn Time (up to 15 pts). Click a test to inspect.',
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
    askAiBtn: 'Ask Fire Tamers Mentor about this test',
    openSimBtn: 'Open in 3D Simulator (0g vs 1g)',
    atmSection: 'Atmosphere & Flow Parameters',
    thermalSection: 'Thermal & Combustion Results',
    qualityTitle: 'Quality notes',
    commentTitle: 'Original NASA comment',
    backToList: (n) => `Back to list (${n})`,
    listSearchPlaceholder: 'Search by Test ID...',
    sortLabel: 'Sort:',
    sortId: 'Test ID',
    sortO2: 'O₂ %',
    sortPsi: 'Pressure (psi)',
    sortTemp: 'Peak (°C)',
    sortBurn: 'Burn time (s)',
    emptySearch: 'No matching tests found.',
  },
  pointPopover: {
    testsCount: (n) => `${n} tests`,
    clickToPin: 'Click to pin',
    pinned: 'Pinned',
    close: 'Close list',
    showingOf: (shown, total, canScrollMore) =>
      canScrollMore
        ? `Showing ${shown} of ${total} · scroll for more`
        : `Showing ${shown} of ${total}`,
    viewAll: (n) => `View all (${n})`,
    filterCell: 'Filter cell',
  },
  ai: {
    title: 'Fire Tamers Mentor',
    subtitle: (n) => `Public NASA PSI-159 data · ${n} tests`,
    launcherSub: 'PSI-159 Mentor · Q&A & Quiz',
    simple: 'Simple mode',
    tech: 'Technical mode',
    quizBtn: 'Quick Quiz Mode',
    quizLoading: 'Generating Quiz...',
    welcome: (n) =>
      `Hello! I am the Fire Tamers Mentor (an independent project using public NASA PSI-159 experiment data, not an official NASA project). I see your active filters (${n} tests) — ask anything or start the Quick Quiz!`,
    suggestionsTitle: 'Suggested questions',
    placeholder: 'Ask about O₂, cool flames, Test ID...',
    copy: 'Copy',
    copied: 'Copied',
    viewTest: 'Inspect',
    quizTitle: (n) => `Quick Quiz Mode (${n} questions)`,
    closeQuiz: 'Close quiz',
    quizProgress: (curr, total) => `Question ${curr} of ${total}`,
    quizHintBtn: 'Show hint',
    quizHideHintBtn: 'Hide hint',
    quizVerifyBtn: 'Check',
    quizNextBtn: 'Next',
    quizFinishBtn: 'See score',
    quizRestartBtn: 'Restart',
    quizRegenerateBtn: 'Generate new quiz',
    quizCorrectMsg: 'Correct answer!',
    quizIncorrectMsg: 'Incorrect answer.',
    quizScoreTitle: 'Final score',
    quizScoreSummary: (correct, total) =>
      `You got ${correct} out of ${total} questions right.`,
    quizLangChangedPrompt: 'Language changed. Generate new quiz?',
    quizOfflineFallbackNotice:
      'Temporary AI quota reached — quiz generated directly from verified PSI-159 data.',
    errorFallback: 'Unable to reach the Fire Tamers Mentor.',
    quizErrorFallback: 'Failed to generate the quick quiz.',
    streamErrorFallback: 'Streaming response error.',
    backLabel: 'Back',
    resizeHandleTitle: 'Drag to resize width',
    clearChatTitle: 'Clear conversation',
    minimizeChatLabel: 'Minimize chat',
    sendLabel: 'Send',
  },
  prompts: {
    explainIgnitionMap:
      'Explain the current Ignition Map (pressure vs. O₂), highlighting the Lunar Zone (O₂ >= 30% and pressure <= 10.2 psi), Earth Air, and real Test ID examples.',
    explainFlowVsTemp:
      'Analyze the relationship between fuel flow (hc_flow_mg_s) and peak burner temperature (peak_burner_temp_c) in the filtered tests, citing real Test IDs.',
    explainOutcomes:
      'Explain the distribution of outcomes (self-extinguished, flow terminated, no ignition, flash only, cool flame only) across ethane, propane, and butane (normal vs. inverse flames) in the filtered data.',
    explainBurnTime:
      'Explain the burn duration (burn_time_s) distribution across ethane, propane, and butane in the filtered tests and cite the longest-burning test.',
    explainNormalVsInverse:
      'Compare normal flames vs. inverse flames in the filtered tests (mean O₂, mean pressure, burn time, peak temp, and ignition rate), citing real Test ID examples.',
    explainTimeline:
      'Analyze the progression over the 12 campaign days (days 1 to 12) in the filtered data: which days concentrated the most tests, highest mean temperatures, or cool flames?',
    explainCoolMatrix:
      'Explain the Cool Flame Matrix (codes PCI-A through PCI-G and cool_flame_only cases), which fuels, pressures, and O₂ concentrations produced them, and why they matter for spacecraft safety.',
    explainParam3d:
      'Explain what the 3D Parameter Space (Pressure × O₂ × Peak Temp/Flow/Burn Time) reveals about where cool flames, thermal limits, and Lunar Zone tests occur.',
    explainLunarTop10:
      "Explain the top 3 tests in the 'Lunar Base Relevance' ranking for the current filters and why they pose higher fire risk in lunar atmospheres (O₂ >= 30%, P <= 10.2 psi).",
    explainEarthAnalogies:
      'Give a clear explanation with everyday Earth analogies (car engine knock, kitchen stove, fire extinguisher) connecting cool flames to fire risk on a Lunar Base.',
    explainSim3dTest: (id, fuel, flame, o2Pct, psi) =>
      `Explain in simple terms the flame behavior in test ${id} (${fuel}, ${flame}, ${o2Pct}% O₂, ${psi} psi) compared with a flame on Earth (1g).`,
    askSim3dTest: (id) =>
      `Explain test ${id} in detail, why it had this outcome, and what it teaches us about fires on the ISS vs. on Earth.`,
    askDrawerTest: (id, fuel, o2Pct, psi) =>
      `Explain test ${id} in simple terms: what happened with this ${fuel} mixture at ${o2Pct}% O₂ and ${psi} psi, and what is the space safety takeaway?`,
    drawerContextLabel: (id) => `Test detail ${id}`,
    sim3dContextLabel: (id) => `3D Simulator (${id})`,
  },
};

const ES: UiStrings = {
  appTitle: 'Fire Tamers',
  appSubtitle: 'Datos NASA PSI-159 · Llamas frías en microgravedad',
  appDescription:
    'Fire Tamers — Proyecto independiente con datos públicos del experimento NASA PSI-159 (llamas frías en microgravedad), visualizaciones 2D/3D y Mentor Fire Tamers.',
  footerNotice:
    'Proyecto independiente creado para el desafío NASA. Datos: NASA Physical Science Informatics (PSI-159).',
  logoAlt: 'Logotipo Fire Tamers y ACME · Volver a Resumen',
  cover: {
    subtitle: 'Seguridad contra incendios en el espacio, explicada para todos',
    credit: 'Datos NASA ACME CFI-G (PSI-159) · Proyecto independiente',
    cta: 'Abrir panel',
    ctaAria: 'Abrir panel (Enter o Espacio)',
    langGroupAria: 'Seleccionar idioma',
  },
  tabs: {
    overview: 'Resumen',
    analyses: 'Análisis',
    ignition: 'Mapa de Ignición',
    cool_flames: 'Llamas Frías',
    explore: 'Explorar Ensayos',
    about: 'Sobre los Datos',
  },
  nav: {
    breadcrumbRoot: 'Fire Tamers',
    moreAnalyses: 'Mostrar más análisis',
    backToOverview: 'Volver al Resumen',
    viewLunarRanking: 'Ver ranking Lunar',
    discoveriesTitle: 'Hallazgos',
    discoveriesSubtitle: 'Hallazgos calculados con filtros activos',
    shortcutHint: 'Atajos 1–5',
    mobileTabMap: 'Mapa',
  },
  overviewTabs: {
    outcomes: 'Desenlaces',
    burn: 'Combustión',
    radar: 'Normal × Inversa',
    timeline: 'Línea temporal',
    flow: 'Flujo × Pico',
  },
  help: 'Ayuda',
  menu: 'Menú',
  presentation: 'Presentar (P)',
  exitPresentation: 'Salir (P / Esc)',
  textSize: {
    label: 'Tamaño de texto',
    groupAria: 'Tamaño del texto en gráficos y tarjetas (atajos [ y ])',
    normal: 'Normal (100%)',
    large: 'Grande (115%)',
    xlarge: 'Extra grande (130%)',
    decreaseAria: 'Tamaño de texto: Normal (100%) · Atajo [',
    defaultAria: 'Tamaño de texto: Grande (115%) · Predeterminado',
    increaseAria: 'Tamaño de texto: Extra grande (130%) · Atajo ]',
    mobileCapHint: 'En móvil el máximo es Grande (115%)',
    presentationHint: 'El Modo Presentación fuerza Extra grande (130%)',
  },
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
    expand: 'Ampliar gráfico',
    collapse: 'Cerrar vista ampliada',
    legendBtn: 'Leyenda',
    emptyTitle: 'Ningún ensayo coincide con los filtros actuales.',
    emptySubtitle: 'Amplía el rango de O₂ o presión, o quita el filtro cruzado.',
    errorTitle: 'No se pudo mostrar este gráfico. Intentar de nuevo',
    retry: 'Intentar de nuevo',
    clickToFilter: 'Clic para filtrar',
    clickToOpenTest: 'Clic para abrir el ensayo',
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
    helpTip: 'Arrastra un recuadro en el gráfico para filtrar por O₂ y presión, o haz clic en un punto o celda para inspeccionar.',
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
    helpTip: 'El color indica el gas combustible. Haz clic en cualquier punto para ver los detalles del ensayo.',
  },
  outcomesChart: {
    title: 'Resultados por Gas y Llama',
    subtitle: 'Barras agrupadas: Normal (sólida) × Inversa (rayada)',
    yAxisLabel: 'Nº de ensayos',
    inverseStripe: 'Inversa (ray.)',
    helpTip: 'Haz clic en cualquier segmento de la barra para filtrar por gas, llama y resultado.',
  },
  burnChart: {
    title: 'Distribución del Tiempo de Llama',
    subtitle: 'Duración en segundos por gas',
    helpTip: 'Haz clic en un rango de duración para filtrar los ensayos correspondientes.',
  },
  radarChart: {
    title: 'Comparativa Normal × Inversa',
    subtitle: 'Promedios normalizados de O₂, presión, duración y pico',
    o2Mean: 'O₂ medio',
    pressure: 'Presión',
    burnTime: 'Llama (s)',
    peakTemp: 'Pico (°C)',
    ignitionRate: 'Ignición %',
    helpTip: 'En la llama normal, el combustible sale hacia una cámara con O₂. En la llama inversa, el O₂ fluye hacia una atmósfera rica en combustible.',
  },
  timelineChart: {
    title: 'Línea Temporal (Días 1–12)',
    subtitle: 'Ensayos realizados y pico térmico medio por día',
    tests: 'Ensayos',
    meanPeak: 'Pico medio (°C)',
    helpTip: 'Los 333 ensayos de PSI-159 se ejecutaron en 12 días en la cámara CFI-G. Haz clic en un día para filtrar los demás gráficos.',
  },
  coolMatrix: {
    title: 'Matriz de Llama Fría · Códigos PCI-A a PCI-G',
    occurrences: 'casos en filtros activos',
    helpTip: 'Haz clic en un Test ID para ver los detalles del ensayo, o en el conteo para explorar la lista agrupada.',
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
    helpTip: 'Arrastra para rotar, usa la rueda para zoom y haz clic en una esfera para inspeccionar ensayos.',
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
    helpTip: 'Zona Lunar (hasta 40 pts: O₂ ≥ 30% y P ≤ 10,2 psi) + Llama Fría (+25 pts) + Pico Térmico (hasta 20 pts) + Duración (hasta 15 pts). Haz clic en un ensayo para ver detalles.',
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
    askAiBtn: 'Preguntar al Mentor Fire Tamers sobre este ensayo',
    openSimBtn: 'Abrir en Simulador 3D (0g vs 1g)',
    atmSection: 'Parámetros Atmosféricos y Flujo',
    thermalSection: 'Resultados Térmicos y Combustión',
    qualityTitle: 'Notas de calidad',
    commentTitle: 'Comentario original de NASA',
    backToList: (n) => `Volver a la lista (${n})`,
    listSearchPlaceholder: 'Buscar por Test ID...',
    sortLabel: 'Ordenar:',
    sortId: 'Test ID',
    sortO2: 'O₂ %',
    sortPsi: 'Presión (psi)',
    sortTemp: 'Pico (°C)',
    sortBurn: 'Duración (s)',
    emptySearch: 'No se encontraron ensayos para esta búsqueda.',
  },
  pointPopover: {
    testsCount: (n) => `${n} ensayos`,
    clickToPin: 'Clic para fijar',
    pinned: 'Fijado',
    close: 'Cerrar lista',
    showingOf: (shown, total, canScrollMore) =>
      canScrollMore
        ? `Mostrando ${shown} de ${total} · desplaza para ver más`
        : `Mostrando ${shown} de ${total}`,
    viewAll: (n) => `Ver todos (${n})`,
    filterCell: 'Filtrar celda',
  },
  ai: {
    title: 'Mentor Fire Tamers',
    subtitle: (n) => `Datos públicos NASA PSI-159 · ${n} ensayos`,
    launcherSub: 'Mentor PSI-159 · Dudas y Quiz',
    simple: 'Modo simple',
    tech: 'Modo técnico',
    quizBtn: 'Modo Quiz rápido',
    quizLoading: 'Generando Quiz...',
    welcome: (n) =>
      `¡Hola! Soy el Mentor Fire Tamers (proyecto independiente que usa datos públicos del experimento NASA PSI-159, no oficial de la NASA). Veo tus filtros actuales (${n} ensayos) — ¡pregunta lo que quieras o inicia el Quiz rápido!`,
    suggestionsTitle: 'Sugerencias para esta vista',
    placeholder: 'Pregunta sobre O₂, llamas frías, Test ID...',
    copy: 'Copiar',
    copied: 'Copiado',
    viewTest: 'Ver',
    quizTitle: (n) => `Modo Quiz Rápido (${n} preguntas)`,
    closeQuiz: 'Cerrar quiz',
    quizProgress: (curr, total) => `Pregunta ${curr} de ${total}`,
    quizHintBtn: 'Ver pista',
    quizHideHintBtn: 'Ocultar pista',
    quizVerifyBtn: 'Verificar',
    quizNextBtn: 'Siguiente',
    quizFinishBtn: 'Ver puntuación',
    quizRestartBtn: 'Reiniciar',
    quizRegenerateBtn: 'Generar nuevo quiz',
    quizCorrectMsg: '¡Respuesta correcta!',
    quizIncorrectMsg: 'Respuesta incorrecta.',
    quizScoreTitle: 'Puntuación final',
    quizScoreSummary: (correct, total) =>
      `Acertaste ${correct} de ${total} preguntas.`,
    quizLangChangedPrompt: 'Idioma cambiado. ¿Generar nuevo quiz?',
    quizOfflineFallbackNotice:
      'Cuota temporal de IA alcanzada — quiz generado directamente con datos verificados de PSI-159.',
    errorFallback: 'No fue posible consultar al Mentor Fire Tamers.',
    quizErrorFallback: 'Error al generar el quiz rápido.',
    streamErrorFallback: 'Error al transmitir la respuesta.',
    backLabel: 'Volver',
    resizeHandleTitle: 'Arrastra para cambiar el ancho',
    clearChatTitle: 'Limpiar conversación',
    minimizeChatLabel: 'Minimizar chat',
    sendLabel: 'Enviar',
  },
  prompts: {
    explainIgnitionMap:
      'Explica el Mapa de Ignición actual (presión vs O₂) destacando la Zona Lunar (O₂ >= 30% y presión <= 10,2 psi), el Aire de la Tierra y ejemplos reales de Test ID.',
    explainFlowVsTemp:
      'Analiza la relación entre el flujo de combustible (hc_flow_mg_s) y la temperatura pico en el quemador (peak_burner_temp_c) en los ensayos filtrados, citando Test IDs reales.',
    explainOutcomes:
      'Explica la distribución de resultados (autoextinguida, flujo cortado, sin ignición, solo destello, solo llama fría) entre etano, propano y butano (llamas normales vs inversas) en los datos filtrados.',
    explainBurnTime:
      'Explica la distribución del tiempo de combustión (burn_time_s) entre etano, propano y butano en los ensayos filtrados y cita el ensayo de mayor duración.',
    explainNormalVsInverse:
      'Compara llamas normales vs llamas inversas en los ensayos filtrados (O₂ medio, presión media, duración, temperatura pico y tasa de ignición), citando ejemplos reales de Test ID.',
    explainTimeline:
      'Analiza la evolución a lo largo de los 12 días de campaña (días 1 a 12) en los datos filtrados: ¿qué días concentraron más ensayos, mayores temperaturas medias o llamas frías?',
    explainCoolMatrix:
      'Explica la Matriz de Llama Fría (códigos PCI-A a PCI-G y casos de cool_flame_only), en qué gases, presiones y concentraciones de O₂ aparecieron y por qué importan para la seguridad espacial.',
    explainParam3d:
      'Explica qué revela el Espacio de Parámetros 3D (Presión × O₂ × Pico Térmico/Flujo/Duración) sobre dónde ocurren llamas frías, límites térmicos y ensayos en la Zona Lunar.',
    explainLunarTop10:
      "Explica los 3 primeros ensayos del ranking 'Base Lunar' con los filtros actuales y por qué representan mayor riesgo en atmósferas lunares (O₂ >= 30%, P <= 10,2 psi).",
    explainEarthAnalogies:
      'Ofrece una explicación didáctica con analogías cotidianas en la Tierra (motor de auto, cocina y extintor) conectando las llamas frías con el riesgo en una Base Lunar.',
    explainSim3dTest: (id, fuel, flame, o2Pct, psi) =>
      `Explica con lenguaje sencillo el comportamiento de la llama en el ensayo ${id} (${fuel}, ${flame}, ${o2Pct}% O₂, ${psi} psi) comparado con una llama en la Tierra (1g).`,
    askSim3dTest: (id) =>
      `Explica en detalle el ensayo ${id}, por qué tuvo ese resultado y qué nos enseña sobre incendios en la ISS vs en la Tierra.`,
    askDrawerTest: (id, fuel, o2Pct, psi) =>
      `Explica el ensayo ${id} en términos sencillos: ¿qué pasó con esta mezcla de ${fuel} al ${o2Pct}% de O₂ y ${psi} psi, y cuál es la lección de seguridad espacial?`,
    drawerContextLabel: (id) => `Detalle del ensayo ${id}`,
    sim3dContextLabel: (id) => `Simulador 3D (${id})`,
  },
};

const DICT: Record<AppLanguage, UiStrings> = { pt: PT, en: EN, es: ES };

export function useStrings(lang: AppLanguage): UiStrings {
  return DICT[lang] ?? PT;
}
