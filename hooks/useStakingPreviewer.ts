import { isAddress, zeroAddress } from 'viem';
import { optimismSepolia } from 'wagmi/chains';

import { useWeb3 } from './useWeb3';
import { useStakingPreviewerAllClaimable, useStakingPreviewerStaking } from 'types/abi';
import sepoliaPreviewer from '@exactly/protocol/deployments/op-sepolia/StakingPreviewer.json' assert { type: 'json' };

export const usePreviewerStaking = (override?: number) => {
  const { chain, walletAddress } = useWeb3();

  const address = {
    [optimismSepolia.id]: sepoliaPreviewer.address,
  }[override ?? chain.id];

  if (!address || !isAddress(address)) throw new Error(`No deployment for ${chain.id}`);

  return useStakingPreviewerStaking({
    chainId: override ?? chain.id,
    address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 5_000,
  });
};

export const usePreviewerAllClaimable = (amount: bigint, override?: number) => {
  const { chain, walletAddress } = useWeb3();

  const address = {
    [optimismSepolia.id]: sepoliaPreviewer.address,
  }[override ?? chain.id];

  if (!address || !isAddress(address)) throw new Error(`No deployment for ${chain.id}`);

  return useStakingPreviewerAllClaimable({
    chainId: override ?? chain.id,
    address,
    args: [walletAddress ?? zeroAddress, amount],
    staleTime: 5_000,
  });
};
