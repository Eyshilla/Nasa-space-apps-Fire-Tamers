import { useEffect, useState } from 'react';
import { usePsiStore } from '../store/usePsiStore';

export interface ChartTypography {
  isLargeScreen: boolean;
  presentationMode: boolean;
  axisFontSize: number;
  axisTitleSize: number;
  tickColor: string;
  secondaryTextColor: string;
}

export function useChartTypography(): ChartTypography {
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const [isLargeScreen, setIsLargeScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const sync = () => setIsLargeScreen(window.innerWidth >= 1024);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const baseAxis = isLargeScreen ? 13 : 10.5;
  const baseTitle = isLargeScreen ? 13.5 : 11;
  const factor = presentationMode ? 1.15 : 1;

  return {
    isLargeScreen,
    presentationMode,
    axisFontSize: Math.round(baseAxis * factor * 10) / 10,
    axisTitleSize: Math.round(baseTitle * factor * 10) / 10,
    // >= 4.5:1 WCAG AA contrast against #121A30 and #0B1020
    tickColor: '#B8C7DC',
    secondaryTextColor: '#B4C3D8',
  };
}
