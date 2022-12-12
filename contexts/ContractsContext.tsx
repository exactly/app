import type { FC, ReactNode } from 'react';
import type { ContractInterface } from '@ethersproject/contracts';
import React, { createContext, useState } from 'react';
import { InfuraProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

import { ContractName } from 'types/ContractNames';

import { useWeb3Context } from './Web3Context';

type ContextValues = {
  getInstance: (address: string, abi: ContractInterface, contractName: ContractName) => any;
};

const defaultValues: ContextValues = {
  getInstance: () => {
    return undefined;
  },
};

const ContractsContext = createContext(defaultValues);

export const ContractsProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const { network, web3Provider } = useWeb3Context();
  const [instances, setInstances] = useState<Record<string, Contract> | null>(null);

  function getInstance(address: string, abi: ContractInterface, contractName: ContractName) {
    if (network && instances && instances[network.name + contractName]) {
      return instances[network.name + contractName];
    }

    try {
      const publicNetwork = network || process.env.NEXT_PUBLIC_NETWORK;
      let provider;

      if (contractName === 'previewer') {
        provider = new InfuraProvider(publicNetwork);
      } else {
        provider = web3Provider?.getSigner();
      }

      const instance = provider && new Contract(address, abi, provider).connect(provider);

      if (!instance) {
        return new Error('Provider not found');
      }

      if ((network && network.name) || process.env.NEXT_PUBLIC_NETWORK) {
        const key = network?.name ?? process.env.NEXT_PUBLIC_NETWORK;

        setInstances({ ...instances, [key + contractName]: instance });
      }

      return instance;
    } catch (e) {
      console.log(e);
    }
  }

  return <ContractsContext.Provider value={{ getInstance }}>{children}</ContractsContext.Provider>;
};

export default ContractsContext;
