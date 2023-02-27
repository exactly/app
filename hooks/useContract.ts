import { useState, useEffect } from 'react';
import { useSigner } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { Contract, ContractInterface } from '@ethersproject/contracts';
import { captureException } from '@sentry/nextjs';

import { useWeb3 } from './useWeb3';

export default function <T>(contractName: string, abi: ContractInterface): T | undefined {
  const { data: signer } = useSigner();
  const { chain } = useWeb3();

  const [contract, setContract] = useState<T | undefined>(undefined);

  useEffect(() => {
    const loadContract = async () => {
      if (!chain || !signer) return;

      const { address } = await import(
        `@exactly-protocol/protocol/deployments/${
          { [mainnet.id]: 'mainnet' }[chain.id] ?? chain.network
        }/${contractName}.json`,
        { assert: { type: 'json' } }
      );

      setContract(new Contract(address, abi, signer) as T);
    };

    loadContract().catch(captureException);
  }, [contractName, chain, signer, abi]);

  return contract;
}
