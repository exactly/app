import { useState, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { Abi } from 'viem';
import { mainnet } from 'wagmi/chains';
import { getContract } from '@wagmi/core';
import { ContractType } from 'types/contracts';
import { useWeb3 } from './useWeb3';

export default function <T extends Abi>(contractName: string, abi: T) {
  const { data: walletClient } = useWalletClient();
  const { chain } = useWeb3();

  const [contract, setContract] = useState<ContractType<T> | undefined>(undefined);

  useEffect(() => {
    const loadContract = async () => {
      if (!walletClient) return;

      setContract(undefined);
      const { address } = await import(
        `@exactly/protocol/deployments/${{ [mainnet.id]: 'mainnet' }[chain.id] ?? chain.network}/${contractName}.json`,
        { assert: { type: 'json' } }
      );

      const _contract = getContract({
        chainId: chain.id,
        address,
        abi,
        walletClient,
      });

      setContract(_contract);
    };

    loadContract().catch(() => setContract(undefined));
  }, [contractName, chain, walletClient, abi]);

  return contract;
}
