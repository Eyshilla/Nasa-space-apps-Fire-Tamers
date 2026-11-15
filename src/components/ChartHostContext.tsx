import React, { createContext, useContext } from 'react';

export interface ChartCardTabOption {
  id: string;
  label: string;
}

export interface ChartHostContextValue {
  tabs: ChartCardTabOption[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  fillHeight?: boolean;
  compactHeader?: boolean;
}

export const ChartHostContext = createContext<ChartHostContextValue | null>(
  null
);

export function useChartHost(): ChartHostContextValue | null {
  return useContext(ChartHostContext);
}

export const ChartExpandStatusContext = createContext<boolean>(false);

export function useIsChartExpanded(): boolean {
  return useContext(ChartExpandStatusContext);
}
