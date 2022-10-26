import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { constants } from 'ethers';

import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import { useWeb3Context } from './Web3Context';
import ContractsContext from './ContractsContext';

import getABI from 'config/abiImporter';
import useDebounce from 'hooks/useDebounce';

type ContextValues = {
  accountData: AccountData | undefined;
  getAccountData: () => void;
};

const defaultValues: ContextValues = {
  accountData: undefined,
  getAccountData: () => {}
};

const AccountDataContext = createContext(defaultValues);

export const AccountDataProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [accountData, setAccountData] = useState<AccountData | undefined>(undefined);
  const { network, walletAddress } = useWeb3Context();

  const walletAddressDebounced = useDebounce(walletAddress);

  const { getInstance } = useContext(ContractsContext);
  const { Previewer } = getABI(network?.name);

  useEffect(() => {
    getAccountData();
  }, [walletAddressDebounced, Previewer]);

  useEffect(() => {
    const interval = setInterval(() => {
      getAccountData();
    }, 600000);
    return () => clearInterval(interval);
  }, [walletAddressDebounced, Previewer]);

  async function getAccountData() {
    try {
      const previewerContract = getInstance(Previewer.address!, Previewer.abi!, 'previewer');

      const wallet = walletAddressDebounced ? walletAddressDebounced : constants.AddressZero;

      const data = await previewerContract?.exactly(wallet);

      setAccountData(
        Object.fromEntries(
          data.map((market: FixedLenderAccountData) => [market.assetSymbol.toUpperCase(), market]) // HACK remove .toUpperCase() function in all the app
        )
      );
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <AccountDataContext.Provider value={{ accountData, getAccountData }}>
      {children}
    </AccountDataContext.Provider>
  );
};

export default AccountDataContext;
