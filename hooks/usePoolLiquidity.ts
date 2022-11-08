import { useContext } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import { formatFixed } from '@ethersproject/bignumber';

export default (symbol: string) => {
  const { date } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);

  if (!accountData || !date) return;

  const { fixedPools, decimals } = accountData[symbol];
  const { value: maturityDate } = date;

  const maturityData = fixedPools.find(({ maturity }) => maturity.toString() === maturityDate);

  if (!maturityData) return;

  return parseFloat(formatFixed(maturityData.available, decimals)) ?? undefined;
};
