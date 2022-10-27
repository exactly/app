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

const AuditorContext = createContext(defaultValues);

export const AuditorProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const { network } = useWeb3Context();

  const { Auditor } = getABI(network?.name);

  return <AuditorContext.Provider value={Auditor}>{children}</AuditorContext.Provider>;
};

export default AuditorContext;
