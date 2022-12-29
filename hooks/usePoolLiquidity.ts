import { useContext } from 'react';
import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';
import { formatFixed } from '@ethersproject/bignumber';

export default (symbol: string) => {
  const { date: maturityDate } = useContext(MarketContext);
  const { accountData } = useContext(AccountDataContext);

  if (!accountData || !maturityDate) return;

  const { fixedPools, decimals } = accountData[symbol];

  const maturityData = fixedPools.find(({ maturity }) => maturity.toNumber() === maturityDate);

  if (!maturityData) return;

  return parseFloat(formatFixed(maturityData.available, decimals)) ?? undefined;
};
