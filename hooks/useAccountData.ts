import { useContext, useMemo } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import type { Previewer } from 'types/contracts';

export default function useAccountData(symbol: string) {
  const { accountData } = useContext(AccountDataContext);
  return useMemo<Partial<Previewer.MarketAccountStructOutput>>(
    () => accountData?.[symbol] ?? {},
    [symbol, accountData],
  );
}
