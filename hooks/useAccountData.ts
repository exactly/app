import { useContext, useMemo } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import type { AccountData } from 'types/AccountData';

export default function useAccountData(symbol: string): Partial<AccountData> {
  const { accountData } = useContext(AccountDataContext);
  return useMemo<Partial<AccountData>>(() => accountData?.[symbol] ?? {}, [symbol, accountData]);
}
