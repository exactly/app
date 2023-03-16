import { useCallback, useMemo } from 'react';
import { analytics } from 'utils/analytics';
import { useWeb3 } from './useWeb3';
import { mainnet } from 'wagmi';

export default () => {
  const { chain } = useWeb3();

  const network = useMemo(() => {
    if (chain.id === mainnet.id) return 'mainnet';

    return chain.name;
  }, [chain.id, chain.name]);

  const track = useCallback(
    (name: string, payload?: Record<string, string | number | undefined>) => {
      analytics.track(name, { ...payload }, { network });
    },
    [network],
  );

  const page = useCallback(() => {
    analytics.page(undefined, { network });
  }, [network]);

  const identify = useCallback(
    (id: string) => {
      analytics.identify(id, undefined, { network });
    },
    [network],
  );

  return { track, page, identify };
};
