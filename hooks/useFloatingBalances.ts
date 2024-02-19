import { useMemo } from 'react';
import useAccountData from './useAccountData';
import { WEI_PER_ETHER } from 'utils/const';

export function useFloatingBalances(symbol: string) {
  const { marketAccount } = useAccountData(symbol);

  const { floatingDeposits, floatingBorrows, backupBorrows } = useMemo(() => {
    if (!marketAccount) return {};

    const {
      totalFloatingDepositAssets: totalDeposited,
      totalFloatingBorrowAssets: totalBorrowed,
      floatingBackupBorrowed: totalBackupBorrowed,
      usdPrice: exchangeRate,
    } = marketAccount;

    const totalFloatingDepositUSD = (totalDeposited * exchangeRate) / WEI_PER_ETHER;
    const totalFloatingBorrowUSD = (totalBorrowed * exchangeRate) / WEI_PER_ETHER;
    const totalBackupBorrowUSD = (totalBackupBorrowed * exchangeRate) / WEI_PER_ETHER;

    return {
      floatingDeposits: totalFloatingDepositUSD,
      floatingBorrows: totalFloatingBorrowUSD,
      backupBorrows: totalBackupBorrowUSD,
    };
  }, [marketAccount]);

  return { floatingDeposits, floatingBorrows, backupBorrows };
}
