import { useCallback, useMemo } from 'react';
import { usePublicClient } from 'wagmi';
import { useWeb3 } from './useWeb3';
import { isE2E } from 'utils/client';
import { getAlchemyProvider } from 'utils/providers';
import { EstimateGasParameters } from 'viem';

export default function useEstimateGas() {
  const { chain } = useWeb3();
  const e2ePublicClient = usePublicClient();
  const publicClient = useMemo(() => (isE2E ? e2ePublicClient : getAlchemyProvider(chain)), [chain, e2ePublicClient]);

  return useCallback(
    async (request: EstimateGasParameters) => {
      if (!publicClient) return;

      const gasPrice = await publicClient.getGasPrice();
      return gasPrice * (await publicClient.estimateGas(request));
    },
    [publicClient],
  );
}
