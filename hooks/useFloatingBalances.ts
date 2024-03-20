import { useMemo } from 'react';
import useAccountData from './useAccountData';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

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

    const totalFloatingDepositUSD = (totalDeposited * exchangeRate) / WAD;
    const totalFloatingBorrowUSD = (totalBorrowed * exchangeRate) / WAD;
    const totalBackupBorrowUSD = (totalBackupBorrowed * exchangeRate) / WAD;

    return {
      floatingDeposits: totalFloatingDepositUSD,
      floatingBorrows: totalFloatingBorrowUSD,
      backupBorrows: totalBackupBorrowUSD,
    };
  }, [marketAccount]);

  return { floatingDeposits, floatingBorrows, backupBorrows };
}
