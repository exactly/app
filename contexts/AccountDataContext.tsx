import React, { createContext, FC, useState } from 'react';
import { AccountData } from 'types/AccountData';

type ContextValues = {
  accountData: AccountData | undefined;
  setAccountData: (accountData: AccountData) => void;
};

const defaultValues: ContextValues = {
  accountData: undefined,
  setAccountData: () => {}
};

const AccountDataContext = createContext(defaultValues);

const AccountDataProvider: FC = ({ children }) => {
  const [accountData, setAccountData] = useState<AccountData>();
  return (
    <AccountDataContext.Provider value={{ accountData, setAccountData }}>
      {children}
    </AccountDataContext.Provider>
  );
};

export { AccountDataContext, AccountDataProvider };
