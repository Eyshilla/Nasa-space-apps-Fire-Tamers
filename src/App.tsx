import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { AboutDataView } from './components/AboutDataView';
import { BurnTimeHistogram } from './components/charts/BurnTimeHistogram';
import { CampaignTimelineChart } from './components/charts/CampaignTimelineChart';
import { CoolFlameMatrix } from './components/charts/CoolFlameMatrix';
import { ExploreTestsTable } from './components/charts/ExploreTestsTable';
import { FlowVsTempChart } from './components/charts/FlowVsTempChart';
import { IgnitionMapChart } from './components/charts/IgnitionMapChart';
import { NormalVsInverseChart } from './components/charts/NormalVsInverseChart';
import { OutcomesBarChart } from './components/charts/OutcomesBarChart';
import { ChartErrorBoundary } from './components/ChartErrorBoundary';
import { CoverScreen } from './components/CoverScreen';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { HelpModal } from './components/HelpModal';
import {
  InsightsSection,
  LunarRankingModal,
  LunarTop10Card,
  OverviewDiscoveriesCard,
} from './components/InsightsSection';
import { KpiStrip } from './components/KpiStrip';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SharedLegendStrip } from './components/SharedLegendStrip';
import { SuperintelligencePanel } from './components/SuperintelligencePanel';
import { TabbedChartCard } from './components/TabbedChartCard';
import { TestDetailDrawer } from './components/TestDetailDrawer';
import { ChamberSimulator3D } from './components/three/ChamberSimulator3D';
import { ParameterSpace3D } from './components/three/ParameterSpace3D';
import { TopBar } from './components/TopBar';
import {
  CHART_FONT_SCALE_FACTORS,
  usePsiStore,
} from './store/usePsiStore';
import type { DashboardTab, OverviewCardTabId } from './types/psi159';
import { applyGlobalFilters, computeKpis } from './utils/analytics';
import { useStrings } from './utils/i18n';
import { preloadPsi159Csv } from './utils/parsePsi159';
import { resolveEffectiveChartScale } from './utils/useChartTypography';

function shouldSkipCover(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.trim().toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const demoFlag =
    params.get('demo') === '1' ||
    params.get('demo') === 'true' ||
    hash === '#demo' ||
    Boolean((window as { __PSI_DEMO_MODE__?: boolean }).__PSI_DEMO_MODE__);
  return hash === '#dashboard' || params.get('skip') === '1' || demoFlag;
}

type MobileOverviewChartTab = 'ignition' | OverviewCardTabId;

