import { useState, useEffect } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { Abi } from 'viem';
import { mainnet } from 'wagmi/chains';
import { getContract } from '@wagmi/core';
import { ContractType } from 'types/contracts';
import { useWeb3 } from './useWeb3';

export default function <T extends Abi>(contractName: string, abi: T) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { chain } = useWeb3();

  const [contract, setContract] = useState<ContractType<T> | undefined>(undefined);

  useEffect(() => {
    const loadContract = async () => {
      setContract(undefined);
      const { address } = await import(
        `@exactly/protocol/deployments/${{ [mainnet.id]: 'ethereum' }[chain.id] ?? chain.network}/${contractName}.json`,
        { assert: { type: 'json' } }
      );

      const _contract = getContract({
        chainId: chain.id,
        address,
        abi,
        ...(walletClient ? { walletClient } : {}),
        ...(publicClient ? { publicClient } : {}),
      });

      setContract(_contract);
    };

    loadContract().catch(() => setContract(undefined));
  }, [contractName, chain, walletClient, abi, publicClient]);

  return contract;
}
