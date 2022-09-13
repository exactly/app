import { createContext, FC, useContext, useEffect, useState } from 'react';

import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import { useWeb3Context } from './Web3Context';
import ContractsContext from './ContractsContext';

import getABI from 'config/abiImporter';

type ContextValues = {
  accountData: AccountData | undefined;
  getAccountData: () => void;
};

const defaultValues: ContextValues = {
  accountData: undefined,
  getAccountData: () => {}
};

const AccountDataContext = createContext(defaultValues);

export const AccountDataProvider: FC = ({ children }) => {
  const [accountData, setAccountData] = useState<AccountData | undefined>(undefined);
  const { network, walletAddress } = useWeb3Context();
  const { getInstance } = useContext(ContractsContext);

  const { Previewer } = getABI(network?.name);

  useEffect(() => {
    getAccountData();
  }, [walletAddress, Previewer]);

  useEffect(() => {
    const interval = setInterval(() => {
      getAccountData();
    }, 600000);
    return () => clearInterval(interval);
  }, [walletAddress, Previewer]);

  async function getAccountData() {
    try {
      const previewerContract = getInstance(Previewer.address!, Previewer.abi!, 'previewer');

      const data = await previewerContract?.exactly(
        walletAddress || '0x000000000000000000000000000000000000dEaD'
      );

      const newAccountData: AccountData = {};

      data.forEach((fixedLender: FixedLenderAccountData) => {
        newAccountData[fixedLender.assetSymbol] = fixedLender;
      });

      setAccountData(newAccountData);
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
