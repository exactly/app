import { ethers } from "ethers";
import { createContext } from "react";

type ContextValues = {
  abi: ethers.ContractInterface | undefined;
};

const defaultValues: ContextValues = {
  abi: undefined
};

const PoolAccountingContext = createContext(defaultValues);

export const PoolAccountingProvider = PoolAccountingContext.Provider;

export default PoolAccountingContext;