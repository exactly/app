import { useContext, useMemo } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

export default function useAccountData(symbol: string): Partial<FixedLenderAccountData> {
  const { accountData } = useContext(AccountDataContext);
  return useMemo<Partial<FixedLenderAccountData>>(() => accountData?.[symbol] ?? {}, [symbol, accountData]);
}
