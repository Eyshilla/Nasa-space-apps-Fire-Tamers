import React, { useMemo } from 'react';
import { usePsiStore } from '../store/usePsiStore';
import type { OverviewCardTabId, Psi159Test } from '../types/psi159';
import { useStrings } from '../utils/i18n';
import { BurnTimeHistogram } from './charts/BurnTimeHistogram';
import { CampaignTimelineChart } from './charts/CampaignTimelineChart';
import { FlowVsTempChart } from './charts/FlowVsTempChart';
import { NormalVsInverseChart } from './charts/NormalVsInverseChart';
import { OutcomesBarChart } from './charts/OutcomesBarChart';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { ChartHostContext, type ChartCardTabOption } from './ChartHostContext';

interface TabbedChartCardProps {
  tests: Psi159Test[];
  loading?: boolean;
  fillHeight?: boolean;
  compactHeader?: boolean;
}

export const TabbedChartCard: React.FC<TabbedChartCardProps> = ({
  tests,
  loading = false,
  fillHeight = true,
  compactHeader = true,
}) => {
  const lang = usePsiStore((s) => s.lang);
  const overviewCardTab = usePsiStore((s) => s.overviewCardTab);
  const setOverviewCardTab = usePsiStore((s) => s.setOverviewCardTab);
  const tStr = useStrings(lang);

  const tabs: ChartCardTabOption[] = useMemo(
    () => [
      { id: 'outcomes', label: tStr.overviewTabs.outcomes },
      { id: 'burn', label: tStr.overviewTabs.burn },
      { id: 'radar', label: tStr.overviewTabs.radar },
      { id: 'timeline', label: tStr.overviewTabs.timeline },
      { id: 'flow', label: tStr.overviewTabs.flow },
    ],
    [tStr]
  );

  const hostValue = useMemo(
    () => ({
      tabs,
      activeTabId: overviewCardTab,
      onSelectTab: (id: string) => setOverviewCardTab(id as OverviewCardTabId),
      fillHeight,
      compactHeader,
    }),
    [tabs, overviewCardTab, setOverviewCardTab, fillHeight, compactHeader]
  );

  return (
    <ChartHostContext.Provider value={hostValue}>
      <ChartErrorBoundary variant="card" resetKey={overviewCardTab}>
        {overviewCardTab === 'outcomes' && (
          <OutcomesBarChart tests={tests} loading={loading} sharedLegendActive />
        )}
        {overviewCardTab === 'burn' && (
          <BurnTimeHistogram tests={tests} loading={loading} />
        )}
        {overviewCardTab === 'radar' && (
          <NormalVsInverseChart
            tests={tests}
            loading={loading}
            sharedLegendActive
          />
        )}
        {overviewCardTab === 'timeline' && (
          <CampaignTimelineChart tests={tests} loading={loading} />
        )}
        {overviewCardTab === 'flow' && (
          <FlowVsTempChart tests={tests} loading={loading} sharedLegendActive />
        )}
      </ChartErrorBoundary>
    </ChartHostContext.Provider>
  );
};
