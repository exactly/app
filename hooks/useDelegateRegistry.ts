import { Address, stringToHex, zeroAddress } from 'viem';
import { useReadContract, useSimulateContract } from 'wagmi';
import { delegateRegistryAbi } from 'generated/wagmi';
import { useMemo } from 'react';
import { optimism } from 'viem/chains';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

const DELEGATE_REGISTRY_ADDRESS = '0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446' as const;
const SNAPSHOT_SPACE_OPTIMISM = 'gov.exa.eth';
const SNAPSHOT_SPACE_GOERLI = 'exa.eth';

export const useDelegation = () => {
  const { account: walletAddress } = useReadOnly();
  const space = useMemo(() => (defaultChain.id === optimism.id ? SNAPSHOT_SPACE_OPTIMISM : SNAPSHOT_SPACE_GOERLI), []);
  const encodedSpace = useMemo(() => stringToHex(space, { size: 32 }), [space]);

  return useReadContract({
    abi: delegateRegistryAbi,
    functionName: 'delegation',
    chainId: defaultChain.id,
    address: DELEGATE_REGISTRY_ADDRESS,
    args: [walletAddress ?? zeroAddress, encodedSpace],
  });
};

export const usePrepareDelegate = (address: Address) => {
  const { account: walletAddress } = useReadOnly();
  const space = useMemo(() => (defaultChain.id === optimism.id ? SNAPSHOT_SPACE_OPTIMISM : SNAPSHOT_SPACE_GOERLI), []);
  const encodedSpace = useMemo(() => stringToHex(space, { size: 32 }), [space]);

  return useSimulateContract({
    abi: delegateRegistryAbi,
    functionName: 'setDelegate',
    chainId: defaultChain.id,
    address: DELEGATE_REGISTRY_ADDRESS,
    account: walletAddress ?? zeroAddress,
    args: [encodedSpace, address],
    query: { enabled: address !== zeroAddress && address !== walletAddress },
  });
};

export const usePrepareClearDelegate = (enabled: boolean) => {
  const { account: walletAddress } = useReadOnly();
  const space = useMemo(() => (defaultChain.id === optimism.id ? SNAPSHOT_SPACE_OPTIMISM : SNAPSHOT_SPACE_GOERLI), []);
  const encodedSpace = useMemo(() => stringToHex(space, { size: 32 }), [space]);

  return useSimulateContract({
    abi: delegateRegistryAbi,
    functionName: 'clearDelegate',
    chainId: defaultChain.id,
    address: DELEGATE_REGISTRY_ADDRESS,
    account: walletAddress ?? zeroAddress,
    args: [encodedSpace],
    query: { enabled },
  });
};
