import { useEffect, useState } from 'react';
import {
  CHART_FONT_SCALE_FACTORS,
  usePsiStore,
} from '../store/usePsiStore';
import type { ChartFontScaleLevel } from '../types/psi159';

export interface ChartTypography {
  isLargeScreen: boolean;
  isMobileViewport: boolean;
  presentationMode: boolean;
  scaleLevel: ChartFontScaleLevel;
  scaleFactor: number;
  axisFontSize: number;
  axisTitleSize: number;
  legendFontSize: number;
  zoneFontSize: number;
  tooltipFontSize: number;
  barValueFontSize: number;
  tickColor: string;
  secondaryTextColor: string;
}

let measureCanvasCtx: CanvasRenderingContext2D | null = null;

export function measureTextWidth(
  text: string,
  fontSize: number,
  fontWeight: string | number = '400',
  fontFamily: 'sans' | 'mono' = 'sans'
): number {
  if (!text) return 0;
  if (typeof document !== 'undefined') {
    if (!measureCanvasCtx) {
      const canvas = document.createElement('canvas');
      measureCanvasCtx = canvas.getContext('2d');
    }
    if (measureCanvasCtx) {
      const family =
        fontFamily === 'mono'
          ? '"IBM Plex Mono", ui-monospace, monospace'
          : '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      measureCanvasCtx.font = `${fontWeight} ${fontSize}px ${family}`;
      return Math.ceil(measureCanvasCtx.measureText(text).width);
    }
  }
  const charRatio = fontFamily === 'mono' ? 0.62 : 0.56;
  return Math.ceil(text.length * fontSize * charRatio);
}

export function resolveEffectiveChartScale(
  savedLevel: ChartFontScaleLevel,
  presentationMode: boolean,
  viewportW: number
): ChartFontScaleLevel {
  const desired: ChartFontScaleLevel = presentationMode ? 'xlarge' : savedLevel;
  if (viewportW < 768) {
    return desired === 'xlarge' ? 'large' : desired;
  }
  return desired;
}

export function useChartTypography(): ChartTypography {
  const presentationMode = usePsiStore((s) => s.presentationMode);
  const savedLevel = usePsiStore((s) => s.chartFontScale);

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

  const isMobileViewport = viewportW < 768;
  const isLargeScreen = viewportW >= 1024;
  const scaleLevel = resolveEffectiveChartScale(
    savedLevel,
    presentationMode,
    viewportW
  );
  const scaleFactor = CHART_FONT_SCALE_FACTORS[scaleLevel];

  const round1 = (v: number) => Math.round(v * 10) / 10;

  return {
    isLargeScreen,
    isMobileViewport,
    presentationMode,
    scaleLevel,
    scaleFactor,
    axisFontSize: round1(13 * scaleFactor),
    axisTitleSize: round1(14 * scaleFactor),
    legendFontSize: round1(14 * scaleFactor),
    zoneFontSize: round1(13 * scaleFactor),
    tooltipFontSize: round1(14 * scaleFactor),
    barValueFontSize: round1(13 * scaleFactor),
    // >= 4.5:1 WCAG AA contrast against #121A30 and #0B1020
    tickColor: '#B8C7DC',
    secondaryTextColor: '#B4C3D8',
  };
}
