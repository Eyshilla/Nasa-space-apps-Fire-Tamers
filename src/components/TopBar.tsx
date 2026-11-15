import React, { useState } from 'react';
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
import type { AppLanguage, DashboardTab } from '../types/psi159';
import { useStrings } from '../utils/i18n';

const LANGS: AppLanguage[] = ['pt', 'en', 'es'];

export const TopBar: React.FC = () => {
  const activeTab = usePsiStore((s) => s.activeTab);
  const setActiveTab = usePsiStore((s) => s.setActiveTab);
  const setHelpOpen = usePsiStore((s) => s.setHelpOpen);
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const lang = usePsiStore((s) => s.lang);
  const setLang = usePsiStore((s) => s.setLang);
  const t = useStrings(lang);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: Array<{
    id: DashboardTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'overview', label: t.tabs.overview, icon: LayoutDashboard },
    { id: 'ignition', label: t.tabs.ignition, icon: MapPin },
    { id: 'cool_flames', label: t.tabs.cool_flames, icon: Flame },
    { id: 'explore', label: t.tabs.explore, icon: Table2 },
    { id: 'about', label: t.tabs.about, icon: BookOpen },
  ];

  return (
    <header className="w-full border-b border-slate-800/90 bg-[#0B1020]/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[52px] max-w-[1680px] flex-nowrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-1 sm:gap-x-3 sm:px-4">
        {/* Brand */}
        <div className="flex min-w-0 flex-1 items-center gap-2 min-[769px]:flex-initial min-[769px]:gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label={t.logoAlt}
            title={t.logoAlt}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-700/75 bg-[#131C33] px-1.5 py-1 transition-colors hover:border-cyan-400/50 hover:bg-[#192542] focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <img
              src="/assets/aistudio/IMG-20261114-WA0163.jpg-removebg-preview_43bf9c1e.png"
              alt={t.logoAlt}
              className="h-[28px] w-auto shrink-0 object-contain drop-shadow-[0_0_2px_rgba(248,250,252,0.3)] sm:h-[30px]"
            />
          </button>
          <div className="hidden min-w-0 min-[560px]:block">
            <h1
              title={t.appTitle}
              className="truncate text-base font-bold leading-tight text-slate-100 sm:text-lg"
            >
              {t.appTitle}
            </h1>
            <p
              title={t.appSubtitle}
              className="truncate text-[10px] leading-tight text-[#B4C3D8]"
            >
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Tablet/Desktop Navigation (>768px) */}
        <nav
          aria-label="Navegação principal do painel"
          className="hidden min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto py-0.5 min-[769px]:flex min-[1200px]:justify-center"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
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

        {/* Right Controls: Language switcher + Help + Mobile Hamburger */}
        <div className="flex shrink-0 items-center gap-1.5">
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
                className={`min-h-[24px] rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase transition-colors ${
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
              className="inline-flex min-h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span className="hidden sm:inline">{t.help}</span>
            </button>
          )}

          {/* Mobile Hamburger Menu Button (<=768px) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={t.menu}
            className="inline-flex min-h-[30px] items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-200 min-[769px]:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu (<=768px) */}
      {mobileMenuOpen && (
        <nav
          aria-label="Menu de abas móvel"
          className="border-t border-slate-800 bg-[#0F172A] px-3 py-2 min-[769px]:hidden"
        >
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`inline-flex min-h-[32px] items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium ${
                    active
                      ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-700/70 bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
