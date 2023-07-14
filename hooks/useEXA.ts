import { useMemo } from 'react';
import { zeroAddress } from 'viem';

import { useWeb3 } from './useWeb3';
import {
  exaABI,
  useExaDelegates,
  useExaGetVotes,
  usePrepareExaDelegate,
  useExaBalanceOf,
  useExaNonces,
} from 'types/abi';
import useContract from './useContract';
import useAccountData from './useAccountData';
import usePrices from './usePrices';
import { NATIVE_TOKEN_ADDRESS } from 'types/Bridge';
import { WAD } from 'utils/queryRates';

export const useEXA = () => {
  return useContract('EXA', exaABI);
};

export const useEXAGetVotes = (args?: { watch?: boolean }) => {
  const { chain, walletAddress } = useWeb3();
  const exa = useEXA();

  return useExaGetVotes({
    ...args,
    chainId: chain.id,
    address: exa?.address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 30_000,
  });
};

export const useEXABalance = (args?: { watch?: boolean }) => {
  const { chain, walletAddress } = useWeb3();
  const exa = useEXA();

  return useExaBalanceOf({
    ...args,
    chainId: chain.id,
    address: exa?.address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 30_000,
  });
};

export const useEXADelegates = (args?: { watch?: boolean }) => {
  const { chain, walletAddress } = useWeb3();
  const exa = useEXA();

  return useExaDelegates({
    ...args,
    chainId: chain.id,
    address: exa?.address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 30_000,
  });
};

export const useEXANonces = (args?: { watch?: boolean }) => {
  const { chain, walletAddress } = useWeb3();
  const exa = useEXA();

  return useExaNonces({
    ...args,
    chainId: chain.id,
    address: exa?.address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 30_000,
  });
};

export const useEXAPrepareDelegate = (args?: Parameters<typeof usePrepareExaDelegate>[0]) => {
  const { chain, walletAddress } = useWeb3();
  const exa = useEXA();

  return usePrepareExaDelegate({
    ...args,
    account: walletAddress ?? zeroAddress,
    chainId: chain.id,
    address: exa?.address,
  });
};

export const useEXAPrice = () => {
  const { accountData } = useAccountData();

  return useMemo(() => {
    if (!accountData) return;

    return accountData.flatMap((marketAccount) => {
      const x = marketAccount.rewardRates.find((reward) => reward.assetSymbol === 'EXA');
      return x ? [x.usdPrice] : [];
    })[0];
  }, [accountData]);
};

export const useEXAETHPrice = () => {
  const prices = usePrices();
  const ETHPrice = prices[NATIVE_TOKEN_ADDRESS];
  const EXAPrice = useEXAPrice();
  return useMemo(() => (EXAPrice ? (EXAPrice * WAD) / ETHPrice : undefined), [ETHPrice, EXAPrice]);
};
