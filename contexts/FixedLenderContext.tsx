import type { FC, ReactNode } from 'react';
import type { ContractInterface } from '@ethersproject/contracts';
import { createContext } from 'react';

import { useWeb3Context } from './Web3Context';

import getABI from 'config/abiImporter';

type ContextValues = {
  address: string | undefined;
  abi: ContractInterface | undefined;
  args?: any;
};

const defaultValues: ContextValues[] = [];

const FixedLenderContext = createContext(defaultValues);

export const FixedLenderProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const { network } = useWeb3Context();

  const { FixedLenders } = getABI(network?.name);

  return <FixedLenderContext.Provider value={FixedLenders}>{children}</FixedLenderContext.Provider>;
};

export default FixedLenderContext;
