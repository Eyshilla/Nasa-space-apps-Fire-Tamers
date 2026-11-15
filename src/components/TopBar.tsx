import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Flame,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Menu,
  Table2,
  X,
} from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import type {
  AppLanguage,
  ChartFontScaleLevel,
  DashboardTab,
} from '../types/psi159';
import { useStrings } from '../utils/i18n';
import { resolvePublicAssetPath } from '../utils/parsePsi159';
import { resolveEffectiveChartScale } from '../utils/useChartTypography';

const LANGS: AppLanguage[] = ['pt', 'en', 'es'];

interface TopBarProps {
  headerRef?: React.Ref<HTMLElement>;
}

export const TopBar: React.FC<TopBarProps> = ({ headerRef }) => {
  const activeTab = usePsiStore((s) => s.activeTab);
  const setActiveTab = usePsiStore((s) => s.setActiveTab);
  const setHelpOpen = usePsiStore((s) => s.setHelpOpen);
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const chartFontScale = usePsiStore((s) => s.chartFontScale);
  const setChartFontScale = usePsiStore((s) => s.setChartFontScale);
  const lang = usePsiStore((s) => s.lang);
  const setLang = usePsiStore((s) => s.setLang);
  const t = useStrings(lang);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewportW, setViewportW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const sync = () => setViewportW(window.innerWidth);
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
    };
  }, []);

  const isMobile = viewportW < 768;
  const effectiveScale = resolveEffectiveChartScale(
    chartFontScale,
    presentationMode,
    viewportW
  );
  const isXLarge = effectiveScale === 'xlarge';

  const tabs: Array<{
    id: DashboardTab;
    shortcut: string;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'overview', shortcut: '1', label: t.tabs.overview, icon: LayoutDashboard },
    { id: 'ignition', shortcut: '2', label: t.tabs.ignition, icon: MapPin },
    { id: 'cool_flames', shortcut: '3', label: t.tabs.cool_flames, icon: Flame },
    { id: 'explore', shortcut: '4', label: t.tabs.explore, icon: Table2 },
    { id: 'about', shortcut: '5', label: t.tabs.about, icon: BookOpen },
  ];

  const renderFontScaleControl = (compactMobile: boolean) => {
    const items: Array<{
      level: ChartFontScaleLevel;
      btnLabel: string;
      tooltip: string;
      disabled: boolean;
    }> = [
      {
        level: 'normal',
        btnLabel: 'A-',
        tooltip: presentationMode
          ? t.textSize.presentationHint
          : t.textSize.decreaseAria,
        disabled: presentationMode && !compactMobile,
      },
      {
        level: 'large',
        btnLabel: 'A',
        tooltip: presentationMode
          ? t.textSize.presentationHint
          : t.textSize.defaultAria,
        disabled: presentationMode && !compactMobile,
      },
      {
        level: 'xlarge',
        btnLabel: 'A+',
        tooltip: compactMobile
          ? t.textSize.mobileCapHint
          : presentationMode
            ? t.textSize.presentationHint
            : t.textSize.increaseAria,
        disabled: compactMobile || (presentationMode && !compactMobile),
      },
    ];

    return (
      <div
        role="group"
        aria-label={t.textSize.groupAria}
        title={`${t.textSize.label} · ${
          effectiveScale === 'normal'
            ? t.textSize.normal
            : effectiveScale === 'large'
              ? t.textSize.large
              : t.textSize.xlarge
        }`}
        className="inline-flex items-center gap-0.5 rounded-md border border-slate-700/80 bg-[#0F172A] p-0.5"
      >
        <span
          aria-hidden="true"
          className="chrome-text-xs px-1 font-sans font-bold tracking-tight text-cyan-300"
        >
          Aa
        </span>
        {items.map((item) => {
          const active = effectiveScale === item.level;
          return (
            <button
              key={item.level}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setChartFontScale(item.level);
              }}
              aria-label={item.tooltip}
              aria-pressed={active}
              title={item.tooltip}
              className={`chrome-text-xs min-h-[1.375rem] min-w-[1.5rem] whitespace-nowrap rounded px-1.5 py-0.5 font-sans font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                active
                  ? 'bg-cyan-500/25 text-cyan-100'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {item.btnLabel}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <header
      ref={headerRef}
      style={{ zIndex: 'var(--z-header)' }}
      className="fixed inset-x-0 top-0 w-full border-b border-slate-800/90 bg-[#0B1020]/95 shadow-[0_6px_20px_-6px_rgba(2,6,23,0.85)] backdrop-blur-md"
    >
      <div
        className={`mx-auto flex max-w-[1680px] items-center justify-between gap-x-2.5 gap-y-1 px-3 py-1 sm:px-4 ${
          isXLarge ? 'flex-wrap' : 'flex-wrap min-[1280px]:flex-nowrap'
        }`}
      >
        {/* Block 1: Brand (Logo + Title + Single-line compact subtitle on desktop so header <= 56px) */}
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label={t.logoAlt}
            title={t.logoAlt}
            className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-lg border border-slate-700/75 bg-[#131C33] p-1 transition-colors hover:border-cyan-400/50 hover:bg-[#192542] focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <img
              src={resolvePublicAssetPath('assets/aistudio/IMG-20261114-WA0163.jpg-removebg-preview_43bf9c1e.png')}
              alt={t.logoAlt}
              className="h-[26px] w-auto shrink-0 object-contain drop-shadow-[0_0_2px_rgba(248,250,252,0.3)]"
            />
          </button>
          <div className="min-w-0 leading-tight">
            <h1 className="chrome-text-title truncate font-bold leading-tight text-slate-100">
              {t.appTitle}
            </h1>
            <p
              title={t.appSubtitle}
              className="chrome-text-xs max-w-[165px] truncate leading-tight text-[#B4C3D8] sm:max-w-[220px] min-[1280px]:max-w-[155px] min-[1440px]:max-w-[250px]"
            >
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Block 2: Desktop/Tablet Navigation (>768px) */}
        <nav
          aria-label="Navegação principal do painel"
          className={`no-scrollbar order-3 hidden w-full min-w-0 items-center justify-start gap-0.5 overflow-x-auto py-0.5 min-[769px]:flex min-[1440px]:gap-1 ${
            isXLarge
              ? 'min-[1440px]:order-2 min-[1440px]:w-auto min-[1440px]:flex-1 min-[1440px]:justify-center'
              : 'min-[1280px]:order-2 min-[1280px]:w-auto min-[1280px]:flex-1 min-[1280px]:justify-center'
          }`}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              activeTab === tab.id ||
              (tab.id === 'overview' && activeTab === 'analyses');
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                title={`${tab.label} (${tab.shortcut})`}
                className={`chrome-text-sm inline-flex min-h-[1.75rem] shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 min-[1440px]:px-2 ${
                  active
                    ? 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                    : 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Block 3: Right Controls */}
        <div
          className={`order-2 ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-1.5 ${
            isXLarge
              ? 'min-[1440px]:order-3 min-[1440px]:ml-0'
              : 'min-[1280px]:order-3 min-[1280px]:ml-0'
          }`}
        >
          <div className="hidden min-[769px]:flex">
            {renderFontScaleControl(false)}
          </div>

          <div
            role="group"
            aria-label="Idioma / Language"
            className="flex items-center rounded-md border border-slate-700/80 bg-[#0F172A] p-0.5"
          >
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`chrome-text-xs min-h-[1.375rem] rounded px-1.5 py-0.5 font-mono font-semibold uppercase transition-colors ${
                  lang === code
                    ? 'bg-cyan-500/20 text-cyan-200'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {!presentationMode && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label={t.help}
              className="chrome-text-sm inline-flex min-h-[1.75rem] shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span className="hidden sm:inline">{t.help}</span>
            </button>
          )}

          {/* Mobile Menu Button (<=768px) for Text Size */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={t.menu}
            className="chrome-text-sm inline-flex min-h-[1.75rem] items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 font-medium text-slate-200 min-[769px]:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Text Size & Quick Drawer (<=768px) */}
      {mobileMenuOpen && (
        <div className="space-y-2 border-t border-slate-800 bg-[#0F172A] px-3 py-2.5 min-[769px]:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="chrome-text-sm font-medium text-slate-200">
                {t.textSize.label}
              </div>
              <div className="chrome-text-xs text-slate-400">
                {t.textSize.mobileCapHint}
              </div>
            </div>
            {renderFontScaleControl(isMobile)}
          </div>
        </div>
      )}
    </header>
  );
};
