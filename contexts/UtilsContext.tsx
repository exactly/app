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

const UtilsContext = createContext(defaultValues);

export const UtilsProvider = UtilsContext.Provider;

export default UtilsContext;