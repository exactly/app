import type { ContractInterface } from '@ethersproject/contracts';
import { createContext } from 'react';

type ContextValues = {
  address: string | undefined;
  abi: ContractInterface | undefined;
};

const defaultValues: ContextValues = {
  address: undefined,
  abi: undefined,
};

const UtilsContext = createContext(defaultValues);

export const UtilsProvider = UtilsContext.Provider;

export default UtilsContext;
