import { useMemo } from 'react';

import { type WalletClient, useWalletClient } from 'wagmi';
import { Web3Provider } from '@ethersproject/providers';

export function walletClientToProvider(walletClient: WalletClient) {
  const { transport } = walletClient;
  return new Web3Provider(transport, 'any');
}

export default function useEthersProvider() {
  const { data: walletClient } = useWalletClient();
  return useMemo(() => (walletClient ? walletClientToProvider(walletClient) : undefined), [walletClient]);
}
