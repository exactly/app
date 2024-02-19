import { useMemo } from 'react';
import useAccountData from './useAccountData';
import { WEI_PER_ETHER } from 'utils/const';

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

    const totalDepositedUSD = (tempTotalFixedDeposited * exchangeRate) / WEI_PER_ETHER;
    const totalBorrowedUSD = (tempTotalFixedBorrowed * exchangeRate) / WEI_PER_ETHER;

    return { fixedDeposits: totalDepositedUSD, fixedBorrows: totalBorrowedUSD };
  }, [marketAccount]);

  return { fixedDeposits, fixedBorrows };
}
