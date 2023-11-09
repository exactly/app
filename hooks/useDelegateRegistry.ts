import { Address, stringToHex, zeroAddress } from 'viem';
import {
  useDelegateRegistryDelegation,
  usePrepareDelegateRegistryClearDelegate,
  usePrepareDelegateRegistrySetDelegate,
} from 'types/abi';
import { useWeb3 } from './useWeb3';
import { useMemo } from 'react';
import { optimism } from 'wagmi/chains';

const DELEGATE_REGISTRY_ADDRESS = '0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446';
const SNAPSHOT_SPACE_OPTIMISM = 'gov.exa.eth';
const SNAPSHOT_SPACE_GOERLI = 'exa.eth';

export const useDelegation = () => {
  const { chain, walletAddress } = useWeb3();
  const space = useMemo(() => (chain.id === optimism.id ? SNAPSHOT_SPACE_OPTIMISM : SNAPSHOT_SPACE_GOERLI), [chain.id]);
  const encodedSpace = useMemo(() => stringToHex(space, { size: 32 }), [space]);

  return useDelegateRegistryDelegation({
    chainId: chain.id,
    address: DELEGATE_REGISTRY_ADDRESS,
    args: [walletAddress ?? zeroAddress, encodedSpace],
  });
};

export const usePrepareDelegate = (address: Address) => {
  const { chain, walletAddress, opts } = useWeb3();
  const space = useMemo(() => (chain.id === optimism.id ? SNAPSHOT_SPACE_OPTIMISM : SNAPSHOT_SPACE_GOERLI), [chain.id]);
  const encodedSpace = useMemo(() => stringToHex(space, { size: 32 }), [space]);

  return usePrepareDelegateRegistrySetDelegate({
    ...opts,
    enabled: address !== zeroAddress && address !== walletAddress,
    chainId: chain.id,
    address: DELEGATE_REGISTRY_ADDRESS,
    account: walletAddress ?? zeroAddress,
    args: [encodedSpace, address],
  });
};

export const usePrepareClearDelegate = (enabled: boolean) => {
  const { chain, walletAddress, opts } = useWeb3();
  const space = useMemo(() => (chain.id === optimism.id ? SNAPSHOT_SPACE_OPTIMISM : SNAPSHOT_SPACE_GOERLI), [chain.id]);
  const encodedSpace = useMemo(() => stringToHex(space, { size: 32 }), [space]);

  return usePrepareDelegateRegistryClearDelegate({
    ...opts,
    enabled,
    chainId: chain.id,
    address: DELEGATE_REGISTRY_ADDRESS,
    account: walletAddress ?? zeroAddress,
    args: [encodedSpace],
  });
};
