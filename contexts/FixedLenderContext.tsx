import { ethers } from 'ethers';
import { createContext } from 'react';

type ContextValues = {
  address: string | undefined;
  abi: ethers.ContractInterface | undefined;
  args?: any;
};

const defaultValues: ContextValues[] = [];

const FixedLenderContext = createContext(defaultValues);

export const FixedLenderProvider = FixedLenderContext.Provider;

export default FixedLenderContext;
