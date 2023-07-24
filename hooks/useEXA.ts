import { zeroAddress } from 'viem';

import { useWeb3 } from './useWeb3';
import { exaABI, useExaDelegates, useExaGetVotes, usePrepareExaDelegate } from 'types/abi';
import useContract from './useContract';

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
