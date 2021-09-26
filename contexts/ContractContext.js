import { createContext } from "react";

const ContractContext = createContext({
  exaFront: { address: "", abi: "" },
  exafin: { address: "", abi: "" },
});

export const ContractProvider = ContractContext.Provider;

export default ContractContext;
