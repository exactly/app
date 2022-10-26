import type { FC, ReactNode } from 'react';
import { createContext, useState } from 'react';
import { Contract, ContractInterface, ethers } from 'ethers';

import { Dictionary } from 'types/Dictionary';
import { contractName } from 'types/ContractNames';

import { useWeb3Context } from './Web3Context';

type ContextValues = {
  getInstance: (address: string, abi: ContractInterface, contractName: contractName) => any;
};

const defaultValues: ContextValues = {
  getInstance: () => {
    return undefined;
  }
};

const ContractsContext = createContext(defaultValues);

export const ContractsProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const { network, web3Provider } = useWeb3Context();
  const [instances, setInstances] = useState<Dictionary<Contract> | null>(null);

  function getInstance(address: string, abi: ContractInterface, contractName: contractName) {
    if (network && instances && instances[network.name + contractName]) {
      return instances[network.name + contractName];
    }

    try {
      const publicNetwork = network ?? process.env.NEXT_PUBLIC_NETWORK;

      let provider;

      if (contractName == 'previewer') {
        provider = new ethers.providers.InfuraProvider(publicNetwork);
      } else {
        provider = web3Provider?.getSigner();
      }

      const instance = provider && new ethers.Contract(address, abi, provider).connect(provider);

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
