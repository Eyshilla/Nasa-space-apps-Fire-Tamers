import React from 'react';
import {
  BookOpen,
  Flame,
  LayoutDashboard,
  MapPin,
  Table2,
} from 'lucide-react';
import { usePsiStore } from '../store/usePsiStore';
import type { DashboardTab } from '../types/psi159';
import { useStrings } from '../utils/i18n';

export const MobileBottomNav: React.FC = () => {
  const activeTab = usePsiStore((s) => s.activeTab);
  const setActiveTab = usePsiStore((s) => s.setActiveTab);
  const lang = usePsiStore((s) => s.lang);
  const t = useStrings(lang);

  const items: Array<{
    id: DashboardTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'overview', label: t.tabs.overview, icon: LayoutDashboard },
    { id: 'ignition', label: t.nav.mobileTabMap, icon: MapPin },
    { id: 'cool_flames', label: t.tabs.cool_flames, icon: Flame },
    { id: 'explore', label: t.tabs.explore, icon: Table2 },
    { id: 'about', label: t.tabs.about, icon: BookOpen },
  ];

  return (
    <nav
      aria-label="Navegação móvel"
      style={{
        zIndex: 'var(--z-header)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="fixed inset-x-0 bottom-0 flex h-14 items-center justify-around border-t border-slate-800/95 bg-[#0B1020]/95 px-1 backdrop-blur-md md:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          activeTab === item.id ||
          (item.id === 'overview' && activeTab === 'analyses');
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors ${
              active
                ? 'text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
