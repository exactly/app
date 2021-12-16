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

const InterestRateModelContext = createContext(defaultValues);

export const InterestRateModelProvider = InterestRateModelContext.Provider;

export default InterestRateModelContext;