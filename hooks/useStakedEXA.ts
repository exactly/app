import { stakedExaABI, useStakedExaBalanceOf } from 'types/abi';

import useContract from './useContract';
import { zeroAddress } from 'viem';
import { useWeb3 } from './useWeb3';

export const useStakedEXA = () => {
  return useContract('stEXA', stakedExaABI);
};

export const useStakedEXABalance = () => {
  const { chain, walletAddress } = useWeb3();
  const stEXA = useStakedEXA();

  return useStakedExaBalanceOf({
    chainId: chain.id,
    address: stEXA?.address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 30_000,
  });
};
