import { useCallback, useMemo } from 'react';
import { AlchemyProvider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';

import { useWeb3 } from './useWeb3';

export default function useEstimateGas() {
  const { chain } = useWeb3();
  const provider = useMemo(() => new AlchemyProvider(chain.id, process.env.NEXT_PUBLIC_ALCHEMY_API_KEY), [chain.id]);

  return useCallback(
    async (tx: PopulatedTransaction) => {
      if (!provider) return;

      const gasPrice = (await provider.getFeeData()).maxFeePerGas;
      return gasPrice?.mul(await provider.estimateGas(tx));
    },
    [provider],
  );
}
