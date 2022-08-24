import { createContext, FC } from 'react';
import { ethers } from 'ethers';

import getABI from 'config/abiImporter';

import { useWeb3Context } from './Web3Context';

type ContextValues = {
  address: string | undefined;
  abi: ethers.ContractInterface | undefined;
};

const defaultValues: ContextValues = {
  address: undefined,
  abi: undefined
};

const PreviewerContext = createContext(defaultValues);

export const PreviewerProvider: FC = ({ children }) => {
  const { network } = useWeb3Context();

  const { Previewer } = getABI(network?.name);

  return <PreviewerContext.Provider value={Previewer}>{children}</PreviewerContext.Provider>;
};

export default PreviewerContext;
