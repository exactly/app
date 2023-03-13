import { useContext } from 'react';
import { formatFixed } from '@ethersproject/bignumber';

import { MarketContext } from 'contexts/MarketContext';
import useAccountData from './useAccountData';

export default (symbol: string) => {
  const { date: maturityDate } = useContext(MarketContext);
  const { marketAccount } = useAccountData(symbol);

  if (!marketAccount || !maturityDate) return;

  const { fixedPools, decimals } = marketAccount;

  const maturityData = fixedPools.find(({ maturity }) => maturity.toNumber() === maturityDate);

  if (!maturityData) return;

  return parseFloat(formatFixed(maturityData.available, decimals)) ?? undefined;
};
