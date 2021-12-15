import { ethers } from "ethers";
import { createContext } from "react";
import { Dictionary } from "types/Dictionary";

type ContextValues = {
  addresses: Dictionary<string> | undefined;
  abi: ethers.ContractInterface | undefined;
};

const defaultValues: ContextValues = {
  addresses: undefined,
  abi: undefined
};

const FixedLenderContext = createContext(defaultValues);

export const FixedLenderProvider = FixedLenderContext.Provider;

export default FixedLenderContext;