import { useWeb3 } from './useWeb3';
import { zeroAddress } from 'viem';

import { exaGaugeABI, useExaGaugeBalanceOf, useExaGaugeRewardRate, useExaGaugeEarned } from 'types/abi';
import useContract from './useContract';

export const useEXAGauge = () => {
  return useContract('EXAGauge', exaGaugeABI);
};

export const useEXAGaugeBalanceOf = (args?: { watch?: boolean }) => {
  const { chain, walletAddress } = useWeb3();
  const exaGauge = useEXAGauge();

  return useExaGaugeBalanceOf({
    ...args,
    chainId: chain.id,
    address: exaGauge?.address,
    args: [walletAddress ?? zeroAddress],
  });
};

export const useEXAGaugeRewardRate = (args?: { watch?: boolean; staleTime?: number }) => {
  const { chain } = useWeb3();
  const exaGauge = useEXAGauge();

  return useExaGaugeRewardRate({
    ...args,
    chainId: chain.id,
    address: exaGauge?.address,
  });
};

export const useEXAGaugeEarned = (args?: { watch?: boolean }) => {
  const { chain, walletAddress } = useWeb3();
  const exaGauge = useEXAGauge();

  return useExaGaugeEarned({
    ...args,
    chainId: chain.id,
    address: exaGauge?.address,
    args: [walletAddress ?? zeroAddress],
  });
};
