import { createContext } from 'react';
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

export const AccountDataProvider = AccountDataContext.Provider;

export default AccountDataContext;
