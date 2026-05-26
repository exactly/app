import { useCallback } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useConnect, useConnectors } from 'wagmi';
import { defaultChain, isE2E } from 'utils/client';

export default function useConnectWallet() {
  const { open } = useAppKit();
  const connectors = useConnectors();
  const { mutate: connect } = useConnect();

  return useCallback(() => {
    if (isE2E) {
      const e2e = connectors.find(({ id, name }) => id === 'mock' && name === 'Mock');
      if (e2e) connect({ connector: e2e, chainId: defaultChain.id });
    } else {
      open({ view: 'Connect' });
    }
  }, [connect, connectors, open]);
}
