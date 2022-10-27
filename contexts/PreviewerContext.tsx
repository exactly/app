import type { FC, ReactNode } from 'react';
import type { ContractInterface } from '@ethersproject/contracts';
import { createContext } from 'react';

import getABI from 'config/abiImporter';

import { useWeb3Context } from './Web3Context';

type ContextValues = {
  address: string | undefined;
  abi: ContractInterface | undefined;
};

const defaultValues: ContextValues = {
  address: undefined,
  abi: undefined,
};

const PreviewerContext = createContext(defaultValues);

export const PreviewerProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const { network } = useWeb3Context();

  const { Previewer } = getABI(network?.name);

  return <PreviewerContext.Provider value={Previewer}>{children}</PreviewerContext.Provider>;
};

export default PreviewerContext;
