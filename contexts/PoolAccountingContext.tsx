import { ethers } from "ethers";
import { createContext } from "react";

type ContextValues = {
  address: string | undefined;
  abi: ethers.ContractInterface | undefined;
};

const defaultValues: ContextValues = {
  address: undefined,
  abi: undefined
};

const PoolAccountingContext = createContext(defaultValues);

export const PoolAccountingProvider = PoolAccountingContext.Provider;

export default PoolAccountingContext;