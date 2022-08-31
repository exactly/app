import { createContext, FC, useContext, useEffect, useState } from 'react';

import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import { useWeb3Context } from './Web3Context';
import ContractsContext from './ContractsContext';

import { getContractData } from 'utils/contracts';

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
  const { createInstance } = useContext(ContractsContext);

  const { Previewer } = getABI(network?.name);

  // const previewerContract = getContractData(network?.name!, Previewer.address!, Previewer.abi!);
  const previewerContract = createInstance(Previewer.address!, Previewer.abi!, 'previewer');

  useEffect(() => {
    getAccountData();
  }, [walletAddress, Previewer, network]);

  useEffect(() => {
    const interval = setInterval(() => {
      getAccountData();
    }, 600000);

    return () => clearInterval(interval);
  }, [walletAddress, Previewer, network]);

  async function getAccountData() {
    try {
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
