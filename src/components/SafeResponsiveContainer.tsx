import React, { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

interface SafeResponsiveContainerProps {
  minHeight?: number;
  fallbackWidth?: number;
  onMeasureWidth?: (width: number) => void;
  className?: string;
  children: React.ReactElement;
}

/**
 * Wraps Recharts ResponsiveContainer with guaranteed real dimensions before measurement
 * (explicit minHeight + initialDimension) and automatic requestAnimationFrame retries
 * whenever ResizeObserver reports 0x0 on initial mount.
 */
export const SafeResponsiveContainer: React.FC<SafeResponsiveContainerProps> = ({
  minHeight = 240,
  fallbackWidth = 420,
  onMeasureWidth,
  className = '',
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const onMeasureWidthRef = useRef(onMeasureWidth);
  onMeasureWidthRef.current = onMeasureWidth;

  const [size, setSize] = useState<{ w: number; h: number }>({
    w: fallbackWidth,
    h: minHeight,
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let rafId: number | null = null;
    let attempts = 0;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      if (w <= 0 || h <= 0) {
        if (attempts < 12) {
          attempts += 1;
          rafId = requestAnimationFrame(measure);
        }
        return;
      }

      attempts = 0;
      onMeasureWidthRef.current?.(w);
      setSize((prev) =>
        prev.w === w && prev.h === h
          ? prev
          : { w, h: Math.max(minHeight, h) }
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [minHeight]);

  return (
    <div
      ref={wrapperRef}
      style={{ minHeight: `${minHeight}px` }}
      className={`relative h-full min-h-0 flex-1 w-full ${className}`}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minHeight={minHeight}
        initialDimension={{ width: size.w, height: size.h }}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
};
