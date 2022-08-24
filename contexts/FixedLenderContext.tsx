import { createContext, FC } from 'react';
import { ethers } from 'ethers';

import { useWeb3Context } from './Web3Context';

import getABI from 'config/abiImporter';

type ContextValues = {
  address: string | undefined;
  abi: ethers.ContractInterface | undefined;
  args?: any;
};

const defaultValues: ContextValues[] = [];

const FixedLenderContext = createContext(defaultValues);

export const FixedLenderProvider: FC = ({ children }) => {
  const { network } = useWeb3Context();

  const { FixedLenders } = getABI(network?.name);

  return <FixedLenderContext.Provider value={FixedLenders}>{children}</FixedLenderContext.Provider>;
};

export default FixedLenderContext;
