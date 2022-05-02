import { ethers } from 'ethers';
import { createContext } from 'react';

type ContextValues = {
  address: string | undefined;
  abi: ethers.ContractInterface | undefined;
};

const defaultValues: ContextValues = {
  address: undefined,
  abi: undefined
};

const PreviewerContext = createContext(defaultValues);

export const PreviewerProvider = PreviewerContext.Provider;

export default PreviewerContext;
