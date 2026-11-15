import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Box, Flame, RefreshCw, Table2 } from 'lucide-react';
import { AboutDataView } from './components/AboutDataView';
import { BurnTimeHistogram } from './components/charts/BurnTimeHistogram';
import { CampaignTimelineChart } from './components/charts/CampaignTimelineChart';
import { CoolFlameMatrix } from './components/charts/CoolFlameMatrix';
import { ExploreTestsTable } from './components/charts/ExploreTestsTable';
import { FlowVsTempChart } from './components/charts/FlowVsTempChart';
import { IgnitionMapChart } from './components/charts/IgnitionMapChart';
import { NormalVsInverseChart } from './components/charts/NormalVsInverseChart';
import { OutcomesBarChart } from './components/charts/OutcomesBarChart';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { HelpModal } from './components/HelpModal';
import { InsightsSection, LunarTop10Card } from './components/InsightsSection';
import { KpiStrip } from './components/KpiStrip';
import { SharedLegendStrip } from './components/SharedLegendStrip';
import { SuperintelligencePanel } from './components/SuperintelligencePanel';
import { TestDetailDrawer } from './components/TestDetailDrawer';
import { ChamberSimulator3D } from './components/three/ChamberSimulator3D';
import { ParameterSpace3D } from './components/three/ParameterSpace3D';
import { TopBar } from './components/TopBar';
import { usePsiStore } from './store/usePsiStore';
import { applyGlobalFilters, computeKpis } from './utils/analytics';
import { useStrings } from './utils/i18n';

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
  const fetchDataset = usePsiStore((s) => s.fetchDataset);

  const tStr = useStrings(lang);

  const headerChromeRef = useRef<HTMLDivElement | null>(null);
  const [chatWidth, setChatWidth] = useState(410);
  const [viewportW, setViewportW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [isMobileFilterMode, setIsMobileFilterMode] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(
          '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
        ).matches
      : false
  );
  const isWideDesktop = !isMobileFilterMode;
  const isDesktop = viewportW >= 1024;

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  // Dynamically measure fixed header height -> --header-h
  useEffect(() => {
    const el = headerChromeRef.current;
    if (!el) return;
    const updateVar = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--header-h', `${h}px`);
      }
    };
    updateVar();
    const ro = new ResizeObserver(updateVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isWideDesktop, presentationMode]);

  // Sync Presentation Mode DOM attribute + focus Ignition Map card
  useEffect(() => {
    document.documentElement.dataset.presentation = presentationMode ? 'true' : 'false';
    if (presentationMode) {
      requestAnimationFrame(() => {
        document
          .getElementById('ignition-map-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [presentationMode]);

  // Global keyboard shortcut: 'P' toggles Presentation Mode, 'Escape' exits
  useEffect(() => {
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
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePresentationMode();
      } else if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [presentationMode, togglePresentationMode, setPresentationMode]);

  useEffect(() => {
    const mq = window.matchMedia(
      '(max-width: 768px), ((max-height: 480px) and (pointer: coarse))'
    );
    const syncViewport = () => {
      setViewportW(window.innerWidth);
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

  // On desktop (>= 1024px), shrink main content width when side drawer or AI chat is docked open
  const sideReservePx = useMemo(() => {
    if (!isDesktop) return 0;
    let total = 0;
    if (drawerOpen) total += 400;
    if (chatOpen) total += chatWidth;
    // Cap safely so main content always keeps usable width
    if (typeof window !== 'undefined' && total > window.innerWidth - 520) {
      total = chatOpen ? chatWidth : drawerOpen ? 400 : 0;
    }
    return total;
  }, [isDesktop, drawerOpen, chatOpen, chatWidth]);

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100">
      {/* Unified Fixed Chrome measured via ResizeObserver -> --header-h (TopBar only on <=768px, TopBar + FilterBar on >768px) */}
      <div
        ref={headerChromeRef}
        style={{ zIndex: 'var(--z-header)' }}
        className="fixed inset-x-0 top-0"
      >
        <TopBar />
        {isWideDesktop && !presentationMode && (
          <div className="desktop-filter-chrome">
            <GlobalFilterBar mode="desktop" />
          </div>
        )}
      </div>

      {/* Main Content shrinks width when docked panels open and clears floating bottom-right button */}
      <main
        style={{
          paddingTop: 'calc(var(--header-h) + 12px)',
          marginRight: sideReservePx > 0 ? `${sideReservePx}px` : undefined,
        }}
        className="main-dashboard-container mx-auto max-w-[1680px] px-3 pb-24 transition-[margin,padding] duration-200 sm:px-4"
      >
        {!isWideDesktop && !presentationMode && (
          <div className="mobile-filter-flow mb-4">
            <GlobalFilterBar mode="mobile" />
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200"
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

        {/* Tab 1: Visão Geral */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <KpiStrip
              kpis={kpis}
              totalDataset={tests.length || 333}
              loading={loading}
            />

            <SharedLegendStrip />

            <div className="dashboard-chart-grid">
              <div className="dashboard-span-full">
                <IgnitionMapChart
                  tests={filteredTests}
                  loading={loading}
                  tall={true}
                  sharedLegendActive={true}
                />
              </div>
              <div className="dashboard-span-half">
                <FlowVsTempChart
                  tests={filteredTests}
                  loading={loading}
                  sharedLegendActive={true}
                />
              </div>
              <div className="dashboard-span-half">
                <OutcomesBarChart
                  tests={filteredTests}
                  loading={loading}
                  sharedLegendActive={true}
                />
              </div>
              <div className="dashboard-span-half">
                <BurnTimeHistogram tests={filteredTests} loading={loading} />
              </div>
              <div className="dashboard-span-half">
                <NormalVsInverseChart
                  tests={filteredTests}
                  loading={loading}
                  sharedLegendActive={true}
                />
              </div>
            </div>

            {/* Quick links to 3D & Full Table */}
            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-800/80 bg-[#121A30] px-3.5 py-2.5 text-xs">
              <span className="min-w-0 wrap-anywhere text-[#B4C3D8]">
                {tStr.appSubtitle}
              </span>
              <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('ignition')}
                  className="inline-flex min-h-[32px] max-w-full items-center gap-1.5 rounded-md border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-left font-medium text-cyan-200 hover:bg-cyan-500/20"
                >
                  <Box className="h-3.5 w-3.5 shrink-0" />
                  <span className="wrap-anywhere">{tStr.tabs.ignition} (3D)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cool_flames')}
                  className="inline-flex min-h-[32px] max-w-full items-center gap-1.5 rounded-md border border-purple-500/35 bg-purple-500/10 px-2.5 py-1 text-left font-medium text-purple-200 hover:bg-purple-500/20"
                >
                  <Flame className="h-3.5 w-3.5 shrink-0" />
                  <span className="wrap-anywhere">{tStr.tabs.cool_flames} (3D)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  className="inline-flex min-h-[32px] max-w-full items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-left font-medium text-slate-200 hover:border-cyan-500/40"
                >
                  <Table2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="wrap-anywhere">{tStr.tabs.explore}</span>
                </button>
              </div>
            </div>

            <InsightsSection tests={filteredTests} />
          </div>
        )}

        {/* Tab 2: Mapa de Ignição + 3D */}
        {activeTab === 'ignition' && (
          <div className="space-y-4">
            <KpiStrip
              kpis={kpis}
              totalDataset={tests.length || 333}
              loading={loading}
            />
            <SharedLegendStrip />
            <div className="dashboard-chart-grid">
              <div className="dashboard-span-full">
                <IgnitionMapChart
                  tests={filteredTests}
                  loading={loading}
                  tall={true}
                  sharedLegendActive={true}
                />
              </div>
              <div className="dashboard-span-full">
                <ParameterSpace3D tests={filteredTests} loading={loading} />
              </div>
              <div className="dashboard-span-half">
                <LunarTop10Card tests={filteredTests} loading={loading} />
              </div>
              <div className="dashboard-span-half">
                <FlowVsTempChart
                  tests={filteredTests}
                  loading={loading}
                  tall={true}
                  sharedLegendActive={true}
                />
              </div>
            </div>
            <InsightsSection tests={filteredTests} />
          </div>
        )}

        {/* Tab 3: Chamas Frias + Simulador 3D */}
        {activeTab === 'cool_flames' && (
          <div className="space-y-4">
            <div className="dashboard-chart-grid">
              <div className="dashboard-span-full">
                <ChamberSimulator3D
                  tests={filteredTests.length > 0 ? filteredTests : tests}
                  loading={loading}
                />
              </div>
              <div className="dashboard-span-full">
                <CoolFlameMatrix tests={filteredTests} loading={loading} />
              </div>
              <div className="dashboard-span-half">
                <NormalVsInverseChart tests={filteredTests} loading={loading} />
              </div>
              <div className="dashboard-span-half">
                <OutcomesBarChart tests={filteredTests} loading={loading} />
              </div>
            </div>
            <InsightsSection tests={filteredTests} />
          </div>
        )}

        {/* Tab 4: Explorar Ensaios */}
        {activeTab === 'explore' && (
          <div className="space-y-4">
            <div className="dashboard-chart-grid">
              <div className="dashboard-span-full">
                <ExploreTestsTable tests={filteredTests} loading={loading} />
              </div>
              <div className="dashboard-span-half">
                <CampaignTimelineChart tests={filteredTests} loading={loading} />
              </div>
              <div className="dashboard-span-half">
                <BurnTimeHistogram tests={filteredTests} loading={loading} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Sobre os Dados */}
        {activeTab === 'about' && <AboutDataView />}
      </main>

      <TestDetailDrawer />
      <HelpModal />
      <SuperintelligencePanel
        panelWidth={chatWidth}
        onWidthChange={setChatWidth}
      />
    </div>
  );
}
