import { useMemo } from 'react';
import { getContract } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';

import { debtManagerAbi, debtManagerAddress, marketAbi } from 'generated/wagmi';
import { defaultChain } from 'utils/client';

const marketErrorsAbi = marketAbi.filter(({ type }) => type === 'error');
const abi = [...debtManagerAbi, ...marketErrorsAbi] as const;

export default () => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const debtManager = Object.entries(debtManagerAddress).find(([chainId]) => Number(chainId) === defaultChain.id)?.[1];

  return useMemo(() => {
    if (!debtManager || !publicClient || !walletClient) return undefined;
    return getContract({
      address: debtManager,
      abi,
      client: { public: publicClient, wallet: walletClient },
    });
  }, [debtManager, publicClient, walletClient]);
};
