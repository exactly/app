import { useMemo } from 'react';
import { useWeb3 } from './useWeb3';
import analytics from 'utils/analytics';
import { mainnet } from '@wagmi/chains';
import { AnalyticsInstance } from 'analytics';

export default function useAnalytics() {
  const { chain } = useWeb3();
  return useMemo<AnalyticsInstance>(() => analytics[chain.id] || analytics[mainnet.id], [chain.id]);
}
