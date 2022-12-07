import React, { type PropsWithChildren, createContext, useContext } from 'react';
import { useWeb3 } from 'hooks/useWeb3';
import { Web3ProviderState, web3InitialState } from 'reducers/web3';

const Web3Context = createContext<Web3ProviderState>(web3InitialState);

export const Web3ContextProvider = ({ children }: PropsWithChildren) => {
  const web3ProviderState = useWeb3();

  return <Web3Context.Provider value={web3ProviderState}>{children}</Web3Context.Provider>;
};

export function useWeb3Context() {
  return useContext(Web3Context);
}
