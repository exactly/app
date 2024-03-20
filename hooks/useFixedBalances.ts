import { useMemo } from 'react';
import useAccountData from './useAccountData';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

export function useFixedBalances(symbol: string) {
  const { marketAccount } = useAccountData(symbol);

  const { fixedDeposits, fixedBorrows } = useMemo(() => {
    if (!marketAccount) return {};

    const { fixedPools, usdPrice: exchangeRate } = marketAccount;

    let tempTotalFixedDeposited = 0n;
    let tempTotalFixedBorrowed = 0n;
    fixedPools.forEach(({ borrowed, supplied: deposited }) => {
      tempTotalFixedDeposited = tempTotalFixedDeposited + deposited;
      tempTotalFixedBorrowed = tempTotalFixedBorrowed + borrowed;
    });

    const totalDepositedUSD = (tempTotalFixedDeposited * exchangeRate) / WAD;
    const totalBorrowedUSD = (tempTotalFixedBorrowed * exchangeRate) / WAD;

    return { fixedDeposits: totalDepositedUSD, fixedBorrows: totalBorrowedUSD };
  }, [marketAccount]);

  return { fixedDeposits, fixedBorrows };
}
