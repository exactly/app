import { createContext, FC } from 'react';
import { Contract, ContractInterface, ethers } from 'ethers';

import { Dictionary } from 'types/Dictionary';

import { useWeb3Context } from './Web3Context';

type contractName =
  | 'marketDAI'
  | 'marketUSDC'
  | 'marketETH'
  | 'marketWBTC'
  | 'underlyingDAI'
  | 'underlyingUSDC'
  | 'underlyingETH'
  | 'underlyingWBTC'
  | 'auditor'
  | 'previewer';

type ContextValues = {
  createInstance: (address: string, abi: string, contractName: contractName) => void;
};

const defaultValues: ContextValues = {
  createInstance: () => {}
};

const ContractsContext = createContext(defaultValues);

export const ContractsProvider: FC = ({ children }) => {
  const { network, web3Provider } = useWeb3Context();

  const instances: Dictionary<Dictionary<Contract>> = {};

  function createInstance(address: string, abi: ContractInterface, contractName: contractName) {
    if (network && instances[network.name] && instances[network.name][contractName]) {
      return instances[network.name][contractName];
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
        instances[key!] = {};

        instances[key!][contractName] = instance;
      }

      return instance;
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <ContractsContext.Provider value={{ createInstance }}>{children}</ContractsContext.Provider>
  );
};

export default ContractsContext;
