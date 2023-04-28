import { useCallback, useMemo } from 'react';
import { AlchemyProvider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { useProvider } from 'wagmi';

import { useWeb3 } from './useWeb3';
import { isE2E } from 'utils/client';

export default function useEstimateGas() {
  const { chain } = useWeb3();
  const e2eProvider = useProvider();
  const provider = useMemo(
    () => (isE2E ? e2eProvider : new AlchemyProvider(chain.id, process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)),
    [chain.id, e2eProvider],
  );

  return useCallback(
    async (tx: PopulatedTransaction) => {
      if (!provider) return;

      const gasPrice = (await provider.getFeeData()).maxFeePerGas;
      return gasPrice?.mul(await provider.estimateGas(tx));
    },
    [provider],
  );
}