export default function App() {
  const tests = usePsiStore((s) => s.tests);
  const loading = usePsiStore((s) => s.loading);
  const error = usePsiStore((s) => s.error);
  const lang = usePsiStore((s) => s.lang);
  const activeTab = usePsiStore((s) => s.activeTab);
  const setActiveTab = usePsiStore((s) => s.setActiveTab);
  const filters = usePsiStore((s) => s.filters);
  const drawerOpen = usePsiStore((s) => s.drawerOpen);
  const chatOpen = usePsiStore((s) => s.chatOpen);
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const togglePresentationMode = usePsiStore((s) => s.togglePresentationMode);
  const setPresentationMode = usePsiStore((s) => s.setPresentationMode);
  const chartFontScale = usePsiStore((s) => s.chartFontScale);
  const stepChartFontScale = usePsiStore((s) => s.stepChartFontScale);
  const fetchDataset = usePsiStore((s) => s.fetchDataset);

  const tStr = useStrings(lang);

  const headerRef = useRef<HTMLElement | null>(null);
  const desktopFilterRef = useRef<HTMLElement | null>(null);
  const mobileFilterRef = useRef<HTMLElement | null>(null);
  const [chatWidth, setChatWidth] = useState(410);
  const [viewportW, setViewportW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [viewportH, setViewportH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [headerHeightPx, setHeaderHeightPx] = useState(52);
  const [filtersHeightPx, setFiltersHeightPx] = useState(44);
  const [isMobileFilterMode, setIsMobileFilterMode] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(
          '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
        ).matches
      : false
  );
  const [mobileChartTab, setMobileChartTab] =
    useState<MobileOverviewChartTab>('ignition');
  const [mobileIgnitionSubTab, setMobileIgnitionSubTab] = useState<
    'map' | '3d' | 'top10'
  >('map');
  const [mobileCoolSubTab, setMobileCoolSubTab] = useState<'sim' | 'matrix'>(
    'sim'
  );

  const isWideDesktop = !isMobileFilterMode;
  const isPhone = viewportW < 768;
  const isDesktop = viewportW >= 1024;
  const shouldStickDesktopFilters = isWideDesktop && !presentationMode;

  const [showCover, setShowCover] = useState<boolean>(() => !shouldSkipCover());

  // Preload static CSV on cover; hydrate dataset after entering dashboard
  useEffect(() => {
    if (showCover) {
      void preloadPsi159Csv();
      return;
    }
    void fetchDataset();
  }, [showCover, fetchDataset]);

  useEffect(() => {
    if (!showCover) return;
    const onHashChange = () => {
      if (shouldSkipCover()) setShowCover(false);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [showCover]);

  // Sync HTML lang, document title, and meta description with active language
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    document.title = `${tStr.appTitle} · ${tStr.appSubtitle}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', tStr.appDescription);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute('content', tStr.appTitle);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', tStr.appDescription);
  }, [lang, tStr]);

  // Measure header (--header-h) and active filter bar (--filters-h) dynamically via ResizeObserver
  useEffect(() => {
    if (showCover) return;
    const headerEl = headerRef.current;
    const filterEl =
      !presentationMode && isWideDesktop
        ? desktopFilterRef.current
        : !presentationMode
          ? mobileFilterRef.current
          : null;

    const updateVars = () => {
      const h = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
      const f = filterEl ? Math.ceil(filterEl.getBoundingClientRect().height) : 0;
      if (h > 0) {
        document.documentElement.style.setProperty('--header-h', `${h}px`);
        setHeaderHeightPx((prev) => (prev === h ? prev : h));
      }
      document.documentElement.style.setProperty('--filters-h', `${f}px`);
      setFiltersHeightPx((prev) => (prev === f ? prev : f));

      const effectiveSticky = isWideDesktop && !presentationMode;
      document.documentElement.style.setProperty(
        '--sticky-filters-h',
        effectiveSticky ? `${f}px` : '0px'
      );
    };

    const raf = requestAnimationFrame(updateVars);
    const ro = new ResizeObserver(updateVars);
    if (headerEl) ro.observe(headerEl);
    if (filterEl) ro.observe(filterEl);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [
    showCover,
    lang,
    chartFontScale,
    isWideDesktop,
    presentationMode,
    viewportW,
    viewportH,
    filters,
  ]);

  // Sync Presentation Mode DOM attribute
  useEffect(() => {
    document.documentElement.dataset.presentation = presentationMode
      ? 'true'
      : 'false';
    if (presentationMode) {
      requestAnimationFrame(() => {
        document
          .getElementById('ignition-map-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [presentationMode]);

  // Sync --chart-font-scale CSS variable (Presentation forces 130% on >=768px; mobile <768px caps at 115%)
  useEffect(() => {
    const effectiveLevel = resolveEffectiveChartScale(
      chartFontScale,
      presentationMode,
      viewportW
    );
    const factor = CHART_FONT_SCALE_FACTORS[effectiveLevel];
    document.documentElement.style.setProperty('--chart-font-scale', String(factor));
    document.documentElement.dataset.chartFontScale = effectiveLevel;
  }, [chartFontScale, presentationMode, viewportW]);

  // Global keyboard shortcuts: 1-5 tabs, P presentation, [ / ] text size
  useEffect(() => {
    if (showCover) return;
    const TAB_BY_KEY: Record<string, DashboardTab> = {
      '1': 'overview',
      '2': 'ignition',
      '3': 'cool_flames',
      '4': 'explore',
      '5': 'about',
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (TAB_BY_KEY[e.key]) {
        e.preventDefault();
        setActiveTab(TAB_BY_KEY[e.key]);
        window.scrollTo({ top: 0, behavior: 'auto' });
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePresentationMode();
      } else if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
      } else if (e.key === '[' && !presentationMode) {
        e.preventDefault();
        stepChartFontScale(-1, viewportW < 768 ? 'large' : 'xlarge');
      } else if (e.key === ']' && !presentationMode) {
        e.preventDefault();
        stepChartFontScale(1, viewportW < 768 ? 'large' : 'xlarge');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showCover,
    presentationMode,
    setActiveTab,
    togglePresentationMode,
    setPresentationMode,
    stepChartFontScale,
    viewportW,
  ]);

  useEffect(() => {
    const mq = window.matchMedia(
      '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
    );
    const syncViewport = () => {
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
      setIsMobileFilterMode(mq.matches);
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    window.visualViewport?.addEventListener('resize', syncViewport);
    mq.addEventListener('change', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
      window.visualViewport?.removeEventListener('resize', syncViewport);
      mq.removeEventListener('change', syncViewport);
    };
  }, []);

  const filteredTests = useMemo(
    () => applyGlobalFilters(tests, filters),
    [tests, filters]
  );

  const kpis = useMemo(() => computeKpis(filteredTests), [filteredTests]);

  const sideReservePx = useMemo(() => {
    if (!isDesktop) return 0;
    let total = 0;
    if (drawerOpen) total += 400;
    if (chatOpen) total += chatWidth;
    if (typeof window !== 'undefined' && total > window.innerWidth - 520) {
      total = chatOpen ? chatWidth : drawerOpen ? 400 : 0;
    }
    return total;
  }, [isDesktop, drawerOpen, chatOpen, chatWidth]);

  if (showCover) {
    return <CoverScreen onEnter={() => setShowCover(false)} />;
  }

  const activeTabLabel = tStr.tabs[activeTab];

  const renderBreadcrumbBar = (withLegend = false) => (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <nav
        aria-label="Breadcrumb"
        className="chrome-text-xs flex min-w-0 items-center gap-1.5 text-slate-400"
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="shrink-0 font-medium text-slate-300 transition-colors hover:text-cyan-300"
        >
          {tStr.nav.breadcrumbRoot}
        </button>
        {activeTab === 'analyses' && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" />
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="shrink-0 font-medium text-slate-300 transition-colors hover:text-cyan-300"
            >
              {tStr.tabs.overview}
            </button>
          </>
        )}
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-500" />
        <span
          aria-current="page"
          className="truncate font-semibold text-cyan-200"
        >
          {activeTabLabel}
        </span>
        <span className="hidden text-slate-500 xl:inline">
          · {tStr.nav.shortcutHint}
        </span>
      </nav>

      {withLegend && (
        <div className="hidden min-w-0 xl:flex">
          <SharedLegendStrip inline />
        </div>
      )}

      {activeTab === 'analyses' && (
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="chrome-text-xs inline-flex min-h-[26px] shrink-0 items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 font-medium text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200"
        >
          <ArrowLeft className="h-3 w-3 shrink-0" />
          <span>{tStr.nav.backToOverview}</span>
        </button>
      )}
    </div>
  );

  const mobileOverviewTabOptions: Array<{
    id: MobileOverviewChartTab;
    label: string;
  }> = [
    { id: 'ignition', label: tStr.tabs.ignition },
    { id: 'outcomes', label: tStr.overviewTabs.outcomes },
    { id: 'burn', label: tStr.overviewTabs.burn },
    { id: 'radar', label: tStr.overviewTabs.radar },
    { id: 'timeline', label: tStr.overviewTabs.timeline },
    { id: 'flow', label: tStr.overviewTabs.flow },
  ];

  const effectiveScale = resolveEffectiveChartScale(
    chartFontScale,
    presentationMode,
    viewportW
  );
  const isOverviewDesktopLock =
    activeTab === 'overview' &&
    viewportW >= 1280 &&
    effectiveScale !== 'xlarge';

  return (
    <div
      data-header-h={headerHeightPx}
      data-filters-h={filtersHeightPx}
      className="dashboard-fade-in min-h-screen bg-[#0B1020] text-slate-100"
    >
      <TopBar headerRef={headerRef} />

      <div
        style={{
          paddingTop: 'var(--header-h)',
          marginRight: sideReservePx > 0 ? `${sideReservePx}px` : undefined,
        }}
        className="transition-[margin] duration-200"
      >
        {isWideDesktop && !presentationMode && (
          <div className="desktop-filter-chrome">
            <GlobalFilterBar
              mode="desktop"
              filterRef={desktopFilterRef}
              sticky={shouldStickDesktopFilters}
            />
          </div>
        )}

        {!isWideDesktop && !presentationMode && (
          <div className="mobile-filter-flow mx-auto max-w-[1680px] px-3 pt-2 sm:px-4">
            <GlobalFilterBar mode="mobile" filterRef={mobileFilterRef} />
          </div>
        )}

        <main
          style={{ position: 'relative', zIndex: 'var(--z-content)' }}
          className={`main-dashboard-container mx-auto max-w-[1680px] px-3 sm:px-4 ${
            isOverviewDesktopLock
              ? 'overview-desktop-shell py-2'
              : 'pb-20 pt-2.5 md:pb-6'
          }`}
        >
          {error && (
            <div
              role="alert"
              className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-200"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span className="wrap-anywhere">{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchDataset}
                className="inline-flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded border border-red-400/40 bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-100 hover:bg-red-500/30"
              >
                <RefreshCw className="h-3 w-3 shrink-0" />
                Retry
              </button>
            </div>
          )}

          {/* ==================== TAB 1: VISÃO GERAL (SINGLE-SCREEN DESKTOP DASHBOARD) ==================== */}
          {activeTab === 'overview' && (
            <div
              className={`flex flex-col gap-2 ${
                isOverviewDesktopLock ? 'min-h-0 flex-1' : 'space-y-3'
              }`}
            >
              {/* Breadcrumb + inline shared legend */}
              {renderBreadcrumbBar(true)}

              {/* Row 1: Compact 6-card KPI Strip (~82px <= 96px on desktop; horizontal carousel on mobile) */}
              <div className="shrink-0">
                <KpiStrip
                  kpis={kpis}
                  totalDataset={tests.length || 333}
                  loading={loading}
                />
              </div>

              {/* Mobile (<768px): Tabbed single-chart view <= 60dvh + Discoveries */}
              {isPhone ? (
                <div className="space-y-3">
                  <div className="no-scrollbar flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5">
                    {mobileOverviewTabOptions.map((tab) => {
                      const active = mobileChartTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setMobileChartTab(tab.id)}
                          className={`chrome-text-xs min-h-[34px] shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1 font-medium transition-colors ${
                            active
                              ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                              : 'border-slate-700/80 bg-[#121A30] text-slate-300'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="overview-mobile-chart-box">
                    <ChartErrorBoundary variant="card" resetKey={mobileChartTab}>
                      {mobileChartTab === 'ignition' && (
                        <IgnitionMapChart
                          tests={filteredTests}
                          loading={loading}
                          sharedLegendActive
                        />
                      )}
                      {mobileChartTab === 'outcomes' && (
                        <OutcomesBarChart
                          tests={filteredTests}
                          loading={loading}
                          sharedLegendActive
                        />
                      )}
                      {mobileChartTab === 'burn' && (
                        <BurnTimeHistogram
                          tests={filteredTests}
                          loading={loading}
                        />
                      )}
                      {mobileChartTab === 'radar' && (
                        <NormalVsInverseChart
                          tests={filteredTests}
                          loading={loading}
                          sharedLegendActive
                        />
                      )}
                      {mobileChartTab === 'timeline' && (
                        <CampaignTimelineChart
                          tests={filteredTests}
                          loading={loading}
                        />
                      )}
                      {mobileChartTab === 'flow' && (
                        <FlowVsTempChart
                          tests={filteredTests}
                          loading={loading}
                          sharedLegendActive
                        />
                      )}
                    </ChartErrorBoundary>
                  </div>

                  <OverviewDiscoveriesCard
                    tests={filteredTests}
                    onMoreAnalyses={() => setActiveTab('analyses')}
                  />
                </div>
              ) : (
                /* Desktop & Tablet (>= 768px): 12-col grid (7 Ignition Map + 5 TabbedChartCard & Discoveries) */
                <div
                  className={`grid grid-cols-1 gap-2.5 xl:grid-cols-12 ${
                    isOverviewDesktopLock ? 'min-h-0 flex-1' : ''
                  }`}
                >
                  {/* Left: 7 columns -> Ignition Map filling remaining height */}
                  <div className="flex min-w-0 flex-col xl:col-span-7 xl:h-full xl:min-h-0">
                    <ChartErrorBoundary variant="card" title={tStr.ignitionChart.title}>
                      <IgnitionMapChart
                        tests={filteredTests}
                        loading={loading}
                        fillHeight={isOverviewDesktopLock}
                        compact={isOverviewDesktopLock}
                        sharedLegendActive
                      />
                    </ChartErrorBoundary>
                  </div>

                  {/* Right: 5 columns -> stacked TabbedChartCard (flex-1) + Discoveries (shrink-0) */}
                  <div className="flex min-w-0 flex-col gap-2.5 xl:col-span-5 xl:h-full xl:min-h-0">
                    <div className="flex min-h-0 flex-1 flex-col">
                      <TabbedChartCard
                        tests={filteredTests}
                        loading={loading}
                        fillHeight={isOverviewDesktopLock}
                        compactHeader={isOverviewDesktopLock}
                      />
                    </div>
                    <OverviewDiscoveriesCard tests={filteredTests} />
                  </div>
                </div>
              )}

              {/* Bottom Strip: "Mostrar mais análises" + source attribution */}
              <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-1.5 text-[11px] text-[#B4C3D8]">
                <p className="wrap-anywhere">{tStr.footerNotice}</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('analyses');
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                  className="chrome-text-xs inline-flex min-h-[28px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-cyan-500/45 bg-cyan-500/15 px-3 py-1 font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/25 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <span>{tStr.nav.moreAnalyses}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              </footer>
            </div>
          )}

          {/* ==================== SUB-SCREEN: ANÁLISES (2-PER-ROW GRID) ==================== */}
          {activeTab === 'analyses' && (
            <div className="space-y-4">
              {renderBreadcrumbBar(false)}
              <SharedLegendStrip />
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ChartErrorBoundary variant="card" title={tStr.flowChart.title}>
                  <FlowVsTempChart
                    tests={filteredTests}
                    loading={loading}
                    sharedLegendActive
                  />
                </ChartErrorBoundary>
                <ChartErrorBoundary variant="card" title={tStr.outcomesChart.title}>
                  <OutcomesBarChart
                    tests={filteredTests}
                    loading={loading}
                    sharedLegendActive
                  />
                </ChartErrorBoundary>
                <ChartErrorBoundary variant="card" title={tStr.burnChart.title}>
                  <BurnTimeHistogram tests={filteredTests} loading={loading} />
                </ChartErrorBoundary>
                <ChartErrorBoundary variant="card" title={tStr.radarChart.title}>
                  <NormalVsInverseChart
                    tests={filteredTests}
                    loading={loading}
                    sharedLegendActive
                  />
                </ChartErrorBoundary>
                <ChartErrorBoundary variant="card" title={tStr.timelineChart.title}>
                  <CampaignTimelineChart
                    tests={filteredTests}
                    loading={loading}
                  />
                </ChartErrorBoundary>
                <ChartErrorBoundary variant="card" title={tStr.top10.title}>
                  <LunarTop10Card tests={filteredTests} loading={loading} />
                </ChartErrorBoundary>
              </div>
              <InsightsSection tests={filteredTests} />
              <footer className="border-t border-slate-800/80 pt-3 text-center text-xs text-[#B4C3D8]">
                <p className="wrap-anywhere">{tStr.footerNotice}</p>
              </footer>
            </div>
          )}

          {/* ==================== TAB 2: MAPA DE IGNIÇÃO + 3D ==================== */}
          {activeTab === 'ignition' && (
            <div className="space-y-3">
              {renderBreadcrumbBar(true)}
              {isPhone ? (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {(
                      [
                        ['map', tStr.tabs.ignition],
                        ['3d', tStr.param3d.title.split('·')[0].trim()],
                        ['top10', tStr.top10.title],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMobileIgnitionSubTab(id)}
                        className={`chrome-text-xs min-h-[34px] shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1 font-medium ${
                          mobileIgnitionSubTab === id
                            ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                            : 'border-slate-700/80 bg-[#121A30] text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="overview-mobile-chart-box">
                    <ChartErrorBoundary variant="card" resetKey={mobileIgnitionSubTab}>
                      {mobileIgnitionSubTab === 'map' && (
                        <IgnitionMapChart
                          tests={filteredTests}
                          loading={loading}
                          sharedLegendActive
                        />
                      )}
                      {mobileIgnitionSubTab === '3d' && (
                        <ParameterSpace3D tests={filteredTests} loading={loading} />
                      )}
                      {mobileIgnitionSubTab === 'top10' && (
                        <LunarTop10Card tests={filteredTests} loading={loading} />
                      )}
                    </ChartErrorBoundary>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <div className="min-w-0 xl:col-span-6">
                    <ChartErrorBoundary variant="card" title={tStr.ignitionChart.title}>
                      <IgnitionMapChart
                        tests={filteredTests}
                        loading={loading}
                        tall
                        sharedLegendActive
                      />
                    </ChartErrorBoundary>
                  </div>
                  <div className="min-w-0 xl:col-span-6">
                    <ChartErrorBoundary variant="card" title={tStr.param3d.title}>
                      <ParameterSpace3D tests={filteredTests} loading={loading} />
                    </ChartErrorBoundary>
                  </div>
                </div>
              )}
              <footer className="border-t border-slate-800/80 pt-3 text-center text-xs text-[#B4C3D8]">
                <p className="wrap-anywhere">{tStr.footerNotice}</p>
              </footer>
            </div>
          )}

          {/* ==================== TAB 3: CHAMAS FRIAS + SIMULADOR 3D ==================== */}
          {activeTab === 'cool_flames' && (
            <div className="space-y-3">
              {renderBreadcrumbBar(false)}
              {isPhone ? (
                <div className="space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {(
                      [
                        ['sim', tStr.sim3d.title.split('·')[0].trim()],
                        ['matrix', tStr.coolMatrix.title.split('·')[0].trim()],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMobileCoolSubTab(id)}
                        className={`chrome-text-xs min-h-[34px] shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1 font-medium ${
                          mobileCoolSubTab === id
                            ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                            : 'border-slate-700/80 bg-[#121A30] text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <ChartErrorBoundary variant="card" resetKey={mobileCoolSubTab}>
                    {mobileCoolSubTab === 'sim' && (
                      <ChamberSimulator3D
                        tests={filteredTests.length > 0 ? filteredTests : tests}
                        loading={loading}
                      />
                    )}
                    {mobileCoolSubTab === 'matrix' && (
                      <CoolFlameMatrix tests={filteredTests} loading={loading} />
                    )}
                  </ChartErrorBoundary>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <div className="min-w-0 xl:col-span-6">
                    <ChartErrorBoundary variant="card" title={tStr.sim3d.title}>
                      <ChamberSimulator3D
                        tests={filteredTests.length > 0 ? filteredTests : tests}
                        loading={loading}
                      />
                    </ChartErrorBoundary>
                  </div>
                  <div className="min-w-0 xl:col-span-6">
                    <ChartErrorBoundary variant="card" title={tStr.coolMatrix.title}>
                      <CoolFlameMatrix tests={filteredTests} loading={loading} />
                    </ChartErrorBoundary>
                  </div>
                </div>
              )}
              <footer className="border-t border-slate-800/80 pt-3 text-center text-xs text-[#B4C3D8]">
                <p className="wrap-anywhere">{tStr.footerNotice}</p>
              </footer>
            </div>
          )}

          {/* ==================== TAB 4: EXPLORAR ENSAIOS (TABLE SCROLL ONLY) ==================== */}
          {activeTab === 'explore' && (
            <div className="space-y-3">
              {renderBreadcrumbBar(false)}
              <ChartErrorBoundary variant="card" title={tStr.table.title}>
                <ExploreTestsTable tests={filteredTests} loading={loading} />
              </ChartErrorBoundary>
              <footer className="border-t border-slate-800/80 pt-2 text-center text-xs text-[#B4C3D8]">
                <p className="wrap-anywhere">{tStr.footerNotice}</p>
              </footer>
            </div>
          )}

          {/* ==================== TAB 5: SOBRE OS DADOS ==================== */}
          {activeTab === 'about' && (
            <div className="space-y-3">
              {renderBreadcrumbBar(false)}
              <AboutDataView />
              <footer className="border-t border-slate-800/80 pt-3 text-center text-xs text-[#B4C3D8]">
                <p className="wrap-anywhere">{tStr.footerNotice}</p>
              </footer>
            </div>
          )}
        </main>
      </div>

      <MobileBottomNav />
      <TestDetailDrawer />
      <LunarRankingModal tests={filteredTests} loading={loading} />
      <HelpModal />
      <SuperintelligencePanel
        panelWidth={chatWidth}
        onWidthChange={setChatWidth}
      />
    </div>
  );
}
